// Render worker — pulls render_jobs across all tenants, renders 9:16 vertical
// clips with burned-in captions via ffmpeg, uploads to Supabase Storage.
//
// Single shared service. Tenant scoping is enforced at the storage path
// level (raw-uploads/{tenant_id}/..., rendered-clips/{tenant_id}/...) and
// the DB row's tenant_id is preserved on every write.
//
// Loop:
//   1. nextRenderJob() — atomically claims a queued job (sets state='running')
//   2. fetch source from raw-uploads/{tenant_id}/<file>
//   3. ffmpeg: cut [start..end] + crop 9:16 + burn captions from word_timestamps
//   4. upload result to rendered-clips/{tenant_id}/{clip_id}.mp4
//   5. setClipVideoUrl + markRenderDone (or markRenderFailed)

import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  nextRenderJob, markRenderDone, markRenderFailed,
  setClipVideoUrl, setEpisodeProcessingState,
  createServerClient,
} from "@naples/db";
import { downloadToBuffer, uploadBuffer, RAW_UPLOADS_BUCKET, RENDERED_CLIPS_BUCKET } from "@naples/storage";

const POLL_INTERVAL_MS = 5_000;
const FFMPEG = process.env.FFMPEG_PATH ?? "ffmpeg";

console.log("[render-worker] starting…");

async function loop() {
  while (true) {
    try {
      const job = await nextRenderJob();
      if (!job) {
        await sleep(POLL_INTERVAL_MS);
        continue;
      }
      console.log(`[render-worker] claimed job ${job.id} for tenant ${job.tenant_id}, clip ${job.clip_id}`);
      await processJob(job);
    } catch (e) {
      console.error("[render-worker] loop error:", e);
      await sleep(POLL_INTERVAL_MS);
    }
  }
}

type Job = Awaited<ReturnType<typeof nextRenderJob>>;

async function processJob(job: NonNullable<Job>) {
  const sb = createServerClient();
  // Fetch the clip + episode (we have tenant_id from the job, so scope queries directly)
  const { data: clip } = await sb.from("clips").select("*")
    .eq("id", job.clip_id).eq("tenant_id", job.tenant_id).single();
  if (!clip) {
    await markRenderFailed(job.id, "Clip not found");
    return;
  }
  const { data: episode } = await sb.from("episodes").select("*")
    .eq("id", job.episode_id).eq("tenant_id", job.tenant_id).single();
  if (!episode || !episode.raw_video_url) {
    await markRenderFailed(job.id, "Episode has no raw video");
    return;
  }

  const start = Number(clip.start_seconds ?? 0);
  const end = Number(clip.end_seconds ?? start + 60);
  const duration = end - start;
  if (duration <= 0 || duration > 180) {
    await markRenderFailed(job.id, `Invalid clip duration: ${duration}s`);
    return;
  }

  const workDir = join(tmpdir(), `render-${job.id}`);
  await mkdir(workDir, { recursive: true });
  const sourcePath = join(workDir, "source.mp4");
  const outputPath = join(workDir, "out.mp4");

  try {
    // 1. Download source
    console.log(`[render-worker] downloading ${episode.raw_video_url}…`);
    const buf = await downloadToBuffer({
      tenantId: job.tenant_id,
      bucket: RAW_UPLOADS_BUCKET,
      path: episode.raw_video_url,
    });
    if (!buf) throw new Error("Download failed");
    await writeFile(sourcePath, buf);

    // 2. ffmpeg: cut + crop to 9:16 + burn captions
    const captionsFilter = buildCaptionFilter(clip.word_timestamps as unknown, start);
    const vf = [
      // crop center to 9:16: width = h * 9/16
      "crop='min(iw,ih*9/16)':'min(ih,iw*16/9)'",
      "scale=1080:1920",
      ...(captionsFilter ? [captionsFilter] : []),
    ].join(",");

    const log: string[] = [];
    await runFfmpeg([
      "-ss", String(start),
      "-t", String(duration),
      "-i", sourcePath,
      "-vf", vf,
      "-c:v", "libx264",
      "-preset", "fast",
      "-crf", "23",
      "-c:a", "aac",
      "-b:a", "128k",
      "-movflags", "+faststart",
      "-y", outputPath,
    ], log);

    // 3. Upload result
    const outBuf = await import("node:fs").then(fs => fs.promises.readFile(outputPath));
    const uploaded = await uploadBuffer({
      tenantId: job.tenant_id,
      bucket: RENDERED_CLIPS_BUCKET,
      filename: `${clip.id}.mp4`,
      body: outBuf,
      contentType: "video/mp4",
    });
    if (!uploaded) throw new Error("Upload failed");

    // 4. Update clip + mark done
    await setClipVideoUrl(job.tenant_id, clip.id, uploaded.path);
    await markRenderDone(job.id, log.join("\n").slice(-2000));

    // If all clips for the episode are done, mark episode ready
    const { data: pendingJobs } = await sb.from("render_jobs").select("id")
      .eq("tenant_id", job.tenant_id).eq("episode_id", job.episode_id)
      .in("state", ["queued", "running"]);
    if (!pendingJobs || pendingJobs.length === 0) {
      await setEpisodeProcessingState(job.tenant_id, job.episode_id, "ready");
    }

    console.log(`[render-worker] ✓ done job ${job.id}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[render-worker] ✗ job ${job.id} failed:`, msg);
    await markRenderFailed(job.id, msg);
    await setEpisodeProcessingState(job.tenant_id, job.episode_id, "failed");
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}

function buildCaptionFilter(words: unknown, clipStartSec: number): string | null {
  if (!Array.isArray(words) || words.length === 0) return null;
  // For v1 we use a simple drawtext filter showing 3-word groups, advancing with time.
  // Full subtitle styling would use Remotion or libass — that's a follow-up.
  const groups: Array<{ start: number; end: number; text: string }> = [];
  let buf: typeof words = [];
  for (const w of words as Array<{ text: string; start: number; end: number }>) {
    const wStart = w.start / 1000;
    const wEnd = w.end / 1000;
    if (wStart < clipStartSec || wEnd > clipStartSec + 180) continue;
    buf.push(w);
    if (buf.length >= 3) {
      groups.push({
        start: (buf[0] as { start: number }).start / 1000 - clipStartSec,
        end: (buf[buf.length - 1] as { end: number }).end / 1000 - clipStartSec,
        text: (buf as Array<{ text: string }>).map(b => b.text).join(" ").replace(/'/g, "\\'").replace(/:/g, "\\:"),
      });
      buf = [];
    }
  }
  if (groups.length === 0) return null;
  // Each group → drawtext with enable='between(t,start,end)'
  const filters = groups.map(g =>
    `drawtext=text='${g.text}':fontcolor=white:fontsize=64:bordercolor=black:borderw=4:x=(w-text_w)/2:y=h-200:enable='between(t,${g.start.toFixed(2)},${g.end.toFixed(2)})'`
  );
  return filters.join(",");
}

function runFfmpeg(args: string[], log: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const p = spawn(FFMPEG, args, { stdio: ["ignore", "pipe", "pipe"] });
    p.stdout.on("data", d => log.push(d.toString()));
    p.stderr.on("data", d => log.push(d.toString()));
    p.on("close", code => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited ${code}\n${log.join("").slice(-1500)}`));
    });
  });
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

loop().catch(e => {
  console.error("[render-worker] fatal:", e);
  process.exit(1);
});

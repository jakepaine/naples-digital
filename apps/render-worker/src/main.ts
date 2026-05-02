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
  const { data: tenant } = await sb.from("tenants").select("*")
    .eq("id", job.tenant_id).single();
  const brand = (tenant?.brand ?? {}) as { primary_color?: string; caption_style?: string };
  const primaryHex = (brand.primary_color ?? "#E8192C").replace("#", "");

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

    // 2. ffmpeg: cut + crop to 9:16 + karaoke captions in tenant brand color
    const captionsFilter = buildCaptionFilter(clip.word_timestamps as unknown, start, primaryHex);
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

    // 3. Generate thumbnail at clip midpoint
    const thumbPath = join(workDir, "thumb.jpg");
    const thumbLog: string[] = [];
    await runFfmpeg([
      "-ss", String(duration / 2),
      "-i", outputPath,
      "-vframes", "1",
      "-q:v", "3",
      "-y", thumbPath,
    ], thumbLog).catch((e) => {
      console.warn(`[render-worker] thumbnail failed (continuing without): ${e}`);
    });

    // 4. Upload video + thumbnail
    const fs = await import("node:fs");
    const outBuf = await fs.promises.readFile(outputPath);
    const uploaded = await uploadBuffer({
      tenantId: job.tenant_id,
      bucket: RENDERED_CLIPS_BUCKET,
      filename: `${clip.id}.mp4`,
      body: outBuf,
      contentType: "video/mp4",
    });
    if (!uploaded) throw new Error("Upload failed");

    let thumbUploaded: { path: string } | null = null;
    try {
      const thumbBuf = await fs.promises.readFile(thumbPath);
      thumbUploaded = await uploadBuffer({
        tenantId: job.tenant_id,
        bucket: RENDERED_CLIPS_BUCKET,
        filename: `${clip.id}-thumb.jpg`,
        body: thumbBuf,
        contentType: "image/jpeg",
      });
    } catch { /* thumb is optional */ }

    // 5. Update clip + mark done
    await setClipVideoUrl(job.tenant_id, clip.id, uploaded.path, thumbUploaded?.path);
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

function escapeDrawText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/:/g, "\\:").replace(/,/g, "\\,");
}

function buildCaptionFilter(words: unknown, clipStartSec: number, primaryHex: string): string | null {
  if (!Array.isArray(words) || words.length === 0) return null;
  // Karaoke style: each word displayed for its [start,end] window, with the
  // currently-spoken word highlighted in tenant brand color. We render two
  // drawtext layers per word group: a base layer (white) and an active layer
  // (brand color) shown only when that exact word is being spoken.
  type Word = { text: string; start: number; end: number };
  const inClip = (words as Word[])
    .map(w => ({ text: w.text, start: w.start / 1000 - clipStartSec, end: w.end / 1000 - clipStartSec }))
    .filter(w => w.start >= 0 && w.end <= 180 && w.text);
  if (inClip.length === 0) return null;

  // Group words into 3-word phrases for display
  const phrases: Array<{ start: number; end: number; words: Word[] }> = [];
  for (let i = 0; i < inClip.length; i += 3) {
    const slice = inClip.slice(i, i + 3);
    if (slice.length === 0) continue;
    phrases.push({
      start: slice[0].start,
      end: slice[slice.length - 1].end,
      words: slice as Word[],
    });
  }

  const filters: string[] = [];
  const Y = "h-220";
  const BASE_COLOR = "white";
  const baseStyle = `fontsize=64:fontcolor=${BASE_COLOR}:bordercolor=black:borderw=4:x=(w-text_w)/2:y=${Y}`;
  const activeStyle = `fontsize=64:fontcolor=0x${primaryHex}:bordercolor=black:borderw=4:x=(w-text_w)/2:y=${Y}`;

  for (const phrase of phrases) {
    const phraseText = escapeDrawText(phrase.words.map(w => w.text).join(" "));
    // Base phrase (white) shown for the full phrase window
    filters.push(`drawtext=text='${phraseText}':${baseStyle}:enable='between(t,${phrase.start.toFixed(2)},${phrase.end.toFixed(2)})'`);
    // Per-word brand-color overlay — exact same x/y so it replaces
    for (const w of phrase.words) {
      // To highlight the active word at the same position as it appears in the
      // phrase, we render a copy of the phrase in brand color but only enabled
      // while that word is active. (Approximation — real karaoke needs per-word x.)
      filters.push(`drawtext=text='${phraseText}':${activeStyle}:enable='between(t,${w.start.toFixed(2)},${w.end.toFixed(2)})'`);
    }
  }
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

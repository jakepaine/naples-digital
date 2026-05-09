#!/usr/bin/env -S npx tsx
/**
 * MakerSchool video → Gemini full extraction
 *
 * Source of truth = `makerschool_videos` table. Picks up rows whose status is
 * `pending` (or `failed` if --retry-failed, or all `completed` if --re-extract-all).
 *
 * For each video:
 *  1. Probe duration with yt-dlp.
 *  2. If duration > 1 hour, chunk into 50-min ffmpeg segments after download.
 *  3. Upload each chunk to Gemini Files API.
 *  4. Prompt Gemini 2.5 Flash for: transcript, summary, action_items,
 *     tools_mentioned, workflow_configs.
 *  5. Merge per-chunk results.
 *  6. Persist to Supabase: summary/workflow_configs/transcript on the video
 *     row; action_items + tool mentions to their own tables.
 *
 * Required env (from Doppler):
 *   GEMINI_API_KEY            Google AI Studio key
 *   SUPABASE_URL              Naples Digital project URL
 *   SUPABASE_SERVICE_ROLE_KEY service-role key
 *
 * Required CLIs on PATH: yt-dlp, ffmpeg
 *
 * Run via Doppler:
 *   doppler run --project naples-digital --config prd -- \
 *     pnpm --filter @naples/makerschool-study tsx process-videos.ts \
 *     [--limit N] [--retry-failed] [--re-extract-all]
 */

import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";
import { spawn } from "node:child_process";
import { mkdtemp, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

const GEMINI_MODEL = "gemini-2.5-flash";
const PROMPT = `You are analyzing a lesson video from Nick Saraev's "Maker School" course
(building an AI/automation agency).

Return strict JSON of shape:
{
  "transcript": string,           // verbatim transcript of everything spoken in the video
  "summary": string,              // 2-3 sentence neutral summary of what the lesson teaches
  "action_items": string[],       // concrete imperative tasks, in order presented
                                  //   ("Set up Instantly account", "Buy a domain")
                                  //   skip motivational filler
  "tools_mentioned": string[],    // every tool/platform/service named (Instantly,
                                  //   ClickUp, Make.com, Apify, Claude, Stripe).
                                  //   Names only, deduplicated.
  "workflow_configs": string[]    // for each Make.com scenario, n8n workflow,
                                  //   code block, or configuration screen shown,
                                  //   one sentence summary. Empty if none shown.
}

If this is a chunk of a longer video, only describe what is in THIS chunk.
No prose, no markdown fences. Just the JSON object.`;

const DELAY_BETWEEN_CALLS_MS = 3_000;
const SOFT_DURATION_LIMIT_S = 60 * 60; // chunk anything over 1 hour
const CHUNK_LENGTH_S = 50 * 60; // 50 min per chunk

// ─────────────────────────────────────────────────────────────────────────────
// Args
// ─────────────────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const limitFlag = argv.indexOf("--limit");
const limit =
  limitFlag !== -1 && argv[limitFlag + 1]
    ? parseInt(argv[limitFlag + 1]!, 10)
    : null;
const retryFailed = argv.includes("--retry-failed");
const reExtractAll = argv.includes("--re-extract-all");
const includeSkipped = argv.includes("--include-skipped");

// ─────────────────────────────────────────────────────────────────────────────
// Setup
// ─────────────────────────────────────────────────────────────────────────────

interface Extraction {
  transcript: string;
  summary: string;
  action_items: string[];
  tools_mentioned: string[];
  workflow_configs: string[];
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing env var ${name}.`);
    process.exit(1);
  }
  return v;
}

const supabase = createClient(
  requireEnv("SUPABASE_URL"),
  requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { persistSession: false } },
);

const gemini = new GoogleGenAI({ apiKey: requireEnv("GEMINI_API_KEY") });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─────────────────────────────────────────────────────────────────────────────
// External CLIs
// ─────────────────────────────────────────────────────────────────────────────

function exec(
  cmd: string,
  args: string[],
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${cmd} exited ${code}: ${stderr.slice(0, 800)}`));
    });
  });
}

async function probeDuration(url: string): Promise<number | null> {
  try {
    const { stdout } = await exec("yt-dlp", [
      "--print",
      "duration",
      "--no-warnings",
      url,
    ]);
    const dur = parseFloat(stdout.trim());
    return Number.isFinite(dur) ? Math.round(dur) : null;
  } catch {
    return null;
  }
}

async function downloadVideo(url: string, dir: string): Promise<string> {
  const out = join(dir, "video.%(ext)s");
  await exec("yt-dlp", [
    "-o",
    out,
    "-f",
    "mp4/best[ext=mp4]/best",
    "--no-warnings",
    "--no-playlist",
    url,
  ]);
  return join(dir, "video.mp4");
}

/** Split an mp4 into ~CHUNK_LENGTH_S segments. Returns paths in order. */
async function splitVideo(filePath: string, dir: string): Promise<string[]> {
  const outPattern = join(dir, "chunk_%03d.mp4");
  await exec("ffmpeg", [
    "-hide_banner",
    "-loglevel",
    "error",
    "-i",
    filePath,
    "-c",
    "copy",
    "-map",
    "0",
    "-segment_time",
    String(CHUNK_LENGTH_S),
    "-f",
    "segment",
    "-reset_timestamps",
    "1",
    outPattern,
  ]);
  const entries = await readdir(dir);
  return entries
    .filter((e) => e.startsWith("chunk_") && e.endsWith(".mp4"))
    .sort()
    .map((e) => join(dir, e));
}

// ─────────────────────────────────────────────────────────────────────────────
// Gemini upload + extract
// ─────────────────────────────────────────────────────────────────────────────

async function extractFromFile(filePath: string): Promise<{
  extraction: Extraction;
  geminiFileName: string;
}> {
  const upload = await gemini.files.upload({
    file: filePath,
    config: { mimeType: "video/mp4" },
  });

  const fileName = upload.name!;
  let state = upload.state;
  let attempts = 0;
  while (state !== "ACTIVE" && attempts < 90) {
    await sleep(2_000);
    const refreshed = await gemini.files.get({ name: fileName });
    state = refreshed.state;
    if (state === "FAILED") throw new Error("Gemini file upload FAILED");
    attempts++;
  }
  if (state !== "ACTIVE") throw new Error("Gemini file did not reach ACTIVE");

  const result = await gemini.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { fileData: { fileUri: upload.uri!, mimeType: "video/mp4" } },
          { text: PROMPT },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      temperature: 0.2,
      maxOutputTokens: 65_536,
    },
  });

  const text = result.text ?? "";
  let extraction: Extraction;
  try {
    extraction = JSON.parse(text);
  } catch {
    // Salvage attempt: if JSON was truncated, try to close it cleanly so we at
    // least keep partial transcript + earlier fields.
    const salvaged = trySalvageJson(text);
    if (salvaged) {
      extraction = salvaged;
    } else {
      throw new Error(
        `Gemini response was not valid JSON (len=${text.length}): ${text.slice(0, 400)}…${text.slice(-200)}`,
      );
    }
  }
  // Guard against missing fields
  extraction.transcript ??= "";
  extraction.summary ??= "";
  extraction.action_items ??= [];
  extraction.tools_mentioned ??= [];
  extraction.workflow_configs ??= [];
  return { extraction, geminiFileName: fileName };
}

/**
 * Best-effort recovery of truncated Gemini JSON. Most failures are mid-string
 * cutoffs in `transcript`. We try to close the open string, terminate any
 * dangling arrays/objects, and parse again. Returns null if nothing usable.
 */
function trySalvageJson(text: string): Extraction | null {
  if (!text.trim().startsWith("{")) return null;
  // Walk and close: build a stack of opens, escape-aware
  let inString = false;
  let escape = false;
  const stack: string[] = [];
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (inString) {
      if (escape) {
        escape = false;
      } else if (c === "\\") {
        escape = true;
      } else if (c === '"') {
        inString = false;
      }
    } else {
      if (c === '"') inString = true;
      else if (c === "{") stack.push("}");
      else if (c === "[") stack.push("]");
      else if (c === "}" || c === "]") stack.pop();
    }
  }
  let closed = text;
  if (inString) closed += '"';
  // Trim a trailing comma if present
  closed = closed.replace(/,\s*$/, "");
  while (stack.length) closed += stack.pop();
  try {
    const parsed = JSON.parse(closed);
    if (typeof parsed === "object" && parsed !== null) {
      return {
        transcript: typeof parsed.transcript === "string" ? parsed.transcript : "",
        summary: typeof parsed.summary === "string" ? parsed.summary : "",
        action_items: Array.isArray(parsed.action_items) ? parsed.action_items : [],
        tools_mentioned: Array.isArray(parsed.tools_mentioned) ? parsed.tools_mentioned : [],
        workflow_configs: Array.isArray(parsed.workflow_configs) ? parsed.workflow_configs : [],
      };
    }
  } catch {
    /* fall through */
  }
  return null;
}

function mergeExtractions(parts: Extraction[]): Extraction {
  const merged: Extraction = {
    transcript: parts.map((p) => p.transcript).join("\n\n"),
    summary: parts.map((p) => p.summary).join(" "),
    action_items: parts.flatMap((p) => p.action_items),
    tools_mentioned: [],
    workflow_configs: parts.flatMap((p) => p.workflow_configs),
  };
  // Dedupe tools across chunks (case-insensitive)
  const seen = new Set<string>();
  for (const part of parts) {
    for (const tool of part.tools_mentioned) {
      const key = tool.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.tools_mentioned.push(tool.trim());
    }
  }
  return merged;
}

// ─────────────────────────────────────────────────────────────────────────────
// Persist
// ─────────────────────────────────────────────────────────────────────────────

async function persist(
  videoId: string,
  primaryLessonIds: number[],
  extraction: Extraction,
  durationSeconds: number | null,
  chunkCount: number,
  geminiFileName: string,
): Promise<void> {
  const primaryLesson = primaryLessonIds[0] ?? null;

  // Update video row with everything we now extract
  const { error: vErr } = await supabase
    .from("makerschool_videos")
    .update({
      status: "completed",
      duration_seconds: durationSeconds ?? undefined,
      chunk_count: chunkCount,
      summary: extraction.summary,
      workflow_configs: extraction.workflow_configs,
      transcript: extraction.transcript,
      gemini_file_id: geminiFileName,
      processed_at: new Date().toISOString(),
      error: null,
    })
    .eq("id", videoId);
  if (vErr) throw new Error(`video update: ${vErr.message}`);

  // Wipe any prior action items for this video so re-extracts don't double up
  const { error: delErr } = await supabase
    .from("makerschool_action_items")
    .delete()
    .eq("video_id", videoId);
  if (delErr) throw new Error(`action_items delete: ${delErr.message}`);

  if (extraction.action_items.length) {
    const { error } = await supabase.from("makerschool_action_items").insert(
      extraction.action_items.map((description, ordering) => ({
        source_type: "video" as const,
        video_id: videoId,
        lesson_id: primaryLesson,
        description,
        ordering,
      })),
    );
    if (error) throw new Error(`action_items insert: ${error.message}`);
  }

  // Tools — upsert by lower(name), dedupe lesson IDs
  for (const raw of extraction.tools_mentioned) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const { data: existing } = await supabase
      .from("makerschool_tools")
      .select("id, source_lesson_ids")
      .ilike("name", trimmed)
      .maybeSingle();
    if (existing) {
      const merged = Array.from(
        new Set([...(existing.source_lesson_ids ?? []), ...primaryLessonIds]),
      );
      await supabase
        .from("makerschool_tools")
        .update({ source_lesson_ids: merged })
        .eq("id", existing.id);
    } else {
      await supabase.from("makerschool_tools").insert({
        name: trimmed,
        category: "uncategorized",
        source_lesson_ids: primaryLessonIds,
      });
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-video pipeline
// ─────────────────────────────────────────────────────────────────────────────

interface VideoRow {
  id: string;
  url: string;
  status: string;
  attempt_count: number;
}

async function fetchTargets(): Promise<VideoRow[]> {
  const statuses: string[] = [];
  if (reExtractAll) statuses.push("completed");
  statuses.push("pending");
  if (retryFailed) statuses.push("failed");
  if (includeSkipped) statuses.push("skipped");

  let q = supabase
    .from("makerschool_videos")
    .select("id, url, status, attempt_count")
    .in("status", statuses)
    .order("created_at", { ascending: true });
  if (limit) q = q.limit(limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as VideoRow[];
}

async function fetchPrimaryLessonIds(videoId: string): Promise<number[]> {
  const { data, error } = await supabase
    .from("makerschool_lesson_videos")
    .select("lesson_id")
    .eq("video_id", videoId)
    .eq("is_primary", true);
  if (error) throw error;
  return (data ?? []).map((r) => r.lesson_id as number);
}

async function processOne(
  video: VideoRow,
): Promise<"processed" | "failed" | "skipped"> {
  console.log(`[${video.url}]`);

  await supabase
    .from("makerschool_videos")
    .update({
      status: "downloading",
      attempt_count: video.attempt_count + 1,
    })
    .eq("id", video.id);

  const duration = await probeDuration(video.url);
  const tmp = await mkdtemp(join(tmpdir(), "makerschool-"));
  try {
    console.log(`  duration: ${duration ?? "?"}s; downloading…`);
    const filePath = await downloadVideo(video.url, tmp);

    let chunks: string[];
    if (duration && duration > SOFT_DURATION_LIMIT_S) {
      console.log(`  splitting into ~${CHUNK_LENGTH_S / 60}-min chunks…`);
      chunks = await splitVideo(filePath, tmp);
      console.log(`  ${chunks.length} chunks`);
    } else {
      chunks = [filePath];
    }

    await supabase
      .from("makerschool_videos")
      .update({ status: "processing", duration_seconds: duration })
      .eq("id", video.id);

    const parts: Extraction[] = [];
    let lastFileName = "";
    for (const [i, chunkPath] of chunks.entries()) {
      console.log(`  chunk ${i + 1}/${chunks.length}: extracting…`);
      const { extraction, geminiFileName } = await extractFromFile(chunkPath);
      parts.push(extraction);
      lastFileName = geminiFileName;
      if (i < chunks.length - 1) await sleep(DELAY_BETWEEN_CALLS_MS);
    }
    const merged = mergeExtractions(parts);

    const primaryLessonIds = await fetchPrimaryLessonIds(video.id);
    await persist(
      video.id,
      primaryLessonIds,
      merged,
      duration,
      chunks.length,
      lastFileName,
    );

    console.log(
      `  ok — ${merged.transcript.length} chars transcript, ` +
        `${merged.action_items.length} actions, ` +
        `${merged.tools_mentioned.length} tools, ` +
        `${merged.workflow_configs.length} configs ` +
        `(primary lessons: ${primaryLessonIds.length}, chunks: ${chunks.length})`,
    );
    return "processed";
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await supabase
      .from("makerschool_videos")
      .update({ status: "failed", error: msg.slice(0, 1_000) })
      .eq("id", video.id);
    console.error(`  fail: ${msg.slice(0, 300)}`);
    return "failed";
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const videos = await fetchTargets();
  const flagSummary = [
    limit ? `limit=${limit}` : "",
    retryFailed ? "retry-failed" : "",
    reExtractAll ? "re-extract-all" : "",
    includeSkipped ? "include-skipped" : "",
  ]
    .filter(Boolean)
    .join(", ");
  console.log(
    `targets: ${videos.length}` + (flagSummary ? ` (${flagSummary})` : ""),
  );
  if (!videos.length) {
    console.log("nothing to do.");
    return;
  }

  let processed = 0,
    failed = 0,
    skipped = 0;
  for (const [i, video] of videos.entries()) {
    console.log(`\n[${i + 1}/${videos.length}]`);
    const outcome = await processOne(video);
    if (outcome === "processed") processed++;
    else if (outcome === "failed") failed++;
    else skipped++;
    if (i < videos.length - 1) await sleep(DELAY_BETWEEN_CALLS_MS);
  }

  console.log(
    `\ndone. processed=${processed} failed=${failed} skipped=${skipped}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

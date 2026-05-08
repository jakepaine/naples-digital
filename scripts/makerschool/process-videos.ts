#!/usr/bin/env -S npx tsx
/**
 * MakerSchool video → Gemini extraction
 *
 * Source of truth = `makerschool_videos` table. Picks up rows whose status is
 * `pending` (or `failed` if --retry-failed). Downloads each via yt-dlp, uploads
 * to Gemini Files API, prompts Gemini 2.5 Flash for structured extraction, and
 * persists action items + tool mentions to Supabase.
 *
 * Lesson attribution uses `is_primary=true` rows in `makerschool_lesson_videos`
 * — the JSON's `loom_urls[]` array repeats the same set across all lessons in a
 * section, so the bridge table is thick (5,650 rows for 92 videos). The
 * `is_primary` flag identifies the canonical lesson↔video link.
 *
 * Run via Doppler:
 *   doppler run --project naples-digital --config prd -- \
 *     pnpm --filter @naples/makerschool-study tsx process-videos.ts [--limit N] [--retry-failed]
 *
 * Required env (from Doppler):
 *   GEMINI_API_KEY            Google AI Studio key for Gemini 2.5 Flash
 *   SUPABASE_URL              Naples Digital project URL
 *   SUPABASE_SERVICE_ROLE_KEY service-role key (bypasses RLS for ingestion)
 *
 * Required CLI on PATH: yt-dlp  (brew install yt-dlp)
 */

import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

const GEMINI_MODEL = "gemini-2.5-flash";
const PROMPT = `You are analyzing a lesson video from Nick Saraev's Maker School course
(building an AI/automation agency).

Extract:
1. summary — 2-3 sentence neutral summary of what the lesson teaches.
2. action_items — concrete tasks the student should do, in the order presented.
   Each item is a single sentence imperative ("Set up Instantly account",
   "Buy a domain", "Send 10 Upwork applications"). Skip purely motivational
   statements.
3. tools_mentioned — every tool, platform, or service named (e.g. Instantly,
   ClickUp, Make.com, Apify, Claude, Stripe). Names only.
4. workflow_configs — if any Make.com scenario, n8n workflow, code block, or
   configuration screen is shown on screen, summarize what each one does in
   one sentence. Empty array if none shown.

Return strict JSON of shape:
{
  "summary": string,
  "action_items": string[],
  "tools_mentioned": string[],
  "workflow_configs": string[]
}

No extra prose, no markdown fences. Just the JSON object.`;

const DELAY_BETWEEN_CALLS_MS = 3_000;
const MAX_DURATION_SECONDS = 60 * 60; // Gemini 2.5 Flash ~1hr cap

// ─────────────────────────────────────────────────────────────────────────────
// CLI args
// ─────────────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const limitFlag = args.indexOf("--limit");
const limit =
  limitFlag !== -1 && args[limitFlag + 1]
    ? parseInt(args[limitFlag + 1]!, 10)
    : null;
const retryFailed = args.includes("--retry-failed");

// ─────────────────────────────────────────────────────────────────────────────
// Setup
// ─────────────────────────────────────────────────────────────────────────────

interface Extraction {
  summary: string;
  action_items: string[];
  tools_mentioned: string[];
  workflow_configs: string[];
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(
      `Missing env var ${name}. Run via doppler run --project naples-digital --config prd -- ...`,
    );
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
// yt-dlp
// ─────────────────────────────────────────────────────────────────────────────

function ytDlp(args: string[]): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn("yt-dlp", args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`yt-dlp exited ${code}: ${stderr}`));
    });
  });
}

async function probeDuration(url: string): Promise<number | null> {
  try {
    const { stdout } = await ytDlp([
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
  await ytDlp([
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

// ─────────────────────────────────────────────────────────────────────────────
// Gemini upload + extract
// ─────────────────────────────────────────────────────────────────────────────

async function uploadAndExtract(
  filePath: string,
): Promise<{ extraction: Extraction; geminiFileName: string }> {
  const upload = await gemini.files.upload({
    file: filePath,
    config: { mimeType: "video/mp4" },
  });

  // Wait for ACTIVE state
  let state = upload.state;
  const fileName = upload.name!;
  let attempts = 0;
  while (state !== "ACTIVE" && attempts < 60) {
    await sleep(2_000);
    const refreshed = await gemini.files.get({ name: fileName });
    state = refreshed.state;
    if (state === "FAILED") throw new Error("Gemini file upload FAILED");
    attempts++;
  }
  if (state !== "ACTIVE")
    throw new Error("Gemini file did not reach ACTIVE within 120s");

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
    },
  });

  const text = result.text ?? "";
  let extraction: Extraction;
  try {
    extraction = JSON.parse(text);
  } catch {
    throw new Error(
      `Gemini response was not valid JSON: ${text.slice(0, 400)}`,
    );
  }
  return { extraction, geminiFileName: fileName };
}

// ─────────────────────────────────────────────────────────────────────────────
// Persist
// ─────────────────────────────────────────────────────────────────────────────

async function persist(
  videoId: string,
  primaryLessonIds: number[],
  extraction: Extraction,
): Promise<void> {
  const primaryLesson = primaryLessonIds[0] ?? null;

  // Action items — one row per item; lesson_id is the first primary lesson
  // for searchability, but the canonical join is via makerschool_lesson_videos.
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

  // Tools — upsert on lower(name) by case-insensitive match.
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
// Process one video
// ─────────────────────────────────────────────────────────────────────────────

interface VideoRow {
  id: string;
  url: string;
  status: string;
  attempt_count: number;
}

async function fetchPendingVideos(): Promise<VideoRow[]> {
  const statuses = retryFailed ? ["pending", "failed"] : ["pending"];
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
): Promise<"processed" | "skipped" | "failed"> {
  console.log(`[${video.url}]`);

  await supabase
    .from("makerschool_videos")
    .update({
      status: "downloading",
      attempt_count: video.attempt_count + 1,
    })
    .eq("id", video.id);

  // Probe duration first
  const duration = await probeDuration(video.url);
  if (duration && duration > MAX_DURATION_SECONDS) {
    await supabase
      .from("makerschool_videos")
      .update({
        status: "skipped",
        duration_seconds: duration,
        error: `> ${MAX_DURATION_SECONDS}s (Gemini cap)`,
      })
      .eq("id", video.id);
    console.log(`  skipped (${duration}s > ${MAX_DURATION_SECONDS}s)`);
    return "skipped";
  }

  const tmp = await mkdtemp(join(tmpdir(), "makerschool-"));
  try {
    console.log(`  downloading…`);
    const filePath = await downloadVideo(video.url, tmp);

    await supabase
      .from("makerschool_videos")
      .update({ status: "processing", duration_seconds: duration })
      .eq("id", video.id);

    console.log(`  uploading + extracting…`);
    const { extraction, geminiFileName } = await uploadAndExtract(filePath);

    const primaryLessonIds = await fetchPrimaryLessonIds(video.id);
    await persist(video.id, primaryLessonIds, extraction);

    await supabase
      .from("makerschool_videos")
      .update({
        status: "completed",
        gemini_file_id: geminiFileName,
        processed_at: new Date().toISOString(),
        error: null,
      })
      .eq("id", video.id);

    console.log(
      `  ok — ${extraction.action_items.length} actions, ` +
        `${extraction.tools_mentioned.length} tools, ` +
        `${extraction.workflow_configs.length} configs ` +
        `(primary lessons: ${primaryLessonIds.length})`,
    );
    return "processed";
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await supabase
      .from("makerschool_videos")
      .update({ status: "failed", error: msg.slice(0, 1_000) })
      .eq("id", video.id);
    console.error(`  fail: ${msg.slice(0, 200)}`);
    return "failed";
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const videos = await fetchPendingVideos();
  console.log(
    `pending videos: ${videos.length}` +
      (limit ? ` (limited to ${limit})` : "") +
      (retryFailed ? " (including retry of failed)" : ""),
  );
  if (videos.length === 0) {
    console.log("nothing to do.");
    return;
  }

  let processed = 0,
    skipped = 0,
    failed = 0;
  for (const [i, video] of videos.entries()) {
    console.log(`\n[${i + 1}/${videos.length}]`);
    const outcome = await processOne(video);
    if (outcome === "processed") processed++;
    else if (outcome === "skipped") skipped++;
    else failed++;
    if (i < videos.length - 1) await sleep(DELAY_BETWEEN_CALLS_MS);
  }

  console.log(
    `\ndone. processed=${processed} skipped=${skipped} failed=${failed}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

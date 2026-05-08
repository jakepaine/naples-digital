#!/usr/bin/env -S npx tsx
/**
 * Backfill the foundation MakerSchool tables from makerschool_lessons.json.
 *
 * Populates:
 *   - public.makerschool_lessons       (296 rows)
 *   - public.makerschool_videos        (~92 unique loom URLs as 'pending')
 *   - public.makerschool_lesson_videos (bridge: lesson <-> video)
 *
 * Idempotent — re-runnable; nothing is overwritten if status of an existing
 * video is not 'pending' (so we don't reset processed videos).
 *
 * Run via:
 *   doppler run --project naples-digital --config prd -- \
 *     pnpm --filter @naples/makerschool-study tsx backfill-data.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const LESSONS_PATH = resolve(
  process.cwd(),
  "../../../makerschool/makerschool_lessons.json",
);

interface Lesson {
  id: number;
  section: string;
  subsection?: string;
  title: string;
  url?: string;
  loom_url?: string | null;
  loom_urls?: string[];
  written_content?: string;
  download_links?: unknown[];
  files?: unknown[];
  resources?: unknown[];
  status?: string;
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(
      `Missing env var ${name}. Run via: doppler run --project naples-digital --config prd -- ...`,
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

// ─────────────────────────────────────────────────────────────────────────────
// Parsing helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Extract Day N from subsection like "Day 5" → 5; "About & how to use" → null. */
function parseDayNumber(subsection?: string): number | null {
  if (!subsection) return null;
  const m = subsection.match(/^Day\s+(\d+)$/);
  return m ? parseInt(m[1]!, 10) : null;
}

/** Extract leading "1." from title; "1. Choose operating name" → 1. */
function parseTaskNumber(title: string): number | null {
  const m = title.match(/^(\d+)\.\s/);
  return m ? parseInt(m[1]!, 10) : null;
}

/** Combine loom_url + loom_urls into a single deduped set. */
function collectUrls(lesson: Lesson): {
  primary: string | null;
  all: string[];
} {
  const all = new Set<string>();
  if (lesson.loom_url) all.add(lesson.loom_url);
  for (const u of lesson.loom_urls ?? []) all.add(u);
  return {
    primary: lesson.loom_url ?? null,
    all: [...all],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`reading ${LESSONS_PATH}`);
  const raw = await readFile(LESSONS_PATH, "utf8");
  const lessons: Lesson[] = JSON.parse(raw);
  console.log(`loaded ${lessons.length} lessons`);

  // ── 1. Upsert lessons ──────────────────────────────────────────────────────
  const lessonRows = lessons.map((l) => ({
    id: l.id,
    section: l.section,
    subsection: l.subsection ?? null,
    title: l.title,
    url: l.url ?? null,
    loom_url: l.loom_url ?? null,
    loom_urls: l.loom_urls ?? [],
    written_content: l.written_content ?? null,
    download_links: l.download_links ?? [],
    files: l.files ?? [],
    resources: l.resources ?? [],
    status: l.status ?? "success",
    day_number: parseDayNumber(l.subsection),
    task_number: parseTaskNumber(l.title),
  }));

  // Insert in chunks of 100 — Supabase REST handles bigger but smaller chunks
  // give better error messages.
  for (let i = 0; i < lessonRows.length; i += 100) {
    const chunk = lessonRows.slice(i, i + 100);
    const { error } = await supabase
      .from("makerschool_lessons")
      .upsert(chunk, { onConflict: "id" });
    if (error) {
      console.error(`lessons chunk ${i} failed:`, error);
      process.exit(1);
    }
    console.log(`  lessons upserted ${i + chunk.length}/${lessonRows.length}`);
  }

  // ── 2. Build the unique URL set + per-lesson references ────────────────────
  const uniqueUrls = new Set<string>();
  type Ref = { lessonId: number; url: string; isPrimary: boolean };
  const refs: Ref[] = [];

  for (const lesson of lessons) {
    const { primary, all } = collectUrls(lesson);
    for (const url of all) {
      uniqueUrls.add(url);
      refs.push({ lessonId: lesson.id, url, isPrimary: url === primary });
    }
  }
  console.log(`unique loom URLs: ${uniqueUrls.size}`);
  console.log(`lesson<->video refs to insert: ${refs.length}`);

  // ── 3. Upsert videos (only inserts new rows; never resets a processed one) ─
  // Use ON CONFLICT DO NOTHING semantics by inserting with `ignoreDuplicates`.
  const videoRows = [...uniqueUrls].map((url) => ({
    url,
    status: "pending" as const,
  }));
  for (let i = 0; i < videoRows.length; i += 100) {
    const chunk = videoRows.slice(i, i + 100);
    const { error } = await supabase
      .from("makerschool_videos")
      .upsert(chunk, { onConflict: "url", ignoreDuplicates: true });
    if (error) {
      console.error(`videos chunk ${i} failed:`, error);
      process.exit(1);
    }
  }
  console.log(`  videos upserted ${videoRows.length} (no-op on duplicates)`);

  // ── 4. Resolve URL → video_id, then build bridge rows ──────────────────────
  const { data: videoIdRows, error: videoIdErr } = await supabase
    .from("makerschool_videos")
    .select("id, url")
    .in("url", [...uniqueUrls]);
  if (videoIdErr) {
    console.error("fetch video ids failed:", videoIdErr);
    process.exit(1);
  }
  const urlToId = new Map(videoIdRows.map((r) => [r.url, r.id as string]));

  const bridgeRows = refs.map((r) => ({
    lesson_id: r.lessonId,
    video_id: urlToId.get(r.url)!,
    is_primary: r.isPrimary,
  }));

  for (let i = 0; i < bridgeRows.length; i += 200) {
    const chunk = bridgeRows.slice(i, i + 200);
    const { error } = await supabase
      .from("makerschool_lesson_videos")
      .upsert(chunk, {
        onConflict: "lesson_id,video_id",
        ignoreDuplicates: true,
      });
    if (error) {
      console.error(`bridge chunk ${i} failed:`, error);
      process.exit(1);
    }
  }
  console.log(`  bridge upserted ${bridgeRows.length}`);

  // ── 5. Sanity counts ───────────────────────────────────────────────────────
  const counts = await Promise.all([
    supabase
      .from("makerschool_lessons")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("makerschool_videos")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("makerschool_lesson_videos")
      .select("*", { count: "exact", head: true }),
  ]);
  console.log("\nfinal table counts:");
  console.log(`  makerschool_lessons:        ${counts[0].count}`);
  console.log(`  makerschool_videos:         ${counts[1].count}`);
  console.log(`  makerschool_lesson_videos:  ${counts[2].count}`);
  console.log("\nbackfill complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

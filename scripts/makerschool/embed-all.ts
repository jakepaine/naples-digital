#!/usr/bin/env -S npx tsx
/**
 * Embed every chunk of the MakerSchool corpus into makerschool_embeddings.
 *
 * Sources chunked:
 *  - lessons.written_content     → 'lesson'      (one row per non-empty lesson)
 *  - videos.transcript           → 'transcript'  (chunked at ~600 words each)
 *  - videos.summary              → 'summary'     (one row per completed video)
 *  - action_items.description    → 'action_item' (one row each)
 *  - workflows display+desc+notes→ 'workflow'    (one row per workflow)
 *  - tools name+description      → 'tool'        (one row per tool)
 *
 * Idempotent: skips rows already present (matched by source_type + source_id +
 * chunk_index). Re-run with --force to wipe + redo.
 *
 * Run via Doppler:
 *   doppler run --project naples-digital --config prd -- \
 *     pnpm --filter @naples/makerschool-study tsx embed-all.ts [--force]
 */

import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";

const EMBED_MODEL = "gemini-embedding-001";
const EMBED_DIMS = 768;
const TRANSCRIPT_CHUNK_WORDS = 600; // ~ a few minutes of speech
const TRANSCRIPT_CHUNK_OVERLAP_WORDS = 80;
const BATCH = 16; // parallel embed calls

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

const force = process.argv.includes("--force");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─────────────────────────────────────────────────────────────────────────────
// Chunkers
// ─────────────────────────────────────────────────────────────────────────────

function chunkByWords(
  text: string,
  size: number,
  overlap: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= size) return [text];
  const chunks: string[] = [];
  let i = 0;
  while (i < words.length) {
    chunks.push(words.slice(i, i + size).join(" "));
    if (i + size >= words.length) break;
    i += size - overlap;
  }
  return chunks;
}

// ─────────────────────────────────────────────────────────────────────────────
// Embed one batch in parallel
// ─────────────────────────────────────────────────────────────────────────────

async function embedBatch(texts: string[]): Promise<number[][]> {
  const results = await Promise.all(
    texts.map((t) =>
      gemini.models.embedContent({
        model: EMBED_MODEL,
        contents: t,
        config: {
          taskType: "RETRIEVAL_DOCUMENT",
          outputDimensionality: EMBED_DIMS,
        },
      }),
    ),
  );
  return results.map((r) => r.embeddings![0]!.values!);
}

// ─────────────────────────────────────────────────────────────────────────────
// Source loaders
// ─────────────────────────────────────────────────────────────────────────────

interface PendingChunk {
  source_type:
    | "lesson"
    | "transcript"
    | "action_item"
    | "workflow"
    | "summary"
    | "tool";
  source_id: string;
  source_table: string;
  chunk_text: string;
  chunk_index: number;
  metadata: Record<string, unknown>;
}

async function loadLessons(): Promise<PendingChunk[]> {
  const { data, error } = await supabase
    .from("makerschool_lessons")
    .select(
      "id, section, subsection, title, day_number, task_number, written_content",
    )
    .not("written_content", "is", null);
  if (error) throw error;
  return (data ?? [])
    .filter((l) => (l.written_content ?? "").trim().length > 0)
    .map((l) => ({
      source_type: "lesson" as const,
      source_id: String(l.id),
      source_table: "makerschool_lessons",
      chunk_text:
        `[${l.section}${l.subsection ? " > " + l.subsection : ""}] ${l.title}\n\n${l.written_content}`,
      chunk_index: 0,
      metadata: {
        lesson_id: l.id,
        section: l.section,
        subsection: l.subsection,
        title: l.title,
        day_number: l.day_number,
        task_number: l.task_number,
      },
    }));
}

async function loadTranscriptChunks(): Promise<PendingChunk[]> {
  const { data, error } = await supabase
    .from("makerschool_videos")
    .select("id, url, transcript, summary, duration_seconds")
    .not("transcript", "is", null)
    .neq("transcript", "");
  if (error) throw error;
  const out: PendingChunk[] = [];
  for (const v of data ?? []) {
    const chunks = chunkByWords(
      v.transcript!,
      TRANSCRIPT_CHUNK_WORDS,
      TRANSCRIPT_CHUNK_OVERLAP_WORDS,
    );
    chunks.forEach((text, idx) => {
      out.push({
        source_type: "transcript",
        source_id: v.id as string,
        source_table: "makerschool_videos",
        chunk_text: text,
        chunk_index: idx,
        metadata: {
          video_id: v.id,
          url: v.url,
          duration_seconds: v.duration_seconds,
          chunk_total: chunks.length,
        },
      });
    });
  }
  return out;
}

async function loadSummaries(): Promise<PendingChunk[]> {
  const { data, error } = await supabase
    .from("makerschool_videos")
    .select("id, url, summary")
    .not("summary", "is", null)
    .neq("summary", "");
  if (error) throw error;
  return (data ?? []).map((v) => ({
    source_type: "summary" as const,
    source_id: v.id as string,
    source_table: "makerschool_videos",
    chunk_text: v.summary!,
    chunk_index: 0,
    metadata: { video_id: v.id, url: v.url },
  }));
}

async function loadActionItems(): Promise<PendingChunk[]> {
  const { data, error } = await supabase
    .from("makerschool_action_items")
    .select("id, video_id, lesson_id, description, ordering");
  if (error) throw error;
  return (data ?? []).map((a) => ({
    source_type: "action_item" as const,
    source_id: a.id as string,
    source_table: "makerschool_action_items",
    chunk_text: a.description as string,
    chunk_index: 0,
    metadata: {
      action_item_id: a.id,
      video_id: a.video_id,
      lesson_id: a.lesson_id,
      ordering: a.ordering,
    },
  }));
}

async function loadWorkflows(): Promise<PendingChunk[]> {
  const { data, error } = await supabase
    .from("makerschool_workflows")
    .select(
      "id, filename, platform, display_name, description, apps, complexity, naples_relevance, naples_module, fills_named_gap, port_effort, notes",
    );
  if (error) throw error;
  return (data ?? []).map((w) => {
    const text = [
      `${w.display_name ?? w.filename} [${w.platform}]`,
      w.description ?? "",
      w.apps?.length ? `Apps: ${w.apps.join(", ")}` : "",
      w.naples_module ? `Maps to module: ${w.naples_module}` : "",
      w.fills_named_gap ? `Fills gap: ${w.fills_named_gap}` : "",
      w.notes ?? "",
    ]
      .filter(Boolean)
      .join("\n");
    return {
      source_type: "workflow" as const,
      source_id: w.id as string,
      source_table: "makerschool_workflows",
      chunk_text: text,
      chunk_index: 0,
      metadata: {
        workflow_id: w.id,
        filename: w.filename,
        platform: w.platform,
        naples_relevance: w.naples_relevance,
        fills_named_gap: w.fills_named_gap,
        port_effort: w.port_effort,
      },
    };
  });
}

async function loadTools(): Promise<PendingChunk[]> {
  const { data, error } = await supabase
    .from("makerschool_tools")
    .select(
      "id, name, category, description, pricing_model, affiliate_url, first_appears_day, notes",
    );
  if (error) throw error;
  return (data ?? []).map((t) => ({
    source_type: "tool" as const,
    source_id: t.id as string,
    source_table: "makerschool_tools",
    chunk_text: [
      `${t.name} (${t.category ?? "uncategorized"})`,
      t.description ?? "",
      t.pricing_model ? `Pricing: ${t.pricing_model}` : "",
      t.affiliate_url ? `Affiliate: ${t.affiliate_url}` : "",
      t.first_appears_day ? `First appears Day ${t.first_appears_day}` : "",
      t.notes ?? "",
    ]
      .filter(Boolean)
      .join("\n"),
    chunk_index: 0,
    metadata: {
      tool_id: t.id,
      name: t.name,
      category: t.category,
      first_appears_day: t.first_appears_day,
    },
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("loading sources…");
  const all = (
    await Promise.all([
      loadLessons(),
      loadTranscriptChunks(),
      loadSummaries(),
      loadActionItems(),
      loadWorkflows(),
      loadTools(),
    ])
  ).flat();

  const byType = all.reduce<Record<string, number>>((acc, c) => {
    acc[c.source_type] = (acc[c.source_type] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`total chunks: ${all.length}`, byType);

  if (force) {
    console.log("--force: wiping makerschool_embeddings");
    await supabase
      .from("makerschool_embeddings")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
  } else {
    // Skip chunks already embedded (by source_type + source_id + chunk_index)
    const { data: existing } = await supabase
      .from("makerschool_embeddings")
      .select("source_type, source_id, chunk_index");
    const seen = new Set(
      (existing ?? []).map(
        (r) => `${r.source_type}:${r.source_id}:${r.chunk_index}`,
      ),
    );
    const before = all.length;
    const remaining = all.filter(
      (c) => !seen.has(`${c.source_type}:${c.source_id}:${c.chunk_index}`),
    );
    console.log(`skipping ${before - remaining.length} already embedded`);
    all.length = 0;
    all.push(...remaining);
  }

  if (!all.length) {
    console.log("nothing to embed.");
    return;
  }

  let done = 0;
  for (let i = 0; i < all.length; i += BATCH) {
    const batch = all.slice(i, i + BATCH);
    let vectors: number[][];
    try {
      vectors = await embedBatch(batch.map((b) => b.chunk_text));
    } catch (err) {
      // Fall back to per-item to skip the bad one
      console.error(
        `batch embed failed at ${i}; falling back to per-item:`,
        (err as Error).message?.slice(0, 200),
      );
      vectors = [];
      for (const b of batch) {
        try {
          const v = (await embedBatch([b.chunk_text]))[0]!;
          vectors.push(v);
        } catch (e) {
          console.error(`  skipped: ${(e as Error).message?.slice(0, 200)}`);
          vectors.push(new Array(EMBED_DIMS).fill(0)); // sentinel — will look like noise
        }
      }
    }
    const rows = batch.map((c, j) => ({
      source_type: c.source_type,
      source_id: c.source_id,
      source_table: c.source_table,
      chunk_text: c.chunk_text,
      chunk_index: c.chunk_index,
      metadata: c.metadata,
      embedding: vectors[j]!,
    }));
    const { error } = await supabase.from("makerschool_embeddings").insert(
      rows.map((r) => ({
        ...r,
        // pgvector accepts either string repr or array; supabase-js will JSON-encode
        // arrays. Send as string to ensure correct cast.
        embedding: `[${r.embedding.join(",")}]`,
      })),
    );
    if (error) throw new Error(`insert failed: ${error.message}`);
    done += rows.length;
    if (done % 200 === 0 || done === all.length) {
      console.log(`  ${done}/${all.length}`);
    }
    // gentle pacing — Gemini text-embedding tier is generous but be polite
    await sleep(250);
  }

  console.log("embedded.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

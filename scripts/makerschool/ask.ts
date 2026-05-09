#!/usr/bin/env -S npx tsx
/**
 * Retrieval-only companion to chat.ts.
 *
 * Embeds the query (Gemini, free tier), pulls top-k chunks from
 * makerschool_search, prints them to stdout. No LLM synthesis — that's
 * the caller's job (e.g. Claude Code reads the output and answers).
 *
 * Usage:
 *   doppler run --project naples-digital --config prd -- \
 *     npx tsx ask.ts "how does Nick handle Stripe webhooks?"
 *
 * Flags:
 *   --top-k N           number of chunks (default 12)
 *   --sources a,b,c     restrict source types (lesson, transcript,
 *                       action_item, workflow, summary, tool)
 */

import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";

const EMBED_MODEL = "gemini-embedding-001";
const EMBED_DIMS = 768;

const args = process.argv.slice(2);
const topKFlag = args.indexOf("--top-k");
const topK =
  topKFlag !== -1 && args[topKFlag + 1]
    ? parseInt(args[topKFlag + 1]!, 10)
    : 12;
const sourcesFlag = args.indexOf("--sources");
const sourceFilter =
  sourcesFlag !== -1 && args[sourcesFlag + 1]
    ? args[sourcesFlag + 1]!.split(",").map((s: string) => s.trim())
    : null;
const positional = args
  .filter(
    (a: string, i: number) =>
      !a.startsWith("--") &&
      !(["--top-k", "--sources"].includes(args[i - 1] ?? "")),
  )
  .join(" ")
  .trim();

if (!positional) {
  console.error('Usage: ask.ts "your question" [--top-k N] [--sources a,b]');
  process.exit(1);
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

interface RetrievedChunk {
  id: string;
  source_type: string;
  source_id: string;
  source_table: string;
  chunk_text: string;
  chunk_index: number;
  metadata: Record<string, unknown>;
  similarity: number;
}

async function main() {
  const result = await gemini.models.embedContent({
    model: EMBED_MODEL,
    contents: positional,
    config: { taskType: "RETRIEVAL_QUERY", outputDimensionality: EMBED_DIMS },
  });
  const vec = result.embeddings![0]!.values!;

  const { data, error } = await supabase.rpc("makerschool_search", {
    query_embedding: `[${vec.join(",")}]` as any,
    match_count: topK,
    source_filter: sourceFilter,
  });
  if (error) throw error;

  const chunks = (data ?? []) as RetrievedChunk[];

  console.log(`# Question\n${positional}\n`);
  console.log(`# Retrieved ${chunks.length} chunks\n`);

  for (const [i, c] of chunks.entries()) {
    const meta = c.metadata as Record<string, any>;
    const labelBits = [`type=${c.source_type}`];
    if (meta.title) labelBits.push(`title="${meta.title}"`);
    if (meta.day_number != null) labelBits.push(`day=${meta.day_number}`);
    if (meta.url) labelBits.push(`url=${meta.url}`);
    if (meta.filename) labelBits.push(`file=${meta.filename}`);
    if (meta.name) labelBits.push(`name=${meta.name}`);
    labelBits.push(`sim=${c.similarity.toFixed(3)}`);
    console.log(`## [#${i + 1}] ${labelBits.join(" ")}\n`);
    console.log(`${c.chunk_text}\n`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

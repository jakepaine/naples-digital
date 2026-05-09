#!/usr/bin/env -S npx tsx
/**
 * Talk to MakerSchool — RAG chat CLI grounded in the full course corpus.
 *
 * Usage (single-shot):
 *   doppler run --project naples-digital --config prd -- \
 *     pnpm --filter @naples/makerschool-study tsx chat.ts "how do I set up cold email warmup?"
 *
 * Usage (interactive REPL):
 *   doppler run --project naples-digital --config prd -- \
 *     pnpm --filter @naples/makerschool-study tsx chat.ts
 *
 * Flags:
 *   --top-k N           number of chunks to retrieve (default 20)
 *   --sources a,b,c     restrict to specific source types
 *                       (lesson, transcript, action_item, workflow, summary, tool)
 *   --no-citations      omit the [#1], [#2] citation footnotes
 */

import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";
import * as readline from "node:readline/promises";

const EMBED_MODEL = "gemini-embedding-001";
const EMBED_DIMS = 768;
const CHAT_MODEL = "claude-sonnet-4-6";

const args = process.argv.slice(2);
const topKFlag = args.indexOf("--top-k");
const topK =
  topKFlag !== -1 && args[topKFlag + 1]
    ? parseInt(args[topKFlag + 1]!, 10)
    : 20;
const sourcesFlag = args.indexOf("--sources");
const sourceFilter =
  sourcesFlag !== -1 && args[sourcesFlag + 1]
    ? args[sourcesFlag + 1]!.split(",").map((s) => s.trim())
    : null;
const noCitations = args.includes("--no-citations");
// First positional that isn't a flag value
const positional = args
  .filter(
    (a, i) =>
      !a.startsWith("--") &&
      !(["--top-k", "--sources"].includes(args[i - 1] ?? "")),
  )
  .join(" ");

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
const anthropic = new Anthropic({ apiKey: requireEnv("ANTHROPIC_API_KEY") });

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

async function embedQuery(text: string): Promise<number[]> {
  const result = await gemini.models.embedContent({
    model: EMBED_MODEL,
    contents: text,
    config: {
      taskType: "RETRIEVAL_QUERY",
      outputDimensionality: EMBED_DIMS,
    },
  });
  return result.embeddings![0]!.values!;
}

async function retrieve(query: string): Promise<RetrievedChunk[]> {
  const vec = await embedQuery(query);
  const { data, error } = await supabase.rpc("makerschool_search", {
    query_embedding: `[${vec.join(",")}]` as any,
    match_count: topK,
    source_filter: sourceFilter,
  });
  if (error) throw error;
  return (data ?? []) as RetrievedChunk[];
}

function formatContextBlock(chunks: RetrievedChunk[]): string {
  return chunks
    .map((c, i) => {
      const meta = c.metadata as Record<string, any>;
      let label = `[#${i + 1}] type=${c.source_type}`;
      if (meta.title) label += ` title="${meta.title}"`;
      if (meta.day_number != null) label += ` day=${meta.day_number}`;
      if (meta.url) label += ` url=${meta.url}`;
      if (meta.filename) label += ` file=${meta.filename}`;
      if (meta.name) label += ` name=${meta.name}`;
      label += ` similarity=${c.similarity.toFixed(3)}`;
      return `${label}\n${c.chunk_text}`;
    })
    .join("\n\n---\n\n");
}

const SYSTEM_PROMPT = `You are an expert on Nick Saraev's "Maker School" — a 30-day program for
acquiring your first AI/automation customer. Jake is studying the course to
build "Naples Digital", a multi-tenant SaaS platform for service businesses.

Use ONLY the provided context to answer. The context comes from:
- lessons: written course content
- transcripts: verbatim video transcripts (Gemini-generated)
- summaries: 2-3 sentence per-video summaries
- action_items: concrete steps Nick teaches
- workflows: Make.com / n8n blueprint metadata
- tools: tool inventory with affiliate links + pricing

If the context doesn't contain the answer, say so directly — don't make
things up. When you cite a fact, reference the chunk number like [#3].

Be direct. Skip preamble. Match Jake's tone: PM/scrum background, prefers
no-nonsense answers, copy-pasteable when applicable.`;

async function answer(question: string): Promise<void> {
  process.stdout.write("retrieving…\n");
  const chunks = await retrieve(question);
  process.stdout.write(`got ${chunks.length} chunks\n\n`);

  const userBlock = [
    `Question: ${question}`,
    "",
    "Retrieved context:",
    formatContextBlock(chunks),
    "",
    `Answer Jake's question using only the context above. Cite chunk numbers like [#1], [#7] when stating specific facts. ${noCitations ? "" : "End with a 'Sources' list mapping each chunk number you cited to its source label."}`,
  ].join("\n");

  const stream = await anthropic.messages.stream({
    model: CHAT_MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userBlock }],
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      process.stdout.write(event.delta.text);
    }
  }
  process.stdout.write("\n");
}

async function main() {
  if (positional.trim()) {
    await answer(positional);
    return;
  }

  // Interactive REPL
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  console.log(
    "MakerSchool chat — Ctrl+C to exit. Ask anything about the course.",
  );
  while (true) {
    const q = (await rl.question("\n> ")).trim();
    if (!q) continue;
    if (q === "exit" || q === "quit") break;
    try {
      await answer(q);
    } catch (err) {
      console.error("error:", (err as Error).message);
    }
  }
  rl.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

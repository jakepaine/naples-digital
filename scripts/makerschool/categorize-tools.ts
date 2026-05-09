#!/usr/bin/env -S npx tsx
/**
 * Single-batch LLM pass: assign a category to every uncategorized tool. Uses
 * Claude Sonnet 4.6. Also marks pure noise (camera models, microphone brands,
 * non-tools) so the user can filter them out at query time.
 *
 * Run via Doppler.
 */

import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

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
const anthropic = new Anthropic({ apiKey: requireEnv("ANTHROPIC_API_KEY") });

const CATEGORIES = [
  "cold_email",
  "crm",
  "scraping",
  "enrichment",
  "ai_llm",
  "ai_image",
  "ai_audio",
  "ai_voice",
  "ai_coding",
  "automation",
  "payments",
  "forms",
  "scheduling",
  "communications",
  "publishing",
  "design",
  "website",
  "naming",
  "community",
  "storage",
  "time_tracking",
  "call_recording",
  "screen_recording",
  "chatbot",
  "proposals",
  "analytics",
  "search",
  "hardware",
  "language",
  "noise", // not a real software tool (camera, mic, OS name, etc)
  "other",
];

const SYSTEM = `You are categorizing software tools mentioned in a course on building an
AI/automation agency. For each input name, return one of these categories:

${CATEGORIES.join(", ")}

Use 'hardware' for cameras, microphones, lighting kits, webcams, lenses.
Use 'noise' for words that aren't a software tool/platform/service name —
generic words like "Email", "CRM", "Tools", "AI", or non-tool brand names
appearing out of context.
Use 'other' only as a last resort.

Return strict JSON object: { "<name>": "<category>", ... }
Output ONLY the JSON, no prose, no fences.`;

async function categorizeBatch(names: string[]): Promise<Record<string, string>> {
  const result = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    system: SYSTEM,
    messages: [{ role: "user", content: JSON.stringify(names) }],
  });
  const text = result.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("");
  const cleaned = text.replace(/^```(json)?|```$/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    console.error("Failed to parse Claude response:", cleaned.slice(0, 500));
    return {};
  }
}

async function main() {
  const { data: rows, error } = await supabase
    .from("makerschool_tools")
    .select("id, name")
    .eq("category", "uncategorized");
  if (error) throw error;
  console.log(`uncategorized tools: ${rows?.length ?? 0}`);
  if (!rows?.length) return;

  // Batch in groups of 80 names per call
  const BATCH = 80;
  const all: Record<string, string> = {};
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    console.log(
      `  batch ${Math.floor(i / BATCH) + 1}: ${chunk.length} names…`,
    );
    const result = await categorizeBatch(chunk.map((r) => r.name));
    Object.assign(all, result);
  }

  console.log(`got ${Object.keys(all).length} categorizations`);

  let updated = 0,
    missing = 0,
    invalid = 0;
  for (const row of rows) {
    const cat = all[row.name];
    if (!cat) {
      missing++;
      continue;
    }
    if (!CATEGORIES.includes(cat)) {
      invalid++;
      continue;
    }
    const { error: uErr } = await supabase
      .from("makerschool_tools")
      .update({ category: cat })
      .eq("id", row.id);
    if (uErr) {
      console.error(`update ${row.name} failed:`, uErr.message);
      continue;
    }
    updated++;
  }
  console.log(
    `\ndone. updated=${updated} missing=${missing} invalid_category=${invalid}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

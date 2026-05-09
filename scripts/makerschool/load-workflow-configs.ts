#!/usr/bin/env -S npx tsx
/**
 * Load each Make.com / n8n workflow JSON file into makerschool_workflows.config
 * (jsonb column). Idempotent — re-runnable.
 */

import { createClient } from "@supabase/supabase-js";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

const FOLDER = resolve(process.cwd(), "../../../makerschool");

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

async function main() {
  const files = (await readdir(FOLDER)).filter(
    (f) => f.endsWith(".json") && f !== "makerschool_lessons.json",
  );
  console.log(`scanning ${files.length} workflow JSONs`);

  const { data: rows, error } = await supabase
    .from("makerschool_workflows")
    .select("id, filename");
  if (error) throw error;
  const idByName = new Map((rows ?? []).map((r) => [r.filename, r.id]));

  let loaded = 0,
    missing = 0,
    failed = 0;
  for (const file of files) {
    const id = idByName.get(file);
    if (!id) {
      missing++;
      continue;
    }
    const path = resolve(FOLDER, file);
    try {
      const content = await readFile(path, "utf8");
      const parsed = JSON.parse(content);
      const { error: uErr } = await supabase
        .from("makerschool_workflows")
        .update({ config: parsed })
        .eq("id", id);
      if (uErr) throw uErr;
      loaded++;
    } catch (err) {
      console.error(`  fail ${file}:`, (err as Error).message.slice(0, 200));
      failed++;
    }
    if (loaded % 10 === 0)
      console.log(`  ${loaded}/${files.length} loaded so far`);
  }

  console.log(`\ndone. loaded=${loaded} missing=${missing} failed=${failed}`);

  const counts = await supabase
    .from("makerschool_workflows")
    .select("*", { count: "exact", head: true })
    .not("config", "is", null);
  console.log(`workflows with config now: ${counts.count}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

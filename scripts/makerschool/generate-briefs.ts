#!/usr/bin/env -S npx tsx
/**
 * Generate two synthesis docs from the current state of the MakerSchool tables:
 *
 *   - cold_email_brief.md   — Nick's full cold email playbook, in one file
 *   - lessons_learned.md    — curated benchmarks, scripts, mistakes-to-avoid,
 *                             promo codes, templates extracted from across the
 *                             corpus
 *
 * Both docs are LLM-synthesized via Claude Sonnet 4.6 with the corpus as
 * grounding. Re-runnable; will overwrite.
 *
 * Run via Doppler.
 */

import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

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

const COLD_EMAIL_KEYWORDS = [
  "cold email",
  "cold-email",
  "instantly",
  "smartlead",
  "warmup",
  "warm-up",
  "deliverability",
  "open rate",
  "reply rate",
  "subject line",
  "sequence",
  "anymailfinder",
  "apollo",
  "spam",
  "dkim",
  "spf",
  "dmarc",
  "mailbox",
  "domain",
  "scrape",
  "lead",
];

interface Bundle {
  lessons: any[];
  actionItems: any[];
  workflows: any[];
  tools: any[];
  transcripts: any[];
}

async function gatherForKeywords(keywords: string[]): Promise<Bundle> {
  const ilikeAny = (col: string) =>
    keywords.map((k) => `${col}.ilike.%${k}%`).join(",");

  const [lessons, actionItems, workflows, tools, transcripts] =
    await Promise.all([
      supabase
        .from("makerschool_lessons")
        .select(
          "id, section, subsection, title, day_number, task_number, written_content",
        )
        .or(ilikeAny("written_content"))
        .order("day_number", { ascending: true, nullsFirst: false }),
      supabase
        .from("makerschool_action_items")
        .select("description, ordering, lesson_id")
        .or(ilikeAny("description"))
        .order("ordering", { ascending: true }),
      supabase
        .from("makerschool_workflows")
        .select(
          "filename, display_name, description, platform, apps, naples_module",
        )
        .or(
          [...keywords.map((k) => `description.ilike.%${k}%`), `apps.cs.{Instantly}`, `apps.cs.{Smartlead}`].join(","),
        ),
      supabase
        .from("makerschool_tools")
        .select(
          "name, category, description, pricing_model, affiliate_url, homepage_url, notes",
        )
        .in("category", ["cold_email", "enrichment", "scraping"])
        .order("name"),
      supabase
        .from("makerschool_videos")
        .select("id, summary, transcript")
        .not("transcript", "is", null)
        .neq("transcript", "")
        .or(ilikeAny("transcript")),
    ]);

  return {
    lessons: lessons.data ?? [],
    actionItems: actionItems.data ?? [],
    workflows: workflows.data ?? [],
    tools: tools.data ?? [],
    transcripts: transcripts.data ?? [],
  };
}

function summarizeBundle(b: Bundle, label: string): string {
  return `${label} corpus:
- ${b.lessons.length} lessons mentioning the topic
- ${b.actionItems.length} action items mentioning the topic
- ${b.workflows.length} workflows in this area
- ${b.tools.length} tools curated as part of this area
- ${b.transcripts.length} videos with full transcripts mentioning the topic`;
}

const COLD_EMAIL_PROMPT = `You are synthesizing Nick Saraev's full cold-email playbook for Jake — the
founder of Naples Digital, a multi-tenant SaaS platform for service businesses.
Jake has studied Maker School and we have all the source data below. Produce
ONE consolidated, copy-pasteable Markdown document.

Required sections (use these exact headings, in this order):
1. ## Quick reference (table) — open rate, reply rate, daily volume, mailbox
   count, warmup time, lead count, tools needed
2. ## The 3-act cold email pipeline — sourcing → enrichment → sending. Step by
   step. Specific tools per step.
3. ## Day-by-day cold email setup (Days 1, 8, 11, 13, 15, 16, 17, 19, 20, 21, 22, 28, 29)
   What Nick does on each cold-email-relevant day, in concrete steps.
4. ## Mailbox + deliverability checklist — DKIM, SPF, DMARC, warmup, daily
   limits, slow ramp.
5. ## Sequence templates — initial email, followup #1, followup #2 patterns.
   Include any specific copy snippets present in the corpus.
6. ## Reply handling + lead scoring — auto-reply, classification, intent.
7. ## Specific numbers to internalize — every benchmark, threshold, dollar
   figure, percentage that appears in the source.
8. ## Tools (table) — name, what it does, pricing, Nick's affiliate link if
   present.
9. ## Specific mistakes to avoid — explicit anti-patterns Nick warns about.
10. ## Direct quotes — pull exact lines that are particularly insightful from
    transcripts (with chunk citation).

When citing, use [#N] format pointing to the chunk index.
Use only the corpus below. Don't invent. If a section has no source, write
"(no specific guidance in the corpus)" rather than fabricate.

Length: as long as the source supports. Be specific over flowery.
Output: pure Markdown. No prose-fences.`;

const LESSONS_LEARNED_PROMPT = `You are extracting "lessons learned" from Nick Saraev's full Maker School
course corpus. Jake — founder of Naples Digital — wants ONE document he can
re-read in 10 minutes that captures everything genuinely transferable.

Required structure (use these exact headings, in this order):

## TL;DR — Nick's worldview in 7 bullets
The big-picture beliefs that shape every tactical decision.

## Specific numbers worth memorizing
Every benchmark, percentage, dollar figure, time interval, conversion rate
that appears in the source. Tabular when possible.

## Promo codes + affiliate codes
Every code or special URL that gives Jake a discount. (Onshot NICKAI, Apify
30NS, etc.) Tabular.

## Mistakes-to-avoid
Concrete anti-patterns Nick explicitly warns about — what NOT to do, with
the reasoning.

## Templates + scripts surfaced in the corpus
Anything quoted or paraphrased that's effectively a template (sales script
structure, proposal outline, community post format, cold email opener, etc.)

## Tool philosophy
Why Nick picks specific tools. The 80/20 logic.

## Time + effort calibration
Hours per task, days to first customer, weeks to consistency, etc.

## Hidden gems
Counterintuitive specifics that beginners would never guess (e.g. "respond
to cold email replies within 5 minutes lifts conversion 4-10x").

When citing, use [#N] format pointing to the chunk index.
Be ruthless about cutting fluff. Lean on direct quotes for the strongest
points. If a section is sparse, write "(thin in the corpus)" — don't pad.

Output: pure Markdown. No prose-fences.`;

function chunksToContext(b: Bundle): string {
  const blocks: string[] = [];
  let n = 0;

  for (const l of b.lessons) {
    n++;
    blocks.push(
      `[#${n}] LESSON ${l.section}${l.subsection ? " > " + l.subsection : ""} — "${l.title}"${l.day_number ? ` (Day ${l.day_number})` : ""}\n${(l.written_content ?? "").slice(0, 1500)}`,
    );
  }
  for (const a of b.actionItems) {
    n++;
    blocks.push(`[#${n}] ACTION ITEM: ${a.description}`);
  }
  for (const w of b.workflows) {
    n++;
    blocks.push(
      `[#${n}] WORKFLOW [${w.platform}] ${w.display_name ?? w.filename}\n${w.description ?? ""}\nApps: ${(w.apps ?? []).join(", ")}\nMaps to: ${w.naples_module ?? "-"}`,
    );
  }
  for (const t of b.tools) {
    n++;
    blocks.push(
      `[#${n}] TOOL ${t.name} (${t.category ?? "?"}) — ${t.description ?? ""}\nPricing: ${t.pricing_model ?? "?"}\nAffiliate: ${t.affiliate_url ?? "(none)"}\nNotes: ${t.notes ?? ""}`,
    );
  }
  for (const v of b.transcripts) {
    n++;
    // Truncate huge transcripts to first ~6k chars to keep total prompt size sane
    const text = (v.transcript ?? "").slice(0, 6000);
    blocks.push(`[#${n}] TRANSCRIPT (video ${v.id})\n${text}`);
  }
  return blocks.join("\n\n---\n\n");
}

async function synthesize(prompt: string, context: string): Promise<string> {
  const result = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 16_000,
    system: prompt,
    messages: [
      {
        role: "user",
        content: `Source corpus follows. Synthesize per the system instructions.\n\n${context}`,
      },
    ],
  });
  return result.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("");
}

async function main() {
  console.log("=== gathering cold-email corpus ===");
  const ce = await gatherForKeywords(COLD_EMAIL_KEYWORDS);
  console.log(summarizeBundle(ce, "cold-email"));

  console.log("=== gathering full corpus for lessons-learned ===");
  // For lessons learned, pull a wider net — top-N items from every category
  const ll: Bundle = {
    lessons: (
      await supabase
        .from("makerschool_lessons")
        .select(
          "id, section, subsection, title, day_number, task_number, written_content",
        )
        .not("written_content", "is", null)
        .neq("written_content", "")
        .order("day_number", { ascending: true, nullsFirst: false })
        .limit(120)
    ).data ?? [],
    actionItems:
      (await supabase
        .from("makerschool_action_items")
        .select("description, ordering, lesson_id")
        .order("ordering")
        .limit(400)
      ).data ?? [],
    workflows:
      (await supabase
        .from("makerschool_workflows")
        .select(
          "filename, display_name, description, platform, apps, naples_module",
        )
        .neq("naples_relevance", "skip")
        .order("naples_relevance")
      ).data ?? [],
    tools:
      (await supabase
        .from("makerschool_tools")
        .select(
          "name, category, description, pricing_model, affiliate_url, homepage_url, notes",
        )
        .neq("category", "noise")
        .neq("category", "hardware")
      ).data ?? [],
    transcripts:
      (await supabase
        .from("makerschool_videos")
        .select("id, summary, transcript")
        .not("transcript", "is", null)
        .neq("transcript", "")
        .limit(40)
      ).data ?? [],
  };
  console.log(summarizeBundle(ll, "lessons-learned"));

  console.log("\n=== synthesizing cold_email_brief.md ===");
  const ceCtx = chunksToContext(ce);
  console.log(`context size: ${ceCtx.length} chars`);
  const ceMd = await synthesize(COLD_EMAIL_PROMPT, ceCtx);
  await writeFile(resolve(process.cwd(), "cold_email_brief.md"), ceMd);
  console.log(`wrote cold_email_brief.md (${ceMd.length} chars)`);

  console.log("\n=== synthesizing lessons_learned.md ===");
  const llCtx = chunksToContext(ll);
  console.log(`context size: ${llCtx.length} chars`);
  const llMd = await synthesize(LESSONS_LEARNED_PROMPT, llCtx);
  await writeFile(resolve(process.cwd(), "lessons_learned.md"), llMd);
  console.log(`wrote lessons_learned.md (${llMd.length} chars)`);

  console.log("\ndone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

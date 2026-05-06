// Suggest endpoint. Reads repo state (.build-state.md, README, recent git log)
// and asks Claude to propose backlog items the human hasn't captured yet.
//
// Falls back to a deterministic heuristic generator if ANTHROPIC_API_KEY is
// unset, so the modal always shows something useful.

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { promises as fs } from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { listBacklogItems, type BacklogPriority } from "@naples/db";
import { getTenantBySlug } from "@naples/db/tenant";

const exec = promisify(execFile);

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

type SuggestedItem = {
  title: string;
  description?: string;
  priority: BacklogPriority;
  tags: string[];
};

const SYSTEM_PROMPT = `You are an agency operations assistant for Naples Digital, a Southwest Florida AI/automation agency. You help the founder (Jake) keep a per-client backlog up to date by reading repo state and proposing concrete, actionable backlog items.

Rules:
- Propose items that are CONCRETE and ACTIONABLE. "Improve outreach" is bad. "Set up Apify scraper for SWFL real estate agents and pipe into leads table" is good.
- Skip items that are already in the existing backlog (you'll be given the current list).
- Each item gets a priority (P0/P1/P2/P3): P0 = blocker for prod use, P1 = needed soon, P2 = wanted but not urgent, P3 = nice-to-have / later.
- Tags are lowercase free-form labels — pick from existing tags when relevant ("config", "outreach", "content", "billing", "infra", "marketing", "ai", "blocker") or invent new ones.
- Skip vague advice ("add tests", "improve docs"). Only specific work.
- 4-8 items maximum. Quality over quantity.
- Tenant context matters: items for "239live" are about Kevin's media studio; items for "naplesdigital" are about the agency itself.

Respond with ONLY valid JSON, no markdown fences, in this shape:
{"items": [{"title": "...", "description": "...", "priority": "P1", "tags": ["..."]}]}`;

async function readBuildState(repoRoot: string): Promise<string> {
  try {
    return await fs.readFile(path.join(repoRoot, ".build-state.md"), "utf-8");
  } catch {
    return "";
  }
}

async function readReadme(repoRoot: string): Promise<string> {
  try {
    const txt = await fs.readFile(path.join(repoRoot, "README.md"), "utf-8");
    return txt.slice(0, 8000); // cap
  } catch {
    return "";
  }
}

async function readRecentCommits(repoRoot: string): Promise<string> {
  try {
    const { stdout } = await exec("git", ["log", "--oneline", "-30"], { cwd: repoRoot });
    return stdout;
  } catch {
    return "";
  }
}

async function readGitStatus(repoRoot: string): Promise<string> {
  try {
    const { stdout } = await exec("git", ["status", "--short"], { cwd: repoRoot });
    return stdout;
  } catch {
    return "";
  }
}

function findRepoRoot(): string {
  // Walk up from cwd until we find pnpm-workspace.yaml. Works in dev (cwd is
  // apps/backlog) and in prod (Next standalone runs from /app).
  const fsSync = require("fs") as typeof import("fs");
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    if (fsSync.existsSync(path.join(dir, "pnpm-workspace.yaml"))) return dir;
    const next = path.dirname(dir);
    if (next === dir) break;
    dir = next;
  }
  return process.cwd();
}

function fallbackSuggestions(tenantSlug: string, buildState: string, recentCommits: string): SuggestedItem[] {
  // Cheap heuristic: extract "next_step:" line from build-state and the most
  // recent commit subjects. Better than nothing when there's no API key.
  const items: SuggestedItem[] = [];
  const nextMatch = buildState.match(/^next_step:\s*(.+)$/m);
  if (nextMatch && nextMatch[1]) {
    const text = nextMatch[1].trim();
    const parts = text.split(/[.;]\s+/).filter(Boolean).slice(0, 4);
    for (const p of parts) {
      items.push({
        title: p.length > 100 ? p.slice(0, 97) + "…" : p,
        description: `Proposed by fallback scan of .build-state.md next_step. Set ANTHROPIC_API_KEY for richer suggestions.`,
        priority: "P1",
        tags: ["build-state", tenantSlug],
      });
    }
  }
  if (recentCommits.trim()) {
    items.push({
      title: "Review last 30 commits for follow-up work not yet tracked",
      description: recentCommits.split("\n").slice(0, 5).join("\n"),
      priority: "P3",
      tags: ["review"],
    });
  }
  if (items.length === 0) {
    items.push({
      title: "No repo signal found — set ANTHROPIC_API_KEY and try again",
      description: "Suggest endpoint is running in fallback mode. Add the Anthropic key to enable richer scans.",
      priority: "P3",
      tags: ["config"],
    });
  }
  return items;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const slug: string | undefined = body?.tenant;
  if (!slug) return NextResponse.json({ error: "tenant slug required" }, { status: 400 });
  const tenant = await getTenantBySlug(slug);
  if (!tenant) return NextResponse.json({ error: "tenant not found" }, { status: 404 });

  const repoRoot = findRepoRoot();
  const [buildState, readme, recentCommits, gitStatus, existing] = await Promise.all([
    readBuildState(repoRoot),
    readReadme(repoRoot),
    readRecentCommits(repoRoot),
    readGitStatus(repoRoot),
    listBacklogItems(tenant.id),
  ]);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const items = fallbackSuggestions(slug, buildState, recentCommits);
    return NextResponse.json({ items, source: "fallback" });
  }

  const existingTitles = existing.map((e) => `- [${e.status}] ${e.title}`).join("\n");
  const userMessage = `Tenant: ${tenant.name} (slug: ${tenant.slug})

EXISTING BACKLOG (do not duplicate these — propose only NEW items):
${existingTitles || "(none)"}

REPO STATE:

=== .build-state.md ===
${buildState.slice(0, 4000) || "(empty)"}

=== README.md (truncated) ===
${readme || "(empty)"}

=== git log -30 ===
${recentCommits || "(empty)"}

=== git status ===
${gitStatus || "(clean)"}

Propose 4–8 concrete backlog items for this tenant that aren't already in the existing list above. Focus on items the repo state implies are needed but haven't been captured yet.`;

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });
    const block = message.content.find((c) => c.type === "text");
    if (!block || block.type !== "text") throw new Error("no text response");
    const cleaned = block.text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "");
    const parsed = JSON.parse(cleaned) as { items?: SuggestedItem[] };
    const items = (parsed.items ?? []).filter((i) => i?.title).map(normalize);
    return NextResponse.json({ items, source: "api" });
  } catch (e) {
    const items = fallbackSuggestions(slug, buildState, recentCommits);
    return NextResponse.json({ items, source: "fallback", note: e instanceof Error ? e.message : "api error" });
  }
}

function normalize(i: SuggestedItem): SuggestedItem {
  const validPriorities: BacklogPriority[] = ["P0", "P1", "P2", "P3"];
  return {
    title: String(i.title).slice(0, 200),
    description: i.description ? String(i.description).slice(0, 500) : undefined,
    priority: (validPriorities.includes(i.priority as BacklogPriority) ? i.priority : "P2") as BacklogPriority,
    tags: Array.isArray(i.tags) ? i.tags.map((t) => String(t).toLowerCase().slice(0, 24)).slice(0, 6) : [],
  };
}

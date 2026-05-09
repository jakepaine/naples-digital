// Claude-driven Reel tagger. We have caption + hashtags + thumbnail
// (and optionally a video transcript when a worker has filled it in).
// We DON'T pass the video file to Claude — too expensive at scale, and
// the caption + thumbnail combination is usually sufficient for the
// hook-pattern + retention-signal axis the audit's research feed
// targets.

import Anthropic from "@anthropic-ai/sdk";

export interface ReelAnalysis {
  hook_first_3s: string;
  hook_pattern: string; // question | bold_claim | stat | demo | story | other
  niche_relevance: number; // 0-100
  retention_signal: string; // pattern_break | escalating_promise | curiosity_gap | other
  cta_present: boolean;
  cta_text: string | null;
  ai_summary: string;
}

const SYSTEM = `You analyze short-form Instagram Reels for a competitive-research feed.
Output strict JSON only:
{
  "hook_first_3s": "<the spoken/written hook in the first 3 seconds, verbatim if visible — or your best inference from caption + thumbnail>",
  "hook_pattern": "question|bold_claim|stat|demo|story|other",
  "niche_relevance": 0-100,                 // how relevant to the tenant's niche, given the niche string we provide
  "retention_signal": "pattern_break|escalating_promise|curiosity_gap|other",
  "cta_present": boolean,
  "cta_text": "<exact CTA if present, else null>",
  "ai_summary": "<one sentence on why this works (or doesn't)>"
}

Pick lowercase enum values. Be honest — most Reels score 30-60 on
relevance, that's normal. Only score 80+ when the Reel is squarely
in the niche.`;

export async function analyzeReel(args: {
  caption: string | null;
  hashtags: string[];
  thumbnailUrl: string | null;
  niche: string | null;
}): Promise<ReelAnalysis> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return deterministic(args);

  try {
    const client = new Anthropic({ apiKey });
    const userBlocks: any[] = [
      {
        type: "text",
        text: [
          `Niche: ${args.niche ?? "(unspecified)"}`,
          `Caption: ${args.caption ?? "(none)"}`,
          `Hashtags: ${args.hashtags.join(", ") || "(none)"}`,
        ].join("\n"),
      },
    ];
    if (args.thumbnailUrl && /^https?:\/\//.test(args.thumbnailUrl)) {
      userBlocks.push({
        type: "image",
        source: { type: "url", url: args.thumbnailUrl },
      });
    }
    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 400,
      system: SYSTEM,
      messages: [{ role: "user", content: userBlocks }],
    });
    const text = res.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const json = JSON.parse(text);
    return {
      hook_first_3s: String(json.hook_first_3s ?? "").slice(0, 280),
      hook_pattern: sanitizeEnum(json.hook_pattern, [
        "question",
        "bold_claim",
        "stat",
        "demo",
        "story",
        "other",
      ]),
      niche_relevance: clamp(json.niche_relevance),
      retention_signal: sanitizeEnum(json.retention_signal, [
        "pattern_break",
        "escalating_promise",
        "curiosity_gap",
        "other",
      ]),
      cta_present: !!json.cta_present,
      cta_text:
        typeof json.cta_text === "string" && json.cta_text.length > 0
          ? json.cta_text
          : null,
      ai_summary: String(json.ai_summary ?? "").slice(0, 600),
    };
  } catch {
    return deterministic(args);
  }
}

function sanitizeEnum(raw: any, allowed: string[]): string {
  const s = String(raw ?? "").toLowerCase();
  return allowed.includes(s) ? s : "other";
}

function clamp(raw: any): number {
  const n = Math.round(Number(raw) || 0);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function deterministic(args: {
  caption: string | null;
  hashtags: string[];
  thumbnailUrl: string | null;
  niche: string | null;
}): ReelAnalysis {
  const cap = (args.caption ?? "").toLowerCase();
  let hook_pattern = "other";
  if (cap.startsWith("pov") || cap.includes("?")) hook_pattern = "question";
  else if (/\d+\s*(things|ways|reasons|days|months|years)/.test(cap))
    hook_pattern = "stat";
  else if (/stop\s+|don'?t\s+|never\s+/i.test(cap)) hook_pattern = "bold_claim";
  else if (/watch til|swipe|tap|click/.test(cap)) hook_pattern = "demo";

  let retention = "other";
  if (/wait til|surprised|the answer/.test(cap)) retention = "curiosity_gap";
  else if (/pov|when you/.test(cap)) retention = "pattern_break";
  else if (/level up|once you/.test(cap)) retention = "escalating_promise";

  const cta_present = /(link in bio|dm me|follow|subscribe|comment)/.test(cap);
  const cta_match = cap.match(
    /(link in bio|dm me|follow for more|comment[^.]*)/,
  );

  return {
    hook_first_3s: (args.caption ?? "").split(/[\n.]/)[0]?.slice(0, 200) ?? "",
    hook_pattern,
    niche_relevance: 40,
    retention_signal: retention,
    cta_present,
    cta_text: cta_match?.[0] ?? null,
    ai_summary: "Heuristic analysis — set ANTHROPIC_API_KEY for full vision tagging.",
  };
}

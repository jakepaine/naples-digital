// Commentary writer — Claude reads the RSS item + tenant voice profile
// (when configured) and writes a vertical-specific commentary post.
// Output is structured: angle + title + body. Operator approves
// before any publish — this module never auto-publishes.

import Anthropic from "@anthropic-ai/sdk";
import { getVoicePromptPreface, type VoiceFingerprint } from "@naples/outreach";

export type CommentaryAngle =
  | "agree"
  | "disagree"
  | "extend"
  | "refute"
  | "translate-to-vertical"
  | "neutral";

export interface CommentaryDraft {
  title: string;
  body: string;
  angle: CommentaryAngle;
  ai_summary: string;
}

const SYSTEM_BASE = `You write SHORT commentary posts (~250-400 words) on industry RSS
items for a vertical-niche audience. Each commentary takes a position
— agree / disagree / extend / refute / translate-to-vertical / neutral —
and explains the position in the writer's voice.

Output strict JSON only:
{
  "title": "<6-12 word title>",
  "body": "<200-400 word post in the writer's voice; markdown OK>",
  "angle": "agree|disagree|extend|refute|translate-to-vertical|neutral",
  "ai_summary": "<one short sentence on why this angle>"
}

Rules:
- Body must NOT be a summary of the source item — assume the reader
  already saw the headline. Open with the writer's take.
- Cite the source naturally (e.g. "TechCrunch wrote that...") in the
  first paragraph; do not repeat the URL inline.
- Vertical translation means: explain how the item applies (or
  doesn't) to the tenant's specific niche/audience.
- "neutral" is reserved for items where the writer doesn't have a
  meaningful angle — pick this rarely; usually one of the other 5
  fits.`;

export async function generateCommentary(args: {
  itemTitle: string;
  itemUrl: string | null;
  itemBodyText: string | null;
  feedTitle: string | null;
  niche: string | null;
  voice: { fingerprint: VoiceFingerprint | null; summary: string | null } | null;
}): Promise<CommentaryDraft> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return deterministic(args);

  const voicePreface = args.voice
    ? getVoicePromptPreface(args.voice.fingerprint, args.voice.summary)
    : "";
  const system = voicePreface
    ? `${voicePreface}\n\n${SYSTEM_BASE}`
    : SYSTEM_BASE;

  try {
    const client = new Anthropic({ apiKey });
    const userMsg = [
      `Niche: ${args.niche ?? "(unspecified)"}`,
      `Source feed: ${args.feedTitle ?? "(unspecified)"}`,
      `Source title: ${args.itemTitle}`,
      args.itemUrl && `Source URL: ${args.itemUrl}`,
      args.itemBodyText &&
        `Source excerpt:\n${args.itemBodyText.slice(0, 4000)}`,
    ]
      .filter(Boolean)
      .join("\n");
    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      system,
      messages: [{ role: "user", content: userMsg }],
    });
    const text = res.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const json = JSON.parse(text);
    return {
      title: String(json.title ?? args.itemTitle).slice(0, 240),
      body: String(json.body ?? "").slice(0, 6000),
      angle: sanitizeAngle(json.angle),
      ai_summary: String(json.ai_summary ?? "").slice(0, 400),
    };
  } catch {
    return deterministic(args);
  }
}

function sanitizeAngle(raw: any): CommentaryAngle {
  const allowed: CommentaryAngle[] = [
    "agree",
    "disagree",
    "extend",
    "refute",
    "translate-to-vertical",
    "neutral",
  ];
  const s = String(raw ?? "").toLowerCase();
  return (allowed as string[]).includes(s) ? (s as CommentaryAngle) : "neutral";
}

function deterministic(args: {
  itemTitle: string;
  itemUrl: string | null;
  itemBodyText: string | null;
  feedTitle: string | null;
  niche: string | null;
  voice: { fingerprint: VoiceFingerprint | null; summary: string | null } | null;
}): CommentaryDraft {
  const niche = args.niche ?? "your niche";
  const body = `${args.feedTitle ?? "The source"} just covered "${args.itemTitle}". Worth thinking about how this lands for ${niche}.\n\n(Set ANTHROPIC_API_KEY in Doppler to generate full commentary in your voice.)`;
  return {
    title: `Take: ${args.itemTitle}`,
    body,
    angle: "neutral",
    ai_summary:
      "Deterministic placeholder — Anthropic not configured. Real commentary requires ANTHROPIC_API_KEY.",
  };
}

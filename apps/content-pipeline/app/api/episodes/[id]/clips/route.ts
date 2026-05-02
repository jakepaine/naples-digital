import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getEpisodeById, createClips, listClipsForEpisode, markClipPosted } from "@naples/db";
import { getRequestTenantId } from "@naples/db/next";
import { generateMockClips, ClipDraft } from "@/lib/mock-clips";

export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEM_PROMPT = `You are a short-form video editor for Naples Digital × 239 Live Studios in Naples, FL. For each podcast episode, you cut 5 short-form clips: one optimized for each of Instagram, TikTok, YouTube Shorts, Facebook, plus one "best overall" headline moment. For each clip you produce a hook (the on-screen line that makes people stop scrolling, max 12 words) and a caption (the post text, 1–3 sentences, with platform-appropriate tone). Respond ONLY with valid JSON, no markdown fences. Schema: {"clips": [{"platform": "best|instagram|tiktok|youtube|facebook", "hook": "", "caption": ""}]}. Always include exactly 5 clips, one per platform.`;

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const tid = await getRequestTenantId(req);
  const clips = await listClipsForEpisode(tid, params.id);
  return NextResponse.json({ clips });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const tid = await getRequestTenantId(req);
  const episode = await getEpisodeById(tid, params.id);
  if (!episode) return NextResponse.json({ error: "Episode not found" }, { status: 404 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  let drafts: ClipDraft[];
  let source: "api" | "mock" | "fallback" = "mock";

  if (!apiKey) {
    drafts = generateMockClips({
      show: episode.show, title: episode.title,
      guest: episode.guest, guestTitle: episode.guestTitle,
    });
  } else {
    try {
      const client = new Anthropic({ apiKey });
      const userMsg = `Episode: "${episode.title}" on ${episode.show}. Guest: ${episode.guest}${episode.guestTitle ? ` (${episode.guestTitle})` : ""}. Generate the 5 clips.`;
      const message = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMsg }],
      });
      const textBlock = message.content.find((c) => c.type === "text");
      if (!textBlock || textBlock.type !== "text") throw new Error("No text");
      const cleaned = textBlock.text.trim()
        .replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "");
      const parsed = JSON.parse(cleaned) as { clips: ClipDraft[] };
      if (!Array.isArray(parsed.clips) || parsed.clips.length === 0) throw new Error("Invalid shape");
      drafts = parsed.clips;
      source = "api";
    } catch {
      drafts = generateMockClips({
        show: episode.show, title: episode.title,
        guest: episode.guest, guestTitle: episode.guestTitle,
      });
      source = "fallback";
    }
  }

  const clips = await createClips(
    tid,
    episode.id,
    drafts.map((d) => ({ hook: d.hook, caption: d.caption, platform: d.platform, source })),
  );

  return NextResponse.json({ clips, source });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  // Mark a single clip as posted. Body: { clipId: string }
  let body: { clipId?: string } = {};
  try { body = await req.json(); } catch {}
  if (!body.clipId) return NextResponse.json({ error: "Missing clipId" }, { status: 400 });
  const tid = await getRequestTenantId(req);
  const ok = await markClipPosted(tid, body.clipId);
  return NextResponse.json({ ok, episodeId: params.id });
}

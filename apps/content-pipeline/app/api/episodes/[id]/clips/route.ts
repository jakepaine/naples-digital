import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  getEpisodeById, listClipsForEpisode, markClipPosted, getEpisodeTranscript,
  setEpisodeProcessingState, createTimestampedClip, enqueueRender,
} from "@naples/db";
import { getRequestTenantId } from "@naples/db/next";
import { generateMockClips, ClipDraft } from "@/lib/mock-clips";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You select short-form clip moments from a podcast transcript. Given the full transcript with word-level timestamps, you find the 5 best moments — one optimized for each of: best (overall highlight), instagram, tiktok, youtube, facebook. Each clip is 30-90 seconds long, starts on a complete sentence, ends on a punchy line, and contains a self-contained idea.

Respond ONLY with valid JSON, no markdown fences. Schema:
{"clips": [{
  "platform": "best|instagram|tiktok|youtube|facebook",
  "start_seconds": 123.45,
  "end_seconds": 178.20,
  "hook": "<<<on-screen line, max 12 words>>>",
  "caption": "<<<post caption, 1-3 sentences>>>",
  "why": "<<<1 sentence why this works for this platform>>>"
}]}

Always return exactly 5 clips, one per platform. Use real timestamps from the transcript. Hook lines should be punchy attention grabs, not summaries.`;

type TranscriptShape = {
  text: string;
  words: Array<{ text: string; start: number; end: number; speaker?: string }>;
  audio_duration: number;
};

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const tid = await getRequestTenantId(req);
  const clips = await listClipsForEpisode(tid, params.id);
  return NextResponse.json({ clips });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const tid = await getRequestTenantId(req);
  const episode = await getEpisodeById(tid, params.id);
  if (!episode) return NextResponse.json({ error: "Episode not found" }, { status: 404 });

  const transcript = (await getEpisodeTranscript(tid, params.id)) as TranscriptShape | null;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  type ClipMoment = { platform: ClipDraft["platform"]; start_seconds: number; end_seconds: number; hook: string; caption: string };
  let moments: ClipMoment[];
  let source: "api" | "mock" | "fallback" = "mock";

  if (transcript && transcript.words?.length > 0 && apiKey) {
    try {
      const client = new Anthropic({ apiKey });
      // Compress transcript to a per-30-second blocks form for the prompt — keeps tokens reasonable
      const blocks = blockTranscript(transcript, 30_000);
      const userMsg = `Episode: "${episode.title}" on ${episode.show}. Guest: ${episode.guest}${episode.guestTitle ? ` (${episode.guestTitle})` : ""}. Duration: ${transcript.audio_duration}s.

Transcript (timestamped 30s blocks):
${blocks}

Pick 5 clip moments.`;
      const message = await client.messages.create({
        model: "claude-sonnet-4-6", max_tokens: 2500, system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMsg }],
      });
      const block = message.content.find(c => c.type === "text");
      if (!block || block.type !== "text") throw new Error("No text");
      const cleaned = block.text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "");
      const parsed = JSON.parse(cleaned) as { clips: ClipMoment[] };
      if (!Array.isArray(parsed.clips) || parsed.clips.length === 0) throw new Error("Invalid shape");
      moments = parsed.clips;
      source = "api";
    } catch {
      moments = templateMoments(transcript);
      source = "fallback";
    }
  } else {
    // No transcript yet — fall back to text-only clip drafts (legacy behavior)
    const drafts = generateMockClips({
      show: episode.show, title: episode.title,
      guest: episode.guest, guestTitle: episode.guestTitle,
    });
    // Synthesize fake timestamps spread across a 30-min episode for the demo path
    moments = drafts.map((d, i) => ({
      platform: d.platform, hook: d.hook, caption: d.caption,
      start_seconds: 60 + i * 360,
      end_seconds: 120 + i * 360,
    }));
    source = "mock";
  }

  // Persist each clip + enqueue render jobs
  const created: { id: string; platform: string; hook: string; caption: string; start: number; end: number }[] = [];
  for (const m of moments) {
    const clip = await createTimestampedClip(tid, {
      episode_id: episode.id,
      hook: m.hook,
      caption: m.caption,
      platform: m.platform,
      start_seconds: m.start_seconds,
      end_seconds: m.end_seconds,
      source,
    });
    if (clip) {
      await enqueueRender(tid, episode.id, clip.id);
      created.push({ id: clip.id, platform: m.platform, hook: m.hook, caption: m.caption, start: m.start_seconds, end: m.end_seconds });
    }
  }

  await setEpisodeProcessingState(tid, episode.id, "rendering");

  return NextResponse.json({ clips: created, source, count: created.length });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  let body: { clipId?: string } = {};
  try { body = await req.json(); } catch {}
  if (!body.clipId) return NextResponse.json({ error: "Missing clipId" }, { status: 400 });
  const tid = await getRequestTenantId(req);
  const ok = await markClipPosted(tid, body.clipId);
  return NextResponse.json({ ok, episodeId: params.id });
}

// Compress a word-timestamped transcript into N-second blocks for prompting
function blockTranscript(t: TranscriptShape, blockMs: number): string {
  const out: string[] = [];
  let curStart = 0;
  let buf: string[] = [];
  for (const w of t.words) {
    if (w.start - curStart >= blockMs && buf.length > 0) {
      out.push(`[${(curStart / 1000).toFixed(1)}s] ${buf.join(" ")}`);
      buf = [];
      curStart = w.start;
    }
    buf.push(w.text);
  }
  if (buf.length > 0) out.push(`[${(curStart / 1000).toFixed(1)}s] ${buf.join(" ")}`);
  return out.join("\n");
}

function templateMoments(t: TranscriptShape): { platform: ClipDraft["platform"]; start_seconds: number; end_seconds: number; hook: string; caption: string }[] {
  // Fallback: 5 evenly spaced clips
  const dur = t.audio_duration;
  const platforms: ClipDraft["platform"][] = ["best", "instagram", "tiktok", "youtube", "facebook"];
  return platforms.map((p, i) => ({
    platform: p,
    start_seconds: Math.floor((dur / 6) * (i + 1)),
    end_seconds: Math.floor((dur / 6) * (i + 1) + 60),
    hook: "Highlight moment",
    caption: `From the latest episode — ${t.text.slice(0, 80)}…`,
  }));
}

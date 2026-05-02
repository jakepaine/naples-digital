import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createSponsorPitch } from "@naples/db";
import { getRequestTenantId } from "@naples/db/next";
import { generateMockPitch, SponsorPitch } from "@/lib/mock-pitch";

export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEM_PROMPT = `You write sponsorship one-pagers for Naples Digital × 239 Live Studios in Naples, FL. Given a sponsor company name and the show they'd sponsor (Billionaire Coast = Naples founders/finance, 239 Built = SWFL operators, SWFL Keys = lifestyle/culture), produce a custom one-page pitch with:
- audience_match: 3–5 sentence paragraph showing why the sponsor's customer base lines up with the show's audience. Be specific to Naples / SWFL. Use real-feeling demographic anchors.
- packages: an array of 3 tiers (Bronze $300/show, Silver $500/show, Gold $1000/show), each with 3–6 specific inclusions. Higher tiers include lower tiers' benefits.
- integration_ideas: 5 creative ways the sponsor can show up in the show beyond a basic logo placement — should feel like real ideas a great sponsor team would pay for.

Respond ONLY with valid JSON, no markdown fences. Schema: {"audience_match": "", "packages": [{"tier": "Bronze|Silver|Gold", "price_per_show": 300|500|1000, "inclusions": ["", ...]}], "integration_ideas": ["", ...]}`;

interface Body { sponsorName: string; show: string }

export async function POST(req: Request) {
  let body: Body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.sponsorName || !body.show) {
    return NextResponse.json({ error: "Missing sponsorName or show" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  let pitch: SponsorPitch;

  if (!apiKey) {
    pitch = generateMockPitch(body);
  } else {
    try {
      const client = new Anthropic({ apiKey });
      const userMsg = `Sponsor: ${body.sponsorName}. Show: ${body.show}. Generate the one-pager.`;
      const message = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMsg }],
      });
      const textBlock = message.content.find((c) => c.type === "text");
      if (!textBlock || textBlock.type !== "text") throw new Error("No text");
      const cleaned = textBlock.text.trim()
        .replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "");
      const parsed = JSON.parse(cleaned) as Omit<SponsorPitch, "source">;
      if (!parsed.audience_match || !parsed.packages || !parsed.integration_ideas) throw new Error("Invalid shape");
      pitch = { ...parsed, source: "api" };
    } catch {
      pitch = { ...generateMockPitch(body), source: "fallback" };
    }
  }

  const tid = await getRequestTenantId(req);
  const persisted = await createSponsorPitch(tid, {
    sponsor_name: body.sponsorName,
    show: body.show,
    audience_match: pitch.audience_match,
    package_recommendation: pitch.packages,
    integration_ideas: pitch.integration_ideas,
    source: pitch.source,
  });

  return NextResponse.json({ ...pitch, id: persisted?.id ?? null });
}

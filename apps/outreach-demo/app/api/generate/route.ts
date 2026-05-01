// Outreach email generator API.
// If ANTHROPIC_API_KEY is set, calls Claude Sonnet 4.6 with the system prompt
// from the original product spec. If not set (or call fails), falls back to a
// deterministic template so the live demo always renders 3 personalized emails.
//
// Note on model choice: the original spec specified `claude-sonnet-4-20250514`
// (May 2024 Sonnet, retired). Substituted with `claude-sonnet-4-6` which is the
// current Sonnet as of 2026-04-30 — best quality/cost/speed for cold outreach copy.

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { generateMockSequence } from "@/lib/mock-generator";

export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEM_PROMPT = `You are an expert cold outreach copywriter for Naples Digital, an AI automation agency in Southwest Florida. You write personalized cold outreach emails on behalf of 239 Live Studios — a premium podcast and media studio in Naples, FL. 239 Live offers studio rental sessions, monthly studio memberships, and show sponsorship packages (Bronze $300/show, Silver $500/show, Gold $1,000/show for Billionaire Coast — a high-end interview show featuring Naples billionaires, developers, and business leaders). Your emails are professional, specific, concise, and always reference something real about the prospect's business type and the Southwest Florida market. You never use generic openers like 'I hope this finds you well.' You write like a human who did their homework, not a mass email blast. Always include a specific CTA. Respond ONLY with valid JSON, nothing else, no markdown fences: {"email1": {"subject": "", "body": ""}, "email2": {"subject": "", "body": ""}, "email3": {"subject": "", "body": ""}}`;

interface RequestBody {
  businessName: string;
  businessType: string;
  outreachGoal: string;
}

export async function POST(req: Request) {
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { businessName, businessType, outreachGoal } = body;
  if (!businessName || !businessType || !outreachGoal) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    const sequence = generateMockSequence({ businessName, businessType, outreachGoal });
    return NextResponse.json({ ...sequence, source: "mock" });
  }

  try {
    const client = new Anthropic({ apiKey });
    const userMessage = `Generate a 3-email cold outreach sequence targeting ${businessName}, a ${businessType} in Southwest Florida. Outreach goal: ${outreachGoal}. Email 1 is the cold open (Day 1), Email 2 is a value-add follow-up (Day 4), Email 3 is a soft close with urgency (Day 8). Make each email distinct in angle and tone.`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = message.content.find((c) => c.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text content in API response");
    }

    const raw = textBlock.text.trim();
    // Defensive: strip any markdown fences if the model slips
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "");
    const parsed = JSON.parse(cleaned);

    if (!parsed.email1 || !parsed.email2 || !parsed.email3) {
      throw new Error("Invalid response shape from API");
    }

    return NextResponse.json({ ...parsed, source: "anthropic" });
  } catch (err) {
    // Fail soft — never let the demo screen show an error.
    const fallback = generateMockSequence({ businessName, businessType, outreachGoal });
    return NextResponse.json({
      ...fallback,
      source: "mock-fallback",
      _debug: err instanceof Error ? err.message : String(err),
    });
  }
}

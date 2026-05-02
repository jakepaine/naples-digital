import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getLeadById, cacheLeadAngle } from "@naples/db";
import { getRequestTenantId } from "@naples/db/next";
import { generateMockAngle, LeadAngle } from "@/lib/mock-angle";

export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEM_PROMPT = `You are a sales-intelligence assistant for Naples Digital, an AI agency in Naples FL working with 239 Live Studios. For each lead you're given, output a JSON object with three fields:
- summary: one sentence (max 200 chars) describing the company and why it's a fit for 239 Live's offer (studio rental, podcast sponsorship, content agency)
- hooks: array of 3 short angles (each ~80 chars) — specific, sharp, no fluff
- draft_dm: a 4-6 sentence cold DM written like a real human did the homework — concrete, no "I hope this finds you well", ends with a clear next step

Respond ONLY with valid JSON. No markdown fences. Schema: {"summary": "", "hooks": ["", "", ""], "draft_dm": ""}`;

interface Body { force?: boolean }

export async function POST(req: Request, { params }: { params: { id: string } }) {
  let body: Body = {};
  try { body = await req.json(); } catch {}

  const tid = await getRequestTenantId(req);
  const lead = await getLeadById(tid, params.id);
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  // Return cached angle if present (and caller didn't force regen)
  if (lead.ai_angle && !body.force) {
    return NextResponse.json(lead.ai_angle);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const angle = generateMockAngle({ name: lead.name, type: lead.type, goal: lead.goal });
    await cacheLeadAngle(tid, lead.id, angle);
    return NextResponse.json(angle);
  }

  try {
    const client = new Anthropic({ apiKey });
    const userMsg = `Lead: ${lead.name} — ${lead.type}. Outreach goal: ${lead.goal}. Lead source: ${lead.source}. Generate the angle.`;
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMsg }],
    });

    const textBlock = message.content.find((c) => c.type === "text");
    if (!textBlock || textBlock.type !== "text") throw new Error("No text in response");
    const cleaned = textBlock.text.trim()
      .replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "");
    const parsed = JSON.parse(cleaned) as Omit<LeadAngle, "source">;
    if (!parsed.summary || !parsed.hooks || !parsed.draft_dm) throw new Error("Invalid shape");
    const angle: LeadAngle = { ...parsed, source: "api" };
    await cacheLeadAngle(tid, lead.id, angle);
    return NextResponse.json(angle);
  } catch {
    const angle = generateMockAngle({ name: lead.name, type: lead.type, goal: lead.goal });
    angle.source = "fallback";
    await cacheLeadAngle(tid, lead.id, angle);
    return NextResponse.json(angle);
  }
}

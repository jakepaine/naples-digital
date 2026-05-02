import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  getLeadById, listLeadEmails, createSequence, markSequencePushed,
  createEmailSend, getLatestEnrichment,
} from "@naples/db";
import { getRequestTenantId } from "@naples/db/next";
import { getOutreachVendorForTenant } from "@naples/outreach";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You write personalized 3-email cold outreach sequences. For the lead provided, output ONLY valid JSON, no markdown fences. Schema:
{"emails":[{"step":1,"subject":"","body":"","delay_days":0},{"step":2,"subject":"","body":"","delay_days":3},{"step":3,"subject":"","body":"","delay_days":4}]}
Email 1 = cold open Day 1. Email 2 = value-add Day 4. Email 3 = soft close Day 8. Each email is concrete, references the lead's company, and never says "I hope this finds you well." Always include a clear CTA in email 1 and 3.`;

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const tid = await getRequestTenantId(req);
  const lead = await getLeadById(tid, params.id);
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const emailsList = await listLeadEmails(tid, params.id);
  const primary = emailsList.find(e => e.primary_address) ?? emailsList[0];
  if (!primary) return NextResponse.json({ error: "Lead has no email" }, { status: 400 });

  const enrichment = await getLatestEnrichment(tid, params.id);

  // Generate the 3-email sequence with Claude (or fall back to a simple template)
  let drafts: Array<{ step: number; subject: string; body: string; delay_days: number }>;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      const client = new Anthropic({ apiKey });
      const userMsg = `Lead: ${lead.name} — ${lead.type}. Goal: ${lead.goal}. Source: ${lead.source}.${enrichment ? ` Enrichment data: ${JSON.stringify(enrichment.raw).slice(0, 1000)}` : ""}`;
      const message = await client.messages.create({
        model: "claude-sonnet-4-6", max_tokens: 2000, system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMsg }],
      });
      const block = message.content.find(c => c.type === "text");
      if (!block || block.type !== "text") throw new Error("No text");
      const cleaned = block.text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "");
      const parsed = JSON.parse(cleaned) as { emails: Array<{ step: number; subject: string; body: string; delay_days: number }> };
      drafts = parsed.emails;
    } catch {
      drafts = templateSequence(lead.name, lead.type, lead.goal);
    }
  } else {
    drafts = templateSequence(lead.name, lead.type, lead.goal);
  }

  // Persist as a draft sequence first
  const vendor = await getOutreachVendorForTenant(tid);
  const sequence = await createSequence(tid, {
    lead_id: params.id,
    vendor: vendor?.kind ?? "manual",
    emails: drafts,
  });
  if (!sequence) return NextResponse.json({ error: "Sequence create failed" }, { status: 500 });

  // If we have a configured vendor and the caller asked to push, push it
  const body = await req.json().catch(() => ({})) as { push?: boolean };
  if (body.push && vendor) {
    try {
      const pushResult = await vendor.pushSequence({
        leadEmail: primary.email,
        leadName: lead.name,
        leadCompany: lead.name,
        emails: drafts,
        campaignId: undefined, // resolved by the vendor implementation from its config
      });
      await markSequencePushed(tid, sequence.id, pushResult.externalId);
      // Record placeholder email_sends rows so the timeline is populated
      for (const draft of drafts) {
        await createEmailSend(tid, {
          sequence_id: sequence.id,
          lead_id: params.id,
          lead_email: primary.email,
          step: draft.step,
        });
      }
      return NextResponse.json({ sequence, pushed: true, externalId: pushResult.externalId, vendor: vendor.kind });
    } catch (e) {
      return NextResponse.json({
        sequence, pushed: false, vendor: vendor.kind,
        error: e instanceof Error ? e.message : "Push failed — vendor likely needs campaign_id in tenant_integrations.config",
      }, { status: 502 });
    }
  }

  return NextResponse.json({ sequence, pushed: false, vendor: vendor?.kind ?? null });
}

function templateSequence(name: string, type: string, goal: string) {
  return [
    { step: 1, subject: `Quick question about ${name}`, body: `Hi — saw you're working on ${goal} at ${name}. We help ${type.toLowerCase()}s like you with the same exact thing. Open to a 15-min look at what we do?`, delay_days: 0 },
    { step: 2, subject: `One thing I forgot to mention`, body: `Following up on my note from earlier — wanted to share a one-pager of how we'd approach ${goal} for ${name}. Worth a look?`, delay_days: 3 },
    { step: 3, subject: `Closing the loop`, body: `Last note. If ${goal} is still on your radar, happy to send the case study and step away if not. Either way, hope ${name} crushes Q2.`, delay_days: 4 },
  ];
}

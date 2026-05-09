import Anthropic from "@anthropic-ai/sdk";

export interface ProposalDraft {
  title: string;
  intro: string;
  scope_items: string[];
  deliverables: { title: string; description: string }[];
  pricing: { line_item: string; amount_cents: number }[];
  timeline_weeks: number;
  notes: string;
}

const SYSTEM = `You are a senior proposal writer for a B2B service business. Generate a
clear, concise client proposal from a lead's context. The output must be
JSON only, no preamble, matching this exact shape:

{
  "title": "Engagement Proposal — <Client Name>",
  "intro": "1-2 paragraph opener acknowledging the client's situation and stating the engagement's intent.",
  "scope_items": ["3-7 short bullets describing what's in scope"],
  "deliverables": [
    { "title": "Deliverable name", "description": "1-2 sentence description" }
  ],
  "pricing": [
    { "line_item": "Setup fee (one-time)", "amount_cents": 250000 },
    { "line_item": "Monthly retainer (3-month minimum)", "amount_cents": 99700 }
  ],
  "timeline_weeks": 4,
  "notes": "Optional 1-2 sentence note (e.g. assumptions, what's NOT included, payment terms)."
}

Rules:
- Use the lead's stated value as the anchor for pricing. If unclear, infer
  a sensible setup + monthly split.
- 3-7 scope_items, 2-4 deliverables, 1-3 pricing line items.
- All amounts in CENTS (integers).
- Tone: professional, declarative, no fluff. No "we believe" or "we are
  excited" — direct sentences only.`;

export interface LeadContext {
  name: string | null;
  primary_email: string | null;
  domain: string | null;
  type: string | null;
  goal: string | null;
  value: number | null;
  source: string | null;
  ai_angle: any;
}

export async function draftProposal(args: {
  lead: LeadContext;
  tenantName: string;
}): Promise<ProposalDraft> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return deterministicDraft(args);

  const client = new Anthropic({ apiKey });
  const userMsg = JSON.stringify({
    company:
      args.lead.ai_angle?.headline ??
      args.lead.domain ??
      args.lead.name ??
      "Client",
    contact_name: args.lead.name,
    contact_email: args.lead.primary_email,
    type: args.lead.type,
    goal: args.lead.goal,
    quoted_value_usd: args.lead.value,
    source: args.lead.source,
    angle: args.lead.ai_angle,
    sender_company: args.tenantName,
  });

  try {
    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 3000,
      system: SYSTEM,
      messages: [
        { role: "user", content: `Lead context:\n${userMsg}\n\nReturn the proposal JSON.` },
      ],
    });
    const text = res.content
      .filter((b) => b.type === "text")
      .map((b: any) => b.text)
      .join("");
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    return normalizeDraft(parsed, args);
  } catch (e) {
    console.error("draft failed, falling back:", (e as Error).message);
    return deterministicDraft(args);
  }
}

function normalizeDraft(parsed: any, args: { lead: LeadContext; tenantName: string }): ProposalDraft {
  const fallback = deterministicDraft(args);
  return {
    title: String(parsed.title ?? fallback.title),
    intro: String(parsed.intro ?? fallback.intro),
    scope_items: Array.isArray(parsed.scope_items)
      ? parsed.scope_items.map(String).slice(0, 7)
      : fallback.scope_items,
    deliverables: Array.isArray(parsed.deliverables)
      ? parsed.deliverables.slice(0, 4).map((d: any) => ({
          title: String(d.title ?? "Deliverable"),
          description: String(d.description ?? ""),
        }))
      : fallback.deliverables,
    pricing: Array.isArray(parsed.pricing)
      ? parsed.pricing.slice(0, 3).map((p: any) => ({
          line_item: String(p.line_item ?? "Service"),
          amount_cents: Math.max(0, Math.floor(Number(p.amount_cents ?? 0))),
        }))
      : fallback.pricing,
    timeline_weeks: Math.max(
      1,
      Math.floor(Number(parsed.timeline_weeks ?? fallback.timeline_weeks)),
    ),
    notes: String(parsed.notes ?? fallback.notes),
  };
}

function deterministicDraft(args: { lead: LeadContext; tenantName: string }): ProposalDraft {
  const company =
    args.lead.ai_angle?.headline ?? args.lead.domain ?? args.lead.name ?? "Client";
  const valueUsd = Number(args.lead.value ?? 1500);
  return {
    title: `Engagement Proposal — ${company}`,
    intro: `${company} is looking to ${args.lead.goal ?? "improve operational efficiency"}. ${args.tenantName} will set up the systems described below and operate them on an ongoing basis.`,
    scope_items: [
      "Discovery + onboarding interviews",
      "Tooling setup and integrations",
      "Standard operating procedures documented",
      "Weekly review + adjustment cadence",
    ],
    deliverables: [
      {
        title: "Operating system",
        description: "All workflows wired into your existing tools, ready to run.",
      },
      {
        title: "Documentation + handover",
        description: "Written SOPs your team can run without us.",
      },
    ],
    pricing: [
      {
        line_item: "Setup + onboarding (one-time)",
        amount_cents: Math.round(valueUsd * 100 * 0.66),
      },
      {
        line_item: "Monthly retainer (3-month minimum)",
        amount_cents: Math.round(valueUsd * 100 * 0.34),
      },
    ],
    timeline_weeks: 4,
    notes:
      "Pricing assumes the scope above. Out-of-scope work is billed separately at $200/hr. Invoices are net-7 terms via Stripe.",
  };
}

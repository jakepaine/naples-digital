import Anthropic from "@anthropic-ai/sdk";
import type { LineItem } from "./format";
import type { WonLead } from "./won-leads";

export interface DraftInvoice {
  description: string;
  lineItems: LineItem[];
  notes: string;
}

const SYSTEM = `You generate invoice drafts for service-business engagements.

Return ONLY a JSON object matching:
{
  "description": "1-line invoice memo (~80 chars)",
  "lineItems": [
    { "description": "...", "quantity": 1, "unitAmountCents": 250000 }
  ],
  "notes": "1-2 sentences for the customer's notes field"
}

Rules:
- 1 to 4 line items max.
- Use the lead's stated value if present; otherwise infer a sensible setup + monthly split.
- All amounts in CENTS (integers).
- Tone: professional, terse, no preamble.`;

export async function draftInvoiceFromLead(lead: WonLead): Promise<DraftInvoice> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return deterministicDraft(lead);

  const client = new Anthropic({ apiKey });
  const userMsg = JSON.stringify({
    company: lead.ai_angle?.headline ?? lead.domain ?? "client",
    contact_name: lead.name,
    contact_email: lead.primary_email,
    type: lead.type,
    goal: lead.goal,
    quoted_value_usd: lead.value,
    source: lead.source,
    angle: lead.ai_angle,
  });

  try {
    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `Lead context (JSON):\n${userMsg}\n\nReturn the invoice draft JSON.`,
        },
      ],
    });
    const text = res.content
      .filter((b) => b.type === "text")
      .map((b: any) => b.text)
      .join("");
    // Strip markdown fences if Claude wrapped output
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned) as DraftInvoice;
    if (!Array.isArray(parsed.lineItems) || parsed.lineItems.length === 0) {
      return deterministicDraft(lead);
    }
    return {
      description: String(parsed.description ?? `Engagement — ${lead.name ?? "client"}`),
      lineItems: parsed.lineItems.map((li) => ({
        description: String(li.description ?? "Service"),
        quantity: Math.max(1, Math.floor(Number(li.quantity ?? 1))),
        unitAmountCents: Math.max(0, Math.floor(Number(li.unitAmountCents ?? 0))),
      })),
      notes: String(parsed.notes ?? ""),
    };
  } catch {
    return deterministicDraft(lead);
  }
}

// Deterministic fallback when Claude is unavailable or returns garbage.
function deterministicDraft(lead: WonLead): DraftInvoice {
  const company = lead.ai_angle?.headline ?? lead.domain ?? "Client";
  const valueUsd = Number(lead.value ?? 1500);
  // Heuristic: ~⅔ setup, ~⅓ first month — matches the agency-tier defaults.
  const setupCents = Math.round(valueUsd * 100 * 0.66);
  const monthlyCents = Math.round(valueUsd * 100 * 0.34);
  return {
    description: `Naples Digital engagement — ${company}`,
    lineItems: [
      {
        description: "Setup + onboarding (one-time)",
        quantity: 1,
        unitAmountCents: setupCents,
      },
      {
        description: "First-month subscription",
        quantity: 1,
        unitAmountCents: monthlyCents,
      },
    ],
    notes: "Thanks for partnering with Naples Digital. Reply to this invoice with any questions.",
  };
}

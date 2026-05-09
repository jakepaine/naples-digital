import Anthropic from "@anthropic-ai/sdk";
import {
  type Category,
  CATEGORY_DESCRIPTIONS,
  isValidCategory,
} from "./categories";
import type { EmailRow } from "./inbox-query";

// Prompt structure follows Nick Saraev's MakerSchool "Worthwhile-default"
// pattern: bias the model to keep ambiguous mail in the high-priority lane.
// Better to flag a junk email as priority than miss a real lead.
const SYSTEM = `You are an inbox triage classifier for a B2B SaaS platform whose tenants are
service businesses (bookkeepers, inspectors, consultants, agencies, real-estate
ops). Each tenant founder receives 50-150 emails/day and needs them sorted into
five lanes so they only manually read the lane that matters.

Categories (mutually exclusive):
${Object.entries(CATEGORY_DESCRIPTIONS)
  .map(([k, v]) => `- ${k}: ${v}`)
  .join("\n")}

Score (0-100, urgency to the founder):
- 80-100  drop everything (signed deal, urgent client, hot prospect)
- 60-79   reply within a few hours
- 40-59   reply today
- 20-39   reply this week
- 0-19    safe to ignore / archive

CRITICAL — when uncertain, default to high_priority. Missing a real lead in the
noise costs the tenant $1k+. Flagging a junk email as priority costs them 5
seconds. The model should err toward keeping signal IN the high-priority lane.

Return strict JSON ONLY, no preamble:
{ "category": "<one of the five>", "score": <integer 0-100>, "reason": "<one short sentence>" }`;

export interface ClassifyResult {
  category: Category;
  score: number;
  reason: string;
}

// Deterministic fallback for no-API-key / CI / Claude unreachable.
// Heuristic-only — order matters (most specific patterns first).
export function deterministicClassify(email: {
  subject: string;
  preview?: string | null;
  from_email: string;
}): ClassifyResult {
  const text = `${email.subject ?? ""} ${email.preview ?? ""}`.toLowerCase();
  const sender = email.from_email.toLowerCase();

  if (
    /unsubscribe|newsletter|digest|claim|airdrop|wallet|nigerian|prince|crypto|usdt/.test(
      text,
    )
  ) {
    if (/airdrop|wallet|usdt|nigerian|claim/.test(text)) {
      return { category: "spam", score: 5, reason: "Crypto/scam pattern." };
    }
    return {
      category: "newsletter",
      score: 10,
      reason: "Bulk digest, no personalization.",
    };
  }
  if (
    /(invoice|receipt|payout|payment confirmation|charged|billed|statement)/.test(
      text,
    ) ||
    /no.?reply@(stripe|quickbooks|xero|wise|mercury|chase|relay)/.test(sender)
  ) {
    return {
      category: "billing",
      score: 25,
      reason: "Receipt or payout notification.",
    };
  }
  if (/(partnership|affiliate|co.?market|sponsor|collab|guest post)/.test(text)) {
    return {
      category: "partnerships",
      score: 35,
      reason: "Inbound partnership pitch — review later.",
    };
  }
  if (/(agreement|contract|moving forward|next step|signed|kickoff|deposit)/.test(text)) {
    return {
      category: "high_priority",
      score: 90,
      reason: "Sales/contract progression — drop everything.",
    };
  }
  if (/(broken|wrong|issue|bug|not working|down|outage|urgent|asap)/.test(text)) {
    return {
      category: "high_priority",
      score: 80,
      reason: "Active client or escalation language.",
    };
  }
  // Worthwhile-default: ambiguous → high_priority at moderate urgency.
  return {
    category: "high_priority",
    score: 50,
    reason: "Default to attention; ambiguous content.",
  };
}

export async function classifyEmail(
  email: Pick<EmailRow, "subject" | "preview" | "from_email" | "from_name" | "body_text">,
): Promise<ClassifyResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return deterministicClassify(email);
  }
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  try {
    const userMsg = [
      `From: ${email.from_name ?? ""} <${email.from_email}>`,
      `Subject: ${email.subject}`,
      `Body:`,
      (email.body_text ?? email.preview ?? "").slice(0, 4000),
    ].join("\n");

    const result = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 256,
      system: SYSTEM,
      messages: [{ role: "user", content: userMsg }],
    });
    const text = result.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("");
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const json = JSON.parse(cleaned);
    const cat = isValidCategory(json.category) ? json.category : "high_priority";
    const score = Math.max(0, Math.min(100, Number(json.score) || 50));
    const reason = String(json.reason ?? "");
    return { category: cat, score, reason };
  } catch {
    return deterministicClassify(email);
  }
}

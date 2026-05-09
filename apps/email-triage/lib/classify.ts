import Anthropic from "@anthropic-ai/sdk";
import type { Category, MockEmail } from "./mock-emails";

const SYSTEM = `You are an inbox triage classifier for a B2B SaaS platform serving service
businesses. Classify each email into exactly one category and a 0-100 score
indicating how urgent it is for the tenant founder.

Categories (mutually exclusive):
- high_priority   active sales conversations, signed contracts, urgent client issues
- partnerships    inbound partnership/affiliate/co-marketing pitches
- support         existing tenant/customer reporting an issue or question
- newsletter      subscriptions, digests, marketing email
- spam            clearly low-effort blast, scam, phishing

Score:
- 80-100  drop everything
- 60-79   reply within a few hours
- 40-59   reply today
- 20-39   reply this week
- 0-19    safe to ignore / archive

Return strict JSON: { "category": "...", "score": N, "reason": "<one sentence>" }`;

export interface ClassifyResult {
  category: Category;
  score: number;
  reason: string;
}

/** Deterministic fallback for offline/CI/no-API-key. */
export function deterministicClassify(email: MockEmail): ClassifyResult {
  const text = `${email.subject} ${email.preview}`.toLowerCase();
  if (
    /unsubscribe|newsletter|digest|claim|airdrop|wallet|nigerian|prince/.test(
      text,
    )
  )
    return text.includes("airdrop") || text.includes("wallet")
      ? { category: "spam", score: 5, reason: "Crypto-style phishing pattern." }
      : {
          category: "newsletter",
          score: 10,
          reason: "Bulk digest, no personalization.",
        };
  if (/(partnership|affiliate|co.?market|sponsor)/.test(text))
    return {
      category: "partnerships",
      score: 35,
      reason: "Inbound partnership pitch — review later.",
    };
  if (/(broken|wrong|issue|bug|not working|down)/.test(text))
    return {
      category: "support",
      score: 75,
      reason: "Active tenant reporting an issue.",
    };
  if (/(agreement|contract|moving forward|next step|signed|payment)/.test(text))
    return {
      category: "high_priority",
      score: 90,
      reason: "Sales/contract progression — drop everything.",
    };
  return {
    category: "high_priority",
    score: 50,
    reason: "Default to attention; ambiguous content.",
  };
}

export async function classifyEmail(
  email: MockEmail,
): Promise<ClassifyResult> {
  if (!process.env.ANTHROPIC_API_KEY) return deterministicClassify(email);
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  try {
    const result = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 256,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `From: ${email.fromName} <${email.fromEmail}>\nSubject: ${email.subject}\nPreview: ${email.preview}`,
        },
      ],
    });
    const text = result.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("");
    const json = JSON.parse(text.replace(/^```(json)?|```$/g, "").trim());
    return {
      category: json.category as Category,
      score: Math.max(0, Math.min(100, Number(json.score) || 50)),
      reason: String(json.reason ?? ""),
    };
  } catch {
    return deterministicClassify(email);
  }
}

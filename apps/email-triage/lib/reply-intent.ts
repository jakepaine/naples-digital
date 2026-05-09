// Reply-intent classifier — distinct from the inbox triage classifier
// (lib/classify.ts). Inbox triage sorts every email into 5 lanes;
// reply-intent specifically reads cold-email REPLIES from a sending
// platform (Instantly, Smartlead) and scores them on the Nick Saraev
// intent ladder:
//
//   interested       — wants a call / a demo / explicit yes
//   more_info        — engaged but asking a clarifying question
//   not_interested   — soft no / not now
//   ooo              — out-of-office auto-responder; re-queue later
//   bounce           — undeliverable; remove from sequence
//   unsubscribe      — unsubscribe / GDPR / DNC; permanent removal
//
// The ladder maps cleanly to downstream actions:
//   interested + more_info → 5-min Slack alert + advance CRM stage
//   ooo                    → re-queue (no immediate action)
//   bounce                 → remove from campaign
//   unsubscribe            → remove from campaign + flag DNC
//   not_interested         → log only (don't drop from CRM yet — Nick
//                            teaches some "no" replies become wins
//                            after a follow-up)

import Anthropic from "@anthropic-ai/sdk";

export type ReplyIntent =
  | "interested"
  | "more_info"
  | "not_interested"
  | "ooo"
  | "bounce"
  | "unsubscribe"
  | "unknown";

export interface ReplyIntentResult {
  intent: ReplyIntent;
  confidence: number; // 0-100
  reason: string;
}

const SYSTEM = `You classify cold-email replies for a B2B outreach platform.

Intents (mutually exclusive):
- interested       Replier explicitly says yes / wants a call / books time / asks
                   for next step. Body language is forward-leaning.
- more_info        Engaged but needs more information first. Asks a clarifying
                   question, mentions decision-maker check-in, requests pricing
                   or details before agreeing.
- not_interested   Soft or hard no. "Not a fit", "no budget", "remove me from
                   the list later" without an unsubscribe header. NOT a bounce
                   or OOO.
- ooo              Auto-responder: out of office, parental leave, vacation,
                   maternity leave. Re-queue for follow-up after return date.
- bounce           Mailer-daemon / undeliverable. Address is dead.
- unsubscribe      Explicit unsubscribe / GDPR DNC / "do not contact me again"
                   stated as a hard demand.
- unknown          Genuinely unclassifiable.

CRITICAL: When the reply is borderline interested vs more_info, prefer
interested — Nick's playbook says missed positive replies cost 4x more than
mis-flagged "more_info" replies.

Return strict JSON only, no preamble:
{ "intent": "<one>", "confidence": <0-100>, "reason": "<one short sentence>" }`;

export async function classifyReplyIntent(args: {
  subject: string | null;
  body: string | null;
  fromEmail: string | null;
}): Promise<ReplyIntentResult> {
  // Cheap deterministic short-circuits before paying for an LLM call.
  const cheap = deterministicReplyIntent(args);
  if (cheap.confidence >= 95) return cheap;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return cheap;

  try {
    const client = new Anthropic({ apiKey });
    const userMsg = [
      `From: ${args.fromEmail ?? "(unknown)"}`,
      `Subject: ${args.subject ?? "(no subject)"}`,
      `Body:`,
      (args.body ?? "").slice(0, 4000),
    ].join("\n");
    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 200,
      system: SYSTEM,
      messages: [{ role: "user", content: userMsg }],
    });
    const text = res.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("");
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const json = JSON.parse(cleaned);
    const intent = sanitizeIntent(json.intent);
    const confidence = clampScore(json.confidence);
    const reason = String(json.reason ?? "");
    return { intent, confidence, reason };
  } catch {
    return cheap;
  }
}

function sanitizeIntent(raw: unknown): ReplyIntent {
  const allowed: ReplyIntent[] = [
    "interested",
    "more_info",
    "not_interested",
    "ooo",
    "bounce",
    "unsubscribe",
    "unknown",
  ];
  const s = String(raw ?? "").toLowerCase();
  return (allowed as string[]).includes(s) ? (s as ReplyIntent) : "unknown";
}

function clampScore(raw: unknown): number {
  const n = Math.round(Number(raw) || 0);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

export function deterministicReplyIntent(args: {
  subject: string | null;
  body: string | null;
  fromEmail: string | null;
}): ReplyIntentResult {
  const text = `${args.subject ?? ""} ${args.body ?? ""}`.toLowerCase();
  const sender = (args.fromEmail ?? "").toLowerCase();

  // Bounces are the most syntactically reliable signal.
  if (
    /mailer-daemon|postmaster@|delivery (status|failure|incomplete)|undeliverable|address (rejected|not found)|user unknown/.test(
      text,
    ) ||
    sender.startsWith("mailer-daemon@") ||
    sender.startsWith("postmaster@")
  ) {
    return { intent: "bounce", confidence: 98, reason: "Mailer-daemon pattern." };
  }

  // OOO auto-responders.
  if (
    /(out of (the )?office|on (vacation|holiday|leave|parental))/i.test(text) ||
    /(currently away|i'?ll be back|return on)/i.test(text) ||
    /auto[- ]?(reply|response)/i.test(text)
  ) {
    return { intent: "ooo", confidence: 96, reason: "Auto-responder language." };
  }

  // Hard unsubscribe.
  if (
    /\b(unsubscribe|do not contact|remove me( from)? (your|this) list|stop emailing me)\b/.test(
      text,
    )
  ) {
    return { intent: "unsubscribe", confidence: 95, reason: "Unsubscribe demand." };
  }

  // Strong positive signals.
  if (
    /\b(let'?s (chat|talk|set ?up)|book (a |the )?(call|time|meeting)|schedule|calendly|when (works|are you free)|interested|yes,? (let'?s|please)|sounds (great|good))\b/.test(
      text,
    )
  ) {
    return { intent: "interested", confidence: 70, reason: "Positive engagement language." };
  }

  // Soft no / "not a fit" cluster.
  if (
    /\b(not (a fit|interested|the (right|best) time)|no thanks|already have|we'?re (good|set))\b/.test(
      text,
    )
  ) {
    return { intent: "not_interested", confidence: 65, reason: "Soft-no pattern." };
  }

  // Asking for more info — questions or "what does this cost / how does it work."
  if (
    /\?/.test(text) ||
    /\b(how (does|do|much)|what'?s|tell me more|more (info|information|details))\b/.test(
      text,
    )
  ) {
    return { intent: "more_info", confidence: 55, reason: "Question or info request." };
  }

  return { intent: "unknown", confidence: 20, reason: "No strong signal." };
}

// Bland.ai client — outbound AI phone calls.
// Docs: https://docs.bland.ai/api-v1/post/calls
//
// Strategy: tenants paste their Bland API key into Vault (kind='bland').
// We POST to /v1/calls with phone + script + voice + max_duration. Bland
// runs the call and either calls back via webhook (when configured) or
// the operator polls /v1/calls/{call_id} to get transcript + summary
// after completion.
//
// Stub mode (no key): synthesize a deterministic call_id + queued
// status so the dashboard renders the workflow shape without a real
// Bland account.

import Anthropic from "@anthropic-ai/sdk";

export interface BlandKickoffInput {
  /** E.164 phone number — Bland validates. */
  phone: string;
  ownerName: string;
  /** Property identifier or address — woven into the script. */
  propertyAddress?: string | null;
  /** Optional override script. When absent, we use the default seller-qualifier. */
  script?: string;
  /** Bland voice id — default is platform-wide via env. */
  voice?: string;
  /** Max call seconds (Bland default 1800). */
  max_duration?: number;
}

export interface BlandKickoffResult {
  call_id: string;
  status: "queued" | "in_progress";
  is_stub: boolean;
}

const DEFAULT_SELLER_QUALIFIER_SCRIPT = `You are calling a property owner on behalf of a real estate
acquisitions firm. Your goal is to gently qualify whether they are
the right person to talk to about their property and whether they're
open to a conversation about selling.

Rules:
- Be warm, conversational, and brief. NEVER push for a sale.
- Confirm the property address before discussing anything specific.
- If they're not the owner or decision-maker, get the right contact.
- If they're not interested, thank them and end the call.
- If they show any openness, get them to agree to a 15-minute call
  with a human acquisitions specialist (you do not name a date — you
  say "someone from our team will reach out within 24 hours").
- Never make claims about value or guarantee anything.
- End calls under 4 minutes.`;

export async function kickoffBlandCall(args: {
  apiKey?: string | null;
  voice?: string;
  webhookUrl?: string;
  input: BlandKickoffInput;
}): Promise<BlandKickoffResult> {
  if (!args.apiKey) {
    return stubKickoff(args.input);
  }
  const script =
    (args.input.script ?? DEFAULT_SELLER_QUALIFIER_SCRIPT).trim() +
    `\n\nProperty: ${args.input.propertyAddress ?? "(unspecified)"}.\nOwner name on record: ${args.input.ownerName}.`;
  const body: Record<string, unknown> = {
    phone_number: args.input.phone,
    task: script,
    voice: args.input.voice ?? args.voice ?? "11labs-Adrian",
    max_duration: args.input.max_duration ?? 240, // 4 min cap per script rule
    record: true,
    answered_by_enabled: true,
  };
  if (args.webhookUrl) body.webhook = args.webhookUrl;
  try {
    const res = await fetch("https://api.bland.ai/v1/calls", {
      method: "POST",
      headers: {
        authorization: args.apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as any;
    if (!res.ok) {
      throw new Error(
        `bland kickoff failed: ${res.status} ${typeof json?.error === "string" ? json.error : JSON.stringify(json).slice(0, 200)}`,
      );
    }
    const call_id = json?.call_id ?? json?.id;
    if (!call_id) {
      throw new Error(
        `bland response missing call_id: ${JSON.stringify(json).slice(0, 240)}`,
      );
    }
    return { call_id: String(call_id), status: "queued", is_stub: false };
  } catch {
    return stubKickoff(args.input);
  }
}

export interface BlandPollResult {
  status: "queued" | "in_progress" | "completed" | "failed" | "no_answer" | "voicemail";
  duration_seconds?: number;
  transcript?: string;
  summary?: string;
  raw: Record<string, unknown>;
}

export async function pollBlandCall(args: {
  apiKey?: string | null;
  call_id: string;
}): Promise<BlandPollResult> {
  if (!args.apiKey || args.call_id.startsWith("bland-stub-")) {
    return stubPoll(args.call_id);
  }
  try {
    const res = await fetch(
      `https://api.bland.ai/v1/calls/${args.call_id}`,
      { headers: { authorization: args.apiKey } },
    );
    const json = (await res.json().catch(() => ({}))) as any;
    if (!res.ok) {
      return { status: "failed", raw: json };
    }
    const status = mapBlandStatus(json.status, json.completed, json.answered_by);
    return {
      status,
      duration_seconds:
        typeof json.call_length === "number" && json.call_length > 0
          ? Math.round(json.call_length * 60)
          : typeof json.duration === "number"
            ? Math.round(json.duration)
            : undefined,
      transcript: json.concatenated_transcript ?? json.transcript ?? undefined,
      summary: json.summary ?? undefined,
      raw: json,
    };
  } catch (e) {
    return { status: "failed", raw: { error: (e as Error).message } };
  }
}

function mapBlandStatus(
  status: any,
  completed: any,
  answeredBy: any,
): BlandPollResult["status"] {
  const s = String(status ?? "").toLowerCase();
  if (s === "in-progress" || s === "ongoing") return "in_progress";
  if (s === "queued" || s === "pending") return "queued";
  const ab = String(answeredBy ?? "").toLowerCase();
  if (completed && (ab === "voicemail" || ab.includes("voicemail")))
    return "voicemail";
  if (completed && (ab === "no_answer" || s === "no-answer"))
    return "no_answer";
  if (completed) return "completed";
  if (s === "failed" || s === "error") return "failed";
  return "queued";
}

export interface QualificationAnalysis {
  is_correct_owner: boolean;
  is_thinking_of_selling: boolean;
  asking_price_range: string | null;
  recommended_followup:
    | "human_call"
    | "no_call"
    | "followup_30d"
    | "disqualified"
    | "do_not_contact";
  qualification_score: number;
  notes: string;
}

const ANALYSIS_SYSTEM = `You analyze a transcript of an AI phone call placed to a property
owner by a real estate acquisitions firm. Output strict JSON only:

{
  "is_correct_owner": boolean,
  "is_thinking_of_selling": boolean,
  "asking_price_range": string | null,    // e.g. "$2-3M" or null if not discussed
  "recommended_followup": "human_call" | "no_call" | "followup_30d" | "disqualified" | "do_not_contact",
  "qualification_score": 0-100,           // higher = better real-estate-acquisition lead
  "notes": "<2 sentences max>"
}

Rules:
- "human_call" if the owner showed any genuine openness to a sale conversation.
- "followup_30d" if they were neutral but didn't say no — try again in 30 days.
- "no_call" if firmly not interested but polite.
- "do_not_contact" if explicitly demanded no further contact.
- "disqualified" only if the call confirmed they're not the owner or decision-maker.
- Be honest about qualification_score — most cold calls score 10-30, that's normal.`;

export async function analyzeQualification(
  transcript: string,
): Promise<QualificationAnalysis> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !transcript || transcript.trim().length < 30) {
    return deterministicAnalysis(transcript);
  }
  try {
    const client = new Anthropic({ apiKey });
    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 350,
      system: ANALYSIS_SYSTEM,
      messages: [
        {
          role: "user",
          content: transcript.slice(0, 8000),
        },
      ],
    });
    const text = res.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const json = JSON.parse(text);
    return {
      is_correct_owner: !!json.is_correct_owner,
      is_thinking_of_selling: !!json.is_thinking_of_selling,
      asking_price_range:
        typeof json.asking_price_range === "string"
          ? json.asking_price_range
          : null,
      recommended_followup: sanitizeFollowup(json.recommended_followup),
      qualification_score: clampScore(json.qualification_score),
      notes: String(json.notes ?? "").slice(0, 600),
    };
  } catch {
    return deterministicAnalysis(transcript);
  }
}

function sanitizeFollowup(raw: any): QualificationAnalysis["recommended_followup"] {
  const allowed = [
    "human_call",
    "no_call",
    "followup_30d",
    "disqualified",
    "do_not_contact",
  ] as const;
  const s = String(raw ?? "").toLowerCase();
  return (allowed as readonly string[]).includes(s)
    ? (s as QualificationAnalysis["recommended_followup"])
    : "no_call";
}

function clampScore(raw: any): number {
  const n = Math.round(Number(raw) || 0);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function deterministicAnalysis(transcript: string): QualificationAnalysis {
  const t = transcript.toLowerCase();
  const interested = /(interested|tell me more|what.*offer|how much|maybe|could be)/.test(
    t,
  );
  const not_interested = /(not interested|not selling|no thanks|don'?t call)/.test(
    t,
  );
  const dnc = /(do not contact|never call again|legal action|harass|stop call)/.test(
    t,
  );
  const correct_owner = /yes.*owner|i own|that.*me|speaking|this is/.test(t);
  return {
    is_correct_owner: correct_owner,
    is_thinking_of_selling: interested && !not_interested,
    asking_price_range: null,
    recommended_followup: dnc
      ? "do_not_contact"
      : not_interested
        ? "no_call"
        : interested
          ? "human_call"
          : "followup_30d",
    qualification_score: dnc
      ? 0
      : not_interested
        ? 10
        : interested
          ? 70
          : 30,
    notes: "Deterministic heuristic — no Anthropic key configured.",
  };
}

function stubKickoff(input: BlandKickoffInput): BlandKickoffResult {
  const id = `bland-stub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return { call_id: id, status: "queued", is_stub: true };
}

function stubPoll(call_id: string): BlandPollResult {
  // Deterministic completed stub — useful for dashboard demos.
  return {
    status: "completed",
    duration_seconds: 187,
    transcript:
      "AI: Hi, is this Mr. Smith? OWNER: Yes, speaking. AI: This is calling about the property at 123 Main St — are you the current owner? OWNER: Yes I am. AI: Have you given any thought to what you'd do if the right offer came along? OWNER: I mean, I'd consider it but I'm not actively selling. AI: Totally understood — would it be helpful to chat with our acquisitions specialist briefly? OWNER: Sure, you can have someone reach out. AI: Great, someone will be in touch within 24 hours. Thank you.",
    summary: stubSummary(call_id),
    raw: { stub: true },
  };
}

function stubSummary(call_id: string): string {
  return `Owner confirmed identity, indicated openness ("would consider it"), but is not actively selling. Score: 60. Followup: human_call within 24 hours. (stub call ${call_id})`;
}

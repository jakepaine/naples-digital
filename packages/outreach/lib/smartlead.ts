// Smartlead API wrapper.
// Docs: https://api.smartlead.ai/reference
//
// Auth: ?api_key=<key> query parameter (legacy) OR Authorization header.

import type {
  OutreachVendor, PushSequenceInput, PushSequenceResult,
  VendorEvent, WebhookParseResult, VendorKind,
  AccountWarmupSummary, MailboxWarmup,
} from "./types";
import { hmacSha256Hex, timingSafeEq } from "./hmac";

const API_BASE = "https://server.smartlead.ai/api/v1";

export function createSmartleadVendor(opts: {
  apiKey: string;
  webhookSecret?: string;
  config?: Record<string, unknown>;
}): OutreachVendor {
  const { apiKey, webhookSecret } = opts;
  const kind: VendorKind = "smartlead";

  async function call<T>(path: string, init?: RequestInit): Promise<T> {
    const url = `${API_BASE}${path}${path.includes("?") ? "&" : "?"}api_key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Smartlead ${res.status}: ${text}`);
    }
    return res.json() as Promise<T>;
  }

  return {
    kind,

    async pushSequence(input: PushSequenceInput): Promise<PushSequenceResult> {
      if (!input.campaignId) {
        throw new Error("Smartlead requires a campaignId in tenant_integrations.config.campaign_id");
      }
      type Resp = { ok: boolean; lead_id: string | number };
      const data = await call<Resp>(`/campaigns/${input.campaignId}/leads`, {
        method: "POST",
        body: JSON.stringify({
          lead_list: [{
            email: input.leadEmail,
            first_name: input.leadName.split(" ")[0],
            last_name: input.leadName.split(" ").slice(1).join(" "),
            company_name: input.leadCompany,
            custom_fields: input.variables ?? {},
          }],
          settings: { ignore_global_block_list: false, ignore_unsubscribe_list: false, ignore_duplicate_leads_in_other_campaign: false },
        }),
      });
      return { externalId: String(data.lead_id), vendor: kind };
    },

    async pauseSequence(externalId: string): Promise<boolean> {
      try {
        await call(`/leads/${externalId}/pause-lead-by-campaign-id`, { method: "POST" });
        return true;
      } catch { return false; }
    },

    async getStatus(externalId: string): Promise<{ state: string; raw: unknown } | null> {
      try {
        const data = await call<{ status?: string }>(`/leads/${externalId}`);
        return { state: data.status ?? "unknown", raw: data };
      } catch { return null; }
    },

    async parseWebhook(_headers: Headers, rawBody: string): Promise<WebhookParseResult> {
      try {
        const body = JSON.parse(rawBody) as {
          event_type?: string;
          lead_id?: string | number;
          campaign_id?: string | number;
          email_message_id?: string;
          time_event?: string;
          reply_message?: { subject?: string; text?: string };
        };
        const map: Record<string, VendorEvent["kind"] | undefined> = {
          EMAIL_SENT: "sent",
          EMAIL_OPEN: "opened",
          EMAIL_LINK_CLICK: "clicked",
          LEAD_REPLY: "replied",
          EMAIL_BOUNCED: "bounced",
          LEAD_UNSUBSCRIBED: "unsubscribed",
        };
        const k = body.event_type ? map[body.event_type] : undefined;
        if (!k) return { ok: false, error: `Unknown Smartlead event: ${body.event_type}` };
        const event: VendorEvent = {
          kind: k,
          externalSendId: body.email_message_id ?? "",
          externalLeadId: body.lead_id !== undefined ? String(body.lead_id) : undefined,
          ts: body.time_event ?? new Date().toISOString(),
          payload: body as Record<string, unknown>,
          ...(k === "replied" && body.reply_message
            ? { reply: { subject: body.reply_message.subject, body: body.reply_message.text } }
            : {}),
        };
        return { ok: true, events: [event] };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Parse failed" };
      }
    },

    async verifyWebhookSignature(headers: Headers, rawBody: string): Promise<boolean> {
      if (!webhookSecret) return false;
      const sigHeader = headers.get("x-smartlead-signature");
      if (sigHeader) {
        const expected = await hmacSha256Hex(webhookSecret, rawBody);
        return timingSafeEq(sigHeader.replace(/^sha256=/, ""), expected);
      }
      const fallback = headers.get("x-webhook-secret");
      if (fallback) return timingSafeEq(fallback, webhookSecret);
      return false;
    },

    async getAccountWarmup(): Promise<AccountWarmupSummary> {
      // Smartlead — list email accounts. Returns array of objects with
      // warmup_details + email + bounce_count.
      try {
        type SmartleadAccount = {
          id?: number;
          from_email?: string;
          email?: string;
          warmup_details?: {
            warmup_reputation?: number; // 0-100 typically
            warmup_status?: number; // 1 = active, 0 = paused
            total_sent_count?: number;
            total_bounce_count?: number;
            warmup_score?: number;
          };
          warmup_score?: number;
          created_at?: string;
        };
        const data = await call<SmartleadAccount[] | { data: SmartleadAccount[] }>(
          "/email-accounts/",
        );
        const items = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.data)
            ? (data as any).data
            : [];
        const mailboxes: MailboxWarmup[] = (items as SmartleadAccount[]).map((it) => {
          const score = clamp(
            Number(
              it.warmup_details?.warmup_reputation ??
                it.warmup_details?.warmup_score ??
                it.warmup_score ??
                0,
            ),
            0,
            100,
          );
          const warming = (it.warmup_details?.warmup_status ?? 0) === 1;
          return {
            email: String(it.from_email ?? it.email ?? ""),
            warmup_score: score,
            warming,
            sent_count: Number(it.warmup_details?.total_sent_count ?? 0),
            bounce_count: Number(it.warmup_details?.total_bounce_count ?? 0),
            connected_at: it.created_at ?? null,
            health_notes: [],
          };
        });
        return summarize("smartlead", false, mailboxes);
      } catch {
        return summarize("smartlead", true, stubSmartleadMailboxes());
      }
    },
  };
}

function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function summarize(
  vendor: VendorKind,
  is_stub: boolean,
  mailboxes: MailboxWarmup[],
): AccountWarmupSummary {
  const warming_mailboxes = mailboxes.filter((m) => m.warming).length;
  const fully_warmed_mailboxes = mailboxes.filter(
    (m) => m.warmup_score >= 100,
  ).length;
  const average_score =
    mailboxes.length === 0
      ? 0
      : Math.round(
          mailboxes.reduce((acc, m) => acc + m.warmup_score, 0) /
            mailboxes.length,
        );
  return {
    vendor,
    is_stub,
    total_mailboxes: mailboxes.length,
    warming_mailboxes,
    fully_warmed_mailboxes,
    average_score,
    mailboxes,
  };
}

function stubSmartleadMailboxes(): MailboxWarmup[] {
  const today = Date.now();
  const profile = [95, 88, 75, 62, 50, 30];
  return profile.map((score, i) => ({
    email: `outbound-${i + 1}@stub-smartlead.example`,
    warmup_score: score,
    warming: score < 100,
    sent_count: Math.round(score * 8),
    bounce_count: i,
    connected_at: new Date(today - i * 86400000).toISOString(),
    health_notes: [],
  }));
}

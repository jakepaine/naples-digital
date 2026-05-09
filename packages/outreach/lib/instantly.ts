// Instantly V2 API wrapper.
// Docs: https://developer.instantly.ai/api/v2
//
// Auth: Bearer <api_key> in Authorization header. Get the key from
// app.instantly.ai → Settings → Integrations → API.
//
// Webhooks: configured in Instantly dashboard, fires on email_sent,
// email_opened, email_replied, email_bounced. Each tenant configures
// their webhook URL to point at our outreach-dispatcher service with
// their secret in a query string or header for signature verification.

import type {
  OutreachVendor, PushSequenceInput, PushSequenceResult,
  VendorEvent, WebhookParseResult, VendorKind,
  AccountWarmupSummary, MailboxWarmup,
} from "./types";
import { hmacSha256Hex, timingSafeEq } from "./hmac";

const API_BASE = "https://api.instantly.ai/api/v2";

export function createInstantlyVendor(opts: {
  apiKey: string;
  webhookSecret?: string;
  config?: Record<string, unknown>;
}): OutreachVendor {
  const { apiKey, webhookSecret } = opts;

  async function call<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Instantly ${res.status}: ${text}`);
    }
    return res.json() as Promise<T>;
  }

  const kind: VendorKind = "instantly";

  return {
    kind,

    async pushSequence(input: PushSequenceInput): Promise<PushSequenceResult> {
      // Strategy: add the lead to an existing campaign. The campaign already
      // has the email sequence configured in Instantly. We pass the rendered
      // emails as variables so the campaign can use them via {{custom_*}}.
      // (For a future v2 we can create a new campaign per sequence; v1 reuses.)
      if (!input.campaignId) {
        throw new Error("Instantly requires a campaignId in tenant_integrations.config.campaign_id");
      }
      type LeadResponse = { id: string };
      const lead = await call<LeadResponse>("/leads", {
        method: "POST",
        body: JSON.stringify({
          email: input.leadEmail,
          first_name: input.leadName.split(" ")[0],
          last_name: input.leadName.split(" ").slice(1).join(" "),
          company_name: input.leadCompany,
          campaign: input.campaignId,
          custom_variables: {
            ...input.variables,
            email1_subject: input.emails[0]?.subject,
            email1_body: input.emails[0]?.body,
            email2_subject: input.emails[1]?.subject,
            email2_body: input.emails[1]?.body,
            email3_subject: input.emails[2]?.subject,
            email3_body: input.emails[2]?.body,
          },
        }),
      });
      return { externalId: lead.id, vendor: kind };
    },

    async pauseSequence(externalId: string): Promise<boolean> {
      try {
        await call(`/leads/${externalId}/pause`, { method: "POST" });
        return true;
      } catch {
        return false;
      }
    },

    async getStatus(externalId: string): Promise<{ state: string; raw: unknown } | null> {
      try {
        const data = await call<{ status?: string }>(`/leads/${externalId}`);
        return { state: data.status ?? "unknown", raw: data };
      } catch {
        return null;
      }
    },

    async parseWebhook(headers: Headers, rawBody: string): Promise<WebhookParseResult> {
      try {
        const body = JSON.parse(rawBody) as {
          event?: string;
          lead_id?: string;
          campaign_id?: string;
          email_id?: string;
          message_id?: string;
          timestamp?: string;
          reply_subject?: string;
          reply_text?: string;
        };
        const map: Record<string, VendorEvent["kind"] | undefined> = {
          email_sent: "sent",
          email_opened: "opened",
          email_clicked: "clicked",
          email_replied: "replied",
          reply_received: "replied",
          email_bounced: "bounced",
          lead_unsubscribed: "unsubscribed",
        };
        const kind = body.event ? map[body.event] : undefined;
        if (!kind) return { ok: false, error: `Unknown Instantly event: ${body.event}` };
        const event: VendorEvent = {
          kind,
          externalSendId: body.message_id ?? body.email_id ?? "",
          externalLeadId: body.lead_id,
          ts: body.timestamp ?? new Date().toISOString(),
          payload: body as Record<string, unknown>,
          ...(kind === "replied" && (body.reply_subject || body.reply_text)
            ? { reply: { subject: body.reply_subject, body: body.reply_text } }
            : {}),
        };
        return { ok: true, events: [event] };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Parse failed" };
      }
    },

    async verifyWebhookSignature(headers: Headers, rawBody: string): Promise<boolean> {
      if (!webhookSecret) return false; // no secret configured = reject in prod
      // Instantly's signing scheme: HMAC-SHA256 of raw body using webhook secret,
      // sent as hex in X-Instantly-Signature header. Some tenants prefer a static
      // shared-secret header — accept either, prefer HMAC.
      const sigHeader = headers.get("x-instantly-signature");
      if (sigHeader) {
        const expected = await hmacSha256Hex(webhookSecret, rawBody);
        return timingSafeEq(sigHeader.replace(/^sha256=/, ""), expected);
      }
      const fallback = headers.get("x-webhook-secret");
      if (fallback) return timingSafeEq(fallback, webhookSecret);
      return false;
    },

    async getAccountWarmup(): Promise<AccountWarmupSummary> {
      // Instantly v2 — paginated /accounts list returns mailboxes with
      // fields including warmup_score, warmup_status, sent_count, etc.
      // We pull up to 200 accounts (one page) which covers the typical
      // Saraev recommendation of 9 mailboxes by a wide margin.
      try {
        type InstantlyAccount = {
          email: string;
          warmup_status?: number; // 1 = warming, 2 = paused, 3 = error
          warmup_score?: number; // 0-100
          warmup?: { status?: string; warmup_advanced?: { warm_up_advanced?: any } };
          stat_warmup_score?: number;
          sent_count?: number;
          bounce_count?: number;
          timestamp_created?: string;
          status?: number;
          status_label?: string;
        };
        type ListAccountsResponse = {
          items: InstantlyAccount[];
          total?: number;
        };
        const data = await call<ListAccountsResponse>("/accounts?limit=200");
        const items = Array.isArray(data?.items) ? data.items : [];
        const mailboxes: MailboxWarmup[] = items.map((it) => {
          const score = clamp(
            Number(
              it.stat_warmup_score ??
                it.warmup_score ??
                0,
            ),
            0,
            100,
          );
          const warming =
            it.warmup_status === 1 ||
            (typeof it.warmup?.status === "string" &&
              it.warmup.status.toLowerCase() === "active");
          const notes: string[] = [];
          if (it.status_label) notes.push(`status: ${it.status_label}`);
          if (typeof it.warmup_status === "number" && it.warmup_status === 3)
            notes.push("warmup error reported by Instantly — check the mailbox");
          return {
            email: String(it.email ?? ""),
            warmup_score: score,
            warming,
            sent_count: Number(it.sent_count ?? 0),
            bounce_count: Number(it.bounce_count ?? 0),
            connected_at: it.timestamp_created ?? null,
            health_notes: notes,
          };
        });
        return summarize("instantly", false, mailboxes);
      } catch {
        return summarize("instantly", true, stubInstantlyMailboxes());
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

function stubInstantlyMailboxes(): MailboxWarmup[] {
  // 9 mailboxes — Saraev's #255 recommended baseline. Spread the
  // warmup % so the dashboard renders a useful gradient.
  const today = Date.now();
  const profile = [98, 92, 85, 73, 70, 64, 50, 33, 12];
  return profile.map((score, i) => ({
    email: `outbound-${i + 1}@stub.example`,
    warmup_score: score,
    warming: score < 100,
    sent_count: Math.round(score * 12),
    bounce_count: Math.round(Math.max(0, (5 - i) * 0.4)),
    connected_at: new Date(today - i * 86400000).toISOString(),
    health_notes: i === 0 ? ["fully warmed — ready to send"] : [],
  }));
}

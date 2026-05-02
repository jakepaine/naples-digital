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
} from "./types";

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

    async verifyWebhookSignature(headers: Headers, _rawBody: string): Promise<boolean> {
      if (!webhookSecret) return true; // no secret configured = accept (dev only)
      // Instantly v2 puts the secret in a custom header, exact name set by tenant
      const provided = headers.get("x-instantly-signature") ?? headers.get("x-webhook-secret");
      return provided === webhookSecret;
    },
  };
}

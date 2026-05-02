// Smartlead API wrapper.
// Docs: https://api.smartlead.ai/reference
//
// Auth: ?api_key=<key> query parameter (legacy) OR Authorization header.

import type {
  OutreachVendor, PushSequenceInput, PushSequenceResult,
  VendorEvent, WebhookParseResult, VendorKind,
} from "./types";

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

    async verifyWebhookSignature(headers: Headers, _rawBody: string): Promise<boolean> {
      if (!webhookSecret) return true;
      const provided = headers.get("x-smartlead-signature") ?? headers.get("x-webhook-secret");
      return provided === webhookSecret;
    },
  };
}

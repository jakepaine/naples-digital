// Vendor-agnostic outreach interface. Apps NEVER import vendor SDKs directly —
// they go through this interface, which is implemented by instantly.ts and smartlead.ts.

export type SequenceEmail = {
  step: number;       // 1, 2, 3, ...
  subject: string;
  body: string;
  delay_days?: number; // days after previous step (or 0 for step 1)
};

export type PushSequenceInput = {
  leadEmail: string;
  leadName: string;
  leadCompany?: string;
  emails: SequenceEmail[];
  campaignId?: string;        // vendor-specific: pre-existing campaign
  variables?: Record<string, string>; // for {{firstName}} style merge fields
};

export type PushSequenceResult = {
  externalId: string;         // vendor's lead+campaign id (used for status lookups)
  vendor: VendorKind;
};

export type VendorEvent = {
  kind: "sent" | "opened" | "clicked" | "replied" | "bounced" | "unsubscribed";
  externalSendId: string;     // vendor's send id (matches email_sends.external_id)
  externalLeadId?: string;
  ts: string;                 // ISO timestamp
  payload?: Record<string, unknown>;
  reply?: { subject?: string; body?: string };
};

export type WebhookParseResult =
  | { ok: true; events: VendorEvent[] }
  | { ok: false; error: string };

export type VendorKind = "instantly" | "smartlead";

export interface OutreachVendor {
  readonly kind: VendorKind;
  pushSequence(input: PushSequenceInput): Promise<PushSequenceResult>;
  pauseSequence(externalId: string): Promise<boolean>;
  getStatus(externalId: string): Promise<{ state: string; raw: unknown } | null>;
  parseWebhook(headers: Headers, rawBody: string): Promise<WebhookParseResult>;
  verifyWebhookSignature?(headers: Headers, rawBody: string): Promise<boolean>;
}

export type VendorConstructor = (config: {
  apiKey: string;
  webhookSecret?: string;
  config?: Record<string, unknown>;
}) => OutreachVendor;

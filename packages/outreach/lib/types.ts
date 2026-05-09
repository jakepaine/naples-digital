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

export type MailboxWarmup = {
  /** The sending email address. */
  email: string;
  /** Warmup completion 0-100. 100 = ready for live sends. */
  warmup_score: number;
  /** Whether the vendor reports this mailbox as actively warming. */
  warming: boolean;
  /** Total emails this mailbox has sent (lifetime, where available). */
  sent_count: number;
  /** Bounce count where the vendor exposes it. */
  bounce_count: number;
  /** ISO date when the mailbox was connected to the vendor. */
  connected_at: string | null;
  /** Notes / health flags surfaced by the vendor (e.g. "DKIM not detected"). */
  health_notes: string[];
};

export type AccountWarmupSummary = {
  vendor: VendorKind;
  /** True when the result is synthetic (no API key configured). */
  is_stub: boolean;
  total_mailboxes: number;
  warming_mailboxes: number;
  fully_warmed_mailboxes: number;
  average_score: number;
  mailboxes: MailboxWarmup[];
};

export interface OutreachVendor {
  readonly kind: VendorKind;
  pushSequence(input: PushSequenceInput): Promise<PushSequenceResult>;
  pauseSequence(externalId: string): Promise<boolean>;
  getStatus(externalId: string): Promise<{ state: string; raw: unknown } | null>;
  parseWebhook(headers: Headers, rawBody: string): Promise<WebhookParseResult>;
  verifyWebhookSignature?(headers: Headers, rawBody: string): Promise<boolean>;
  /**
   * Per-mailbox warmup status. Optional on the interface — vendors that
   * don't expose stats throw a NotImplementedError; callers fall back to
   * a synthetic stub. Both Instantly and Smartlead implement this.
   */
  getAccountWarmup?(): Promise<AccountWarmupSummary>;
}

export type VendorConstructor = (config: {
  apiKey: string;
  webhookSecret?: string;
  config?: Record<string, unknown>;
}) => OutreachVendor;

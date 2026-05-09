import { createServerClient, hasSupabase } from "@naples/db";
import type { Category } from "./categories";

// Mirrors public.emails. Loose on the AI-set fields (nullable until classified).
export interface EmailRow {
  id: string;
  tenant_id: string;
  source: string;
  source_message_id: string | null;
  source_thread_id: string | null;
  from_email: string;
  from_name: string | null;
  to_email: string | null;
  subject: string;
  received_at: string;
  preview: string | null;
  body_text: string | null;
  body_html: string | null;
  category: Category | null;
  score: number | null;
  reason: string | null;
  classified_at: string | null;
  auto_replied: boolean;
  auto_reply_text: string | null;
  slack_notified: boolean;
  archived: boolean;
  archived_at: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export async function fetchInboxForTenant(
  tenantId: string,
  opts: { limit?: number; category?: Category | null } = {},
): Promise<EmailRow[]> {
  const limit = opts.limit ?? 100;

  if (!hasSupabase()) {
    return mockInbox().slice(0, limit);
  }

  const sb = createServerClient();
  let q = sb
    .from("emails")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("archived", false)
    .order("received_at", { ascending: false })
    .limit(limit);
  if (opts.category) q = q.eq("category", opts.category);
  const { data, error } = await q;
  if (error) throw new Error(`emails fetch: ${error.message}`);
  return (data ?? []) as EmailRow[];
}

export async function fetchEmailById(id: string): Promise<EmailRow | null> {
  if (!hasSupabase()) {
    return mockInbox().find((e) => e.id === id) ?? null;
  }
  const sb = createServerClient();
  const { data, error } = await sb
    .from("emails")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`email fetch: ${error.message}`);
  return (data as any) ?? null;
}

// Demo / dev fallback. Same structural shape as a real EmailRow.
function mockInbox(): EmailRow[] {
  const now = Date.now();
  const ago = (mins: number) => new Date(now - mins * 60_000).toISOString();
  const stub = (overrides: Partial<EmailRow>): EmailRow => ({
    id: overrides.id ?? "",
    tenant_id: "demo",
    source: "gmail",
    source_message_id: null,
    source_thread_id: null,
    from_email: "",
    from_name: null,
    to_email: null,
    subject: "",
    received_at: ago(60),
    preview: "",
    body_text: null,
    body_html: null,
    category: null,
    score: null,
    reason: null,
    classified_at: null,
    auto_replied: false,
    auto_reply_text: null,
    slack_notified: false,
    archived: false,
    archived_at: null,
    metadata: {},
    created_at: ago(60),
    updated_at: ago(60),
    ...overrides,
  });
  return [
    stub({
      id: "demo-e-001",
      from_email: "sarah@anchorbookkeeping.com",
      from_name: "Sarah Liu",
      subject: "Following up on yesterday's call",
      preview: "Hey — really appreciated the demo. Wanted to confirm our team can move forward at the Growth tier. What's the next step?",
      received_at: ago(20),
    }),
    stub({
      id: "demo-e-002",
      from_email: "no-reply@substack.com",
      from_name: "Substack Digest",
      subject: "10 essays you might like this week",
      preview: "We picked these for you based on what you've been reading…",
      received_at: ago(60),
    }),
    stub({
      id: "demo-e-003",
      from_email: "marcus@partnerstack.com",
      from_name: "Marcus from PartnerStack",
      subject: "Quick question on your affiliate program",
      preview: "Hi, I'm running affiliates at PartnerStack. Saw you have a SaaS product — wondering if we can chat about a possible co-marketing arrangement.",
      received_at: ago(180),
    }),
    stub({
      id: "demo-e-004",
      from_email: "no-reply@stripe.com",
      from_name: "Stripe",
      subject: "Payout for Mar 30 - May 5",
      preview: "Your payout of $4,287.50 will arrive in your bank in 1-2 days.",
      received_at: ago(240),
    }),
    stub({
      id: "demo-e-005",
      from_email: "claim@airdrop-claim-portal.io",
      from_name: "Crypto Airdrops",
      subject: "Claim your $1,250 USDT today",
      preview: "Connect your wallet to claim your winnings…",
      received_at: ago(420),
    }),
    stub({
      id: "demo-e-006",
      from_email: "kevin@239live.com",
      from_name: "239 Live (Kevin)",
      subject: "Sending over the design partner agreement",
      preview: "Quick update — we've reviewed the terms and our attorney has a couple of redlines. Adding the doc here.",
      received_at: ago(780),
    }),
  ];
}

export { mockInbox as DEMO_EMAILS };

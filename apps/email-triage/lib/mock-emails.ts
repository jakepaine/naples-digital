// Deterministic mock inbox for the Email Triage scaffold.
// Real implementation will pull from a per-tenant Gmail/Outlook integration.

export type Category =
  | "high_priority"
  | "partnerships"
  | "support"
  | "newsletter"
  | "spam";

export interface MockEmail {
  id: string;
  receivedAt: string;
  fromName: string;
  fromEmail: string;
  subject: string;
  preview: string;
  category?: Category;
  score?: number;
  reason?: string;
}

export const MOCK_EMAILS: MockEmail[] = [
  {
    id: "e-001",
    receivedAt: "2026-05-08T13:42:00Z",
    fromName: "Sarah Liu",
    fromEmail: "sarah@anchorbookkeeping.com",
    subject: "Following up on yesterday's call",
    preview:
      "Hey — really appreciated the demo. Wanted to confirm our team can move forward at the Growth tier. What's the next step?",
  },
  {
    id: "e-002",
    receivedAt: "2026-05-08T12:09:00Z",
    fromName: "Substack Digest",
    fromEmail: "no-reply@substack.com",
    subject: "10 essays you might like this week",
    preview: "We picked these for you based on what you've been reading…",
  },
  {
    id: "e-003",
    receivedAt: "2026-05-08T11:16:00Z",
    fromName: "Marcus from PartnerStack",
    fromEmail: "marcus@partnerstack.com",
    subject: "Quick question on your affiliate program",
    preview:
      "Hi, I'm running affiliates at PartnerStack. Saw you have a SaaS product — wondering if we can chat about a possible co-marketing arrangement.",
  },
  {
    id: "e-004",
    receivedAt: "2026-05-08T10:41:00Z",
    fromName: "Stripe",
    fromEmail: "no-reply@stripe.com",
    subject: "Payout for Mar 30 - May 5",
    preview: "Your payout of $4,287.50 will arrive in your bank in 1-2 days.",
  },
  {
    id: "e-005",
    receivedAt: "2026-05-08T08:55:00Z",
    fromName: "239 Live (Kevin)",
    fromEmail: "kevin@239live.com",
    subject: "Sending over the design partner agreement",
    preview:
      "Quick update — we've reviewed the terms and our attorney has a couple of redlines. Adding the doc here.",
  },
  {
    id: "e-006",
    receivedAt: "2026-05-08T07:13:00Z",
    fromName: "Crypto Airdrops",
    fromEmail: "claim@airdrop-claim-portal.io",
    subject: "Claim your $1,250 USDT today",
    preview: "Connect your wallet to claim your winnings…",
  },
  {
    id: "e-007",
    receivedAt: "2026-05-08T06:42:00Z",
    fromName: "Zach (current tenant)",
    fromEmail: "zach@lifewise.app",
    subject: "Booking portal showing wrong availability",
    preview:
      "Hey — getting reports that the booking portal is showing slots that are actually full. Can you take a look?",
  },
];

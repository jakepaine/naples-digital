import { StubPage } from "@/components/StubPage";

export const dynamic = "force-dynamic";

export default function InboxPage() {
  return (
    <StubPage
      title="Inbox"
      subtitle="Most off-market multifamily flows through broker email blasts. Forward → parse → underwrite."
      bullets={[
        "Dedicated inbound address (e.g. deals-mia@naplesdigital.app via Postmark / Resend Inbound).",
        "MIA's principals create a forward rule: any broker blast → that address.",
        "Server parses sender, subject, body; LLM extracts deal terms (units, price, NOI, address).",
        "If parsed deal matches MIA's criteria, auto-create re_deals row + run underwrite + email alert.",
      ]}
      next="Decide inbound provider (Postmark cheapest at this scale; Resend if we're already paying them for outbound). Set up DNS MX records on naplesdigital.app subdomain. Build the parse worker."
    />
  );
}

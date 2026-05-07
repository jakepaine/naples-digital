import { StubPage } from "@/components/StubPage";

export const dynamic = "force-dynamic";

export default function OffMarketPage() {
  return (
    <StubPage
      title="Off-market"
      subtitle="Find the owners of qualifying buildings before anyone lists them."
      bullets={[
        "Weekly scrape of Dallas CAD (DCAD), Tarrant CAD (TCAD), and Harris CAD (HCAD) public property records.",
        "Filter to MIA's criteria: 50–350 units, vintage 1980+, Class A/B markets.",
        "Owner aging — flag LLCs that have held 7+ years (most likely sellers).",
        "BatchSkipTracing integration — unwind LLC → human, return phone + email.",
        "Bookmark + export targets list for outreach.",
      ]}
      next="Build the three CAD scrapers (DCAD, TCAD, HCAD — each is custom; no stock Apify actor). One worker service in services/mia-offmarket-cron, weekly schedule."
    />
  );
}

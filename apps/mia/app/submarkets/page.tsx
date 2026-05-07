import { StubPage } from "@/components/StubPage";

export const dynamic = "force-dynamic";

export default function SubmarketsPage() {
  return (
    <StubPage
      title="Submarkets"
      subtitle="DFW + Houston neighborhood-level intelligence — for both acquisition decisions and coaching demos."
      bullets={[
        "Per-submarket: avg rent/unit, occupancy proxy, recent sales count + avg cap rate.",
        "New supply pressure — pull 12mo of building permits from city/county portals.",
        "Demographic deltas (income, household size, migration).",
        "Refresh quarterly via cron; results cached in re_submarkets table.",
      ]}
      next="Source data: Apartments.com (rent comps), CoStar competitive (paid; defer), city permit portals (DFW open data, Houston open data). Build after off-market — submarket data benefits from owner-target context."
    />
  );
}

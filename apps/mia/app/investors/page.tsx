import { StubPage } from "@/components/StubPage";

export const dynamic = "force-dynamic";

export default function InvestorsPage() {
  return (
    <StubPage
      title="Investors"
      subtitle="Capital partners (LPs) tracker — for the acquisition fund side."
      bullets={[
        "LP roster: name, entity, accreditation, target check size, geography preferences.",
        "Per-deal allocation history once deals close.",
        "Capital call + distribution tracker (later phase).",
        "K-1 generation reminder per tax year.",
      ]}
      next="This is the lowest urgency — mostly forms + reporting. Build after the deal-flow products are live and MIA actually has deals to allocate."
    />
  );
}

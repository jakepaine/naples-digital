import { Card, Badge } from "@naples/ui";
import { ProjectionChart } from "@/components/ProjectionChart";
import { MOCK_MRR, MOCK_LEADS, PRICING } from "@naples/mock-data";

export default function RevenuePage() {
  // Cost line items — Kevin pays platform stack at cost (~$460–690/mo).
  // Labor for Naples Digital is the $3K retainer + 10% commission on new MRR.
  const costs = [
    { label: "Platform Stack (GHL, Hosting, AI tools)", amount: 575 },
    { label: "Naples Digital Retainer", amount: 3000 },
    { label: "Studio Equipment Rental (optional)", amount: 1500 },
    { label: "Naples Digital Commission (10% of new MRR)", amount: MOCK_MRR.naplesDigitalCommission },
  ];
  const totalCosts = costs.reduce((s, c) => s + c.amount, 0);
  const netProfit = MOCK_MRR.total - totalCosts;

  // Active commission lines — leads that have closed (Client Won) drive ongoing commission.
  const activeCommissionLines = MOCK_LEADS.filter((l) => l.stage === "Client Won").map((l) => ({
    name: l.name,
    type: l.goal,
    monthly: l.value,
    commission: Math.round(l.value * 0.10),
  }));

  return (
    <main className="px-8 py-8">
      <header className="mb-8">
        <div className="text-[10px] uppercase tracking-[0.22em] text-muted">Financials</div>
        <h1 className="mt-1 font-heading text-4xl text-cream">Revenue & Commissions</h1>
        <div className="mt-1 h-px w-12 bg-gold" />
      </header>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted">Current Month</div>
          <h2 className="mt-1 font-heading text-2xl text-cream">P&L · May 2025</h2>
          <div className="mt-6">
            <div className="text-[11px] uppercase tracking-wider text-emerald">Revenue</div>
            <div className="mt-2 space-y-2 text-sm">
              <Line label="Studio Rental" value={MOCK_MRR.studioRental} />
              <Line label="Content Agency" value={MOCK_MRR.contentAgency} />
              <Line label="Show Sponsors" value={MOCK_MRR.showSponsors} />
              <Line label="Merch" value={MOCK_MRR.merch} />
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-card-border pt-3 text-sm">
              <span className="text-cream">Total Revenue</span>
              <span className="font-heading text-xl text-cream">${MOCK_MRR.total.toLocaleString()}</span>
            </div>
          </div>
          <div className="mt-6">
            <div className="text-[11px] uppercase tracking-wider text-rose">Costs</div>
            <div className="mt-2 space-y-2 text-sm">
              {costs.map((c) => (
                <Line key={c.label} label={c.label} value={c.amount} muted />
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-card-border pt-3 text-sm">
              <span className="text-cream">Total Costs</span>
              <span className="font-heading text-xl text-rose">${totalCosts.toLocaleString()}</span>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-gold pt-4">
            <span className="font-heading text-lg text-cream">Net Profit</span>
            <span className="font-heading text-3xl text-gold">${netProfit.toLocaleString()}</span>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted">Naples Digital</div>
            <h2 className="mt-1 font-heading text-2xl text-cream">Commission Lines</h2>
            <div className="mt-6 divide-y divide-card-border">
              {activeCommissionLines.map((c) => (
                <div key={c.name} className="grid grid-cols-12 gap-2 py-3 text-sm">
                  <div className="col-span-5 truncate text-cream">{c.name}</div>
                  <div className="col-span-3 truncate text-xs text-muted">{c.type}</div>
                  <div className="col-span-2 text-right text-xs text-muted">${c.monthly.toLocaleString()}/mo</div>
                  <div className="col-span-2 text-right text-xs text-gold">${c.commission}/mo</div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-card-border pt-3">
              <span className="text-sm text-muted">This month total</span>
              <span className="font-heading text-2xl text-gold">${MOCK_MRR.naplesDigitalCommission.toLocaleString()}</span>
            </div>
          </Card>

          <Card>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted">Pricing Reference</div>
            <h2 className="mt-1 font-heading text-xl text-cream">Engagement Terms</h2>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div className="border border-card-border p-4">
                <div className="text-[11px] uppercase tracking-wider text-gold">Option A · Build Heavy</div>
                <div className="mt-2 font-heading text-2xl text-cream">${PRICING.optionA.setup.toLocaleString()}</div>
                <div className="text-[11px] text-muted">+ ${PRICING.optionA.retainer.toLocaleString()}/mo · {(PRICING.optionA.commission * 100).toFixed(0)}%</div>
              </div>
              <div className="border border-card-border p-4">
                <div className="text-[11px] uppercase tracking-wider text-gold">Option B · Commission Heavy</div>
                <div className="mt-2 font-heading text-2xl text-cream">${PRICING.optionB.setup.toLocaleString()}</div>
                <div className="text-[11px] text-muted">+ ${PRICING.optionB.retainer.toLocaleString()}/mo · {(PRICING.optionB.commission * 100).toFixed(0)}%</div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="mt-6">
        <Card>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted">Forecast</div>
              <h2 className="mt-1 font-heading text-2xl text-cream">12-Month Revenue Projection</h2>
            </div>
            <Badge tone="gold">Realistic case · $62K MRR by Month 12</Badge>
          </div>
          <div className="mt-6">
            <ProjectionChart />
          </div>
        </Card>
      </section>
    </main>
  );
}

function Line({ label, value, muted }: { label: string; value: number; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? "text-muted" : "text-cream"}>{label}</span>
      <span className={muted ? "text-muted" : "text-cream"}>${value.toLocaleString()}</span>
    </div>
  );
}

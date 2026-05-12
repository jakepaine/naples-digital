import { Card, Badge } from "@naples/ui";
import { Kpi } from "@/components/Kpi";
import { UsageTrendChart } from "@/components/UsageTrendChart";
import { getServerTenantId } from "@naples/db/next";
import { getTenantUsageSummary, type VendorRollup } from "@naples/usage";
import { Sparkles, Bot, AudioLines, Send, Wallet, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

const VENDOR_META: Record<VendorRollup["vendor"], { label: string; icon: typeof Bot; color: string; description: string }> = {
  anthropic: {
    label: "Anthropic",
    icon: Sparkles,
    color: "#B8893E",
    description: "Claude API — token usage across every AI feature",
  },
  apify: {
    label: "Apify",
    icon: Bot,
    color: "#22C55E",
    description: "Actor runs — lead scraping, IG reels, competitor ads",
  },
  assemblyai: {
    label: "AssemblyAI",
    icon: AudioLines,
    color: "#8B5CF6",
    description: "Audio transcription — content pipeline episodes",
  },
  resend: {
    label: "Resend",
    icon: Send,
    color: "#EC4899",
    description: "Transactional email — invoices, alerts, sponsor outreach",
  },
};

export default async function UsagePage() {
  const tid = await getServerTenantId();
  const summary = await getTenantUsageSummary(tid);
  return (
    <main className="px-8 py-8">
      <header className="mb-8">
        <div className="text-[10px] uppercase tracking-[0.22em] text-muted">Operations Hub</div>
        <h1 className="mt-1 font-heading text-4xl text-cream">Usage &amp; Spend</h1>
        <div className="mt-1 h-px w-12 bg-gold" />
        <p className="mt-3 max-w-2xl text-sm text-muted">
          Per-vendor API spend across the Naples-managed metered stack. Updated daily from each vendor&rsquo;s usage API. These line items appear on your monthly Stripe invoice at exact vendor cost — no markup.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Kpi
          label="Month to date"
          value={`$${summary.total_mtd_cost_usd.toFixed(2)}`}
          hint="across every vendor"
          icon={<Wallet className="h-4 w-4" />}
        />
        <Kpi
          label="Projected end of month"
          value={`$${summary.total_projected_eom_usd.toFixed(2)}`}
          hint="straight-line from MTD daily avg"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <Kpi
          label="Last 30 days"
          value={`$${summary.total_last_30d_cost_usd.toFixed(2)}`}
          hint="rolling window"
          icon={<Wallet className="h-4 w-4" />}
        />
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {summary.by_vendor.map((rollup) => (
          <VendorCard key={rollup.vendor} rollup={rollup} />
        ))}
      </section>

      <section className="mt-6">
        <Card>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted">Detail</div>
              <h2 className="mt-1 font-heading text-2xl text-cream">Daily breakdown</h2>
            </div>
            <div className="text-xs text-muted">last 30 days</div>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border text-left text-[10px] uppercase tracking-wider text-muted">
                  <th className="py-3 pr-4">Vendor</th>
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3 pr-4 text-right">Units</th>
                  <th className="py-3 pr-4 text-right">Cost</th>
                </tr>
              </thead>
              <tbody>
                {summary.by_vendor.flatMap((rollup) =>
                  rollup.daily.map((d) => ({ ...d, vendor: rollup.vendor }))
                )
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .slice(0, 60)
                  .map((row, i) => {
                    const meta = VENDOR_META[row.vendor];
                    return (
                      <tr key={`${row.vendor}-${row.date}-${i}`} className="border-b border-card-border/50">
                        <td className="py-3 pr-4">
                          <Badge tone="muted">{meta.label}</Badge>
                        </td>
                        <td className="py-3 pr-4 text-muted">{row.date}</td>
                        <td className="py-3 pr-4 text-right text-muted">{row.units.toLocaleString()}</td>
                        <td className="py-3 pr-4 text-right text-gold">${row.cost_usd.toFixed(4)}</td>
                      </tr>
                    );
                  })}
                {summary.by_vendor.every((v) => v.daily.length === 0) && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-xs text-muted">
                      No usage recorded yet. Once the daily sync runs, vendor activity will appear here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </main>
  );
}

function VendorCard({ rollup }: { rollup: VendorRollup }) {
  const meta = VENDOR_META[rollup.vendor];
  const Icon = meta.icon;
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" style={{ color: meta.color }} />
            <div className="font-heading text-lg text-cream">{meta.label}</div>
          </div>
          <div className="mt-1 text-xs text-muted">{meta.description}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted">MTD</div>
          <div className="font-heading text-2xl text-gold">${rollup.mtd_cost_usd.toFixed(2)}</div>
        </div>
      </div>
      <div className="mt-4">
        <UsageTrendChart data={rollup.daily} color={meta.color} />
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px] text-muted">
        <span>Projected EOM <span className="text-cream">${rollup.projected_eom_usd.toFixed(2)}</span></span>
        <span>Last 30d <span className="text-cream">${rollup.last_30d_cost_usd.toFixed(2)}</span></span>
      </div>
    </Card>
  );
}

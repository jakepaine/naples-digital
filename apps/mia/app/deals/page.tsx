import Link from "next/link";
import { Card, Badge } from "@naples/ui";
import { listDeals, getDealCriteria, type ReDealStatus } from "@naples/db";
import { getMiaTenantId } from "@/lib/tenant";
import { ExternalLink, ArrowRight, Building2 } from "lucide-react";

export const dynamic = "force-dynamic";

const ACCENT = "#8A6BB8";

const STATUS_TABS: Array<{ key: ReDealStatus | "all"; label: string }> = [
  { key: "new", label: "New" },
  { key: "qualified", label: "Qualified" },
  { key: "under_review", label: "Under review" },
  { key: "passed", label: "Passed" },
  { key: "all", label: "All" },
];

export default async function DealsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const tenantId = await getMiaTenantId();
  const status = (searchParams.status as ReDealStatus | "all" | undefined) ?? "qualified";
  const [deals, criteria] = await Promise.all([
    listDeals(tenantId, { status, limit: 200 }),
    getDealCriteria(tenantId),
  ]);

  // Sort: qualifying first, then by score desc, then by first_seen_at desc
  const sorted = [...deals].sort((a, b) => {
    const aQ = a.latest_underwrite?.qualifying ? 1 : 0;
    const bQ = b.latest_underwrite?.qualifying ? 1 : 0;
    if (aQ !== bQ) return bQ - aQ;
    const aS = a.latest_underwrite?.score ?? 0;
    const bS = b.latest_underwrite?.score ?? 0;
    if (aS !== bS) return bS - aS;
    return b.first_seen_at.localeCompare(a.first_seen_at);
  });

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 md:px-8">
      <header className="mb-6">
        <div className="text-[10px] uppercase tracking-[0.32em]" style={{ color: ACCENT }}>On-market</div>
        <h1 className="mt-2 font-heading text-5xl tracking-broadcast text-cream">Deal Flow</h1>
        <div className="mt-3 h-px w-16" style={{ background: ACCENT }} />
        {criteria && (
          <p className="mt-3 text-xs text-muted">
            Filtered to {criteria.markets.map((m) => m.metro).join(" + ")}, {criteria.markets[0]?.units_min}–{criteria.markets[0]?.units_max} units, vintage {criteria.markets[0]?.vintage_min_year}+, Class {criteria.markets[0]?.asset_classes.join("/")}, ≤${(criteria.markets[0]?.max_deal_size_usd / 1_000_000).toFixed(0)}M.
          </p>
        )}
      </header>

      <div className="mb-4 flex flex-wrap gap-1 border-b border-card-border">
        {STATUS_TABS.map((t) => {
          const active = status === t.key;
          return (
            <Link
              key={t.key}
              href={`/deals?status=${t.key}`}
              className={`px-4 py-2 text-xs font-medium uppercase tracking-wider transition-colors ${active ? "text-cream" : "text-muted hover:text-cream"}`}
              style={active ? { borderBottom: `2px solid ${ACCENT}` } : undefined}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {sorted.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <Building2 className="h-8 w-8 text-muted" />
            <div className="text-sm text-cream">No {status === "all" ? "" : status} deals yet.</div>
            <div className="max-w-md text-xs text-muted">
              The on-market scraper runs on a cron (LoopNet + Crexi). New listings + their auto-underwriting will appear here. If you want to manually add a deal you're tracking, use the API or DB directly for now.
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {sorted.map((d) => {
            const uw = d.latest_underwrite;
            return (
              <Link key={d.id} href={`/deals/${d.id}`} className="block">
                <Card className="transition-colors hover:border-card-border-strong">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-heading text-xl tracking-broadcast text-cream">
                          {d.title ?? d.address ?? "Untitled deal"}
                        </span>
                        {uw?.qualifying && <Badge tone="emerald">Qualifies</Badge>}
                        <Badge tone="muted">{d.source}</Badge>
                        <StatusBadge status={d.status} />
                      </div>
                      <div className="mt-1 text-xs text-muted">
                        {d.units ? `${d.units} units · ` : ""}
                        {d.year_built ? `built ${d.year_built} · ` : ""}
                        {d.city ? `${d.city}${d.state ? `, ${d.state}` : ""}` : ""}
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-xs text-cream md:grid-cols-4">
                        {d.asking_price && <Metric label="Ask" value={`$${(d.asking_price / 1_000_000).toFixed(2)}M`} />}
                        {d.price_per_unit && <Metric label="$/unit" value={`$${Math.round(d.price_per_unit / 1000)}k`} />}
                        {(uw?.cap_rate_actual ?? d.cap_rate_advertised) && (
                          <Metric label="Cap" value={`${(uw?.cap_rate_actual ?? d.cap_rate_advertised)?.toFixed(2)}%`} />
                        )}
                        {uw?.dscr_at_market && <Metric label="DSCR" value={uw.dscr_at_market.toFixed(2)} />}
                      </div>
                      {uw?.summary && <div className="mt-2 line-clamp-2 text-xs text-muted">{uw.summary}</div>}
                    </div>
                    <div className="shrink-0 self-center">
                      <ArrowRight className="h-4 w-4 text-muted" />
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: ReDealStatus }) {
  const map: Record<ReDealStatus, "muted" | "emerald" | "amber" | "rose"> = {
    new: "amber",
    qualified: "emerald",
    under_review: "muted",
    passed: "rose",
    dead: "rose",
  };
  return <Badge tone={map[status]}>{status.replace("_", " ")}</Badge>;
}

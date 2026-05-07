import Link from "next/link";
import { Card, Badge } from "@naples/ui";
import { listDeals, getDealCriteria } from "@naples/db";
import { getMiaTenantId } from "@/lib/tenant";
import { Building2, MapPin, Map, Users, Wallet, Inbox, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

const ACCENT = "#8A6BB8";

export default async function OverviewPage() {
  const tenantId = await getMiaTenantId();
  const [deals, criteria] = await Promise.all([
    listDeals(tenantId, { limit: 25 }),
    getDealCriteria(tenantId),
  ]);
  const qualifying = deals.filter((d) => d.latest_underwrite?.qualifying);
  const newDeals = deals.filter((d) => d.status === "new");

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 md:px-8">
      <header className="mb-8">
        <div className="text-[10px] uppercase tracking-[0.32em]" style={{ color: ACCENT }}>Overview</div>
        <h1 className="mt-2 font-heading text-5xl tracking-broadcast text-cream">Acquisition Pipeline</h1>
        <div className="mt-3 h-px w-16" style={{ background: ACCENT }} />
        <p className="mt-3 max-w-2xl text-sm text-muted">
          On-market deal flow, off-market owner targeting, submarket intel, and coaching pipeline — all scoped to MIA's criteria.
        </p>
      </header>

      <section className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Qualifying deals" value={qualifying.length} accent />
        <Stat label="New (last 25)" value={newDeals.length} />
        <Stat label="Markets tracked" value={criteria?.markets.length ?? 0} />
        <Stat label="Cap rate floor" value={criteria ? `${criteria.target_cap_rate_min}%` : "—"} />
      </section>

      <section className="mb-8">
        <div className="mb-3 text-[10px] uppercase tracking-[0.18em] text-muted">Latest deals</div>
        {deals.length === 0 ? (
          <Card>
            <p className="text-sm text-muted">No deals yet — the on-market scraper hasn't run, or hasn't found qualifying inventory. Check back after the next cron tick or visit <Link href="/deals" className="text-cream underline">On-market</Link>.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {deals.slice(0, 5).map((d) => (
              <Link key={d.id} href={`/deals/${d.id}`} className="block">
                <Card className="transition-colors hover:border-card-border-strong">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-heading text-lg tracking-broadcast text-cream">{d.title ?? d.address ?? "Untitled deal"}</span>
                        {d.latest_underwrite?.qualifying && <Badge tone="emerald">Qualifies</Badge>}
                        <Badge tone="muted">{d.source}</Badge>
                      </div>
                      <div className="mt-1 text-xs text-muted">
                        {d.units ? `${d.units} units · ` : ""}
                        {d.year_built ? `built ${d.year_built} · ` : ""}
                        {d.city ? `${d.city}, ${d.state ?? ""}` : ""}
                      </div>
                      {d.asking_price && (
                        <div className="mt-1 font-mono text-sm text-cream">
                          ${(d.asking_price / 1_000_000).toFixed(1)}M
                          {d.price_per_unit && ` · $${Math.round(d.price_per_unit / 1000)}k/unit`}
                          {d.cap_rate_advertised && ` · ${d.cap_rate_advertised}% cap`}
                        </div>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 text-[10px] uppercase tracking-[0.18em] text-muted">Tools</div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          <Tile href="/deals" icon={Building2} title="On-market deals" desc="LoopNet + Crexi listings, auto-underwritten against MIA's criteria." />
          <Tile href="/off-market" icon={MapPin} title="Off-market owners" desc="Tarrant / Dallas / Harris CAD scrape, owner aging, skip trace." stub />
          <Tile href="/submarkets" icon={Map} title="Submarket intel" desc="Rent comps, occupancy, supply pressure per submarket." stub />
          <Tile href="/students" icon={Users} title="Coaching pipeline" desc="Student deal practice + LOIs + outcomes." stub />
          <Tile href="/investors" icon={Wallet} title="LP pipeline" desc="Capital partners, check sizes, deal allocations." stub />
          <Tile href="/inbox" icon={Inbox} title="Broker inbox" desc="Forwarded broker email blasts → parsed deals." stub />
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <Card>
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted">{label}</div>
      <div className="mt-2 font-heading text-3xl tracking-broadcast text-cream" style={accent ? { color: ACCENT } : undefined}>
        {value}
      </div>
    </Card>
  );
}

function Tile({ href, icon: Icon, title, desc, stub }: {
  href: string; icon: React.ElementType; title: string; desc: string; stub?: boolean;
}) {
  return (
    <Link href={href} className="group block">
      <Card className="h-full transition-colors group-hover:border-card-border-strong">
        <div className="flex items-start justify-between gap-3">
          <div className="rounded-sm bg-bg/60 p-2">
            <Icon className="h-5 w-5 text-cream" />
          </div>
          {stub && <Badge tone="muted">soon</Badge>}
        </div>
        <div className="mt-3 font-heading text-xl tracking-broadcast text-cream">{title}</div>
        <div className="mt-1 text-xs leading-relaxed text-muted">{desc}</div>
      </Card>
    </Link>
  );
}

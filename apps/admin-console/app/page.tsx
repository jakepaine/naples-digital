import Link from "next/link";
import { listTenants, TIERS, type Tier } from "@naples/db";
import { Card, Badge, Button } from "@naples/ui";
import { Plus, ArrowRight, Settings, LayoutGrid } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const tenants = await listTenants();
  return (
    <main className="mx-auto max-w-7xl px-8 py-12">
      <header className="mb-10 flex items-end justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.32em] text-gold">Naples Digital</div>
          <h1 className="mt-2 font-heading text-5xl tracking-broadcast text-cream">Tenant Console</h1>
          <div className="mt-3 h-px w-16 bg-gold" />
        </div>
        <div className="flex items-center gap-2">
          <Link href="/modules"><Button><LayoutGrid className="-ml-1 mr-1 inline h-4 w-4" /> Modules</Button></Link>
          <Link href="/tenants/new"><Button><Plus className="-ml-1 mr-1 inline h-4 w-4" /> New tenant</Button></Link>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Stat label="Total tenants" value={String(tenants.length)} />
        <Stat label="Active" value={String(tenants.filter(t => t.status === "active").length)} tone="emerald" />
        <Stat label="Paying" value={String(tenants.filter(t => ["growth","premium","design_partner","enterprise"].includes(t.tier ?? "starter")).length)} />
        <Stat label="MRR (list)" value={`$${monthlyRevenue(tenants).toLocaleString()}`} tone="emerald" />
      </section>

      <section className="mt-10">
        <div className="mb-4 text-[10px] uppercase tracking-[0.18em] text-muted">Tenants</div>
        <div className="space-y-3">
          {tenants.map(t => (
            <Link key={t.id} href={`/tenants/${t.id}`} className="group block">
              <Card className="transition-colors group-hover:border-gold/60">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="h-10 w-10 shrink-0 border border-card-border"
                      style={{ background: t.brand.primary_color ?? "#E8192C" }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="font-heading text-xl tracking-broadcast text-cream">{t.name}</div>
                        <TierBadge tier={(t.tier ?? "starter") as Tier} />
                        <StatusBadge status={t.status} />
                      </div>
                      <div className="mt-1 font-mono text-xs text-muted">
                        {t.slug} · {t.enabled_modules?.length ?? 0} modules
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <Settings className="h-4 w-4" />
                    <ArrowRight className="h-4 w-4 transition-colors group-hover:text-gold" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
          {tenants.length === 0 && (
            <Card><p className="text-sm text-muted">No tenants yet. Create the first one to begin.</p></Card>
          )}
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value, tone = "cream" }: { label: string; value: string; tone?: "cream" | "emerald" }) {
  const cls = tone === "emerald" ? "text-emerald" : "text-cream";
  return (
    <Card>
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted">{label}</div>
      <div className={`mt-2 font-heading text-3xl tracking-broadcast ${cls}`}>{value}</div>
    </Card>
  );
}

function TierBadge({ tier }: { tier: Tier }) {
  const t = TIERS[tier];
  if (tier === "design_partner") return <Badge tone="emerald">{t.name}</Badge>;
  if (tier === "premium") return <Badge tone="gold">{t.name}</Badge>;
  if (tier === "growth") return <Badge tone="violet">{t.name}</Badge>;
  if (tier === "enterprise") return <Badge tone="rose">{t.name}</Badge>;
  return <Badge tone="muted">{t.name}</Badge>;
}
function StatusBadge({ status }: { status: string }) {
  if (status === "active") return <Badge tone="emerald">Active</Badge>;
  if (status === "paused") return <Badge tone="amber">Paused</Badge>;
  return <Badge tone="rose">Churned</Badge>;
}

function monthlyRevenue(tenants: Array<{ tier?: string }>): number {
  let total = 0;
  for (const t of tenants) {
    const tier = (t.tier ?? "starter") as Tier;
    const def = TIERS[tier];
    if (def && !def.isCustom) total += def.monthlyPrice;
  }
  return total;
}

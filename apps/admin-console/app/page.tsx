import Link from "next/link";
import { listTenants } from "@naples/db";
import { Card, Badge, Button } from "@naples/ui";
import { Plus, ArrowRight, Settings } from "lucide-react";

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
        <Link href="/tenants/new"><Button><Plus className="-ml-1 mr-1 inline h-4 w-4" /> New tenant</Button></Link>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Stat label="Total tenants" value={String(tenants.length)} />
        <Stat label="Active" value={String(tenants.filter(t => t.status === "active").length)} tone="emerald" />
        <Stat label="Agency tier" value={String(tenants.filter(t => t.plan === "agency").length)} />
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
                        <PlanBadge plan={t.plan} />
                        <StatusBadge status={t.status} />
                      </div>
                      <div className="mt-1 font-mono text-xs text-muted">{t.slug}</div>
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

function PlanBadge({ plan }: { plan: string }) {
  if (plan === "agency") return <Badge tone="gold">Agency</Badge>;
  if (plan === "pro") return <Badge tone="violet">Pro</Badge>;
  return <Badge tone="muted">Starter</Badge>;
}
function StatusBadge({ status }: { status: string }) {
  if (status === "active") return <Badge tone="emerald">Active</Badge>;
  if (status === "paused") return <Badge tone="amber">Paused</Badge>;
  return <Badge tone="rose">Churned</Badge>;
}

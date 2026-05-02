import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantById, listTenantIntegrations } from "@naples/db";
import { Card, Badge } from "@naples/ui";
import { ChevronRight, Plug, Users, Layers } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TenantDetail({ params }: { params: { id: string } }) {
  const t = await getTenantById(params.id);
  if (!t) return notFound();
  const integrations = await listTenantIntegrations(t.id);

  return (
    <main className="mx-auto max-w-5xl px-8 py-12">
      <div className="text-[10px] uppercase tracking-[0.32em] text-gold">Tenant</div>
      <div className="mt-2 flex items-center gap-4">
        <div
          className="h-12 w-12 shrink-0 border border-card-border"
          style={{ background: t.brand.primary_color ?? "#E8192C" }}
        />
        <h1 className="font-heading text-5xl tracking-broadcast text-cream">{t.name}</h1>
      </div>
      <div className="mt-3 h-px w-16 bg-gold" />
      <div className="mt-4 flex items-center gap-3">
        <div className="font-mono text-xs text-muted">{t.slug}</div>
        <Badge tone={t.plan === "agency" ? "gold" : t.plan === "pro" ? "violet" : "muted"}>{t.plan}</Badge>
        <Badge tone={t.status === "active" ? "emerald" : "amber"}>{t.status}</Badge>
      </div>

      <section className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Link href={`/tenants/${t.id}/integrations`} className="group">
          <Card className="transition-colors group-hover:border-gold/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gold"><Plug className="h-5 w-5" /><span className="font-heading text-xl tracking-broadcast text-cream">Integrations</span></div>
              <ChevronRight className="h-4 w-4 text-muted transition-colors group-hover:text-gold" />
            </div>
            <p className="mt-3 text-sm text-cream/70">{integrations.length} configured · Instantly, AssemblyAI, Apollo, Stripe</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {integrations.map(i => (
                <Badge key={i.id} tone={i.status === "verified" ? "emerald" : i.status === "failed" ? "rose" : "amber"}>{i.kind}</Badge>
              ))}
              {integrations.length === 0 && <span className="text-xs text-muted">None yet</span>}
            </div>
          </Card>
        </Link>
        <Link href={`/tenants/${t.id}/users`} className="group">
          <Card className="transition-colors group-hover:border-gold/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gold"><Users className="h-5 w-5" /><span className="font-heading text-xl tracking-broadcast text-cream">Users</span></div>
              <ChevronRight className="h-4 w-4 text-muted transition-colors group-hover:text-gold" />
            </div>
            <p className="mt-3 text-sm text-cream/70">Manage operator access</p>
          </Card>
        </Link>
      </section>

      <section className="mt-8">
        <Card>
          <div className="flex items-center gap-2"><Layers className="h-4 w-4 text-gold" /><div className="text-[10px] uppercase tracking-[0.18em] text-muted">Subdomains</div></div>
          <div className="mt-3 space-y-1 font-mono text-xs text-cream/80">
            <div>{t.slug}.naplesdigital.app/dashboard</div>
            <div>{t.slug}.naplesdigital.app/portal</div>
            <div>{t.slug}.naplesdigital.app/crm</div>
          </div>
          <div className="mt-3 text-[11px] text-muted">Path-based fallback always works: <span className="font-mono">/t/{t.slug}/...</span></div>
        </Card>
      </section>
    </main>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, Badge, Button } from "@naples/ui";
import { getDeal } from "@naples/db";
import { getMiaTenantId } from "@/lib/tenant";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { DealStatusControl } from "@/components/DealStatusControl";

export const dynamic = "force-dynamic";

const ACCENT = "#8A6BB8";

export default async function DealDetailPage({ params }: { params: { id: string } }) {
  const tenantId = await getMiaTenantId();
  const deal = await getDeal(tenantId, params.id);
  if (!deal) notFound();
  const latest = deal.underwrites[0];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 md:px-8">
      <Link href="/deals" className="mb-4 inline-flex items-center gap-1 text-xs uppercase tracking-wider text-muted hover:text-cream">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to deals
      </Link>
      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-heading text-4xl tracking-broadcast text-cream">{deal.title ?? deal.address ?? "Deal"}</h1>
          {latest?.qualifying && <Badge tone="emerald">Qualifies</Badge>}
          <Badge tone="muted">{deal.source}</Badge>
        </div>
        <div className="mt-2 text-sm text-muted">
          {deal.address}
          {deal.city ? `, ${deal.city}` : ""}
          {deal.state ? `, ${deal.state}` : ""}
          {deal.zip ? ` ${deal.zip}` : ""}
        </div>
        <div className="mt-3 h-px w-16" style={{ background: ACCENT }} />
      </header>

      <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Units" value={deal.units?.toString() ?? "—"} />
        <Stat label="Year built" value={deal.year_built?.toString() ?? "—"} />
        <Stat label="Asking" value={deal.asking_price ? `$${(deal.asking_price / 1_000_000).toFixed(2)}M` : "—"} />
        <Stat label="$/unit" value={deal.price_per_unit ? `$${Math.round(deal.price_per_unit / 1000)}k` : "—"} />
      </section>

      <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted">Status</div>
          <div className="mt-3"><DealStatusControl dealId={deal.id} status={deal.status} /></div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-muted">First seen</div>
              <div className="text-cream">{new Date(deal.first_seen_at).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-muted">Last seen</div>
              <div className="text-cream">{new Date(deal.last_seen_at).toLocaleString()}</div>
            </div>
          </div>
          {deal.source_url && (
            <Link href={deal.source_url} target="_blank" className="mt-4 inline-flex items-center gap-1 text-xs text-cream hover:text-violet">
              <ExternalLink className="h-3 w-3" /> Open original listing
            </Link>
          )}
        </Card>

        <Card>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted">Broker</div>
          <div className="mt-3 text-sm text-cream">{deal.broker_name ?? "—"}</div>
          <div className="text-xs text-muted">{deal.broker_company ?? ""}</div>
          {deal.broker_email && <div className="mt-2 font-mono text-xs text-cream">{deal.broker_email}</div>}
          {deal.broker_phone && <div className="font-mono text-xs text-cream">{deal.broker_phone}</div>}
        </Card>
      </section>

      <section className="mb-6">
        <div className="mb-3 text-[10px] uppercase tracking-[0.18em] text-muted">Underwriting</div>
        {latest ? (
          <Card>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="Cap rate" value={latest.cap_rate_actual ? `${latest.cap_rate_actual.toFixed(2)}%` : "—"} />
              <Stat label="NOI est." value={latest.noi_estimated ? `$${(latest.noi_estimated / 1000).toFixed(0)}k` : "—"} />
              <Stat label="DSCR" value={latest.dscr_at_market?.toFixed(2) ?? "—"} />
              <Stat label="Value-add upside" value={latest.value_add_upside ? `$${(latest.value_add_upside / 1_000_000).toFixed(1)}M` : "—"} />
            </div>
            {latest.summary && (
              <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-cream/90">{latest.summary}</div>
            )}
            <div className="mt-4 text-[10px] uppercase tracking-wider text-muted">
              Model {latest.model_version} · {new Date(latest.created_at).toLocaleString()}
            </div>
          </Card>
        ) : (
          <Card>
            <div className="text-sm text-muted">No underwriting yet — this listing was logged but not yet scored. Will populate on next cron tick.</div>
          </Card>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted">{label}</div>
      <div className="mt-1 font-heading text-2xl tracking-broadcast text-cream">{value}</div>
    </Card>
  );
}

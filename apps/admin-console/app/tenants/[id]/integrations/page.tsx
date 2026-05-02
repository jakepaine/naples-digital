import { notFound } from "next/navigation";
import { getTenantById, listTenantIntegrations } from "@naples/db";
import { IntegrationsManager } from "@/components/IntegrationsManager";

export const dynamic = "force-dynamic";

const VENDORS = [
  { kind: "instantly", label: "Instantly", category: "outreach", help: "API key from app.instantly.ai → Settings → Integrations" },
  { kind: "smartlead", label: "Smartlead", category: "outreach", help: "API key from app.smartlead.ai → Settings" },
  { kind: "apollo", label: "Apollo", category: "enrichment", help: "API key from app.apollo.io → Settings → Integrations → API" },
  { kind: "clay", label: "Clay", category: "enrichment", help: "API key from clay.com → Settings" },
  { kind: "assemblyai", label: "AssemblyAI", category: "transcription", help: "API key from app.assemblyai.com → Account" },
  { kind: "stripe", label: "Stripe", category: "billing", help: "Secret key from dashboard.stripe.com → Developers → API keys" },
] as const;

export default async function IntegrationsPage({ params }: { params: { id: string } }) {
  const t = await getTenantById(params.id);
  if (!t) return notFound();
  const existing = await listTenantIntegrations(t.id);
  const byKind = new Map(existing.map(i => [i.kind, i]));

  return (
    <main className="mx-auto max-w-3xl px-8 py-12">
      <div className="text-[10px] uppercase tracking-[0.32em] text-gold">{t.name}</div>
      <h1 className="mt-2 font-heading text-5xl tracking-broadcast text-cream">Integrations</h1>
      <div className="mt-3 h-px w-16 bg-gold" />
      <p className="mt-4 max-w-xl text-sm text-cream/70">
        Each tenant brings their own vendor accounts. Paste API keys here.
        Keys are stored on the row and never logged.
      </p>

      <div className="mt-8 space-y-3">
        {VENDORS.map(v => (
          <IntegrationsManager
            key={v.kind}
            tenantId={t.id}
            vendor={v}
            existing={byKind.get(v.kind) ?? null}
          />
        ))}
      </div>
    </main>
  );
}

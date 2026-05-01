import { Card, Badge, Button } from "@naples/ui";
import { LEAD_STAGES, APP_URLS } from "@naples/mock-data";
import { listLeads } from "@naples/db";
import { ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CrmPage() {
  const leads = await listLeads();
  const totalPipeline = leads.reduce((s, l) => s + l.value, 0);
  const won = leads.filter((l) => l.stage === "Client Won");
  const wonValue = won.reduce((s, l) => s + l.value, 0);

  return (
    <main className="px-8 py-8">
      <header className="mb-6 flex items-end justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted">Sales</div>
          <h1 className="mt-1 font-heading text-4xl text-cream">Lead Management</h1>
          <div className="mt-1 h-px w-12 bg-gold" />
        </div>
        <a href={APP_URLS.crm} target="_blank" rel="noopener">
          <Button variant="ghost" size="sm">
            Open Full Kanban <ExternalLink className="ml-2 h-3 w-3" />
          </Button>
        </a>
      </header>

      <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Total Pipeline Value" value={`$${totalPipeline.toLocaleString()}`} sub={`${leads.length} leads · 5 stages`} />
        <StatCard label="Won This Month" value={`$${wonValue.toLocaleString()}`} sub={`${won.length} clients signed`} tone="emerald" />
        <StatCard label="Commission Earned" value={`$${Math.round(wonValue * 0.10).toLocaleString()}`} sub="Naples Digital · 10%" tone="gold" />
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        {LEAD_STAGES.map((stage) => {
          const stageLeads = leads.filter((l) => l.stage === stage);
          const stageTotal = stageLeads.reduce((s, l) => s + l.value, 0);
          return (
            <div key={stage} className="border border-card-border bg-card">
              <div className="border-b border-card-border bg-bg/50 px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] uppercase tracking-wider text-cream">{stage}</div>
                  <div className="text-[11px] text-muted">{stageLeads.length}</div>
                </div>
                <div className="mt-1 text-[10px] text-gold">${stageTotal.toLocaleString()}</div>
              </div>
              <div className="space-y-2 p-3">
                {stageLeads.map((lead) => (
                  <div key={lead.id} className="border border-card-border bg-bg p-3">
                    <div className="text-sm text-cream">{lead.name}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-wider text-muted">{lead.type}</div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-gold">${lead.value.toLocaleString()}</span>
                      <span className="text-[10px] text-muted">Day {lead.daysInStage}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}

function StatCard({ label, value, sub, tone = "cream" }: { label: string; value: string; sub: string; tone?: "cream" | "gold" | "emerald" }) {
  const valueColor = tone === "gold" ? "text-gold" : tone === "emerald" ? "text-emerald" : "text-cream";
  return (
    <Card>
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted">{label}</div>
      <div className={`mt-2 font-heading text-3xl ${valueColor}`}>{value}</div>
      <div className="mt-1 text-xs text-muted">{sub}</div>
    </Card>
  );
}

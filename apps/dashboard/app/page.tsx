import { Card, Badge } from "@naples/ui";
import { Kpi } from "@/components/Kpi";
import { RevenueBarChart } from "@/components/RevenueBarChart";
import { SocialGrowthChart } from "@/components/SocialGrowthChart";
import { LEAD_STAGES } from "@naples/mock-data";
import { listBookings, listLeads, getMrr, getRoadmap, getSocialGrowth } from "@naples/db";
import { getServerTenantId } from "@naples/db/next";
import { CircleDollarSign, Users, CalendarCheck, TrendingUp, CheckCircle2, Circle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const tid = await getServerTenantId();
  const [bookings, leads, mrr, roadmap, social] = await Promise.all([
    listBookings(tid), listLeads(tid), getMrr(tid), getRoadmap(tid), getSocialGrowth(tid),
  ]);
  const recent = bookings.slice(0, 5);

  const stageCounts = LEAD_STAGES.map((stage) => ({
    stage,
    count: leads.filter((l) => l.stage === stage).length,
    total: leads.filter((l) => l.stage === stage).reduce((s, l) => s + l.value, 0),
  }));
  const maxStageCount = Math.max(...stageCounts.map((s) => s.count), 1);

  return (
    <main className="px-8 py-8">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted">Operations Hub</div>
          <h1 className="mt-1 font-heading text-4xl text-cream">Overview</h1>
          <div className="mt-1 h-px w-12 bg-gold" />
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted">As of</div>
          <div className="text-sm text-cream">May 1, 2025 · 9:14 AM</div>
        </div>
      </header>

      {/* Row 1: KPI cards */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Total MRR"
          value={`$${mrr.total.toLocaleString()}`}
          delta={{ value: "+$19,500 vs. 3 months ago", tone: "up" }}
          icon={<CircleDollarSign className="h-4 w-4" />}
        />
        <Kpi
          label="Active Studio Clients"
          value="6"
          delta={{ value: "+4 this quarter", tone: "up" }}
          icon={<Users className="h-4 w-4" />}
        />
        <Kpi
          label="Leads in Pipeline"
          value={String(leads.length)}
          hint="across 5 stages"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <Kpi
          label="ND Commission This Month"
          value={`$${mrr.naplesDigitalCommission.toLocaleString()}`}
          hint="Naples Digital · 10% of new"
          icon={<CalendarCheck className="h-4 w-4" />}
        />
      </section>

      {/* Row 2: Revenue chart */}
      <section className="mt-6">
        <Card>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted">Revenue Breakdown</div>
              <h2 className="mt-1 font-heading text-2xl text-cream">Monthly Recurring Revenue</h2>
            </div>
            <Badge tone="gold">Live · {`$${mrr.total.toLocaleString()}/mo`}</Badge>
          </div>
          <div className="mt-6">
            <RevenueBarChart mrr={mrr} />
          </div>
        </Card>
      </section>

      {/* Row 3: Recent Bookings + Pipeline Summary */}
      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted">Recent Activity</div>
              <h2 className="mt-1 font-heading text-xl text-cream">Recent Bookings</h2>
            </div>
            <a href="/bookings" className="text-[11px] uppercase tracking-wider text-gold hover:text-cream">
              View all →
            </a>
          </div>
          <div className="mt-4 divide-y divide-card-border">
            {recent.map((b) => (
              <div key={b.id} className="grid grid-cols-12 gap-2 py-3 text-sm">
                <div className="col-span-5 truncate text-cream">{b.client}</div>
                <div className="col-span-3 truncate text-xs text-muted">{b.package}</div>
                <div className="col-span-2 text-xs text-muted">{b.date.slice(5)}</div>
                <div className="col-span-1 text-right text-xs text-gold">${b.revenue.toLocaleString()}</div>
                <div className="col-span-1 text-right">
                  <StatusBadge status={b.status} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted">Sales Pipeline</div>
              <h2 className="mt-1 font-heading text-xl text-cream">Pipeline Summary</h2>
            </div>
            <a href="/crm" className="text-[11px] uppercase tracking-wider text-gold hover:text-cream">
              Open kanban →
            </a>
          </div>
          <div className="mt-4 space-y-3">
            {stageCounts.map((s) => (
              <div key={s.stage}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-cream">{s.stage}</span>
                  <span className="text-muted">
                    {s.count} {s.count === 1 ? "lead" : "leads"} · ${s.total.toLocaleString()}
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded bg-card-border">
                  <div
                    className="h-full bg-gold"
                    style={{ width: `${(s.count / maxStageCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Row 4: Social Growth */}
      <section className="mt-6">
        <Card>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted">Audience</div>
              <h2 className="mt-1 font-heading text-2xl text-cream">12-Week Social Growth</h2>
            </div>
            <Badge tone="emerald">+172% audience trailing 90d</Badge>
          </div>
          <div className="mt-6">
            <SocialGrowthChart data={social} />
          </div>
        </Card>
      </section>

      {/* Row 5: 90-Day Roadmap */}
      <section className="mt-6">
        <Card>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted">Build Plan</div>
          <h2 className="mt-1 font-heading text-2xl text-cream">90-Day Roadmap Progress</h2>
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {[roadmap.phase1, roadmap.phase2, roadmap.phase3].map((phase) => {
              const done = phase.items.filter((i) => i.done).length;
              const pct = (done / phase.items.length) * 100;
              return (
                <div key={phase.label}>
                  <div className="text-[11px] uppercase tracking-wider text-gold">{phase.label}</div>
                  <div className="mt-2 h-1 overflow-hidden bg-card-border">
                    <div className="h-full bg-gold" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-1 text-[10px] text-muted">{done} of {phase.items.length} complete</div>
                  <ul className="mt-4 space-y-2.5 text-sm">
                    {phase.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        {item.done ? (
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
                        ) : (
                          <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" />
                        )}
                        <span className={item.done ? "text-cream" : "text-muted"}>{item.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </Card>
      </section>
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map = {
    confirmed: { tone: "emerald" as const, label: "Confirmed" },
    pending: { tone: "amber" as const, label: "Pending" },
    completed: { tone: "muted" as const, label: "Completed" },
  } as const;
  const { tone, label } = map[status as keyof typeof map];
  return <Badge tone={tone}>{label}</Badge>;
}

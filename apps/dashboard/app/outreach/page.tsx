import { Card, Button } from "@naples/ui";
import { Kpi } from "@/components/Kpi";
import { OUTREACH_STATS, APP_URLS } from "@naples/mock-data";
import { Mail, Eye, Reply, CalendarCheck, ExternalLink } from "lucide-react";

export default function OutreachPage() {
  return (
    <main className="px-8 py-8">
      <header className="mb-6 flex items-end justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted">Sales Engine</div>
          <h1 className="mt-1 font-heading text-4xl text-cream">Outreach</h1>
          <div className="mt-1 h-px w-12 bg-gold" />
        </div>
        <a href={APP_URLS.outreach} target="_blank" rel="noopener">
          <Button>
            Open Live Generator <ExternalLink className="ml-2 h-3 w-3" />
          </Button>
        </a>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Kpi label="Emails Sent (this week)" value={String(OUTREACH_STATS.emailsSentThisWeek)} icon={<Mail className="h-4 w-4" />} hint="across 3 sequences" />
        <Kpi label="Opens" value={String(OUTREACH_STATS.opens)} icon={<Eye className="h-4 w-4" />} hint={`${Math.round((OUTREACH_STATS.opens / OUTREACH_STATS.emailsSentThisWeek) * 100)}% open rate`} />
        <Kpi label="Replies" value={String(OUTREACH_STATS.replies)} icon={<Reply className="h-4 w-4" />} hint={`${((OUTREACH_STATS.replies / OUTREACH_STATS.emailsSentThisWeek) * 100).toFixed(1)}% reply rate`} />
        <Kpi label="Meetings Booked" value={String(OUTREACH_STATS.meetingsBooked)} icon={<CalendarCheck className="h-4 w-4" />} hint="qualified · this week" delta={{ value: "Coastal Financial", tone: "neutral" }} />
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted">Sequence 1</div>
          <h3 className="mt-1 font-heading text-xl text-cream">Naples Real Estate</h3>
          <div className="mt-4 space-y-2 text-sm text-muted">
            <div>Targets: Top 200 luxury agents in Naples + Marco Island</div>
            <div>Goal: Real Estate Studio Sessions ($300–600/session)</div>
            <div>Sent: 22 · Opens: 7 · Replies: 2</div>
          </div>
        </Card>
        <Card>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted">Sequence 2</div>
          <h3 className="mt-1 font-heading text-xl text-cream">SWFL Financial</h3>
          <div className="mt-4 space-y-2 text-sm text-muted">
            <div>Targets: Wealth managers, mortgage brokers</div>
            <div>Goal: Billionaire Coast Sponsor (Silver/Gold)</div>
            <div>Sent: 15 · Opens: 4 · Replies: 1</div>
          </div>
        </Card>
        <Card>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted">Sequence 3</div>
          <h3 className="mt-1 font-heading text-xl text-cream">SWFL Founders</h3>
          <div className="mt-4 space-y-2 text-sm text-muted">
            <div>Targets: 239 Built guest pipeline (founders &lt; 5yr)</div>
            <div>Goal: Guest booking + Bronze Sponsor combo</div>
            <div>Sent: 10 · Opens: 1 · Replies: 0</div>
          </div>
        </Card>
      </section>

      <section className="mt-6">
        <Card>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted">Live Generator</div>
          <h2 className="mt-1 font-heading text-2xl text-cream">AI Outreach Engine</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Type a business name. The system generates a 3-email cold sequence in under 10 seconds — using
            Claude Sonnet 4.6 trained on Naples Digital's voice and the 239 Live offer stack.
          </p>
          <div className="mt-6 aspect-video w-full overflow-hidden border border-card-border bg-bg">
            <iframe
              src={APP_URLS.outreach}
              className="h-full w-full"
              title="Outreach Demo"
            />
          </div>
        </Card>
      </section>
    </main>
  );
}

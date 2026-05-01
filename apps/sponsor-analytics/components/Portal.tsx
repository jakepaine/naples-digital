import { Card, Badge } from "@naples/ui";
import { ImpressionsChart, ClipPlaysChart, MentionsChart } from "./Charts";
import { Eye, PlayCircle, Megaphone, TrendingUp, Lock } from "lucide-react";

interface Sponsor {
  id: string;
  name: string;
  magic_link_token: string;
  created_at: string;
}

interface Metric {
  id: string;
  sponsor_id: string;
  week: string;
  impressions: number;
  clip_plays: number;
  mentions: number;
}

export function Portal({ sponsor, metrics }: { sponsor: Sponsor; metrics: Metric[] }) {
  const totalImpressions = metrics.reduce((s, m) => s + m.impressions, 0);
  const totalClipPlays = metrics.reduce((s, m) => s + m.clip_plays, 0);
  const totalMentions = metrics.reduce((s, m) => s + m.mentions, 0);
  const estValue = Math.round(totalImpressions * 0.012 + totalClipPlays * 0.18);

  const first = metrics[0];
  const last = metrics[metrics.length - 1];
  const impressionsLift = first && last && first.impressions > 0
    ? Math.round(((last.impressions - first.impressions) / first.impressions) * 100)
    : 0;

  return (
    <main className="px-6 py-12">
      <header className="mx-auto max-w-7xl">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-gold">
          <Lock className="h-3 w-3" /> Private · Sponsor Portal
        </div>
        <h1 className="mt-3 font-heading text-5xl text-cream">{sponsor.name}</h1>
        <div className="mt-3 h-px w-16 bg-gold" />
        <p className="mt-4 max-w-2xl text-sm text-cream/70">
          Your private analytics for sponsorships across 239 Live shows. Updated weekly
          from Instagram, TikTok, YouTube, Facebook, and the show feed itself.
        </p>
      </header>

      <section className="mx-auto mt-8 grid max-w-7xl grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Total Impressions" value={totalImpressions.toLocaleString()} hint={`+${impressionsLift}% over period`} icon={<Eye className="h-4 w-4" />} />
        <Kpi label="Clip Plays" value={totalClipPlays.toLocaleString()} hint="across IG / TT / YT" icon={<PlayCircle className="h-4 w-4" />} />
        <Kpi label="Brand Mentions" value={String(totalMentions)} hint="show + clip mentions" icon={<Megaphone className="h-4 w-4" />} />
        <Kpi label="Estimated Value" value={`$${estValue.toLocaleString()}`} hint="vs. paid social CPM" tone="gold" icon={<TrendingUp className="h-4 w-4" />} />
      </section>

      <section className="mx-auto mt-6 max-w-7xl">
        <Card>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted">Reach</div>
              <h2 className="mt-1 font-heading text-2xl text-cream">Weekly Impressions</h2>
            </div>
            <Badge tone="gold">Trending up</Badge>
          </div>
          <div className="mt-6">
            <ImpressionsChart data={metrics} />
          </div>
        </Card>
      </section>

      <section className="mx-auto mt-6 grid max-w-7xl grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted">Distribution</div>
          <h2 className="mt-1 font-heading text-xl text-cream">Clip Plays</h2>
          <div className="mt-6">
            <ClipPlaysChart data={metrics} />
          </div>
        </Card>
        <Card>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted">Brand Surface</div>
          <h2 className="mt-1 font-heading text-xl text-cream">Mentions Timeline</h2>
          <div className="mt-6">
            <MentionsChart data={metrics} />
          </div>
        </Card>
      </section>

      <footer className="mx-auto mt-10 max-w-7xl border-t border-card-border pt-6 text-[11px] text-muted">
        Reporting period: {first?.week ?? "—"} → {last?.week ?? "—"} · Sponsor since {sponsor.created_at.slice(0, 10)} · Powered by 239 Live × Naples Digital. This portal is private to {sponsor.name}; do not share the URL outside your team.
      </footer>
    </main>
  );
}

function Kpi({ label, value, hint, icon, tone = "cream" }: { label: string; value: string; hint: string; icon: React.ReactNode; tone?: "cream" | "gold" }) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted">{label}</div>
        <div className="text-muted">{icon}</div>
      </div>
      <div className={`mt-2 font-heading text-3xl ${tone === "gold" ? "text-gold" : "text-cream"}`}>{value}</div>
      <div className="mt-1 text-[11px] text-muted">{hint}</div>
    </Card>
  );
}

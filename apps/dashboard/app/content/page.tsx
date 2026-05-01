import { Card, Badge, Button } from "@naples/ui";
import { APP_URLS } from "@naples/mock-data";
import { listEpisodes } from "@naples/db";
import { ExternalLink, Instagram, Youtube, Facebook, Music2 } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_TONE = {
  Scheduled: "muted",
  Recording: "sapphire",
  Transcribing: "amber",
  Editing: "amber",
  Clipped: "violet",
  Posted: "emerald",
  Draft: "muted",
} as const;

export default async function ContentPage() {
  const episodes = await listEpisodes();
  return (
    <main className="px-8 py-8">
      <header className="mb-6 flex items-end justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted">Production</div>
          <h1 className="mt-1 font-heading text-4xl text-cream">Content Pipeline</h1>
          <div className="mt-1 h-px w-12 bg-gold" />
        </div>
        <a href={APP_URLS.content} target="_blank" rel="noopener">
          <Button variant="ghost" size="sm">
            Open Full Tracker <ExternalLink className="ml-2 h-3 w-3" />
          </Button>
        </a>
      </header>

      <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted">Episodes in Production</div>
          <div className="mt-2 font-heading text-3xl text-cream">{episodes.length}</div>
          <div className="mt-1 text-xs text-muted">3 shows · this month</div>
        </Card>
        <Card>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted">Clips Posted</div>
          <div className="mt-2 font-heading text-3xl text-gold">{episodes.reduce((s, e) => s + e.clipsPosted, 0)}</div>
          <div className="mt-1 text-xs text-muted">across all platforms</div>
        </Card>
        <Card>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted">Estimated Reach</div>
          <div className="mt-2 font-heading text-3xl text-cream">42.8K</div>
          <div className="mt-1 text-xs text-muted">cross-platform · 30d</div>
        </Card>
        <Card>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted">Engagement Rate</div>
          <div className="mt-2 font-heading text-3xl text-emerald">4.7%</div>
          <div className="mt-1 text-xs text-muted">avg across clips</div>
        </Card>
      </section>

      <Card>
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted">All Episodes</div>
        <h2 className="mt-1 font-heading text-2xl text-cream">Production Schedule</h2>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border text-left text-[10px] uppercase tracking-wider text-muted">
                <th className="py-3 pr-4">Show</th>
                <th className="py-3 pr-4">Episode</th>
                <th className="py-3 pr-4">Guest</th>
                <th className="py-3 pr-4">Record Date</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4 text-right">Clips</th>
                <th className="py-3">Distribution</th>
              </tr>
            </thead>
            <tbody>
              {episodes.map((ep) => (
                <tr key={ep.id} className="border-b border-card-border/50 hover:bg-card-border/20">
                  <td className="py-3 pr-4 text-gold">{ep.show}</td>
                  <td className="py-3 pr-4 text-cream">{ep.title}</td>
                  <td className="py-3 pr-4 text-muted">
                    {ep.guest}
                    {ep.guestTitle && <span className="text-[11px]"> · {ep.guestTitle}</span>}
                  </td>
                  <td className="py-3 pr-4 text-muted">{ep.recordDate}</td>
                  <td className="py-3 pr-4">
                    <Badge tone={STATUS_TONE[ep.status]}>{ep.status}</Badge>
                  </td>
                  <td className="py-3 pr-4 text-right text-xs text-cream">
                    {ep.clipsPosted}/{ep.clipsCut}
                  </td>
                  <td className="py-3">
                    <PlatformDots platforms={ep.platforms} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
}

function PlatformDots({ platforms }: { platforms: string[] }) {
  const all = [
    { key: "instagram", icon: Instagram },
    { key: "tiktok", icon: Music2 },
    { key: "youtube", icon: Youtube },
    { key: "facebook", icon: Facebook },
  ];
  return (
    <div className="flex gap-1.5">
      {all.map(({ key, icon: Icon }) => {
        const active = platforms.includes(key);
        return (
          <span
            key={key}
            className={`flex h-6 w-6 items-center justify-center rounded border ${
              active ? "border-gold bg-gold/10 text-gold" : "border-card-border text-muted/40"
            }`}
          >
            <Icon className="h-3 w-3" />
          </span>
        );
      })}
    </div>
  );
}

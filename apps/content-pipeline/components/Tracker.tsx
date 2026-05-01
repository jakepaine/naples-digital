"use client";
import { useState } from "react";
import { Card, Badge, Button } from "@naples/ui";
import { Episode, EpisodeStatus, Platform } from "@naples/mock-data";
import { Instagram, Youtube, Facebook, Music2, Plus, CheckCircle2, Clock, Minus } from "lucide-react";

const STATUS_TONE: Record<EpisodeStatus, "muted" | "sapphire" | "amber" | "violet" | "emerald"> = {
  Draft: "muted",
  Scheduled: "muted",
  Recording: "sapphire",
  Transcribing: "amber",
  Editing: "amber",
  Clipped: "violet",
  Posted: "emerald",
};

interface NewGuest {
  name: string;
  company: string;
  show: "Billionaire Coast" | "239 Built" | "SWFL Keys";
  topic: string;
  recordDate: string;
  instagram: string;
  notes: string;
}

export function Tracker({ initialEpisodes }: { initialEpisodes: Episode[] }) {
  const [episodes, setEpisodes] = useState<Episode[]>(initialEpisodes);
  const [submittedName, setSubmittedName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<NewGuest>({
    name: "",
    company: "",
    show: "Billionaire Coast",
    topic: "",
    recordDate: "",
    instagram: "",
    notes: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.topic.trim()) return;
    setSubmitting(true);
    let saved: Episode | null = null;
    try {
      const res = await fetch("/api/episodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          show: form.show,
          title: form.topic,
          guest: form.name,
          guestTitle: form.company,
          recordDate: form.recordDate || undefined,
        }),
      });
      const json = (await res.json()) as { episode: Episode | null };
      saved = json.episode;
    } catch {
      // ignore — fall through to optimistic local insert
    }
    const ep: Episode = saved ?? {
      id: `local-${Date.now()}`,
      show: form.show,
      title: form.topic,
      guest: form.name,
      guestTitle: form.company,
      recordDate: form.recordDate || new Date().toISOString().slice(0, 10),
      status: "Scheduled",
      clipsCut: 0,
      clipsPosted: 0,
      platforms: [],
    };
    setEpisodes((prev) => [ep, ...prev]);
    setSubmittedName(form.name);
    setForm({ name: "", company: "", show: "Billionaire Coast", topic: "", recordDate: "", instagram: "", notes: "" });
    setSubmitting(false);
    setTimeout(() => setSubmittedName(null), 4000);
  }

  const totalClips = episodes.reduce((s, e) => s + e.clipsPosted, 0);
  const reach = "42.8K";
  const engagement = "4.7%";

  return (
    <div className="px-6 py-12">
      <header className="mx-auto mb-8 max-w-7xl">
        <div className="text-[10px] uppercase tracking-[0.32em] text-gold">Production</div>
        <h1 className="mt-3 font-heading text-5xl text-cream">Content Pipeline</h1>
        <div className="mt-3 h-px w-16 bg-gold" />
        <p className="mt-4 max-w-2xl text-sm text-cream/70">
          Every episode tracked from booking through distribution. Clips, platforms, reach — all visible in one
          board so Kevin always knows where the content stands.
        </p>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Episodes Active" value={String(episodes.length)} sub="3 shows · this month" />
            <StatCard label="Clips Posted" value={String(totalClips)} sub="all platforms" tone="gold" />
            <StatCard label="Estimated Reach" value={reach} sub="cross-platform · 30d" />
            <StatCard label="Engagement Rate" value={engagement} sub="avg across clips" tone="emerald" />
          </section>

          <Card>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-muted">Episode Pipeline</div>
                <h2 className="mt-1 font-heading text-2xl text-cream">Production Schedule</h2>
              </div>
            </div>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-card-border text-left text-[10px] uppercase tracking-wider text-muted">
                    <th className="py-3 pr-3">Show</th>
                    <th className="py-3 pr-3">Episode</th>
                    <th className="py-3 pr-3">Guest</th>
                    <th className="py-3 pr-3">Date</th>
                    <th className="py-3 pr-3">Status</th>
                    <th className="py-3 pr-3 text-right">Clips</th>
                  </tr>
                </thead>
                <tbody>
                  {episodes.map((ep) => (
                    <tr key={ep.id} className="border-b border-card-border/40 hover:bg-card-border/20">
                      <td className="py-3 pr-3 text-gold">{ep.show}</td>
                      <td className="py-3 pr-3 text-cream">{ep.title}</td>
                      <td className="py-3 pr-3 text-muted">
                        {ep.guest}
                        {ep.guestTitle && <span className="text-[11px]"> · {ep.guestTitle}</span>}
                      </td>
                      <td className="py-3 pr-3 text-muted">{ep.recordDate}</td>
                      <td className="py-3 pr-3">
                        <StatusBadge status={ep.status} />
                      </td>
                      <td className="py-3 pr-3 text-right text-xs text-cream">
                        {ep.clipsPosted}/{ep.clipsCut}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted">Distribution</div>
            <h2 className="mt-1 font-heading text-2xl text-cream">Platform Coverage</h2>
            <p className="mt-2 text-xs text-muted">For each episode, where clips have landed (or are scheduled to land).</p>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-card-border text-left text-[10px] uppercase tracking-wider text-muted">
                    <th className="py-3 pr-4">Episode</th>
                    <th className="py-3 pr-4 text-center">Instagram</th>
                    <th className="py-3 pr-4 text-center">TikTok</th>
                    <th className="py-3 pr-4 text-center">YouTube</th>
                    <th className="py-3 pr-4 text-center">Facebook</th>
                  </tr>
                </thead>
                <tbody>
                  {episodes.map((ep) => (
                    <tr key={ep.id} className="border-b border-card-border/40">
                      <td className="py-3 pr-4 text-cream">{ep.title}</td>
                      {(["instagram", "tiktok", "youtube", "facebook"] as Platform[]).map((p) => (
                        <td key={p} className="py-3 pr-4 text-center">
                          <PlatformDot active={ep.platforms.includes(p)} status={ep.status} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* RIGHT SIDEBAR — Guest Intake Form */}
        <aside className="lg:col-span-4">
          <Card>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted">New Booking</div>
            <h2 className="mt-1 font-heading text-2xl text-cream">Guest Intake</h2>
            <p className="mt-2 text-xs text-muted">Add a guest. They'll appear at the top of the pipeline as Scheduled.</p>

            {submittedName && (
              <div className="mt-4 flex items-center gap-2 border border-emerald/40 bg-emerald/10 px-3 py-2 text-sm text-emerald">
                <CheckCircle2 className="h-4 w-4" />
                {submittedName} added to pipeline
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 grid gap-3">
              <Field label="Guest Name *">
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="e.g., Diana Russo" />
              </Field>
              <Field label="Company / Title">
                <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className={inputCls} placeholder="e.g., Premier Naples Estates" />
              </Field>
              <Field label="Show">
                <select value={form.show} onChange={(e) => setForm({ ...form, show: e.target.value as NewGuest["show"] })} className={inputCls}>
                  <option>Billionaire Coast</option>
                  <option>239 Built</option>
                  <option>SWFL Keys</option>
                </select>
              </Field>
              <Field label="Episode Topic *">
                <input required value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} className={inputCls} placeholder="e.g., Naples Real Estate Cycle" />
              </Field>
              <Field label="Preferred Record Date">
                <input type="date" value={form.recordDate} onChange={(e) => setForm({ ...form, recordDate: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Instagram / LinkedIn">
                <input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} className={inputCls} placeholder="@handle" />
              </Field>
              <Field label="Notes for Producer">
                <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={`${inputCls} resize-none`} placeholder="Topics to cover, sensitivity flags, preferred angle..." />
              </Field>
              <Button type="submit" className="mt-2 w-full" disabled={submitting}>
                <Plus className="mr-2 h-4 w-4" /> {submitting ? "Adding…" : "Add to Pipeline"}
              </Button>
            </form>
          </Card>
        </aside>
      </div>
    </div>
  );
}

const inputCls =
  "w-full border border-card-border bg-bg px-3 py-2 text-sm text-cream placeholder:text-muted/60 focus:border-gold focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider text-muted">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function StatCard({ label, value, sub, tone = "cream" }: { label: string; value: string; sub: string; tone?: "cream" | "gold" | "emerald" }) {
  const valueColor = tone === "gold" ? "text-gold" : tone === "emerald" ? "text-emerald" : "text-cream";
  return (
    <Card>
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted">{label}</div>
      <div className={`mt-2 font-heading text-2xl ${valueColor}`}>{value}</div>
      <div className="mt-1 text-[11px] text-muted">{sub}</div>
    </Card>
  );
}

function StatusBadge({ status }: { status: EpisodeStatus }) {
  const cls = status === "Transcribing" ? "animate-gold-pulse" : "";
  return <Badge tone={STATUS_TONE[status]} className={cls}>{status}</Badge>;
}

function PlatformDot({ active, status }: { active: boolean; status: EpisodeStatus }) {
  if (active) {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded border border-emerald bg-emerald/15 text-emerald">
        <CheckCircle2 className="h-3 w-3" />
      </span>
    );
  }
  if (status === "Editing" || status === "Transcribing" || status === "Recording") {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded border border-amber/40 bg-amber/10 text-amber">
        <Clock className="h-3 w-3" />
      </span>
    );
  }
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded border border-card-border text-muted/40">
      <Minus className="h-3 w-3" />
    </span>
  );
}

"use client";
import { useEffect, useState } from "react";
import { Card, Badge, Button } from "@naples/ui";
import { X, Sparkles, Send, Mail, CheckCircle2, AlertCircle, Loader2, Plug } from "lucide-react";

type SeqEmail = { step: number; subject: string; body: string; delay_days?: number };
type Sequence = { id: string; vendor: string; state: string; emails: SeqEmail[]; external_id: string | null; pushed_at: string | null };
type Send = { id: string; sequence_id: string; step: number; lead_email: string; sent_at: string | null; opened_at: string | null; clicked_at: string | null; replied_at: string | null; bounced_at: string | null };
type LeadFull = {
  lead: { id: string; name: string; type: string; goal: string; stage: string; value: number; primary_email?: string | null; domain?: string | null; enrichment_status: string };
  emails: { id: string; email: string; primary_address: boolean }[];
  sequences: Sequence[];
  sends: Send[];
  enrichment: { source: string; raw: Record<string, unknown>; fetched_at: string } | null;
};

export function LeadDrawer({ leadId, onClose }: { leadId: string; onClose: () => void }) {
  const [data, setData] = useState<LeadFull | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setError(null);
    const res = await fetch(`/api/leads/${leadId}/full`);
    if (res.ok) setData(await res.json());
    else setError("Failed to load");
  }

  useEffect(() => { reload(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [leadId]);

  async function enrich() {
    setBusy("enrich"); setError(null);
    const res = await fetch(`/api/leads/${leadId}/enrich`, { method: "POST" });
    if (!res.ok) setError((await res.json().catch(() => ({}))).error ?? "Enrichment failed");
    await reload();
    setBusy(null);
  }

  async function generate(push: boolean) {
    setBusy(push ? "push" : "generate"); setError(null);
    const res = await fetch(`/api/leads/${leadId}/sequences`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ push }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? `Failed (${res.status})`);
    }
    await reload();
    setBusy(null);
  }

  if (!data) {
    return (
      <DrawerShell onClose={onClose}>
        <div className="flex items-center gap-2 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading lead…
        </div>
      </DrawerShell>
    );
  }

  const lead = data.lead;
  const primary = data.emails.find(e => e.primary_address) ?? data.emails[0];
  const lastSeq = data.sequences[0];

  return (
    <DrawerShell onClose={onClose} title={lead.name}>
      <div className="space-y-6">
        {/* Identity */}
        <section>
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-3xl tracking-broadcast text-cream">{lead.name}</h2>
            <Badge tone="muted">{lead.type}</Badge>
          </div>
          <div className="mt-2 text-sm text-cream/70">{lead.goal} · ${lead.value.toLocaleString()}</div>
          <div className="mt-2 text-xs text-muted">Stage: {lead.stage}</div>
          {primary && <div className="mt-3 flex items-center gap-2 font-mono text-xs text-cream"><Mail className="h-3.5 w-3.5 text-gold" />{primary.email}</div>}
          {lead.domain && <div className="mt-1 font-mono text-xs text-muted">@{lead.domain}</div>}
        </section>

        {error && (
          <Card>
            <div className="flex items-center gap-2 text-rose-400">
              <AlertCircle className="h-4 w-4" /><span className="text-sm">{error}</span>
            </div>
          </Card>
        )}

        {/* Enrichment */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted">Enrichment</div>
            <Button size="sm" onClick={enrich} disabled={busy !== null}>
              {busy === "enrich" ? "…" : data.enrichment ? "Re-enrich" : "Enrich"}
            </Button>
          </div>
          {data.enrichment ? (
            <Card>
              <div className="text-[10px] uppercase tracking-wider text-gold">Source: {data.enrichment.source}</div>
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-xs text-cream/80">{JSON.stringify(data.enrichment.raw, null, 2).slice(0, 600)}</pre>
            </Card>
          ) : (
            <Card><p className="text-xs text-muted">No enrichment yet. Configure Apollo or Clay in admin-console → Integrations.</p></Card>
          )}
        </section>

        {/* Sequence */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted">Outreach Sequence</div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => generate(false)} disabled={busy !== null || !primary}>
                {busy === "generate" ? "…" : <><Sparkles className="-ml-1 mr-1 inline h-3.5 w-3.5" />Generate</>}
              </Button>
              <Button size="sm" onClick={() => generate(true)} disabled={busy !== null || !primary}>
                {busy === "push" ? "…" : <><Send className="-ml-1 mr-1 inline h-3.5 w-3.5" />Generate &amp; Push</>}
              </Button>
            </div>
          </div>
          {lastSeq ? (
            <Card>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider">
                <Plug className="h-3.5 w-3.5 text-gold" />
                <span className="text-gold">{lastSeq.vendor}</span>
                <SequenceStateBadge state={lastSeq.state} />
                {lastSeq.external_id && <span className="font-mono text-muted">{lastSeq.external_id.slice(0, 8)}…</span>}
              </div>
              <div className="mt-3 space-y-3">
                {lastSeq.emails.map((em, i) => (
                  <div key={i} className="border-l-2 border-card-border pl-3">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] uppercase tracking-wider text-muted">Email {em.step}{em.delay_days ? ` · Day ${cumDays(lastSeq.emails, em.step)}` : " · Day 0"}</div>
                      <SendBadge send={data.sends.find(s => s.sequence_id === lastSeq.id && s.step === em.step)} />
                    </div>
                    <div className="mt-1 text-sm text-cream">{em.subject}</div>
                    <div className="mt-1 whitespace-pre-line text-xs text-cream/70">{em.body}</div>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card><p className="text-xs text-muted">No sequence yet. Click Generate to draft 3 emails with Claude.</p></Card>
          )}
        </section>

        {/* Send timeline */}
        {data.sends.length > 0 && (
          <section>
            <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-muted">Send Timeline</div>
            <div className="space-y-1 text-xs">
              {data.sends.map(s => (
                <div key={s.id} className="flex items-center justify-between border-b border-card-border/40 py-1.5">
                  <span className="text-cream">Email {s.step}</span>
                  <SendStatusInline send={s} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </DrawerShell>
  );
}

function DrawerShell({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-bg/80 backdrop-blur-sm" onClick={onClose} />
      <aside className="h-full w-[520px] overflow-y-auto border-l border-card-border bg-bg p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-[0.32em] text-gold">Lead detail{title ? ` · ${title}` : ""}</div>
          <button onClick={onClose} className="text-muted hover:text-cream"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </aside>
    </div>
  );
}

function SequenceStateBadge({ state }: { state: string }) {
  const tone =
    state === "active" || state === "pushed" ? "emerald" as const :
    state === "replied" ? "violet" as const :
    state === "bounced" || state === "failed" ? "rose" as const :
    state === "completed" ? "muted" as const :
    "amber" as const;
  return <Badge tone={tone}>{state}</Badge>;
}

function SendBadge({ send }: { send: Send | undefined }) {
  if (!send) return <Badge tone="muted">queued</Badge>;
  if (send.replied_at) return <Badge tone="violet">replied</Badge>;
  if (send.bounced_at) return <Badge tone="rose">bounced</Badge>;
  if (send.clicked_at) return <Badge tone="emerald">clicked</Badge>;
  if (send.opened_at) return <Badge tone="emerald">opened</Badge>;
  if (send.sent_at) return <Badge tone="gold">sent</Badge>;
  return <Badge tone="muted">queued</Badge>;
}

function SendStatusInline({ send }: { send: Send }) {
  const events = [
    send.bounced_at && { kind: "bounced", ts: send.bounced_at, color: "text-rose-400" },
    send.replied_at && { kind: "replied", ts: send.replied_at, color: "text-violet-400" },
    send.clicked_at && { kind: "clicked", ts: send.clicked_at, color: "text-emerald" },
    send.opened_at && { kind: "opened", ts: send.opened_at, color: "text-emerald" },
    send.sent_at && { kind: "sent", ts: send.sent_at, color: "text-gold" },
  ].filter(Boolean) as Array<{ kind: string; ts: string; color: string }>;
  if (events.length === 0) return <span className="text-muted">queued</span>;
  return (
    <div className="flex items-center gap-2">
      <CheckCircle2 className="h-3 w-3 text-emerald" />
      <span className={events[0].color}>{events[0].kind}</span>
      <span className="text-muted">{new Date(events[0].ts).toLocaleString()}</span>
    </div>
  );
}

function cumDays(emails: SeqEmail[], step: number): number {
  let d = 0;
  for (const e of emails) {
    if (e.step <= step) d += e.delay_days ?? 0;
  }
  return d;
}

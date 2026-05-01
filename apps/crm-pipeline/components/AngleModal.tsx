"use client";
import { useEffect, useState } from "react";
import { Sparkles, X, Copy, Check, RefreshCw } from "lucide-react";
import { Button } from "@naples/ui";
import type { Lead } from "@naples/mock-data";

interface Angle {
  summary: string;
  hooks: string[];
  draft_dm: string;
  source: "api" | "mock" | "fallback";
}

const SOURCE_LABEL: Record<Angle["source"], { text: string; cls: string }> = {
  api: { text: "Live · Claude Sonnet 4.6", cls: "border-gold/60 text-gold" },
  mock: { text: "Preview mode", cls: "border-card-border text-muted" },
  fallback: { text: "Preview mode (API fallback)", cls: "border-amber/60 text-amber" },
};

export function AngleModal({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const [angle, setAngle] = useState<Angle | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  async function fetchAngle(force = false) {
    if (force) setRegenerating(true);
    else setLoading(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}/angle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force }),
      });
      const json = (await res.json()) as Angle;
      setAngle(json);
    } catch {
      setAngle(null);
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  }

  useEffect(() => {
    fetchAngle(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.id]);

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1200);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl border border-card-border bg-card shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-muted transition-colors hover:text-cream"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="border-b border-card-border bg-bg/40 px-6 py-5">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-gold">
            <Sparkles className="h-3.5 w-3.5" />
            Lead Intelligence
          </div>
          <h2 className="mt-2 font-heading text-2xl text-cream">{lead.name}</h2>
          <div className="mt-1 text-xs text-muted">
            {lead.type} · Goal: {lead.goal} · ${lead.value.toLocaleString()} potential
          </div>
        </div>

        <div className="space-y-6 px-6 py-6">
          {loading ? (
            <Loading />
          ) : !angle ? (
            <div className="text-sm text-rose">
              Couldn't generate an angle right now. Try again in a moment.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className={`border px-2.5 py-1 text-[10px] uppercase tracking-wider ${SOURCE_LABEL[angle.source].cls}`}>
                  {SOURCE_LABEL[angle.source].text}
                </span>
                <button
                  onClick={() => fetchAngle(true)}
                  disabled={regenerating}
                  className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted transition-colors hover:text-cream disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${regenerating ? "animate-spin" : ""}`} />
                  {regenerating ? "Regenerating…" : "Regenerate"}
                </button>
              </div>

              <Section label="Summary">
                <div className="flex items-start justify-between gap-3 text-sm leading-relaxed text-cream/90">
                  <p>{angle.summary}</p>
                  <CopyButton onClick={() => copy(angle.summary, "summary")} active={copied === "summary"} />
                </div>
              </Section>

              <Section label="Personalized Angles">
                <ul className="space-y-2.5">
                  {angle.hooks.map((h, i) => (
                    <li key={i} className="flex items-start justify-between gap-3 border-l-2 border-gold/60 pl-3 text-sm text-cream/90">
                      <span>{h}</span>
                      <CopyButton onClick={() => copy(h, `hook-${i}`)} active={copied === `hook-${i}`} />
                    </li>
                  ))}
                </ul>
              </Section>

              <Section label="Draft DM">
                <div className="border border-card-border bg-bg/60 p-4 text-sm leading-relaxed text-cream/90 whitespace-pre-line">
                  {angle.draft_dm}
                </div>
                <div className="mt-3 flex justify-end">
                  <Button variant="ghost" size="sm" onClick={() => copy(angle.draft_dm, "dm")}>
                    {copied === "dm" ? (<><Check className="mr-2 h-3.5 w-3.5 text-emerald" /> Copied</>) : (<><Copy className="mr-2 h-3.5 w-3.5" /> Copy DM</>)}
                  </Button>
                </div>
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted">{label}</div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function CopyButton({ onClick, active }: { onClick: () => void; active: boolean }) {
  return (
    <button onClick={onClick} className="shrink-0 text-muted transition-colors hover:text-gold" aria-label="Copy">
      {active ? <Check className="h-3.5 w-3.5 text-emerald" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function Loading() {
  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <Sparkles className="h-6 w-6 animate-pulse text-gold" />
      <div className="text-sm text-muted">Reading the lead and writing your angle…</div>
    </div>
  );
}

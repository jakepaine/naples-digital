"use client";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { Loader2, Sparkles, X } from "lucide-react";
import type { BacklogPriority } from "@naples/db";
import type { ClientTenant } from "@/app/page";

export type SuggestedItem = {
  title: string;
  description?: string;
  priority: BacklogPriority;
  tags: string[];
};

export function SuggestModal({
  tenant,
  onClose,
  onAccept,
}: {
  tenant: ClientTenant;
  onClose: () => void;
  onAccept: (picked: SuggestedItem[]) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestedItem[]>([]);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [source, setSource] = useState<"api" | "fallback" | "mock">("mock");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/backlog/suggest", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ tenant: tenant.slug }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error ?? "Suggest failed");
        }
        const json = await res.json();
        if (cancelled) return;
        setSuggestions(json.items ?? []);
        setSource(json.source ?? "mock");
        setPicked(new Set((json.items ?? []).map((_: unknown, i: number) => i)));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Suggest failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [tenant.slug]);

  function togglePick(idx: number) {
    setPicked((p) => {
      const n = new Set(p);
      if (n.has(idx)) n.delete(idx); else n.add(idx);
      return n;
    });
  }

  function accept() {
    onAccept(suggestions.filter((_, i) => picked.has(i)));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl border border-card-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-card-border p-5">
          <div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-gold">
              <Sparkles className="h-3 w-3" /> Suggest
              {!loading && (
                <span className={clsx(
                  "ml-2 rounded-full border px-2 py-0.5 text-[9px]",
                  source === "api" ? "border-emerald/40 bg-emerald/10 text-emerald" : "border-card-border bg-bg/40 text-muted"
                )}>
                  {source === "api" ? "Live · Claude" : source === "fallback" ? "Fallback" : "Preview"}
                </span>
              )}
            </div>
            <h2 className="mt-2 font-heading text-3xl tracking-broadcast text-cream">
              What's outstanding for {tenant.name}?
            </h2>
            <p className="mt-1 text-xs text-muted">
              Scanning <code>.build-state.md</code>, README, recent commits, and open issues for this monorepo.
            </p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-cream"><X className="h-5 w-5" /></button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-5">
          {loading && (
            <div className="flex items-center justify-center py-12 text-muted">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reading repo state and asking Claude…
            </div>
          )}
          {error && !loading && (
            <div className="border border-rose/40 bg-rose/10 p-4 text-sm text-rose">{error}</div>
          )}
          {!loading && !error && suggestions.length === 0 && (
            <div className="py-8 text-center text-sm text-muted">No suggestions — repo state looks clean for this tenant.</div>
          )}
          <div className="space-y-2">
            {suggestions.map((s, i) => {
              const isPicked = picked.has(i);
              return (
                <button
                  key={i}
                  onClick={() => togglePick(i)}
                  className={clsx(
                    "flex w-full items-start gap-3 border p-3 text-left transition-colors",
                    isPicked ? "border-gold bg-gold/5" : "border-card-border bg-bg/40 hover:border-card-border-strong"
                  )}
                >
                  <span className={clsx(
                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border",
                    isPicked ? "border-gold bg-gold text-bg" : "border-card-border-strong"
                  )}>
                    {isPicked && "✓"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-cream">{s.title}</div>
                    {s.description && <div className="mt-1 text-xs text-muted">{s.description}</div>}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="rounded-full border border-card-border bg-bg/40 px-2 py-0.5 text-[9px] uppercase tracking-wider text-cream/70">{s.priority}</span>
                      {s.tags.map((t) => (
                        <span key={t} className="rounded-full border border-card-border bg-bg/40 px-2 py-0.5 text-[9px] uppercase tracking-wider text-muted">{t}</span>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-card-border p-4">
          <div className="text-xs text-muted">{picked.size} of {suggestions.length} selected</div>
          <div className="flex gap-2">
            <button onClick={onClose} className="border border-card-border px-4 py-2 text-xs uppercase tracking-wider text-muted hover:text-cream">Cancel</button>
            <button
              onClick={accept}
              disabled={picked.size === 0}
              className="bg-gold px-5 py-2 text-xs font-medium uppercase tracking-wider text-bg disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add {picked.size > 0 ? picked.size : ""} to backlog
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

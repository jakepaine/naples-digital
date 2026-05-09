"use client";

import { useMemo, useState } from "react";
import type { CreatorRow, ReelRow } from "@/lib/persist";

type SortMode = "recent" | "relevance" | "engagement";

export function ResearchView({
  initialCreators,
  initialReels,
  tenant,
}: {
  initialCreators: CreatorRow[];
  initialReels: ReelRow[];
  tenant: { id: string; slug: string; name: string };
}) {
  const [creators, setCreators] = useState(initialCreators);
  const [reels, setReels] = useState(initialReels);
  const [activeCreator, setActiveCreator] = useState<string | null>(null);
  const [sort, setSort] = useState<SortMode>("recent");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ handle: "", niche: "", notes: "" });

  async function refreshReels() {
    const url = activeCreator ? `/api/reels?creator=${activeCreator}` : "/api/reels";
    const res = await fetch(url);
    const json = await res.json();
    if (json.reels) setReels(json.reels);
  }

  async function addCreator(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/creators", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          handle: form.handle,
          niche: form.niche || null,
          notes: form.notes || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "add failed");
      setCreators((prev) => [json.creator, ...prev]);
      setForm({ handle: "", niche: "", notes: "" });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function syncCreator(id: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/creators/${id}/sync`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "sync failed");
      await refreshReels();
      const list = await fetch("/api/creators").then((r) => r.json());
      if (list.creators) setCreators(list.creators);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function removeCreator(id: string) {
    setBusy(true);
    try {
      await fetch(`/api/creators/${id}`, { method: "DELETE" });
      setCreators((prev) => prev.filter((c) => c.id !== id));
      if (activeCreator === id) setActiveCreator(null);
    } finally {
      setBusy(false);
    }
  }

  const visibleReels = useMemo(() => {
    let list = activeCreator
      ? reels.filter((r) => r.creator_id === activeCreator)
      : reels;
    list = [...list];
    if (sort === "relevance") {
      list.sort(
        (a, b) => (b.niche_relevance ?? 0) - (a.niche_relevance ?? 0),
      );
    } else if (sort === "engagement") {
      list.sort(
        (a, b) =>
          (b.view_count ?? b.like_count ?? 0) -
          (a.view_count ?? a.like_count ?? 0),
      );
    } else {
      list.sort(
        (a, b) =>
          (b.posted_at ? new Date(b.posted_at).getTime() : 0) -
          (a.posted_at ? new Date(a.posted_at).getTime() : 0),
      );
    }
    return list;
  }, [reels, activeCreator, sort]);

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">IG Reels Research</h1>
            <p className="text-xs text-gray-500">
              <span className="font-mono">{tenant.slug}</span> · Reels-as-research,
              not Reels-as-output
            </p>
          </div>
          <div className="flex gap-2 text-xs">
            <SortBtn mode="recent" current={sort} onClick={() => setSort("recent")}>
              Recent
            </SortBtn>
            <SortBtn
              mode="relevance"
              current={sort}
              onClick={() => setSort("relevance")}
            >
              Niche relevance
            </SortBtn>
            <SortBtn
              mode="engagement"
              current={sort}
              onClick={() => setSort("engagement")}
            >
              Engagement
            </SortBtn>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 grid md:grid-cols-[280px_1fr] gap-6">
        <aside className="space-y-4">
          <section>
            <h2 className="text-sm font-semibold mb-2">Creators</h2>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => setActiveCreator(null)}
                  className={
                    activeCreator === null
                      ? "w-full text-left rounded px-3 py-2 text-sm bg-black text-white"
                      : "w-full text-left rounded px-3 py-2 text-sm hover:bg-gray-50"
                  }
                >
                  All ({reels.length})
                </button>
              </li>
              {creators.map((c) => (
                <li key={c.id}>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setActiveCreator(c.id)}
                      className={
                        activeCreator === c.id
                          ? "flex-1 text-left rounded px-3 py-2 text-sm bg-black text-white"
                          : "flex-1 text-left rounded px-3 py-2 text-sm hover:bg-gray-50"
                      }
                    >
                      <div className="font-mono">@{c.handle}</div>
                      <div className="text-[10px] opacity-60">
                        {c.niche ?? "—"}
                        {c.last_synced_at && (
                          <>
                            {" · synced "}
                            {new Date(c.last_synced_at).toLocaleDateString()}
                          </>
                        )}
                      </div>
                    </button>
                    <button
                      onClick={() => syncCreator(c.id)}
                      disabled={busy}
                      title="Sync this creator"
                      className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    >
                      ↻
                    </button>
                    <button
                      onClick={() => removeCreator(c.id)}
                      disabled={busy}
                      title="Remove"
                      className="text-xs px-2 py-1 rounded border border-gray-300 text-rose-700 hover:bg-rose-50"
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-sm font-semibold mb-2">Add creator</h2>
            <form onSubmit={addCreator} className="space-y-2">
              <input
                value={form.handle}
                onChange={(e) =>
                  setForm((s) => ({ ...s, handle: e.target.value }))
                }
                placeholder="@handle"
                className="block w-full rounded border border-gray-300 px-2 py-1.5 text-sm font-mono"
                required
              />
              <input
                value={form.niche}
                onChange={(e) =>
                  setForm((s) => ({ ...s, niche: e.target.value }))
                }
                placeholder="Niche (optional)"
                className="block w-full rounded border border-gray-300 px-2 py-1.5 text-xs"
              />
              <input
                value={form.notes}
                onChange={(e) =>
                  setForm((s) => ({ ...s, notes: e.target.value }))
                }
                placeholder="Notes (optional)"
                className="block w-full rounded border border-gray-300 px-2 py-1.5 text-xs"
              />
              <button
                type="submit"
                disabled={busy}
                className="w-full px-3 py-1.5 bg-black text-white rounded text-xs disabled:opacity-50"
              >
                {busy ? "Adding…" : "Track creator"}
              </button>
            </form>
            {error && (
              <div className="text-xs text-rose-700 mt-2">{error}</div>
            )}
          </section>
        </aside>

        <section>
          {visibleReels.length === 0 ? (
            <div className="rounded border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500">
              {creators.length === 0
                ? "Add creators on the left to start the research feed."
                : "No reels yet — click the ↻ button next to a creator to sync."}
            </div>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {visibleReels.map((r) => (
                <ReelCard key={r.id} reel={r} />
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function SortBtn({
  mode,
  current,
  onClick,
  children,
}: {
  mode: SortMode;
  current: SortMode;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        mode === current
          ? "px-3 py-1.5 rounded bg-black text-white"
          : "px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50"
      }
    >
      {children}
    </button>
  );
}

function ReelCard({ reel }: { reel: ReelRow }) {
  return (
    <li className="rounded border border-gray-200 p-3 space-y-2">
      <div className="flex gap-3">
        {reel.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={reel.thumbnail_url}
            alt=""
            className="w-20 h-32 object-cover rounded shrink-0"
          />
        ) : (
          <div className="w-20 h-32 rounded bg-gray-100 shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          {reel.hook_first_3s && (
            <div className="font-semibold text-sm leading-snug line-clamp-3">
              {reel.hook_first_3s}
            </div>
          )}
          {reel.caption && !reel.hook_first_3s && (
            <div className="text-sm leading-snug line-clamp-3">
              {reel.caption}
            </div>
          )}
          {reel.ai_summary && (
            <div className="text-[11px] text-gray-500 italic mt-1 line-clamp-2">
              {reel.ai_summary}
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
        {reel.hook_pattern && (
          <Badge tone="info">hook: {reel.hook_pattern}</Badge>
        )}
        {reel.retention_signal && (
          <Badge tone="info">retention: {reel.retention_signal}</Badge>
        )}
        {typeof reel.niche_relevance === "number" && (
          <Badge
            tone={
              reel.niche_relevance >= 70
                ? "ok"
                : reel.niche_relevance >= 40
                  ? "warn"
                  : "muted"
            }
          >
            relevance {reel.niche_relevance}
          </Badge>
        )}
        {reel.cta_present && reel.cta_text && (
          <Badge tone="muted">CTA: {reel.cta_text.slice(0, 32)}</Badge>
        )}
        {typeof reel.view_count === "number" && (
          <Badge tone="muted">{formatNum(reel.view_count)} views</Badge>
        )}
      </div>
      {reel.ig_url && (
        <a
          href={reel.ig_url}
          target="_blank"
          rel="noreferrer"
          className="block text-[11px] text-blue-700 underline truncate"
        >
          {reel.ig_url}
        </a>
      )}
    </li>
  );
}

function Badge({
  tone,
  children,
}: {
  tone: "ok" | "warn" | "muted" | "info";
  children: React.ReactNode;
}) {
  const cls =
    tone === "ok"
      ? "bg-emerald-100 text-emerald-800"
      : tone === "warn"
        ? "bg-amber-100 text-amber-800"
        : tone === "info"
          ? "bg-blue-100 text-blue-800"
          : "bg-gray-100 text-gray-700";
  return (
    <span className={`rounded px-1.5 py-0.5 font-mono ${cls}`}>{children}</span>
  );
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

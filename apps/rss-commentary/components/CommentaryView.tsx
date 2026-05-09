"use client";

import { useState } from "react";
import type { FeedRow, ItemRow, CommentaryStatus } from "@/lib/persist";

const STATUS_FILTER: { value: CommentaryStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "generated", label: "Drafted" },
  { value: "approved", label: "Approved" },
  { value: "published", label: "Published" },
  { value: "rejected", label: "Rejected" },
];

export function CommentaryView({
  initialFeeds,
  initialItems,
  tenant,
}: {
  initialFeeds: FeedRow[];
  initialItems: ItemRow[];
  tenant: { id: string; slug: string; name: string };
}) {
  const [feeds, setFeeds] = useState(initialFeeds);
  const [items, setItems] = useState(initialItems);
  const [filter, setFilter] = useState<CommentaryStatus | "all">("all");
  const [activeFeed, setActiveFeed] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ url: "", category: "" });

  async function refreshItems() {
    const params = new URLSearchParams();
    if (filter !== "all") params.set("status", filter);
    if (activeFeed) params.set("feed", activeFeed);
    const res = await fetch(`/api/items?${params.toString()}`);
    const json = await res.json();
    if (json.items) setItems(json.items);
  }

  async function addFeed(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/feeds", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          url: form.url,
          category: form.category || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "add failed");
      setFeeds((prev) => [json.feed, ...prev]);
      setForm({ url: "", category: "" });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function pollFeed(id: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/feeds/${id}/poll`, { method: "POST" });
      const json = await res.json();
      if (!res.ok && !json.fetched) throw new Error(json.error ?? "poll failed");
      const list = await fetch("/api/feeds").then((r) => r.json());
      if (list.feeds) setFeeds(list.feeds);
      await refreshItems();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function generateFor(id: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/items/${id}/generate`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "generate failed");
      setItems((prev) => prev.map((i) => (i.id === id ? json.item : i)));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id: string, status: CommentaryStatus) {
    setBusy(true);
    try {
      await fetch(`/api/items/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setItems((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, commentary_status: status } : i,
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  async function removeFeed(id: string) {
    if (!confirm("Remove this feed and all its items?")) return;
    setBusy(true);
    try {
      await fetch(`/api/feeds/${id}`, { method: "DELETE" });
      setFeeds((prev) => prev.filter((f) => f.id !== id));
      if (activeFeed === id) setActiveFeed(null);
      setItems((prev) => prev.filter((i) => i.feed_id !== id));
    } finally {
      setBusy(false);
    }
  }

  const visible = items.filter((i) => {
    if (filter !== "all" && i.commentary_status !== filter) return false;
    if (activeFeed && i.feed_id !== activeFeed) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">RSS Commentary</h1>
            <p className="text-xs text-gray-500">
              <span className="font-mono">{tenant.slug}</span> · subscribe to
              feeds → AI commentary in your voice → operator approves
            </p>
          </div>
          <div className="flex gap-2 text-xs">
            {STATUS_FILTER.map((s) => (
              <button
                key={s.value}
                onClick={() => {
                  setFilter(s.value);
                }}
                className={
                  filter === s.value
                    ? "px-3 py-1.5 rounded bg-black text-white"
                    : "px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50"
                }
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 grid md:grid-cols-[280px_1fr] gap-6">
        <aside className="space-y-4">
          <section>
            <h2 className="text-sm font-semibold mb-2">Feeds</h2>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => setActiveFeed(null)}
                  className={
                    activeFeed === null
                      ? "w-full text-left rounded px-3 py-2 text-sm bg-black text-white"
                      : "w-full text-left rounded px-3 py-2 text-sm hover:bg-gray-50"
                  }
                >
                  All feeds ({items.length})
                </button>
              </li>
              {feeds.map((f) => (
                <li key={f.id}>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setActiveFeed(f.id)}
                      className={
                        activeFeed === f.id
                          ? "flex-1 text-left rounded px-3 py-2 text-sm bg-black text-white"
                          : "flex-1 text-left rounded px-3 py-2 text-sm hover:bg-gray-50"
                      }
                    >
                      <div className="font-semibold truncate">
                        {f.title ?? new URL(f.url).hostname}
                      </div>
                      <div className="text-[10px] opacity-60 truncate">
                        {f.category ?? "—"}
                        {f.last_polled_at && (
                          <>
                            {" · polled "}
                            {new Date(f.last_polled_at).toLocaleString()}
                          </>
                        )}
                      </div>
                    </button>
                    <button
                      onClick={() => pollFeed(f.id)}
                      disabled={busy}
                      title="Poll feed"
                      className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    >
                      ↻
                    </button>
                    <button
                      onClick={() => removeFeed(f.id)}
                      disabled={busy}
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
            <h2 className="text-sm font-semibold mb-2">Add feed</h2>
            <form onSubmit={addFeed} className="space-y-2">
              <input
                value={form.url}
                onChange={(e) =>
                  setForm((s) => ({ ...s, url: e.target.value }))
                }
                placeholder="https://feed.url/rss"
                className="block w-full rounded border border-gray-300 px-2 py-1.5 text-xs font-mono"
                required
              />
              <input
                value={form.category}
                onChange={(e) =>
                  setForm((s) => ({ ...s, category: e.target.value }))
                }
                placeholder="Category / niche tag"
                className="block w-full rounded border border-gray-300 px-2 py-1.5 text-xs"
              />
              <button
                type="submit"
                disabled={busy}
                className="w-full px-3 py-1.5 bg-black text-white rounded text-xs disabled:opacity-50"
              >
                {busy ? "Adding…" : "Add feed"}
              </button>
            </form>
            {error && <div className="text-xs text-rose-700 mt-2">{error}</div>}
          </section>
        </aside>

        <section className="space-y-3">
          {visible.length === 0 ? (
            <div className="rounded border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500">
              {feeds.length === 0
                ? "Add a feed on the left to start the commentary loop."
                : "No items match the current filter."}
            </div>
          ) : (
            <ul className="space-y-3">
              {visible.map((it) => (
                <li
                  key={it.id}
                  className="rounded border border-gray-200 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="text-xs text-gray-500">
                      {it.published_at
                        ? new Date(it.published_at).toLocaleDateString()
                        : new Date(it.ingested_at).toLocaleDateString()}
                      {it.author && (
                        <>
                          {" · "}
                          <span>{it.author}</span>
                        </>
                      )}
                    </div>
                    <StatusBadge status={it.commentary_status} />
                  </div>
                  <h3 className="font-semibold text-sm leading-snug">
                    {it.title ?? "(no title)"}
                  </h3>
                  {it.excerpt && (
                    <p className="text-xs text-gray-600 leading-snug">
                      {it.excerpt}
                    </p>
                  )}
                  {it.commentary_body && (
                    <details className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2">
                      <summary className="text-xs font-semibold cursor-pointer">
                        AI commentary
                        {it.commentary_angle && (
                          <span className="ml-2 font-mono text-[11px]">
                            ({it.commentary_angle})
                          </span>
                        )}
                      </summary>
                      <div className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">
                        {it.commentary_title && (
                          <div className="font-semibold mb-1">
                            {it.commentary_title}
                          </div>
                        )}
                        {it.commentary_body}
                      </div>
                    </details>
                  )}
                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    {it.commentary_status === "pending" && (
                      <button
                        onClick={() => generateFor(it.id)}
                        disabled={busy}
                        className="px-2 py-1 rounded bg-black text-white disabled:opacity-50"
                      >
                        {busy ? "Generating…" : "Generate commentary"}
                      </button>
                    )}
                    {it.commentary_status === "generated" && (
                      <>
                        <button
                          onClick={() => setStatus(it.id, "approved")}
                          disabled={busy}
                          className="px-2 py-1 rounded bg-emerald-700 text-white disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setStatus(it.id, "rejected")}
                          disabled={busy}
                          className="px-2 py-1 rounded border border-rose-300 text-rose-700 disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => generateFor(it.id)}
                          disabled={busy}
                          className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Regenerate
                        </button>
                      </>
                    )}
                    {it.commentary_status === "approved" && (
                      <button
                        onClick={() => setStatus(it.id, "published")}
                        disabled={busy}
                        className="px-2 py-1 rounded bg-emerald-700 text-white disabled:opacity-50"
                      >
                        Mark published
                      </button>
                    )}
                    {it.commentary_status !== "archived" && (
                      <button
                        onClick={() => setStatus(it.id, "archived")}
                        disabled={busy}
                        className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 ml-auto"
                      >
                        Archive
                      </button>
                    )}
                    {it.link && (
                      <a
                        href={it.link}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 text-blue-700 underline truncate"
                      >
                        Source
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "approved" || status === "published"
      ? "bg-emerald-100 text-emerald-800"
      : status === "generated"
        ? "bg-blue-100 text-blue-800"
        : status === "rejected"
          ? "bg-rose-100 text-rose-800"
          : status === "archived"
            ? "bg-gray-100 text-gray-500"
            : "bg-amber-100 text-amber-800";
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-mono ${cls}`}>
      {status}
    </span>
  );
}

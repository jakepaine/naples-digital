"use client";

import { useState } from "react";
import type { BrandRow, AdRow } from "@/lib/persist";

interface AppProps {
  initialBrands: BrandRow[];
  initialAds: AdRow[];
  tenant: { id: string; slug: string; name: string };
  apifyConfigured: boolean;
}

const ANGLES = [
  "all",
  "pain_point",
  "aspiration",
  "social_proof",
  "scarcity",
  "discount",
  "education",
  "other",
] as const;

export function App({ initialBrands, initialAds, tenant, apifyConfigured }: AppProps) {
  const [brands, setBrands] = useState<BrandRow[]>(initialBrands);
  const [ads, setAds] = useState<AdRow[]>(initialAds);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [filter, setFilter] = useState<(typeof ANGLES)[number]>("all");
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [pageId, setPageId] = useState("");

  async function handleAddBrand(e: React.FormEvent) {
    e.preventDefault();
    setBusy("add");
    setError(null);
    try {
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, fb_page_id: pageId || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "add failed");
      setBrands((prev) => [json.brand, ...prev]);
      setName("");
      setPageId("");
      setAdding(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function handleSync(brandId: string) {
    setBusy(brandId);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch(`/api/brands/${brandId}/sync`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "sync failed");
      setInfo(
        `Pulled ${json.pulled} ads, persisted ${json.persisted}.${json.errors?.length ? ` ${json.errors.length} error(s).` : ""}`,
      );
      // Refresh the ads list
      const refresh = await fetch("/api/brands");
      if (refresh.ok) {
        // Brands list updates last_synced_at
        const refreshed = await refresh.json();
        setBrands(refreshed.brands);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete(brandId: string) {
    if (!confirm("Delete this brand and all its tracked ads?")) return;
    setBusy(brandId);
    try {
      const res = await fetch(`/api/brands/${brandId}`, { method: "DELETE" });
      if (res.ok) {
        setBrands((prev) => prev.filter((b) => b.id !== brandId));
        setAds((prev) => prev.filter((a) => a.brand_id !== brandId));
      }
    } finally {
      setBusy(null);
    }
  }

  const visibleAds =
    filter === "all"
      ? ads
      : ads.filter((a) => a.messaging_angle === filter);

  return (
    <div className="mx-auto max-w-6xl p-8 space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Competitor Spy</h1>
        <p className="text-sm text-gray-500 mt-2">
          Tenant: <span className="font-mono">{tenant.slug}</span> · Track
          competitor Meta ads. Apify pulls via the FB Ad Library scraper,
          Claude tags each ad's angle/hook/offer.
        </p>
        {!apifyConfigured && (
          <div className="mt-3 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <span className="font-semibold">Stub mode.</span> APIFY_TOKEN not
            set. Add to Doppler (or paste a per-tenant token in Vault) to
            pull real ads. Demo data shown until then.
          </div>
        )}
      </header>

      <section className="border border-gray-200 rounded-lg bg-white">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="font-semibold text-sm">Tracked brands</div>
          <button
            onClick={() => setAdding((v) => !v)}
            className="text-sm px-3 py-1 bg-black text-white rounded"
          >
            {adding ? "Cancel" : "+ Add brand"}
          </button>
        </div>
        {adding && (
          <form
            onSubmit={handleAddBrand}
            className="p-4 border-b border-gray-200 space-y-2"
          >
            <div className="grid grid-cols-2 gap-2">
              <input
                placeholder="Brand name (e.g. Notion)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="border border-gray-300 rounded px-3 py-2 text-sm"
              />
              <input
                placeholder="FB Page ID (optional, for exact match)"
                value={pageId}
                onChange={(e) => setPageId(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={busy === "add"}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded text-sm disabled:opacity-50"
            >
              {busy === "add" ? "Adding…" : "Save"}
            </button>
          </form>
        )}
        <ul className="divide-y divide-gray-100">
          {brands.length === 0 && (
            <li className="p-4 text-sm text-gray-500 text-center">
              No tracked brands yet.
            </li>
          )}
          {brands.map((b) => (
            <li
              key={b.id}
              className="p-4 flex items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">
                  {b.name}{" "}
                  {b.fb_page_id && (
                    <span className="text-xs text-gray-400 font-mono">
                      page_id={b.fb_page_id}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-400">
                  {b.last_synced_at
                    ? `Last synced ${new Date(b.last_synced_at).toLocaleString()}`
                    : "Never synced"}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  disabled={busy === b.id}
                  onClick={() => handleSync(b.id)}
                  className="px-3 py-1.5 bg-black text-white rounded text-xs disabled:opacity-50"
                >
                  {busy === b.id ? "Syncing…" : "Sync now"}
                </button>
                <button
                  disabled={busy === b.id}
                  onClick={() => handleDelete(b.id)}
                  className="px-3 py-1.5 border border-red-300 text-red-700 rounded text-xs disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {info && (
        <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {info}
        </div>
      )}
      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Ads ({visibleAds.length})</h2>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            {ANGLES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        {visibleAds.length === 0 ? (
          <div className="rounded border border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
            No ads yet. Add a brand and click "Sync now".
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleAds.map((ad) => (
              <article
                key={ad.id}
                className="border border-gray-200 rounded-lg overflow-hidden bg-white"
              >
                {ad.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ad.image_url}
                    alt=""
                    className="w-full aspect-square object-cover"
                  />
                )}
                <div className="p-3 space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {ad.messaging_angle && (
                      <Tag color="violet">{ad.messaging_angle}</Tag>
                    )}
                    {ad.hook_tactic && <Tag color="amber">{ad.hook_tactic}</Tag>}
                    {ad.offer_type && ad.offer_type !== "none" && (
                      <Tag color="emerald">{ad.offer_type}</Tag>
                    )}
                  </div>
                  {ad.ad_text && (
                    <p className="text-sm text-gray-800 line-clamp-4">
                      {ad.ad_text}
                    </p>
                  )}
                  {ad.ai_summary && (
                    <p className="text-xs text-gray-500 italic">
                      {ad.ai_summary}
                    </p>
                  )}
                  {ad.cta_text && (
                    <div className="text-xs">
                      CTA:{" "}
                      <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">
                        {ad.cta_text}
                      </span>
                    </div>
                  )}
                  <div className="text-xs text-gray-400">
                    {ad.first_seen_at &&
                      `Running since ${new Date(ad.first_seen_at).toLocaleDateString()}`}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Tag({
  color,
  children,
}: {
  color: "violet" | "amber" | "emerald";
  children: React.ReactNode;
}) {
  const cls =
    color === "violet"
      ? "bg-violet-100 text-violet-900"
      : color === "amber"
        ? "bg-amber-100 text-amber-900"
        : "bg-emerald-100 text-emerald-900";
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono ${cls}`}>
      {children}
    </span>
  );
}

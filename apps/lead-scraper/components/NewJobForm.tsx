"use client";

import { useState } from "react";
import type { ScrapeJobRow } from "@/lib/types";
import type { ScrapeSourceKey } from "@/lib/sources/types";

const PARAM_HINTS: Record<ScrapeSourceKey, string> = {
  apify: `{
  "actor_id": "compass/google-maps-scraper",
  "input": {
    "searchString": "med spa Naples FL",
    "maxCrawledPlaces": 100
  }
}`,
  apollo: `{
  "filters": {
    "person_titles": ["Owner", "Founder"],
    "person_locations": ["Florida, USA"],
    "organization_num_employees_ranges": ["1,10", "11,50"]
  },
  "max_per_run": 100
}`,
  phantombuster: `{
  "agent_id": "1234567890",
  "input": {
    "searches": ["site:linkedin.com med spa owner naples"],
    "numberOfPagesPerSearch": 3
  }
}`,
  vayne: `{
  "sales_nav_url": "https://www.linkedin.com/sales/search/people?...",
  "max": 200
}`,
};

export function NewJobForm({
  sourceStatus,
  onCreated,
}: {
  sourceStatus: Record<ScrapeSourceKey, boolean>;
  onCreated: (job: ScrapeJobRow) => void;
}) {
  const [name, setName] = useState("");
  const [source, setSource] = useState<ScrapeSourceKey>("apify");
  const [paramsRaw, setParamsRaw] = useState(PARAM_HINTS.apify);
  const [niche, setNiche] = useState("");
  const [titles, setTitles] = useState("");
  const [locations, setLocations] = useState("");
  const [cron, setCron] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pickSource(s: ScrapeSourceKey) {
    setSource(s);
    setParamsRaw(PARAM_HINTS[s]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Name your job");
      return;
    }
    let params: Record<string, unknown>;
    try {
      params = paramsRaw.trim() ? JSON.parse(paramsRaw) : {};
    } catch (err) {
      setError(`params is not valid JSON: ${(err as Error).message}`);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/scrape-jobs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          source,
          params,
          niche: niche || null,
          target_titles: csvList(titles),
          target_locations: csvList(locations),
          cron_schedule: cron || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "create failed");
      onCreated(json.job);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6 max-w-3xl">
      <label className="block text-sm">
        <span className="font-semibold">Job name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="naples med spas — google maps weekly"
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
          required
        />
      </label>

      <div className="block text-sm">
        <span className="font-semibold">Source</span>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(Object.keys(PARAM_HINTS) as ScrapeSourceKey[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => pickSource(k)}
              className={
                source === k
                  ? "px-3 py-2 rounded-md text-sm font-semibold bg-black text-white"
                  : "px-3 py-2 rounded-md text-sm font-semibold border border-gray-300 hover:bg-gray-50"
              }
            >
              {k}{" "}
              <span
                className={
                  sourceStatus[k]
                    ? "ml-2 text-xs text-emerald-300"
                    : "ml-2 text-xs text-amber-500"
                }
              >
                {sourceStatus[k] ? "live" : "stub"}
              </span>
            </button>
          ))}
        </div>
      </div>

      <label className="block text-sm">
        <span className="font-semibold">Source params (JSON)</span>
        <span className="block text-xs text-gray-500 mt-1">
          Shape depends on source. The hints above are starting points — adjust
          for your niche.
        </span>
        <textarea
          value={paramsRaw}
          onChange={(e) => setParamsRaw(e.target.value)}
          rows={9}
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 font-mono text-xs"
        />
      </label>

      <details className="rounded border border-gray-200 p-3">
        <summary className="cursor-pointer text-sm font-semibold">
          Filters + niche labels (optional)
        </summary>
        <div className="mt-4 space-y-4">
          <label className="block text-sm">
            <span className="font-semibold">Niche label</span>
            <input
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="med spas"
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold">
              Target titles (comma-separated)
            </span>
            <span className="block text-xs text-gray-500 mt-1">
              Drops leads whose title doesn&apos;t contain any of these (case-
              insensitive substring match).
            </span>
            <input
              value={titles}
              onChange={(e) => setTitles(e.target.value)}
              placeholder="Owner, Founder, CEO"
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm font-mono"
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold">
              Target locations (comma-separated)
            </span>
            <input
              value={locations}
              onChange={(e) => setLocations(e.target.value)}
              placeholder="Naples, Bonita Springs"
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm font-mono"
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold">Cron schedule (optional)</span>
            <span className="block text-xs text-gray-500 mt-1">
              Standard cron string. Leave blank for manual-only runs. The
              platform cron picks this up on the next tick.
            </span>
            <input
              value={cron}
              onChange={(e) => setCron(e.target.value)}
              placeholder="0 7 * * 1"
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm font-mono"
            />
          </label>
        </div>
      </details>

      {error && <div className="text-sm text-rose-700">{error}</div>}

      <button
        type="submit"
        disabled={busy}
        className="px-4 py-2 bg-black text-white rounded text-sm disabled:opacity-50"
      >
        {busy ? "Creating…" : "Create job"}
      </button>
    </form>
  );
}

function csvList(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

"use client";

import { useEffect, useState } from "react";
import type { ScrapeJobRow, ScrapeRunRow } from "@/lib/types";

interface DetailPayload {
  job: ScrapeJobRow;
  runs: ScrapeRunRow[];
}

export function JobDetail({
  jobId,
  onClose,
  onJobUpdated,
}: {
  jobId: string;
  onClose: () => void;
  onJobUpdated: (updated: ScrapeJobRow) => void;
}) {
  const [data, setData] = useState<DetailPayload | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRunResult, setLastRunResult] = useState<any | null>(null);

  async function refresh() {
    const res = await fetch(`/api/scrape-jobs/${jobId}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "fetch failed");
    setData(json);
    onJobUpdated(json.job);
  }

  useEffect(() => {
    let cancelled = false;
    void refresh().catch((e) => {
      if (!cancelled) setError((e as Error).message);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  async function runNow() {
    setBusy(true);
    setError(null);
    setLastRunResult(null);
    try {
      const res = await fetch(`/api/scrape-jobs/${jobId}/run`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "run failed");
      setLastRunResult(json);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (error)
    return (
      <div className="space-y-3">
        <button onClick={onClose} className="text-sm text-gray-500 underline">
          ← Back to jobs
        </button>
        <div className="rounded border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          {error}
        </div>
      </div>
    );
  if (!data) return <div className="text-sm text-gray-500">Loading…</div>;

  const { job, runs } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onClose} className="text-sm text-gray-500 underline">
          ← Back to jobs
        </button>
        <button
          onClick={runNow}
          disabled={busy}
          className="px-3 py-1.5 bg-black text-white rounded text-sm disabled:opacity-50"
        >
          {busy ? "Running…" : "Run now"}
        </button>
      </div>

      <header>
        <h2 className="text-2xl font-bold">{job.name}</h2>
        <p className="text-sm text-gray-500 mt-1">
          source <span className="font-mono">{job.source}</span> · niche{" "}
          {job.niche ?? "—"} · {job.total_runs} run
          {job.total_runs === 1 ? "" : "s"} · {job.total_leads_added} lead
          {job.total_leads_added === 1 ? "" : "s"} added · cron{" "}
          <span className="font-mono">{job.cron_schedule ?? "manual"}</span>
        </p>
        {(job.target_titles?.length ?? 0) > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            titles: {(job.target_titles ?? []).join(", ")}
          </p>
        )}
        {(job.target_locations?.length ?? 0) > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            locations: {(job.target_locations ?? []).join(", ")}
          </p>
        )}
      </header>

      {lastRunResult && (
        <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm">
          Run finished: <strong>{lastRunResult.fetched}</strong> fetched ·{" "}
          <strong>{lastRunResult.inserted}</strong> inserted ·{" "}
          <strong>{lastRunResult.duplicate}</strong> duplicate ·{" "}
          <strong>{lastRunResult.filtered}</strong> filtered.
          {lastRunResult.stub && (
            <span className="ml-2 text-amber-700">
              Stub data — connect provider key on Integrations tab to use real
              source.
            </span>
          )}
          {lastRunResult.warning && (
            <span className="ml-2 text-amber-700">
              Warning: {lastRunResult.warning}
            </span>
          )}
        </div>
      )}

      <section>
        <h3 className="text-sm font-semibold mb-2">Recent runs</h3>
        <div className="overflow-x-auto rounded border border-gray-200">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-3 py-2">Started</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Fetched</th>
                <th className="px-3 py-2">Inserted</th>
                <th className="px-3 py-2">Dup</th>
                <th className="px-3 py-2">Filtered</th>
                <th className="px-3 py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className="px-3 py-2 text-xs">
                    {r.started_at
                      ? new Date(r.started_at).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <RunStatus status={r.status} />
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {r.fetched_count}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-emerald-700">
                    {r.inserted_count}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {r.duplicate_count}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {r.filtered_count}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500 max-w-xs">
                    {r.error_message ?? r.raw_results_url ?? ""}
                  </td>
                </tr>
              ))}
              {runs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-sm text-gray-500">
                    No runs yet — click <strong>Run now</strong> to start.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function RunStatus({ status }: { status: string }) {
  const cls =
    status === "complete"
      ? "bg-emerald-100 text-emerald-800"
      : status === "running"
        ? "bg-blue-100 text-blue-800"
        : status === "partial"
          ? "bg-amber-100 text-amber-800"
          : status === "failed"
            ? "bg-rose-100 text-rose-800"
            : "bg-gray-100 text-gray-700";
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-mono ${cls}`}>
      {status}
    </span>
  );
}

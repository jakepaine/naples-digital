"use client";

import { useEffect, useState } from "react";
import type { EnrichmentJobRow, EnrichmentInputRow } from "@/lib/types";

interface JobDetailPayload {
  job: EnrichmentJobRow;
  inputs: EnrichmentInputRow[];
}

export function JobDetail({
  jobId,
  onClose,
  onJobUpdated,
}: {
  jobId: string;
  onClose: () => void;
  onJobUpdated: (updated: EnrichmentJobRow) => void;
}) {
  const [data, setData] = useState<JobDetailPayload | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [push, setPush] = useState<{ pushed: number; skipped: number; reason?: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "fetch failed");
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  async function runJob() {
    if (!data) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/run`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "run failed");
      const refreshed = await fetch(`/api/jobs/${jobId}`).then((r) => r.json());
      setData(refreshed);
      onJobUpdated(refreshed.job);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function pushToOutreach() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/push`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "push failed");
      setPush(json);
      const refreshed = await fetch(`/api/jobs/${jobId}`).then((r) => r.json());
      setData(refreshed);
      onJobUpdated(refreshed.job);
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

  if (!data)
    return <div className="text-sm text-gray-500">Loading…</div>;

  const { job, inputs } = data;
  const enriched = inputs.filter(
    (i) => i.status === "enriched" || i.status === "low_confidence",
  );
  const stubFlag = inputs.some((i) => i.status === "enriched");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onClose} className="text-sm text-gray-500 underline">
          ← Back to jobs
        </button>
        <div className="flex gap-2">
          {(job.status === "draft" || job.status === "failed") && (
            <button
              onClick={runJob}
              disabled={busy}
              className="px-3 py-1.5 bg-black text-white rounded text-sm disabled:opacity-50"
            >
              {busy ? "Running…" : "Run enrichment"}
            </button>
          )}
          {(job.status === "complete" ||
            job.status === "partial") &&
            !job.pushed_to_outreach &&
            enriched.length > 0 && (
              <button
                onClick={pushToOutreach}
                disabled={busy}
                className="px-3 py-1.5 bg-emerald-700 text-white rounded text-sm disabled:opacity-50"
              >
                {busy
                  ? "Pushing…"
                  : `Push ${enriched.length} → outreach_leads`}
              </button>
            )}
        </div>
      </div>

      <header>
        <h2 className="text-2xl font-bold">{job.name}</h2>
        <p className="text-sm text-gray-500 mt-1">
          Status <span className="font-mono">{job.status}</span> · {job.total_inputs} input
          {job.total_inputs === 1 ? "" : "s"} · {job.enriched_count} enriched ·{" "}
          {job.failed_count} failed · threshold {job.confidence_threshold} ·
          priority{" "}
          <span className="font-mono">{job.source_priority.join(" → ")}</span>
          {job.title_filter && (
            <>
              {" · "}
              filter <span className="font-mono">{job.title_filter}</span>
            </>
          )}
        </p>
        {job.pushed_to_outreach && (
          <p className="text-xs text-emerald-700 mt-1">
            Pushed to outreach_leads {new Date(job.pushed_at ?? "").toLocaleString()}
          </p>
        )}
      </header>

      {push && (
        <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm">
          Pushed <strong>{push.pushed}</strong>, skipped{" "}
          <strong>{push.skipped}</strong>
          {push.reason && <> — {push.reason}</>}
        </div>
      )}

      {!stubFlag && job.status === "draft" && (
        <div className="rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
          Job created. Click <strong>Run enrichment</strong> to start the chain.
        </div>
      )}

      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-3 py-2">Input</th>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Confidence</th>
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2">Icebreaker</th>
              <th className="px-3 py-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {inputs.map((row) => (
              <tr key={row.id} className="border-t border-gray-100">
                <td className="px-3 py-2 align-top text-xs">
                  <div className="font-semibold">
                    {[row.first_name, row.last_name].filter(Boolean).join(" ") ||
                      "—"}
                  </div>
                  <div className="text-gray-500">{row.company_name ?? row.domain ?? row.linkedin_url}</div>
                </td>
                <td className="px-3 py-2 align-top text-xs text-gray-600">
                  {row.title ?? "—"}
                </td>
                <td className="px-3 py-2 align-top">
                  <InputStatusBadge status={row.status} />
                </td>
                <td className="px-3 py-2 align-top font-mono text-xs">
                  {row.resolved_email ?? "—"}
                </td>
                <td className="px-3 py-2 align-top font-mono text-xs">
                  {row.resolved_confidence ?? "—"}
                </td>
                <td className="px-3 py-2 align-top text-xs">
                  {row.resolved_source ?? "—"}
                </td>
                <td className="px-3 py-2 align-top text-xs max-w-xs">
                  {row.icebreaker ?? "—"}
                </td>
                <td className="px-3 py-2 align-top text-xs text-gray-500 max-w-xs">
                  {row.notes ?? ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InputStatusBadge({ status }: { status: string }) {
  const cls =
    status === "enriched"
      ? "bg-emerald-100 text-emerald-800"
      : status === "low_confidence"
        ? "bg-amber-100 text-amber-800"
        : status === "no_match"
          ? "bg-gray-100 text-gray-700"
          : status === "failed"
            ? "bg-rose-100 text-rose-800"
            : status === "filtered_out"
              ? "bg-purple-100 text-purple-800"
              : "bg-blue-50 text-blue-700";
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-mono ${cls}`}>
      {status}
    </span>
  );
}

"use client";

import type { EnrichmentJobRow } from "@/lib/types";

export function JobsList({
  jobs,
  onOpen,
}: {
  jobs: EnrichmentJobRow[];
  onOpen: (id: string) => void;
}) {
  if (jobs.length === 0) {
    return (
      <div className="rounded border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500">
        No enrichment jobs yet. Switch to <strong>New job</strong> to start one.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded border border-gray-200">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Inputs</th>
            <th className="px-4 py-2">Enriched</th>
            <th className="px-4 py-2">Failed</th>
            <th className="px-4 py-2">Pushed</th>
            <th className="px-4 py-2">Created</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr
              key={job.id}
              className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
              onClick={() => onOpen(job.id)}
            >
              <td className="px-4 py-2 font-semibold">{job.name}</td>
              <td className="px-4 py-2">
                <StatusBadge status={job.status} />
              </td>
              <td className="px-4 py-2 font-mono">{job.total_inputs}</td>
              <td className="px-4 py-2 font-mono text-emerald-700">
                {job.enriched_count}
              </td>
              <td className="px-4 py-2 font-mono text-rose-700">
                {job.failed_count}
              </td>
              <td className="px-4 py-2 text-xs">
                {job.pushed_to_outreach
                  ? `✓ ${new Date(job.pushed_at ?? "").toLocaleDateString()}`
                  : "—"}
              </td>
              <td className="px-4 py-2 text-xs text-gray-500">
                {new Date(job.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
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

"use client";

import type { ScrapeJobRow } from "@/lib/types";

export function JobsList({
  jobs,
  onOpen,
}: {
  jobs: ScrapeJobRow[];
  onOpen: (id: string) => void;
}) {
  if (jobs.length === 0) {
    return (
      <div className="rounded border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500">
        No scrape jobs yet. Switch to <strong>New job</strong> to start one.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded border border-gray-200">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Source</th>
            <th className="px-4 py-2">Niche</th>
            <th className="px-4 py-2">Runs</th>
            <th className="px-4 py-2">Leads added</th>
            <th className="px-4 py-2">Schedule</th>
            <th className="px-4 py-2">Last run</th>
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
              <td className="px-4 py-2 font-mono text-xs">{job.source}</td>
              <td className="px-4 py-2 text-xs">{job.niche ?? "—"}</td>
              <td className="px-4 py-2 font-mono">{job.total_runs}</td>
              <td className="px-4 py-2 font-mono text-emerald-700">
                {job.total_leads_added}
              </td>
              <td className="px-4 py-2 text-xs font-mono">
                {job.cron_schedule ?? "manual"}
              </td>
              <td className="px-4 py-2 text-xs">
                {job.last_run_at
                  ? `${new Date(job.last_run_at).toLocaleDateString()} · ${
                      job.last_run_status ?? ""
                    }`
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

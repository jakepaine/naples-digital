"use client";

import { useState } from "react";
import type { EnrichmentJobRow } from "@/lib/types";
import type { EnrichmentSourceKey } from "@/lib/sources/types";
import { JobsList } from "./JobsList";
import { NewJobForm } from "./NewJobForm";
import { IntegrationsPanel } from "./IntegrationsPanel";
import { JobDetail } from "./JobDetail";

type Tab = "jobs" | "new" | "integrations";

export function App({
  initialJobs,
  initialSourceStatus,
  tenant,
}: {
  initialJobs: EnrichmentJobRow[];
  initialSourceStatus: Record<EnrichmentSourceKey, boolean>;
  tenant: { id: string; slug: string; name: string };
}) {
  const [tab, setTab] = useState<Tab>(initialJobs.length > 0 ? "jobs" : "new");
  const [jobs, setJobs] = useState(initialJobs);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [sourceStatus, setSourceStatus] = useState(initialSourceStatus);

  const anySourceConfigured = Object.values(sourceStatus).some((v) => v);

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Lead Enrichment</h1>
            <p className="text-sm text-gray-500">
              Multi-source: Apollo · AnyMailFinder · Hunter · Apify-LinkedIn
              {" · "}
              <span className="font-mono">{tenant.slug}</span>
              {!anySourceConfigured && (
                <span className="ml-2 text-amber-700">
                  (stub mode — no provider keys configured)
                </span>
              )}
            </p>
          </div>
          <nav className="flex gap-2">
            <TabBtn active={tab === "jobs"} onClick={() => setTab("jobs")}>
              Jobs ({jobs.length})
            </TabBtn>
            <TabBtn active={tab === "new"} onClick={() => setTab("new")}>
              New job
            </TabBtn>
            <TabBtn active={tab === "integrations"} onClick={() => setTab("integrations")}>
              Integrations
            </TabBtn>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {tab === "jobs" && (
          <>
            {selectedJobId ? (
              <JobDetail
                jobId={selectedJobId}
                onClose={() => setSelectedJobId(null)}
                onJobUpdated={(updated) => {
                  setJobs((prev) =>
                    prev.map((j) => (j.id === updated.id ? updated : j)),
                  );
                }}
              />
            ) : (
              <JobsList
                jobs={jobs}
                onOpen={(id) => setSelectedJobId(id)}
              />
            )}
          </>
        )}
        {tab === "new" && (
          <NewJobForm
            sourceStatus={sourceStatus}
            onCreated={(job) => {
              setJobs((prev) => [job, ...prev]);
              setSelectedJobId(job.id);
              setTab("jobs");
            }}
          />
        )}
        {tab === "integrations" && (
          <IntegrationsPanel
            initialStatus={sourceStatus}
            onChange={(next) => setSourceStatus(next)}
          />
        )}
      </main>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "px-3 py-1.5 rounded-md text-sm font-semibold bg-black text-white"
          : "px-3 py-1.5 rounded-md text-sm font-semibold border border-gray-300 hover:bg-gray-50"
      }
    >
      {children}
    </button>
  );
}

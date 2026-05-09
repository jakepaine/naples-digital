"use client";

import { useMemo, useState } from "react";
import type { EnrichmentJobRow, NewJobInput } from "@/lib/types";
import type { EnrichmentSourceKey } from "@/lib/sources/types";
import { ALL_SOURCE_KEYS } from "@/lib/sources";

const SOURCE_LABELS: Record<EnrichmentSourceKey, string> = {
  apollo: "Apollo",
  anymailfinder: "AnyMailFinder",
  hunter: "Hunter",
  apify_linkedin: "Apify (LinkedIn)",
};

export function NewJobForm({
  sourceStatus,
  onCreated,
}: {
  sourceStatus: Record<EnrichmentSourceKey, boolean>;
  onCreated: (job: EnrichmentJobRow) => void;
}) {
  const [name, setName] = useState("");
  const [csv, setCsv] = useState("");
  const [titleFilter, setTitleFilter] = useState("");
  const [threshold, setThreshold] = useState(70);
  const [priority, setPriority] = useState<EnrichmentSourceKey[]>([
    ...ALL_SOURCE_KEYS,
  ]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = useMemo(() => parseCsv(csv), [csv]);
  const stubFlag = !Object.values(sourceStatus).some((v) => v);

  function moveUp(idx: number) {
    if (idx <= 0) return;
    setPriority((prev) => {
      const next = [...prev];
      const [pulled] = next.splice(idx, 1);
      if (!pulled) return prev;
      next.splice(idx - 1, 0, pulled);
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Name your job (e.g. 'naples med spas, may run 1')");
      return;
    }
    if (parsed.rows.length === 0) {
      setError("Paste at least one row of input data");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          inputs: parsed.rows,
          source_priority: priority,
          confidence_threshold: threshold,
          title_filter: titleFilter || null,
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
      {stubFlag && (
        <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          No enrichment provider keys configured yet. The job will still run
          using deterministic stub data — useful for previewing the chain
          shape, but the resulting emails won&apos;t deliver. Connect at least
          one source on the <strong>Integrations</strong> tab before pushing
          to outreach.
        </div>
      )}

      <label className="block text-sm">
        <span className="font-semibold">Job name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="naples med spas, may run 1"
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
          required
        />
      </label>

      <label className="block text-sm">
        <span className="font-semibold">Inputs (CSV or one-row-per-line)</span>
        <span className="block text-xs text-gray-500 mt-1">
          Headers expected: <code>domain</code>, <code>linkedin_url</code>,{" "}
          <code>email</code>, <code>first_name</code>, <code>last_name</code>,{" "}
          <code>company_name</code>, <code>title</code>. Header row optional —
          if absent, columns are read positionally in that order. Up to 1,000
          rows per job.
        </span>
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          placeholder={`first_name,last_name,company_name,domain,title\nSarah,Lopez,Glow Med Spa,glowmedspa.com,Owner\nDavid,Park,Park Aesthetics,parkaesthetics.com,Founder`}
          rows={8}
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 font-mono text-xs"
        />
        {parsed.rows.length > 0 && (
          <span className="mt-2 block text-xs text-emerald-700">
            Parsed {parsed.rows.length} row{parsed.rows.length === 1 ? "" : "s"}
            {parsed.warnings.length > 0 && (
              <>
                {" — "}
                <span className="text-amber-700">
                  {parsed.warnings.length} warning(s):{" "}
                  {parsed.warnings.slice(0, 2).join("; ")}
                </span>
              </>
            )}
          </span>
        )}
      </label>

      <details className="rounded border border-gray-200 p-3">
        <summary className="cursor-pointer text-sm font-semibold">
          Advanced — source priority + threshold + title filter
        </summary>
        <div className="mt-4 space-y-4">
          <div>
            <div className="text-sm font-semibold">Source priority</div>
            <div className="text-xs text-gray-500 mb-2">
              Sources are tried in order. First result with confidence &ge; threshold
              wins. Click a row to bump it up.
            </div>
            <ol className="space-y-1">
              {priority.map((key, idx) => (
                <li
                  key={key}
                  onClick={() => moveUp(idx)}
                  className="cursor-pointer rounded border border-gray-200 px-3 py-2 text-sm flex items-center justify-between hover:bg-gray-50"
                >
                  <span>
                    <span className="font-mono text-gray-500 mr-2">{idx + 1}.</span>
                    {SOURCE_LABELS[key]}
                    {sourceStatus[key] ? (
                      <span className="ml-2 text-xs text-emerald-700">live</span>
                    ) : (
                      <span className="ml-2 text-xs text-amber-700">stub</span>
                    )}
                  </span>
                  {idx > 0 && (
                    <span className="text-xs text-gray-400">↑ click to bump</span>
                  )}
                </li>
              ))}
            </ol>
          </div>
          <label className="block text-sm">
            <span className="font-semibold">Confidence threshold</span>
            <span className="block text-xs text-gray-500 mt-1">
              Result must score ≥ this to be marked &quot;enriched.&quot;
              Below threshold → marked &quot;low_confidence&quot; (still
              surfaces but flagged).
            </span>
            <input
              type="number"
              min={0}
              max={100}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="mt-1 block w-32 rounded border border-gray-300 px-3 py-2 text-sm font-mono"
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold">Title filter (regex)</span>
            <span className="block text-xs text-gray-500 mt-1">
              Optional. Inputs whose title doesn&apos;t match are marked{" "}
              <code>filtered_out</code> and skipped. Example:{" "}
              <code>(CEO|Founder|Owner|Sales|VP)</code>
            </span>
            <input
              value={titleFilter}
              onChange={(e) => setTitleFilter(e.target.value)}
              placeholder="(CEO|Founder|Owner)"
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

function parseCsv(raw: string): { rows: NewJobInput[]; warnings: string[] } {
  const warnings: string[] = [];
  if (!raw.trim()) return { rows: [], warnings };
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return { rows: [], warnings };

  const KNOWN = [
    "domain",
    "linkedin_url",
    "email",
    "first_name",
    "last_name",
    "company_name",
    "title",
  ] as const;
  const firstCols = splitRow(lines[0] ?? "");
  const lowerCols = firstCols.map((c) => c.toLowerCase());
  const looksLikeHeader = lowerCols.some((c) => (KNOWN as readonly string[]).includes(c));

  let header: string[];
  let dataLines: string[];
  if (looksLikeHeader) {
    header = lowerCols;
    dataLines = lines.slice(1);
  } else {
    header = [...KNOWN];
    dataLines = lines;
    warnings.push("no header row detected — using positional column order");
  }

  const rows: NewJobInput[] = [];
  for (const line of dataLines) {
    const cols = splitRow(line);
    const row: NewJobInput = {};
    for (let i = 0; i < header.length; i++) {
      const key = header[i];
      const val = cols[i]?.trim();
      if (!key || !val) continue;
      if ((KNOWN as readonly string[]).includes(key)) {
        (row as any)[key] = val;
      }
    }
    if (
      row.domain ||
      row.linkedin_url ||
      row.email ||
      (row.first_name && row.last_name)
    ) {
      rows.push(row);
    } else {
      warnings.push(`row skipped (no usable identifier): ${line.slice(0, 60)}`);
    }
  }
  return { rows, warnings };
}

function splitRow(line: string): string[] {
  // Tab takes precedence (sheets paste); then comma.
  if (line.includes("\t")) return line.split("\t");
  return line.split(",");
}

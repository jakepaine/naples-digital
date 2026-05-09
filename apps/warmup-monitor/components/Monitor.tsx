"use client";

import { useEffect, useState } from "react";
import type { AccountWarmupSummary, MailboxWarmup } from "@naples/outreach";

const POLL_MS = 30_000;

export function Monitor({
  initialSummary,
  tenant,
}: {
  initialSummary: AccountWarmupSummary;
  tenant: { id: string; slug: string; name: string };
}) {
  const [summary, setSummary] = useState(initialSummary);
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/warmup");
      const json = await res.json();
      if (json.summary) setSummary(json.summary as AccountWarmupSummary);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    const t = setInterval(refresh, POLL_MS);
    return () => clearInterval(t);
  }, []);

  const sorted = [...summary.mailboxes].sort(
    (a, b) => a.warmup_score - b.warmup_score,
  );

  const sendReady = summary.average_score >= 80;
  const noMailboxes = summary.total_mailboxes === 0;

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Warmup Monitor</h1>
            <p className="text-xs text-gray-500">
              <span className="font-mono">{tenant.slug}</span>
              {" · "}
              vendor: <span className="font-mono">{summary.vendor}</span>
              {summary.is_stub && (
                <span className="ml-2 text-amber-700">(stub mode)</span>
              )}
            </p>
          </div>
          <button
            onClick={refresh}
            disabled={refreshing}
            className="text-xs px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi
            label="Mailboxes"
            value={summary.total_mailboxes}
            sub={
              summary.total_mailboxes < 9
                ? "Saraev recommends 9 baseline"
                : "≥ 9 baseline ✓"
            }
            tone={summary.total_mailboxes >= 9 ? "ok" : "warn"}
          />
          <Kpi
            label="Avg warmup"
            value={`${summary.average_score}%`}
            sub={
              summary.average_score >= 80
                ? "Sending unlocked"
                : summary.average_score >= 50
                  ? "Mid-warmup"
                  : "Hold sending"
            }
            tone={
              summary.average_score >= 80
                ? "ok"
                : summary.average_score >= 50
                  ? "warn"
                  : "alert"
            }
          />
          <Kpi
            label="Warming"
            value={summary.warming_mailboxes}
            sub="Active warmup process"
            tone="info"
          />
          <Kpi
            label="Fully warmed"
            value={summary.fully_warmed_mailboxes}
            sub="At 100%"
            tone="ok"
          />
        </section>

        {noMailboxes ? (
          <div className="rounded border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500">
            No vendor connected yet. Add Instantly or Smartlead via the
            <strong className="mx-1">outreach</strong>module integration page,
            then your mailboxes will surface here automatically.
          </div>
        ) : (
          <section className="rounded border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Mailboxes (lowest warmup first)
            </div>
            <ul className="divide-y divide-gray-100">
              {sorted.map((mb) => (
                <MailboxRow key={mb.email} mb={mb} />
              ))}
            </ul>
          </section>
        )}

        {!sendReady && summary.total_mailboxes > 0 && (
          <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <strong>Don&apos;t flip the switch yet.</strong> 21-day warmup is
            non-negotiable per Saraev #1. Sending live cold traffic from a
            mailbox under ~80% warmup destroys deliverability — sometimes
            permanently.
          </div>
        )}
      </main>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: number | string;
  sub: string;
  tone: "ok" | "warn" | "alert" | "info";
}) {
  const cls =
    tone === "ok"
      ? "text-emerald-700"
      : tone === "warn"
        ? "text-amber-700"
        : tone === "alert"
          ? "text-rose-700"
          : "text-blue-700";
  return (
    <div className="rounded border border-gray-200 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className={`text-2xl font-bold tabular-nums ${cls}`}>{value}</div>
      <div className="text-[11px] text-gray-500 mt-1">{sub}</div>
    </div>
  );
}

function MailboxRow({ mb }: { mb: MailboxWarmup }) {
  const tone =
    mb.warmup_score >= 80
      ? "bg-emerald-500"
      : mb.warmup_score >= 50
        ? "bg-amber-500"
        : "bg-rose-500";
  return (
    <li className="px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="font-mono text-sm truncate">{mb.email}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">
            {mb.sent_count} sent · {mb.bounce_count} bounced
            {mb.connected_at && (
              <>
                {" · "}
                connected{" "}
                {new Date(mb.connected_at).toLocaleDateString()}
              </>
            )}
            {mb.warming && <span className="ml-1 text-blue-700">· warming</span>}
          </div>
          {mb.health_notes.length > 0 && (
            <div className="text-[11px] text-amber-700 mt-1">
              {mb.health_notes.join(" · ")}
            </div>
          )}
        </div>
        <div className="w-40 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 rounded bg-gray-100 overflow-hidden">
              <div
                className={`h-full ${tone}`}
                style={{ width: `${Math.min(100, mb.warmup_score)}%` }}
              />
            </div>
            <span className="text-xs tabular-nums w-10 text-right">
              {mb.warmup_score}%
            </span>
          </div>
        </div>
      </div>
    </li>
  );
}

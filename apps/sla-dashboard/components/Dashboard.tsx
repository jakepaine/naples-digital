"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import type { SlaItem } from "@/lib/persist";

const POLL_MS = 15_000;

export function Dashboard({
  initialItems,
  tenant,
}: {
  initialItems: SlaItem[];
  tenant: { id: string; slug: string; name: string };
}) {
  const [items, setItems] = useState(initialItems);
  // Tick state forces re-render every second so countdowns animate
  // even between server polls.
  const [, setTick] = useState(0);
  const [escalating, setEscalating] = useState(false);
  const [lastEscalate, setLastEscalate] = useState<{ alerted: number } | null>(
    null,
  );
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/queue");
      const json = await res.json();
      if (json.items) setItems(json.items as SlaItem[]);
    } catch {
      /* swallow — let next tick retry */
    }
  }, []);

  useEffect(() => {
    pollRef.current = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    const dataPoll = setInterval(refresh, POLL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      clearInterval(dataPoll);
    };
  }, [refresh]);

  async function markResponded(id: string) {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, status: "responded", sla_responded_at: new Date().toISOString() }
          : i,
      ),
    );
    await fetch(`/api/queue/${id}/respond`, { method: "POST" });
    void refresh();
  }

  async function escalate() {
    setEscalating(true);
    try {
      const res = await fetch("/api/escalate", { method: "POST" });
      const json = await res.json();
      setLastEscalate({ alerted: json.alerted ?? 0 });
      await refresh();
    } finally {
      setEscalating(false);
    }
  }

  // Decorate live (countdowns shift every tick).
  const now = Date.now();
  const decorated = items.map((i) => {
    const receivedMs = new Date(i.received_at).getTime();
    const targetMs = i.sla_target_seconds * 1000;
    const breachMs = receivedMs + targetMs;
    const elapsedSec = Math.max(0, Math.floor((now - receivedMs) / 1000));
    const remainingSec = Math.floor((breachMs - now) / 1000);
    let status: SlaItem["status"] = "pending";
    if (i.sla_responded_at) status = "responded";
    else if (now > breachMs) status = "breached";
    return { ...i, status, seconds_elapsed: elapsedSec, seconds_remaining: remainingSec };
  });

  const pending = decorated.filter((i) => i.status === "pending");
  const breached = decorated.filter((i) => i.status === "breached");
  const responded = decorated.filter((i) => i.status === "responded");

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight">Speed-to-Lead</h1>
              <p className="text-xs text-gray-500">
                <span className="font-mono">{tenant.slug}</span> · 5-minute reply window
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Counter label="Pending" value={pending.length} tone="blue" />
              <Counter label="Breached" value={breached.length} tone="rose" />
            </div>
          </div>
          {breached.length > 0 && (
            <div className="mt-3 flex items-center justify-between rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-xs">
              <span className="text-rose-900">
                {breached.length} reply{breached.length === 1 ? "" : "s"} past the
                5-min window.
              </span>
              <button
                onClick={escalate}
                disabled={escalating}
                className="rounded bg-rose-600 px-2 py-1 text-white text-xs disabled:opacity-50"
              >
                {escalating ? "…" : "Escalate to Slack"}
              </button>
            </div>
          )}
          {lastEscalate && (
            <div className="mt-2 text-xs text-gray-500">
              Escalation fired Slack pings for {lastEscalate.alerted} item
              {lastEscalate.alerted === 1 ? "" : "s"}.
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-4 space-y-6">
        {pending.length + breached.length === 0 && responded.length === 0 && (
          <div className="rounded border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500">
            No cold-email replies in the last 48 hours. The dashboard will
            populate as Instantly fires the reply webhook.
          </div>
        )}

        {(pending.length > 0 || breached.length > 0) && (
          <Section title="Open queue" count={pending.length + breached.length}>
            {[...breached, ...pending].map((item) => (
              <SlaCard
                key={item.id}
                item={item}
                onMarkResponded={() => markResponded(item.id)}
              />
            ))}
          </Section>
        )}

        {responded.length > 0 && (
          <Section title="Recently handled" count={responded.length} muted>
            {responded.slice(0, 20).map((item) => (
              <SlaCard
                key={item.id}
                item={item}
                onMarkResponded={() => {}}
                muted
              />
            ))}
          </Section>
        )}
      </main>
    </div>
  );
}

function Section({
  title,
  count,
  muted,
  children,
}: {
  title: string;
  count: number;
  muted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2
        className={`text-sm font-semibold mb-2 ${muted ? "text-gray-400" : "text-gray-600"}`}
      >
        {title} <span className="font-mono">({count})</span>
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function SlaCard({
  item,
  onMarkResponded,
  muted,
}: {
  item: SlaItem;
  onMarkResponded: () => void;
  muted?: boolean;
}) {
  const isBreached = item.status === "breached";
  const isResponded = item.status === "responded";
  const tone = isResponded
    ? "border-emerald-200 bg-emerald-50"
    : isBreached
      ? "border-rose-300 bg-rose-50"
      : "border-blue-300 bg-blue-50";
  const remainingLabel = formatRemaining(item.seconds_remaining, item.status);

  return (
    <div className={`rounded-lg border p-3 ${tone} ${muted ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs">
            <IntentBadge intent={item.intent} confidence={item.intent_confidence ?? 0} />
            {item.crm_stage_advanced && (
              <span className="rounded bg-emerald-100 px-2 py-0.5 text-emerald-800 font-mono">
                CRM advanced
              </span>
            )}
          </div>
          <div className="mt-1 font-semibold text-sm truncate">
            {item.lead_name ?? "(no name)"}{" "}
            <span className="text-gray-500 font-normal">
              &lt;{item.lead_email ?? "no email"}&gt;
            </span>
          </div>
          {item.campaign_name && (
            <div className="text-xs text-gray-600 mt-0.5 truncate">
              {item.campaign_name}
            </div>
          )}
          {item.reply_subject && (
            <div className="text-xs text-gray-700 mt-1 truncate">
              {item.reply_subject}
            </div>
          )}
          {item.reply_body && (
            <div className="text-xs text-gray-600 mt-1 line-clamp-2">
              {item.reply_body.slice(0, 240)}
            </div>
          )}
          {item.intent_reason && (
            <div className="text-xs text-gray-500 italic mt-1">
              {item.intent_reason}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div
            className={`font-mono text-sm tabular-nums ${
              isResponded
                ? "text-emerald-700"
                : isBreached
                  ? "text-rose-700"
                  : "text-blue-700"
            }`}
          >
            {remainingLabel}
          </div>
          {!isResponded && (
            <button
              onClick={onMarkResponded}
              className="rounded bg-black text-white text-xs font-semibold px-3 py-1.5"
            >
              Mark responded
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function IntentBadge({ intent, confidence }: { intent: string; confidence: number }) {
  const cls =
    intent === "interested"
      ? "bg-emerald-100 text-emerald-800"
      : intent === "more_info"
        ? "bg-amber-100 text-amber-800"
        : "bg-gray-100 text-gray-700";
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-mono ${cls}`}>
      {intent}
      {confidence ? ` ${confidence}` : ""}
    </span>
  );
}

function Counter({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "blue" | "rose";
}) {
  const cls =
    tone === "rose" && value > 0
      ? "text-rose-700"
      : tone === "blue" && value > 0
        ? "text-blue-700"
        : "text-gray-400";
  return (
    <div className="text-right">
      <div className={`text-2xl font-bold tabular-nums ${cls}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-gray-500">
        {label}
      </div>
    </div>
  );
}

function formatRemaining(remaining: number, status: SlaItem["status"]): string {
  if (status === "responded") return "✓ done";
  if (remaining >= 0) {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }
  // breach — show how late
  const over = -remaining;
  if (over < 60) return `+${over}s late`;
  if (over < 3600) return `+${Math.floor(over / 60)}m late`;
  return `+${Math.floor(over / 3600)}h late`;
}

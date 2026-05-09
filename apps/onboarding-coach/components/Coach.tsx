"use client";

import { useMemo, useState } from "react";
import type {
  OnboardingRunRow,
  OnboardingStepCompletionRow,
} from "@/lib/persist";
import { PLAYBOOK, PLAYBOOK_TOTALS, getDay } from "@/lib/playbook";
import type { PlaybookStep } from "@/lib/playbook";

export function Coach({
  initialRun,
  initialCompletions,
  tenant,
}: {
  initialRun: OnboardingRunRow | null;
  initialCompletions: OnboardingStepCompletionRow[];
  tenant: { id: string; slug: string; name: string };
}) {
  const [run, setRun] = useState(initialRun);
  const [completions, setCompletions] = useState(initialCompletions);
  const [activeDay, setActiveDay] = useState(initialRun?.current_day ?? 1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completedKeys = useMemo(
    () => new Set(completions.map((c) => c.step_key)),
    [completions],
  );

  const dayProgress = useMemo(() => {
    return PLAYBOOK.map((d) => {
      const total = d.steps.length;
      const done = d.steps.filter((s) => completedKeys.has(s.key)).length;
      return { day: d.day, total, done, complete: total > 0 && done === total };
    });
  }, [completedKeys]);

  const overallDone = completions.length;
  const pct = Math.round(
    (overallDone / Math.max(1, PLAYBOOK_TOTALS.total_steps)) * 100,
  );

  const day = getDay(activeDay);

  async function startRun() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/run", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "start failed");
      setRun(json.run);
      setActiveDay(json.run.current_day ?? 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleStep(step: PlaybookStep) {
    if (!run) return;
    const isComplete = completedKeys.has(step.key);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/steps", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          step_key: step.key,
          action: isComplete ? "unmark" : "mark",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "mark failed");

      if (isComplete) {
        setCompletions((prev) => prev.filter((c) => c.step_key !== step.key));
      } else if (json.completion) {
        setCompletions((prev) => [...prev, json.completion]);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function setDayOnServer(d: number) {
    setActiveDay(d);
    if (!run) return;
    await fetch("/api/run", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ day: d }),
    });
  }

  if (!run) {
    return (
      <div className="min-h-screen bg-white">
        <main className="mx-auto max-w-2xl px-6 py-16 text-center space-y-6">
          <h1 className="text-3xl font-bold tracking-tight">Onboarding Coach</h1>
          <p className="text-gray-600">
            Tenant <span className="font-mono">{tenant.slug}</span> hasn&apos;t
            started the 30-day playbook yet.
          </p>
          <p className="text-sm text-gray-500 leading-relaxed">
            The coach walks you from naming your business through landing your
            first paying customer in 30 days. Each daily step is backed by a
            Naples module — when a step is automatable, the platform runs it
            for you. {PLAYBOOK_TOTALS.module_backed_steps} of{" "}
            {PLAYBOOK_TOTALS.total_steps} steps are module-backed; the rest
            (sales calls, community engagement, retros) stay deliberately human.
          </p>
          <button
            onClick={startRun}
            disabled={busy}
            className="px-5 py-3 bg-black text-white rounded text-sm font-semibold disabled:opacity-50"
          >
            {busy ? "Starting…" : "Start Day 1"}
          </button>
          {error && <div className="text-sm text-rose-700">{error}</div>}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 sticky top-0 bg-white z-10">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Onboarding Coach</h1>
            <p className="text-xs text-gray-500">
              <span className="font-mono">{tenant.slug}</span> · run started{" "}
              {new Date(run.started_at).toLocaleDateString()}
              {run.status !== "active" && (
                <>
                  {" · "}
                  <span className="font-mono">{run.status}</span>
                </>
              )}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold tabular-nums">
              {overallDone}
              <span className="text-sm text-gray-400 font-normal">
                /{PLAYBOOK_TOTALS.total_steps}
              </span>
            </div>
            <div className="text-[10px] uppercase tracking-wide text-gray-500">
              {pct}% complete
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 grid md:grid-cols-[260px_1fr] gap-6">
        <aside className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
            30 days
          </div>
          {dayProgress.map((p) => (
            <button
              key={p.day}
              onClick={() => setDayOnServer(p.day)}
              className={
                p.day === activeDay
                  ? "w-full text-left rounded-md px-3 py-2 text-sm bg-black text-white"
                  : p.complete
                    ? "w-full text-left rounded-md px-3 py-2 text-sm bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                    : p.done > 0
                      ? "w-full text-left rounded-md px-3 py-2 text-sm bg-amber-50 text-amber-900 hover:bg-amber-100"
                      : "w-full text-left rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-700 hover:bg-gray-100"
              }
            >
              <span className="font-mono text-xs mr-2">D{p.day}</span>
              <span className="font-mono text-xs">
                {p.done}/{p.total}
              </span>
              {p.complete && <span className="ml-2 text-xs">✓</span>}
            </button>
          ))}
        </aside>

        <section>
          {day && (
            <div className="space-y-4">
              <header>
                <div className="text-xs font-mono text-gray-500">Day {day.day}</div>
                <h2 className="text-2xl font-bold mt-1">{day.title}</h2>
                <p className="text-sm text-gray-600 mt-1">{day.goal}</p>
                <p className="text-xs text-gray-500 mt-2">
                  ~{day.total_minutes} min today · {day.steps.length} step
                  {day.steps.length === 1 ? "" : "s"}
                </p>
                {day.reminder && (
                  <div className="mt-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    {day.reminder}
                  </div>
                )}
              </header>

              <div className="space-y-3">
                {day.steps.map((step) => {
                  const done = completedKeys.has(step.key);
                  return (
                    <div
                      key={step.key}
                      className={
                        done
                          ? "rounded-lg border border-emerald-200 bg-emerald-50 p-4"
                          : "rounded-lg border border-gray-200 p-4 hover:border-gray-300"
                      }
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleStep(step)}
                          disabled={busy}
                          aria-label={
                            done ? "Mark incomplete" : "Mark complete"
                          }
                          className={
                            done
                              ? "shrink-0 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm"
                              : "shrink-0 w-6 h-6 rounded-full border-2 border-gray-300 hover:border-gray-500"
                          }
                        >
                          {done ? "✓" : ""}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2 flex-wrap">
                            <span
                              className={
                                done
                                  ? "font-semibold text-sm line-through text-emerald-900"
                                  : "font-semibold text-sm"
                              }
                            >
                              {step.title}
                            </span>
                            {step.module_key ? (
                              <ModuleBadge moduleKey={step.module_key} />
                            ) : step.manual ? (
                              <span className="text-[10px] uppercase tracking-wide rounded bg-gray-100 text-gray-600 px-1.5 py-0.5">
                                manual
                              </span>
                            ) : null}
                            <span className="text-[10px] uppercase tracking-wide text-gray-500">
                              {step.minutes} min
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1 leading-snug">
                            {step.why}
                          </p>
                          {step.resource_url && (
                            <a
                              href={step.resource_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-blue-700 underline mt-1 inline-block break-all"
                            >
                              {step.resource_url}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-3">
                <button
                  onClick={() => activeDay > 1 && setDayOnServer(activeDay - 1)}
                  disabled={activeDay <= 1}
                  className="text-sm text-gray-500 disabled:opacity-30"
                >
                  ← Day {activeDay - 1}
                </button>
                <button
                  onClick={() => activeDay < 30 && setDayOnServer(activeDay + 1)}
                  disabled={activeDay >= 30}
                  className="text-sm text-gray-500 disabled:opacity-30"
                >
                  Day {activeDay + 1} →
                </button>
              </div>
            </div>
          )}
          {error && <div className="text-sm text-rose-700 mt-4">{error}</div>}
        </section>
      </main>
    </div>
  );
}

function ModuleBadge({ moduleKey }: { moduleKey: string }) {
  return (
    <span className="text-[10px] uppercase tracking-wide rounded bg-blue-100 text-blue-800 px-1.5 py-0.5">
      → {moduleKey.replace(/_/g, " ")}
    </span>
  );
}

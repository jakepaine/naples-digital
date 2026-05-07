"use client";
import { useState, useTransition } from "react";
import clsx from "clsx";
import type { ReDealStatus } from "@naples/db";

const OPTIONS: ReDealStatus[] = ["new", "qualified", "under_review", "passed", "dead"];

export function DealStatusControl({ dealId, status }: { dealId: string; status: ReDealStatus }) {
  const [current, setCurrent] = useState<ReDealStatus>(status);
  const [busy, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function set(s: ReDealStatus) {
    if (s === current) return;
    startTransition(async () => {
      setErr(null);
      const prev = current;
      setCurrent(s); // optimistic
      const res = await fetch(`/api/deals/${dealId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: s }),
      });
      if (!res.ok) {
        setCurrent(prev);
        setErr("Failed to update");
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-1">
      {OPTIONS.map((s) => (
        <button
          key={s}
          onClick={() => set(s)}
          disabled={busy}
          className={clsx(
            "rounded-sm border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider transition-colors",
            s === current
              ? "border-cream bg-cream/10 text-cream"
              : "border-card-border text-muted hover:border-cream hover:text-cream"
          )}
        >
          {s.replace("_", " ")}
        </button>
      ))}
      {err && <span className="text-xs text-rose">{err}</span>}
    </div>
  );
}

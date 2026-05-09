"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import clsx from "clsx";
import type { Tier } from "@naples/db";

export function SubscribeButton({
  tier,
  popular,
}: {
  tier: Tier;
  popular: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.error === "billing_not_configured") {
          // Graceful fallback to email contact while owner finishes Stripe setup
          window.location.href = `mailto:jake@naples.digital?subject=Naples Digital — ${tier}`;
          return;
        }
        throw new Error(json.message ?? json.error ?? "checkout failed");
      }
      if (json.url) window.location.href = json.url;
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={busy}
        className={clsx(
          "group mt-6 flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-3.5 text-base font-medium transition-all disabled:opacity-60",
          popular
            ? "border border-gold/50 bg-gradient-to-t from-grad-bronze via-gold to-grad-amber text-white shadow-[0_8px_24px_-8px_rgba(184,137,62,0.7)] hover:from-gold hover:to-white"
            : "border border-white/10 bg-gradient-to-t from-ink-deep to-white/[0.06] text-white shadow-lg shadow-black/40 hover:border-gold/30",
        )}
      >
        {busy ? "Loading…" : "Get started"}
        {!busy && (
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        )}
      </button>
      {error && (
        <div className="mt-2 text-xs text-red-400 text-center">{error}</div>
      )}
    </>
  );
}

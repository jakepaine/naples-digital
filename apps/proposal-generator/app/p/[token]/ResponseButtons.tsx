"use client";

import { useState } from "react";

export function ResponseButtons({ token }: { token: string }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<"accepted" | "rejected" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function respond(status: "accepted" | "rejected") {
    setBusy(status);
    setError(null);
    try {
      const res = await fetch(`/api/proposals/respond/${token}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "request failed");
      setDone(status);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  if (done) {
    return (
      <div
        className={`rounded p-4 text-sm font-semibold ${done === "accepted" ? "bg-emerald-50 text-emerald-900" : "bg-gray-100 text-gray-700"}`}
      >
        Thanks — your response has been recorded ({done}).
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-600">
        Ready to move forward? Choose one:
      </div>
      <div className="flex gap-3">
        <button
          disabled={!!busy}
          onClick={() => respond("accepted")}
          className="px-5 py-2.5 bg-emerald-600 text-white rounded font-semibold disabled:opacity-50"
        >
          {busy === "accepted" ? "Accepting…" : "Accept proposal"}
        </button>
        <button
          disabled={!!busy}
          onClick={() => respond("rejected")}
          className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded disabled:opacity-50"
        >
          {busy === "rejected" ? "…" : "Decline"}
        </button>
      </div>
      {error && (
        <div className="text-sm text-red-700">{error}</div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import type { PhoneQualificationRow } from "@/lib/phone-qualifications";

export function PhoneQualifyView({
  initialItems,
  tenant,
}: {
  initialItems: PhoneQualificationRow[];
  tenant: { id: string; slug: string; name: string };
}) {
  const [items, setItems] = useState(initialItems);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    owner_name: "",
    owner_phone: "",
    property_address: "",
  });

  async function kickoff(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/phone-qualify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          owner_name: form.owner_name,
          owner_phone: form.owner_phone,
          property_address: form.property_address || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "kickoff failed");
      setItems((prev) => [json.qualification, ...prev]);
      setForm({ owner_name: "", owner_phone: "", property_address: "" });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function poll(id: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/phone-qualify/${id}/poll`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "poll failed");
      // Re-fetch list after poll updates the row.
      const list = await fetch("/api/phone-qualify").then((r) => r.json());
      if (list.items) setItems(list.items);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <h1 className="text-xl font-bold tracking-tight">Phone Qualify</h1>
          <p className="text-xs text-gray-500">
            <span className="font-mono">{tenant.slug}</span> · Bland.ai
            outbound qualification calls. Pre-qualify owners before a human
            picks up the phone.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 grid md:grid-cols-[320px_1fr] gap-6">
        <aside>
          <h2 className="text-sm font-semibold mb-3">Kick off a call</h2>
          <form onSubmit={kickoff} className="space-y-3">
            <label className="block text-sm">
              <span className="font-semibold">Owner name</span>
              <input
                value={form.owner_name}
                onChange={(e) =>
                  setForm((s) => ({ ...s, owner_name: e.target.value }))
                }
                required
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="font-semibold">Phone (E.164 or US)</span>
              <input
                value={form.owner_phone}
                onChange={(e) =>
                  setForm((s) => ({ ...s, owner_phone: e.target.value }))
                }
                required
                placeholder="+12145551234"
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm font-mono"
              />
            </label>
            <label className="block text-sm">
              <span className="font-semibold">
                Property address{" "}
                <span className="text-gray-400">(optional)</span>
              </span>
              <input
                value={form.property_address}
                onChange={(e) =>
                  setForm((s) => ({ ...s, property_address: e.target.value }))
                }
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2 bg-black text-white rounded text-sm disabled:opacity-50"
            >
              {busy ? "Dialing…" : "Kick off Bland call"}
            </button>
            {error && <div className="text-xs text-rose-700 mt-1">{error}</div>}
          </form>

          <p className="text-[11px] text-gray-500 mt-4 leading-relaxed">
            We never push for a sale on these calls. Goal is correct-owner
            confirmation + soft openness signal. Default 4-min cap. Connect
            your Bland.ai key from the integrations page; without one, calls
            run in stub mode (deterministic transcripts) so the workflow is
            visible before you pay for Bland.
          </p>
        </aside>

        <section>
          <h2 className="text-sm font-semibold mb-3">
            Recent calls ({items.length})
          </h2>
          {items.length === 0 && (
            <div className="rounded border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500">
              No qualifications yet. Use the form to kick off your first call.
            </div>
          )}
          <ul className="space-y-3">
            {items.map((row) => (
              <li
                key={row.id}
                className="rounded border border-gray-200 p-4 space-y-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">
                      {row.owner_name}{" "}
                      <span className="font-mono text-gray-500 font-normal">
                        {row.owner_phone}
                      </span>
                    </div>
                    {row.property_address && (
                      <div className="text-xs text-gray-600 truncate">
                        {row.property_address}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <CallStatusBadge status={row.call_status} />
                    <button
                      onClick={() => poll(row.id)}
                      disabled={busy}
                      className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Poll
                    </button>
                  </div>
                </div>
                {row.summary && (
                  <div className="text-xs text-gray-700 italic">
                    {row.summary}
                  </div>
                )}
                <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                  {typeof row.qualification_score === "number" && (
                    <span className="font-mono">
                      score {row.qualification_score}/100
                    </span>
                  )}
                  {row.recommended_followup && (
                    <FollowupBadge value={row.recommended_followup} />
                  )}
                  {typeof row.is_correct_owner === "boolean" && (
                    <span>
                      owner: {row.is_correct_owner ? "yes" : "no"}
                    </span>
                  )}
                  {typeof row.is_thinking_of_selling === "boolean" && (
                    <span>
                      open to selling:{" "}
                      {row.is_thinking_of_selling ? "yes" : "no"}
                    </span>
                  )}
                  {row.asking_price_range && (
                    <span>price range: {row.asking_price_range}</span>
                  )}
                  {row.call_duration_seconds && (
                    <span>{row.call_duration_seconds}s</span>
                  )}
                </div>
                {row.transcript && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-gray-500">
                      Transcript
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap font-mono text-[11px] leading-snug bg-gray-50 p-2 rounded">
                      {row.transcript}
                    </pre>
                  </details>
                )}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}

function CallStatusBadge({ status }: { status: string }) {
  const cls =
    status === "completed"
      ? "bg-emerald-100 text-emerald-800"
      : status === "in_progress"
        ? "bg-blue-100 text-blue-800"
        : status === "queued"
          ? "bg-gray-100 text-gray-700"
          : status === "voicemail"
            ? "bg-amber-100 text-amber-800"
            : status === "no_answer"
              ? "bg-amber-100 text-amber-800"
              : "bg-rose-100 text-rose-800";
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-mono ${cls}`}>
      {status}
    </span>
  );
}

function FollowupBadge({ value }: { value: string }) {
  const cls =
    value === "human_call"
      ? "bg-emerald-100 text-emerald-800"
      : value === "followup_30d"
        ? "bg-amber-100 text-amber-800"
        : value === "do_not_contact"
          ? "bg-rose-100 text-rose-800"
          : "bg-gray-100 text-gray-700";
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-mono ${cls}`}>
      → {value.replace(/_/g, " ")}
    </span>
  );
}

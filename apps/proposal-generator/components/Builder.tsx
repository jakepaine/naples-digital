"use client";

import { useState } from "react";
import type { ProposalRow } from "@/lib/persist-proposal";

interface LeadOption {
  id: string;
  name: string;
  primary_email: string | null;
  stage: string;
}

interface BuilderProps {
  initialProposals: ProposalRow[];
  leads: LeadOption[];
  tenant: { id: string; slug: string; name: string };
}

function fmtUSD(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function Builder({ initialProposals, leads, tenant }: BuilderProps) {
  const [proposals, setProposals] = useState<ProposalRow[]>(initialProposals);
  const [selectedLeadId, setSelectedLeadId] = useState<string>(leads[0]?.id ?? "");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function patch(id: string, partial: Partial<ProposalRow>) {
    setProposals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...partial } : p)),
    );
  }

  async function handleDraft() {
    if (!selectedLeadId) return;
    setBusy("draft");
    setError(null);
    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ leadId: selectedLeadId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "draft failed");
      setProposals((prev) => [json.proposal, ...prev]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function handleApprove(id: string) {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/proposals/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "approve failed");
      patch(id, json.proposal);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function handleSend(id: string) {
    setBusy(id);
    try {
      const res = await fetch(`/api/proposals/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "send" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "send failed");
      patch(id, json.proposal);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-8 space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Proposal Generator</h1>
        <p className="text-sm text-gray-500 mt-2">
          Tenant: <span className="font-mono">{tenant.slug}</span> · Pick a
          lead, draft via Claude, edit if needed, approve to mint a hosted
          public URL, then send.
        </p>
      </header>

      <section className="border border-gray-200 rounded-lg p-5 bg-white space-y-3">
        <div className="font-semibold text-sm">Draft a new proposal</div>
        <div className="flex gap-2">
          <select
            value={selectedLeadId}
            onChange={(e) => setSelectedLeadId(e.target.value)}
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
          >
            {leads.length === 0 && <option>(no leads in CRM yet)</option>}
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} · {l.stage}
                {l.primary_email && ` · ${l.primary_email}`}
              </option>
            ))}
          </select>
          <button
            disabled={!selectedLeadId || busy === "draft"}
            onClick={handleDraft}
            className="px-4 py-2 bg-black text-white rounded text-sm disabled:opacity-50"
          >
            {busy === "draft" ? "Drafting…" : "Draft with AI"}
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {proposals.length === 0 ? (
        <div className="rounded border border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
          No proposals yet. Draft your first one above.
        </div>
      ) : (
        <ul className="space-y-4">
          {proposals.map((p) => {
            const totalCents = (p.pricing ?? []).reduce(
              (s, l) => s + (l.amount_cents ?? 0),
              0,
            );
            const publicUrl =
              p.public_token &&
              `${typeof window !== "undefined" ? window.location.origin : ""}/p/${p.public_token}`;
            return (
              <li
                key={p.id}
                className="border border-gray-200 rounded-lg p-5 bg-white space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold">{p.title}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {p.client_name && `${p.client_name} · `}
                      {p.client_email && `${p.client_email} · `}
                      <span className="font-mono">{p.status}</span>
                      {" · "}
                      {new Date(p.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-lg">{fmtUSD(totalCents)}</div>
                    {p.timeline_weeks && (
                      <div className="text-xs text-gray-400">
                        {p.timeline_weeks} weeks
                      </div>
                    )}
                  </div>
                </div>

                {p.intro && (
                  <p className="text-sm text-gray-700">{p.intro}</p>
                )}

                {(p.scope_items ?? []).length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase">Scope</div>
                    <ul className="text-sm text-gray-700 list-disc pl-5 mt-1">
                      {p.scope_items.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {(p.deliverables ?? []).length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase">Deliverables</div>
                    <ul className="text-sm text-gray-700 mt-1 space-y-1">
                      {p.deliverables.map((d, i) => (
                        <li key={i}>
                          <span className="font-medium">{d.title}.</span>{" "}
                          <span className="text-gray-600">{d.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {(p.pricing ?? []).length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase">Pricing</div>
                    <ul className="text-sm text-gray-700 mt-1 space-y-1">
                      {p.pricing.map((row, i) => (
                        <li key={i} className="flex justify-between">
                          <span>{row.line_item}</span>
                          <span className="font-mono">{fmtUSD(row.amount_cents)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {p.notes && (
                  <p className="text-xs text-gray-500 italic">{p.notes}</p>
                )}

                {publicUrl && (
                  <div className="rounded border border-gray-200 bg-gray-50 p-2 text-xs">
                    <div className="font-semibold mb-1">Public URL</div>
                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-blue-700 underline break-all"
                    >
                      {publicUrl}
                    </a>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {p.status === "draft" && (
                    <button
                      disabled={busy === p.id}
                      onClick={() => handleApprove(p.id)}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded text-sm disabled:opacity-50"
                    >
                      {busy === p.id ? "Approving…" : "Approve & mint URL"}
                    </button>
                  )}
                  {p.status === "approved" && publicUrl && (
                    <button
                      disabled={busy === p.id}
                      onClick={() => handleSend(p.id)}
                      className="px-3 py-1.5 bg-black text-white rounded text-sm disabled:opacity-50"
                    >
                      {busy === p.id ? "Marking sent…" : "Mark as sent"}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

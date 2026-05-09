"use client";

import { useState } from "react";
import { MOCK_LEADS, formatUSD, totalCents, type MockLead } from "@/lib/mock-leads";
import type { GeneratedInvoice } from "@/lib/generate-invoice";

export function Pipeline() {
  const [generating, setGenerating] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<Record<string, GeneratedInvoice>>({});

  async function handleGenerate(lead: MockLead) {
    setGenerating(lead.id);
    try {
      const res = await fetch("/api/generate-invoice", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ leadId: lead.id }),
      });
      const json = await res.json();
      setInvoices((prev) => ({ ...prev, [lead.id]: json.invoice }));
    } finally {
      setGenerating(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-8 space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Lead Won → Invoice</h1>
        <p className="text-sm text-gray-500 mt-2">
          When a CRM lead moves to "Won", generate the invoice + Stripe payment
          link in one click. Mock leads + mock invoices today; real integration
          wires up to per-tenant Stripe credentials via Supabase Vault.
        </p>
      </header>

      <ul className="space-y-4">
        {MOCK_LEADS.map((lead) => {
          const invoice = invoices[lead.id];
          return (
            <li
              key={lead.id}
              className="border border-gray-200 rounded-lg p-5 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{lead.company}</div>
                  <div className="text-sm text-gray-600">
                    {lead.name} &lt;{lead.email}&gt;
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Won {new Date(lead.wonAt).toLocaleString()}{" "}
                    {lead.proposalRef && `· ${lead.proposalRef}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-mono">
                    {formatUSD(totalCents(lead))}
                  </div>
                </div>
              </div>

              <ul className="text-sm text-gray-600 space-y-1">
                {lead.lineItems.map((li, i) => (
                  <li key={i} className="flex justify-between">
                    <span>
                      {li.description}
                      {li.quantity > 1 && ` × ${li.quantity}`}
                    </span>
                    <span className="font-mono">
                      {formatUSD(li.unitAmountCents * li.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              {invoice ? (
                <div className="bg-green-50 border border-green-200 rounded p-3 text-sm space-y-1">
                  <div>
                    Invoice <span className="font-mono">{invoice.invoiceId}</span>{" "}
                    drafted ({formatUSD(invoice.totalCents)})
                  </div>
                  <div>
                    <a
                      href={invoice.stripeUrl}
                      className="text-blue-600 underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Stripe payment link
                    </a>
                  </div>
                  <div className="text-xs text-gray-500">
                    Status: {invoice.status} · created{" "}
                    {new Date(invoice.createdAt).toLocaleString()}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleGenerate(lead)}
                  disabled={generating === lead.id}
                  className="px-3 py-1.5 bg-black text-white rounded text-sm disabled:opacity-50"
                >
                  {generating === lead.id
                    ? "Generating…"
                    : "Generate invoice + Stripe link"}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

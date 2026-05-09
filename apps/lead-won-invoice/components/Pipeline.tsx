"use client";

import { useState } from "react";
import Link from "next/link";
import { formatUSD, totalCentsOf, type LineItem } from "@/lib/format";
import type { WonLeadView, InvoiceRow } from "@/lib/won-leads";

interface PipelineProps {
  initialLeads: WonLeadView[];
  tenant: { id: string; slug: string; name: string };
}

export function Pipeline({ initialLeads, tenant }: PipelineProps) {
  const [leads, setLeads] = useState(initialLeads);
  const [busyLeadId, setBusyLeadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function patchLead(leadId: string, invoice: InvoiceRow | null) {
    setLeads((prev) =>
      prev.map((row) =>
        row.lead.id === leadId ? { ...row, invoice } : row,
      ),
    );
  }

  async function handleDraft(leadId: string) {
    setBusyLeadId(leadId);
    setError(null);
    try {
      const res = await fetch("/api/draft-invoice", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ leadId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "draft failed");
      if (json.invoice) patchLead(leadId, json.invoice);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyLeadId(null);
    }
  }

  async function handleApprove(leadId: string, invoiceId: string) {
    setBusyLeadId(leadId);
    setError(null);
    try {
      const res = await fetch(`/api/invoice/${invoiceId}/approve`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.reason === "stripe_not_configured") {
          setError(
            "Approved — but you need to add your Stripe key before we can finalize. Go to Integrations.",
          );
        } else {
          setError(json.error ?? "approve failed");
        }
      }
      // Optimistically reflect approved/sent state
      const current = leads.find((l) => l.lead.id === leadId)?.invoice;
      if (current) {
        patchLead(leadId, {
          ...current,
          approval_status: json.ok ? "sent" : "approved",
          stripe_invoice_id: json.stripeInvoiceId ?? current.stripe_invoice_id,
          stripe_hosted_invoice_url:
            json.hostedUrl ?? current.stripe_hosted_invoice_url,
          sent_at: json.ok ? new Date().toISOString() : current.sent_at,
          approved_at: current.approved_at ?? new Date().toISOString(),
        });
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyLeadId(null);
    }
  }

  async function handleReject(leadId: string, invoiceId: string) {
    setBusyLeadId(leadId);
    setError(null);
    try {
      const res = await fetch(`/api/invoice/${invoiceId}/reject`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "reject failed");
      const current = leads.find((l) => l.lead.id === leadId)?.invoice;
      if (current) patchLead(leadId, { ...current, approval_status: "rejected" });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyLeadId(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-8 space-y-8">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lead Won → Invoice</h1>
          <p className="text-sm text-gray-500 mt-2">
            Tenant: <span className="font-mono">{tenant.slug}</span> · Won leads
            since they flipped to <span className="font-mono">stage=won</span>{" "}
            in CRM.
          </p>
        </div>
        <Link
          href="/integrations/stripe"
          className="text-sm text-blue-600 hover:underline"
        >
          Stripe settings →
        </Link>
      </header>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {leads.length === 0 && (
        <div className="rounded border border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
          No won leads yet. Move a lead to stage=won in CRM Pipeline to see it
          here.
        </div>
      )}

      <ul className="space-y-4">
        {leads.map(({ lead, invoice }) => {
          const lineItems = (invoice?.line_items as LineItem[]) ?? [];
          const totalC = invoice ? totalCentsOf(lineItems) : null;
          const busy = busyLeadId === lead.id;
          return (
            <li
              key={lead.id}
              className="border border-gray-200 rounded-lg p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold">
                    {lead.ai_angle?.headline ?? lead.domain ?? lead.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {lead.name}
                    {lead.primary_email && ` <${lead.primary_email}>`}
                  </div>
                  {lead.goal && (
                    <div className="text-xs text-gray-500 mt-1 italic">
                      {lead.goal}
                    </div>
                  )}
                  <div className="text-xs text-gray-400 mt-1">
                    Won {new Date(lead.updated_at).toLocaleString()}
                    {lead.source && ` · ${lead.source}`}
                    {lead.value && ` · quoted ${formatUSD(Number(lead.value) * 100)}`}
                  </div>
                </div>
              </div>

              {invoice ? (
                <InvoiceCard
                  invoice={invoice}
                  totalC={totalC}
                  busy={busy}
                  onApprove={() => handleApprove(lead.id, invoice.id)}
                  onReject={() => handleReject(lead.id, invoice.id)}
                  onRedraft={() => handleDraft(lead.id)}
                />
              ) : (
                <button
                  onClick={() => handleDraft(lead.id)}
                  disabled={busy}
                  className="px-3 py-1.5 bg-black text-white rounded text-sm disabled:opacity-50"
                >
                  {busy ? "Drafting…" : "Draft invoice with AI"}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function InvoiceCard(props: {
  invoice: InvoiceRow;
  totalC: number | null;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
  onRedraft: () => void;
}) {
  const { invoice, totalC, busy, onApprove, onReject, onRedraft } = props;
  const lineItems = (invoice.line_items as LineItem[]) ?? [];
  const status = invoice.approval_status;
  const colorClass =
    status === "paid"
      ? "border-green-300 bg-green-50"
      : status === "sent"
        ? "border-blue-300 bg-blue-50"
        : status === "rejected"
          ? "border-gray-300 bg-gray-50"
          : "border-amber-300 bg-amber-50";

  return (
    <div className={`rounded border p-4 space-y-3 ${colorClass}`}>
      <div className="flex items-center justify-between">
        <div className="text-sm">
          <span className="font-mono">{invoice.number}</span>
          <span className="ml-2 text-xs uppercase tracking-wider px-2 py-0.5 rounded bg-white/70 border">
            {status}
          </span>
        </div>
        <div className="font-mono text-sm">
          {totalC != null ? formatUSD(totalC) : ""}
        </div>
      </div>
      {invoice.description && (
        <div className="text-sm text-gray-700">{invoice.description}</div>
      )}
      <ul className="text-sm text-gray-700 space-y-1">
        {lineItems.map((li, i) => (
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
      {invoice.stripe_hosted_invoice_url && (
        <a
          href={invoice.stripe_hosted_invoice_url}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-blue-700 underline"
        >
          Open in Stripe →
        </a>
      )}
      <div className="flex gap-2 pt-1">
        {status === "draft" && (
          <>
            <button
              disabled={busy}
              onClick={onApprove}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded text-sm disabled:opacity-50"
            >
              {busy ? "Sending…" : "Approve & send via Stripe"}
            </button>
            <button
              disabled={busy}
              onClick={onReject}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm disabled:opacity-50"
            >
              Reject
            </button>
            <button
              disabled={busy}
              onClick={onRedraft}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm disabled:opacity-50"
            >
              Re-draft with AI
            </button>
          </>
        )}
        {status === "rejected" && (
          <button
            disabled={busy}
            onClick={onRedraft}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm disabled:opacity-50"
          >
            Re-draft with AI
          </button>
        )}
      </div>
    </div>
  );
}

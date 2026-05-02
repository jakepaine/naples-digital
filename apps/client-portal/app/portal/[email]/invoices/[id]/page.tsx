import { notFound } from "next/navigation";
import { Card, Badge } from "@naples/ui";
import { getInvoice } from "@naples/db";
import { getServerTenantId } from "@naples/db/next";
import { PayInvoice } from "@/components/PayInvoice";
import { CheckCircle2, Lock } from "lucide-react";

export const dynamic = "force-dynamic";

interface LineItem { label: string; qty: number; price: number }

export default async function InvoiceDetail({ params }: { params: { email: string; id: string } }) {
  const tid = await getServerTenantId();
  const inv = await getInvoice(tid, params.id);
  if (!inv) return notFound();
  const lineItems = inv.line_items as unknown as LineItem[];

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="text-[10px] uppercase tracking-[0.32em] text-live">{inv.status === "paid" ? "Receipt" : "Invoice"}</div>
      <h1 className="mt-2 font-heading text-5xl tracking-broadcast text-cream">{inv.number}</h1>
      <div className="mt-3 h-px w-16 bg-live" />

      <Card className="mt-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Bill to" value={inv.client_name} />
          <Field label="Issued" value={new Date(inv.issued_at).toLocaleDateString()} />
          <Field label="Due" value={inv.due_at ? new Date(inv.due_at).toLocaleDateString() : "—"} />
        </div>

        <div className="mt-8 border-t border-card-border pt-6">
          <div className="text-[10px] uppercase tracking-[0.18em] text-live">Description</div>
          <p className="mt-2 text-sm text-cream/90">{inv.description}</p>
        </div>

        <div className="mt-8 border-t border-card-border pt-6">
          <div className="text-[10px] uppercase tracking-[0.18em] text-live">Line Items</div>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="border-b border-card-border text-left text-[10px] uppercase tracking-wider text-muted">
                <th className="py-2">Item</th>
                <th className="py-2 text-right">Qty</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((li, i) => (
                <tr key={i} className="border-b border-card-border/40">
                  <td className="py-3 text-cream">{li.label}</td>
                  <td className="py-3 text-right text-muted">{li.qty}</td>
                  <td className="py-3 text-right text-cream">${Number(li.price).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex items-center justify-end gap-8 text-sm">
            <div className="text-right">
              <div className="text-muted">Subtotal</div>
              <div className="mt-1 text-cream">${Number(inv.subtotal).toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className="text-muted">Tax</div>
              <div className="mt-1 text-cream">${Number(inv.tax).toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-live">Total Due</div>
              <div className="mt-1 font-heading text-3xl tracking-broadcast text-live">${Number(inv.total).toLocaleString()}</div>
            </div>
          </div>
        </div>
      </Card>

      {inv.status === "paid" ? (
        <Card className="mt-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald" />
            <div>
              <Badge tone="emerald">Paid in Full</Badge>
              <h2 className="mt-2 font-heading text-2xl tracking-broadcast text-cream">Receipt on file</h2>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 border-t border-card-border pt-6 md:grid-cols-3">
            <Field label="Paid" value={inv.paid_at ? new Date(inv.paid_at).toLocaleString() : "—"} />
            <Field label="Method" value={inv.payment_method ?? "—"} />
            <Field label="Stripe ID" value={inv.stripe_payment_intent ? inv.stripe_payment_intent.slice(0, 18) + "…" : "—"} />
          </div>
          <div className="mt-4 text-[10px] uppercase tracking-[0.18em] text-muted">
            <Lock className="-mt-0.5 mr-1 inline h-3 w-3" /> Payment secured by Stripe · all major cards
          </div>
        </Card>
      ) : (
        <PayInvoice invoiceId={inv.id} amount={Number(inv.total)} number={inv.number} />
      )}
    </main>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
      <div className="mt-1 text-base text-cream">{value}</div>
    </div>
  );
}

import type { MockLead } from "./mock-leads";

/**
 * Stub Stripe + invoice generation. Real implementation will:
 *   1. Look up tenant_integrations.secret_ref for Stripe via @naples/db.
 *   2. Resolve the per-tenant Stripe key via get_tenant_secret RPC.
 *   3. Create a Stripe Invoice + InvoiceItem(s); finalize; send.
 *   4. Persist invoice ID + Stripe URL to a new lead_won_invoices table.
 *   5. Update CRM Pipeline lead with invoice ref.
 *
 * For now, emit a deterministic Stripe-shaped object so the UI renders end-to-end
 * without leaving placeholders.
 */

export interface GeneratedInvoice {
  invoiceId: string;
  stripeUrl: string;
  totalCents: number;
  pdfPlaceholder: string;
  status: "drafted";
  createdAt: string;
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export function generateInvoice(lead: MockLead): GeneratedInvoice {
  const totalCents = lead.lineItems.reduce(
    (sum, li) => sum + li.unitAmountCents * li.quantity,
    0,
  );
  const seed = `${lead.id}-${Date.now().toString(36)}`;
  return {
    invoiceId: `in_mock_${seed}`,
    stripeUrl: `https://checkout.stripe.com/c/pay/cs_test_${slug(lead.company)}_${seed}`,
    totalCents,
    pdfPlaceholder: `https://files.example.com/invoices/${seed}.pdf`,
    status: "drafted",
    createdAt: new Date().toISOString(),
  };
}

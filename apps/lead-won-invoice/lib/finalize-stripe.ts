import { getTenantStripe } from "./stripe-client";
import { getInvoiceById, markSent } from "./persist-invoice";
import type { LineItem } from "./format";

// Finalize a draft invoice by pushing it to the tenant's Stripe account:
//  1. Create or look up the Stripe Customer for the client_email
//  2. Create the Invoice (collection_method: 'send_invoice', daysUntilDue: 14)
//  3. Add InvoiceItems for each line
//  4. Finalize → triggers Stripe to email the hosted invoice
//
// Returns the Stripe invoice id + hosted URL after writing them to the row.
export async function finalizeViaStripe(args: {
  tenantId: string;
  invoiceId: string;
}): Promise<{ stripeInvoiceId: string; hostedUrl: string }> {
  const inv = await getInvoiceById(args.invoiceId);
  if (!inv) throw new Error(`invoice ${args.invoiceId} not found`);
  if (inv.approval_status === "sent" || inv.approval_status === "paid") {
    throw new Error(`invoice ${args.invoiceId} already finalized`);
  }
  if (!inv.client_email) {
    throw new Error(`invoice ${args.invoiceId} missing client_email`);
  }

  const stripe = await getTenantStripe(args.tenantId);

  // 1. Customer (idempotent-ish via search; Stripe doesn't enforce email uniqueness)
  const search = await stripe.customers.list({
    email: inv.client_email,
    limit: 1,
  });
  const customer =
    search.data[0] ??
    (await stripe.customers.create({
      email: inv.client_email,
      name: inv.client_name ?? undefined,
      metadata: { naples_lead_id: inv.lead_id ?? "" },
    }));

  // 2. Invoice shell
  const stripeInvoice = await stripe.invoices.create({
    customer: customer.id,
    collection_method: "send_invoice",
    days_until_due: 14,
    description: inv.description ?? undefined,
    metadata: {
      naples_invoice_id: inv.id,
      naples_lead_id: inv.lead_id ?? "",
      naples_tenant_id: args.tenantId,
    },
    auto_advance: true,
  });

  // 3. InvoiceItems (one per line). Each item belongs to the invoice we created.
  const lineItems = (inv.line_items ?? []) as LineItem[];
  for (const li of lineItems) {
    await stripe.invoiceItems.create({
      customer: customer.id,
      invoice: stripeInvoice.id,
      description: li.description,
      quantity: li.quantity,
      unit_amount: li.unitAmountCents,
      currency: "usd",
    });
  }

  // 4. Finalize → triggers email send when collection_method=send_invoice + auto_advance
  const finalized = await stripe.invoices.finalizeInvoice(stripeInvoice.id);
  if (!finalized.hosted_invoice_url) {
    throw new Error("Stripe did not return a hosted_invoice_url");
  }

  await markSent({
    id: inv.id,
    stripeInvoiceId: finalized.id,
    stripeHostedUrl: finalized.hosted_invoice_url,
  });

  return {
    stripeInvoiceId: finalized.id,
    hostedUrl: finalized.hosted_invoice_url,
  };
}

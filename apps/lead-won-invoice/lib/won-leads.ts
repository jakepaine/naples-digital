import { createServerClient, hasSupabase } from "@naples/db";
import type { LineItem } from "./format";

// Lead row shape we care about. Mirrors the public.leads schema.
export interface WonLead {
  id: string;
  name: string | null;
  primary_email: string | null;
  domain: string | null;
  type: string | null;
  goal: string | null;
  value: number | null;
  source: string | null;
  ai_angle: any;
  updated_at: string;
}

// What the UI consumes. Combines the lead with any existing draft/sent invoice.
export interface WonLeadView {
  lead: WonLead;
  invoice: InvoiceRow | null;
}

export interface InvoiceRow {
  id: string;
  client_name: string | null;
  client_email: string | null;
  number: string | null;
  description: string | null;
  line_items: LineItem[];
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  status: string;
  approval_status: string;
  stripe_invoice_id: string | null;
  stripe_hosted_invoice_url: string | null;
  auto_generated: boolean;
  created_at: string;
  approved_at: string | null;
  sent_at: string | null;
  paid_at: string | null;
  lead_id: string | null;
}

export async function fetchWonLeadsForTenant(
  tenantId: string,
): Promise<WonLeadView[]> {
  if (!hasSupabase()) {
    return mockWonLeads();
  }
  const sb = createServerClient();
  const { data: leads, error: leadsErr } = await sb
    .from("leads")
    .select(
      "id, name, primary_email, domain, type, goal, value, source, ai_angle, updated_at",
    )
    .eq("tenant_id", tenantId)
    .eq("stage", "won")
    .order("updated_at", { ascending: false })
    .limit(100);
  if (leadsErr) throw new Error(`leads query: ${leadsErr.message}`);

  const leadIds = (leads ?? []).map((l: any) => l.id);
  let invoiceByLeadId = new Map<string, InvoiceRow>();
  if (leadIds.length > 0) {
    const { data: invoices, error: invErr } = await sb
      .from("invoices")
      .select("*")
      .eq("tenant_id", tenantId)
      .in("lead_id", leadIds);
    if (invErr) throw new Error(`invoices query: ${invErr.message}`);
    for (const inv of invoices ?? []) {
      invoiceByLeadId.set((inv as any).lead_id, inv as any);
    }
  }

  return (leads ?? []).map((l: any) => ({
    lead: l as WonLead,
    invoice: invoiceByLeadId.get(l.id) ?? null,
  }));
}

// Dev / demo fallback when Supabase env is not set.
function mockWonLeads(): WonLeadView[] {
  const now = new Date();
  const ago = (mins: number) =>
    new Date(now.getTime() - mins * 60_000).toISOString();
  return [
    {
      lead: {
        id: "demo-lead-001",
        name: "Sarah Liu",
        primary_email: "sarah@anchorbookkeeping.com",
        domain: "anchorbookkeeping.com",
        type: "service-business",
        goal: "Streamline client onboarding + automate invoicing",
        value: 3497,
        source: "referral",
        ai_angle: { headline: "Anchor Bookkeeping", summary: "Solo bookkeeper buried in onboarding emails" },
        updated_at: ago(20),
      },
      invoice: null,
    },
    {
      lead: {
        id: "demo-lead-002",
        name: "Daniela Ortiz",
        primary_email: "dani@meridianinspections.com",
        domain: "meridianinspections.com",
        type: "service-business",
        goal: "Cut admin time on inspection scheduling",
        value: 1997,
        source: "cold-outreach",
        ai_angle: { headline: "Meridian Home Inspections", summary: "10-inspector team, manual scheduling" },
        updated_at: ago(120),
      },
      invoice: null,
    },
  ];
}

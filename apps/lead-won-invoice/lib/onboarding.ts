import { createServerClient } from "@naples/db";

// Default onboarding playbook. Each tenant can override later by writing
// their own templates table; for now, the same 5 steps fire for every
// paid invoice.
const DEFAULT_TASKS = [
  { task_name: "Send welcome email + portal access link", due_in_days: 0 },
  { task_name: "Schedule kickoff call", due_in_days: 2 },
  { task_name: "Collect onboarding form (logo, brand, asset access)", due_in_days: 3 },
  { task_name: "Provision tenant accounts + integrations", due_in_days: 5 },
  { task_name: "First-week check-in", due_in_days: 7 },
];

// Idempotent on (tenant_id, invoice_id, task_name) — won't double-create
// onboarding tasks if the same Stripe webhook fires twice.
export async function kickOffOnboardingTasks(args: {
  tenantId: string;
  invoiceId: string;
  leadId: string | null;
  assigneeEmail?: string | null;
}): Promise<{ created: number; skipped: number }> {
  const sb = createServerClient();
  const now = new Date();

  // Look up existing tasks for this invoice — skip if any present.
  const { data: existing, error: lookupErr } = await sb
    .from("client_onboarding_tasks")
    .select("id, task_name")
    .eq("tenant_id", args.tenantId)
    .eq("invoice_id", args.invoiceId);
  if (lookupErr) throw new Error(`onboarding lookup: ${lookupErr.message}`);
  const existingNames = new Set((existing ?? []).map((r: any) => r.task_name));

  const toInsert = DEFAULT_TASKS.filter(
    (t) => !existingNames.has(t.task_name),
  ).map((t) => ({
    tenant_id: args.tenantId,
    invoice_id: args.invoiceId,
    lead_id: args.leadId,
    task_name: t.task_name,
    status: "pending",
    assignee_email: args.assigneeEmail ?? null,
    due_at: new Date(
      now.getTime() + t.due_in_days * 24 * 60 * 60 * 1000,
    ).toISOString(),
  }));

  if (toInsert.length === 0) {
    return { created: 0, skipped: DEFAULT_TASKS.length };
  }

  const { error: insErr } = await sb
    .from("client_onboarding_tasks")
    .insert(toInsert);
  if (insErr) throw new Error(`onboarding insert: ${insErr.message}`);

  return {
    created: toInsert.length,
    skipped: DEFAULT_TASKS.length - toInsert.length,
  };
}

import { notifyTenantSlack, createServerClient, hasSupabase } from "@naples/db";
import type { EmailRow } from "./inbox-query";

// Send a Slack ping when a high_priority email lands. Per-tenant routing —
// pulls webhook from tenant_integrations(kind='slack'), falls back to
// SLACK_WEBHOOK_HIGH_PRIORITY_EMAIL or SLACK_WEBHOOK_DEFAULT.
//
// Idempotent on emails.slack_notified — won't re-ping if classify is re-run.
export async function maybeAlertHighPriority(args: {
  tenantId: string;
  tenantSlug: string;
  email: EmailRow;
}): Promise<boolean> {
  if (args.email.category !== "high_priority") return false;
  if (args.email.slack_notified) return false;

  const score = args.email.score ?? 0;
  const text = [
    `🔥 *High-priority email* — tenant: \`${args.tenantSlug}\` · score ${score}`,
    `*From:* ${args.email.from_name ?? args.email.from_email} <${args.email.from_email}>`,
    `*Subject:* ${args.email.subject}`,
    args.email.preview && `*Preview:* ${args.email.preview.slice(0, 280)}`,
    args.email.reason && `_AI reason:_ ${args.email.reason}`,
  ]
    .filter(Boolean)
    .join("\n");

  const ok = await notifyTenantSlack({
    tenantId: args.tenantId,
    text,
    opts: { envFallback: "SLACK_WEBHOOK_HIGH_PRIORITY_EMAIL" },
  });

  if (ok && hasSupabase()) {
    const sb = createServerClient();
    await sb
      .from("emails")
      .update({ slack_notified: true })
      .eq("id", args.email.id);
  }

  return ok;
}

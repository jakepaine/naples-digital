import { notifyTenantSlack } from "@naples/db";

// Send a Slack notification when a new lead lands via inbound webhook.
// Tenant-aware: pulls per-tenant Slack webhook from Vault first, falls back
// to platform SLACK_WEBHOOK_INBOUND_LEADS env var if no tenant integration.
export async function notifySlackInboundLead(args: {
  tenantId: string;
  tenantSlug: string;
  lead: {
    id: string;
    name: string;
    email?: string;
    type?: string;
    goal?: string;
    value?: number;
    source?: string;
  };
}): Promise<void> {
  const lines = [
    `*New inbound lead* — tenant: \`${args.tenantSlug}\``,
    `*Name:* ${args.lead.name}`,
    args.lead.email && `*Email:* ${args.lead.email}`,
    args.lead.type && `*Type:* ${args.lead.type}`,
    args.lead.goal && `*Goal:* ${args.lead.goal}`,
    args.lead.value && `*Value:* $${args.lead.value.toLocaleString()}`,
    args.lead.source && `*Source:* ${args.lead.source}`,
    `_lead id:_ \`${args.lead.id}\``,
  ].filter(Boolean) as string[];

  await notifyTenantSlack({
    tenantId: args.tenantId,
    text: lines.join("\n"),
    opts: { envFallback: "SLACK_WEBHOOK_INBOUND_LEADS" },
  });
}

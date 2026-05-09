// Send a Slack notification when a new lead lands via inbound webhook.
// Uses the platform-level SLACK_WEBHOOK_INBOUND_LEADS env (single channel
// across tenants for now). Per-tenant routing is a follow-up — would store
// the webhook URL in tenant_integrations.config.

export async function notifySlackInboundLead(args: {
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
  const url = process.env.SLACK_WEBHOOK_INBOUND_LEADS;
  if (!url) return;

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

  const body = JSON.stringify({ text: lines.join("\n") });

  try {
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    });
  } catch (e) {
    console.error("slack notify failed:", (e as Error).message);
  }
}

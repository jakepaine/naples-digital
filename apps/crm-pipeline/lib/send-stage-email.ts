import { createServerClient, hasSupabase } from "@naples/db";
import { renderTemplate, leadVars } from "./render-template";

// Resolve all enabled templates for the given (tenant, to_stage) and fire
// each via Resend. from_stage NULL acts as a wildcard. Returns counts.
//
// Per-tenant Resend key: looked up via get_tenant_secret(kind='resend');
// if missing, falls back to platform RESEND_API_KEY (the agency-wide key
// used for transactional sends from the Naples Digital domain).
//
// Audit row written to lead_email_sends for every match — sent, failed,
// or skipped (no email on lead, no Resend key configured at all).
export async function sendStageChangeEmails(args: {
  tenantId: string;
  tenantName: string;
  leadId: string;
  fromStage: string | null;
  toStage: string;
}): Promise<{ matched: number; sent: number; failed: number; skipped: number }> {
  if (!hasSupabase()) return { matched: 0, sent: 0, failed: 0, skipped: 0 };
  const sb = createServerClient();

  // Find matching templates
  const { data: templates, error: tErr } = await sb
    .from("lead_email_templates")
    .select("*")
    .eq("tenant_id", args.tenantId)
    .eq("enabled", true)
    .eq("to_stage", args.toStage);
  if (tErr) {
    console.error("template lookup:", tErr.message);
    return { matched: 0, sent: 0, failed: 0, skipped: 0 };
  }
  const matches = (templates ?? []).filter(
    (t: any) => t.from_stage == null || t.from_stage === args.fromStage,
  );
  if (matches.length === 0) {
    return { matched: 0, sent: 0, failed: 0, skipped: 0 };
  }

  // Lookup lead + primary email
  const { data: lead } = await sb
    .from("leads")
    .select("name, type, goal, value, primary_email")
    .eq("tenant_id", args.tenantId)
    .eq("id", args.leadId)
    .maybeSingle();
  if (!lead) return { matched: matches.length, sent: 0, failed: 0, skipped: matches.length };

  const toEmail = (lead as any).primary_email as string | null;
  if (!toEmail) {
    // Skip + audit
    for (const t of matches) {
      await sb.from("lead_email_sends").insert({
        tenant_id: args.tenantId,
        template_id: (t as any).id,
        lead_id: args.leadId,
        to_email: "",
        from_stage: args.fromStage,
        to_stage: args.toStage,
        subject: (t as any).subject,
        status: "skipped",
        error_message: "lead has no primary_email",
      });
    }
    return { matched: matches.length, sent: 0, failed: 0, skipped: matches.length };
  }

  // Resend key: per-tenant first, fall back to platform
  let resendKey: string | undefined;
  let fromAddress: string | undefined;
  const { data: tenantKey } = await sb.rpc("get_tenant_secret", {
    p_tenant_id: args.tenantId,
    p_kind: "resend",
  });
  const tenantRow = (tenantKey ?? [])[0] as any;
  if (tenantRow?.out_secret) {
    resendKey = tenantRow.out_secret;
    fromAddress = tenantRow.out_config?.from_address;
  } else {
    resendKey = process.env.RESEND_API_KEY;
    fromAddress = process.env.RESEND_FROM_ADDRESS ?? "leads@naplesdigital.com";
  }
  if (!resendKey) {
    for (const t of matches) {
      await sb.from("lead_email_sends").insert({
        tenant_id: args.tenantId,
        template_id: (t as any).id,
        lead_id: args.leadId,
        to_email: toEmail,
        from_stage: args.fromStage,
        to_stage: args.toStage,
        subject: (t as any).subject,
        status: "skipped",
        error_message: "no resend key configured (tenant or platform)",
      });
    }
    return { matched: matches.length, sent: 0, failed: 0, skipped: matches.length };
  }

  let sent = 0;
  let failed = 0;
  const vars = leadVars({
    lead: lead as any,
    email: toEmail,
    tenantName: args.tenantName,
  });

  for (const t of matches) {
    const subject = renderTemplate((t as any).subject, vars);
    const body = renderTemplate((t as any).body_template, vars);
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [toEmail],
          subject,
          text: body,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as any;
      if (!res.ok) throw new Error(json.message ?? `resend ${res.status}`);
      sent++;
      await sb.from("lead_email_sends").insert({
        tenant_id: args.tenantId,
        template_id: (t as any).id,
        lead_id: args.leadId,
        to_email: toEmail,
        from_stage: args.fromStage,
        to_stage: args.toStage,
        subject,
        status: "sent",
        resend_message_id: json.id ?? null,
      });
      // Bump fire_count + last_fired_at on the template
      await sb
        .from("lead_email_templates")
        .update({
          fire_count: ((t as any).fire_count ?? 0) + 1,
          last_fired_at: new Date().toISOString(),
        })
        .eq("id", (t as any).id);
    } catch (e) {
      failed++;
      await sb.from("lead_email_sends").insert({
        tenant_id: args.tenantId,
        template_id: (t as any).id,
        lead_id: args.leadId,
        to_email: toEmail,
        from_stage: args.fromStage,
        to_stage: args.toStage,
        subject,
        status: "failed",
        error_message: (e as Error).message,
      });
    }
  }

  return { matched: matches.length, sent, failed, skipped: 0 };
}

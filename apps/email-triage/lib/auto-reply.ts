import { createServerClient, hasSupabase } from "@naples/db";
import { renderTemplate, emailVars } from "./render-template";
import type { EmailRow } from "./inbox-query";

// Look up matching enabled auto-reply template(s) for the email's category
// and send via Resend. Per-tenant Resend key first, falls back to platform
// RESEND_API_KEY. Updates emails.auto_replied=true once any template fires
// (idempotency — won't double-send if classify is re-run).
export async function maybeAutoReply(args: {
  tenantId: string;
  tenantName: string;
  email: EmailRow;
}): Promise<{ sent: number; failed: number; skipped: number }> {
  if (!hasSupabase()) return { sent: 0, failed: 0, skipped: 0 };
  if (!args.email.category || args.email.auto_replied) {
    return { sent: 0, failed: 0, skipped: 0 };
  }
  const sb = createServerClient();

  const { data: templates, error } = await sb
    .from("email_auto_reply_templates")
    .select("*")
    .eq("tenant_id", args.tenantId)
    .eq("enabled", true)
    .eq("category", args.email.category);
  if (error || !templates || templates.length === 0) {
    return { sent: 0, failed: 0, skipped: 0 };
  }

  // Resend key (per-tenant first, platform fallback)
  let resendKey: string | undefined;
  let fromAddress: string | undefined;
  try {
    const { data: tk } = await sb.rpc("get_tenant_secret", {
      p_tenant_id: args.tenantId,
      p_kind: "resend",
    });
    const row = (tk ?? [])[0] as any;
    if (row?.out_secret) {
      resendKey = row.out_secret;
      fromAddress = row.out_config?.from_address;
    }
  } catch {
    /* fall through to platform */
  }
  if (!resendKey) {
    resendKey = process.env.RESEND_API_KEY;
    fromAddress = process.env.RESEND_FROM_ADDRESS ?? "no-reply@naplesdigital.com";
  }
  if (!resendKey) return { sent: 0, failed: 0, skipped: templates.length };

  const vars = emailVars({
    email: args.email,
    tenantName: args.tenantName,
  });
  let sent = 0;
  let failed = 0;
  let lastSentText: string | null = null;

  for (const t of templates) {
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
          to: [args.email.from_email],
          subject,
          text: body,
          // In-Reply-To threading would require pulling Gmail's Message-ID
          // header — deferred. For now sends as a fresh thread.
        }),
      });
      const json = (await res.json().catch(() => ({}))) as any;
      if (!res.ok) throw new Error(json.message ?? `resend ${res.status}`);
      sent++;
      lastSentText = body;
      await sb
        .from("email_auto_reply_templates")
        .update({
          fire_count: ((t as any).fire_count ?? 0) + 1,
          last_fired_at: new Date().toISOString(),
        })
        .eq("id", (t as any).id);
    } catch (e) {
      failed++;
      console.error(
        `auto-reply send failed for template ${(t as any).id}:`,
        (e as Error).message,
      );
    }
  }

  if (sent > 0) {
    await sb
      .from("emails")
      .update({
        auto_replied: true,
        auto_reply_text: lastSentText,
      })
      .eq("id", args.email.id);
  }

  return { sent, failed, skipped: 0 };
}

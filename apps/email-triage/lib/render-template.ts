// {{double_brace}} renderer + email-context variable builder. Mirrors the
// crm-pipeline render-template helper to keep tenant-facing template syntax
// consistent across modules.

export function renderTemplate(
  template: string,
  vars: Record<string, string | number | null | undefined>,
): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
    const v = vars[key];
    if (v === null || v === undefined) return match;
    return String(v);
  });
}

export function emailVars(args: {
  email: {
    subject: string;
    from_email: string;
    from_name?: string | null;
    preview?: string | null;
  };
  tenantName: string;
}): Record<string, string> {
  return {
    subject: args.email.subject,
    from_email: args.email.from_email,
    from_name: args.email.from_name ?? args.email.from_email.split("@")[0] ?? "",
    preview: args.email.preview ?? "",
    tenant_name: args.tenantName,
  };
}

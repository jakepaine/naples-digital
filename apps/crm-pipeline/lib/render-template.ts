// Tiny {{double_brace}} template renderer. No conditionals, no loops —
// just variable substitution. Unknown variables are left as-is so they're
// visible in the rendered output (better than silently dropping).

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

export function leadVars(args: {
  lead: {
    name: string;
    type?: string | null;
    goal?: string | null;
    value?: number | null;
  };
  email: string;
  tenantName: string;
}): Record<string, string> {
  return {
    name: args.lead.name ?? "",
    email: args.email,
    type: args.lead.type ?? "",
    goal: args.lead.goal ?? "",
    value: args.lead.value ? `$${args.lead.value.toLocaleString()}` : "",
    tenant_name: args.tenantName,
  };
}

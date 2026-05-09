// Parse a webhook payload from a form vendor into our internal lead shape.
// Supports two payload shapes:
//   1. Typeform's nested form_response.answers[]
//   2. A generic flat object: { name, email, type?, goal?, value?, source? }
// Returns null if no usable lead can be extracted.

export interface ParsedLead {
  name: string;
  email?: string;
  type?: string;
  goal?: string;
  value?: number;
  source?: string;
  raw: any;
}

export function parseFormPayload(payload: any): ParsedLead | null {
  if (!payload || typeof payload !== "object") return null;

  // Typeform shape
  if (payload.event_type === "form_response" && payload.form_response) {
    return parseTypeform(payload);
  }

  // Generic flat shape
  if (typeof payload.name === "string" || typeof payload.email === "string") {
    return parseGeneric(payload);
  }

  return null;
}

function parseTypeform(payload: any): ParsedLead | null {
  const answers = (payload.form_response?.answers ?? []) as Array<any>;
  const refMap: Record<string, any> = {};
  for (const ans of answers) {
    const ref = ans.field?.ref ?? ans.field?.id;
    if (!ref) continue;
    refMap[ref] = extractValue(ans);
  }
  const name =
    refMap.name ??
    refMap.full_name ??
    refMap.first_name ??
    "Unknown";
  const email = refMap.email;
  const value = refMap.value ?? refMap.budget;
  return {
    name: String(name),
    email: email ? String(email) : undefined,
    type: refMap.type ? String(refMap.type) : undefined,
    goal: refMap.goal ? String(refMap.goal) : refMap.message ? String(refMap.message) : undefined,
    value: value != null ? Number(value) : undefined,
    source: payload.form_response?.hidden?.utm_source ?? "typeform",
    raw: payload,
  };
}

function extractValue(answer: any): any {
  return (
    answer.text ??
    answer.email ??
    answer.phone_number ??
    answer.url ??
    answer.number ??
    answer.choice?.label ??
    answer.choices?.labels?.join(", ") ??
    answer.boolean ??
    null
  );
}

function parseGeneric(payload: any): ParsedLead {
  return {
    name: String(payload.name ?? "Unknown"),
    email: payload.email ? String(payload.email) : undefined,
    type: payload.type ? String(payload.type) : undefined,
    goal: payload.goal ? String(payload.goal) : undefined,
    value: payload.value != null ? Number(payload.value) : undefined,
    source: payload.source ? String(payload.source) : "form",
    raw: payload,
  };
}

// RFC 8058 list-unsubscribe headers — required by Google + Yahoo's 2024
// bulk-sender rules. Senders without these get throttled or junked at
// scale.
//
// Two headers must travel together for one-click unsubscribe to work:
//
//   List-Unsubscribe: <mailto:unsub@..>, <https://..>
//   List-Unsubscribe-Post: List-Unsubscribe=One-Click
//
// The mailto: variant is the legacy path; the URL is what Gmail's
// one-click button posts to. Including BOTH satisfies both Google's
// 2024 enforcement and Yahoo's parallel rules.
//
// We surface a helper for building the header pair, plus a verifier
// that checks an outgoing message's headers comply.

export interface ListUnsubscribeOptions {
  /** Mailto address for legacy clients. Required. */
  mailto: string;
  /** HTTPS URL the inbox provider POSTs to on one-click. Required. */
  url: string;
  /** Subject line for the mailto: variant. Default "unsubscribe". */
  mailtoSubject?: string;
}

export interface ListUnsubscribeHeaders {
  "List-Unsubscribe": string;
  "List-Unsubscribe-Post": string;
}

export function buildListUnsubscribeHeaders(
  opts: ListUnsubscribeOptions,
): ListUnsubscribeHeaders {
  if (!opts.mailto.includes("@")) {
    throw new Error("list-unsubscribe mailto must be a valid address");
  }
  if (!opts.url.startsWith("https://")) {
    throw new Error("list-unsubscribe url must be HTTPS");
  }
  const subject = opts.mailtoSubject ?? "unsubscribe";
  const mailtoEntry = `<mailto:${opts.mailto}?subject=${encodeURIComponent(subject)}>`;
  const urlEntry = `<${opts.url}>`;
  return {
    "List-Unsubscribe": `${mailtoEntry}, ${urlEntry}`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

export interface HeaderComplianceCheck {
  compliant: boolean;
  has_list_unsubscribe: boolean;
  has_list_unsubscribe_post: boolean;
  has_https_url: boolean;
  has_mailto: boolean;
  issues: string[];
}

/**
 * Verify an outbound message's headers meet the 2024 requirements.
 * Caller passes a Headers-like object (case-insensitive lookups).
 */
export function checkListUnsubscribeCompliance(
  headers:
    | Headers
    | Record<string, string | string[] | undefined>
    | { get?: (name: string) => string | null },
): HeaderComplianceCheck {
  const result: HeaderComplianceCheck = {
    compliant: false,
    has_list_unsubscribe: false,
    has_list_unsubscribe_post: false,
    has_https_url: false,
    has_mailto: false,
    issues: [],
  };
  const lu = readHeader(headers, "list-unsubscribe");
  const lup = readHeader(headers, "list-unsubscribe-post");
  result.has_list_unsubscribe = !!lu;
  result.has_list_unsubscribe_post = !!lup;
  if (lu) {
    result.has_https_url = /<https:\/\/[^>]+>/i.test(lu);
    result.has_mailto = /<mailto:[^>]+>/i.test(lu);
  }
  if (!result.has_list_unsubscribe) {
    result.issues.push("List-Unsubscribe header missing");
  }
  if (!result.has_list_unsubscribe_post) {
    result.issues.push("List-Unsubscribe-Post header missing (one-click)");
  }
  if (lup && !/list-unsubscribe=one-click/i.test(lup)) {
    result.issues.push(
      "List-Unsubscribe-Post must be exactly 'List-Unsubscribe=One-Click'",
    );
  }
  if (lu && !result.has_https_url) {
    result.issues.push("List-Unsubscribe is missing the <https://...> entry");
  }
  if (lu && !result.has_mailto) {
    result.issues.push(
      "List-Unsubscribe is missing the <mailto:...> entry (legacy clients)",
    );
  }
  result.compliant =
    result.has_list_unsubscribe &&
    result.has_list_unsubscribe_post &&
    result.has_https_url &&
    result.has_mailto &&
    result.issues.length === 0;
  return result;
}

function readHeader(
  headers:
    | Headers
    | Record<string, string | string[] | undefined>
    | { get?: (name: string) => string | null },
  name: string,
): string | null {
  if (headers instanceof Headers) {
    const v = headers.get(name);
    return v ?? null;
  }
  if (typeof (headers as any)?.get === "function") {
    const v = (headers as any).get(name);
    return v ?? null;
  }
  const lc = name.toLowerCase();
  for (const [k, v] of Object.entries(headers as Record<string, unknown>)) {
    if (k.toLowerCase() === lc) {
      if (typeof v === "string") return v;
      if (Array.isArray(v)) return v.length > 0 ? String(v[0]) : null;
    }
  }
  return null;
}

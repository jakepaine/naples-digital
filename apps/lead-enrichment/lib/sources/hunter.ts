// Hunter.io adapter — fallback when Apollo + AnyMailFinder both miss.
//
// API: https://hunter.io/api-documentation/v2
// We use GET /v2/email-finder which discovers and verifies in one call.
// Hunter's `score` is a 0-100 confidence the email is correct. The
// `verification.status` field maps cleanly to our taxonomy.

import {
  EnrichmentSource,
  EnrichmentInput,
  EnrichmentResult,
  emailLooksValid,
  isRoleBased,
  VerificationStatus,
} from "./types";

const TIMEOUT_MS = 12_000;

function mapHunterStatus(status: string | null | undefined): VerificationStatus {
  if (!status) return "unknown";
  const s = status.toLowerCase();
  if (s === "valid") return "valid";
  if (s === "accept_all") return "accept_all";
  if (s === "invalid") return "invalid";
  if (s === "disposable") return "invalid";
  if (s === "webmail") return "unknown";
  return "unknown";
}

export const hunterSource: EnrichmentSource = {
  key: "hunter",
  displayName: "Hunter",
  isConfigured({ apiKey }) {
    return !!apiKey;
  },
  async enrich({ apiKey, input }) {
    const started = Date.now();
    if (!apiKey) return stubResult(input, started);

    if (!input.domain || (!input.first_name && !input.last_name)) {
      return {
        source: "hunter",
        email: null,
        confidence: 0,
        verification_status: "unknown",
        is_role_based: false,
        raw: {},
        error_message: "hunter requires domain + (first_name OR last_name)",
        duration_ms: Date.now() - started,
      };
    }

    const params = new URLSearchParams();
    params.set("domain", input.domain);
    if (input.first_name) params.set("first_name", input.first_name);
    if (input.last_name) params.set("last_name", input.last_name);
    if (input.company_name) params.set("company", input.company_name);
    params.set("api_key", apiKey);

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(
        `https://api.hunter.io/v2/email-finder?${params.toString()}`,
        { signal: ctrl.signal },
      );
      const json = (await res.json().catch(() => ({}))) as any;
      const email = json?.data?.email ?? null;
      const score = Number(json?.data?.score ?? 0);
      const verification = mapHunterStatus(json?.data?.verification?.status);
      // Hunter returns score 0-100. Use it directly when present; otherwise
      // fall back to the verification mapping.
      const confidence = score > 0
        ? Math.min(100, Math.max(0, score))
        : verification === "valid"
          ? 80
          : verification === "accept_all"
            ? 55
            : 0;
      return {
        source: "hunter",
        email: emailLooksValid(email) ? email : null,
        confidence,
        verification_status: verification,
        is_role_based: isRoleBased(email),
        raw: json,
        http_status: res.status,
        duration_ms: Date.now() - started,
      };
    } catch (e) {
      return {
        source: "hunter",
        email: null,
        confidence: 0,
        verification_status: "unknown",
        is_role_based: false,
        raw: {},
        error_message: (e as Error).message,
        duration_ms: Date.now() - started,
      };
    } finally {
      clearTimeout(timer);
    }
  },
};

function stubResult(input: EnrichmentInput, started: number): EnrichmentResult {
  const domain = input.domain ?? (input.email?.split("@")[1] ?? null);
  const first = (input.first_name ?? "alex").toLowerCase().replace(/[^a-z]/g, "");
  const last = (input.last_name ?? "stub").toLowerCase().replace(/[^a-z]/g, "");
  const email = domain ? `${first}.${last}@${domain}` : null;
  return {
    source: "hunter",
    email,
    confidence: email ? 70 : 0,
    verification_status: email ? "accept_all" : "unknown",
    is_role_based: false,
    raw: { stub: true, note: "HUNTER_API_KEY not set; deterministic stub." },
    duration_ms: Date.now() - started,
    is_stub: true,
  };
}

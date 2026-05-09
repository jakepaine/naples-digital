// Apollo.io adapter — primary B2B database lookup.
//
// Strategy: when given a domain (and optionally a title hint), call
// /api/v1/people/match to find the most relevant decision-maker. Apollo
// returns the email directly when a credit is available; we map their
// `email_status` field to our verification taxonomy.
//
// Falls back to deterministic stub data when no API key is configured.

import {
  EnrichmentSource,
  EnrichmentResult,
  EnrichmentInput,
  emailLooksValid,
  isRoleBased,
  pickConfidenceFromVerification,
  VerificationStatus,
} from "./types";

const ENDPOINT = "https://api.apollo.io/api/v1/people/match";
const TIMEOUT_MS = 12_000;

function mapApolloStatus(status: string | null | undefined): VerificationStatus {
  if (!status) return "unknown";
  const s = status.toLowerCase();
  if (s.includes("verified")) return "valid";
  if (s.includes("guessed")) return "unknown";
  if (s.includes("unverified")) return "unknown";
  if (s.includes("bounced") || s.includes("invalid")) return "invalid";
  if (s.includes("accept_all") || s.includes("catch_all")) return "catch_all";
  return "unknown";
}

export const apolloSource: EnrichmentSource = {
  key: "apollo",
  displayName: "Apollo",
  isConfigured({ apiKey }) {
    return !!apiKey;
  },
  async enrich({ apiKey, input }) {
    const started = Date.now();
    if (!apiKey) {
      return stubResult(input, started);
    }
    if (!input.domain && !input.linkedin_url && !(input.first_name && input.last_name)) {
      return {
        source: "apollo",
        email: null,
        confidence: 0,
        verification_status: "unknown",
        is_role_based: false,
        raw: {},
        error_message: "apollo requires at least domain, linkedin_url, or first+last name",
        duration_ms: Date.now() - started,
      };
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        signal: ctrl.signal,
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          first_name: input.first_name ?? undefined,
          last_name: input.last_name ?? undefined,
          organization_name: input.company_name ?? undefined,
          domain: input.domain ?? undefined,
          linkedin_url: input.linkedin_url ?? undefined,
          // Reveal the email even if it costs a credit — without this Apollo
          // returns "email_not_unlocked" for many queries.
          reveal_personal_emails: true,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as any;
      const person = json?.person ?? json?.matches?.[0] ?? null;
      const email = person?.email ?? null;
      const apolloStatus = person?.email_status ?? null;
      const verification = mapApolloStatus(apolloStatus);
      let confidence = pickConfidenceFromVerification(verification, 60);
      if (!email) confidence = 0;
      return {
        source: "apollo",
        email: emailLooksValid(email) ? email : null,
        confidence,
        verification_status: verification,
        is_role_based: isRoleBased(email),
        raw: { person, apollo_email_status: apolloStatus },
        http_status: res.status,
        duration_ms: Date.now() - started,
      };
    } catch (e) {
      return {
        source: "apollo",
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
  const domain = input.domain ?? guessDomain(input);
  const local = (input.first_name?.toLowerCase() ?? "alex").replace(/[^a-z]/g, "");
  const last = (input.last_name?.toLowerCase() ?? "stub").replace(/[^a-z]/g, "");
  const email = domain ? `${local}.${last}@${domain}` : null;
  return {
    source: "apollo",
    email,
    confidence: email ? 75 : 0,
    verification_status: email ? "valid" : "unknown",
    is_role_based: false,
    raw: { stub: true, note: "APOLLO_API_KEY not set; deterministic stub." },
    duration_ms: Date.now() - started,
    is_stub: true,
  };
}

function guessDomain(input: EnrichmentInput): string | null {
  if (input.email) {
    const at = input.email.indexOf("@");
    if (at >= 0) return input.email.slice(at + 1);
  }
  if (input.company_name) {
    const slug = input.company_name.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (slug) return `${slug}.com`;
  }
  return null;
}

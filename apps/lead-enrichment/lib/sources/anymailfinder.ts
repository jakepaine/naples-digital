// AnyMailFinder adapter — primary verifier. Confirms emails Apollo (or the
// tenant) thinks they have, OR discovers them from name+domain.
//
// API: https://anymailfinder.com/api-docs
// We use POST /v5.0/search/person.json which accepts either {full_name, domain}
// or {linkedin_url}. AnyMailFinder returns one of:
//   - status: "success" — email is verified
//   - status: "company_not_found"
//   - status: "validation_skipped" — looks valid but couldn't deliverability-test
//   - status: "not_found"
//   - status: "incorrect_credit_charge_paid_features_required"

import {
  EnrichmentSource,
  EnrichmentInput,
  EnrichmentResult,
  emailLooksValid,
  isRoleBased,
} from "./types";

const ENDPOINT = "https://api.anymailfinder.com/v5.0/search/person.json";
const TIMEOUT_MS = 12_000;

export const anymailfinderSource: EnrichmentSource = {
  key: "anymailfinder",
  displayName: "AnyMailFinder",
  isConfigured({ apiKey }) {
    return !!apiKey;
  },
  async enrich({ apiKey, input }) {
    const started = Date.now();
    if (!apiKey) return stubResult(input, started);

    const body: Record<string, unknown> = {};
    const fullName = [input.first_name, input.last_name].filter(Boolean).join(" ").trim();
    if (input.linkedin_url) {
      body.linkedin_url = input.linkedin_url;
    } else if (fullName && input.domain) {
      body.full_name = fullName;
      body.domain = input.domain;
    } else if (input.email) {
      body.email = input.email;
    } else {
      return {
        source: "anymailfinder",
        email: null,
        confidence: 0,
        verification_status: "unknown",
        is_role_based: false,
        raw: {},
        error_message: "anymailfinder requires linkedin_url OR (full_name + domain) OR email",
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
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => ({}))) as any;
      const email = json?.results?.email ?? json?.email ?? null;
      const status = String(json?.status ?? "").toLowerCase();
      const validation = String(json?.results?.validation ?? "").toLowerCase();

      let verification: EnrichmentResult["verification_status"] = "unknown";
      let confidence = 0;
      if (status === "success" && validation === "valid") {
        verification = "valid";
        confidence = 92;
      } else if (status === "success" && validation === "accept_all") {
        verification = "accept_all";
        confidence = 65;
      } else if (status === "validation_skipped") {
        verification = "unknown";
        confidence = 50;
      } else if (status === "not_found" || status === "company_not_found") {
        verification = "unknown";
        confidence = 0;
      } else if (validation === "invalid") {
        verification = "invalid";
        confidence = 5;
      }

      return {
        source: "anymailfinder",
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
        source: "anymailfinder",
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
  const email = domain ? `${first}@${domain}` : null;
  return {
    source: "anymailfinder",
    email,
    confidence: email ? 88 : 0,
    verification_status: email ? "valid" : "unknown",
    is_role_based: false,
    raw: { stub: true, note: "ANYMAILFINDER_API_KEY not set; deterministic stub." },
    duration_ms: Date.now() - started,
    is_stub: true,
  };
}

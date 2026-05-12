// Apify-LinkedIn adapter — last-resort enrichment for inputs that have
// only a LinkedIn URL (no domain, no email guess to verify).
//
// Strategy: kick off an Apify actor that scrapes the LinkedIn profile,
// pulls the public "contact info" section if visible, plus the company
// website (which we can then guess-verify via Hunter on a follow-up).
//
// Actor id is configurable via APIFY_ACTOR_LINKEDIN_PROFILE; we default to
// `apify/linkedin-profile-scraper` which is the most-used public actor.
// This adapter NEVER blocks a chain — if the actor times out or returns
// no useful fields, we return a low-confidence partial result.

import {
  EnrichmentSource,
  EnrichmentInput,
  EnrichmentResult,
  emailLooksValid,
  isRoleBased,
} from "./types";
import { recordApifyRun, extractApifyRunId } from "@naples/usage";

const RUN_TIMEOUT_MS = 45_000;

export const apifyLinkedinSource: EnrichmentSource = {
  key: "apify_linkedin",
  displayName: "Apify (LinkedIn)",
  isConfigured({ apiKey }) {
    return !!apiKey;
  },
  async enrich({ apiKey, input, tenantId }) {
    const started = Date.now();
    if (!apiKey) return stubResult(input, started);

    if (!input.linkedin_url) {
      return {
        source: "apify_linkedin",
        email: null,
        confidence: 0,
        verification_status: "unknown",
        is_role_based: false,
        raw: {},
        error_message: "apify_linkedin requires linkedin_url",
        duration_ms: Date.now() - started,
      };
    }

    const actorId =
      process.env.APIFY_ACTOR_LINKEDIN_PROFILE ?? "apify/linkedin-profile-scraper";
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), RUN_TIMEOUT_MS);
    try {
      const url = `https://api.apify.com/v2/acts/${actorId.replace("/", "~")}/run-sync-get-dataset-items?token=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        signal: ctrl.signal,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          urls: [input.linkedin_url],
          maxItems: 1,
        }),
      });
      const apifyRunId = extractApifyRunId(res.headers);
      if (apifyRunId && tenantId) {
        await recordApifyRun({
          tenantId,
          apifyRunId,
          actorId,
          sourceApp: "lead-enrichment",
        }).catch(() => null);
      }
      const items = (await res.json().catch(() => [])) as any[];
      const profile = Array.isArray(items) ? items[0] : null;
      const email =
        profile?.contact_info?.email ??
        profile?.email ??
        null;
      const company = profile?.current_company?.name ?? input.company_name ?? null;
      const websiteRaw = profile?.contact_info?.websites?.[0]?.url ?? profile?.website ?? null;
      const domain = websiteRaw ? extractDomain(websiteRaw) : null;
      // If we got an email directly we can confidence-rank it — public LinkedIn
      // emails are usually personal/role-based so we treat them as accept_all
      // (worth running through anymailfinder verify on a future tick).
      let confidence = 0;
      let verification: EnrichmentResult["verification_status"] = "unknown";
      if (emailLooksValid(email)) {
        verification = "accept_all";
        confidence = 60;
      } else if (domain) {
        // No email on the profile, but we surfaced a domain — mark as a
        // "discovery" hit so the chain runner can retry the previous
        // sources with the new domain.
        confidence = 40;
        verification = "unknown";
      }
      return {
        source: "apify_linkedin",
        email: emailLooksValid(email) ? email : null,
        confidence,
        verification_status: verification,
        is_role_based: isRoleBased(email),
        raw: { profile, discovered_domain: domain, discovered_company: company },
        http_status: res.status,
        duration_ms: Date.now() - started,
      };
    } catch (e) {
      return {
        source: "apify_linkedin",
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

function extractDomain(rawUrl: string): string | null {
  try {
    const u = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function stubResult(input: EnrichmentInput, started: number): EnrichmentResult {
  // The stub for LinkedIn is intentionally weaker than Apollo/AnyMailFinder/Hunter
  // — its real-world accuracy is also lower so the chain should reflect that.
  return {
    source: "apify_linkedin",
    email: null,
    confidence: 30,
    verification_status: "unknown",
    is_role_based: false,
    raw: {
      stub: true,
      note: "APIFY_TOKEN not set; LinkedIn-discovery stubbed (no synthetic email).",
      discovered_domain: input.domain ?? null,
      discovered_company: input.company_name ?? null,
    },
    duration_ms: Date.now() - started,
    is_stub: true,
  };
}

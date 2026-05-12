// Apify adapter — broadest source. Fires any Apify actor by id and
// normalises the dataset into RawScrapedLead. Caller passes:
//   params.actor_id  — e.g. "compass/google-maps-scraper"
//   params.input     — actor-specific input object
//   ctx.tenantId     — present when called from the route handler;
//                      enables per-tenant usage attribution.
//
// Common actors:
//   - compass/google-maps-scraper        local-business directories
//   - apify/linkedin-scraper             LinkedIn search results
//   - apify/instagram-hashtag-scraper    IG creators by hashtag
//
// Reuses the same Apify pattern as competitor-spy/lib/apify.ts.

import { ScrapeSource, ScrapeOutcome, RawScrapedLead } from "./types";
import { recordApifyRun, extractApifyRunId } from "@naples/usage";

const RUN_TIMEOUT_MS = 90_000;

export const apifySource: ScrapeSource = {
  key: "apify",
  displayName: "Apify",
  isConfigured({ apiKey }) {
    return !!apiKey;
  },
  async scrape({ apiKey, params, maxLeads, tenantId }) {
    if (!apiKey) return stubOutcome(maxLeads, params);

    const actorId = String((params as any).actor_id ?? "").trim();
    if (!actorId) {
      return {
        fetched: [],
        error: "apify.params.actor_id required (e.g. 'compass/google-maps-scraper')",
      };
    }
    const input = (params as any).input ?? {};

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), RUN_TIMEOUT_MS);
    try {
      const url = `https://api.apify.com/v2/acts/${actorId.replace("/", "~")}/run-sync-get-dataset-items?token=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        signal: ctrl.signal,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      // Tag the run for usage attribution. Best-effort — silent on failure.
      const apifyRunId = extractApifyRunId(res.headers);
      if (apifyRunId && tenantId) {
        await recordApifyRun({
          tenantId,
          apifyRunId,
          actorId,
          sourceApp: "lead-scraper",
        }).catch(() => null);
      }
      if (!res.ok) {
        return {
          fetched: [],
          error: `apify run failed: ${res.status} ${await res.text().catch(() => "")}`,
        };
      }
      const items = (await res.json().catch(() => [])) as any[];
      const fetched: RawScrapedLead[] = (Array.isArray(items) ? items : [])
        .slice(0, maxLeads)
        .map(normalizeApifyItem);
      return { fetched };
    } catch (e) {
      return { fetched: [], error: (e as Error).message };
    } finally {
      clearTimeout(timer);
    }
  },
};

function normalizeApifyItem(it: any): RawScrapedLead {
  // Common field names across the popular Apify actors. We fall through
  // multiple candidates so a single normaliser handles Maps + LinkedIn
  // + IG datasets without per-actor branching.
  const email =
    it.email ??
    it.contact?.email ??
    it.emails?.[0] ??
    null;
  const linkedin =
    it.linkedinUrl ??
    it.linkedin ??
    it.linkedin_profile_url ??
    null;
  const phone =
    it.phone ?? it.phoneNumber ?? it.phone_number ?? null;
  const company =
    it.companyName ?? it.company ?? it.title ?? it.businessName ?? null;
  const domain =
    extractDomain(
      it.website ?? it.websiteUrl ?? it.domain ?? it.url ?? null,
    );
  const first =
    it.firstName ?? it.first_name ?? splitName(it.name ?? "").first;
  const last =
    it.lastName ?? it.last_name ?? splitName(it.name ?? "").last;
  return {
    external_id: String(it.id ?? it.placeId ?? it.url ?? it.linkedinUrl ?? "") || null,
    email,
    first_name: first ?? null,
    last_name: last ?? null,
    company_name: company ?? null,
    domain,
    linkedin_url: linkedin,
    phone,
    title: it.title ?? it.jobTitle ?? null,
    location:
      it.location ??
      it.address ??
      [it.city, it.state, it.country].filter(Boolean).join(", ") ??
      null,
    industry: it.industry ?? it.category ?? it.categories?.[0] ?? null,
    source: "apify",
    raw: it,
  };
}

function extractDomain(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function splitName(full: string): { first: string | null; last: string | null } {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 0) return { first: null, last: null };
  if (parts.length === 1) return { first: parts[0] ?? null, last: null };
  return { first: parts[0] ?? null, last: parts.slice(1).join(" ") };
}

function stubOutcome(maxLeads: number, params: Record<string, unknown>): ScrapeOutcome {
  const target = (params as any)?.input?.searchString ?? "demo niche";
  const N = Math.min(maxLeads, 5);
  const fetched: RawScrapedLead[] = Array.from({ length: N }, (_, i) => ({
    external_id: `apify-stub-${i + 1}`,
    email: `contact${i + 1}@${slug(target)}.example`,
    first_name: ["Sarah", "David", "Lin", "Marcus", "Zoe"][i % 5] ?? "Stub",
    last_name: ["Lopez", "Park", "Wei", "Hall", "Brooks"][i % 5] ?? "Lead",
    company_name: `${cap(target)} Co ${i + 1}`,
    domain: `${slug(target)}-${i + 1}.example`,
    linkedin_url: `https://linkedin.com/in/${slug(target)}-${i + 1}`,
    phone: null,
    title: ["Owner", "Founder", "CEO", "Operations Lead", "Marketing Director"][i % 5] ?? null,
    location: ["Naples, FL", "Bonita Springs, FL", "Fort Myers, FL", "Estero, FL", "Marco Island, FL"][i % 5] ?? null,
    industry: cap(String(target)),
    source: "apify",
    raw: { stub: true, note: "APIFY token not configured." },
  }));
  return { fetched, is_stub: true };
}

function slug(s: string): string {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "demo";
}
function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

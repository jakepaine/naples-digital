// Chain runner — executes a single enrichment_input through the
// configured priority list and returns the winning result plus the
// per-source detail array that gets persisted to enrichment_results.
//
// Algorithm:
//   1. Iterate sources in priority order.
//   2. Skip sources whose required input shape isn't met (e.g. Hunter
//      needs a domain).
//   3. Call source.enrich(); record the result.
//   4. If the result's confidence >= job.confidence_threshold AND the
//      email looks valid, short-circuit and return that as the winner.
//   5. After Apify-LinkedIn discovers a domain, RE-RUN the higher-priority
//      sources with that domain enriched into the input — this is the
//      classic "LinkedIn-only lead" recovery path Nick teaches.
//   6. If no source clears threshold, return the highest-confidence valid
//      email anyway, but flag status='low_confidence'.
//   7. If no source returned an email at all, status='no_match'.

import {
  EnrichmentInput,
  EnrichmentResult,
  EnrichmentSourceKey,
  emailLooksValid,
} from "./sources/types";
import { SOURCES, ALL_SOURCE_KEYS } from "./sources";

export interface ChainOutcome {
  status: "enriched" | "low_confidence" | "no_match";
  resolved_email: string | null;
  resolved_confidence: number | null;
  resolved_source: EnrichmentSourceKey | null;
  /** Every source attempted, in execution order. */
  results: EnrichmentResult[];
  /** Notes the chain wants to surface (catch-all flag, role-based flag, etc.). */
  notes: string[];
}

export interface ChainContext {
  /** Per-source API key map (already resolved from Vault). null = stub mode. */
  apiKeys: Partial<Record<EnrichmentSourceKey, string | null>>;
  priority: EnrichmentSourceKey[];
  threshold: number;
  /** Tenant invoking the chain — threaded down to sources that report usage. */
  tenantId?: string;
}

export async function runChain(
  rawInput: EnrichmentInput,
  ctx: ChainContext,
): Promise<ChainOutcome> {
  const priority = sanitizePriority(ctx.priority);
  let working: EnrichmentInput = { ...rawInput };
  const results: EnrichmentResult[] = [];
  const notes: string[] = [];

  // First pass — original priority order.
  for (const key of priority) {
    const source = SOURCES[key];
    const result = await source.enrich({
      apiKey: ctx.apiKeys[key] ?? null,
      input: working,
      tenantId: ctx.tenantId,
    });
    results.push(result);

    // If LinkedIn discovered a domain we didn't have, fold it into `working`
    // so subsequent sources benefit (this also enables a second pass below).
    const discovered =
      (result.raw as any)?.discovered_domain ??
      (result.raw as any)?.profile?.contact_info?.websites?.[0]?.url ??
      null;
    if (!working.domain && discovered) {
      const dom = typeof discovered === "string" ? discovered.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] : null;
      if (dom) {
        working = { ...working, domain: dom };
        notes.push(`apify_linkedin discovered domain ${dom}`);
      }
    }

    if (
      result.email &&
      emailLooksValid(result.email) &&
      result.confidence >= ctx.threshold
    ) {
      if (result.is_role_based) notes.push(`role-based local-part — review before send`);
      if (result.verification_status === "catch_all") {
        notes.push("catch-all domain — bounce risk elevated");
      }
      return {
        status: "enriched",
        resolved_email: result.email,
        resolved_confidence: result.confidence,
        resolved_source: key,
        results,
        notes,
      };
    }
  }

  // Recovery pass: if Apify-LinkedIn discovered a domain that the previous
  // sources lacked, retry the email-discovery sources with the new domain.
  const linkedinIdx = priority.indexOf("apify_linkedin");
  const initialHadDomain = !!rawInput.domain;
  if (!initialHadDomain && working.domain && linkedinIdx >= 0) {
    for (const key of priority) {
      if (key === "apify_linkedin") continue;
      // Skip if we already nailed it (couldn't have, given control flow)
      const source = SOURCES[key];
      const result = await source.enrich({
        apiKey: ctx.apiKeys[key] ?? null,
        input: working,
        tenantId: ctx.tenantId,
      });
      results.push(result);
      if (
        result.email &&
        emailLooksValid(result.email) &&
        result.confidence >= ctx.threshold
      ) {
        if (result.is_role_based) notes.push(`role-based local-part — review before send`);
        if (result.verification_status === "catch_all") {
          notes.push("catch-all domain — bounce risk elevated");
        }
        notes.push("enriched on recovery pass after LinkedIn-discovered domain");
        return {
          status: "enriched",
          resolved_email: result.email,
          resolved_confidence: result.confidence,
          resolved_source: key,
          results,
          notes,
        };
      }
    }
  }

  // Pick the best partial result.
  const best = pickBestResult(results);
  if (best && best.email) {
    return {
      status: "low_confidence",
      resolved_email: best.email,
      resolved_confidence: best.confidence,
      resolved_source: best.source,
      results,
      notes: [
        ...notes,
        `best confidence ${best.confidence} below threshold ${ctx.threshold}`,
      ],
    };
  }

  return {
    status: "no_match",
    resolved_email: null,
    resolved_confidence: null,
    resolved_source: null,
    results,
    notes: [...notes, "no source returned a valid email"],
  };
}

function sanitizePriority(
  priority: EnrichmentSourceKey[] | undefined | null,
): EnrichmentSourceKey[] {
  if (!priority || priority.length === 0) return [...ALL_SOURCE_KEYS];
  const seen = new Set<EnrichmentSourceKey>();
  const out: EnrichmentSourceKey[] = [];
  for (const key of priority) {
    if (key in SOURCES && !seen.has(key)) {
      seen.add(key);
      out.push(key);
    }
  }
  // Tail-fill any sources that weren't in the priority list — never
  // silently drop a configured source.
  for (const key of ALL_SOURCE_KEYS) {
    if (!seen.has(key)) out.push(key);
  }
  return out;
}

function pickBestResult(results: EnrichmentResult[]): EnrichmentResult | null {
  let best: EnrichmentResult | null = null;
  for (const r of results) {
    if (!r.email || !emailLooksValid(r.email)) continue;
    if (!best || r.confidence > best.confidence) best = r;
  }
  return best;
}

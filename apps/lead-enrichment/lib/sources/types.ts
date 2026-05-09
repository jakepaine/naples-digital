// Source-adapter contract for the enrichment chain.
//
// Every source — Apollo, AnyMailFinder, Hunter, Apify-LinkedIn — implements
// `enrich(input)` and returns the same shape so the chain runner can
// consume them interchangeably.
//
// Sources MUST gracefully fall through to stub mode when the per-tenant
// secret is missing, so a tenant can preview the module before paying
// for any vendor account. The dashboard surfaces "stub" vs "live" so
// nobody is surprised by placeholder data in production.

export type EnrichmentSourceKey =
  | "apollo"
  | "anymailfinder"
  | "hunter"
  | "apify_linkedin";

export interface EnrichmentInput {
  /** Domain (e.g. "acme.com"). Often the most reliable starting point. */
  domain?: string | null;
  /** Public LinkedIn URL of the contact. */
  linkedin_url?: string | null;
  /** Already-known email — sources can verify rather than discover. */
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  company_name?: string | null;
  /** Optional title hint — sources that support title-targeted lookup use this. */
  title?: string | null;
}

export type VerificationStatus =
  | "valid"
  | "catch_all"
  | "accept_all"
  | "invalid"
  | "unknown";

export interface EnrichmentResult {
  source: EnrichmentSourceKey;
  email: string | null;
  /** 0-100 confidence score. Sources without a native score map to: 90 verified, 60 probable, 30 guess. */
  confidence: number;
  verification_status: VerificationStatus;
  /** Indicator that the inbox is a generic "info@" / "hello@" address — usually skip in cold outreach. */
  is_role_based: boolean;
  raw: Record<string, unknown>;
  http_status?: number;
  error_message?: string;
  duration_ms: number;
  /** True when we returned synthetic data because no API key was configured. */
  is_stub?: boolean;
}

export interface EnrichmentSource {
  key: EnrichmentSourceKey;
  displayName: string;
  /** True when at least one tenant key path is configured. */
  isConfigured(args: { apiKey?: string | null }): boolean;
  /**
   * Run a single enrichment lookup. Implementations MUST not throw — return
   * a result with error_message instead so the chain can record the
   * failure and continue to the next source.
   */
  enrich(args: {
    apiKey?: string | null;
    input: EnrichmentInput;
  }): Promise<EnrichmentResult>;
}

const ROLE_BASED_LOCALS = new Set([
  "info",
  "hello",
  "contact",
  "team",
  "support",
  "admin",
  "office",
  "sales",
  "billing",
  "noreply",
  "no-reply",
  "press",
  "media",
]);

export function isRoleBased(email: string | null | undefined): boolean {
  if (!email) return false;
  const local = email.split("@")[0]?.toLowerCase() ?? "";
  return ROLE_BASED_LOCALS.has(local);
}

export function emailLooksValid(email: string | null | undefined): boolean {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export function pickConfidenceFromVerification(
  status: VerificationStatus,
  fallback = 50,
): number {
  switch (status) {
    case "valid":
      return 90;
    case "accept_all":
      return 70;
    case "catch_all":
      return 55;
    case "invalid":
      return 5;
    case "unknown":
    default:
      return fallback;
  }
}

// Source registry — single import point for the chain runner.

import { apolloSource } from "./apollo";
import { anymailfinderSource } from "./anymailfinder";
import { hunterSource } from "./hunter";
import { apifyLinkedinSource } from "./apify-linkedin";
import { EnrichmentSource, EnrichmentSourceKey } from "./types";

export const SOURCES: Record<EnrichmentSourceKey, EnrichmentSource> = {
  apollo: apolloSource,
  anymailfinder: anymailfinderSource,
  hunter: hunterSource,
  apify_linkedin: apifyLinkedinSource,
};

export const ALL_SOURCE_KEYS: EnrichmentSourceKey[] = [
  "apollo",
  "anymailfinder",
  "hunter",
  "apify_linkedin",
];

/** Map source key → tenant_integrations.kind (the Vault vendor name). */
export const SOURCE_VAULT_KIND: Record<EnrichmentSourceKey, string> = {
  apollo: "apollo",
  anymailfinder: "anymailfinder",
  hunter: "hunter",
  apify_linkedin: "apify",
};

export * from "./types";

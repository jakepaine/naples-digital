import { apifySource } from "./apify";
import { apolloSource } from "./apollo";
import { phantombusterSource } from "./phantombuster";
import { vayneSource } from "./vayne";
import { ScrapeSource, ScrapeSourceKey } from "./types";

export const SOURCES: Record<ScrapeSourceKey, ScrapeSource> = {
  apify: apifySource,
  apollo: apolloSource,
  phantombuster: phantombusterSource,
  vayne: vayneSource,
};

export const ALL_SOURCE_KEYS: ScrapeSourceKey[] = [
  "apify",
  "apollo",
  "phantombuster",
  "vayne",
];

/** Vault kind per source — same name as the key in this module. */
export const SOURCE_VAULT_KIND: Record<ScrapeSourceKey, string> = {
  apify: "apify",
  apollo: "apollo",
  phantombuster: "phantombuster",
  vayne: "vayne",
};

export * from "./types";

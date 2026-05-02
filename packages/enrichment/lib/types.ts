export type EnrichedPerson = {
  name?: string;
  email?: string;
  title?: string;
  company?: string;
  domain?: string;
  linkedin_url?: string;
  twitter_url?: string;
  phone?: string;
  location?: string;
  raw: Record<string, unknown>;
};

export type EnrichmentSource = "apollo" | "clay" | "hunter";

export interface EnrichmentVendor {
  readonly source: EnrichmentSource;
  lookupByEmail(email: string): Promise<EnrichedPerson | null>;
  lookupByDomain(domain: string): Promise<EnrichedPerson | null>;
}

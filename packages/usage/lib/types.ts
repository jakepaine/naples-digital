// Vendors tracked for centralized usage billing. Free-text in the DB
// but constrained at the type layer so the cron + dashboard stay in sync.
export type UsageVendor = "anthropic" | "apify" | "assemblyai" | "resend";

export type UsageSnapshot = {
  tenant_id: string;
  vendor: UsageVendor;
  period_start: string;  // ISO timestamp, inclusive
  period_end: string;    // ISO timestamp, exclusive
  units: number;
  unit_label: string;    // "tokens", "compute_units", "minutes", "emails"
  cost_usd: number;
  raw_payload: Record<string, unknown>;
};

export type UsageWindow = {
  // Inclusive UTC start of the window.
  start: Date;
  // Exclusive UTC end of the window.
  end: Date;
};

// One adapter per vendor. Implementations skip gracefully (return null)
// when required credentials are missing — the cron just won't record a
// snapshot for that vendor on that day.
export interface UsageAdapter {
  readonly vendor: UsageVendor;
  fetchUsage(tenantId: string, window: UsageWindow): Promise<UsageSnapshot | null>;
}

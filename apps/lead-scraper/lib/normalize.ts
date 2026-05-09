// Lead canonicalization — stable dedupe key + light filtering for the
// run handler.

import type { RawScrapedLead } from "./sources/types";

/**
 * Canonical key for outreach_leads dedupe. Email-only when present
 * (case-folded local + domain), otherwise we fall back to LinkedIn URL,
 * otherwise composite domain + name.
 */
export function dedupeKey(lead: RawScrapedLead): string | null {
  if (lead.email) {
    const e = lead.email.trim().toLowerCase();
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) ? `email:${e}` : null;
  }
  if (lead.linkedin_url) {
    const url = lead.linkedin_url.trim().toLowerCase().replace(/\/$/, "");
    return `li:${url}`;
  }
  if (lead.domain) {
    const dom = lead.domain.trim().toLowerCase();
    const last = lead.last_name?.trim().toLowerCase() ?? "";
    if (last) return `name+dom:${last}@${dom}`;
  }
  return null;
}

/**
 * Apply tenant-specified filters before insert. Returns true to keep,
 * false to drop (and bump the run's filtered_count).
 */
export function passesFilters(
  lead: RawScrapedLead,
  filters: {
    target_titles?: string[] | null;
    target_locations?: string[] | null;
  },
): boolean {
  const titles = (filters.target_titles ?? []).filter((t) => t && t.length > 0);
  if (titles.length > 0) {
    const t = (lead.title ?? "").toLowerCase();
    const ok = titles.some((target) => t.includes(target.toLowerCase()));
    if (!ok) return false;
  }
  const locs = (filters.target_locations ?? []).filter((l) => l && l.length > 0);
  if (locs.length > 0) {
    const loc = (lead.location ?? "").toLowerCase();
    const ok = locs.some((target) => loc.includes(target.toLowerCase()));
    if (!ok) return false;
  }
  return true;
}

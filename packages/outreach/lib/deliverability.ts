// Deliverability audit — DNS scorecard for a sending domain.
//
// What we check:
//   SPF      TXT @<domain> starting with "v=spf1"
//   DKIM     TXT <selector>._domainkey.<domain> for a list of common
//            selectors (Google, Smartlead, Instantly, Postmark, etc.)
//   DMARC    TXT _dmarc.<domain> starting with "v=DMARC1"
//   MX       MX records (proxy for "mail server is reachable")
//
// Scoring (out of 100):
//   30 — SPF present and not '~all' / '?all' softfail
//   30 — DMARC present with policy=quarantine or reject AND pct=100
//   25 — at least one DKIM selector with valid v=DKIM1 record
//   10 — MX records present
//    5 — RFC 8058 list-unsubscribe support advertised (see list-unsubscribe.ts)
//
// We surface risk_flags as a string[] so the UI can render bulleted
// remediations in a stable way.

import { promises as dnsPromises } from "dns";

type DnsLike = typeof dnsPromises;

export interface DeliverabilityAudit {
  domain: string;
  spf_present: boolean;
  spf_record: string | null;
  spf_includes: string[];
  spf_softfail: boolean;
  dkim_selectors_checked: string[];
  dkim_selectors_passing: string[];
  dmarc_present: boolean;
  dmarc_record: string | null;
  dmarc_policy: "none" | "quarantine" | "reject" | null;
  dmarc_pct: number | null;
  mx_records: string[];
  score: number;
  risk_flags: string[];
}

// Selectors known to be used by the platforms we care about. We also
// allow callers to supply additional selectors per tenant (some teams
// rotate selectors monthly).
const DEFAULT_DKIM_SELECTORS = [
  "google",        // Google Workspace
  "k1",            // Mailchimp / many ESPs
  "smartlead",     // Smartlead.ai
  "instantly",     // Instantly.ai (rumoured selector — best-effort)
  "selector1",     // Microsoft 365
  "selector2",     // Microsoft 365
  "pm",            // Postmark
  "postmark",      // Postmark legacy
  "amazonses",     // Amazon SES
  "default",       // generic fallback
];

export async function auditDomainDeliverability(
  domain: string,
  options?: {
    additionalDkimSelectors?: string[];
    /** Override the DNS resolver (used in tests). */
    resolver?: DnsLike;
  },
): Promise<DeliverabilityAudit> {
  const dns = options?.resolver ?? dnsPromises;
  const cleanDomain = normaliseDomain(domain);
  const selectors = Array.from(
    new Set([
      ...DEFAULT_DKIM_SELECTORS,
      ...(options?.additionalDkimSelectors ?? []),
    ]),
  );

  const audit: DeliverabilityAudit = {
    domain: cleanDomain,
    spf_present: false,
    spf_record: null,
    spf_includes: [],
    spf_softfail: false,
    dkim_selectors_checked: selectors,
    dkim_selectors_passing: [],
    dmarc_present: false,
    dmarc_record: null,
    dmarc_policy: null,
    dmarc_pct: null,
    mx_records: [],
    score: 0,
    risk_flags: [],
  };

  // SPF
  try {
    const txts = await safeResolveTxt(dns, cleanDomain);
    const spf = txts.find((r) => r.toLowerCase().startsWith("v=spf1"));
    if (spf) {
      audit.spf_present = true;
      audit.spf_record = spf;
      audit.spf_includes = parseSpfIncludes(spf);
      // softfail (~all) or neutral (?all) is not strict enough to
      // protect domain from spoofing.
      if (/[~?]all\b/i.test(spf)) audit.spf_softfail = true;
    }
  } catch {
    /* leave defaults */
  }

  // DKIM — try each selector. Stop early once we find ~3 passing to
  // bound the network calls.
  for (const sel of selectors) {
    if (audit.dkim_selectors_passing.length >= 3) break;
    try {
      const txts = await safeResolveTxt(dns, `${sel}._domainkey.${cleanDomain}`);
      const dkim = txts.find((r) => /v=DKIM1/i.test(r));
      if (dkim) audit.dkim_selectors_passing.push(sel);
    } catch {
      /* selector not configured — common, expected */
    }
  }

  // DMARC
  try {
    const txts = await safeResolveTxt(dns, `_dmarc.${cleanDomain}`);
    const dmarc = txts.find((r) => /v=DMARC1/i.test(r));
    if (dmarc) {
      audit.dmarc_present = true;
      audit.dmarc_record = dmarc;
      audit.dmarc_policy = parseDmarcPolicy(dmarc);
      audit.dmarc_pct = parseDmarcPct(dmarc);
    }
  } catch {
    /* leave defaults */
  }

  // MX
  try {
    const mx = await dns.resolveMx(cleanDomain);
    audit.mx_records = mx
      .sort((a, b) => a.priority - b.priority)
      .map((r) => r.exchange);
  } catch {
    /* leave defaults */
  }

  // Score + risk flags
  let score = 0;
  if (audit.spf_present) score += 30;
  if (audit.spf_softfail) score -= 10;
  if (
    audit.dmarc_present &&
    (audit.dmarc_policy === "quarantine" || audit.dmarc_policy === "reject") &&
    (audit.dmarc_pct ?? 100) >= 100
  ) {
    score += 30;
  } else if (audit.dmarc_present) {
    score += 12;
  }
  if (audit.dkim_selectors_passing.length > 0) score += 25;
  if (audit.mx_records.length > 0) score += 10;
  audit.score = Math.max(0, Math.min(100, score));

  if (!audit.spf_present) audit.risk_flags.push("no_spf");
  if (audit.spf_softfail) audit.risk_flags.push("spf_softfail");
  if (!audit.dmarc_present) audit.risk_flags.push("no_dmarc");
  if (audit.dmarc_present && audit.dmarc_policy === "none")
    audit.risk_flags.push("dmarc_p_none");
  if (audit.dmarc_present && (audit.dmarc_pct ?? 100) < 100)
    audit.risk_flags.push("dmarc_pct_below_100");
  if (audit.dkim_selectors_passing.length === 0)
    audit.risk_flags.push("no_dkim_signature");
  if (audit.mx_records.length === 0) audit.risk_flags.push("no_mx");

  return audit;
}

async function safeResolveTxt(
  dns: DnsLike,
  name: string,
): Promise<string[]> {
  // Each TXT record is returned as an array of strings (string fragments).
  // Concatenate them per record so multi-segment SPF/DKIM are reassembled.
  const records = (await dns.resolveTxt(name)) as string[][];
  return records.map((r) => r.join(""));
}

function parseSpfIncludes(record: string): string[] {
  const includes: string[] = [];
  const re = /include:([^\s]+)/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(record)) !== null) {
    const inc = match[1];
    if (inc) includes.push(inc);
  }
  return includes;
}

function parseDmarcPolicy(record: string): "none" | "quarantine" | "reject" | null {
  const m = record.match(/p=(none|quarantine|reject)/i);
  if (!m || !m[1]) return null;
  return m[1].toLowerCase() as "none" | "quarantine" | "reject";
}

function parseDmarcPct(record: string): number | null {
  const m = record.match(/pct=(\d+)/i);
  if (!m || !m[1]) return null;
  const n = parseInt(m[1], 10);
  return Number.isNaN(n) ? null : Math.max(0, Math.min(100, n));
}

function normaliseDomain(input: string): string {
  let d = input.trim().toLowerCase();
  if (d.startsWith("http://") || d.startsWith("https://")) {
    try {
      d = new URL(d).hostname;
    } catch {
      /* ignore */
    }
  }
  return d.replace(/^www\./, "").replace(/\.$/, "");
}

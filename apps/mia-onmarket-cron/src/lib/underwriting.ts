// Pure-math auto-underwriting. No external API calls. Deterministic.
//
// Inputs: a deal (units, price, year, advertised cap/NOI), a tenant's criteria
// (cap-rate floor, max LTV, hold period, market filters), optional rent comps.
// Outputs: cap_rate_actual, NOI estimate, DSCR, value-add upside, qualifying
// boolean, score (for sort order), and a human-readable summary string for
// the email body.
//
// Methodology (intentionally simple — agency tooling, not a CMBS model):
// - If broker provides NOI: cap_rate_actual = NOI / price.
// - Else estimate NOI as 50% of effective gross income (industry rule of
//   thumb for stabilized garden-style multifamily). EGI is estimated as
//   units × avg_rent_comp × 12 × 0.95 (5% vacancy assumption).
// - DSCR_at_market: NOI / annual_debt_service, where debt is at max LTV and
//   the assumed market rate (input parameter, default 6.5% interest, 30y am).
// - Value-add upside: if rent_comps_avg > in_place_rent, the spread × units
//   × 12 / cap_rate_floor. Floor at 0.

import type { ReDealCriteria } from "@naples/db";

const MODEL_VERSION = "v1.0-2026-05-06";

export type DealForUnderwrite = {
  units: number | null;
  year_built: number | null;
  asking_price: number | null;
  noi_advertised: number | null;
  cap_rate_advertised: number | null;
  city: string | null;
  state: string | null;
};

export type RentComp = {
  rent_per_unit_per_month: number;
  source: string; // 'apartments_dot_com' | 'manual' | etc.
};

export type UnderwriteInputs = {
  market_rate: number; // annual interest rate decimal (e.g. 0.065)
  amortization_years: number; // e.g. 30
  expense_ratio: number; // 0..1; default 0.50 for stabilized garden-style
  vacancy_assumption: number; // 0..1; default 0.05
  rent_comps?: RentComp[];
  in_place_rent_per_unit_per_month?: number;
};

export type UnderwriteOutput = {
  model_version: string;
  inputs: Record<string, unknown>;
  cap_rate_actual: number | null;
  noi_estimated: number | null;
  dscr_at_market: number | null;
  value_add_upside: number | null;
  target_irr: number | null;
  qualifying: boolean;
  reasons: string[]; // why qualifying / why not
  summary: string;
  score: number; // higher = better; 0 if disqualified
};

const DEFAULT_INPUTS: UnderwriteInputs = {
  market_rate: 0.065,
  amortization_years: 30,
  expense_ratio: 0.5,
  vacancy_assumption: 0.05,
};

export function underwrite(
  deal: DealForUnderwrite,
  criteria: ReDealCriteria,
  inputs: Partial<UnderwriteInputs> = {}
): UnderwriteOutput {
  const inp: UnderwriteInputs = { ...DEFAULT_INPUTS, ...inputs };
  const reasons: string[] = [];
  let qualifying = true;

  // Hard filter: matching market
  const matchedMarket = criteria.markets.find((m) => {
    if (!deal.state || !m.states.includes(deal.state)) return false;
    if (!deal.city) return false;
    return m.cities.some((c) => c.toLowerCase() === deal.city!.toLowerCase());
  });
  if (!matchedMarket) {
    qualifying = false;
    reasons.push(`Outside MIA target markets (${criteria.markets.map((m) => m.metro).join(" / ")})`);
  }

  // Hard filter: unit count
  if (matchedMarket && deal.units) {
    if (deal.units < matchedMarket.units_min || deal.units > matchedMarket.units_max) {
      qualifying = false;
      reasons.push(`${deal.units} units outside ${matchedMarket.units_min}–${matchedMarket.units_max} range`);
    }
  } else if (!deal.units) {
    qualifying = false;
    reasons.push("Unit count missing from listing");
  }

  // Hard filter: vintage
  if (matchedMarket && deal.year_built && deal.year_built < matchedMarket.vintage_min_year) {
    qualifying = false;
    reasons.push(`Built ${deal.year_built}, before ${matchedMarket.vintage_min_year} cutoff`);
  }

  // Hard filter: deal size ceiling
  if (matchedMarket && deal.asking_price && deal.asking_price > matchedMarket.max_deal_size_usd) {
    qualifying = false;
    reasons.push(`Ask $${(deal.asking_price / 1_000_000).toFixed(1)}M > $${(matchedMarket.max_deal_size_usd / 1_000_000).toFixed(0)}M ceiling`);
  }

  // Compute cap rate (broker-provided NOI takes precedence)
  let noi: number | null = null;
  let capRate: number | null = null;
  if (deal.noi_advertised && deal.asking_price) {
    noi = deal.noi_advertised;
    capRate = (noi / deal.asking_price) * 100;
  } else if (deal.cap_rate_advertised && deal.asking_price) {
    capRate = deal.cap_rate_advertised;
    noi = (deal.cap_rate_advertised / 100) * deal.asking_price;
  } else if (deal.units && inp.rent_comps?.length) {
    // Estimate NOI from rent comps
    const avgRent = inp.rent_comps.reduce((s, r) => s + r.rent_per_unit_per_month, 0) / inp.rent_comps.length;
    const egi = deal.units * avgRent * 12 * (1 - inp.vacancy_assumption);
    noi = egi * (1 - inp.expense_ratio);
    if (deal.asking_price) capRate = (noi / deal.asking_price) * 100;
  }

  // Soft filter: cap rate floor
  if (capRate !== null && capRate < criteria.target_cap_rate_min) {
    qualifying = false;
    reasons.push(`Cap rate ${capRate.toFixed(2)}% < ${criteria.target_cap_rate_min}% floor`);
  }

  // DSCR at the assumed market financing
  let dscr: number | null = null;
  if (noi && deal.asking_price) {
    const loan = deal.asking_price * criteria.max_ltv;
    const monthlyRate = inp.market_rate / 12;
    const n = inp.amortization_years * 12;
    // Standard amortizing payment
    const monthlyPayment = (loan * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -n));
    const annualDS = monthlyPayment * 12;
    if (annualDS > 0) dscr = noi / annualDS;
  }

  // Value-add upside (rough): rent spread × units × 12 / target cap, only if rent comps
  let valueAdd: number | null = null;
  if (
    inp.rent_comps?.length &&
    inp.in_place_rent_per_unit_per_month &&
    deal.units &&
    criteria.value_add_appetite
  ) {
    const compAvg = inp.rent_comps.reduce((s, r) => s + r.rent_per_unit_per_month, 0) / inp.rent_comps.length;
    const spread = compAvg - inp.in_place_rent_per_unit_per_month;
    if (spread > 0) {
      valueAdd = (spread * deal.units * 12) / (criteria.target_cap_rate_min / 100);
    }
  }

  if (qualifying && reasons.length === 0) reasons.push("Passes hard filters and cap rate floor.");

  const summary = formatSummary(deal, criteria, { capRate, noi, dscr, valueAdd, qualifying, reasons, matchedMarket });

  // Score: bias toward higher cap rate, higher DSCR, higher value-add
  let score = 0;
  if (qualifying) {
    score += capRate ? Math.max(0, capRate - criteria.target_cap_rate_min) * 10 : 0;
    score += dscr ? Math.max(0, (dscr - 1.2)) * 20 : 0; // bonus over 1.2 DSCR
    score += valueAdd ? Math.min(50, valueAdd / 200_000) : 0; // cap to avoid runaway
  }

  return {
    model_version: MODEL_VERSION,
    inputs: { ...inp, criteria_used: criteria.target_cap_rate_min, matched_metro: matchedMarket?.metro },
    cap_rate_actual: capRate,
    noi_estimated: noi,
    dscr_at_market: dscr,
    value_add_upside: valueAdd,
    target_irr: null, // not computed in v1
    qualifying,
    reasons,
    summary,
    score,
  };
}

function formatSummary(
  deal: DealForUnderwrite,
  criteria: ReDealCriteria,
  res: {
    capRate: number | null;
    noi: number | null;
    dscr: number | null;
    valueAdd: number | null;
    qualifying: boolean;
    reasons: string[];
    matchedMarket: ReDealCriteria["markets"][number] | undefined;
  }
): string {
  const lines: string[] = [];
  const verdict = res.qualifying ? "✓ QUALIFIES" : "✗ Does not qualify";
  lines.push(`${verdict} for MIA's ${res.matchedMarket?.metro ?? "DFW/Houston"} criteria.`);
  lines.push("");
  if (deal.units) lines.push(`Units: ${deal.units}` + (deal.year_built ? ` · built ${deal.year_built}` : ""));
  if (deal.asking_price) {
    lines.push(`Ask: $${(deal.asking_price / 1_000_000).toFixed(2)}M` +
      (deal.units ? ` ($${Math.round(deal.asking_price / deal.units / 1000)}k/unit)` : ""));
  }
  if (res.capRate !== null) lines.push(`Cap rate: ${res.capRate.toFixed(2)}% (floor ${criteria.target_cap_rate_min}%)`);
  if (res.noi !== null) lines.push(`NOI estimated: $${Math.round(res.noi).toLocaleString()}`);
  if (res.dscr !== null) lines.push(`DSCR @ ${(criteria.max_ltv * 100).toFixed(0)}% LTV / 6.5%: ${res.dscr.toFixed(2)}`);
  if (res.valueAdd !== null) lines.push(`Value-add upside (rent spread): ~$${(res.valueAdd / 1_000_000).toFixed(2)}M`);
  lines.push("");
  lines.push("Reasoning:");
  res.reasons.forEach((r) => lines.push(`  • ${r}`));
  return lines.join("\n");
}

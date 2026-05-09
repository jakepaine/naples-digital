// Module + tier registry for the Naples Digital SaaS platform.
// Each module corresponds to a feature area (usually backed by one or more apps in the monorepo).
// Each tier bundles a default module set; add-ons are à la carte modules enabled above tier.

export type ModuleKey =
  | "dashboard"
  | "booking"
  | "crm"
  | "outreach"
  | "content"
  | "sponsor_pitch"
  | "sponsor_analytics"
  | "backlog"
  | "client_portal"
  | "mia"
  | "email_triage"
  | "content_syndication"
  | "lead_won_invoice"
  | "proposal_generator"
  | "competitor_spy"
  | "lead_enrichment";

export type ModuleCategory = "ops" | "sales" | "content" | "vertical";

export type ModuleDef = {
  key: ModuleKey;
  name: string;
  description: string;
  category: ModuleCategory;
  app: string;
  addonMonthly: number;
};

export const MODULES: Record<ModuleKey, ModuleDef> = {
  dashboard: {
    key: "dashboard",
    name: "Operations Dashboard",
    description: "Cross-business KPIs, MRR, social growth, projections.",
    category: "ops",
    app: "dashboard",
    addonMonthly: 200,
  },
  booking: {
    key: "booking",
    name: "Booking Portal",
    description: "Multi-step booking wizard with package selection + auto-contract.",
    category: "ops",
    app: "booking-portal",
    addonMonthly: 150,
  },
  crm: {
    key: "crm",
    name: "CRM Pipeline",
    description: "Drag-and-drop kanban with AI lead intelligence and angle generation.",
    category: "sales",
    app: "crm-pipeline",
    addonMonthly: 250,
  },
  outreach: {
    key: "outreach",
    name: "Cold Outreach",
    description: "AI-generated 3-email cold sequences with Instantly/Smartlead delivery.",
    category: "sales",
    app: "outreach-demo",
    addonMonthly: 350,
  },
  content: {
    key: "content",
    name: "Content Pipeline",
    description: "Episode intake → AssemblyAI transcription → AI clip picks → 9:16 render with karaoke captions.",
    category: "content",
    app: "content-pipeline",
    addonMonthly: 500,
  },
  sponsor_pitch: {
    key: "sponsor_pitch",
    name: "Sponsor Pitch Builder",
    description: "AI one-pager builder — paste a sponsor name, get a tailored deck in 30s.",
    category: "sales",
    app: "sponsor-pitch",
    addonMonthly: 200,
  },
  sponsor_analytics: {
    key: "sponsor_analytics",
    name: "Sponsor Analytics",
    description: "Per-sponsor magic-link reporting portal — impressions, mentions, clip plays.",
    category: "sales",
    app: "sponsor-analytics",
    addonMonthly: 150,
  },
  backlog: {
    key: "backlog",
    name: "Backlog Tracker",
    description: "Per-tenant project backlog with AI-suggested next steps. Replaces ClickUp.",
    category: "ops",
    app: "backlog",
    addonMonthly: 100,
  },
  client_portal: {
    key: "client_portal",
    name: "Client Portal",
    description: "Branded client-facing portal for asset uploads + delivery.",
    category: "content",
    app: "client-portal",
    addonMonthly: 100,
  },
  mia: {
    key: "mia",
    name: "Real Estate Acquisitions",
    description: "On-market deal monitor + auto-underwriting + off-market owner skiptrace + investor CRM.",
    category: "vertical",
    app: "mia",
    addonMonthly: 1500,
  },
  email_triage: {
    key: "email_triage",
    name: "Email Triage",
    description: "AI-classified inbox. Routes inbound mail into priority lanes per tenant. Optional auto-replies.",
    category: "ops",
    app: "email-triage",
    addonMonthly: 150,
  },
  content_syndication: {
    key: "content_syndication",
    name: "Content Syndication",
    description: "One post in, five platforms out. Per-tenant credentials, per-platform tone (Twitter/LinkedIn/IG/FB/Medium).",
    category: "content",
    app: "content-syndication",
    addonMonthly: 200,
  },
  lead_won_invoice: {
    key: "lead_won_invoice",
    name: "Lead Won → Invoice",
    description: "When a CRM lead closes, draft the invoice + Stripe payment link automatically. Onboarding kicks off on payment.",
    category: "sales",
    app: "lead-won-invoice",
    addonMonthly: 150,
  },
  proposal_generator: {
    key: "proposal_generator",
    name: "Proposal Generator",
    description: "AI-drafted client proposals from CRM leads. Approve once, mint a hosted public URL, customer accepts or rejects in-page.",
    category: "sales",
    app: "proposal-generator",
    addonMonthly: 200,
  },
  competitor_spy: {
    key: "competitor_spy",
    name: "Competitor Ad Spy",
    description: "Track competitor Meta ads via Apify. Claude tags each ad's angle/hook/offer so you see what's working in your niche.",
    category: "content",
    app: "competitor-spy",
    addonMonthly: 250,
  },
  lead_enrichment: {
    key: "lead_enrichment",
    name: "Lead Enrichment",
    description: "Multi-source enrichment chain (Apollo → AnyMailFinder → Hunter → Apify) with quality scoring. Turns LinkedIn URLs / domains into verified emails plus AI icebreakers, ready to push into Cold Outreach.",
    category: "sales",
    app: "lead-enrichment",
    addonMonthly: 350,
  },
};

export type Tier = "starter" | "growth" | "premium" | "design_partner" | "enterprise";

export type TierDef = {
  key: Tier;
  name: string;
  monthlyPrice: number; // 0 = custom-priced
  setupFee: number;
  modules: ModuleKey[];
  description: string;
  isCustom: boolean;
};

export const TIERS: Record<Tier, TierDef> = {
  starter: {
    key: "starter",
    name: "Starter",
    monthlyPrice: 497,
    setupFee: 1500,
    modules: ["crm", "booking", "backlog"],
    description: "Solo operator getting organized. Sales pipeline + booking wizard + project tracker.",
    isCustom: false,
  },
  growth: {
    key: "growth",
    name: "Growth",
    monthlyPrice: 997,
    setupFee: 2500,
    modules: ["crm", "booking", "backlog", "outreach", "content", "sponsor_pitch"],
    description: "Active business doing sales + content. Adds outreach automation, podcast pipeline, sponsor decks.",
    isCustom: false,
  },
  premium: {
    key: "premium",
    name: "Premium",
    monthlyPrice: 1997,
    setupFee: 5000,
    modules: ["dashboard", "crm", "booking", "backlog", "outreach", "content", "sponsor_pitch", "sponsor_analytics", "client_portal"],
    description: "Established business across multiple channels. Full ops dashboard, sponsor analytics, branded client portal.",
    isCustom: false,
  },
  design_partner: {
    key: "design_partner",
    name: "Design Partner",
    monthlyPrice: 750,
    setupFee: 5000,
    modules: ["dashboard", "crm", "booking", "backlog", "outreach", "content", "sponsor_pitch", "sponsor_analytics", "client_portal"],
    description: "Premium feature set at half price. 12-month commitment in exchange for case study + roadmap input. Available to first 3 paying tenants only.",
    isCustom: false,
  },
  enterprise: {
    key: "enterprise",
    name: "Enterprise",
    monthlyPrice: 0,
    setupFee: 0,
    modules: [],
    description: "Custom-priced. Bespoke modules built into your tenant. Vertical-specific (real estate, fitness, etc.).",
    isCustom: true,
  },
};

export function modulesForTier(tier: Tier): ModuleKey[] {
  return TIERS[tier].modules;
}

export function isModuleEnabled(
  enabled_modules: string[] | null | undefined,
  key: ModuleKey
): boolean {
  if (!enabled_modules) return false;
  return enabled_modules.includes(key);
}

export function moduleCategoryLabel(category: ModuleCategory): string {
  if (category === "ops") return "Operations";
  if (category === "sales") return "Sales & Outreach";
  if (category === "content") return "Content";
  return "Vertical-specific";
}

export function tierColor(tier: Tier): string {
  if (tier === "starter") return "muted";
  if (tier === "growth") return "violet";
  if (tier === "premium") return "gold";
  if (tier === "design_partner") return "emerald";
  return "rose"; // enterprise
}

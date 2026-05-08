import type { Config } from "tailwindcss";

// Naples Digital — Stripe-inspired brand preset.
// White/off-white surface stack + deep-navy contrast sections + gold accent +
// 4-color hero gradient (warm tones replacing Stripe's purple/blue).
// Keeps the existing token names (gold/cream/bg/card/card-border) so the
// shared @naples/ui components render in either Naples Digital or 239 Live.

export const NAPLES_COLORS = {
  // Surface stack (Stripe-style off-white shifts)
  bg: "#FFFFFF",
  bgDeep: "#F6F9FC",          // subtle section alt (was #F5F5F2)
  bgSoft: "#FAFBFD",          // very subtle alt
  card: "#FFFFFF",            // cards on white now
  cardSoft: "#F6F9FC",
  cardBorder: "#E3E8EE",      // Stripe's signature soft border (was #E5E2D8)
  cardBorderStrong: "#C1C9D2",

  // Dark contrast sections (Stripe's #0A2540 → Naples espresso)
  ink: "#0A1A2F",             // deep near-navy/black for inverted sections
  inkDeep: "#06121F",         // even deeper for section transitions

  // Brand accent — refined gold
  gold: "#B8893E",
  goldDim: "#8E6A2D",
  goldBright: "#D4A45C",      // hover/highlight

  // Text
  cream: "#0A1A2F",           // headings (was near-black)
  body: "#425466",            // Stripe-style slate body text
  muted: "#697386",           // secondary text
  faint: "#8792A2",           // tertiary

  // Naples hero gradient — 4 warm tones (replaces Stripe's magenta/cyan/azure/mint)
  gradAmber: "#FFD27D",
  gradGold: "#B8893E",
  gradBronze: "#7A4E1F",
  gradCream: "#FFE9C7",

  // Semantic accents
  emerald: "#3F9E6B",
  rose: "#C25E5E",
  sapphire: "#4F7DB8",
  amber: "#D9A03B",
  violet: "#635BFF",          // Stripe-indigo (Naples uses sparingly)
} as const;

const preset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        bg: NAPLES_COLORS.bg,
        "bg-deep": NAPLES_COLORS.bgDeep,
        "bg-soft": NAPLES_COLORS.bgSoft,
        card: NAPLES_COLORS.card,
        "card-soft": NAPLES_COLORS.cardSoft,
        "card-border": NAPLES_COLORS.cardBorder,
        "card-border-strong": NAPLES_COLORS.cardBorderStrong,
        ink: NAPLES_COLORS.ink,
        "ink-deep": NAPLES_COLORS.inkDeep,
        gold: NAPLES_COLORS.gold,
        "gold-dim": NAPLES_COLORS.goldDim,
        "gold-bright": NAPLES_COLORS.goldBright,
        live: NAPLES_COLORS.gold,
        "live-dim": NAPLES_COLORS.goldDim,
        cream: NAPLES_COLORS.cream,
        body: NAPLES_COLORS.body,
        muted: NAPLES_COLORS.muted,
        faint: NAPLES_COLORS.faint,
        "grad-amber": NAPLES_COLORS.gradAmber,
        "grad-gold": NAPLES_COLORS.gradGold,
        "grad-bronze": NAPLES_COLORS.gradBronze,
        "grad-cream": NAPLES_COLORS.gradCream,
        emerald: NAPLES_COLORS.emerald,
        rose: NAPLES_COLORS.rose,
        sapphire: NAPLES_COLORS.sapphire,
        amber: NAPLES_COLORS.amber,
        violet: NAPLES_COLORS.violet,
      },
      fontFamily: {
        // Stripe-style: tight display sans for headings, regular Inter for body
        heading: ["var(--font-heading)", "Inter Tight", "Inter", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "Inter", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      letterSpacing: {
        broadcast: "0.04em",
        tightest: "-0.04em",
        tighter: "-0.025em",
        tight: "-0.015em",
      },
      fontSize: {
        // Stripe-style hero scale
        "hero-sm": ["3rem", { lineHeight: "1.05", letterSpacing: "-0.025em" }],
        "hero": ["4.5rem", { lineHeight: "1.02", letterSpacing: "-0.03em" }],
        "hero-lg": ["5.5rem", { lineHeight: "1", letterSpacing: "-0.035em" }],
      },
      boxShadow: {
        // Stripe's signature soft shadow stack
        "soft": "0 1px 2px rgba(10,26,47,0.04), 0 4px 12px rgba(10,26,47,0.06)",
        "card": "0 2px 4px rgba(10,26,47,0.04), 0 8px 24px rgba(10,26,47,0.08)",
        "lift": "0 4px 8px rgba(10,26,47,0.06), 0 24px 48px rgba(10,26,47,0.12)",
        "ring-gold": "0 0 0 4px rgba(184,137,62,0.15)",
      },
      borderRadius: {
        "stripe": "12px",
        "stripe-lg": "20px",
      },
    },
  },
};

export default preset;

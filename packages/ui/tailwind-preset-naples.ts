import type { Config } from "tailwindcss";

// Naples Digital brand preset — white / black / gold.
// Same token names as the 239 Live preset so @naples/ui components render
// correctly in either theme — gold/cream/bg/card resolve to different hex
// values depending on which preset the consuming app loads.

export const NAPLES_COLORS = {
  bg: "#FFFFFF",            // white background (light theme)
  bgDeep: "#F5F5F2",        // off-white deep
  card: "#FAFAF7",          // off-white card surface
  cardBorder: "#E5E2D8",    // light warm gray
  cardBorderStrong: "#C9C4B5",

  // Primary brand accent — actual metallic gold
  gold: "#B8893E",          // warm refined gold (not yellow)
  goldDim: "#8E6A2D",       // deep gold

  // Body text on white
  cream: "#0A0A0A",          // near-black (was near-white in 239 preset)
  muted: "#6B6B6B",          // medium gray for secondary text

  // Semantic accents (kept from 239 preset, work fine on white)
  emerald: "#3F9E6B",
  rose: "#C25E5E",
  sapphire: "#4F7DB8",
  amber: "#D9A03B",
  violet: "#8A6BB8",
} as const;

const preset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        bg: NAPLES_COLORS.bg,
        "bg-deep": NAPLES_COLORS.bgDeep,
        card: NAPLES_COLORS.card,
        "card-border": NAPLES_COLORS.cardBorder,
        "card-border-strong": NAPLES_COLORS.cardBorderStrong,
        gold: NAPLES_COLORS.gold,
        "gold-dim": NAPLES_COLORS.goldDim,
        live: NAPLES_COLORS.gold,        // alias used by Nav components
        "live-dim": NAPLES_COLORS.goldDim,
        cream: NAPLES_COLORS.cream,
        muted: NAPLES_COLORS.muted,
        emerald: NAPLES_COLORS.emerald,
        rose: NAPLES_COLORS.rose,
        sapphire: NAPLES_COLORS.sapphire,
        amber: NAPLES_COLORS.amber,
        violet: NAPLES_COLORS.violet,
      },
      fontFamily: {
        heading: ["var(--font-heading)", "Bebas Neue", "Impact", "sans-serif"],
        body: ["var(--font-body)", "Inter", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        broadcast: "0.04em",
      },
    },
  },
};

export default preset;

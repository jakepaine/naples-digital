// Brand tokens for the Naples Digital × 239 Live system.
// These hex values are the source of truth — Tailwind config + components
// reference them so a single change cascades to every app.

export const COLORS = {
  bg: "#0A0A0A",
  card: "#1A1A1A",
  cardBorder: "#2A2A2A",
  gold: "#C9A84C",
  goldDim: "#8A7332",
  cream: "#F5EDD8",
  muted: "#999999",
  // semantic accents for badges/charts (kept tasteful within the dark palette)
  emerald: "#3F9E6B",
  rose: "#C25E5E",
  sapphire: "#4F7DB8",
  amber: "#D9A03B",
  violet: "#8A6BB8",
} as const;

export const FONTS = {
  heading: "var(--font-heading)",
  body: "var(--font-body)",
} as const;

export type ColorToken = keyof typeof COLORS;

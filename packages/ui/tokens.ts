// Brand tokens for the 239 Live broadcast system.
// Aligned to the 239-live.vercel.app reference: Bebas Neue + Inter,
// red "live" accent on near-black backgrounds with per-show colored gradients.
//
// Note on naming: legacy code references `gold` and `cream` tokens. To avoid a
// system-wide rename mid-flight, the token names are preserved but their hex
// values now reflect the new brand (gold → live red, cream → near-white).
// A future commit can rename to `live`/`flame`/`signal` for clarity.

export const COLORS = {
  bg: "#0A0A0A",
  bgDeep: "#000000",
  card: "#111111",
  cardBorder: "#1A1A1A",
  cardBorderStrong: "#2A2A2A",

  // Primary brand accent — broadcast red (the "tally light")
  gold: "#E8192C",      // signal/live red (was metallic gold)
  goldDim: "#C0111F",   // deep red (was dim gold)

  // Body text
  cream: "#F5F5F5",     // near-white (was warm cream)
  muted: "#A0A0A0",

  // Semantic accents for charts + show-themed surfaces
  emerald: "#3F9E6B",
  rose: "#C25E5E",
  sapphire: "#4F7DB8",
  amber: "#D9A03B",
  violet: "#8A6BB8",
} as const;

// Per-show gradient backgrounds. Match the reference site's show cards.
export const SHOW_GRADIENTS = {
  billionaireCoast: "linear-gradient(135deg, #1a1a0a 0%, #28280f 40%, #111 100%)", // amber
  twoThirtyNineBuilt: "linear-gradient(135deg, #0a1a0a 0%, #11201a 40%, #111 100%)", // emerald
  swflKeys: "linear-gradient(135deg, #0a0a1a 0%, #11112d 40%, #111 100%)", // sapphire
  signal: "linear-gradient(135deg, #1a0a0a 0%, #2d1111 40%, #111 100%)", // red
} as const;

export const FONTS = {
  heading: "var(--font-heading)",
  body: "var(--font-body)",
} as const;

export type ColorToken = keyof typeof COLORS;

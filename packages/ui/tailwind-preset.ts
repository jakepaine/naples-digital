import type { Config } from "tailwindcss";
import { COLORS } from "./tokens";

const preset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        bg: COLORS.bg,
        "bg-deep": COLORS.bgDeep,
        card: COLORS.card,
        "card-border": COLORS.cardBorder,
        "card-border-strong": COLORS.cardBorderStrong,
        // Legacy "gold" / "cream" tokens repointed to the new red/white palette;
        // see tokens.ts for the rationale on keeping the names.
        gold: COLORS.gold,
        "gold-dim": COLORS.goldDim,
        live: COLORS.gold,         // alias for clarity in new code
        "live-dim": COLORS.goldDim,
        cream: COLORS.cream,
        muted: COLORS.muted,
        emerald: COLORS.emerald,
        rose: COLORS.rose,
        sapphire: COLORS.sapphire,
        amber: COLORS.amber,
        violet: COLORS.violet,
      },
      fontFamily: {
        // Reference: 239-live.vercel.app uses Bebas Neue (display) + Inter (body)
        heading: ["var(--font-heading)", "Bebas Neue", "Impact", "sans-serif"],
        body: ["var(--font-body)", "Inter", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        "broadcast": "0.04em",
      },
      backgroundImage: {
        "show-billionaire": "linear-gradient(135deg, #1a1a0a 0%, #28280f 40%, #111 100%)",
        "show-built":       "linear-gradient(135deg, #0a1a0a 0%, #11201a 40%, #111 100%)",
        "show-keys":        "linear-gradient(135deg, #0a0a1a 0%, #11112d 40%, #111 100%)",
        "show-signal":      "linear-gradient(135deg, #1a0a0a 0%, #2d1111 40%, #111 100%)",
        "live-glow":        "radial-gradient(circle at top, rgba(232,25,44,0.15), transparent 60%)",
      },
      keyframes: {
        // Slower, more deliberate red pulse — like a recording light
        "gold-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.45" },
        },
        "live-pulse": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.55", transform: "scale(0.92)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "gold-pulse": "gold-pulse 1.6s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "live-pulse": "live-pulse 1.6s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in-up": "fade-in-up 0.4s ease-out both",
      },
    },
  },
};

export default preset;

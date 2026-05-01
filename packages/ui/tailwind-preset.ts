import type { Config } from "tailwindcss";
import { COLORS } from "./tokens";

const preset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        bg: COLORS.bg,
        card: COLORS.card,
        "card-border": COLORS.cardBorder,
        gold: COLORS.gold,
        "gold-dim": COLORS.goldDim,
        cream: COLORS.cream,
        muted: COLORS.muted,
        emerald: COLORS.emerald,
        rose: COLORS.rose,
        sapphire: COLORS.sapphire,
        amber: COLORS.amber,
        violet: COLORS.violet,
      },
      fontFamily: {
        heading: ["var(--font-heading)", "Playfair Display", "serif"],
        body: ["var(--font-body)", "Montserrat", "sans-serif"],
      },
      keyframes: {
        "gold-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "gold-pulse": "gold-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in-up": "fade-in-up 0.4s ease-out both",
      },
    },
  },
};

export default preset;

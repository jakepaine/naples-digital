import type { Config } from "tailwindcss";
import preset from "@naples/ui/tailwind-preset";

const config: Config = {
  presets: [preset as Config],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/components/**/*.tsx",
  ],
};
export default config;

export const PLATFORMS = [
  "twitter",
  "linkedin",
  "instagram",
  "facebook",
  "medium",
] as const;

export type Platform = (typeof PLATFORMS)[number];

export function isValidPlatform(s: unknown): s is Platform {
  return typeof s === "string" && (PLATFORMS as readonly string[]).includes(s);
}

export interface PlatformConstraints {
  charLimit: number;
  tone: string;
  hashtagCount: number;
}

export const CONSTRAINTS: Record<Platform, PlatformConstraints> = {
  twitter: {
    charLimit: 280,
    tone: "punchy, declarative, one core idea, no hashtag spam",
    hashtagCount: 1,
  },
  linkedin: {
    charLimit: 3000,
    tone: "thought-leader, story-led, paragraph-broken, soft-CTA",
    hashtagCount: 5,
  },
  instagram: {
    charLimit: 2200,
    tone: "personal, lifestyle-leaning, visual-first, ends with hashtags",
    hashtagCount: 12,
  },
  facebook: {
    charLimit: 8000,
    tone: "conversational, longer-form, link-heavy",
    hashtagCount: 0,
  },
  medium: {
    charLimit: 50000,
    tone: "essay, sectioned with subheads, link to original post at the bottom",
    hashtagCount: 5,
  },
};

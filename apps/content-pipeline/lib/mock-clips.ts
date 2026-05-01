// Deterministic clip generator for when ANTHROPIC_API_KEY is unset.

export interface ClipDraft {
  hook: string;
  caption: string;
  platform: "instagram" | "tiktok" | "youtube" | "facebook" | "best";
}

interface Input {
  show: string;
  title: string;
  guest: string;
  guestTitle: string;
}

const PLATFORM_TONES: Array<{ platform: ClipDraft["platform"]; tone: string }> = [
  { platform: "best",      tone: "the headline moment — works anywhere" },
  { platform: "instagram", tone: "polished, image-first, brand-safe" },
  { platform: "tiktok",    tone: "fast hook, conversational, story-shaped" },
  { platform: "youtube",   tone: "longer setup, payoff-driven, search-friendly" },
  { platform: "facebook",  tone: "context-rich, audience-skews-older, comment-bait" },
];

export function generateMockClips(input: Input): ClipDraft[] {
  const guestRef = input.guestTitle ? `${input.guest} (${input.guestTitle})` : input.guest;
  return PLATFORM_TONES.map(({ platform, tone }, i) => ({
    platform,
    hook: hookFor(platform, input, i),
    caption: captionFor(platform, input, guestRef, tone),
  }));
}

function hookFor(p: ClipDraft["platform"], input: Input, i: number): string {
  const beats = [
    `The one thing ${input.guest} got wrong before this worked.`,
    `Why ${input.guest.split(" ")[0]} stopped doing ${input.show === "239 Built" ? "what every founder does" : "what the playbook said"}.`,
    `${input.guest.split(" ")[0]}: "If I had to start over in Naples today…"`,
    `The 90-second version of ${input.title}.`,
    `${input.guest.split(" ")[0]}'s rule for ${pickFor(input.show)}.`,
  ];
  return beats[i % beats.length];
}

function captionFor(p: ClipDraft["platform"], input: Input, guestRef: string, tone: string): string {
  const base = `${guestRef} on ${input.show} — ${input.title}.`;
  const platformLines: Record<ClipDraft["platform"], string> = {
    best:      `${base} The clip that's getting 3x the saves of anything else this week.`,
    instagram: `${base}\n\nFull episode dropping Friday. Tap the link in bio to get the alert.`,
    tiktok:    `${base} Watch til the end — it's not what you think.\n\n#Naples #SWFL #Founders`,
    youtube:   `${base} Full episode here. New episodes every Friday — subscribe so you don't miss the next one.`,
    facebook:  `${base} The conversation Naples needed. Full episode is up — what would you have asked? Tell us in the comments.`,
  };
  return platformLines[p];
}

function pickFor(show: string): string {
  if (show === "Billionaire Coast") return "scaling capital quietly";
  if (show === "239 Built") return "founder-led growth in a small market";
  if (show === "SWFL Keys") return "owning your audience";
  return "showing up online";
}

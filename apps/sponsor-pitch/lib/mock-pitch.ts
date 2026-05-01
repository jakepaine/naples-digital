// Deterministic sponsor-pitch generator for when ANTHROPIC_API_KEY is unset.

export interface PitchPackage {
  tier: "Bronze" | "Silver" | "Gold";
  price_per_show: number;
  inclusions: string[];
}

export interface SponsorPitch {
  audience_match: string;
  packages: PitchPackage[];
  integration_ideas: string[];
  source: "api" | "mock" | "fallback";
}

const SHOW_BLURBS: Record<string, string> = {
  "Billionaire Coast": "Billionaire Coast is the long-form interview show where Naples founders, developers, and capital allocators tell the real story of how money moves in Southwest Florida. Audience: 71% Naples-Marco Island residents, $400K+ HHI median, 85% decision-makers in their organizations.",
  "239 Built": "239 Built is the founder-storytelling show profiling the operators behind Southwest Florida's fastest-growing companies — restaurants, real estate, hospitality, services. Audience skews younger and more entrepreneurial: 60% age 28–45, 40% currently running a business, high engagement with locally-rooted brands.",
  "SWFL Keys": "SWFL Keys covers Naples-Fort Myers culture, art, food, and place — a quieter audience but with strong taste-maker overlap. Ideal for luxury, hospitality, and lifestyle brands looking to be associated with the SWFL identity rather than blasting a CTA.",
};

export function generateMockPitch(input: { sponsorName: string; show: string }): SponsorPitch {
  const showBlurb = SHOW_BLURBS[input.show] ??
    `${input.show} reaches an engaged Southwest Florida audience aligned with founder-led, premium-positioned brands.`;
  const audienceMatch = `${input.sponsorName} is a strong fit for ${input.show}. ${showBlurb} ${input.sponsorName}'s audience and the show's audience overlap on the dimensions that actually drive sponsor outcomes: geography, household income, and willingness to act on a recommendation from someone they trust.`;

  const packages: PitchPackage[] = [
    {
      tier: "Bronze",
      price_per_show: 300,
      inclusions: [
        "Brand mention in the show open",
        "One mid-roll integration per episode",
        "1 vertical clip cut tagged to ${input.sponsorName}'s handles".replace("${input.sponsorName}", input.sponsorName),
        "Quarterly performance recap",
      ],
    },
    {
      tier: "Silver",
      price_per_show: 500,
      inclusions: [
        "Everything in Bronze",
        "Name-in-title placement (\"… presented by " + input.sponsorName + "\")",
        "3-platform clip distribution (IG / TT / YT)",
        "Dedicated guest segment positioning",
        "Monthly content review with the producer",
      ],
    },
    {
      tier: "Gold",
      price_per_show: 1000,
      inclusions: [
        "Everything in Silver",
        "Title sponsor exclusivity (one Gold per season)",
        "Integrated brand mention from the host (not read copy)",
        "Full platform distribution (IG / TT / YT / FB)",
        "Quarterly co-marketing review with Kevin",
        "First-look on " + input.show + " editorial calendar",
      ],
    },
  ];

  const integrationIdeas = [
    `Have a ${input.sponsorName} executive guest on a future ${input.show} episode — turns the sponsor into a story, not a logo`,
    `Co-branded long-form clip series: 5 short-form cuts on a single topic, both feeds carry them`,
    `${input.sponsorName} sponsors a "${input.show} Field Notes" segment — host walks viewers through one Naples site per episode`,
    `Quarterly live event at the studio (50-cap) with ${input.sponsorName} as title — Kevin moderates, sponsor closes`,
    `Studio walk-through ad — 30-second branded spot shot in-house, no agency fee, refreshes each season`,
  ];

  return { audience_match: audienceMatch, packages, integration_ideas: integrationIdeas, source: "mock" };
}

// Deterministic lead-intelligence generator for when ANTHROPIC_API_KEY is unset.
// Returns the same shape as the real API call so the UI is identical either way.

export interface LeadAngle {
  summary: string;
  hooks: string[];
  draft_dm: string;
  source: "api" | "mock" | "fallback";
}

interface Input {
  name: string;
  type: string;
  goal: string;
}

const TYPE_BLURBS: Record<string, string> = {
  "Real Estate Agent": "Naples luxury market — listings closing 18% faster when shot in a real studio vs. on-site",
  "Financial Advisor": "SWFL wealth migration is up 31% — owned media is how RIAs get in front of new families",
  "Local Business": "Naples Main Street brands seeing 4x foot traffic from founder-led video content",
  "Content Creator": "stuck on the 10K ceiling that hits when production looks like a living room",
  "Home Builder": "buyers in Naples need to see the founder before they sign — and your competitors aren't filming",
  "Content Agency": "wraps faster with a dedicated room than chasing studio bookings every week",
  "Corporate": "executive brand on owned channels outperforms LinkedIn by 6x in this market",
  "Event Company": "every event becomes 90 days of content with the right capture pipeline",
  "Luxury Brand": "long-form interview is what Naples luxury actually buys — not paid social",
};

const GOAL_HOOKS: Record<string, string[]> = {
  "Studio Rental": [
    "Show them the three-camera + broadcast-audio room — most agents have only seen iPhone setups in Naples",
    "Anchor the price against what they spend on listing photos already",
    "Drop the calendar — we have 3 May slots open and June books fast",
  ],
  "Gold Sponsor": [
    "Position Billionaire Coast's audience: 71% Naples residents, $400K+ HHI median",
    "Lead with title-sponsor exclusivity — only one Gold per show season",
    "Mention the quarterly co-marketing review — sponsors want a partner, not a placement",
  ],
  "Silver Sponsor": [
    "Anchor against Gold pricing so Silver feels like the smart-money pick",
    "Highlight name-in-title placement and three-platform clip distribution",
    "Time-box: only 2 Silver slots left in the May taping cycle",
  ],
  "Bronze Sponsor": [
    "Frame it as a 3-show test — low risk, see the audience response",
    "Lead with the clip cut tagged to their handles — that alone is worth the package",
    "Soft urgency: Bronze is being phased out next quarter as we tighten the show",
  ],
  "Monthly Membership": [
    "Math out the per-shoot cost vs. day rate — membership pays back at ~3 sessions/mo",
    "Priority calendar access is the actual selling point for high-volume creators",
    "Offer a one-month trial before the annual commit",
  ],
  "Day Rate": [
    "Compare to flying in a Tampa or Miami studio — ours is 30 min from their office",
    "Lead with our equipment list — it's better than what they'd rent",
    "Quick win: book a half-day to test the fit before a full session",
  ],
  "Real Estate Session": [
    "Show the listing-walkthrough format that's eating the Naples luxury feed",
    "Bundle it: 1 listing video + 1 founder cut, both delivered next-day",
    "Reference a recent agent who closed 3 listings off one shoot",
  ],
  "Corporate Package": [
    "Lead with full-production + dedicated PM — they don't want to manage logistics",
    "Anchor against agency retainer pricing — we're 40% less for same output",
    "Offer to scope a 90-day content roadmap before the first shoot",
  ],
  "Event Night": [
    "Position the room: 50 guests, full bar build-out, in-house catering",
    "Cross-sell the capture pipeline so the event becomes 90 days of content",
    "Mention recent events to anchor credibility (Bonita Bay Group, Naples Art Week)",
  ],
};

export function generateMockAngle(input: Input): LeadAngle {
  const blurb = TYPE_BLURBS[input.type] ?? `Solid fit for the studio — ${input.type.toLowerCase()} brands in Naples are leaning into owned content.`;
  const hooks = GOAL_HOOKS[input.goal] ?? [
    `Lead with what 239 Live offers ${input.type.toLowerCase()}s specifically — not generic studio talk`,
    `Reference one peer in the same category they'd recognize`,
    `End with a calendar link, not a "let me know" — make the next step concrete`,
  ];
  return {
    summary: `${input.name} is a ${input.type.toLowerCase()} chasing ${input.goal.toLowerCase()}. Context: ${blurb}.`,
    hooks,
    draft_dm: `Hey — saw ${input.name} and wanted to put 239 Live Studios on your radar. ${blurb}. We're booking ${input.goal.toLowerCase()} clients in Naples right now and the May calendar has room. Worth a 15-min call this week?\n\n— Jake @ Naples Digital`,
    source: "mock",
  };
}

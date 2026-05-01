// Deterministic email template generator used when ANTHROPIC_API_KEY is unset.
// The output is hand-tuned to read as personalized so the demo screen looks
// identical whether or not the real API is hit.

interface GenInput {
  businessName: string;
  businessType: string;
  outreachGoal: string;
}

interface Email {
  subject: string;
  body: string;
}

interface Sequence {
  email1: Email;
  email2: Email;
  email3: Email;
}

const TYPE_HOOKS: Record<string, string> = {
  "Real Estate Agent": "the listing video walkthrough trend that's eating Naples luxury feeds right now",
  "Financial Advisor": "the SWFL wealth migration story — over $4B in family-office capital relocating to Florida",
  "Local Restaurant": "the way Naples founders are using food storytelling to recruit talent and lock in regulars",
  "Corporate Business": "how SWFL companies are quietly building executive brand on owned media instead of LinkedIn",
  "Content Creator": "what serious creators are doing the moment they outgrow shooting in their living room",
  "Podcaster": "the production gap between top-100 SWFL shows and everything else — and how fast it closes with the right room",
  "Event Company": "how events in Naples are turning a single weekend into 90 days of distributed content",
  "Luxury Brand": "the way Naples luxury is being shaped by long-form interview content, not paid social",
  "Home Builder": "the buyer-confidence shift happening when builders run their own founder show",
  "Private Equity": "how SWFL family offices are using owned media to source proprietary deal flow",
  "Yacht Charter": "the booking lift charter operators are seeing from one well-cut founder interview",
};

const GOAL_OFFER: Record<string, string> = {
  "Studio Rental Client": "the studio is built specifically for the kind of content your audience actually finishes — three-camera setup, broadcast-grade audio, a set that does not look like a podcast guy's basement",
  "Bronze Sponsor $300/show": "Bronze sponsorship of Billionaire Coast — three-show package at $300/show, your brand integrated into the show open and one mid-roll, plus a full clip cut tagged to your handles",
  "Silver Sponsor $500/show": "Silver sponsorship of Billionaire Coast — name-in-title placement, dedicated guest segment positioning, and three platforms of clip distribution at $500/show",
  "Gold Sponsor $1,000/show": "Gold sponsorship of Billionaire Coast — title sponsor, integrated brand mention from the host, all platform distribution, and a quarterly co-marketing review at $1,000/show",
};

export function generateMockSequence(input: GenInput): Sequence {
  const { businessName, businessType, outreachGoal } = input;
  const hook = TYPE_HOOKS[businessType] || `the way smart ${businessType.toLowerCase()}s in Southwest Florida are building owned media`;
  const offer = GOAL_OFFER[outreachGoal] || "what we're building at 239 Live Studios";

  return {
    email1: {
      subject: `Quick thought on ${businessName} and ${shortBusinessType(businessType)}`,
      body: `Hi —\n\nWatched what's happening with ${businessName} the last few weeks and noticed ${hook}.\n\nWe just opened 239 Live Studios in Naples — purpose-built for the kind of long-form interview content that's actually moving in this market. ${capitalize(offer)}.\n\nIf the timing is right, I'd love to put 15 minutes on the calendar this week. No pitch — just want to show you what we're shooting and let you decide if there's a fit.\n\nWorth a look?\n\n— Jake\nNaples Digital × 239 Live`,
    },
    email2: {
      subject: `One more thing for ${businessName} — case study attached`,
      body: `Quick follow-up on the note I sent earlier.\n\nWanted to share a recent example: a ${nearbyExample(businessType)} we worked with closed three new accounts directly off the back of a single 45-minute interview cut into 12 vertical clips. Not paid promotion — just owned content distributed correctly.\n\nThe full case study takes about 90 seconds to read. Happy to send it over if useful.\n\nNo response needed if not the right moment — just figured it was worth putting in front of you.\n\n— Jake\nNaples Digital`,
    },
    email3: {
      subject: `Closing the loop — ${businessName}`,
      body: `Last note from me.\n\nWe're booking the May calendar at the studio this week. If ${businessName} is even loosely interested in ${outreachGoal.toLowerCase()}, this is the right window — pricing locks at the start of June and the May slate is intentionally small so we can get every shoot right.\n\nIf the answer is "not now," totally fair. If the answer is "tell me more," reply with a thumbs up and I'll send three time options.\n\nEither way — appreciate you reading this far.\n\n— Jake\nNaples Digital × 239 Live\n239live.studio`,
    },
  };
}

function shortBusinessType(t: string): string {
  return t.toLowerCase().replace(" advisor", "").replace(" agent", "");
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function nearbyExample(type: string): string {
  if (type.includes("Real Estate")) return "Naples luxury broker";
  if (type.includes("Financial") || type.includes("Equity")) return "SWFL wealth advisory firm";
  if (type.includes("Restaurant")) return "Bonita Springs hospitality group";
  if (type.includes("Builder")) return "custom home builder out of Estero";
  if (type.includes("Yacht")) return "Marco Island charter operator";
  if (type.includes("Event")) return "Naples event production company";
  if (type.includes("Luxury")) return "Naples luxury retailer";
  return "Southwest Florida company in your category";
}

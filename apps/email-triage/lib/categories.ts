// Email triage category schema, adapted from Nick Saraev's MakerSchool pattern
// (which uses a 4-category Worthwhile-default classifier — see "Email Categorization
// System" lesson and the Email_Categorization_System.json workflow).
//
// Nick's key insight: structure the prompt so that "Worthwhile" is the default —
// the system filters OUT noise rather than tries to classify signal. This biases
// the system toward false-positives in the high-value lane (better to flag a junk
// email than miss a real lead).
//
// Naples Digital adaptation: 5 categories rather than 4, because service-business
// founders need newsletter as its own bucket (high volume of marketing email),
// and we split sponsorship + sales into a single 'partnerships' bucket.

export type Category =
  | "high_priority"
  | "partnerships"
  | "billing"
  | "newsletter"
  | "spam";

export const CATEGORIES: Category[] = [
  "high_priority",
  "partnerships",
  "billing",
  "newsletter",
  "spam",
];

export const CATEGORY_DESCRIPTIONS: Record<Category, string> = {
  high_priority:
    "Real prospects, hot deals, customer escalations, anything from a current client. DEFAULT here when uncertain.",
  partnerships:
    "Inbound partnership/affiliate/sponsorship pitches, vendor outreach, anyone trying to sell you something.",
  billing:
    "Invoices, receipts, payouts, payment confirmations, billing notices.",
  newsletter:
    "Subscriptions, marketing email, digests, low-effort blasts you've signed up for.",
  spam:
    "Obvious phishing, scams, crypto airdrops, anything you'd unsubscribe from but didn't sign up for.",
};

export const CATEGORY_LABEL: Record<Category, string> = {
  high_priority: "High priority",
  partnerships: "Partnerships",
  billing: "Billing",
  newsletter: "Newsletter",
  spam: "Spam",
};

// Tailwind classes per category (used in UI badges)
export const CATEGORY_TONE: Record<Category, string> = {
  high_priority: "bg-amber-100 text-amber-900 border-amber-300",
  partnerships: "bg-violet-100 text-violet-900 border-violet-300",
  billing: "bg-emerald-100 text-emerald-900 border-emerald-300",
  newsletter: "bg-gray-100 text-gray-700 border-gray-300",
  spam: "bg-red-50 text-red-700 border-red-200",
};

export function isValidCategory(s: unknown): s is Category {
  return typeof s === "string" && (CATEGORIES as string[]).includes(s);
}

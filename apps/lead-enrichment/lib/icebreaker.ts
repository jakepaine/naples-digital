// Per-input personalization line generator. Implements Nick's icebreaker
// pattern from the corpus (cold_email_brief lesson #78):
//
//   "Hey {name}. Love {shortenedCompanyName}, big fan of
//    {shortParaphrasedSomethingPlausibleAboutThem} (genius/very smart)."
//
// Rules: variables under 5 words; informal; imply you do the same thing.
// Falls back to a deterministic template when ANTHROPIC_API_KEY is unset
// so the pipeline always produces something, even on a fresh tenant
// without LLM access.

import Anthropic from "@anthropic-ai/sdk";

export interface IcebreakerInput {
  first_name?: string | null;
  company_name?: string | null;
  domain?: string | null;
  title?: string | null;
  /**
   * Optional company-website-paragraph context — when supplied, Claude can
   * write a sharper icebreaker. Caller is responsible for supplying this
   * (typically from a Firecrawl scrape of the website root).
   */
  context?: string | null;
}

const SYSTEM = `You write one-line cold-email icebreakers. Output JSON only.

Format: {"icebreaker": "Hey {name}. Love {short_co}, big fan of {short_thing}."}

Rules:
- Use the recipient's first name (or "there" if none).
- "{short_co}" = company name shortened to 1-2 words; strip suffixes like Inc, LLC.
- "{short_thing}" = 4 words MAX, plausible-sounding paraphrase of something the
  company actually does. Imply that the sender does the same thing.
- Voice: informal, lowercase prose after the period (no marketing speak),
  no exclamation points beyond the very end.
- Never invent specifics that aren't supported by the context.
- If you have NO useful context at all, return: {"icebreaker": ""}

Return ONLY the JSON.`;

export async function generateIcebreaker(
  input: IcebreakerInput,
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return deterministicIcebreaker(input);

  const userText = [
    `First name: ${input.first_name ?? "(unknown)"}`,
    `Company: ${input.company_name ?? input.domain ?? "(unknown)"}`,
    `Title: ${input.title ?? "(unknown)"}`,
    input.context ? `\nContext: ${input.context.slice(0, 1500)}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const client = new Anthropic({ apiKey });
    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 200,
      system: SYSTEM,
      messages: [{ role: "user", content: userText }],
    });
    const text = res.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const parsed = JSON.parse(text);
    const line = String(parsed.icebreaker ?? "").trim();
    if (!line) return deterministicIcebreaker(input);
    // Hard cap — corpus rule is short.
    return line.length > 220 ? line.slice(0, 217) + "..." : line;
  } catch (e) {
    console.error("icebreaker fallback:", (e as Error).message);
    return deterministicIcebreaker(input);
  }
}

function deterministicIcebreaker(input: IcebreakerInput): string {
  const name = input.first_name ?? "there";
  const co = shortenCo(input.company_name ?? input.domain ?? null);
  if (!co) return `Hey ${name}. Quick question for you.`;
  return `Hey ${name}. Love ${co}, big fan of what you're building.`;
}

function shortenCo(raw: string | null): string {
  if (!raw) return "";
  let s = raw.trim();
  s = s.replace(/\.(com|co|io|ai|net|org)$/i, "");
  s = s.replace(/\b(inc|llc|corp|corporation|ltd|limited|gmbh)\.?$/i, "").trim();
  // Take first 2 words max
  return s.split(/\s+/).slice(0, 2).join(" ");
}

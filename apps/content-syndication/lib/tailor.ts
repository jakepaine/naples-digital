import Anthropic from "@anthropic-ai/sdk";
import { CONSTRAINTS, PLATFORMS, type Platform } from "./platforms";

export interface TailorResult {
  platform: Platform;
  text: string;
  hashtags: string[];
}

export interface TailorInput {
  title: string;
  body: string;
  sourceUrl?: string;
}

const SYSTEM = `You are a content syndication specialist. Given a long-form post,
produce platform-specific copy that respects each platform's audience norms,
character limits, hashtag etiquette, and tone. Never copy-paste the same
text across platforms. Each variant must feel native.

Return strict JSON, one entry per platform:
{ "<platform>": { "text": "...", "hashtags": ["..."] } }`;

function deterministicTailor(input: TailorInput): TailorResult[] {
  // Crude offline fallback so the UI works without an API key.
  return PLATFORMS.map((p) => {
    const c = CONSTRAINTS[p];
    const trimmed = input.body.slice(0, Math.min(input.body.length, c.charLimit - 50));
    const baseTags = ["entrepreneur", "automation", "saas", "marketing", "ai"]
      .slice(0, c.hashtagCount)
      .map((t) => "#" + t);
    return {
      platform: p,
      text: `${input.title}\n\n${trimmed}${input.sourceUrl ? `\n\nFull post: ${input.sourceUrl}` : ""}`,
      hashtags: baseTags,
    };
  });
}

export async function tailorPost(input: TailorInput): Promise<TailorResult[]> {
  if (!process.env.ANTHROPIC_API_KEY) return deterministicTailor(input);
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const userBlock = [
      `TITLE: ${input.title}`,
      `BODY: ${input.body}`,
      input.sourceUrl ? `SOURCE URL: ${input.sourceUrl}` : "",
      "",
      "Constraints per platform:",
      ...PLATFORMS.map(
        (p) =>
          `- ${p}: ≤ ${CONSTRAINTS[p].charLimit} chars; tone = ${CONSTRAINTS[p].tone}; ~${CONSTRAINTS[p].hashtagCount} hashtags`,
      ),
      "",
      "Return JSON only, no prose, no fences.",
    ]
      .filter(Boolean)
      .join("\n");

    const result = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM,
      messages: [{ role: "user", content: userBlock }],
    });

    const text = result.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("");
    const json = JSON.parse(text.replace(/^```(json)?|```$/g, "").trim());

    return PLATFORMS.map((p) => ({
      platform: p,
      text: String(json[p]?.text ?? ""),
      hashtags: (json[p]?.hashtags ?? []) as string[],
    }));
  } catch {
    return deterministicTailor(input);
  }
}

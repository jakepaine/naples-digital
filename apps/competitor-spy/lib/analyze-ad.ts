import Anthropic from "@anthropic-ai/sdk";

export interface AdAnalysis {
  asset_type: string; // image | video | carousel | other
  visual_format: string; // product_shot | lifestyle | testimonial | text_card | meme | etc.
  messaging_angle: string; // pain_point | aspiration | social_proof | scarcity | discount | etc.
  hook_tactic: string; // question | shocking_claim | stat | quote | first_person | etc.
  offer_type: string; // discount | bundle | free_trial | none | etc.
  ai_summary: string;
}

const SYSTEM = `You are an analyst tagging competitor Meta ads to surface what's working
in a niche. Return ONLY a JSON object with this shape:
{
  "asset_type": "image|video|carousel|other",
  "visual_format": "product_shot|lifestyle|testimonial|text_card|meme|comparison|other",
  "messaging_angle": "pain_point|aspiration|social_proof|scarcity|discount|education|other",
  "hook_tactic": "question|shocking_claim|stat|quote|first_person|imperative|other",
  "offer_type": "discount|bundle|free_trial|none|other",
  "ai_summary": "1-2 sentence plain-English description of why this ad works"
}

Use lowercase enum values. Pick the single best match for each axis. If
the ad text or image is missing, infer from what's available.`;

export async function analyzeAd(args: {
  adText: string | null;
  imageUrl: string | null;
  ctaText: string | null;
  hasVideo: boolean;
}): Promise<AdAnalysis> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return deterministicAnalysis(args);

  const client = new Anthropic({ apiKey });
  try {
    const userBlocks: any[] = [
      {
        type: "text",
        text: [
          `Ad text: ${args.adText ?? "(none)"}`,
          `CTA: ${args.ctaText ?? "(none)"}`,
          `Has video: ${args.hasVideo}`,
        ].join("\n"),
      },
    ];
    if (args.imageUrl && /^https?:\/\//.test(args.imageUrl)) {
      userBlocks.push({
        type: "image",
        source: { type: "url", url: args.imageUrl },
      });
    }
    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      system: SYSTEM,
      messages: [{ role: "user", content: userBlocks }],
    });
    const text = res.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("");
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    return {
      asset_type: String(parsed.asset_type ?? "image"),
      visual_format: String(parsed.visual_format ?? "other"),
      messaging_angle: String(parsed.messaging_angle ?? "other"),
      hook_tactic: String(parsed.hook_tactic ?? "other"),
      offer_type: String(parsed.offer_type ?? "none"),
      ai_summary: String(parsed.ai_summary ?? ""),
    };
  } catch (e) {
    console.error("ad analysis fallback:", (e as Error).message);
    return deterministicAnalysis(args);
  }
}

function deterministicAnalysis(args: {
  adText: string | null;
  imageUrl: string | null;
  ctaText: string | null;
  hasVideo: boolean;
}): AdAnalysis {
  const text = (args.adText ?? "").toLowerCase();
  let messaging_angle = "education";
  if (/\d+%|off|sale|deal|discount/.test(text)) messaging_angle = "discount";
  else if (/love|customers|testim|review/.test(text)) messaging_angle = "social_proof";
  else if (/pain|tired|stop|frustrat/.test(text)) messaging_angle = "pain_point";
  let hook_tactic = "imperative";
  if (text.startsWith("why") || text.includes("?")) hook_tactic = "question";
  else if (/\d+%|in \d+ days/.test(text)) hook_tactic = "stat";
  let offer_type = "none";
  if (/discount|off|sale/.test(text)) offer_type = "discount";
  else if (/free trial|free for/.test(text)) offer_type = "free_trial";
  return {
    asset_type: args.hasVideo ? "video" : args.imageUrl ? "image" : "other",
    visual_format: args.imageUrl ? "product_shot" : "text_card",
    messaging_angle,
    hook_tactic,
    offer_type,
    ai_summary: `Heuristic tag — ${messaging_angle} angle with ${hook_tactic} hook.`,
  };
}

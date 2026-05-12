// Vendor pricing snapshot. Used when the vendor API returns raw units
// but not cost (Anthropic gives tokens, AssemblyAI gives minutes,
// Resend gives email counts). Apify's API returns USD directly so it
// doesn't appear here.
//
// Update these rates when vendors publish changes. Each rate is per
// the canonical unit (per token, per minute, per email) so callers
// multiply directly.

export const ANTHROPIC_RATES_USD_PER_TOKEN: Record<
  string,
  { input: number; output: number; cache_write?: number; cache_read?: number }
> = {
  // Sonnet 4.6 — $3 / $15 per million tokens
  "claude-sonnet-4-6": { input: 3 / 1_000_000, output: 15 / 1_000_000 },
  // Opus 4.7 — $15 / $75 per million
  "claude-opus-4-7": { input: 15 / 1_000_000, output: 75 / 1_000_000 },
  // Haiku 4.5 — $1 / $5 per million
  "claude-haiku-4-5": { input: 1 / 1_000_000, output: 5 / 1_000_000 },
};

// Per audio minute. AssemblyAI publishes per-hour; we divide.
export const ASSEMBLYAI_RATES_USD_PER_MINUTE = {
  nano: 0.37 / 60,
  best: 0.65 / 60,
};

// Resend: $0.001 per email above the free tier. Simplification — we
// charge tenants the per-email rate from email zero, eating the small
// free-tier benefit ourselves. Net cost to Naples is bounded by the
// org's actual Resend invoice; this just attributes it cleanly.
export const RESEND_RATE_USD_PER_EMAIL = 0.001;

// Anthropic cost computation. Tokens object shape matches the
// /v1/organizations/usage_report/messages response.
export function computeAnthropicCost(
  model: string,
  tokens: { input_tokens?: number; output_tokens?: number; cache_creation_input_tokens?: number; cache_read_input_tokens?: number }
): number {
  // Match the model name to a known family; fall back to Sonnet rates
  // for unknown models so we never undercount.
  const family = pickAnthropicFamily(model);
  const rate = ANTHROPIC_RATES_USD_PER_TOKEN[family];
  const inputCost = (tokens.input_tokens ?? 0) * rate.input;
  const outputCost = (tokens.output_tokens ?? 0) * rate.output;
  // Cache creation is billed at 1.25x input, cache reads at 0.1x input
  // (per Anthropic prompt caching docs).
  const cacheCreation = (tokens.cache_creation_input_tokens ?? 0) * rate.input * 1.25;
  const cacheRead = (tokens.cache_read_input_tokens ?? 0) * rate.input * 0.1;
  return inputCost + outputCost + cacheCreation + cacheRead;
}

function pickAnthropicFamily(model: string): keyof typeof ANTHROPIC_RATES_USD_PER_TOKEN {
  const m = model.toLowerCase();
  if (m.includes("opus")) return "claude-opus-4-7";
  if (m.includes("haiku")) return "claude-haiku-4-5";
  return "claude-sonnet-4-6";
}

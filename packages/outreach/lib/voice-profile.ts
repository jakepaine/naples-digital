// Tenant voice fingerprint — extracted from 3+ historical sent emails.
// Drives downstream copy modules so they sound like the tenant rather
// than like generic LLM marketing-bot output.
//
// Two surfaces:
//   - extractVoiceProfile()   takes raw samples, returns structured
//                             fingerprint via Claude
//   - getVoicePromptPreface() takes a saved fingerprint, returns a
//                             system-prompt block downstream modules
//                             prepend to their own prompts so the
//                             LLM constrains output to the tenant voice
//
// Storage lives in `tenant_voice_profiles` (migration 0031).

import Anthropic from "@anthropic-ai/sdk";

export interface VoiceFingerprint {
  /** Short / medium / long / mixed. */
  sentence_shape: string;
  /** "casual", "formal", "founder", "hype", etc. */
  vocabulary_register: string;
  /** Phrases the writer uses repeatedly — verbatim. */
  signature_phrases: string[];
  /** Words/structures the writer uses (use these). */
  do_words: string[];
  /** Words the writer avoids (don't generate these). */
  dont_words: string[];
  /** Punctuation tics — em-dash use, exclamation cadence, sentence fragments, etc. */
  punctuation_quirks: string;
  /** Paragraph density — single-sentence / multi-sentence / mixed. */
  paragraph_style: string;
  /** Common greeting forms. */
  greetings: string[];
  /** Common sign-off forms. */
  signoffs: string[];
  /** One-sentence "voice in a nutshell". */
  one_line_voice: string;
}

export interface VoiceExtraction {
  fingerprint: VoiceFingerprint;
  voice_summary: string;
  quality_flags: string[];
}

const SYSTEM = `You are a voice-fingerprinting analyst. Read the sample emails and
output a STRUCTURED voice profile that downstream LLMs can use to
generate copy in the writer's exact tone.

Return strict JSON only:
{
  "fingerprint": {
    "sentence_shape": "<short|medium|long|mixed>",
    "vocabulary_register": "<casual|formal|founder|hype|professional|warm-direct|other>",
    "signature_phrases": ["..."],
    "do_words": ["..."],
    "dont_words": ["..."],
    "punctuation_quirks": "<one short sentence>",
    "paragraph_style": "<one short sentence>",
    "greetings": ["..."],
    "signoffs": ["..."],
    "one_line_voice": "<one sentence — voice in a nutshell>"
  },
  "voice_summary": "<one short paragraph (3-5 sentences) capturing the voice that downstream LLMs can include verbatim as a system prompt>",
  "quality_flags": ["..."]   // empty list when samples are clean
}

Rules:
- signature_phrases must be VERBATIM from the samples — no paraphrasing.
- do_words / dont_words are WORDS or 2-3 word constructs.
- quality_flags surfaces problems like:
    "samples_too_short"     (any sample < 200 chars)
    "samples_too_few"       (fewer than 3 samples)
    "tone_inconsistent"     (samples don't agree on register)
    "marketing_template_detected"  (looks AI-written, not real human)
- DO NOT invent stylistic quirks the samples don't actually exhibit.
- Don't include the example values from this prompt in the output.`;

export async function extractVoiceProfile(args: {
  samples: string[];
}): Promise<VoiceExtraction> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const cleaned = args.samples
    .map((s) => s.trim())
    .filter((s) => s.length >= 30);

  if (!apiKey) {
    return deterministicProfile(cleaned);
  }

  try {
    const client = new Anthropic({ apiKey });
    const userMsg = cleaned
      .map((s, i) => `--- Sample ${i + 1} ---\n${s.slice(0, 4000)}`)
      .join("\n\n");
    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      system: SYSTEM,
      messages: [{ role: "user", content: userMsg }],
    });
    const text = res.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const json = JSON.parse(text);
    const fp = json.fingerprint ?? {};
    return {
      fingerprint: {
        sentence_shape: String(fp.sentence_shape ?? "mixed"),
        vocabulary_register: String(fp.vocabulary_register ?? "casual"),
        signature_phrases: arr(fp.signature_phrases),
        do_words: arr(fp.do_words),
        dont_words: arr(fp.dont_words),
        punctuation_quirks: String(fp.punctuation_quirks ?? ""),
        paragraph_style: String(fp.paragraph_style ?? ""),
        greetings: arr(fp.greetings),
        signoffs: arr(fp.signoffs),
        one_line_voice: String(fp.one_line_voice ?? ""),
      },
      voice_summary: String(json.voice_summary ?? "").slice(0, 1200),
      quality_flags: arr(json.quality_flags),
    };
  } catch {
    return deterministicProfile(cleaned);
  }
}

function arr(raw: any): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((s) => typeof s === "string" && s.length > 0).slice(0, 12);
}

function deterministicProfile(samples: string[]): VoiceExtraction {
  const flags: string[] = [];
  if (samples.length < 3) flags.push("samples_too_few");
  if (samples.some((s) => s.length < 200)) flags.push("samples_too_short");
  return {
    fingerprint: {
      sentence_shape: "mixed",
      vocabulary_register: "casual",
      signature_phrases: [],
      do_words: [],
      dont_words: [],
      punctuation_quirks: "Default — no calibration available.",
      paragraph_style: "Mixed — no calibration available.",
      greetings: [],
      signoffs: [],
      one_line_voice:
        "Direct and conversational — placeholder until ANTHROPIC_API_KEY is configured.",
    },
    voice_summary:
      "Calibration deferred — no Anthropic key configured. Set ANTHROPIC_API_KEY in Doppler to extract a real fingerprint.",
    quality_flags: [...flags, "deterministic_fallback"],
  };
}

/**
 * Compose a system-prompt block that downstream copy modules can prepend
 * to their own prompts. Returns empty string when the profile is unset.
 */
export function getVoicePromptPreface(
  fingerprint: VoiceFingerprint | null | undefined,
  voiceSummary: string | null | undefined,
): string {
  if (!fingerprint || !voiceSummary) return "";
  const lines: string[] = [
    "WRITE IN THIS VOICE:",
    voiceSummary,
    "",
    "Voice rules (do not violate):",
    `- Sentence shape: ${fingerprint.sentence_shape}.`,
    `- Vocabulary register: ${fingerprint.vocabulary_register}.`,
  ];
  if (fingerprint.punctuation_quirks) {
    lines.push(`- Punctuation: ${fingerprint.punctuation_quirks}`);
  }
  if (fingerprint.paragraph_style) {
    lines.push(`- Paragraph style: ${fingerprint.paragraph_style}`);
  }
  if (fingerprint.do_words.length > 0) {
    lines.push(
      `- Words to use: ${fingerprint.do_words.slice(0, 8).join(", ")}.`,
    );
  }
  if (fingerprint.dont_words.length > 0) {
    lines.push(
      `- Words to AVOID: ${fingerprint.dont_words.slice(0, 8).join(", ")}.`,
    );
  }
  if (fingerprint.signature_phrases.length > 0) {
    lines.push(
      `- Signature phrases the writer uses (mirror these when natural): ${fingerprint.signature_phrases.slice(0, 6).map((p) => `"${p}"`).join(", ")}.`,
    );
  }
  if (fingerprint.greetings.length > 0) {
    lines.push(
      `- Greetings the writer uses: ${fingerprint.greetings.slice(0, 4).map((p) => `"${p}"`).join(", ")}.`,
    );
  }
  if (fingerprint.signoffs.length > 0) {
    lines.push(
      `- Sign-offs the writer uses: ${fingerprint.signoffs.slice(0, 4).map((p) => `"${p}"`).join(", ")}.`,
    );
  }
  lines.push(
    "",
    "Do not write like a generic AI marketing assistant. Match the voice above.",
  );
  return lines.join("\n");
}

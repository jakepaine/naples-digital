// AssemblyAI transcription wrapper.
// Docs: https://www.assemblyai.com/docs/api-reference/transcripts
//
// Flow:
//   1. POST /v2/transcript with audio_url → returns { id, status: 'queued' }
//   2. Poll GET /v2/transcript/{id} until status === 'completed' or 'error'
//   3. Result includes { text, words: [{ text, start, end, confidence, speaker }] }

const API_BASE = "https://api.assemblyai.com/v2";

export type TranscriptWord = {
  text: string;
  start: number;        // ms from start
  end: number;
  confidence: number;
  speaker?: string;
};

export type TranscriptionResult = {
  id: string;
  text: string;
  words: TranscriptWord[];
  audio_duration: number; // seconds
  language_code?: string;
  raw: Record<string, unknown>;
};

export type AssemblyAIClient = {
  transcribe(audioUrl: string, opts?: { speaker_labels?: boolean }): Promise<TranscriptionResult>;
  startTranscription(audioUrl: string, opts?: { speaker_labels?: boolean; webhook_url?: string }): Promise<{ id: string }>;
  getTranscription(id: string): Promise<TranscriptionResult | null>;
};

export function createAssemblyAIClient(opts: { apiKey: string }): AssemblyAIClient {
  async function call<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Authorization": opts.apiKey,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) throw new Error(`AssemblyAI ${res.status}: ${await res.text().catch(() => "")}`);
    return res.json() as Promise<T>;
  }

  function shape(raw: Record<string, unknown>): TranscriptionResult {
    const words = (raw.words as Array<Record<string, unknown>> | undefined) ?? [];
    return {
      id: raw.id as string,
      text: (raw.text as string) ?? "",
      audio_duration: ((raw.audio_duration as number) ?? 0),
      language_code: raw.language_code as string | undefined,
      words: words.map(w => ({
        text: w.text as string,
        start: w.start as number,
        end: w.end as number,
        confidence: w.confidence as number,
        speaker: w.speaker as string | undefined,
      })),
      raw,
    };
  }

  return {
    async startTranscription(audioUrl, opts = {}) {
      const data = await call<{ id: string }>("/transcript", {
        method: "POST",
        body: JSON.stringify({
          audio_url: audioUrl,
          speaker_labels: opts.speaker_labels ?? true,
          ...(opts.webhook_url ? { webhook_url: opts.webhook_url } : {}),
        }),
      });
      return { id: data.id };
    },

    async getTranscription(id: string) {
      const data = await call<Record<string, unknown>>(`/transcript/${id}`);
      if (data.status === "completed") return shape(data);
      if (data.status === "error") throw new Error((data.error as string) ?? "AssemblyAI error");
      return null;
    },

    async transcribe(audioUrl, opts) {
      const { id } = await this.startTranscription(audioUrl, opts);
      // Poll. Real podcasts run 30-60 min; AssemblyAI typically 1/3 realtime.
      const maxWaitMs = 30 * 60 * 1000;
      const start = Date.now();
      let delay = 5_000;
      while (Date.now() - start < maxWaitMs) {
        await new Promise(r => setTimeout(r, delay));
        const result = await this.getTranscription(id);
        if (result) return result;
        delay = Math.min(delay * 1.2, 30_000);
      }
      throw new Error("Transcription timed out");
    },
  };
}

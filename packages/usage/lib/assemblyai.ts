import { createServerClient, hasSupabase } from "@naples/db";
import type { UsageAdapter, UsageSnapshot, UsageWindow } from "./types";
import { ASSEMBLYAI_RATES_USD_PER_MINUTE } from "./pricing";

// AssemblyAI does not expose per-key usage. We log each transcription call
// in our own DB (assemblyai_calls table — created when content-pipeline
// next ships transcription) and roll it up here.
//
// Returns null until the assemblyai_calls table exists or has data for
// the window. The cron tolerates null returns and just skips the snapshot.

type AssemblyAICallRow = {
  audio_duration_sec: number;
  model: "nano" | "best";
};

export function createAssemblyAIAdapter(): UsageAdapter {
  return {
    vendor: "assemblyai",
    async fetchUsage(tenantId, window): Promise<UsageSnapshot | null> {
      if (!hasSupabase()) return null;
      const sb = createServerClient();
      // assemblyai_calls table is not in the generated Database types
      // yet (lands in a later migration when content-pipeline ships
      // transcription logging). Query through `any` so this compiles
      // before the table exists; runtime check on error preserves the
      // null-return contract.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (sb.from as any)("assemblyai_calls")
        .select("audio_duration_sec, model")
        .eq("tenant_id", tenantId)
        .gte("created_at", window.start.toISOString())
        .lt("created_at", window.end.toISOString());
      if (error) return null;
      const rows = (data ?? []) as unknown as AssemblyAICallRow[];
      if (rows.length === 0) {
        return {
          tenant_id: tenantId,
          vendor: "assemblyai",
          period_start: window.start.toISOString(),
          period_end: window.end.toISOString(),
          units: 0,
          unit_label: "minutes",
          cost_usd: 0,
          raw_payload: { call_count: 0 },
        };
      }
      let totalSeconds = 0;
      let totalCost = 0;
      for (const r of rows) {
        const seconds = r.audio_duration_sec ?? 0;
        totalSeconds += seconds;
        const rate = ASSEMBLYAI_RATES_USD_PER_MINUTE[r.model] ?? ASSEMBLYAI_RATES_USD_PER_MINUTE.nano;
        totalCost += (seconds / 60) * rate;
      }
      return {
        tenant_id: tenantId,
        vendor: "assemblyai",
        period_start: window.start.toISOString(),
        period_end: window.end.toISOString(),
        units: Math.round((totalSeconds / 60) * 100) / 100,
        unit_label: "minutes",
        cost_usd: Math.round(totalCost * 10000) / 10000,
        raw_payload: { call_count: rows.length, total_seconds: totalSeconds },
      };
    },
  };
}

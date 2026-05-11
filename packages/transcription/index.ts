import { createAssemblyAIClient, type AssemblyAIClient, type TranscriptionResult } from "./lib/assemblyai";
import { getTenantSecret } from "@naples/db";

export * from "./lib/assemblyai";
export type { TranscriptionResult };

export async function getTranscriptionClientForTenant(tenantId: string): Promise<AssemblyAIClient | null> {
  const tenantSecret = await getTenantSecret(tenantId, "assemblyai");
  if (tenantSecret?.secret && tenantSecret.status !== "disabled") {
    return createAssemblyAIClient({ apiKey: tenantSecret.secret });
  }
  const platformKey = process.env.ASSEMBLYAI_API_KEY;
  if (platformKey) return createAssemblyAIClient({ apiKey: platformKey });
  return null;
}

import { createAssemblyAIClient, type AssemblyAIClient, type TranscriptionResult } from "./lib/assemblyai";
import { getTenantIntegration } from "@naples/db";

export * from "./lib/assemblyai";
export type { TranscriptionResult };

export async function getTranscriptionClientForTenant(tenantId: string): Promise<AssemblyAIClient | null> {
  const tenantKey = await getTenantIntegration(tenantId, "assemblyai");
  if (tenantKey?.secret_ref && tenantKey.status !== "disabled") {
    return createAssemblyAIClient({ apiKey: tenantKey.secret_ref });
  }
  // Platform-default key (Starter/Pro tier shared)
  const platformKey = process.env.ASSEMBLYAI_API_KEY;
  if (platformKey) return createAssemblyAIClient({ apiKey: platformKey });
  return null;
}

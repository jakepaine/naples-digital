import { createServerClient, hasSupabase } from "@naples/db";

// Records an Apify run for per-tenant attribution. Call this immediately
// after launching an actor run. The run_id comes from:
//   - Async run endpoint (/v2/acts/:id/runs): response.json().data.id
//   - Sync run endpoint (run-sync-*): response.headers.get('X-Apify-Run-Id')
//     or 'Apify-Sync-Run-Id' depending on actor version
//
// Idempotent on apify_run_id (PRIMARY KEY) — duplicate inserts are
// silently ignored so this can be called inside retry loops.
export async function recordApifyRun(input: {
  tenantId: string;
  apifyRunId: string;
  actorId: string;
  sourceApp?: string;
  startedAt?: Date;
}): Promise<boolean> {
  if (!hasSupabase()) return false;
  if (!input.apifyRunId) return false;
  const sb = createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (sb.from as any)("tenant_apify_runs").insert({
    apify_run_id: input.apifyRunId,
    tenant_id: input.tenantId,
    actor_id: input.actorId,
    source_app: input.sourceApp ?? null,
    started_at: (input.startedAt ?? new Date()).toISOString(),
  });
  // PG error code 23505 = unique_violation. We want this to be idempotent
  // so duplicate inserts are not propagated.
  if (error && (error as { code?: string }).code !== "23505") return false;
  return true;
}

// Convenience extractor for the sync-run endpoints. Apify exposes the
// run ID via a response header — the exact name varies across actor
// versions, so check both.
export function extractApifyRunId(headers: Headers): string | null {
  return (
    headers.get("X-Apify-Run-Id") ??
    headers.get("x-apify-run-id") ??
    headers.get("Apify-Sync-Run-Id") ??
    headers.get("apify-sync-run-id") ??
    null
  );
}

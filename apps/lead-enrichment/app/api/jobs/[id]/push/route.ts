// Pushes every "enriched" input on this job into outreach_leads.
// Idempotent — outreach_leads.tenant_id+email is the dedupe key.
// Marks the job pushed_to_outreach=true on success.

import { NextResponse } from "next/server";
import { getServerTenant } from "@naples/db/next";
import { getJob, markJobPushed, pushEnrichedToOutreach } from "@/lib/persist";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  ctx: { params: { id: string } },
) {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const job = await getJob(tenant.id, ctx.params.id);
  if (!job) return NextResponse.json({ error: "not found" }, { status: 404 });

  const result = await pushEnrichedToOutreach({
    tenantId: tenant.id,
    jobId: job.id,
  });
  if (result.pushed > 0) {
    await markJobPushed({ tenantId: tenant.id, jobId: job.id });
  }
  return NextResponse.json(result);
}

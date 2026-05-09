import { NextResponse } from "next/server";
import { getServerTenant } from "@naples/db/next";
import { getJob, listRuns } from "@/lib/persist";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: { id: string } },
) {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  try {
    const job = await getJob(tenant.id, ctx.params.id);
    if (!job) return NextResponse.json({ error: "not found" }, { status: 404 });
    const runs = await listRuns(tenant.id, job.id);
    return NextResponse.json({ job, runs });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

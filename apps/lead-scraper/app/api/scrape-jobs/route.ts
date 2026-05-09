import { NextResponse } from "next/server";
import { getServerTenant } from "@naples/db/next";
import { listJobs, createJob } from "@/lib/persist";
import { ALL_SOURCE_KEYS } from "@/lib/sources";
import type { ScrapeSourceKey } from "@/lib/sources/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  try {
    const jobs = await listJobs(tenant.id);
    return NextResponse.json({ jobs });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const name: string = String(body?.name ?? "").trim();
  const source: string = String(body?.source ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }
  if (!(ALL_SOURCE_KEYS as string[]).includes(source)) {
    return NextResponse.json(
      { error: `source must be one of ${ALL_SOURCE_KEYS.join(", ")}` },
      { status: 400 },
    );
  }
  const params =
    body?.params && typeof body.params === "object" && !Array.isArray(body.params)
      ? (body.params as Record<string, unknown>)
      : {};

  try {
    const job = await createJob({
      tenantId: tenant.id,
      name,
      source: source as ScrapeSourceKey,
      params,
      niche: typeof body?.niche === "string" ? body.niche : null,
      target_titles: Array.isArray(body?.target_titles)
        ? (body.target_titles as string[]).filter(Boolean)
        : [],
      target_locations: Array.isArray(body?.target_locations)
        ? (body.target_locations as string[]).filter(Boolean)
        : [],
      cron_schedule: typeof body?.cron_schedule === "string" ? body.cron_schedule : null,
    });
    return NextResponse.json({ job }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

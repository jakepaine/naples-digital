import { NextResponse } from "next/server";
import { getServerTenant } from "@naples/db/next";
import { listJobs, createJob } from "@/lib/persist";
import { ALL_SOURCE_KEYS } from "@/lib/sources";
import type { EnrichmentSourceKey } from "@/lib/sources/types";
import type { NewJobInput } from "@/lib/types";

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
  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }
  const inputs: NewJobInput[] = Array.isArray(body?.inputs)
    ? (body.inputs as NewJobInput[])
    : [];
  if (inputs.length === 0) {
    return NextResponse.json(
      { error: "at least one input required" },
      { status: 400 },
    );
  }
  if (inputs.length > 1000) {
    return NextResponse.json(
      { error: "max 1000 inputs per job; split into multiple jobs" },
      { status: 400 },
    );
  }

  const rawPriority = Array.isArray(body?.source_priority)
    ? (body.source_priority as string[])
    : [];
  const priority: EnrichmentSourceKey[] = rawPriority.filter((k) =>
    (ALL_SOURCE_KEYS as string[]).includes(k),
  ) as EnrichmentSourceKey[];

  const threshold = Number(body?.confidence_threshold ?? 70);
  if (Number.isNaN(threshold) || threshold < 0 || threshold > 100) {
    return NextResponse.json(
      { error: "confidence_threshold must be 0-100" },
      { status: 400 },
    );
  }

  const titleFilter =
    typeof body?.title_filter === "string" && body.title_filter.trim()
      ? String(body.title_filter)
      : null;

  try {
    const job = await createJob({
      tenantId: tenant.id,
      name,
      source_priority: priority,
      confidence_threshold: threshold,
      title_filter: titleFilter,
      inputs,
    });
    return NextResponse.json({ job }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// Synchronous run handler. Same trade-off as Lead Enrichment's /run —
// inline now, queue-backed later when scrape jobs grow past the
// platform's request budget. Apify and PhantomBuster runs can blow
// past the 300s vercel/Next.js default; we set maxDuration to 600.

import { NextResponse } from "next/server";
import { getServerTenant } from "@naples/db/next";
import {
  getJob,
  createRun,
  updateRun,
  bumpJobAfterRun,
  getSourceKey,
  persistLeads,
} from "@/lib/persist";
import { SOURCES } from "@/lib/sources";

export const dynamic = "force-dynamic";
export const maxDuration = 600;

export async function POST(
  _req: Request,
  ctx: { params: { id: string } },
) {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const job = await getJob(tenant.id, ctx.params.id);
  if (!job) return NextResponse.json({ error: "not found" }, { status: 404 });

  const source = SOURCES[job.source];
  if (!source) {
    return NextResponse.json(
      { error: `unsupported source ${job.source}` },
      { status: 400 },
    );
  }
  const apiKey = await getSourceKey(tenant.id, job.source);
  const run = await createRun({
    tenantId: tenant.id,
    jobId: job.id,
    source: job.source,
  });

  try {
    const outcome = await source.scrape({
      apiKey,
      params: job.params,
      maxLeads: 1000,
      tenantId: tenant.id,
    });
    if (outcome.error && outcome.fetched.length === 0) {
      await updateRun({
        tenantId: tenant.id,
        id: run.id,
        status: "failed",
        error_message: outcome.error,
        raw_results_url: outcome.raw_results_url ?? null,
        completed_at: new Date().toISOString(),
      });
      await bumpJobAfterRun({
        tenantId: tenant.id,
        jobId: job.id,
        insertedCount: 0,
        status: "failed",
      });
      return NextResponse.json(
        { ok: false, error: outcome.error, fetched: 0 },
        { status: 502 },
      );
    }

    const persistResult = await persistLeads({
      tenantId: tenant.id,
      leads: outcome.fetched,
      filters: {
        target_titles: job.target_titles,
        target_locations: job.target_locations,
      },
    });

    const status = persistResult.error
      ? "partial"
      : outcome.error
        ? "partial"
        : "complete";

    await updateRun({
      tenantId: tenant.id,
      id: run.id,
      status,
      fetched_count: outcome.fetched.length,
      inserted_count: persistResult.inserted,
      duplicate_count: persistResult.duplicate,
      filtered_count: persistResult.filtered,
      error_message: outcome.error ?? persistResult.error ?? null,
      raw_results_url: outcome.raw_results_url ?? null,
      completed_at: new Date().toISOString(),
    });
    await bumpJobAfterRun({
      tenantId: tenant.id,
      jobId: job.id,
      insertedCount: persistResult.inserted,
      status,
    });

    return NextResponse.json({
      ok: true,
      status,
      fetched: outcome.fetched.length,
      inserted: persistResult.inserted,
      duplicate: persistResult.duplicate,
      filtered: persistResult.filtered,
      stub: outcome.is_stub === true,
      warning: outcome.error ?? persistResult.error ?? null,
    });
  } catch (e) {
    await updateRun({
      tenantId: tenant.id,
      id: run.id,
      status: "failed",
      error_message: (e as Error).message,
      completed_at: new Date().toISOString(),
    });
    await bumpJobAfterRun({
      tenantId: tenant.id,
      jobId: job.id,
      insertedCount: 0,
      status: "failed",
    });
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

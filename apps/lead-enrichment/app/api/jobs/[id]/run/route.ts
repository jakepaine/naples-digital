// Runs the enrichment chain for every pending input on the job.
//
// Synchronous for now — this matches the existing module pattern
// (competitor-spy /api/sync, lead-won-invoice /api/draft-invoice all
// run inline). At scale the right move is to enqueue into a worker;
// flagged in audit-2026-lens.md as a future Q4 improvement.

import { NextResponse } from "next/server";
import { getServerTenant } from "@naples/db/next";
import {
  getJob,
  listInputs,
  loadSourceKeys,
  recordResult,
  updateInputResolution,
  updateJobStatus,
} from "@/lib/persist";
import { runChain } from "@/lib/enrich";
import { generateIcebreaker } from "@/lib/icebreaker";
import type { EnrichmentInputRow, InputStatus } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min — multi-source chain on large jobs

export async function POST(
  _req: Request,
  ctx: { params: { id: string } },
) {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const job = await getJob(tenant.id, ctx.params.id);
  if (!job) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (job.status === "running") {
    return NextResponse.json(
      { error: "job already running" },
      { status: 409 },
    );
  }

  await updateJobStatus({
    tenantId: tenant.id,
    jobId: job.id,
    status: "running",
    started_at: new Date().toISOString(),
    error_summary: null,
  });

  let inputs: EnrichmentInputRow[];
  try {
    inputs = await listInputs(tenant.id, job.id);
  } catch (e) {
    await updateJobStatus({
      tenantId: tenant.id,
      jobId: job.id,
      status: "failed",
      error_summary: (e as Error).message,
      completed_at: new Date().toISOString(),
    });
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  const apiKeys = await loadSourceKeys(tenant.id);
  const titleRegex = job.title_filter ? safeRegex(job.title_filter) : null;

  let enriched = 0;
  let failed = 0;

  for (const input of inputs) {
    if (input.status !== "pending") continue;

    if (titleRegex && input.title && !titleRegex.test(input.title)) {
      await updateInputResolution({
        tenantId: tenant.id,
        inputId: input.id,
        status: "filtered_out" satisfies InputStatus,
        notes: `title "${input.title}" did not match filter`,
      });
      continue;
    }

    try {
      const outcome = await runChain(
        {
          domain: input.domain,
          linkedin_url: input.linkedin_url,
          email: input.email,
          first_name: input.first_name,
          last_name: input.last_name,
          company_name: input.company_name,
          title: input.title,
        },
        {
          apiKeys,
          priority: job.source_priority,
          threshold: job.confidence_threshold,
        },
      );
      // Persist every per-source attempt for the audit trail.
      for (const r of outcome.results) {
        await recordResult({
          tenantId: tenant.id,
          inputId: input.id,
          result: r,
        });
      }

      let icebreaker: string | null = null;
      if (outcome.status === "enriched" || outcome.status === "low_confidence") {
        icebreaker = await generateIcebreaker({
          first_name: input.first_name,
          company_name: input.company_name,
          domain: input.domain ?? domainFromEmail(outcome.resolved_email),
          title: input.title,
        });
      }

      await updateInputResolution({
        tenantId: tenant.id,
        inputId: input.id,
        status: outcome.status,
        resolved_email: outcome.resolved_email,
        resolved_confidence: outcome.resolved_confidence,
        resolved_source: outcome.resolved_source,
        icebreaker,
        notes: outcome.notes.length ? outcome.notes.join("; ") : null,
      });
      if (outcome.status === "enriched") enriched++;
      else if (outcome.status === "low_confidence") enriched++;
      else failed++;
    } catch (e) {
      failed++;
      await updateInputResolution({
        tenantId: tenant.id,
        inputId: input.id,
        status: "failed" satisfies InputStatus,
        notes: (e as Error).message,
      });
    }
  }

  const total = inputs.length;
  const fullySuccessful = enriched === total;
  await updateJobStatus({
    tenantId: tenant.id,
    jobId: job.id,
    status: fullySuccessful ? "complete" : enriched > 0 ? "partial" : "failed",
    enriched_count: enriched,
    failed_count: failed,
    completed_at: new Date().toISOString(),
  });

  return NextResponse.json({
    ok: true,
    enriched,
    failed,
    total,
  });
}

function safeRegex(pattern: string): RegExp | null {
  try {
    return new RegExp(pattern, "i");
  } catch {
    return null;
  }
}

function domainFromEmail(email: string | null): string | null {
  if (!email) return null;
  const at = email.indexOf("@");
  return at >= 0 ? email.slice(at + 1) : null;
}

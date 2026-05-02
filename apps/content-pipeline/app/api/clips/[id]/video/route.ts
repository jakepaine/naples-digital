import { NextResponse } from "next/server";
import { getRequestTenantId } from "@naples/db/next";
import { getSignedDownloadUrl, RENDERED_CLIPS_BUCKET } from "@naples/storage";
import { createServerClient } from "@naples/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Returns a redirect to a short-lived signed URL for the clip's rendered video.
// Tenant-scoped — clip must belong to the requesting tenant.
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const tid = await getRequestTenantId(req);
  const sb = createServerClient();
  const { data: clip } = await sb.from("clips").select("video_url, tenant_id")
    .eq("id", params.id).eq("tenant_id", tid).single();
  if (!clip || !clip.video_url) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const url = await getSignedDownloadUrl({
    tenantId: tid,
    bucket: RENDERED_CLIPS_BUCKET,
    path: clip.video_url,
    expiresIn: 60 * 30,
  });
  if (!url) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.redirect(url);
}

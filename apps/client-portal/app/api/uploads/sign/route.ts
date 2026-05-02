import { NextResponse } from "next/server";
import { getRequestTenantId } from "@naples/db/next";
import { getSignedUploadUrl, RAW_UPLOADS_BUCKET, ensureBuckets } from "@naples/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  filename: string;     // client-supplied basename, e.g. "podcast-episode-12.mp4"
  episodeId?: string;   // if known, use as the storage object key
}

export async function POST(req: Request) {
  const tid = await getRequestTenantId(req);
  const body = await req.json().catch(() => null) as Body | null;
  if (!body?.filename) return NextResponse.json({ error: "filename required" }, { status: 400 });

  // Defensive: if the tenant has no buckets yet, create them. Idempotent.
  try { await ensureBuckets(); } catch {}

  // Use episodeId as the storage key if provided (so re-uploads overwrite),
  // else a sanitized filename + timestamp.
  const ext = body.filename.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "bin";
  const safeName = body.episodeId ?? `${Date.now()}-${body.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const filename = `${safeName}.${ext}`;

  const signed = await getSignedUploadUrl({
    tenantId: tid,
    bucket: RAW_UPLOADS_BUCKET,
    filename,
  });
  if (!signed) return NextResponse.json({ error: "Failed to sign upload URL" }, { status: 500 });

  return NextResponse.json({
    bucket: RAW_UPLOADS_BUCKET,
    path: signed.path,
    signedUrl: signed.signedUrl,
    token: signed.token,
  });
}

import { NextResponse } from "next/server";
import { createSubmission, attachUploadToSubmission } from "@naples/db";
import { getRequestTenantId } from "@naples/db/next";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  client_name: string;
  client_email: string;
  title: string;
  description?: string;
  asset_type?: "video" | "audio" | "image" | "document";
  source_url?: string;
  edit_brief?: string;
  storage_path?: string;
}

export async function POST(req: Request) {
  let body: Body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.client_email || !body.title) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const tid = await getRequestTenantId(req);
  const created = await createSubmission(tid, body);
  if (created && body.storage_path) {
    await attachUploadToSubmission(tid, created.id, body.storage_path, body.source_url);
  }
  return NextResponse.json({ ok: !!created, submission: created });
}

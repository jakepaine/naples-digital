import { NextResponse } from "next/server";
import { createSubmission } from "@naples/db";

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
}

export async function POST(req: Request) {
  let body: Body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.client_email || !body.title) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const created = await createSubmission(body);
  return NextResponse.json({ ok: !!created, submission: created });
}

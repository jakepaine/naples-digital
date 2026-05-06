import { NextResponse } from "next/server";
import {
  createBacklogItem,
  listBacklogItems,
  type BacklogPriority,
  type BacklogStatus,
} from "@naples/db";
import { getTenantBySlug } from "@naples/db/tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("tenant");
  if (!slug) return NextResponse.json({ error: "tenant slug required" }, { status: 400 });
  const tenant = await getTenantBySlug(slug);
  if (!tenant) return NextResponse.json({ error: "tenant not found" }, { status: 404 });
  const items = await listBacklogItems(tenant.id);
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || !body.tenant || !body.title) {
    return NextResponse.json({ error: "tenant slug + title required" }, { status: 400 });
  }
  const tenant = await getTenantBySlug(body.tenant);
  if (!tenant) return NextResponse.json({ error: "tenant not found" }, { status: 404 });

  const item = await createBacklogItem(tenant.id, {
    title: String(body.title).trim(),
    description: body.description,
    status: body.status as BacklogStatus,
    priority: (body.priority as BacklogPriority) ?? "P2",
    tags: Array.isArray(body.tags) ? body.tags : [],
  });
  if (!item) return NextResponse.json({ error: "create failed" }, { status: 500 });
  return NextResponse.json({ item });
}

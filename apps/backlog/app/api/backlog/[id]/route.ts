import { NextResponse } from "next/server";
import { updateBacklogItem, deleteBacklogItem, type BacklogPriority, type BacklogStatus } from "@naples/db";
import { getTenantBySlug } from "@naples/db/tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function resolveTenantId(req: Request): Promise<string | null> {
  const url = new URL(req.url);
  const slug = url.searchParams.get("tenant");
  if (!slug) return null;
  const t = await getTenantBySlug(slug);
  return t?.id ?? null;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const tenantId = await resolveTenantId(req);
  if (!tenantId) return NextResponse.json({ error: "tenant slug required" }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  const item = await updateBacklogItem(tenantId, params.id, {
    title: body.title,
    description: body.description,
    status: body.status as BacklogStatus,
    priority: body.priority as BacklogPriority,
    tags: Array.isArray(body.tags) ? body.tags : undefined,
    due_at: body.due_at,
    sort_order: typeof body.sort_order === "number" ? body.sort_order : undefined,
  });
  if (!item) return NextResponse.json({ error: "update failed" }, { status: 500 });
  return NextResponse.json({ item });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const tenantId = await resolveTenantId(req);
  if (!tenantId) return NextResponse.json({ error: "tenant slug required" }, { status: 400 });
  const ok = await deleteBacklogItem(tenantId, params.id);
  if (!ok) return NextResponse.json({ error: "delete failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

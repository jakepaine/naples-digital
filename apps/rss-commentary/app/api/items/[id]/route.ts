import { NextResponse } from "next/server";
import { getServerTenant } from "@naples/db/next";
import {
  updateItemStatus,
  type CommentaryStatus,
} from "@/lib/persist";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  ctx: { params: { id: string } },
) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const status: string = String(body?.status ?? "");
  const allowed: CommentaryStatus[] = [
    "pending",
    "generated",
    "approved",
    "rejected",
    "published",
    "archived",
  ];
  if (!(allowed as string[]).includes(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  await updateItemStatus({
    tenantId: tenant.id,
    id: ctx.params.id,
    status: status as CommentaryStatus,
  });
  return NextResponse.json({ ok: true, status });
}

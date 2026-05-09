import { NextResponse } from "next/server";
import { updateVariantText, getVariant } from "@/lib/persist-post";
import { getServerTenant } from "@naples/db/next";

export const dynamic = "force-dynamic";

// PATCH /api/variants/[id] → edit text + hashtags before publish
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const v = await getVariant(params.id);
  if (!v || v.tenant_id !== tenant.id) {
    return NextResponse.json({ error: "variant not found" }, { status: 404 });
  }
  if (typeof body?.text !== "string") {
    return NextResponse.json(
      { error: "text required (string)" },
      { status: 400 },
    );
  }
  const updated = await updateVariantText({
    variantId: params.id,
    text: body.text,
    hashtags: Array.isArray(body.hashtags) ? body.hashtags : undefined,
  });
  return NextResponse.json({ variant: updated });
}

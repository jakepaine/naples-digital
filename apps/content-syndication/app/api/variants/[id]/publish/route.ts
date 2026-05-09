import { NextResponse } from "next/server";
import { getServerTenant } from "@naples/db/next";
import { publishVariant } from "@/lib/dispatch";
import { fetchPostById, getVariant } from "@/lib/persist-post";

export const dynamic = "force-dynamic";

// POST /api/variants/[id]/publish → dispatch via per-platform publisher
export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const variant = await getVariant(params.id);
  if (!variant) {
    return NextResponse.json({ error: "variant not found" }, { status: 404 });
  }
  // Lookup the parent post for image_url
  const post = await fetchPostById(tenant.id, variant.post_id);
  const imageUrl = post?.post.image_url ?? null;

  const result = await publishVariant({
    tenantId: tenant.id,
    variantId: params.id,
    imageUrl,
  });
  if (!result.ok) {
    return NextResponse.json(result, { status: 502 });
  }
  return NextResponse.json(result);
}

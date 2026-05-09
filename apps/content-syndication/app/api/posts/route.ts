import { NextResponse } from "next/server";
import { getServerTenant } from "@naples/db/next";
import { tailorPost } from "@/lib/tailor";
import { savePostWithVariants, fetchPostsForTenant } from "@/lib/persist-post";

export const dynamic = "force-dynamic";

// GET /api/posts → list posts for tenant
export async function GET() {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const posts = await fetchPostsForTenant(tenant.id);
  return NextResponse.json({ posts });
}

// POST /api/posts → tailor + save in one shot
// body: { title, body, sourceUrl?, imageUrl?, save?: boolean (default true) }
export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!body?.title || !body?.body) {
    return NextResponse.json(
      { error: "title and body required" },
      { status: 400 },
    );
  }

  const variants = await tailorPost({
    title: String(body.title),
    body: String(body.body),
    sourceUrl: body.sourceUrl ? String(body.sourceUrl) : undefined,
  });

  if (body.save === false) {
    return NextResponse.json({ saved: false, variants });
  }

  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const result = await savePostWithVariants({
    tenantId: tenant.id,
    source: {
      title: String(body.title),
      body: String(body.body),
      sourceUrl: body.sourceUrl ? String(body.sourceUrl) : undefined,
      imageUrl: body.imageUrl ? String(body.imageUrl) : undefined,
    },
    variants,
  });
  return NextResponse.json({ saved: true, ...result });
}

import { NextResponse } from "next/server";
import { getServerTenant } from "@naples/db/next";
import { listFeeds, createFeed } from "@/lib/persist";

export const dynamic = "force-dynamic";

export async function GET() {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  try {
    const feeds = await listFeeds(tenant.id);
    return NextResponse.json({ feeds });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const url: string = String(body?.url ?? "").trim();
  if (!url || !/^https?:\/\//i.test(url)) {
    return NextResponse.json({ error: "valid http(s) url required" }, { status: 400 });
  }
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  try {
    const feed = await createFeed({
      tenantId: tenant.id,
      url,
      title: typeof body?.title === "string" ? body.title : null,
      category: typeof body?.category === "string" ? body.category : null,
    });
    return NextResponse.json({ feed }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getServerTenant } from "@naples/db/next";
import { recategorizeEmail } from "@/lib/persist-email";
import { isValidCategory } from "@/lib/categories";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!isValidCategory(body?.category)) {
    return NextResponse.json(
      { error: "invalid category" },
      { status: 400 },
    );
  }
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  try {
    const row = await recategorizeEmail({
      emailId: params.id,
      tenantId: tenant.id,
      category: body.category,
      reason: body.reason,
    });
    return NextResponse.json({ ok: true, email: row });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 },
    );
  }
}

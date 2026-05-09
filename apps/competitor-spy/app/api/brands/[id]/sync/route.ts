import { NextResponse } from "next/server";
import { getServerTenant } from "@naples/db/next";
import { syncBrand } from "@/lib/persist";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  try {
    const result = await syncBrand({
      tenantId: tenant.id,
      brandId: params.id,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getServerTenant } from "@naples/db/next";
import { archiveEmail } from "@/lib/persist-email";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  try {
    await archiveEmail({ emailId: params.id, tenantId: tenant.id });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { getServerTenant } from "@naples/db/next";
import {
  getProposalById,
  updateProposal,
  approveAndIssueToken,
  markSent,
} from "@/lib/persist-proposal";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const proposal = await getProposalById(tenant.id, params.id);
  if (!proposal) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ proposal });
}

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

  // Action verbs: approve, send. Otherwise treat as field patch.
  if (body?.action === "approve") {
    try {
      const proposal = await approveAndIssueToken({
        tenantId: tenant.id,
        id: params.id,
        expiresInDays: typeof body.expiresInDays === "number" ? body.expiresInDays : 30,
      });
      return NextResponse.json({ proposal });
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
  }
  if (body?.action === "send") {
    try {
      const proposal = await markSent({ tenantId: tenant.id, id: params.id });
      return NextResponse.json({ proposal });
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
  }
  try {
    const proposal = await updateProposal({
      tenantId: tenant.id,
      id: params.id,
      patch: body,
    });
    return NextResponse.json({ proposal });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

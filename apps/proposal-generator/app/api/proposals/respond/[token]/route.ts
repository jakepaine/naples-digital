import { NextResponse } from "next/server";
import { recordResponse, getProposalByToken } from "@/lib/persist-proposal";

export const dynamic = "force-dynamic";

// Public endpoint — customer hits this from the hosted proposal page to
// accept or reject. No auth, but token guards access.
export async function POST(
  req: Request,
  { params }: { params: { token: string } },
) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (body?.status !== "accepted" && body?.status !== "rejected") {
    return NextResponse.json(
      { error: "status must be 'accepted' or 'rejected'" },
      { status: 400 },
    );
  }
  const proposal = await getProposalByToken(params.token);
  if (!proposal) {
    return NextResponse.json({ error: "proposal not found" }, { status: 404 });
  }
  if (proposal.status === "accepted" || proposal.status === "rejected") {
    return NextResponse.json(
      { error: "already responded" },
      { status: 409 },
    );
  }
  if (proposal.expires_at && new Date(proposal.expires_at) < new Date()) {
    return NextResponse.json({ error: "proposal expired" }, { status: 410 });
  }
  const updated = await recordResponse({
    publicToken: params.token,
    status: body.status,
  });
  return NextResponse.json({ proposal: updated });
}

import { NextResponse } from "next/server";
import { createLead, addLeadEmail, listLeads } from "@naples/db";
import { getRequestTenantId } from "@naples/db/next";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  name: string;
  email?: string;
  type?: string;
  goal?: string;
  value?: number;
  source?: string;
}

export async function GET(req: Request) {
  const tid = await getRequestTenantId(req);
  const leads = await listLeads(tid);
  return NextResponse.json({ leads });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as Body | null;
  if (!body?.name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }
  const tid = await getRequestTenantId(req);
  const lead = await createLead(tid, {
    name: body.name,
    type: body.type ?? "Prospect",
    goal: body.goal ?? "Discovery",
    value: body.value ?? 0,
    source: body.source ?? "Manual",
  });
  if (!lead) return NextResponse.json({ error: "Create failed" }, { status: 500 });

  if (body.email) {
    await addLeadEmail(tid, lead.id, body.email, true);
  }

  return NextResponse.json({ lead });
}

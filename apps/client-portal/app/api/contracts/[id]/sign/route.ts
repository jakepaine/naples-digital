import { NextResponse } from "next/server";
import { signContract } from "@naples/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body { name: string; initials: string; typed: string }

export async function POST(req: Request, { params }: { params: { id: string } }) {
  let body: Body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
  const ok = await signContract(params.id, {
    name: body.name,
    initials: body.initials,
    typed: body.typed,
    ip,
  });
  return NextResponse.json({ ok });
}

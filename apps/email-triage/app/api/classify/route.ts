import { NextResponse } from "next/server";
import { classifyEmail } from "@/lib/classify";
import { MOCK_EMAILS } from "@/lib/mock-emails";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const email =
    body.email ?? MOCK_EMAILS.find((e) => e.id === body.id) ?? null;
  if (!email)
    return NextResponse.json(
      { error: "missing 'email' or unknown 'id'" },
      { status: 400 },
    );

  const result = await classifyEmail(email);
  return NextResponse.json({ ...email, ...result });
}

export async function GET() {
  // Convenience: return the full mock inbox classified.
  const enriched = await Promise.all(
    MOCK_EMAILS.map(async (e) => ({ ...e, ...(await classifyEmail(e)) })),
  );
  return NextResponse.json(enriched);
}

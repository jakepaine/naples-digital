import { NextResponse } from "next/server";
import { classifyEmail } from "@/lib/classify";

export const dynamic = "force-dynamic";

// Pure classifier endpoint — does NOT persist. Useful for previewing how an
// email would be triaged (e.g. paste-in tester for tenants tuning categories).
// For the full ingest+classify+persist flow, use POST /api/sync.
export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const email = body?.email ?? body;
  if (!email?.from_email || !email?.subject) {
    return NextResponse.json(
      { error: "email.from_email and email.subject required" },
      { status: 400 },
    );
  }
  const result = await classifyEmail({
    from_email: email.from_email,
    from_name: email.from_name ?? null,
    subject: email.subject,
    preview: email.preview ?? null,
    body_text: email.body_text ?? null,
  });
  return NextResponse.json(result);
}

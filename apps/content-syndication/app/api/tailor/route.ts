import { NextResponse } from "next/server";
import { tailorPost } from "@/lib/tailor";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!body.title || !body.body) {
    return NextResponse.json(
      { error: "title and body required" },
      { status: 400 },
    );
  }
  const results = await tailorPost({
    title: String(body.title),
    body: String(body.body),
    sourceUrl: body.sourceUrl ? String(body.sourceUrl) : undefined,
  });
  return NextResponse.json({ results });
}

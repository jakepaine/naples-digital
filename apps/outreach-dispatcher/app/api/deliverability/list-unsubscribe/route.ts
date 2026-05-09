// Helper endpoint — emit the RFC 8058 List-Unsubscribe header pair for
// the requesting tenant. Caller passes its sending domain + the
// unsubscribe destination (mailto + URL); we return the two headers
// ready to inject into outbound mail. Doesn't need to be tenant-scoped
// strictly — the construction is pure — but we keep the route under
// /api/deliverability/* for discoverability + log scoping.
//
// Body:
//   { mailto: "unsubscribe@yourdomain.com",
//     url: "https://yourdomain.com/u/<token>",
//     mailto_subject?: "unsubscribe" }

import { NextResponse } from "next/server";
import {
  buildListUnsubscribeHeaders,
  checkListUnsubscribeCompliance,
} from "@naples/outreach/list-unsubscribe";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const mailto: string | undefined = body?.mailto;
  const url: string | undefined = body?.url;
  if (!mailto) {
    return NextResponse.json({ error: "mailto required" }, { status: 400 });
  }
  if (!url) {
    return NextResponse.json({ error: "url required" }, { status: 400 });
  }
  try {
    const headers = buildListUnsubscribeHeaders({
      mailto,
      url,
      mailtoSubject:
        typeof body?.mailto_subject === "string" ? body.mailto_subject : undefined,
    });
    const compliance = checkListUnsubscribeCompliance(
      headers as unknown as Record<string, string>,
    );
    return NextResponse.json({ ok: true, headers, compliance });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 400 },
    );
  }
}

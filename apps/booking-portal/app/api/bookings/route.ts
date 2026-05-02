import { NextResponse } from "next/server";
import { createBooking } from "@naples/db";
import { getRequestTenantId } from "@naples/db/next";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Approximate revenue used to populate the revenue column when a booking is created
// from the public wizard. Real production would price per shoot type / hours; for
// the demo we map package id → midpoint of its public range.
const PACKAGE_REVENUE: Record<string, number> = {
  day: 250,
  half: 175,
  "real-estate": 450,
  membership: 1500,
  corporate: 3500,
  event: 1000,
};

const PACKAGE_NAMES: Record<string, string> = {
  day: "Day Rate Session",
  half: "Half Day Session",
  "real-estate": "Real Estate Session",
  membership: "Monthly Studio Membership",
  corporate: "Corporate Package",
  event: "Event Night",
};

interface Body {
  packageId: string;
  date: string;
  time?: string;
  fullName: string;
  company?: string;
  email: string;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.packageId || !body.date || !body.fullName || !body.email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const client = body.company?.trim() ? `${body.fullName} (${body.company})` : body.fullName;
  const packageName = PACKAGE_NAMES[body.packageId] ?? body.packageId;
  const revenue = PACKAGE_REVENUE[body.packageId] ?? 250;

  const tid = await getRequestTenantId(req);
  const created = await createBooking(tid, {
    client,
    package: packageName,
    date: body.date,
    time: body.time,
    revenue,
    status: "pending",
  });

  if (!created) {
    // Supabase not configured or insert failed — wizard should still succeed visually.
    return NextResponse.json({ ok: true, booking: null, persisted: false });
  }

  return NextResponse.json({ ok: true, booking: created, persisted: true });
}

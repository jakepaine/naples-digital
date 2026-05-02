import { NextResponse } from "next/server";
import { upsertTenantIntegration, listTenantIntegrations } from "@naples/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const integrations = await listTenantIntegrations(params.id);
  return NextResponse.json({ integrations });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  if (!body?.kind) {
    return NextResponse.json({ error: "kind required" }, { status: 400 });
  }
  // For now we store the secret directly in secret_ref. In production this should
  // write to Supabase Vault or a KMS and store the ref. v1: direct storage on row,
  // service-role only access — never exposed to client.
  const secret_ref = typeof body.secret === "string" && body.secret.length > 0 ? body.secret : undefined;
  const integration = await upsertTenantIntegration({
    tenant_id: params.id,
    kind: body.kind,
    config: body.config ?? {},
    secret_ref,
    status: secret_ref ? "verified" : "pending",
  });
  if (!integration) return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  // Don't echo the secret back
  const { secret_ref: _omit, ...safe } = integration;
  return NextResponse.json({ integration: { ...safe, secret_ref: _omit ? "***" : null } });
}

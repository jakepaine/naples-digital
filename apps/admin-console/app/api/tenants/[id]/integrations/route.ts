import { NextResponse } from "next/server";
import {
  upsertTenantIntegration,
  listTenantIntegrations,
  setTenantSecret,
  type TenantIntegrationKind,
} from "@naples/db";

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

  const kind = body.kind as TenantIntegrationKind;
  const config = body.config ?? {};
  const secret = typeof body.secret === "string" && body.secret.length > 0 ? body.secret : null;

  // If a secret was provided, route through Supabase Vault (set_tenant_secret RPC).
  // The plaintext is encrypted at rest; tenant_integrations.secret_ref holds the
  // vault.secrets uuid. Without a secret, just upsert config (no vault touch).
  if (secret) {
    const result = await setTenantSecret(params.id, kind, secret, config);
    if (!result) return NextResponse.json({ error: "Failed to save secret" }, { status: 500 });
    return NextResponse.json({
      integration: {
        id: result.id,
        tenant_id: params.id,
        kind,
        status: result.status,
        last_verified_at: result.last_verified_at,
        secret_ref: "***",
      },
    });
  }

  // Config-only update (no secret rotation)
  const integration = await upsertTenantIntegration({
    tenant_id: params.id,
    kind,
    config,
    status: "pending",
  });
  if (!integration) return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  return NextResponse.json({
    integration: { ...integration, secret_ref: integration.secret_ref ? "***" : null },
  });
}

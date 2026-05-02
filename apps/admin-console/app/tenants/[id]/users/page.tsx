import { notFound } from "next/navigation";
import { getTenantById, createServerClient } from "@naples/db";
import { TenantUsersManager } from "@/components/TenantUsersManager";

export const dynamic = "force-dynamic";

type TenantUser = { id: string; user_email: string; role: string; created_at: string };

export default async function UsersPage({ params }: { params: { id: string } }) {
  const t = await getTenantById(params.id);
  if (!t) return notFound();

  const sb = createServerClient();
  const { data: users } = await sb.from("tenant_users")
    .select("id, user_email, role, created_at")
    .eq("tenant_id", t.id).order("created_at");

  return (
    <main className="mx-auto max-w-3xl px-8 py-12">
      <div className="text-[10px] uppercase tracking-[0.32em] text-gold">{t.name}</div>
      <h1 className="mt-2 font-heading text-5xl tracking-broadcast text-cream">Users</h1>
      <div className="mt-3 h-px w-16 bg-gold" />
      <p className="mt-4 max-w-xl text-sm text-cream/70">
        People who can sign into this tenant's apps. Roles: <code className="font-mono">owner</code> (full),
        <code className="font-mono"> operator</code> (read+write data), <code className="font-mono">viewer</code> (read only).
      </p>
      <div className="mt-8">
        <TenantUsersManager tenantId={t.id} initial={(users ?? []) as TenantUser[]} />
      </div>
    </main>
  );
}

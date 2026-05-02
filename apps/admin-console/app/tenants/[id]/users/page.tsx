import { notFound } from "next/navigation";
import { getTenantById } from "@naples/db";
import { Card } from "@naples/ui";

export const dynamic = "force-dynamic";

export default async function UsersPage({ params }: { params: { id: string } }) {
  const t = await getTenantById(params.id);
  if (!t) return notFound();

  return (
    <main className="mx-auto max-w-3xl px-8 py-12">
      <div className="text-[10px] uppercase tracking-[0.32em] text-gold">{t.name}</div>
      <h1 className="mt-2 font-heading text-5xl tracking-broadcast text-cream">Users</h1>
      <div className="mt-3 h-px w-16 bg-gold" />
      <Card className="mt-8">
        <p className="text-sm text-cream/70">User management UI lands in Phase 8b. For now, add rows to <code className="font-mono text-xs text-gold">tenant_users</code> directly via Supabase SQL editor.</p>
      </Card>
    </main>
  );
}

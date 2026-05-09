import { listSlaQueue } from "@/lib/persist";
import { getServerTenant } from "@naples/db/next";
import { Dashboard } from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default async function Page() {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const items = await listSlaQueue({ tenantId: tenant.id });
  return (
    <Dashboard
      initialItems={items}
      tenant={{ id: tenant.id, slug: tenant.slug, name: tenant.name }}
    />
  );
}

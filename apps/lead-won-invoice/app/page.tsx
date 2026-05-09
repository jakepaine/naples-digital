import { Pipeline } from "@/components/Pipeline";
import { fetchWonLeadsForTenant } from "@/lib/won-leads";
import { getServerTenant } from "@naples/db/next";

export const dynamic = "force-dynamic";

export default async function Page() {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const leads = await fetchWonLeadsForTenant(tenant.id);
  return (
    <Pipeline
      initialLeads={leads}
      tenant={{ id: tenant.id, slug: tenant.slug, name: tenant.name }}
    />
  );
}

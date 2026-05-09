import { listProposals, listLeadsForTenant } from "@/lib/persist-proposal";
import { getServerTenant } from "@naples/db/next";
import { Builder } from "@/components/Builder";

export const dynamic = "force-dynamic";

export default async function Page() {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const [proposals, leads] = await Promise.all([
    listProposals(tenant.id),
    listLeadsForTenant(tenant.id),
  ]);
  return (
    <Builder
      initialProposals={proposals}
      leads={leads}
      tenant={{ id: tenant.id, slug: tenant.slug, name: tenant.name }}
    />
  );
}

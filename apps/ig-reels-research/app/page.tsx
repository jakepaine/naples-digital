import { listCreators, listReels } from "@/lib/persist";
import { getServerTenant } from "@naples/db/next";
import { ResearchView } from "@/components/ResearchView";

export const dynamic = "force-dynamic";

export default async function Page() {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const [creators, reels] = await Promise.all([
    listCreators(tenant.id),
    listReels(tenant.id),
  ]);
  return (
    <ResearchView
      initialCreators={creators}
      initialReels={reels}
      tenant={{ id: tenant.id, slug: tenant.slug, name: tenant.name }}
    />
  );
}

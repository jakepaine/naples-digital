import { listFeeds, listItems } from "@/lib/persist";
import { getServerTenant } from "@naples/db/next";
import { CommentaryView } from "@/components/CommentaryView";

export const dynamic = "force-dynamic";

export default async function Page() {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const [feeds, items] = await Promise.all([
    listFeeds(tenant.id),
    listItems(tenant.id),
  ]);
  return (
    <CommentaryView
      initialFeeds={feeds}
      initialItems={items}
      tenant={{ id: tenant.id, slug: tenant.slug, name: tenant.name }}
    />
  );
}

import { fetchPostsForTenant } from "@/lib/persist-post";
import { getServerTenant } from "@naples/db/next";
import { App } from "@/components/App";

export const dynamic = "force-dynamic";

export default async function Page() {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const posts = await fetchPostsForTenant(tenant.id);
  return (
    <App
      initialPosts={posts}
      tenant={{ id: tenant.id, slug: tenant.slug, name: tenant.name }}
    />
  );
}

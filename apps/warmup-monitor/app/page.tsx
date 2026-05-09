import { getServerTenant } from "@naples/db/next";
import { loadWarmupForTenant } from "@/lib/load-warmup";
import { Monitor } from "@/components/Monitor";

export const dynamic = "force-dynamic";

export default async function Page() {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const summary = await loadWarmupForTenant(tenant.id);
  return (
    <Monitor
      initialSummary={summary}
      tenant={{ id: tenant.id, slug: tenant.slug, name: tenant.name }}
    />
  );
}

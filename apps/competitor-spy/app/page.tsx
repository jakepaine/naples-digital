import { listBrands, listAdsForTenant } from "@/lib/persist";
import { getServerTenant } from "@naples/db/next";
import { App } from "@/components/App";

export const dynamic = "force-dynamic";

export default async function Page() {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const [brands, ads] = await Promise.all([
    listBrands(tenant.id),
    listAdsForTenant(tenant.id),
  ]);
  const apifyConfigured = !!process.env.APIFY_TOKEN;
  return (
    <App
      initialBrands={brands}
      initialAds={ads}
      tenant={{ id: tenant.id, slug: tenant.slug, name: tenant.name }}
      apifyConfigured={apifyConfigured}
    />
  );
}

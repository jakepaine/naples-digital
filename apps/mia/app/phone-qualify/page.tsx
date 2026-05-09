import { listQualifications } from "@/lib/phone-qualifications";
import { getServerTenant } from "@naples/db/next";
import { PhoneQualifyView } from "@/components/PhoneQualifyView";

export const dynamic = "force-dynamic";

export default async function Page() {
  const tenant = await getServerTenant({ fallbackSlug: "mia" });
  const items = await listQualifications(tenant.id);
  return (
    <PhoneQualifyView
      initialItems={items}
      tenant={{ id: tenant.id, slug: tenant.slug, name: tenant.name }}
    />
  );
}

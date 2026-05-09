import { getServerTenant } from "@naples/db/next";
import { getVoiceProfile } from "@/lib/persist";
import { Calibrator } from "@/components/Calibrator";

export const dynamic = "force-dynamic";

export default async function Page() {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const profile = await getVoiceProfile(tenant.id);
  return (
    <Calibrator
      initialProfile={profile}
      tenant={{ id: tenant.id, slug: tenant.slug, name: tenant.name }}
    />
  );
}

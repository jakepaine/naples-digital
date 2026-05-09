import { listJobs, listSourceConfigStatus } from "@/lib/persist";
import { getServerTenant } from "@naples/db/next";
import { App } from "@/components/App";

export const dynamic = "force-dynamic";

export default async function Page() {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const [jobs, sourceStatus] = await Promise.all([
    listJobs(tenant.id),
    listSourceConfigStatus(tenant.id),
  ]);
  return (
    <App
      initialJobs={jobs}
      initialSourceStatus={sourceStatus}
      tenant={{ id: tenant.id, slug: tenant.slug, name: tenant.name }}
    />
  );
}

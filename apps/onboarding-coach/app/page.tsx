import { getActiveRun, listCompletions } from "@/lib/persist";
import { getServerTenant } from "@naples/db/next";
import { Coach } from "@/components/Coach";

export const dynamic = "force-dynamic";

export default async function Page() {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const run = await getActiveRun(tenant.id);
  const completions = run
    ? await listCompletions({ tenantId: tenant.id, runId: run.id })
    : [];
  return (
    <Coach
      initialRun={run}
      initialCompletions={completions}
      tenant={{ id: tenant.id, slug: tenant.slug, name: tenant.name }}
    />
  );
}

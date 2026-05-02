import { Board } from "@/components/Board";
import { listLeads } from "@naples/db";
import { getServerTenantId } from "@naples/db/next";

export const dynamic = "force-dynamic";

export default async function Page() {
  const tid = await getServerTenantId();
  const leads = await listLeads(tid);
  return <Board initialLeads={leads} />;
}

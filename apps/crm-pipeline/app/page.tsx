import { Board } from "@/components/Board";
import { listLeads } from "@naples/db";

export const dynamic = "force-dynamic";

export default async function Page() {
  const leads = await listLeads();
  return <Board initialLeads={leads} />;
}

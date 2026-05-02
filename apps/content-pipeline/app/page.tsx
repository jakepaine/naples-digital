import { Tracker } from "@/components/Tracker";
import { listEpisodes } from "@naples/db";
import { getServerTenantId } from "@naples/db/next";

export const dynamic = "force-dynamic";

export default async function Page() {
  const tid = await getServerTenantId();
  const episodes = await listEpisodes(tid);
  return <Tracker initialEpisodes={episodes} />;
}

import { Tracker } from "@/components/Tracker";
import { listEpisodes } from "@naples/db";

export const dynamic = "force-dynamic";

export default async function Page() {
  const episodes = await listEpisodes();
  return <Tracker initialEpisodes={episodes} />;
}

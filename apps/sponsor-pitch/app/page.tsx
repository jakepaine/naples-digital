import { listSponsorPitches } from "@naples/db";
import { getServerTenantId } from "@naples/db/next";
import { Builder } from "@/components/Builder";

export const dynamic = "force-dynamic";

export default async function Page() {
  const tid = await getServerTenantId();
  const recent = await listSponsorPitches(tid, 10);
  return <Builder recentPitches={recent} />;
}

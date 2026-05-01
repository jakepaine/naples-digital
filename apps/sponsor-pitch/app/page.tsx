import { listSponsorPitches } from "@naples/db";
import { Builder } from "@/components/Builder";

export const dynamic = "force-dynamic";

export default async function Page() {
  const recent = await listSponsorPitches(10);
  return <Builder recentPitches={recent} />;
}

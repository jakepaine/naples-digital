import { Inbox } from "@/components/Inbox";
import { fetchInboxForTenant } from "@/lib/inbox-query";
import { getServerTenant } from "@naples/db/next";

export const dynamic = "force-dynamic";

export default async function Page() {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const emails = await fetchInboxForTenant(tenant.id, { limit: 100 });
  return (
    <Inbox
      initialEmails={emails}
      tenant={{ id: tenant.id, slug: tenant.slug, name: tenant.name }}
    />
  );
}

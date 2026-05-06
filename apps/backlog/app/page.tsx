import { listTenants, listBacklogItems, type BacklogItem } from "@naples/db";
import type { Tenant } from "@naples/db/tenant";
import { BacklogBoard } from "@/components/BacklogBoard";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: { tenant?: string };
}) {
  const tenants = await listTenants();
  const activeSlug = searchParams.tenant ?? tenants[0]?.slug ?? "239live";
  const activeTenant = tenants.find((t) => t.slug === activeSlug) ?? tenants[0];

  let items: BacklogItem[] = [];
  if (activeTenant) {
    items = await listBacklogItems(activeTenant.id);
  }

  const initialView = {
    tenants: tenants.map(toClientTenant),
    activeSlug: activeTenant?.slug ?? activeSlug,
    items,
  };

  return <BacklogBoard initial={initialView} />;
}

function toClientTenant(t: Tenant): ClientTenant {
  const brand = (t.brand ?? {}) as Record<string, unknown>;
  return {
    id: t.id,
    slug: t.slug,
    name: t.name,
    accent: (brand.accent_color as string) || (brand.primary_color as string) || "#E8192C",
    plan: t.plan,
  };
}

export type ClientTenant = {
  id: string;
  slug: string;
  name: string;
  accent: string;
  plan: string;
};

import { notFound } from "next/navigation";
import { getSponsorByToken } from "@naples/db";
import { Portal } from "@/components/Portal";

export const dynamic = "force-dynamic";

export default async function SponsorPortalPage({ params }: { params: { token: string } }) {
  const data = await getSponsorByToken(params.token);
  if (!data) return notFound();
  return <Portal sponsor={data.sponsor} metrics={data.metrics} />;
}

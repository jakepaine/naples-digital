import Link from "next/link";
import { listContractsForEmail, listInvoicesForEmail } from "@naples/db";
import { PortalNav } from "@/components/PortalNav";

export const dynamic = "force-dynamic";

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { email: string };
}) {
  const email = decodeURIComponent(params.email);
  const [contracts, invoices] = await Promise.all([
    listContractsForEmail(email),
    listInvoicesForEmail(email),
  ]);

  const clientName = contracts[0]?.client_name ?? invoices[0]?.client_name ?? email;
  const unsignedCount = contracts.filter((c) => c.status === "sent").length;
  const openInvoiceCount = invoices.filter((i) => i.status === "open" || i.status === "overdue").length;

  return (
    <div className="min-h-screen">
      <header className="border-b border-card-border bg-bg/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="relative inline-flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-live-pulse rounded-full bg-live opacity-90" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-live" />
            </span>
            <span className="font-heading text-lg tracking-broadcast text-cream">
              239<span className="text-live"> </span>LIVE
            </span>
            <span className="hidden text-[10px] uppercase tracking-[0.2em] text-muted md:inline">
              Client Portal
            </span>
          </Link>
          <div className="flex items-center gap-3 text-right">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted">Signed in</div>
              <div className="text-sm text-cream">{clientName}</div>
            </div>
            <Link href="/" className="text-[11px] uppercase tracking-wider text-muted hover:text-cream">
              Switch
            </Link>
          </div>
        </div>
        <PortalNav email={params.email} unsigned={unsignedCount} openInvoices={openInvoiceCount} />
      </header>

      {children}
    </div>
  );
}

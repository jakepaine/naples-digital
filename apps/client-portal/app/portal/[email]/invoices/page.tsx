import Link from "next/link";
import { Card, Badge } from "@naples/ui";
import { listInvoicesForEmail } from "@naples/db";
import { Receipt, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InvoicesPage({ params }: { params: { email: string } }) {
  const email = decodeURIComponent(params.email);
  const invoices = await listInvoicesForEmail(email);
  const totalOpen = invoices.filter((i) => i.status === "open" || i.status === "overdue").reduce((s, i) => s + Number(i.total), 0);
  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.total), 0);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-8">
        <div className="text-[10px] uppercase tracking-[0.32em] text-live">Billing</div>
        <h1 className="mt-2 font-heading text-5xl tracking-broadcast text-cream">Invoices</h1>
        <div className="mt-3 h-px w-16 bg-live" />
      </header>

      <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Stat label="Lifetime paid" value={`$${totalPaid.toLocaleString()}`} sub="" tone="emerald" />
        <Stat label="Outstanding" value={`$${totalOpen.toLocaleString()}`} sub={totalOpen > 0 ? "Action required" : "All clear"} tone={totalOpen > 0 ? "live" : "cream"} />
        <Stat label="Total invoices" value={String(invoices.length)} sub="" />
      </section>

      {invoices.length === 0 ? (
        <Card><p className="text-sm text-muted">No invoices yet.</p></Card>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => (
            <Link key={inv.id} href={`/portal/${params.email}/invoices/${inv.id}`} className="group block">
              <Card className="transition-colors group-hover:border-live/60">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="border border-live/30 bg-live/5 p-3 text-live">
                      <Receipt className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="font-heading text-xl tracking-broadcast text-cream">{inv.number}</div>
                        <StatusBadge status={inv.status} />
                      </div>
                      <div className="mt-1 text-sm text-cream/70">{inv.description}</div>
                      <div className="mt-2 text-[11px] uppercase tracking-wider text-muted">
                        Issued {new Date(inv.issued_at).toLocaleDateString()}
                        {inv.due_at && ` · Due ${new Date(inv.due_at).toLocaleDateString()}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-heading text-2xl tracking-broadcast text-cream">${Number(inv.total).toLocaleString()}</div>
                    <ChevronRight className="ml-auto mt-1 h-4 w-4 text-muted transition-colors group-hover:text-live" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

function Stat({ label, value, sub, tone = "cream" }: { label: string; value: string; sub: string; tone?: "cream" | "live" | "emerald" }) {
  const cls = tone === "live" ? "text-live" : tone === "emerald" ? "text-emerald" : "text-cream";
  return (
    <Card>
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted">{label}</div>
      <div className={`mt-2 font-heading text-3xl tracking-broadcast ${cls}`}>{value}</div>
      {sub && <div className="mt-1 text-[11px] text-muted">{sub}</div>}
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "paid") return <Badge tone="emerald">Paid</Badge>;
  if (status === "overdue") return <Badge tone="rose">Overdue</Badge>;
  if (status === "void") return <Badge tone="muted">Void</Badge>;
  if (status === "draft") return <Badge tone="muted">Draft</Badge>;
  return <Badge tone="gold">Open</Badge>;
}

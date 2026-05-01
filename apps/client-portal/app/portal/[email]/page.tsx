import Link from "next/link";
import { Card, Badge } from "@naples/ui";
import { listContractsForEmail, listInvoicesForEmail, listSubmissionsForEmail } from "@naples/db";
import { ArrowRight, FileSignature, Receipt, Film } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OverviewPage({ params }: { params: { email: string } }) {
  const email = decodeURIComponent(params.email);
  const [contracts, invoices, submissions] = await Promise.all([
    listContractsForEmail(email),
    listInvoicesForEmail(email),
    listSubmissionsForEmail(email),
  ]);

  const clientName = contracts[0]?.client_name ?? invoices[0]?.client_name ?? email;

  if (contracts.length === 0 && invoices.length === 0 && submissions.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="font-heading text-4xl tracking-broadcast text-cream">No records found</h1>
        <div className="mx-auto mt-3 h-px w-16 bg-live" />
        <p className="mt-4 text-sm text-cream/70">
          We don't have anything on file for <span className="text-live">{email}</span> yet.
        </p>
        <p className="mt-2 text-xs text-muted">
          If you're a 239 Live client and think this is wrong, reach out at hello@239live.com.
        </p>
      </main>
    );
  }

  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.total), 0);
  const totalOutstanding = invoices.filter((i) => i.status === "open" || i.status === "overdue").reduce((s, i) => s + Number(i.total), 0);
  const inProgress = submissions.filter((s) => s.status !== "delivered").length;

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <header className="mb-10">
        <div className="text-[10px] uppercase tracking-[0.32em] text-live">Welcome back</div>
        <h1 className="mt-2 font-heading text-5xl tracking-broadcast text-cream">{clientName}</h1>
        <div className="mt-3 h-px w-16 bg-live" />
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Stat label="Lifetime billed" value={`$${(totalPaid + totalOutstanding).toLocaleString()}`} sub={`${invoices.length} invoice${invoices.length === 1 ? "" : "s"}`} />
        <Stat label="Outstanding balance" value={`$${totalOutstanding.toLocaleString()}`} sub={totalOutstanding > 0 ? "Action required" : "All clear"} tone={totalOutstanding > 0 ? "live" : "emerald"} />
        <Stat label="Content in flight" value={String(inProgress)} sub={`${submissions.length} total submissions`} />
      </section>

      <section className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Quick
          href={`/portal/${params.email}/contracts`}
          icon={<FileSignature className="h-5 w-5" />}
          label="Contracts"
          summary={contracts.length === 0 ? "No contracts" : `${contracts.length} on file · ${contracts.filter((c) => c.status === "signed").length} signed`}
          alert={contracts.filter((c) => c.status === "sent").length > 0 ? `${contracts.filter((c) => c.status === "sent").length} awaiting signature` : null}
        />
        <Quick
          href={`/portal/${params.email}/invoices`}
          icon={<Receipt className="h-5 w-5" />}
          label="Invoices"
          summary={invoices.length === 0 ? "No invoices" : `${invoices.length} total · ${invoices.filter((i) => i.status === "paid").length} paid`}
          alert={invoices.filter((i) => i.status === "open").length > 0 ? `${invoices.filter((i) => i.status === "open").length} open · pay now` : null}
        />
        <Quick
          href={`/portal/${params.email}/content`}
          icon={<Film className="h-5 w-5" />}
          label="Content"
          summary={submissions.length === 0 ? "Nothing submitted" : `${submissions.length} total · ${submissions.filter((s) => s.status === "delivered").length} delivered`}
          alert={submissions.filter((s) => s.status === "editing" || s.status === "review").length > 0 ? `${submissions.filter((s) => s.status === "editing" || s.status === "review").length} in edit queue` : null}
        />
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted">Recent activity</div>
            <h2 className="mt-1 font-heading text-2xl tracking-broadcast text-cream">Latest on Your Account</h2>
          </div>
        </div>

        <div className="space-y-3">
          {[
            ...contracts.slice(0, 3).map((c) => ({ kind: "contract" as const, when: c.signed_at ?? c.sent_at, item: c })),
            ...invoices.slice(0, 3).map((i) => ({ kind: "invoice" as const, when: i.paid_at ?? i.issued_at, item: i })),
            ...submissions.slice(0, 3).map((s) => ({ kind: "submission" as const, when: s.delivered_at ?? s.submitted_at, item: s })),
          ]
            .sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime())
            .slice(0, 6)
            .map((row, i) => (
              <ActivityRow key={i} row={row} email={params.email} />
            ))}
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value, sub, tone = "cream" }: { label: string; value: string; sub: string; tone?: "cream" | "live" | "emerald" }) {
  const cls = tone === "live" ? "text-live" : tone === "emerald" ? "text-emerald" : "text-cream";
  return (
    <Card>
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted">{label}</div>
      <div className={`mt-2 font-heading text-3xl tracking-broadcast ${cls}`}>{value}</div>
      <div className="mt-1 text-[11px] text-muted">{sub}</div>
    </Card>
  );
}

function Quick({ href, icon, label, summary, alert }: { href: string; icon: React.ReactNode; label: string; summary: string; alert: string | null }) {
  return (
    <Link href={href} className="group block">
      <Card className="transition-colors group-hover:border-live/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-live">{icon}<span className="font-heading text-xl tracking-broadcast text-cream">{label}</span></div>
          <ArrowRight className="h-4 w-4 text-muted transition-colors group-hover:text-live" />
        </div>
        <p className="mt-3 text-sm text-cream/80">{summary}</p>
        {alert && (
          <div className="mt-3">
            <Badge tone="gold">{alert}</Badge>
          </div>
        )}
      </Card>
    </Link>
  );
}

interface ContractItem { id: string; package: string; status: string }
interface InvoiceItem { id: string; number: string; description: string; status: string; total: number | string }
interface SubmissionItem { id: string; title: string; status: string }

function ActivityRow({ row, email }: { row: { kind: "contract"; when: string; item: ContractItem } | { kind: "invoice"; when: string; item: InvoiceItem } | { kind: "submission"; when: string; item: SubmissionItem }; email: string }) {
  if (row.kind === "contract") {
    return (
      <Link href={`/portal/${email}/contracts/${row.item.id}`} className="group block">
        <div className="flex items-center justify-between border border-card-border bg-card/60 px-4 py-3 transition-colors group-hover:border-live/60">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-live">Contract · {row.item.status}</div>
            <div className="mt-0.5 text-sm text-cream">{row.item.package}</div>
          </div>
          <div className="text-[11px] text-muted">{relativeTime(row.when)}</div>
        </div>
      </Link>
    );
  }
  if (row.kind === "invoice") {
    return (
      <Link href={`/portal/${email}/invoices/${row.item.id}`} className="group block">
        <div className="flex items-center justify-between border border-card-border bg-card/60 px-4 py-3 transition-colors group-hover:border-live/60">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-live">Invoice · {row.item.status}</div>
            <div className="mt-0.5 text-sm text-cream">{row.item.number} · {row.item.description}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-cream">${Number(row.item.total).toLocaleString()}</div>
            <div className="text-[11px] text-muted">{relativeTime(row.when)}</div>
          </div>
        </div>
      </Link>
    );
  }
  return (
    <Link href={`/portal/${email}/content`} className="group block">
      <div className="flex items-center justify-between border border-card-border bg-card/60 px-4 py-3 transition-colors group-hover:border-live/60">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-live">Content · {row.item.status}</div>
          <div className="mt-0.5 text-sm text-cream">{row.item.title}</div>
        </div>
        <div className="text-[11px] text-muted">{relativeTime(row.when)}</div>
      </div>
    </Link>
  );
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

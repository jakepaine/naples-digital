import Link from "next/link";
import { Card, Badge } from "@naples/ui";
import { listContractsForEmail } from "@naples/db";
import { FileSignature, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ContractsPage({ params }: { params: { email: string } }) {
  const email = decodeURIComponent(params.email);
  const contracts = await listContractsForEmail(email);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-8">
        <div className="text-[10px] uppercase tracking-[0.32em] text-live">Agreements</div>
        <h1 className="mt-2 font-heading text-5xl tracking-broadcast text-cream">Contracts</h1>
        <div className="mt-3 h-px w-16 bg-live" />
        <p className="mt-4 max-w-xl text-sm text-cream/70">
          Every engagement with 239 Live runs through a signed agreement. Click any
          contract to view the full scope. Sign electronically — no email back-and-forth.
        </p>
      </header>

      {contracts.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">No contracts on file yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {contracts.map((c) => (
            <Link key={c.id} href={`/portal/${params.email}/contracts/${c.id}`} className="group block">
              <Card className="transition-colors group-hover:border-live/60">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="border border-live/30 bg-live/5 p-3 text-live">
                      <FileSignature className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="font-heading text-xl tracking-broadcast text-cream">{c.package}</div>
                        <StatusBadge status={c.status} />
                      </div>
                      <div className="mt-1 text-sm text-cream/70">{shorten(c.scope, 120)}</div>
                      <div className="mt-2 text-[11px] uppercase tracking-wider text-muted">
                        {c.status === "signed"
                          ? `Signed ${new Date(c.signed_at!).toLocaleDateString()}`
                          : `Sent ${new Date(c.sent_at).toLocaleDateString()}`}
                        {" · "}${Number(c.amount).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted transition-colors group-hover:text-live" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

function shorten(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max).trim() + "…";
}

function StatusBadge({ status }: { status: string }) {
  if (status === "signed") return <Badge tone="emerald">Signed</Badge>;
  if (status === "declined") return <Badge tone="rose">Declined</Badge>;
  return <Badge tone="gold">Awaiting Signature</Badge>;
}

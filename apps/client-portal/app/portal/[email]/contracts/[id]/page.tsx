import { notFound } from "next/navigation";
import { Card, Badge } from "@naples/ui";
import { getContract } from "@naples/db";
import { getServerTenantId } from "@naples/db/next";
import { SigningPad } from "@/components/SigningPad";
import { CheckCircle2, Lock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ContractDetail({ params }: { params: { email: string; id: string } }) {
  const tid = await getServerTenantId();
  const contract = await getContract(tid, params.id);
  if (!contract) return notFound();

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="text-[10px] uppercase tracking-[0.32em] text-live">{contract.status === "signed" ? "Executed Agreement" : "Awaiting Your Signature"}</div>
      <h1 className="mt-2 font-heading text-4xl tracking-broadcast text-cream md:text-5xl">{contract.package}</h1>
      <div className="mt-3 h-px w-16 bg-live" />

      <Card className="mt-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Client" value={contract.client_name} />
          <Field label="Email" value={contract.client_email} />
          <Field label="Amount" value={`$${Number(contract.amount).toLocaleString()}`} tone="live" />
        </div>

        <div className="mt-8 border-t border-card-border pt-6">
          <div className="text-[10px] uppercase tracking-[0.18em] text-live">Scope of Work</div>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-cream/90">{contract.scope}</p>
        </div>

        <div className="mt-8 border-t border-card-border pt-6">
          <div className="text-[10px] uppercase tracking-[0.18em] text-live">Terms</div>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-cream/90">
            {(contract.terms as string[]).map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ol>
        </div>
      </Card>

      {contract.status === "signed" ? (
        <Card className="mt-6">
          <div className="flex items-center gap-3">
            <div className="border border-emerald/40 bg-emerald/10 p-3 text-emerald">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <Badge tone="emerald">Executed</Badge>
              <h2 className="mt-2 font-heading text-2xl tracking-broadcast text-cream">Signature on file</h2>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 border-t border-card-border pt-6 md:grid-cols-3">
            <Field label="Signed by" value={contract.signature_name ?? "—"} />
            <Field label="Initials" value={contract.signature_initials ?? "—"} />
            <Field label="Signed at" value={contract.signed_at ? new Date(contract.signed_at).toLocaleString() : "—"} />
          </div>
          <div className="mt-6 border border-card-border bg-bg/60 p-6 text-center">
            <div className="font-signature text-5xl text-cream">{contract.signature_typed}</div>
            <div className="mt-3 text-[10px] uppercase tracking-[0.2em] text-muted">
              <Lock className="-mt-0.5 mr-1 inline h-3 w-3" />
              Cryptographically logged · IP {contract.ip_address ?? "—"}
            </div>
          </div>
        </Card>
      ) : (
        <SigningPad
          contractId={contract.id}
          email={params.email}
          defaultName={contract.client_name}
        />
      )}
    </main>
  );
}

function Field({ label, value, tone = "cream" }: { label: string; value: string; tone?: "cream" | "live" }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
      <div className={`mt-1 text-base ${tone === "live" ? "text-live" : "text-cream"}`}>{value}</div>
    </div>
  );
}

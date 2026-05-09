import { notFound } from "next/navigation";
import { getProposalByToken } from "@/lib/persist-proposal";
import { ResponseButtons } from "./ResponseButtons";

export const dynamic = "force-dynamic";

function fmtUSD(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export default async function PublicProposal({
  params,
}: {
  params: { token: string };
}) {
  const proposal = await getProposalByToken(params.token);
  if (!proposal) notFound();

  const totalCents = (proposal.pricing ?? []).reduce(
    (s, l) => s + (l.amount_cents ?? 0),
    0,
  );
  const expired =
    proposal.expires_at && new Date(proposal.expires_at) < new Date();
  const responded =
    proposal.status === "accepted" || proposal.status === "rejected";

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl p-12 print:p-6 space-y-10">
        <header className="border-b border-gray-200 pb-6">
          <div className="text-xs uppercase tracking-wider text-gray-500">
            Proposal
          </div>
          <h1 className="text-4xl font-bold mt-2">{proposal.title}</h1>
          {proposal.client_name && (
            <div className="text-sm text-gray-600 mt-2">
              Prepared for {proposal.client_name}
              {proposal.client_email && ` · ${proposal.client_email}`}
            </div>
          )}
          <div className="text-xs text-gray-400 mt-1">
            Issued {new Date(proposal.created_at).toLocaleDateString()}
            {proposal.expires_at && (
              <>
                {" · "}Valid until{" "}
                {new Date(proposal.expires_at).toLocaleDateString()}
              </>
            )}
          </div>
        </header>

        {proposal.intro && (
          <section>
            <p className="text-base leading-relaxed text-gray-800 whitespace-pre-wrap">
              {proposal.intro}
            </p>
          </section>
        )}

        {(proposal.scope_items ?? []).length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-3">Scope</h2>
            <ul className="space-y-2 text-gray-800">
              {proposal.scope_items.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-gray-400">{i + 1}.</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {(proposal.deliverables ?? []).length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-3">Deliverables</h2>
            <ul className="space-y-3 text-gray-800">
              {proposal.deliverables.map((d, i) => (
                <li key={i}>
                  <div className="font-semibold">{d.title}</div>
                  <div className="text-sm text-gray-600 mt-1">{d.description}</div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {(proposal.pricing ?? []).length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-3">Pricing</h2>
            <table className="w-full text-sm">
              <tbody>
                {proposal.pricing.map((row, i) => (
                  <tr key={i} className="border-b border-gray-200">
                    <td className="py-3">{row.line_item}</td>
                    <td className="py-3 text-right font-mono">
                      {fmtUSD(row.amount_cents)}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="py-3 font-semibold">Total</td>
                  <td className="py-3 text-right font-mono font-semibold text-lg">
                    {fmtUSD(totalCents)}
                  </td>
                </tr>
              </tbody>
            </table>
            {proposal.timeline_weeks && (
              <div className="text-sm text-gray-500 mt-3">
                Estimated timeline: {proposal.timeline_weeks} weeks
              </div>
            )}
          </section>
        )}

        {proposal.notes && (
          <section className="text-xs text-gray-500 border-t border-gray-200 pt-6">
            {proposal.notes}
          </section>
        )}

        <section className="border-t border-gray-200 pt-8 print:hidden">
          {responded ? (
            <div
              className={`rounded p-4 text-sm font-semibold ${proposal.status === "accepted" ? "bg-emerald-50 text-emerald-900" : "bg-gray-100 text-gray-700"}`}
            >
              You {proposal.status === "accepted" ? "accepted" : "rejected"}{" "}
              this proposal on{" "}
              {proposal.responded_at &&
                new Date(proposal.responded_at).toLocaleString()}
              .
            </div>
          ) : expired ? (
            <div className="rounded p-4 text-sm bg-gray-100 text-gray-700">
              This proposal expired on{" "}
              {proposal.expires_at &&
                new Date(proposal.expires_at).toLocaleDateString()}
              . Reach out for an updated version.
            </div>
          ) : (
            <ResponseButtons token={params.token} />
          )}
        </section>
      </div>
    </div>
  );
}

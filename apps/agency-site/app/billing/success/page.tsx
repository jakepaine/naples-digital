import Link from "next/link";

export const dynamic = "force-dynamic";

export default function BillingSuccess({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  return (
    <main className="mx-auto max-w-xl p-12 text-center space-y-6">
      <div className="text-5xl">✓</div>
      <h1 className="text-3xl font-bold">You're all set</h1>
      <p className="text-gray-600">
        Your Naples Digital subscription is live. We'll email you with portal
        access and onboarding next steps within 5 minutes.
      </p>
      {searchParams.session_id && (
        <p className="text-xs text-gray-400">
          Stripe session{" "}
          <span className="font-mono">{searchParams.session_id.slice(0, 24)}…</span>
        </p>
      )}
      <Link
        href="/"
        className="inline-block px-5 py-2.5 bg-black text-white rounded text-sm"
      >
        Back to home
      </Link>
    </main>
  );
}

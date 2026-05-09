import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase-auth";

export const dynamic = "force-dynamic";

// Authenticated landing. The middleware guarantees there's a session;
// this resolves which tenant the user belongs to and forwards them
// into their portal experience.
export default async function MePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  if (!session.tenantId) {
    return (
      <main className="mx-auto max-w-md p-12">
        <div className="text-[10px] uppercase tracking-[0.32em] text-gold">
          Naples Digital
        </div>
        <h1 className="mt-2 font-heading text-5xl tracking-broadcast text-cream">
          Welcome
        </h1>
        <p className="mt-4 text-sm text-cream/70">
          You're signed in as{" "}
          <span className="font-mono">{session.email}</span>, but your email
          isn't yet linked to a tenant. Reach out to your tenant owner to be
          added.
        </p>
        <form action="/api/auth/signout" method="POST" className="mt-6">
          <button className="text-xs underline text-cream/60">
            Sign out
          </button>
        </form>
      </main>
    );
  }

  // Forward the user into their tenant's portal — using email-keyed URL
  // for backwards compatibility with the existing /portal/[email] routes.
  redirect(`/portal/${encodeURIComponent(session.email)}`);
}

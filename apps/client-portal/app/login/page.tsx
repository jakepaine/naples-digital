import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
  return (
    <main className="mx-auto max-w-md p-12">
      <div className="text-[10px] uppercase tracking-[0.32em] text-gold">
        Naples Digital
      </div>
      <h1 className="mt-2 font-heading text-5xl tracking-broadcast text-cream">
        Sign in
      </h1>
      <p className="mt-3 text-sm text-cream/70">
        Enter your email. We'll send a one-click magic link.
      </p>
      {searchParams.error && (
        <div className="mt-4 rounded border border-red-300/30 bg-red-500/10 p-3 text-sm text-red-300">
          {searchParams.error === "exchange_failed"
            ? "Magic link expired or invalid. Try again."
            : searchParams.error}
        </div>
      )}
      <LoginForm next={searchParams.next} />
    </main>
  );
}

import { SignIn } from "@/components/SignIn";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-0px)] max-w-2xl flex-col items-center justify-center px-6 py-16">
      <div className="flex items-center gap-3">
        <span className="relative inline-flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-live-pulse rounded-full bg-live opacity-90" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-live" />
        </span>
        <span className="font-heading text-2xl tracking-broadcast text-cream">
          239<span className="text-live"> </span>LIVE
        </span>
      </div>

      <h1 className="mt-8 text-center font-heading text-5xl tracking-broadcast text-cream md:text-6xl">
        Client Portal
      </h1>
      <div className="mx-auto mt-3 h-px w-16 bg-live" />
      <p className="mt-5 max-w-md text-center text-sm text-cream/70">
        Your contracts, invoices, and content deliveries — all in one place.
        Sign in with the email we have on file.
      </p>

      <SignIn />

      <div className="mt-12 grid w-full grid-cols-3 gap-3 text-center">
        <Tile label="Sign Contracts" sub="DocuSign-style e-signature" />
        <Tile label="Pay Invoices" sub="Stripe-powered checkout" />
        <Tile label="Submit Content" sub="For editing & clip cuts" />
      </div>

      <div className="mt-10 text-center text-[10px] uppercase tracking-[0.32em] text-muted">
        Demo? Try <span className="text-live">contracts@bonitabay.com</span>
      </div>
    </main>
  );
}

function Tile({ label, sub }: { label: string; sub: string }) {
  return (
    <div className="border border-card-border bg-card/40 p-4">
      <div className="font-heading text-base tracking-broadcast text-cream">{label}</div>
      <div className="mt-1 text-[10px] uppercase tracking-wider text-muted">{sub}</div>
    </div>
  );
}

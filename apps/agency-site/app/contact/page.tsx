import Link from "next/link";
import { StripeFooter } from "@naples/ui";
import { ArrowRight, Mail, MapPin, Calendar } from "lucide-react";

export default function ContactPage() {
  return (
    <main>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-card-border">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-bg-deep via-bg to-bg" />
        <div className="absolute inset-0 -z-10 opacity-60 [background-image:radial-gradient(ellipse_at_top,rgba(184,137,62,0.10),transparent_50%)]" />
        <div className="mx-auto max-w-7xl px-6 py-24 text-center lg:px-8 lg:py-32">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-card-border bg-card-soft px-3 py-1 text-xs font-medium text-gold">
            Company
          </div>
          <h1 className="mx-auto mt-6 max-w-3xl font-heading text-5xl font-semibold leading-[1.05] tracking-tightest text-cream lg:text-6xl">
            Talk to us.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-body">
            Email is the fastest way to reach us. We respond within one business day.
          </p>
        </div>
      </section>

      {/* CONTACT CARDS */}
      <section className="mx-auto max-w-5xl px-6 py-20 lg:px-8 lg:py-24">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-stripe-lg border border-card-border bg-card p-8 shadow-soft transition-shadow hover:shadow-card">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-grad-amber to-gold text-white shadow-soft">
              <Calendar className="h-5 w-5" />
            </div>
            <h3 className="mt-6 font-heading text-2xl font-semibold tracking-tightest text-cream">
              Book a demo
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-body">
              30 minutes on real tenant data. We&rsquo;ll walk you through the modules, talk through tier economics, and tell you whether the platform fits your business — no pitch.
            </p>
            <a
              href="mailto:jake@naples.digital?subject=Naples Digital Demo"
              className="group mt-6 inline-flex items-center gap-1.5 rounded-full bg-cream px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-ink-deep hover:shadow-card"
            >
              jake@naples.digital
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>

          <div className="rounded-stripe-lg border border-card-border bg-card p-8 shadow-soft transition-shadow hover:shadow-card">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-grad-amber to-gold text-white shadow-soft">
              <Mail className="h-5 w-5" />
            </div>
            <h3 className="mt-6 font-heading text-2xl font-semibold tracking-tightest text-cream">
              General inquiries
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-body">
              Sales, support, partnerships, press — same inbox. We don&rsquo;t use ticketing systems. A real founder reads every email.
            </p>
            <a
              href="mailto:jake@naples.digital"
              className="group mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-gold transition-colors hover:text-gold-dim"
            >
              jake@naples.digital
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>
      </section>

      {/* TEAM / LOCATION */}
      <section className="border-y border-card-border bg-bg-deep py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                The team
              </div>
              <h2 className="mt-4 font-heading text-4xl font-semibold leading-[1.08] tracking-tightest text-cream lg:text-5xl">
                Built by two operators in Naples, FL.
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-body">
                Naples Digital is Jake and Noah — two operators who&rsquo;ve spent the last decade running service businesses in Southwest Florida. We don&rsquo;t subcontract. We build the platform and we run it.
              </p>
              <div className="mt-8 flex items-center gap-2 text-sm text-body">
                <MapPin className="h-4 w-4 text-gold" />
                Naples, Florida · Purity Goat LLC
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                {
                  name: "Jake Paine",
                  role: "Systems · Strategy · Distribution",
                  bio: "Operator background, decade of running service businesses across Southwest Florida.",
                },
                {
                  name: "Noah",
                  role: "AI Engineering · Content · Analytics",
                  bio: "Builds and maintains every AI feature. Owns content production and analytics modules.",
                },
              ].map((person) => (
                <div
                  key={person.name}
                  className="rounded-stripe-lg border border-card-border bg-card p-6 shadow-soft"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-grad-amber via-gold to-grad-bronze font-heading text-sm font-bold text-white">
                    {person.name.charAt(0)}
                  </div>
                  <div className="mt-4 font-heading text-lg font-semibold text-cream">
                    {person.name}
                  </div>
                  <div className="mt-1 text-xs font-medium text-gold">{person.role}</div>
                  <p className="mt-3 text-sm leading-relaxed text-body">{person.bio}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center lg:py-32">
        <h2 className="font-heading text-4xl font-semibold leading-[1.08] tracking-tightest text-cream lg:text-5xl">
          Ready to get started?
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-body">
          See the modules live, walk through tier economics, and decide if Naples Digital is a fit — in 30 minutes.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <a
            href="mailto:jake@naples.digital?subject=Naples Digital Demo"
            className="group inline-flex items-center gap-1.5 rounded-full bg-cream px-6 py-3 text-sm font-medium text-white transition-all hover:bg-ink-deep hover:shadow-card"
          >
            Book a demo
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </a>
          <Link
            href="/pricing"
            className="group inline-flex items-center gap-1.5 rounded-full border border-card-border bg-bg px-6 py-3 text-sm font-medium text-cream transition-all hover:border-gold hover:text-gold"
          >
            See pricing
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      <StripeFooter />
    </main>
  );
}

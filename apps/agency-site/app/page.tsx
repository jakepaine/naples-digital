import Link from "next/link";
import { StripeGradient, StripeFooter } from "@naples/ui";
import { TIERS, MODULES } from "@naples/db";
import {
  ArrowRight,
  Zap,
  Layers,
  ShieldCheck,
  Sparkles,
  LineChart,
  Database,
  Code2,
  CheckCircle2,
} from "lucide-react";
import { PricingSection } from "@/components/PricingSection";

export default function HomePage() {
  return (
    <main className="overflow-hidden">
      {/* HERO with gradient */}
      <section className="relative">
        <div className="absolute inset-0 -z-10">
          <StripeGradient />
        </div>
        <div className="mx-auto max-w-7xl px-6 pb-32 pt-24 lg:px-8 lg:pb-48 lg:pt-32">
          <div className="max-w-4xl">
            <h1 className="font-heading text-[44px] font-semibold leading-[1.05] tracking-tightest text-cream sm:text-6xl lg:text-7xl">
              Software infrastructure
              <br />
              for service businesses.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-cream/80 lg:text-xl">
              Sales, content, and operations on a single platform. Activate the modules you need today and add the rest as you grow — no Zapier graveyard, no five-tool tax.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/pricing"
                className="group inline-flex items-center gap-1.5 rounded-full bg-cream px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-ink-deep hover:shadow-card"
              >
                Start now
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="mailto:jake@naples.digital?subject=Naples Digital Demo"
                className="group inline-flex items-center gap-1.5 text-sm font-medium text-cream transition-colors hover:text-gold-dim"
              >
                Contact sales
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Customer logo strip */}
      <section className="border-y border-card-border bg-bg-deep py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <p className="text-center text-xs font-medium uppercase tracking-[0.18em] text-faint">
            Trusted by service businesses across Southwest Florida
          </p>
          <div className="mt-8 grid grid-cols-2 items-center gap-6 sm:grid-cols-3 md:grid-cols-5">
            {[
              "239 LIVE",
              "MIA Real Estate",
              "Lifewise",
              "Naples Digital",
              "Jake Paine",
            ].map((name) => (
              <div
                key={name}
                className="text-center font-heading text-sm font-medium tracking-tight text-faint transition-colors hover:text-cream"
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Two-column: pitch + product mock */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-card-border bg-card-soft px-3 py-1 text-xs font-medium text-gold">
              <Sparkles className="h-3 w-3" />
              The platform
            </div>
            <h2 className="mt-6 font-heading text-4xl font-semibold leading-[1.08] tracking-tightest text-cream lg:text-5xl">
              A unified stack, replacing five tools and the glue between them.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-body">
              Naples Digital ships every module your service business needs as a single tenant on shared infrastructure. CRM, booking, outreach, content production, sponsor analytics, client portal — all on one login, one bill, one source of truth.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                "One database, one identity model, one design system across every module.",
                "Modules ship as native Node services — no Zapier, no n8n, no glue tax.",
                "Every AI feature has deterministic fallbacks. Demos never break.",
              ].map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                  <span className="text-body">{line}</span>
                </li>
              ))}
            </ul>
            <div className="mt-10">
              <Link
                href="/modules"
                className="group inline-flex items-center gap-1.5 text-sm font-semibold text-gold transition-colors hover:text-gold-dim"
              >
                Explore the module catalog
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          {/* Product mock card */}
          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-stripe-lg bg-gradient-to-br from-grad-amber/30 via-grad-cream/40 to-grad-bronze/20 blur-3xl" />
            <div className="overflow-hidden rounded-stripe-lg border border-card-border bg-card shadow-lift">
              {/* Mock browser chrome */}
              <div className="flex items-center gap-2 border-b border-card-border bg-card-soft px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-rose/40" />
                  <div className="h-2.5 w-2.5 rounded-full bg-amber/40" />
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald/40" />
                </div>
                <div className="ml-2 flex-1 rounded-md border border-card-border bg-bg px-3 py-1 text-xs text-faint">
                  app.naples.digital/dashboard
                </div>
              </div>
              {/* Mock dashboard */}
              <div className="space-y-4 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-faint">Active modules</div>
                    <div className="mt-1 font-heading text-2xl font-semibold text-cream">9 / 10</div>
                  </div>
                  <div className="rounded-full border border-emerald/30 bg-emerald/10 px-2.5 py-0.5 text-xs font-medium text-emerald">
                    All systems operational
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Bookings", val: "47" },
                    { label: "Pitches sent", val: "128" },
                    { label: "MRR", val: "$8.4k" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg border border-card-border bg-card-soft p-3">
                      <div className="text-[10px] font-medium uppercase tracking-wider text-faint">
                        {s.label}
                      </div>
                      <div className="mt-1 font-heading text-lg font-semibold text-cream">{s.val}</div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {Object.values(MODULES)
                    .slice(0, 4)
                    .map((m) => (
                      <div
                        key={m.key}
                        className="flex items-center justify-between rounded-lg border border-card-border bg-card-soft px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald" />
                          <span className="text-sm font-medium text-cream">{m.name}</span>
                        </div>
                        <span className="text-xs text-faint">live</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="border-y border-card-border bg-bg-deep py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
              Why Naples Digital
            </div>
            <h2 className="mt-4 font-heading text-4xl font-semibold leading-[1.08] tracking-tightest text-cream lg:text-5xl">
              Built for the way service businesses actually run.
            </h2>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Feature
              icon={<Layers />}
              title="Vertical-specific modules"
              body="Real estate acquisition, podcast sponsorship pipelines, event-business automation. Not a generic CRM you have to bend to fit."
            />
            <Feature
              icon={<Zap />}
              title="Real AI, not chatbot theater"
              body="Every customer-facing AI feature ships with deterministic fallbacks. You get usable output the first time, not a demo that breaks under real data."
            />
            <Feature
              icon={<Code2 />}
              title="Native, not no-code glue"
              body="Modules are real Node services in a single codebase, not Zapier or n8n instances. Faster, cheaper, fully owned by Naples Digital."
            />
            <Feature
              icon={<ShieldCheck />}
              title="Multi-tenant by design"
              body="Row-level security on every table. Your data never leaves your tenant boundary. Audit-ready from day one."
            />
            <Feature
              icon={<LineChart />}
              title="Outcomes, not dashboards"
              body="Booking conversion, sponsor pitch acceptance, content output — instrumented end-to-end. Numbers you can act on, not vanity metrics."
            />
            <Feature
              icon={<Database />}
              title="One source of truth"
              body="Every module reads and writes the same schema. No data exports, no integration drift, no reconciliation rituals."
            />
          </div>
        </div>
      </section>

      {/* Stats row */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
        <div className="grid grid-cols-2 gap-12 md:grid-cols-4">
          <Stat label="Live tenants" value="5" />
          <Stat label="Production modules" value={Object.keys(MODULES).length.toString()} />
          <Stat label="Subscription tiers" value={Object.keys(TIERS).length.toString()} />
          <Stat label="Built in" value="Naples, FL" />
        </div>
      </section>

      {/* Pricing showcase */}
      <PricingSection />

      {/* Final CTA */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center lg:py-32">
        <h2 className="font-heading text-4xl font-semibold leading-[1.08] tracking-tightest text-cream lg:text-5xl">
          Ready to see it in action?
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-body">
          30-minute walkthrough on real tenant data. We&rsquo;ll talk through tier economics and tell you whether the platform fits your business — no pitch.
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
            href="/modules"
            className="group inline-flex items-center gap-1.5 rounded-full border border-card-border bg-bg px-6 py-3 text-sm font-medium text-cream transition-all hover:border-gold hover:text-gold"
          >
            Browse modules
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      <StripeFooter />
    </main>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div>
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-grad-amber to-gold text-white shadow-soft">
        <span className="[&>svg]:h-5 [&>svg]:w-5">{icon}</span>
      </div>
      <h3 className="mt-5 font-heading text-lg font-semibold text-cream">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-body">{body}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-heading text-4xl font-semibold tracking-tightest text-cream lg:text-5xl">
        {value}
      </div>
      <div className="mt-2 text-sm font-medium text-faint">{label}</div>
    </div>
  );
}

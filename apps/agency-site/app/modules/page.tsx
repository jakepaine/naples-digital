import Link from "next/link";
import { StripeFooter } from "@naples/ui";
import { MODULES, moduleCategoryLabel, type ModuleCategory } from "@naples/db";
import {
  ArrowRight,
  Megaphone,
  PenTool,
  Settings,
  Building2,
  type LucideIcon,
} from "lucide-react";

const CATEGORY_ORDER: ModuleCategory[] = ["sales", "content", "ops", "vertical"];
const CATEGORY_ICON: Record<ModuleCategory, LucideIcon> = {
  sales: Megaphone,
  content: PenTool,
  ops: Settings,
  vertical: Building2,
};
const CATEGORY_COPY: Record<ModuleCategory, string> = {
  sales: "Pipeline, outreach, and conversion. Capture leads and turn them into booked revenue.",
  content: "Content production, syndication, and analytics. Built for businesses that publish.",
  ops: "Internal workflows, dashboards, client portals. The workbench that runs your business.",
  vertical: "Industry-specific modules for podcast networks, real estate, and event businesses.",
};

export default function ModulesCatalogPage() {
  const grouped: Record<ModuleCategory, Array<typeof MODULES[keyof typeof MODULES]>> = {
    sales: [], content: [], ops: [], vertical: [],
  };
  for (const m of Object.values(MODULES)) grouped[m.category].push(m);

  return (
    <main>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-card-border">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-bg-deep via-bg to-bg" />
        <div className="absolute inset-0 -z-10 opacity-60 [background-image:radial-gradient(ellipse_at_top,rgba(184,137,62,0.10),transparent_50%)]" />
        <div className="mx-auto max-w-7xl px-6 py-24 text-center lg:px-8 lg:py-32">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-card-border bg-card-soft px-3 py-1 text-xs font-medium text-gold">
            Products
          </div>
          <h1 className="mx-auto mt-6 max-w-3xl font-heading text-5xl font-semibold leading-[1.05] tracking-tightest text-cream lg:text-6xl">
            Every module on the platform.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-body">
            Each module is a feature area of the platform. Tiers bundle a default set; add-ons enable individual modules à la carte above tier.
          </p>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
        {CATEGORY_ORDER.map((cat) => {
          const Icon = CATEGORY_ICON[cat];
          return (
            <div key={cat} id={cat} className="mb-20 scroll-mt-20 last:mb-0">
              <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
                <div className="lg:sticky lg:top-24 lg:self-start">
                  <div className="flex h-12 w-12 items-center justify-center rounded-stripe bg-gradient-to-br from-grad-amber to-gold text-white shadow-soft">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h2 className="mt-6 font-heading text-3xl font-semibold tracking-tightest text-cream lg:text-4xl">
                    {moduleCategoryLabel(cat)}
                  </h2>
                  <p className="mt-3 text-base leading-relaxed text-body">
                    {CATEGORY_COPY[cat]}
                  </p>
                </div>

                <div className="lg:col-span-2">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {grouped[cat].map((m) => (
                      <div
                        key={m.key}
                        className="group rounded-stripe border border-card-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-card"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-heading text-base font-semibold text-cream">{m.name}</h3>
                          <span className="shrink-0 rounded-full border border-card-border bg-bg-deep px-2 py-0.5 text-xs font-medium text-faint">
                            +${m.addonMonthly}/mo
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-body">{m.description}</p>
                        <Link
                          href="/pricing"
                          className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-gold opacity-0 transition-all group-hover:opacity-100"
                        >
                          See in pricing
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* CTA */}
      <section className="border-y border-card-border bg-bg-deep py-24 lg:py-32">
        <div className="mx-auto max-w-4xl px-6 text-center lg:px-8">
          <h2 className="font-heading text-4xl font-semibold leading-[1.08] tracking-tightest text-cream lg:text-5xl">
            See which modules come with which tier.
          </h2>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/pricing"
              className="group inline-flex items-center gap-1.5 rounded-full bg-cream px-6 py-3 text-sm font-medium text-white transition-all hover:bg-ink-deep hover:shadow-card"
            >
              Compare tiers
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="mailto:jake@naples.digital?subject=Naples Digital Demo"
              className="group inline-flex items-center gap-1.5 rounded-full border border-card-border bg-bg px-6 py-3 text-sm font-medium text-cream transition-all hover:border-gold hover:text-gold"
            >
              Book a demo
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>
      </section>

      <StripeFooter />
    </main>
  );
}

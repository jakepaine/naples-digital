import Link from "next/link";
import { StripeFooter } from "@naples/ui";
import { TIERS, MODULES, modulesForTier, type Tier, type ModuleKey } from "@naples/db";
import { Check, ArrowRight, Minus } from "lucide-react";

const PUBLIC_TIERS: Tier[] = ["starter", "growth", "premium"];
const CUSTOM_TIERS: Tier[] = ["design_partner", "enterprise"];

export default function PricingPage() {
  return (
    <main>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-card-border">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-bg-deep via-bg to-bg" />
        <div className="absolute inset-0 -z-10 opacity-60 [background-image:radial-gradient(ellipse_at_top,rgba(184,137,62,0.12),transparent_50%)]" />
        <div className="mx-auto max-w-7xl px-6 py-24 text-center lg:px-8 lg:py-32">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-card-border bg-card-soft px-3 py-1 text-xs font-medium text-gold">
            Pricing
          </div>
          <h1 className="mx-auto mt-6 max-w-3xl font-heading text-5xl font-semibold leading-[1.05] tracking-tightest text-cream lg:text-6xl">
            Tiered subscription. Pick what fits.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-body">
            Three public tiers, two custom. Tiers bundle a default module set; add-ons enable individual modules above tier. You bring your own keys for usage-based vendors — we wire them into your tenant during setup and never mark up usage.
          </p>
        </div>
      </section>

      {/* TIER CARDS */}
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="overflow-hidden rounded-stripe-lg border border-card-border bg-card shadow-soft">
          <div className="grid grid-cols-1 lg:grid-cols-3">
            {PUBLIC_TIERS.map((key, idx) => {
              const t = TIERS[key];
              const isHighlight = key === "growth";
              return (
                <div
                  key={key}
                  className={`relative p-10 ${
                    idx > 0 ? "lg:border-l lg:border-card-border" : ""
                  } ${isHighlight ? "bg-bg-deep" : "bg-card"}`}
                >
                  {isHighlight && (
                    <div className="absolute -top-3 left-10">
                      <span className="inline-flex items-center rounded-full bg-gradient-to-r from-grad-amber via-gold to-grad-bronze px-3 py-1 text-xs font-semibold text-white shadow-soft">
                        Most popular
                      </span>
                    </div>
                  )}
                  <div className="font-heading text-xl font-semibold text-cream">{t.name}</div>
                  <div className="mt-1 text-sm text-body">{t.description}</div>
                  <div className="mt-8 flex items-baseline gap-1">
                    <span className="font-heading text-5xl font-semibold tracking-tightest text-cream">
                      ${t.monthlyPrice.toLocaleString()}
                    </span>
                    <span className="text-sm text-faint">/month</span>
                  </div>
                  <div className="mt-1 text-xs text-faint">
                    + ${t.setupFee.toLocaleString()} one-time setup
                  </div>
                  <a
                    href="mailto:jake@naples.digital?subject=Naples Digital Pricing"
                    className={`group mt-8 inline-flex w-full items-center justify-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
                      isHighlight
                        ? "bg-cream text-white hover:bg-ink-deep hover:shadow-card"
                        : "border border-card-border bg-bg text-cream hover:border-gold hover:text-gold"
                    }`}
                  >
                    Get started
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </a>
                  <div className="mt-10 text-xs font-semibold uppercase tracking-[0.14em] text-faint">
                    Modules included
                  </div>
                  <ul className="mt-4 space-y-3">
                    {t.modules.map((m) => (
                      <li key={m} className="flex items-start gap-2.5 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                        <span className="text-body">{MODULES[m as ModuleKey].name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CUSTOM TIERS */}
      <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {CUSTOM_TIERS.map((key) => {
            const t = TIERS[key];
            return (
              <div
                key={key}
                className="rounded-stripe-lg border border-card-border bg-bg-deep p-8 transition-shadow hover:shadow-soft"
              >
                <div className="flex items-center justify-between">
                  <div className="font-heading text-xl font-semibold text-cream">{t.name}</div>
                  <span className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold">
                    Custom
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-body">{t.description}</p>
                <div className="mt-6 font-heading text-2xl font-semibold tracking-tightest text-cream">
                  Custom-priced
                </div>
                <a
                  href="mailto:jake@naples.digital?subject=Naples Digital Custom Tier"
                  className="group mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-gold transition-colors hover:text-gold-dim"
                >
                  Talk to sales
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </a>
              </div>
            );
          })}
        </div>
      </section>

      {/* FEATURE COMPARISON */}
      <section className="border-y border-card-border bg-bg-deep py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center">
            <h2 className="font-heading text-4xl font-semibold leading-[1.08] tracking-tightest text-cream lg:text-5xl">
              Compare every module
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-body">
              Every module across every tier. Add-on prices apply when enabling a module above your tier.
            </p>
          </div>

          <div className="mx-auto mt-16 overflow-x-auto rounded-stripe-lg border border-card-border bg-card shadow-soft">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border bg-card-soft">
                  <th className="px-6 py-5 text-left text-xs font-semibold uppercase tracking-[0.14em] text-faint">
                    Module
                  </th>
                  {PUBLIC_TIERS.map((key) => {
                    const t = TIERS[key];
                    return (
                      <th key={key} className="px-4 py-5 text-center">
                        <div className="text-sm font-semibold text-cream">{t.name}</div>
                        <div className="mt-0.5 text-xs font-normal text-faint">
                          ${t.monthlyPrice}/mo
                        </div>
                      </th>
                    );
                  })}
                  <th className="px-4 py-5 text-center">
                    <div className="text-sm font-semibold text-cream">Add-on</div>
                    <div className="mt-0.5 text-xs font-normal text-faint">à la carte</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.values(MODULES).map((m, i) => (
                  <tr
                    key={m.key}
                    className={`border-b border-card-border last:border-0 ${
                      i % 2 === 1 ? "bg-bg-deep/40" : ""
                    }`}
                  >
                    <td className="px-6 py-4 align-top">
                      <div className="text-sm font-medium text-cream">{m.name}</div>
                      <div className="mt-0.5 text-xs text-faint">{m.description}</div>
                    </td>
                    {PUBLIC_TIERS.map((tier) => {
                      const included = modulesForTier(tier).includes(m.key);
                      return (
                        <td key={tier} className="px-4 py-4 text-center align-top">
                          {included ? (
                            <Check className="mx-auto h-5 w-5 text-gold" />
                          ) : (
                            <Minus className="mx-auto h-4 w-4 text-faint/40" />
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-4 text-center align-top text-sm text-body">
                      +${m.addonMonthly}/mo
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-6 py-24 lg:px-8 lg:py-32">
        <div className="text-center">
          <h2 className="font-heading text-4xl font-semibold leading-[1.08] tracking-tightest text-cream lg:text-5xl">
            Frequently asked questions
          </h2>
        </div>
        <div className="mt-16 space-y-2">
          <Faq q="How is Naples Digital different from a typical SaaS like HubSpot?">
            HubSpot is built for sales-first SMBs. Naples Digital is built for service businesses that combine sales, content production, and ops in one workflow — podcast studios, event businesses, real estate firms. We bundle the whole stack instead of forcing you to integrate three SaaS tools.
          </Faq>
          <Faq q="Why monthly subscription instead of one-time setup?">
            The platform compounds value over time — every new module we ship is available to existing tenants on tiers that include it. Subscription is how that economic model works for both sides. Setup fees cover initial configuration; subscription covers ongoing platform access, maintenance, and new modules.
          </Faq>
          <Faq q="What if I only need one module?">
            Add-ons are available à la carte above the Starter tier. If you only need one or two modules, we can quote you the Starter tier plus the specific add-ons.
          </Faq>
          <Faq q="What about usage-based costs (Anthropic, scrapers, email delivery)?">
            You bring your own keys for usage-based vendors — Anthropic, Apify, AssemblyAI, Apollo / Hunter / AnyMailFinder, Instantly or Smartlead, Resend. The setup fee covers the work of standing up those accounts and wiring each key into your tenant via our integrations vault. You pay vendors directly at their published rates. We never touch your usage bill and we never mark it up.
          </Faq>
          <Faq q="Can I take the code with me if I leave?">
            No. Naples Digital is a managed platform — you license access to the tenant, not the code. Your data is yours, and we provide CSV/JSON export anytime. Code, integrations, infrastructure, maintenance, and new modules are part of what the subscription covers.
          </Faq>
          <Faq q="Is there a Design Partner program?">
            Yes — first three paying tenants in 2026 get the Design Partner tier (Premium feature set at half price, 12-month commitment, direct roadmap input). Reach out if you&rsquo;re interested.
          </Faq>
        </div>
      </section>

      {/* CTA */}
      <section className="ink-section">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center lg:px-8 lg:py-32">
          <h2 className="font-heading text-4xl font-semibold leading-[1.08] tracking-tightest text-white lg:text-5xl">
            Start with one module.<br />Scale to the whole platform.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/70">
            30 minutes. No pitch. We&rsquo;ll walk you through the modules on real data and tell you whether the platform fits your business.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a
              href="mailto:jake@naples.digital?subject=Naples Digital Demo"
              className="group inline-flex items-center gap-1.5 rounded-full bg-white px-6 py-3 text-sm font-medium text-cream transition-all hover:bg-grad-cream"
            >
              Book a demo
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <Link
              href="/modules"
              className="group inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-transparent px-6 py-3 text-sm font-medium text-white transition-all hover:border-white/40"
            >
              Browse modules
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      <StripeFooter />
    </main>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-stripe border border-card-border bg-card open:bg-bg-deep transition-colors">
      <summary className="flex cursor-pointer items-center justify-between px-6 py-5 font-heading text-base font-semibold text-cream marker:hidden">
        <span>{q}</span>
        <span className="ml-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-card-border text-faint transition-transform group-open:rotate-45">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </span>
      </summary>
      <div className="px-6 pb-5 text-sm leading-relaxed text-body">{children}</div>
    </details>
  );
}

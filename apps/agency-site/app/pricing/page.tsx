import Link from "next/link";
import { Card, Button, Badge } from "@naples/ui";
import { TIERS, MODULES, modulesForTier, type Tier, type ModuleKey } from "@naples/db";
import { Check, ArrowRight, Mail } from "lucide-react";

const PUBLIC_TIERS: Tier[] = ["starter", "growth", "premium"];
const CUSTOM_TIERS: Tier[] = ["design_partner", "enterprise"];

export default function PricingPage() {
  return (
    <main>
      {/* HERO */}
      <section className="border-b border-card-border bg-bg-deep">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="text-[10px] uppercase tracking-[0.32em] text-gold">Pricing</div>
          <h1 className="mt-5 font-heading text-5xl text-cream md:text-6xl">Tiered subscription.<br /><span className="text-gold">Pick what fits.</span></h1>
          <div className="mt-6 h-px w-24 bg-gold" />
          <p className="mt-6 max-w-2xl text-base text-cream/75 md:text-lg">
            Three public tiers, two custom tiers. Tiers bundle a default module set; add-ons enable
            individual modules above tier. Usage-based costs (Anthropic, AssemblyAI, scrapers) are
            passed through at cost or capped per tier.
          </p>
        </div>
      </section>

      {/* PUBLIC TIERS */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {PUBLIC_TIERS.map((key) => {
            const t = TIERS[key];
            const isHighlight = key === "growth";
            return (
              <div
                key={key}
                className={`relative border ${isHighlight ? "border-gold" : "border-card-border"} bg-card p-8`}
              >
                {isHighlight && (
                  <div className="absolute -top-3 left-8">
                    <Badge tone="gold">Most popular</Badge>
                  </div>
                )}
                <div className="font-heading text-2xl tracking-broadcast text-cream">{t.name}</div>
                <div className="mt-1 text-sm text-muted">{t.description}</div>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="font-heading text-5xl text-cream">${t.monthlyPrice.toLocaleString()}</span>
                  <span className="text-sm text-muted">/month</span>
                </div>
                <div className="mt-1 text-xs text-muted">+ ${t.setupFee.toLocaleString()} one-time setup</div>
                <div className="mt-8">
                  <a href="mailto:jake@naples.digital?subject=Naples Digital Pricing">
                    <Button>Get Started <ArrowRight className="ml-2 h-4 w-4" /></Button>
                  </a>
                </div>
                <div className="mt-8 text-[10px] uppercase tracking-[0.18em] text-muted">Modules included</div>
                <ul className="mt-3 space-y-2">
                  {t.modules.map((m) => (
                    <li key={m} className="flex items-start gap-2 text-sm text-cream/85">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                      {MODULES[m as ModuleKey].name}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* CUSTOM TIERS */}
      <section className="border-y border-card-border bg-card/40 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <div className="text-[10px] uppercase tracking-[0.22em] text-gold">Custom</div>
            <h2 className="mt-3 font-heading text-3xl text-cream md:text-4xl">For specific situations.</h2>
            <div className="mt-3 h-px w-12 bg-gold" />
          </div>
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
            {CUSTOM_TIERS.map((key) => {
              const t = TIERS[key];
              return (
                <Card key={key}>
                  <div className="font-heading text-xl tracking-broadcast text-cream">{t.name}</div>
                  <div className="mt-1 text-sm text-cream/75">{t.description}</div>
                  <div className="mt-4 font-heading text-2xl text-gold">Custom-priced</div>
                  <div className="mt-6">
                    <a href="mailto:jake@naples.digital?subject=Naples Digital Custom Tier">
                      <Button variant="ghost">Talk to sales</Button>
                    </a>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURE COMPARISON */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-[10px] uppercase tracking-[0.22em] text-gold">Compare</div>
        <h2 className="mt-3 font-heading text-3xl text-cream md:text-4xl">All modules across tiers</h2>
        <div className="mt-3 h-px w-12 bg-gold" />

        <Card className="mt-10 overflow-x-auto p-0">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-card-border">
                <th className="px-4 py-4 text-left text-[10px] font-medium uppercase tracking-[0.18em] text-muted">Module</th>
                {PUBLIC_TIERS.map((key) => {
                  const t = TIERS[key];
                  return (
                    <th key={key} className="px-3 py-4 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
                      <div className="text-cream">{t.name}</div>
                      <div className="mt-0.5 text-muted">${t.monthlyPrice}/mo</div>
                    </th>
                  );
                })}
                <th className="px-3 py-4 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
                  <div className="text-cream">Add-on</div>
                  <div className="mt-0.5 text-muted">à la carte</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.values(MODULES).map((m) => (
                <tr key={m.key} className="border-b border-card-border last:border-0">
                  <td className="px-4 py-3 align-top">
                    <div className="text-sm text-cream">{m.name}</div>
                    <div className="mt-0.5 text-xs text-cream/65">{m.description}</div>
                  </td>
                  {PUBLIC_TIERS.map((tier) => {
                    const included = modulesForTier(tier).includes(m.key);
                    return (
                      <td key={tier} className="px-3 py-3 text-center align-top">
                        {included ? (
                          <Check className="mx-auto h-5 w-5 text-gold" />
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-3 py-3 text-center align-top text-sm text-cream/75">+${m.addonMonthly}/mo</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>

      {/* FAQ */}
      <section className="border-y border-card-border bg-card/40 py-20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-[10px] uppercase tracking-[0.22em] text-gold">FAQ</div>
          <h2 className="mt-3 font-heading text-3xl text-cream md:text-4xl">Common questions</h2>
          <div className="mt-3 h-px w-12 bg-gold" />

          <div className="mt-12 space-y-8">
            <Faq q="How is Naples Digital different from a typical SaaS like HubSpot?">
              HubSpot is built for sales-first SMBs. Naples Digital is built for service businesses
              that combine sales, content production, and ops in one workflow — podcast studios,
              event businesses, real estate firms. We bundle the whole stack instead of forcing you
              to integrate three SaaS tools.
            </Faq>
            <Faq q="Why monthly subscription instead of one-time setup?">
              The platform compounds value over time — every new module we ship is available to
              existing tenants on tiers that include it. Subscription is how that economic model
              works for both sides. Setup fees cover initial configuration; subscription covers
              ongoing platform access, maintenance, and new modules.
            </Faq>
            <Faq q="What if I only need one module?">
              Add-ons are available à la carte above the Starter tier. If you only need one or two
              modules and don&rsquo;t need the bundled tier, we can quote you the Starter tier plus the
              specific add-ons.
            </Faq>
            <Faq q="What about usage-based costs (Anthropic, scrapers, etc.)?">
              Each tier comes with usage caps. Above the cap, we either bill at cost or you upgrade
              tier — your choice. Caps are sized so most businesses never hit them.
            </Faq>
            <Faq q="Can I take the code with me if I leave?">
              No. Naples Digital is a managed platform — you license access to the tenant, not the
              code. Your data is yours, and we provide CSV/JSON export anytime. Code, integrations,
              infrastructure, maintenance, and new modules are part of what the subscription covers.
            </Faq>
            <Faq q="Is there a Design Partner program?">
              Yes — first three paying tenants in 2026 get the Design Partner tier (Premium feature
              set at half price, 12-month commitment, direct roadmap input). Reach out if you&rsquo;re
              interested.
            </Faq>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <Badge tone="gold">Ready to start</Badge>
        <h2 className="mt-6 font-heading text-4xl text-cream md:text-5xl">
          Book a demo. See it live.
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-base text-cream/75">
          30 minutes. No pitch. We&rsquo;ll walk you through the modules on real data, talk through tier
          economics, and tell you whether the platform fits your business.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <a href="mailto:jake@naples.digital?subject=Naples Digital Demo">
            <Button size="lg"><Mail className="mr-2 h-4 w-4" /> Book a Demo</Button>
          </a>
          <Link href="/modules">
            <Button variant="ghost" size="lg">Browse Modules</Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-card-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-xs text-muted">
          <div>© 2026 Naples Digital · Purity Goat LLC · Naples, FL</div>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-cream">Home</Link>
            <Link href="/modules" className="hover:text-cream">Modules</Link>
            <Link href="/contact" className="hover:text-cream">Contact</Link>
            <a href="mailto:jake@naples.digital" className="hover:text-cream">jake@naples.digital</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-heading text-xl text-cream">{q}</h3>
      <p className="mt-3 text-sm leading-relaxed text-cream/75">{children}</p>
    </div>
  );
}

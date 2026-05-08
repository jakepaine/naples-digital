import Link from "next/link";
import { Card, Button, Badge } from "@naples/ui";
import { ArrowRight, Mail, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <main>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-card-border">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-bg-deep to-bg" />
        <div className="absolute inset-0 -z-10 opacity-[0.05] [background-image:radial-gradient(circle_at_1px_1px,#B8893E_1px,transparent_0)] [background-size:32px_32px]" />
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-36">
          <div className="text-[10px] uppercase tracking-[0.32em] text-gold">Naples Digital · Naples, FL</div>
          <h1 className="mt-5 max-w-4xl font-heading text-5xl leading-[1.05] text-cream md:text-7xl">
            The operating system<br />
            <span className="text-gold">for service businesses.</span>
          </h1>
          <div className="mt-6 h-px w-24 bg-gold" />
          <p className="mt-8 max-w-2xl text-base leading-relaxed text-cream/75 md:text-lg">
            Sales, content, and operations modules on a single multi-tenant SaaS platform.
            Pick a tier, turn on what you need, run your business from one place.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/pricing">
              <Button size="lg">See Pricing <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
            <a href="mailto:jake@naples.digital?subject=Naples Digital Demo">
              <Button variant="ghost" size="lg">Book a Demo</Button>
            </a>
          </div>
        </div>
      </section>

      {/* WHY NAPLES DIGITAL */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="max-w-2xl">
          <div className="text-[10px] uppercase tracking-[0.22em] text-gold">Why Naples Digital</div>
          <h2 className="mt-3 font-heading text-4xl text-cream md:text-5xl">One platform. Every workflow.</h2>
          <div className="mt-3 h-px w-12 bg-gold" />
          <p className="mt-6 text-base text-cream/75">
            Stop stitching together five SaaS tools and a Zapier graveyard. Naples Digital ships every
            module your service business needs as a single tenant on shared infrastructure.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          <ValueProp
            icon={<Sparkles className="h-5 w-5" />}
            title="Built for service businesses"
            body="Vertical-specific modules for podcast networks, real estate, professional services, and event businesses — not a generic CRM you have to bend to fit."
          />
          <ValueProp
            icon={<Sparkles className="h-5 w-5" />}
            title="Real AI, not chatbot theater"
            body="Every customer-facing AI feature ships with deterministic fallbacks. You get usable output the first time, not a demo that breaks under real data."
          />
          <ValueProp
            icon={<Sparkles className="h-5 w-5" />}
            title="Native, not no-code glue"
            body="Modules are real Node services in a single codebase, not n8n or Zapier instances. Faster, cheaper, fully owned by Naples Digital."
          />
        </div>
      </section>

      {/* PRICING SUMMARY */}
      <section className="border-y border-card-border bg-card/40 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <div className="text-[10px] uppercase tracking-[0.22em] text-gold">Pricing</div>
            <h2 className="mt-3 font-heading text-4xl text-cream md:text-5xl">Tiered subscription. No surprises.</h2>
            <div className="mt-3 h-px w-12 bg-gold" />
            <p className="mt-6 text-base text-cream/75">
              Three public tiers. Each bundles a default set of modules; add-ons available for module-level
              customization. Design Partner and Enterprise priced custom.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-3">
            <TeaserTier name="Starter" price="$497/mo" includes="CRM + Booking + Backlog" />
            <TeaserTier name="Growth" price="$997/mo" includes="+ Outreach + Content + Sponsor Pitch" highlight />
            <TeaserTier name="Premium" price="$1,997/mo" includes="+ Dashboard + Analytics + Client Portal" />
          </div>
          <div className="mt-10">
            <Link href="/pricing">
              <Button>See full tier comparison <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          </div>
        </div>
      </section>

      {/* TEAM + CTA */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <div className="text-[10px] uppercase tracking-[0.22em] text-gold">Team</div>
            <h3 className="mt-3 font-heading text-2xl text-cream">Built by two operators.</h3>
            <p className="mt-4 text-sm leading-relaxed text-cream/75">
              Naples Digital is Jake and Noah — two operators who&rsquo;ve spent the last decade running
              service businesses in Southwest Florida. We don&rsquo;t subcontract. We build the platform
              and we run it.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-gold">Jake</div>
                <div className="mt-1 text-sm text-cream">Systems · Strategy · Distribution</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-gold">Noah</div>
                <div className="mt-1 text-sm text-cream">AI Engineering · Content · Analytics</div>
              </div>
            </div>
          </Card>
          <Card className="border-gold">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gold" />
              <div className="text-[10px] uppercase tracking-[0.22em] text-gold">Get started</div>
            </div>
            <h3 className="mt-3 font-heading text-2xl text-cream">Ready to see it in action?</h3>
            <p className="mt-3 text-sm leading-relaxed text-cream/75">
              30-minute walkthrough. We&rsquo;ll show you the modules live, walk you through tier
              economics, and tell you whether the platform fits your business — no pitch.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="mailto:jake@naples.digital?subject=Naples Digital Demo">
                <Button>Book a Demo <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </a>
              <Link href="/pricing">
                <Button variant="ghost">See Pricing</Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      <footer className="border-t border-card-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-xs text-muted">
          <div>© 2026 Naples Digital · Purity Goat LLC · Naples, FL</div>
          <div className="flex gap-4">
            <Link href="/pricing" className="hover:text-cream">Pricing</Link>
            <Link href="/modules" className="hover:text-cream">Modules</Link>
            <Link href="/contact" className="hover:text-cream">Contact</Link>
            <a href="mailto:jake@naples.digital" className="hover:text-cream">jake@naples.digital</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function ValueProp({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <Card className="h-full">
      <div className="text-gold">{icon}</div>
      <h3 className="mt-4 font-heading text-xl text-cream">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-cream/75">{body}</p>
    </Card>
  );
}

function TeaserTier({ name, price, includes, highlight }: { name: string; price: string; includes: string; highlight?: boolean }) {
  return (
    <div className={`relative border ${highlight ? "border-gold" : "border-card-border"} bg-bg p-6`}>
      {highlight && (
        <div className="absolute -top-3 left-6">
          <Badge tone="gold">Most popular</Badge>
        </div>
      )}
      <div className="font-heading text-xl tracking-broadcast text-cream">{name}</div>
      <div className="mt-3 font-heading text-3xl tracking-broadcast text-gold">{price}</div>
      <p className="mt-4 text-sm text-cream/75">{includes}</p>
    </div>
  );
}

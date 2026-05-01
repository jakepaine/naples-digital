import { Card, Button, Badge } from "@naples/ui";
import { APP_URLS, PRICING } from "@naples/mock-data";
import { Workflow, Bot, Users2, Video, ArrowRight, Search, Wrench, Zap, Mail } from "lucide-react";

export default function HomePage() {
  return (
    <main>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-card-border">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-card/40 to-bg" />
        <div className="absolute inset-0 -z-10 opacity-[0.04] [background-image:radial-gradient(circle_at_1px_1px,#C9A84C_1px,transparent_0)] [background-size:32px_32px]" />
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-36">
          <div className="text-[10px] uppercase tracking-[0.32em] text-gold">Naples Digital · Naples, FL</div>
          <h1 className="mt-5 max-w-4xl font-heading text-5xl leading-[1.05] text-cream md:text-7xl">
            We build the systems.<br />
            <span className="text-gold">You run the business.</span>
          </h1>
          <div className="mt-6 h-px w-24 bg-gold" />
          <p className="mt-8 max-w-2xl text-base leading-relaxed text-cream/80 md:text-lg">
            AI automation for Southwest Florida businesses. No guesswork. No generic chatbots.
            Systems that generate revenue.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <a href="mailto:jake@naples.digital?subject=Strategy Call">
              <Button size="lg">Book a Strategy Call <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </a>
            <a href={APP_URLS.site}>
              <Button variant="ghost" size="lg">See Our Case Study</Button>
            </a>
          </div>
        </div>
      </section>

      {/* WHAT WE DO */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="max-w-2xl">
          <div className="text-[10px] uppercase tracking-[0.22em] text-gold">What we do</div>
          <h2 className="mt-3 font-heading text-4xl text-cream md:text-5xl">Four services. One outcome.</h2>
          <div className="mt-3 h-px w-12 bg-gold" />
          <p className="mt-6 text-base text-cream/70">
            Every Naples Digital engagement closes the loop between sales, ops, and content. We don't sell
            tools. We build the system that runs the business.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Service icon={<Workflow className="h-5 w-5" />} name="Workflow Automation" description="Operations that run themselves. Handoffs between sales, content, and finance — wired together with custom logic and human-in-the-loop where it matters." />
          <Service icon={<Bot className="h-5 w-5" />} name="AI Chat + Voice Agents" description="Inbound calls answered, qualified, and scheduled. Inbound chats triaged. The agent that picks up at 2am while your team sleeps." />
          <Service icon={<Users2 className="h-5 w-5" />} name="CRM + Pipeline Build" description="GoHighLevel deployment, custom pipelines, automated nurture. Your team logs in to a system that already knows what's next." />
          <Service icon={<Video className="h-5 w-5" />} name="Content Repurposing" description="One long-form recording becomes 10 platform-native clips. AI-cut, AI-captioned, AI-distributed — branded and consistent." />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-y border-card-border bg-card/30 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <div className="text-[10px] uppercase tracking-[0.22em] text-gold">How it works</div>
            <h2 className="mt-3 font-heading text-4xl text-cream md:text-5xl">Three steps. Thirty days.</h2>
            <div className="mt-3 h-px w-12 bg-gold" />
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            <Step n="01" icon={<Search className="h-5 w-5" />} name="We Audit" body="One week. We map every revenue stream, every leak, every place a system could replace a human task. You leave with a roadmap whether you hire us or not." />
            <Step n="02" icon={<Wrench className="h-5 w-5" />} name="We Build" body="Thirty days. Workflows wired, CRM live, content engine running, outreach sequences active. We do the building. You stay in the room enough to keep us honest." />
            <Step n="03" icon={<Zap className="h-5 w-5" />} name="You Run It" body="Monthly retainer. We maintain, optimize, fix what breaks, ship improvements. You run the business. We keep the engine warm." />
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="max-w-2xl">
          <div className="text-[10px] uppercase tracking-[0.22em] text-gold">Engagement options</div>
          <h2 className="mt-3 font-heading text-4xl text-cream md:text-5xl">Two ways to work with us.</h2>
          <div className="mt-3 h-px w-12 bg-gold" />
          <p className="mt-6 text-base text-cream/70">
            Both options include the full system build. The difference is how upside is shared.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <PricingCard
            tag="Option A"
            label="Build Heavy"
            setup={`$${PRICING.optionA.setup.toLocaleString()}`}
            retainer={`$${PRICING.optionA.retainer.toLocaleString()}/mo`}
            commission={`${(PRICING.optionA.commission * 100).toFixed(0)}% commission`}
            description="Higher upfront. Lower ongoing share. Right when you want to own the system outright and pay for our success on a smaller curve."
            features={[
              "Full system build (30 days)",
              "Monthly retainer covers maintenance + iteration",
              "10% commission on net-new sponsor and client MRR",
              "Platform stack passed through at cost (~$460–690/mo)",
            ]}
          />
          <PricingCard
            tag="Option B"
            label="Commission Heavy"
            setup={`$${PRICING.optionB.setup.toLocaleString()}`}
            retainer={`$${PRICING.optionB.retainer.toLocaleString()}/mo`}
            commission={`${(PRICING.optionB.commission * 100).toFixed(0)}% commission`}
            description="Lower upfront. We share more upside. Right when you want skin-in-the-game from us and prefer to ramp the cash outlay slowly."
            features={[
              "Full system build (30 days)",
              "Monthly retainer covers maintenance + iteration",
              "20% commission on net-new sponsor and client MRR",
              "Platform stack passed through at cost (~$460–690/mo)",
            ]}
            highlight
          />
        </div>
      </section>

      {/* CASE STUDY TEASER */}
      <section className="border-y border-card-border bg-card/40 py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <Badge tone="gold">Case Study</Badge>
          <h2 className="mt-6 font-heading text-4xl text-cream md:text-5xl">
            239 Live Studios — <span className="text-gold">−$3,000/mo to $40K+ potential.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-cream/70">
            A Naples podcast and media studio operating at a loss. We rebuilt the offer stack, deployed the
            system, ran outreach for 30 days. By month six, four revenue streams running in parallel.
          </p>
          <div className="mt-10">
            <a href={APP_URLS.site}>
              <Button>View the system <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </a>
          </div>
        </div>
      </section>

      {/* TEAM + CTA */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <div className="text-[10px] uppercase tracking-[0.22em] text-gold">Team</div>
            <h3 className="mt-3 font-heading text-2xl text-cream">Built by two operators.</h3>
            <p className="mt-4 text-sm leading-relaxed text-cream/70">
              Naples Digital is Jake and Noah — two operators who've spent the last decade building and
              running businesses inside Southwest Florida. We don't subcontract. We build it ourselves.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-gold">Jake</div>
                <div className="mt-1 text-sm text-cream">Systems · Outreach · Strategy</div>
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
              <div className="text-[10px] uppercase tracking-[0.22em] text-gold">Strategy call</div>
            </div>
            <h3 className="mt-3 font-heading text-2xl text-cream">Want to see if there's a fit?</h3>
            <p className="mt-3 text-sm leading-relaxed text-cream/70">
              30 minutes. No pitch. We'll look at your operation, point at three places automation
              would compound, and tell you whether we're the right team to build them.
            </p>
            <div className="mt-6">
              <a href="mailto:jake@naples.digital?subject=Strategy Call">
                <Button>Book a Call <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </a>
            </div>
          </Card>
        </div>
      </section>

      <footer className="border-t border-card-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-xs text-muted">
          <div>© 2025 Naples Digital · Built in Naples, FL · Jake · Noah</div>
          <div className="flex gap-4">
            <a href={APP_URLS.site} className="hover:text-cream">239 Live Studios</a>
            <a href={APP_URLS.dashboard} className="hover:text-cream">System Demo</a>
            <a href="mailto:jake@naples.digital" className="hover:text-cream">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Service({ icon, name, description }: { icon: React.ReactNode; name: string; description: string }) {
  return (
    <Card className="h-full">
      <div className="text-gold">{icon}</div>
      <h3 className="mt-4 font-heading text-xl text-cream">{name}</h3>
      <p className="mt-3 text-sm leading-relaxed text-cream/70">{description}</p>
    </Card>
  );
}

function Step({ n, icon, name, body }: { n: string; icon: React.ReactNode; name: string; body: string }) {
  return (
    <div className="border border-card-border bg-card p-8">
      <div className="flex items-center gap-3">
        <div className="text-[11px] uppercase tracking-[0.22em] text-gold">{n}</div>
        <div className="text-gold">{icon}</div>
      </div>
      <h3 className="mt-4 font-heading text-2xl text-cream">{name}</h3>
      <p className="mt-3 text-sm leading-relaxed text-cream/70">{body}</p>
    </div>
  );
}

function PricingCard({ tag, label, setup, retainer, commission, description, features, highlight }: { tag: string; label: string; setup: string; retainer: string; commission: string; description: string; features: string[]; highlight?: boolean }) {
  return (
    <div className={`relative border ${highlight ? "border-gold" : "border-card-border"} bg-card p-8 md:p-10`}>
      {highlight && (
        <div className="absolute -top-3 left-8">
          <Badge tone="gold">Most popular</Badge>
        </div>
      )}
      <div className="text-[10px] uppercase tracking-[0.22em] text-gold">{tag}</div>
      <h3 className="mt-2 font-heading text-3xl text-cream">{label}</h3>
      <div className="mt-6 flex items-baseline gap-3">
        <span className="font-heading text-4xl text-cream">{setup}</span>
        <span className="text-sm text-muted">setup</span>
      </div>
      <div className="mt-2 text-sm text-muted">+ {retainer} · {commission}</div>
      <p className="mt-6 text-sm leading-relaxed text-cream/70">{description}</p>
      <ul className="mt-6 space-y-2.5 text-sm">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold" />
            <span className="text-cream/85">{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

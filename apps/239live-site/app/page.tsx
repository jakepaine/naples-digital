import Link from "next/link";
import { Card, Button, Badge } from "@naples/ui";
import { APP_URLS } from "@naples/mock-data";
import { Mic2, Camera, Star, ShoppingBag, ArrowRight, Headphones, Building2, Anchor } from "lucide-react";

export default function HomePage() {
  return (
    <main>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-card-border">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-card/60 to-bg" />
        <div className="absolute inset-0 -z-10 opacity-[0.04] [background-image:radial-gradient(circle_at_1px_1px,#E8192C_1px,transparent_0)] [background-size:32px_32px]" />
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-36">
          <div className="text-[10px] uppercase tracking-[0.32em] text-gold">239 Live Studios · Naples, FL</div>
          <h1 className="mt-5 max-w-4xl font-heading text-5xl leading-[1.05] text-cream md:text-7xl lg:text-[88px]">
            Southwest Florida's<br />
            <span className="text-gold">Media Home.</span>
          </h1>
          <div className="mt-6 h-px w-24 bg-gold" />
          <p className="mt-8 max-w-2xl text-base leading-relaxed text-cream/80 md:text-lg">
            Studio rental. Premium content. Built for the stories that define this region —
            the founders, the developers, the wealth, the creators shaping Southwest Florida.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href={APP_URLS.booking}>
              <Button size="lg">Book the Studio <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
            <Link href="/studio">
              <Button variant="ghost" size="lg">View Packages</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* METRICS STRIP */}
      <section className="border-b border-card-border bg-card/40">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-card-border md:grid-cols-4">
          <Metric value="$0" label="Hidden Fees" />
          <Metric value="$40K+" label="Monthly Potential" />
          <Metric value="30 Day" label="Build Window" />
          <Metric value="4" label="Revenue Streams" />
        </div>
      </section>

      {/* REVENUE STREAMS */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="max-w-2xl">
          <div className="text-[10px] uppercase tracking-[0.22em] text-gold">What we do</div>
          <h2 className="mt-3 font-heading text-4xl text-cream md:text-5xl">
            Four ways the studio generates revenue.
          </h2>
          <div className="mt-3 h-px w-12 bg-gold" />
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StreamCard icon={<Camera className="h-5 w-5" />} name="Studio Rental" range="$3K–6K /mo" description="Hourly to monthly bookings. Real estate, content creators, corporate brand work, events." />
          <StreamCard icon={<Mic2 className="h-5 w-5" />} name="Content Agency" range="$5K–15K /mo" description="Done-for-you podcast and social production. AI-powered repurposing pipeline." />
          <StreamCard icon={<Star className="h-5 w-5" />} name="Show Sponsors" range="$1K–4K /mo" description="Bronze, Silver, and Gold sponsor tiers across our flagship shows." />
          <StreamCard icon={<ShoppingBag className="h-5 w-5" />} name="SWFL Merch" range="$0–1.5K /mo" description="Branded apparel and accessories tied to the shows and the regional identity." />
        </div>
      </section>

      {/* SHOWS */}
      <section className="border-y border-card-border bg-card/30 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <div className="text-[10px] uppercase tracking-[0.22em] text-gold">The shows</div>
            <h2 className="mt-3 font-heading text-4xl text-cream md:text-5xl">Three formats. One regional voice.</h2>
            <div className="mt-3 h-px w-12 bg-gold" />
          </div>
          <div className="mt-12 space-y-6">
            <ShowCard name="Billionaire Coast" format="45–60 min long-form interview" tagline="Diary of a CEO format for SWFL" description="Naples billionaires, developers, hedge fund managers, family-office principals. The wealth that's reshaping this region — on camera, unhurried." tier="Gold Sponsor · $1,000/show" />
            <ShowCard name="239 Built" format="20–30 min founder interviews" tagline="Hosted by Kevin" description="Local SWFL founders and operators. Every guest is a potential client, sponsor, or collaborator. The show is a customer-acquisition engine disguised as content." tier="Bronze + Silver tiers · $300–500/show" />
            <ShowCard name="SWFL Keys" format="Short-form first · event coverage" tagline="Music, festivals, culture" description="The cultural pulse of Naples, Marco Island, Bonita, Fort Myers. Built for vertical clips, designed to dominate the regional algorithm." tier="Custom event partnerships" />
          </div>
        </div>
      </section>

      {/* WHO USES THE SPACE */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="max-w-2xl">
          <div className="text-[10px] uppercase tracking-[0.22em] text-gold">The room</div>
          <h2 className="mt-3 font-heading text-4xl text-cream md:text-5xl">Built for serious work.</h2>
          <div className="mt-3 h-px w-12 bg-gold" />
        </div>
        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          <ClientCard icon={<Headphones className="h-5 w-5" />} type="Content Creators" price="$150–400 / day" />
          <ClientCard icon={<Building2 className="h-5 w-5" />} type="Real Estate" price="$300–600 / session" />
          <ClientCard icon={<Star className="h-5 w-5" />} type="Corporate Brand" price="$1,500–5,000 / mo" />
          <ClientCard icon={<Mic2 className="h-5 w-5" />} type="Live Events" price="$500–2,000 / event" />
          <ClientCard icon={<Anchor className="h-5 w-5" />} type="Membership" price="$1,500 / mo" />
        </div>
      </section>

      {/* THE SYSTEM */}
      <section className="border-y border-card-border bg-card/40 py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="text-[10px] uppercase tracking-[0.22em] text-gold">The system behind the studio</div>
          <h2 className="mt-4 font-heading text-4xl text-cream md:text-5xl">
            Your system finds clients.<br />
            <span className="text-gold">You show up and do what you do.</span>
          </h2>
          <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-cream/70">
            Cold outreach, lead pipeline, content distribution, sponsor follow-up — all running automatically
            in the background. Built by Naples Digital. Owned by 239 Live.
          </p>
          <div className="mt-10">
            <Link href={APP_URLS.dashboard}>
              <Button variant="ghost">See the operator dashboard <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="border border-gold bg-card p-12 text-center">
          <Badge tone="gold">Limited May calendar — booking now</Badge>
          <h3 className="mt-6 font-heading text-3xl text-cream md:text-4xl">
            Ready to record where the stories happen?
          </h3>
          <p className="mx-auto mt-4 max-w-xl text-cream/70">
            One studio. Broadcast-grade gear. Naples.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href={APP_URLS.booking}><Button size="lg">Book the Studio</Button></Link>
            <Link href="/studio"><Button variant="ghost" size="lg">View Rates</Button></Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-card-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-xs text-muted">
          <div>© 2025 239 Live Studios · Naples, FL</div>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-cream">Home</Link>
            <Link href="/studio" className="hover:text-cream">Studio</Link>
            <Link href="/shows" className="hover:text-cream">Shows</Link>
            <Link href={APP_URLS.booking} className="hover:text-cream">Book</Link>
            <a href={APP_URLS.agency} className="hover:text-cream">Naples Digital ↗</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-bg px-6 py-8 text-center md:py-10">
      <div className="font-heading text-3xl text-gold md:text-4xl">{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-cream/70">{label}</div>
    </div>
  );
}

function StreamCard({ icon, name, range, description }: { icon: React.ReactNode; name: string; range: string; description: string }) {
  return (
    <Card className="h-full">
      <div className="text-gold">{icon}</div>
      <h3 className="mt-4 font-heading text-xl text-cream">{name}</h3>
      <div className="mt-1 text-[11px] uppercase tracking-wider text-gold">{range}</div>
      <p className="mt-4 text-sm leading-relaxed text-cream/70">{description}</p>
    </Card>
  );
}

function ShowCard({ name, format, tagline, description, tier }: { name: string; format: string; tagline: string; description: string; tier: string }) {
  return (
    <div className="grid grid-cols-1 gap-6 border border-card-border bg-card p-8 md:grid-cols-12 md:p-12">
      <div className="md:col-span-5">
        <div className="text-[10px] uppercase tracking-[0.22em] text-gold">{format}</div>
        <h3 className="mt-3 font-heading text-4xl leading-tight text-cream md:text-5xl">{name}</h3>
        <div className="mt-2 text-sm italic text-cream/60">{tagline}</div>
      </div>
      <div className="md:col-span-7 md:border-l md:border-card-border md:pl-8">
        <p className="text-base leading-relaxed text-cream/80">{description}</p>
        <div className="mt-6">
          <Badge tone="gold">{tier}</Badge>
        </div>
      </div>
    </div>
  );
}

function ClientCard({ icon, type, price }: { icon: React.ReactNode; type: string; price: string }) {
  return (
    <Card className="h-full">
      <div className="text-gold">{icon}</div>
      <div className="mt-4 font-heading text-lg text-cream">{type}</div>
      <div className="mt-2 text-[11px] uppercase tracking-wider text-gold">{price}</div>
    </Card>
  );
}

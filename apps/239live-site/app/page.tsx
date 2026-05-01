import Link from "next/link";
import { Card, Button, Badge } from "@naples/ui";
import { APP_URLS } from "@naples/mock-data";
import { Mic2, Camera, Star, ArrowRight, Headphones, Building2, Radio, Tv2, Disc3, Calendar, MapPin, Quote } from "lucide-react";

export default function HomePage() {
  return (
    <main>
      {/* HERO — centered live-pulse lockup, broadcast type */}
      <section className="relative overflow-hidden border-b border-card-border bg-bg-deep">
        <div className="absolute inset-0 -z-10 bg-live-glow" />
        <div className="absolute inset-x-0 -bottom-24 -z-10 h-72 bg-gradient-to-b from-transparent to-bg" />

        <div className="mx-auto flex max-w-5xl flex-col items-center px-6 py-28 text-center md:py-40">
          <div className="flex items-center gap-3">
            <span className="relative inline-flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-live-pulse rounded-full bg-live opacity-90" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-live" />
            </span>
            <span className="text-[11px] uppercase tracking-[0.32em] text-live">On Air · Naples, FL</span>
          </div>

          <h1 className="mt-8 max-w-4xl font-heading text-6xl leading-[0.95] tracking-broadcast text-cream md:text-8xl lg:text-[120px]">
            Naples' Premier<br />
            <span className="text-live">Podcast &amp; Broadcasting</span><br />
            Studio.
          </h1>

          <div className="mt-6 h-px w-24 bg-live" />

          <p className="mt-8 max-w-2xl text-base leading-relaxed text-cream/80 md:text-lg">
            Record Bold. Stream Live. Build Your Brand. <span className="text-live">Make Noise.</span>
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href={APP_URLS.booking}>
              <Button size="lg">Book a Session <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
            <Link href="/studio">
              <Button variant="ghost" size="lg">View Packages</Button>
            </Link>
          </div>

          <div className="mt-16 grid w-full grid-cols-3 gap-3">
            <HeroTile Icon={Headphones} label="Listen" sub="Podcast Episodes" />
            <HeroTile Icon={Tv2} label="Watch" sub="Live Streams" />
            <HeroTile Icon={Disc3} label="The Studio" sub="Book Your Session" />
          </div>
        </div>
      </section>

      {/* AS FEATURED IN — quiet logo strip */}
      <section className="border-b border-card-border bg-card/30">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="text-center text-[10px] uppercase tracking-[0.32em] text-muted">As Featured In</div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-[11px] uppercase tracking-[0.18em] text-cream/60">
            <span>Naples Daily News</span>
            <span className="text-card-border-strong">/</span>
            <span>NBC-2</span>
            <span className="text-card-border-strong">/</span>
            <span>Gulfshore Life</span>
            <span className="text-card-border-strong">/</span>
            <span>The Naples Press</span>
            <span className="text-card-border-strong">/</span>
            <span>SWFL Inc.</span>
            <span className="text-card-border-strong">/</span>
            <span>Visit Naples</span>
            <span className="text-card-border-strong">/</span>
            <span>Greater Naples Chamber</span>
          </div>
        </div>
      </section>

      {/* STUDIO STATS — customer-facing */}
      <section className="border-b border-card-border bg-bg-deep">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-card-border md:grid-cols-4">
          <Metric value="3-Cam" label="Broadcast Setup" />
          <Metric value="8a–10p" label="Open Daily" />
          <Metric value="100+" label="Episodes Recorded" />
          <Metric value="Naples" label="Old Naples · Free Parking" />
        </div>
      </section>

      {/* WHAT YOU CAN DO HERE — customer-focused use cases */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <SectionHeader eyebrow="What you can record here" title="Built for the work." />
        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StreamCard Icon={Mic2} name="Podcasts" range="$150 – 400 / day" description="Long-form interviews, panel shows, narrative episodes. Acoustic-treated, four SM7Bs racked and ready." />
          <StreamCard Icon={Building2} name="Real Estate" range="$300 – 600 / session" description="Listing tours, broker brand video, agent intros. Lit and framed for property storytelling." />
          <StreamCard Icon={Camera} name="Brand Content" range="$1.5K – 5K / mo" description="Corporate brand video, founder stories, recurring content programs with full production support." />
          <StreamCard Icon={Star} name="Live Events" range="$500 – 2K / event" description="Private launches, brand activations, intimate panels. Up to 50 guests, optional catering." />
        </div>
      </section>

      {/* SHOWS — per-show gradient cards */}
      <section className="border-y border-card-border bg-bg-deep py-24">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeader eyebrow="The shows" title="Three formats. One regional voice." />
          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
            <ShowCard
              gradient="bg-show-billionaire"
              accent="text-amber"
              name="Billionaire Coast"
              format="45–60 min long-form"
              description="Naples billionaires, developers, hedge fund managers, family-office principals. The wealth reshaping this region — on camera, unhurried."
              tier="Gold Sponsor · $1,000/show"
            />
            <ShowCard
              gradient="bg-show-built"
              accent="text-emerald"
              name="239 Built"
              format="20–30 min founder interviews"
              description="Local SWFL founders and operators. Every guest is a potential client, sponsor, or collaborator. A customer-acquisition engine disguised as content."
              tier="Bronze + Silver · $300–500/show"
            />
            <ShowCard
              gradient="bg-show-keys"
              accent="text-sapphire"
              name="SWFL Keys"
              format="Short-form first · event coverage"
              description="The cultural pulse of Naples, Marco Island, Bonita, Fort Myers. Built for vertical clips, designed to dominate the regional algorithm."
              tier="Custom event partnerships"
            />
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <SectionHeader eyebrow="From the room" title="What creators say." />
        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Testimonial
            quote="Cleanest sound I've cut a podcast in. Showed up, hit record, walked out with three episodes."
            name="Marco DiSalvo"
            title="Host · 239 Built"
          />
          <Testimonial
            quote="My listing video looked like Architectural Digest. Best $500 I've spent on marketing this year."
            name="Diana Russo"
            title="Broker · Premier Naples Estates"
          />
          <Testimonial
            quote="We run our weekly brand show out of 239 Live. Membership pays for itself the first week of every month."
            name="Sarah Chen"
            title="Founder · Coastal Capital"
          />
        </div>
      </section>

      {/* VISIT / CONTACT */}
      <section className="border-y border-card-border bg-bg-deep py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <VisitDetail Icon={MapPin} label="The Studio" lines={["239 Live HQ", "Old Naples, FL", "Free on-site parking"]} />
            <VisitDetail Icon={Calendar} label="Hours" lines={["Mon – Sat", "8:00 AM – 10:00 PM", "Sundays by request"]} />
            <VisitDetail Icon={Radio} label="Contact" lines={["hello@239live.com", "(239) 555-0239", "Reply within 2 hours"]} />
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="relative border-t-2 border-live bg-card p-12 text-center md:p-16">
          <Badge tone="gold">Limited May calendar — booking now</Badge>
          <h3 className="mt-6 font-heading text-4xl tracking-broadcast text-cream md:text-6xl">
            Ready to record where<br />
            <span className="text-live">the stories happen?</span>
          </h3>
          <p className="mx-auto mt-5 max-w-xl text-cream/70">
            One studio. Broadcast-grade gear. Naples.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href={APP_URLS.booking}><Button size="lg">Book the Studio</Button></Link>
            <Link href="/studio"><Button variant="ghost" size="lg">View Rates</Button></Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

/* ───────────────────── components ───────────────────── */

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="max-w-3xl">
      <div className="text-[10px] uppercase tracking-[0.32em] text-live">{eyebrow}</div>
      <h2 className="mt-3 font-heading text-4xl tracking-broadcast text-cream md:text-6xl">{title}</h2>
      <div className="mt-4 h-px w-16 bg-live" />
    </div>
  );
}

function HeroTile({ Icon, label, sub }: { Icon: React.ComponentType<{ className?: string }>; label: string; sub: string }) {
  return (
    <div className="border border-card-border bg-card/40 p-4 transition-colors hover:border-live/60">
      <Icon className="mx-auto h-5 w-5 text-live" />
      <div className="mt-3 font-heading text-lg tracking-broadcast text-cream">{label}</div>
      <div className="mt-1 text-[10px] uppercase tracking-wider text-muted">{sub}</div>
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-bg px-6 py-10 text-center md:py-12">
      <div className="font-heading text-3xl tracking-broadcast text-live md:text-5xl">{value}</div>
      <div className="mt-2 text-[10px] uppercase tracking-[0.32em] text-cream/60">{label}</div>
    </div>
  );
}

function StreamCard({ Icon, name, range, description }: { Icon: React.ComponentType<{ className?: string }>; name: string; range: string; description: string }) {
  return (
    <Card className="h-full">
      <Icon className="h-5 w-5 text-live" />
      <h3 className="mt-4 font-heading text-2xl tracking-broadcast text-cream">{name}</h3>
      <div className="mt-1 text-[11px] uppercase tracking-wider text-live">{range}</div>
      <p className="mt-4 text-sm leading-relaxed text-cream/70">{description}</p>
    </Card>
  );
}

function ShowCard({ gradient, accent, name, format, description, tier }: { gradient: string; accent: string; name: string; format: string; description: string; tier: string }) {
  return (
    <div className={`relative flex h-full flex-col border border-card-border ${gradient} p-8 transition-transform hover:-translate-y-0.5 md:p-10`}>
      <div className={`flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] ${accent}`}>
        <Radio className="h-3 w-3" /> {format}
      </div>
      <h3 className="mt-4 font-heading text-4xl leading-[0.95] tracking-broadcast text-cream md:text-5xl">{name}</h3>
      <p className="mt-5 flex-1 text-sm leading-relaxed text-cream/85">{description}</p>
      <div className="mt-6">
        <Badge tone="gold">{tier}</Badge>
      </div>
    </div>
  );
}

function Testimonial({ quote, name, title }: { quote: string; name: string; title: string }) {
  return (
    <Card className="flex h-full flex-col">
      <Quote className="h-5 w-5 text-live" />
      <p className="mt-4 flex-1 text-sm leading-relaxed text-cream/85">"{quote}"</p>
      <div className="mt-6 border-t border-card-border pt-4">
        <div className="font-heading text-lg tracking-broadcast text-cream">{name}</div>
        <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted">{title}</div>
      </div>
    </Card>
  );
}

function VisitDetail({ Icon, label, lines }: { Icon: React.ComponentType<{ className?: string }>; label: string; lines: string[] }) {
  return (
    <div className="border-t-2 border-live bg-card p-6">
      <Icon className="h-5 w-5 text-live" />
      <div className="mt-4 text-[10px] uppercase tracking-[0.32em] text-live">{label}</div>
      <div className="mt-3 space-y-1 text-sm text-cream/80">
        {lines.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-card-border bg-bg-deep">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <div className="flex items-center gap-3">
              <span className="relative inline-flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-live-pulse rounded-full bg-live opacity-90" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-live" />
              </span>
              <span className="font-heading text-xl tracking-broadcast text-cream">
                239<span className="text-live"> </span>LIVE
              </span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-muted">
              Naples' premier podcast &amp; broadcasting studio. Established 2024.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-[11px] uppercase tracking-wider md:grid-cols-3">
            <FooterCol label="Studio">
              <Link href="/" className="text-muted hover:text-cream">Home</Link>
              <Link href="/studio" className="text-muted hover:text-cream">Studio</Link>
              <Link href="/shows" className="text-muted hover:text-cream">Shows</Link>
              <Link href={APP_URLS.booking} className="text-muted hover:text-cream">Book</Link>
            </FooterCol>
            <FooterCol label="Connect">
              <a href="#" className="text-muted hover:text-cream">Instagram</a>
              <a href="#" className="text-muted hover:text-cream">YouTube</a>
              <a href="#" className="text-muted hover:text-cream">LinkedIn</a>
              <a href="#" className="text-muted hover:text-cream">Facebook</a>
            </FooterCol>
            <FooterCol label="Studio">
              <span className="text-muted">Naples, FL</span>
              <span className="text-muted">(239) 555-0239</span>
              <span className="text-muted">hello@239live.com</span>
              <span className="text-muted">Mon–Sat · 8am–10pm</span>
            </FooterCol>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-card-border pt-6 text-[11px] text-muted">
          <div>© 2026 239 Live™. All Rights Reserved.</div>
          <a href={APP_URLS.agency} className="hover:text-cream">Naples Digital ↗</a>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.32em] text-live">{label}</div>
      <div className="mt-3 flex flex-col gap-2">{children}</div>
    </div>
  );
}

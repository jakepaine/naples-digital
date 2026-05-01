import Link from "next/link";
import { Card, Button, Badge } from "@naples/ui";
import { APP_URLS } from "@naples/mock-data";
import { Camera, Lightbulb, Speaker, Sofa, Mic, ArrowRight, Wrench } from "lucide-react";
import { SiteFooter } from "../page";

const RATES = [
  { type: "Day Rate Session", who: "Solo creators · podcasters · influencers", price: "$150 – 400 / day", note: "Includes studio gear, lighting, ops support" },
  { type: "Half Day Session", who: "Quick shoots · stand-up promo · short interviews", price: "$100 – 250 / 4 hr", note: "Best for 1–2 person crews" },
  { type: "Real Estate Session", who: "Listing tours, broker brand content", price: "$300 – 600 / session", note: "Multi-location packages available" },
  { type: "Monthly Studio Membership", who: "Recurring shows · agencies · creator brands", price: "$1,500 / mo", note: "Unlimited bookings · priority calendar" },
  { type: "Corporate Package", who: "Company brand content programs", price: "$3,000 – 5,000 / mo", note: "Full production support · dedicated PM" },
  { type: "Event Night", who: "Private events · podcast launches · brand activations", price: "$500 – 2,000 / event", note: "Up to 50 guests · catering coordination optional" },
];

export default function StudioPage() {
  return (
    <main>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-card-border bg-bg-deep">
        <div className="absolute inset-0 -z-10 bg-live-glow" />
        <div className="mx-auto max-w-5xl px-6 py-24 text-center md:py-32">
          <div className="flex items-center justify-center gap-3">
            <span className="relative inline-flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-live-pulse rounded-full bg-live opacity-90" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-live" />
            </span>
            <span className="text-[11px] uppercase tracking-[0.32em] text-live">Studio &amp; Packages</span>
          </div>
          <h1 className="mt-6 font-heading text-6xl leading-[0.95] tracking-broadcast text-cream md:text-8xl">
            One Room.<br />
            <span className="text-live">Built For The Work.</span>
          </h1>
          <div className="mx-auto mt-5 h-px w-16 bg-live" />
          <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-cream/80">
            Three-camera broadcast setup. Acoustic-treated walls. A set designed to carry the kind of
            conversation that gets re-watched and shared — not skimmed.
          </p>
        </div>
      </section>

      {/* RATE CARD */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <SectionHeader eyebrow="Rate card" title="All packages." />
        <Card className="mt-12 overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-bg/60 text-left text-[10px] uppercase tracking-[0.18em] text-muted">
                <th className="px-6 py-4">Package</th>
                <th className="px-6 py-4">Who it's for</th>
                <th className="px-6 py-4">Price</th>
                <th className="hidden px-6 py-4 lg:table-cell">Notes</th>
              </tr>
            </thead>
            <tbody>
              {RATES.map((r, i) => (
                <tr key={i} className="border-b border-card-border/40 last:border-b-0 hover:bg-card-border/20">
                  <td className="px-6 py-5 align-top">
                    <div className="font-heading text-lg tracking-broadcast text-cream">{r.type}</div>
                  </td>
                  <td className="px-6 py-5 align-top text-cream/75">{r.who}</td>
                  <td className="px-6 py-5 align-top">
                    <span className="text-[11px] uppercase tracking-wider text-live">{r.price}</span>
                  </td>
                  <td className="hidden px-6 py-5 align-top text-xs text-muted lg:table-cell">{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>

      {/* SPECS */}
      <section className="border-y border-card-border bg-bg-deep py-24">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeader eyebrow="What's in the room" title="Studio Specs." />
          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Spec Icon={Camera} label="Cameras" body="3× Sony FX3 broadcast cameras · 4K · multi-angle live switching" />
            <Spec Icon={Lightbulb} label="Lighting" body="Aputure 600D + 300X key/fill · diffused bicolor panels · backlight rim" />
            <Spec Icon={Speaker} label="Acoustics" body="GIK acoustic panels · bass traps · isolated wall treatment · zero echo" />
            <Spec Icon={Sofa} label="Set Design" body="Custom set · brand-neutral palette · interchangeable backdrops" />
            <Spec Icon={Mic} label="Mics" body="Shure SM7B × 4 · backup lavs · isolated booth feed" />
          </div>
        </div>
      </section>

      {/* EQUIPMENT RENTAL CALLOUT */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <Card>
          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div className="flex items-start gap-4">
              <div className="border border-live/30 bg-live/5 p-3 text-live">
                <Wrench className="h-6 w-6" />
              </div>
              <div>
                <Badge tone="gold">Optional</Badge>
                <h3 className="mt-3 font-heading text-3xl tracking-broadcast text-cream">Equipment Rental</h3>
                <p className="mt-2 max-w-xl text-sm text-cream/70">
                  $1,500/mo for take-out crews — same broadcast-grade kit, off-site for field shoots.
                  Separate agreement, billed independently from the studio.
                </p>
              </div>
            </div>
            <Link href={APP_URLS.booking}>
              <Button>Book the Studio <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          </div>
        </Card>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-24 text-center">
        <Link href={APP_URLS.booking}>
          <Button size="lg">Book a Session <ArrowRight className="ml-2 h-4 w-4" /></Button>
        </Link>
      </section>

      <SiteFooter />
    </main>
  );
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="max-w-3xl">
      <div className="text-[10px] uppercase tracking-[0.32em] text-live">{eyebrow}</div>
      <h2 className="mt-3 font-heading text-4xl tracking-broadcast text-cream md:text-6xl">{title}</h2>
      <div className="mt-4 h-px w-16 bg-live" />
    </div>
  );
}

function Spec({ Icon, label, body }: { Icon: React.ComponentType<{ className?: string }>; label: string; body: string }) {
  return (
    <Card className="h-full">
      <Icon className="h-5 w-5 text-live" />
      <div className="mt-4 font-heading text-xl tracking-broadcast text-cream">{label}</div>
      <p className="mt-3 text-xs leading-relaxed text-cream/70">{body}</p>
    </Card>
  );
}

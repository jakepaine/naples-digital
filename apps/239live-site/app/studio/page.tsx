import Link from "next/link";
import { Card, Button, Badge } from "@naples/ui";
import { APP_URLS } from "@naples/mock-data";
import { Camera, Lightbulb, Speaker, Sofa, Mic, ArrowRight, Wrench } from "lucide-react";

const RATES = [
  { type: "Day Rate Session", who: "Solo creators · podcasters · influencers", price: "$150–400 / day", note: "Includes studio gear, lighting, ops support" },
  { type: "Half Day Session", who: "Quick shoots · stand-up promo · short interviews", price: "$100–250 / 4 hr", note: "Best for 1–2 person crews" },
  { type: "Real Estate Session", who: "Listing tours, broker brand content", price: "$300–600 / session", note: "Multi-location packages available" },
  { type: "Monthly Studio Membership", who: "Recurring shows · agencies · creator brands", price: "$1,500 / mo", note: "Unlimited bookings · priority calendar" },
  { type: "Corporate Package", who: "Company brand content programs", price: "$3,000–5,000 / mo", note: "Full production support · dedicated PM" },
  { type: "Event Night", who: "Private events · podcast launches · brand activations", price: "$500–2,000 / event", note: "Up to 50 guests · catering coordination optional" },
];

export default function StudioPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-24">
      <header className="max-w-3xl">
        <div className="text-[10px] uppercase tracking-[0.32em] text-gold">Studio & Packages</div>
        <h1 className="mt-4 font-heading text-5xl text-cream md:text-6xl">
          One room. <span className="text-gold">Built for the work.</span>
        </h1>
        <div className="mt-4 h-px w-16 bg-gold" />
        <p className="mt-6 text-base leading-relaxed text-cream/80">
          Three-camera broadcast setup. Acoustic-treated walls. A set designed to carry the kind of conversation
          that gets re-watched and shared, not skimmed.
        </p>
      </header>

      {/* RATE CARD */}
      <section className="mt-16">
        <div className="text-[10px] uppercase tracking-[0.22em] text-gold">Rate card</div>
        <h2 className="mt-2 font-heading text-3xl text-cream md:text-4xl">All packages</h2>
        <div className="mt-2 h-px w-12 bg-gold" />
        <Card className="mt-8 overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-bg/50 text-left text-[10px] uppercase tracking-wider text-muted">
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
                    <div className="font-heading text-base text-cream">{r.type}</div>
                  </td>
                  <td className="px-6 py-5 align-top text-cream/70">{r.who}</td>
                  <td className="px-6 py-5 align-top text-gold">{r.price}</td>
                  <td className="hidden px-6 py-5 align-top text-xs text-muted lg:table-cell">{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>

      {/* SPECS */}
      <section className="mt-20">
        <div className="text-[10px] uppercase tracking-[0.22em] text-gold">What's in the room</div>
        <h2 className="mt-2 font-heading text-3xl text-cream md:text-4xl">Studio Specs</h2>
        <div className="mt-2 h-px w-12 bg-gold" />
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Spec icon={<Camera className="h-5 w-5" />} label="Cameras" body="3× Sony FX3 broadcast cameras · 4K · multi-angle live switching" />
          <Spec icon={<Lightbulb className="h-5 w-5" />} label="Lighting" body="Aputure 600D + 300X key/fill · diffused bicolor panels · backlight rim" />
          <Spec icon={<Speaker className="h-5 w-5" />} label="Acoustics" body="GIK acoustic panels · bass traps · isolated wall treatment · zero echo" />
          <Spec icon={<Sofa className="h-5 w-5" />} label="Set Design" body="Custom set · brand-neutral palette · interchangeable backdrops" />
          <Spec icon={<Mic className="h-5 w-5" />} label="Mics" body="Shure SM7B × 4 · backup lavs · isolated booth feed" />
        </div>
      </section>

      {/* EQUIPMENT RENTAL CALLOUT */}
      <section className="mt-16">
        <Card>
          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div className="flex items-start gap-4">
              <div className="text-gold"><Wrench className="h-6 w-6" /></div>
              <div>
                <Badge tone="gold">Optional</Badge>
                <h3 className="mt-3 font-heading text-2xl text-cream">Equipment Rental</h3>
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

      <section className="mt-20 text-center">
        <Link href={APP_URLS.booking}>
          <Button size="lg">Book a Session <ArrowRight className="ml-2 h-4 w-4" /></Button>
        </Link>
      </section>
    </main>
  );
}

function Spec({ icon, label, body }: { icon: React.ReactNode; label: string; body: string }) {
  return (
    <Card className="h-full">
      <div className="text-gold">{icon}</div>
      <div className="mt-4 font-heading text-base text-cream">{label}</div>
      <p className="mt-3 text-xs leading-relaxed text-cream/70">{body}</p>
    </Card>
  );
}

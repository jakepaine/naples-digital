import Link from "next/link";
import { Card, Button } from "@naples/ui";
import { Mail, MapPin, ArrowRight } from "lucide-react";

export default function ContactPage() {
  return (
    <main>
      <section className="border-b border-card-border bg-bg-deep">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="text-[10px] uppercase tracking-[0.32em] text-gold">Contact</div>
          <h1 className="mt-5 font-heading text-5xl text-cream md:text-6xl">Talk to us.</h1>
          <div className="mt-6 h-px w-24 bg-gold" />
          <p className="mt-6 max-w-2xl text-base text-cream/75 md:text-lg">
            Email is the fastest way to reach us. We respond within one business day.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-20">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gold" />
              <div className="text-[10px] uppercase tracking-[0.22em] text-gold">Sales & Demo</div>
            </div>
            <h3 className="mt-3 font-heading text-2xl text-cream">Book a demo</h3>
            <p className="mt-3 text-sm leading-relaxed text-cream/75">
              30 minutes. We&rsquo;ll walk you through the platform on real tenant data and tell you
              whether it&rsquo;s a fit for your business.
            </p>
            <div className="mt-6">
              <a href="mailto:jake@naples.digital?subject=Naples Digital Demo">
                <Button>jake@naples.digital <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </a>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gold" />
              <div className="text-[10px] uppercase tracking-[0.22em] text-gold">Where we are</div>
            </div>
            <h3 className="mt-3 font-heading text-2xl text-cream">Naples, FL</h3>
            <p className="mt-3 text-sm leading-relaxed text-cream/75">
              Built and operated from Southwest Florida by Jake Paine and Noah. Purity Goat LLC.
            </p>
          </Card>
        </div>
      </section>

      <footer className="border-t border-card-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-xs text-muted">
          <div>© 2026 Naples Digital · Purity Goat LLC · Naples, FL</div>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-cream">Home</Link>
            <Link href="/pricing" className="hover:text-cream">Pricing</Link>
            <Link href="/modules" className="hover:text-cream">Modules</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

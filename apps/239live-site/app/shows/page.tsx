import Link from "next/link";
import { Button, Badge } from "@naples/ui";
import { APP_URLS } from "@naples/mock-data";
import { ArrowRight, Radio } from "lucide-react";
import { SiteFooter } from "../page";

export default function ShowsPage() {
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
            <span className="text-[11px] uppercase tracking-[0.32em] text-live">The Network</span>
          </div>
          <h1 className="mt-6 font-heading text-6xl leading-[0.95] tracking-broadcast text-cream md:text-8xl">
            Three Formats.<br />
            <span className="text-live">One Regional Voice.</span>
          </h1>
          <div className="mx-auto mt-5 h-px w-16 bg-live" />
          <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-cream/80">
            Every show in the 239 Live network is a customer-acquisition engine, a sponsor placement
            vehicle, and an audience-building flywheel — all running off the same studio floor.
          </p>
        </div>
      </section>

      {/* SHOWS */}
      <div className="mx-auto max-w-7xl space-y-8 px-6 py-20">
        <Show
          gradient="bg-show-billionaire"
          accent="text-amber"
          name="Billionaire Coast"
          subtitle="Diary of a CEO format · for SWFL"
          format="45–60 min long-form interview"
          description="The wealth, power, and ambition reshaping Southwest Florida. Naples billionaires, family-office principals, hedge fund managers, and the developers actually putting up the buildings — sat down for one long, unhurried conversation. We don't chase soundbites. We let people tell the truth slowly."
          guests={["Real estate developers", "Hedge fund managers", "Private equity partners", "Family-office principals", "Yacht industry executives"]}
          sponsorTiers={[
            { name: "Bronze", price: "$300/show", perks: "Logo placement · show-open mention" },
            { name: "Silver", price: "$500/show", perks: "Mid-roll integration · 1 vertical clip tagged to your handle" },
            { name: "Gold", price: "$1,000/show", perks: "Title sponsor · host integration · all-platform clip distribution · quarterly co-marketing review" },
          ]}
        />

        <Show
          gradient="bg-show-built"
          accent="text-emerald"
          name="239 Built"
          subtitle="Hosted by Kevin"
          format="20–30 min · founder interviews"
          description="Local SWFL founders, operators, and builders. Short enough to ship, long enough to matter. Every episode is also a relationship — every guest is a potential studio client, content agency client, or sponsor. The show pays for itself in business closed off-camera."
          guests={["Restaurant founders", "Custom home builders", "Marine industry operators", "Hospitality leaders", "Niche service businesses"]}
          sponsorTiers={[
            { name: "Bronze", price: "$300/show", perks: "Show-open mention · logo card" },
            { name: "Silver", price: "$500/show", perks: "Host-read integration · clip cross-tag" },
          ]}
        />

        <Show
          gradient="bg-show-keys"
          accent="text-sapphire"
          name="SWFL Keys"
          subtitle="Short-form first · cultural pulse"
          format="Event coverage · vertical-native"
          description="Music, festivals, art, food, the weekend. Built for vertical clips, designed to dominate the regional algorithm. Where Billionaire Coast goes deep, SWFL Keys goes wide — capturing the cultural texture that makes Southwest Florida a place worth living in, not just retiring to."
          guests={["Naples Art Week", "Bonita Music Festival", "Local culinary events", "Beachfront brand activations", "Boutique hospitality launches"]}
          sponsorTiers={[
            { name: "Custom event partnerships", price: "$500 – 2,000", perks: "Per-event packages tied to specific festivals, launches, or seasonal pushes" },
          ]}
        />
      </div>

      {/* CTA */}
      <section className="border-t border-card-border bg-bg-deep py-20 text-center">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="font-heading text-4xl tracking-broadcast text-cream md:text-6xl">
            Sponsor a show.<br /><span className="text-live">Reach a region.</span>
          </h2>
          <div className="mx-auto mt-5 h-px w-16 bg-live" />
          <Link href={APP_URLS.booking} className="mt-8 inline-block">
            <Button size="lg">Become a Sponsor <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function Show({
  gradient,
  accent,
  name,
  subtitle,
  format,
  description,
  guests,
  sponsorTiers,
}: {
  gradient: string;
  accent: string;
  name: string;
  subtitle: string;
  format: string;
  description: string;
  guests: string[];
  sponsorTiers: { name: string; price: string; perks: string }[];
}) {
  return (
    <section className={`relative border border-card-border ${gradient}`}>
      <div className="grid grid-cols-1 gap-10 p-8 md:grid-cols-12 md:p-12">
        <div className="md:col-span-5">
          <div className={`flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] ${accent}`}>
            <Radio className="h-3 w-3" /> {format}
          </div>
          <h2 className="mt-4 font-heading text-5xl leading-[0.95] tracking-broadcast text-cream md:text-7xl">{name}</h2>
          <div className="mt-3 text-sm italic text-cream/60">{subtitle}</div>
        </div>
        <div className="md:col-span-7 md:border-l md:border-card-border-strong md:pl-12">
          <p className="text-base leading-relaxed text-cream/85">{description}</p>

          <div className="mt-8">
            <div className="text-[10px] uppercase tracking-[0.22em] text-live">Guest Profile</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {guests.map((g) => (
                <span key={g} className="border border-card-border-strong bg-bg/40 px-3 py-1 text-xs text-cream/80">{g}</span>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <div className="text-[10px] uppercase tracking-[0.22em] text-live">Sponsor Tiers</div>
            <div className="mt-4 grid grid-cols-1 gap-3">
              {sponsorTiers.map((tier) => (
                <div key={tier.name} className="border border-card-border-strong bg-bg/60 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-heading text-xl tracking-broadcast text-cream">{tier.name}</span>
                    <Badge tone="gold">{tier.price}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-cream/75">{tier.perks}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

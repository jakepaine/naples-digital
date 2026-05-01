import Link from "next/link";
import { Card, Button, Badge } from "@naples/ui";
import { APP_URLS } from "@naples/mock-data";
import { ArrowRight } from "lucide-react";

export default function ShowsPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-24">
      <header className="max-w-3xl">
        <div className="text-[10px] uppercase tracking-[0.32em] text-gold">The shows</div>
        <h1 className="mt-4 font-heading text-5xl text-cream md:text-6xl">
          Three formats.<br /><span className="text-gold">One regional voice.</span>
        </h1>
        <div className="mt-4 h-px w-16 bg-gold" />
        <p className="mt-6 text-base leading-relaxed text-cream/80">
          Every show in the 239 Live network is a customer-acquisition engine, a sponsor placement vehicle,
          and an audience-building flywheel — all running off the same studio floor.
        </p>
      </header>

      {/* BILLIONAIRE COAST */}
      <Show
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

      {/* 239 BUILT */}
      <Show
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

      {/* SWFL KEYS */}
      <Show
        name="SWFL Keys"
        subtitle="Short-form first · cultural pulse"
        format="Event coverage · vertical-native"
        description="Music, festivals, art, food, the weekend. Built for vertical clips, designed to dominate the regional algorithm. Where Billionaire Coast goes deep, SWFL Keys goes wide — capturing the cultural texture that makes Southwest Florida a place worth living in, not just retiring to."
        guests={["Naples Art Week", "Bonita Music Festival", "Local culinary events", "Beachfront brand activations", "Boutique hospitality launches"]}
        sponsorTiers={[
          { name: "Custom event partnerships", price: "$500–2,000", perks: "Per-event packages tied to specific festivals, launches, or seasonal pushes" },
        ]}
      />

      <section className="mt-24 text-center">
        <Link href={APP_URLS.booking}>
          <Button size="lg">Become a Sponsor <ArrowRight className="ml-2 h-4 w-4" /></Button>
        </Link>
      </section>
    </main>
  );
}

function Show({ name, subtitle, format, description, guests, sponsorTiers }: { name: string; subtitle: string; format: string; description: string; guests: string[]; sponsorTiers: { name: string; price: string; perks: string }[] }) {
  return (
    <section className="mt-20 border border-card-border bg-card">
      <div className="grid grid-cols-1 gap-12 p-8 md:grid-cols-12 md:p-12">
        <div className="md:col-span-5">
          <div className="text-[10px] uppercase tracking-[0.22em] text-gold">{format}</div>
          <h2 className="mt-3 font-heading text-5xl leading-[0.95] text-cream md:text-6xl">{name}</h2>
          <div className="mt-3 text-sm italic text-cream/60">{subtitle}</div>
        </div>
        <div className="md:col-span-7 md:border-l md:border-card-border md:pl-12">
          <p className="text-base leading-relaxed text-cream/80">{description}</p>
          <div className="mt-8">
            <div className="text-[10px] uppercase tracking-wider text-gold">Guest profile</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {guests.map((g) => (
                <span key={g} className="border border-card-border px-3 py-1 text-xs text-cream/80">{g}</span>
              ))}
            </div>
          </div>
          <div className="mt-8">
            <div className="text-[10px] uppercase tracking-wider text-gold">Sponsor tiers</div>
            <div className="mt-4 grid grid-cols-1 gap-3">
              {sponsorTiers.map((tier) => (
                <div key={tier.name} className="border border-card-border bg-bg p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-heading text-lg text-cream">{tier.name}</span>
                    <Badge tone="gold">{tier.price}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-cream/70">{tier.perks}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

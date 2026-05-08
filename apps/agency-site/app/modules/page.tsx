import Link from "next/link";
import { Card, Button, Badge } from "@naples/ui";
import { MODULES, moduleCategoryLabel, type ModuleCategory } from "@naples/db";
import { ArrowRight } from "lucide-react";

const CATEGORY_ORDER: ModuleCategory[] = ["sales", "content", "ops", "vertical"];

export default function ModulesCatalogPage() {
  const grouped: Record<ModuleCategory, Array<typeof MODULES[keyof typeof MODULES]>> = {
    sales: [], content: [], ops: [], vertical: [],
  };
  for (const m of Object.values(MODULES)) grouped[m.category].push(m);

  return (
    <main>
      {/* HERO */}
      <section className="border-b border-card-border bg-bg-deep">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="text-[10px] uppercase tracking-[0.32em] text-gold">Modules</div>
          <h1 className="mt-5 font-heading text-5xl text-cream md:text-6xl">Every module<br /><span className="text-gold">in the platform.</span></h1>
          <div className="mt-6 h-px w-24 bg-gold" />
          <p className="mt-6 max-w-2xl text-base text-cream/75 md:text-lg">
            Each module is a feature area of the platform. Tiers bundle a default set; add-ons enable
            individual modules à la carte above tier.
          </p>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        {CATEGORY_ORDER.map((cat) => (
          <div key={cat} className="mb-16 last:mb-0">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-gold">{moduleCategoryLabel(cat)}</div>
                <div className="mt-1 h-px w-12 bg-gold" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {grouped[cat].map((m) => (
                <Card key={m.key} className="flex h-full flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-heading text-xl tracking-broadcast text-cream">{m.name}</div>
                    <Badge tone="gold">${m.addonMonthly}/mo</Badge>
                  </div>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-cream/75">{m.description}</p>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section className="border-y border-card-border bg-card/40 py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="font-heading text-3xl text-cream md:text-4xl">
            See which modules come with which tier.
          </h2>
          <div className="mt-8">
            <Link href="/pricing">
              <Button size="lg">Compare Tiers <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-card-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-xs text-muted">
          <div>© 2026 Naples Digital · Purity Goat LLC · Naples, FL</div>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-cream">Home</Link>
            <Link href="/pricing" className="hover:text-cream">Pricing</Link>
            <Link href="/contact" className="hover:text-cream">Contact</Link>
            <a href="mailto:jake@naples.digital" className="hover:text-cream">jake@naples.digital</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

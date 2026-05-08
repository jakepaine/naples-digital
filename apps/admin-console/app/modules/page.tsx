import Link from "next/link";
import {
  listTenants,
  MODULES,
  TIERS,
  modulesForTier,
  isModuleEnabled,
  moduleCategoryLabel,
  type ModuleKey,
  type ModuleCategory,
  type Tier,
} from "@naples/db";
import { Card, Badge } from "@naples/ui";
import { ArrowLeft, Check, Plus, Lock } from "lucide-react";

export const dynamic = "force-dynamic";

const CATEGORY_ORDER: ModuleCategory[] = ["sales", "content", "ops", "vertical"];

const TIER_ORDER: Tier[] = ["starter", "growth", "premium", "design_partner", "enterprise"];

export default async function ModulesPage() {
  const tenants = await listTenants();
  const moduleEntries = (Object.values(MODULES)).sort((a, b) => {
    const ca = CATEGORY_ORDER.indexOf(a.category);
    const cb = CATEGORY_ORDER.indexOf(b.category);
    if (ca !== cb) return ca - cb;
    return a.name.localeCompare(b.name);
  });

  return (
    <main className="mx-auto max-w-[1400px] px-8 py-12">
      <div className="mb-2">
        <Link href="/" className="inline-flex items-center gap-1 text-xs text-muted hover:text-cream">
          <ArrowLeft className="h-3 w-3" /> Tenants
        </Link>
      </div>
      <header className="mb-10">
        <div className="text-[10px] uppercase tracking-[0.32em] text-gold">Naples Digital</div>
        <h1 className="mt-2 font-heading text-5xl tracking-broadcast text-cream">Modules</h1>
        <div className="mt-3 h-px w-16 bg-gold" />
        <p className="mt-4 max-w-2xl text-sm text-cream/70">
          Each module is a feature area of the platform. Tiers bundle a default set of modules; add-ons enable individual
          modules above tier. Each tenant&rsquo;s row shows what they currently have access to.
        </p>
      </header>

      <section className="mb-10">
        <div className="mb-3 text-[10px] uppercase tracking-[0.18em] text-muted">Pricing tiers</div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {TIER_ORDER.map((key) => {
            const t = TIERS[key];
            return (
              <Card key={t.key}>
                <div className="flex items-start justify-between gap-2">
                  <div className="font-heading text-xl tracking-broadcast text-cream">{t.name}</div>
                  <TierBadge tier={t.key} />
                </div>
                <div className="mt-2 font-heading text-2xl tracking-broadcast text-gold">
                  {t.isCustom ? "Custom" : `$${t.monthlyPrice.toLocaleString()}/mo`}
                </div>
                {!t.isCustom && (
                  <div className="text-[11px] text-muted">+ ${t.setupFee.toLocaleString()} setup</div>
                )}
                <p className="mt-3 text-xs text-cream/60">{t.description}</p>
                <div className="mt-3 text-[10px] uppercase tracking-[0.18em] text-muted">
                  {t.isCustom ? "Built bespoke" : `${t.modules.length} modules included`}
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted">Tenant × module matrix</div>
          <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3 w-3 text-emerald" /> Tier-included
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Plus className="h-3 w-3 text-violet" /> Add-on
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Lock className="h-3 w-3 text-muted" /> Not enabled
            </span>
          </div>
        </div>

        <Card className="overflow-x-auto p-0">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-card-border">
                <th className="sticky left-0 z-10 bg-card-bg px-4 py-3 text-left text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
                  Tenant
                </th>
                <th className="px-3 py-3 text-left text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
                  Tier
                </th>
                {moduleEntries.map((m) => (
                  <th key={m.key} className="px-3 py-3 text-left text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
                    <div className="text-cream">{m.name}</div>
                    <div className="mt-0.5 text-muted">{moduleCategoryLabel(m.category)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => {
                const tier = (t.tier ?? "starter") as Tier;
                const tierMods = new Set(modulesForTier(tier));
                return (
                  <tr key={t.id} className="border-b border-card-border last:border-0 hover:bg-cream/[0.02]">
                    <td className="sticky left-0 z-10 bg-card-bg px-4 py-3 align-top">
                      <Link href={`/tenants/${t.id}`} className="group">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 shrink-0 border border-card-border"
                            style={{ background: t.brand.primary_color ?? "#E8192C" }}
                          />
                          <div>
                            <div className="font-heading text-sm tracking-broadcast text-cream group-hover:text-gold">
                              {t.name}
                            </div>
                            <div className="font-mono text-[10px] text-muted">{t.slug}</div>
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <TierBadge tier={tier} />
                    </td>
                    {moduleEntries.map((m) => {
                      const enabled = isModuleEnabled(t.enabled_modules, m.key as ModuleKey);
                      const fromTier = tierMods.has(m.key as ModuleKey);
                      return (
                        <td key={m.key} className="px-3 py-3 align-top">
                          <ModuleCell enabled={enabled} fromTier={fromTier} />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={moduleEntries.length + 2} className="px-4 py-6 text-center text-sm text-muted">
                    No tenants yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </section>

      <section className="mt-10">
        <div className="mb-3 text-[10px] uppercase tracking-[0.18em] text-muted">Module catalog</div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {moduleEntries.map((m) => (
            <Card key={m.key}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-heading text-lg tracking-broadcast text-cream">{m.name}</div>
                  <div className="mt-0.5 font-mono text-[10px] text-muted">{m.app}</div>
                </div>
                <Badge tone={categoryTone(m.category)}>{moduleCategoryLabel(m.category)}</Badge>
              </div>
              <p className="mt-3 text-xs text-cream/70">{m.description}</p>
              <div className="mt-3 text-[10px] uppercase tracking-[0.18em] text-muted">
                Add-on price: <span className="text-cream">${m.addonMonthly}/mo</span>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}

function ModuleCell({ enabled, fromTier }: { enabled: boolean; fromTier: boolean }) {
  if (enabled && fromTier) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald/15 text-emerald" title="Included in tier">
        <Check className="h-4 w-4" />
      </span>
    );
  }
  if (enabled && !fromTier) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-violet/15 text-violet" title="Add-on">
        <Plus className="h-4 w-4" />
      </span>
    );
  }
  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted/10 text-muted" title="Not enabled">
      <Lock className="h-3.5 w-3.5" />
    </span>
  );
}

function TierBadge({ tier }: { tier: Tier }) {
  const t = TIERS[tier];
  if (tier === "design_partner") return <Badge tone="emerald">{t.name}</Badge>;
  if (tier === "premium") return <Badge tone="gold">{t.name}</Badge>;
  if (tier === "growth") return <Badge tone="violet">{t.name}</Badge>;
  if (tier === "enterprise") return <Badge tone="rose">{t.name}</Badge>;
  return <Badge tone="muted">{t.name}</Badge>;
}

function categoryTone(category: ModuleCategory): "sapphire" | "violet" | "amber" | "rose" {
  if (category === "sales") return "sapphire";
  if (category === "content") return "violet";
  if (category === "ops") return "amber";
  return "rose";
}

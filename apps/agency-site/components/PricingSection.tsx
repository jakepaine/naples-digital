"use client";
import { useState } from "react";
import { motion } from "motion/react";
import NumberFlow from "@number-flow/react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TIERS, MODULES, type Tier, type ModuleKey } from "@naples/db";
import clsx from "clsx";

const PUBLIC_TIERS: Tier[] = ["starter", "growth", "premium"];
const POPULAR_KEY: Tier = "growth";

// Industry-standard SaaS yearly pricing: 10 months for the price of 12 (~17% off)
const yearlyOf = (monthly: number) => monthly * 10;

function modulesAddedAt(tier: Tier): ModuleKey[] {
  const idx = PUBLIC_TIERS.indexOf(tier);
  const current = TIERS[tier].modules as ModuleKey[];
  if (idx <= 0) return current;
  const prev = new Set(TIERS[PUBLIC_TIERS[idx - 1]].modules as ModuleKey[]);
  return current.filter((m) => !prev.has(m));
}

function PricingToggle({ isYearly, onChange }: { isYearly: boolean; onChange: (y: boolean) => void }) {
  return (
    <div className="flex justify-center">
      <div className="relative inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1 backdrop-blur">
        {(["Monthly", "Yearly"] as const).map((label, i) => {
          const selected = (i === 1) === isYearly;
          return (
            <button
              key={label}
              onClick={() => onChange(i === 1)}
              className={clsx(
                "relative z-10 h-10 rounded-full px-6 text-sm font-medium transition-colors",
                selected ? "text-white" : "text-white/55 hover:text-white"
              )}
            >
              {selected && (
                <motion.span
                  layoutId="pricing-toggle"
                  className="absolute inset-0 rounded-full bg-gradient-to-t from-grad-bronze via-gold to-grad-amber shadow-[0_0_24px_rgba(184,137,62,0.45)]"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <span className="relative flex items-center gap-2">
                {label}
                {label === "Yearly" && (
                  <span
                    className={clsx(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-semibold transition-colors",
                      selected ? "bg-white/20 text-white" : "bg-gold/20 text-gold"
                    )}
                  >
                    Save 17%
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const revealVariants = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.55, delay: i * 0.12 },
  }),
};

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section className="relative overflow-hidden bg-ink">
      {/* Grid pattern with radial mask */}
      <div
        className="absolute inset-0 -z-10 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "70px 80px",
          maskImage: "radial-gradient(ellipse 50% 50% at center, white 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 50% 50% at center, white 30%, transparent 75%)",
        }}
      />

      {/* Gold radial glow */}
      <div
        className="pointer-events-none absolute inset-x-[10%] top-0 -z-10 h-[80%]"
        style={{
          backgroundImage: "radial-gradient(ellipse 60% 60% at 50% 30%, rgba(184,137,62,0.45) 0%, transparent 70%)",
          mixBlendMode: "screen",
        }}
      />

      {/* Soft glowing ring (replicates original's giant ellipse outline) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-[420px] left-1/2 -z-10 h-[640px] w-[1280px] -translate-x-1/2 rounded-full"
        style={{
          border: "180px solid rgba(184,137,62,0.32)",
          filter: "blur(92px)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
        {/* Heading */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={revealVariants}
          custom={0}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-medium text-gold">
            Pricing
          </div>
          <h2 className="mt-6 font-heading text-4xl font-semibold leading-[1.05] tracking-tightest text-white lg:text-5xl">
            Plans that work for your business.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/60">
            Three public tiers. Each bundles a default set of modules; add-ons enable individual modules above tier.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={revealVariants}
          custom={1}
          className="mt-8"
        >
          <PricingToggle isYearly={isYearly} onChange={setIsYearly} />
        </motion.div>

        {/* Cards */}
        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-3">
          {PUBLIC_TIERS.map((key, idx) => {
            const t = TIERS[key];
            const popular = key === POPULAR_KEY;
            const price = isYearly ? yearlyOf(t.monthlyPrice) : t.monthlyPrice;
            const tierIdx = PUBLIC_TIERS.indexOf(key);
            const modules = tierIdx === 0 ? (t.modules as ModuleKey[]) : modulesAddedAt(key);
            const headerLabel =
              tierIdx === 0
                ? "Starter includes:"
                : `Everything in ${TIERS[PUBLIC_TIERS[tierIdx - 1]].name}, plus:`;

            return (
              <motion.div
                key={key}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={revealVariants}
                custom={2 + idx}
                className={clsx(
                  "relative rounded-2xl border p-6 text-white",
                  popular
                    ? "z-20 border-gold/40 bg-gradient-to-b from-[#0E2238] via-ink-deep to-ink shadow-[0_-13px_240px_-20px_rgba(184,137,62,0.6)]"
                    : "z-10 border-white/10 bg-gradient-to-b from-ink-deep to-ink"
                )}
              >
                {popular && (
                  <div className="absolute -top-3 left-6">
                    <span className="rounded-full bg-gradient-to-r from-grad-amber via-gold to-grad-bronze px-3 py-1 text-xs font-semibold text-white shadow-soft">
                      Most popular
                    </span>
                  </div>
                )}
                <div className="font-heading text-2xl font-semibold tracking-tight">{t.name}</div>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-heading text-4xl font-semibold tracking-tightest">
                    $
                    <NumberFlow
                      value={price}
                      format={{ useGrouping: true }}
                      className="font-heading text-4xl font-semibold tracking-tightest"
                    />
                  </span>
                  <span className="text-sm text-white/55">/{isYearly ? "year" : "month"}</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-white/60">{t.description}</p>

                <a
                  href="mailto:jake@naples.digital?subject=Naples Digital Pricing"
                  className={clsx(
                    "group mt-6 flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-3.5 text-base font-medium transition-all",
                    popular
                      ? "border border-gold/50 bg-gradient-to-t from-grad-bronze via-gold to-grad-amber text-white shadow-[0_8px_24px_-8px_rgba(184,137,62,0.7)] hover:from-gold hover:to-white"
                      : "border border-white/10 bg-gradient-to-t from-ink-deep to-white/[0.06] text-white shadow-lg shadow-black/40 hover:border-gold/30"
                  )}
                >
                  Get started
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </a>

                <div className="mt-8 space-y-3 border-t border-white/10 pt-6">
                  <h4 className="text-sm font-medium text-white">{headerLabel}</h4>
                  <ul className="space-y-2.5">
                    {modules.map((mKey) => (
                      <li key={mKey} className="flex items-center gap-2.5 text-sm text-white/70">
                        <span className="flex h-2 w-2 shrink-0 rounded-full bg-gradient-to-br from-grad-amber to-gold shadow-[0_0_8px_rgba(184,137,62,0.6)]" />
                        {MODULES[mKey].name}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Below-cards CTA */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={revealVariants}
          custom={5}
          className="mt-12 text-center"
        >
          <Link
            href="/pricing"
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-white/65 transition-colors hover:text-gold"
          >
            See full pricing details + custom tiers
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

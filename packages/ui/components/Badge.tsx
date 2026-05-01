import { ReactNode } from "react";
import clsx from "clsx";

type BadgeTone = "gold" | "cream" | "emerald" | "rose" | "sapphire" | "amber" | "violet" | "muted";

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

const TONE: Record<BadgeTone, string> = {
  gold: "bg-gold/15 text-gold border-gold/40",
  cream: "bg-cream/10 text-cream border-cream/30",
  emerald: "bg-emerald/15 text-emerald border-emerald/40",
  rose: "bg-rose/15 text-rose border-rose/40",
  sapphire: "bg-sapphire/15 text-sapphire border-sapphire/40",
  amber: "bg-amber/15 text-amber border-amber/40",
  violet: "bg-violet/15 text-violet border-violet/40",
  muted: "bg-muted/15 text-muted border-muted/30",
};

export function Badge({ tone = "muted", children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        TONE[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

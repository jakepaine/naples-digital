import { Card } from "@naples/ui";
import { ReactNode } from "react";

interface KpiProps {
  label: string;
  value: string;
  delta?: { value: string; tone: "up" | "down" | "neutral" };
  hint?: string;
  icon?: ReactNode;
}

export function Kpi({ label, value, delta, hint, icon }: KpiProps) {
  const deltaTone =
    delta?.tone === "up"
      ? "text-emerald bg-emerald/10 border-emerald/30"
      : delta?.tone === "down"
        ? "text-rose bg-rose/10 border-rose/30"
        : "text-muted bg-muted/10 border-muted/30";

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted">{label}</div>
        {icon && <div className="text-gold/70">{icon}</div>}
      </div>
      <div className="mt-3 font-heading text-3xl text-cream">{value}</div>
      {(delta || hint) && (
        <div className="mt-3 flex items-center gap-2">
          {delta && (
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${deltaTone}`}>
              {delta.tone === "up" ? "↑" : delta.tone === "down" ? "↓" : "—"} {delta.value}
            </span>
          )}
          {hint && <span className="text-[11px] text-muted">{hint}</span>}
        </div>
      )}
    </Card>
  );
}

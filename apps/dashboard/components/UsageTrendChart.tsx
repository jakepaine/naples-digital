"use client";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

type DailyPoint = { date: string; cost_usd: number };

type Props = {
  data: DailyPoint[];
  color?: string;
};

// Compact 30-day trend chart per vendor. Renders a soft area chart that
// degrades to a flat line when there's no variance — the empty case (no
// snapshots yet) shows an empty plot, not a broken one.
export function UsageTrendChart({ data, color = "#B8893E" }: Props) {
  const safe = data.length === 0 ? [{ date: "—", cost_usd: 0 }] : data;
  return (
    <div className="h-32 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={safe} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`usage-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.5} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="date" hide />
          <YAxis hide />
          <Tooltip
            cursor={{ stroke: color, strokeOpacity: 0.3 }}
            contentStyle={{
              background: "rgba(15,15,18,0.95)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 6,
              fontSize: 11,
            }}
            formatter={(v: number) => [`$${v.toFixed(4)}`, "Spend"]}
            labelStyle={{ color: "#bbb" }}
          />
          <Area
            type="monotone"
            dataKey="cost_usd"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#usage-${color.replace("#", "")})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

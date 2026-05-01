"use client";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";

interface MrrShape {
  studioRental: number;
  contentAgency: number;
  showSponsors: number;
  merch: number;
}

export function RevenueBarChart({ mrr }: { mrr: MrrShape }) {
  const data = [
    { name: "Studio Rental", value: mrr.studioRental },
    { name: "Content Agency", value: mrr.contentAgency },
    { name: "Show Sponsors", value: mrr.showSponsors },
    { name: "Merch", value: mrr.merch },
  ];
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="#1F1F1F" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: "#999", fontSize: 11 }}
            axisLine={{ stroke: "#2A2A2A" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#999", fontSize: 11 }}
            axisLine={{ stroke: "#2A2A2A" }}
            tickLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
          />
          <Tooltip
            cursor={{ fill: "rgba(201, 168, 76, 0.08)" }}
            contentStyle={{
              background: "#0A0A0A",
              border: "1px solid #C9A84C",
              borderRadius: 0,
              fontSize: 12,
            }}
            labelStyle={{ color: "#F5EDD8" }}
            itemStyle={{ color: "#C9A84C" }}
            formatter={(v: number) => [`$${v.toLocaleString()}`, "MRR"]}
          />
          <Bar dataKey="value" radius={[2, 2, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill="#C9A84C" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

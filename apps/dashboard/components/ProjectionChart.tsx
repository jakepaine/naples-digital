"use client";
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import type { Projection } from "@naples/mock-data";

export function ProjectionChart({ data }: { data: Projection[] }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 24, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="#1F1F1F" vertical={false} />
          <XAxis
            dataKey="month"
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
            contentStyle={{ background: "#0A0A0A", border: "1px solid #E8192C", borderRadius: 0, fontSize: 12 }}
            labelStyle={{ color: "#F5F5F5" }}
            formatter={(v: number) => [`$${v.toLocaleString()}`, ""]}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: "#999", paddingTop: 8 }} />
          <Line type="monotone" dataKey="conservative" stroke="#999999" strokeWidth={2} dot={{ fill: "#999999", r: 3 }} name="Conservative" />
          <Line type="monotone" dataKey="realistic" stroke="#E8192C" strokeWidth={2.5} dot={{ fill: "#E8192C", r: 4 }} name="Realistic" />
          <Line type="monotone" dataKey="upside" stroke="#3F9E6B" strokeWidth={2} dot={{ fill: "#3F9E6B", r: 3 }} name="Upside" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

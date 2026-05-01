"use client";
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { MOCK_SOCIAL_GROWTH } from "@naples/mock-data";

const COLORS = {
  youtube: "#C25E5E",
  instagram: "#C9A84C",
  tiktok: "#F5EDD8",
  facebook: "#4F7DB8",
};

export function SocialGrowthChart() {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={MOCK_SOCIAL_GROWTH} margin={{ top: 12, right: 24, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="#1F1F1F" vertical={false} />
          <XAxis
            dataKey="week"
            tick={{ fill: "#999", fontSize: 11 }}
            axisLine={{ stroke: "#2A2A2A" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#999", fontSize: 11 }}
            axisLine={{ stroke: "#2A2A2A" }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{ background: "#0A0A0A", border: "1px solid #C9A84C", borderRadius: 0, fontSize: 12 }}
            labelStyle={{ color: "#F5EDD8" }}
          />
          <Legend
            iconType="line"
            wrapperStyle={{ fontSize: 11, color: "#999", paddingTop: 8 }}
          />
          <Line type="monotone" dataKey="youtube" stroke={COLORS.youtube} strokeWidth={2} dot={false} name="YouTube" />
          <Line type="monotone" dataKey="instagram" stroke={COLORS.instagram} strokeWidth={2} dot={false} name="Instagram" />
          <Line type="monotone" dataKey="tiktok" stroke={COLORS.tiktok} strokeWidth={2} dot={false} name="TikTok" />
          <Line type="monotone" dataKey="facebook" stroke={COLORS.facebook} strokeWidth={2} dot={false} name="Facebook" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

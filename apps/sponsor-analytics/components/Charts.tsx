"use client";
import { Bar, BarChart, Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, Area, AreaChart } from "recharts";

interface Metric {
  week: string;
  impressions: number;
  clip_plays: number;
  mentions: number;
}

const TOOLTIP_STYLE = { background: "#0A0A0A", border: "1px solid #C9A84C", borderRadius: 0, fontSize: 12 };

function formatWeek(s: string): string {
  return s.slice(5); // MM-DD
}

export function ImpressionsChart({ data }: { data: Metric[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 16, bottom: 8, left: 0 }}>
          <defs>
            <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C9A84C" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#C9A84C" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1F1F1F" vertical={false} />
          <XAxis dataKey="week" tickFormatter={formatWeek} tick={{ fill: "#999", fontSize: 11 }} axisLine={{ stroke: "#2A2A2A" }} tickLine={false} />
          <YAxis tick={{ fill: "#999", fontSize: 11 }} axisLine={{ stroke: "#2A2A2A" }} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
          <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "#F5EDD8" }} formatter={(v: number) => [v.toLocaleString(), "Impressions"]} />
          <Area type="monotone" dataKey="impressions" stroke="#C9A84C" strokeWidth={2.5} fill="url(#goldGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ClipPlaysChart({ data }: { data: Metric[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="#1F1F1F" vertical={false} />
          <XAxis dataKey="week" tickFormatter={formatWeek} tick={{ fill: "#999", fontSize: 11 }} axisLine={{ stroke: "#2A2A2A" }} tickLine={false} />
          <YAxis tick={{ fill: "#999", fontSize: 11 }} axisLine={{ stroke: "#2A2A2A" }} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
          <Tooltip cursor={{ fill: "rgba(201, 168, 76, 0.08)" }} contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "#F5EDD8" }} formatter={(v: number) => [v.toLocaleString(), "Plays"]} />
          <Bar dataKey="clip_plays" fill="#C9A84C" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MentionsChart({ data }: { data: Metric[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="#1F1F1F" vertical={false} />
          <XAxis dataKey="week" tickFormatter={formatWeek} tick={{ fill: "#999", fontSize: 11 }} axisLine={{ stroke: "#2A2A2A" }} tickLine={false} />
          <YAxis tick={{ fill: "#999", fontSize: 11 }} axisLine={{ stroke: "#2A2A2A" }} tickLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "#F5EDD8" }} formatter={(v: number) => [v, "Mentions"]} />
          <Line type="monotone" dataKey="mentions" stroke="#3F9E6B" strokeWidth={2.5} dot={{ fill: "#3F9E6B", r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const fmt = new Intl.NumberFormat("en-US", { notation: "compact" });

const tooltipStyle = {
  backgroundColor: "var(--popover)",
  border: "1px solid rgb(255 255 255 / 0.1)",
  borderRadius: "0.375rem",
  color: "var(--foreground)",
  fontSize: 12,
};

// Single measure across categories → one hue for every bar; identity lives on the axis.
export function PopulationBar({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -8 }} barCategoryGap="20%">
        <CartesianGrid stroke="rgb(255 255 255 / 0.05)" vertical={false} />
        <XAxis
          dataKey="name"
          stroke="var(--muted-foreground)"
          tickLine={false}
          axisLine={false}
          fontSize={11}
          interval={0}
        />
        <YAxis
          stroke="var(--muted-foreground)"
          tickLine={false}
          axisLine={false}
          fontSize={12}
          tickFormatter={(v: number) => fmt.format(v)}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value) => [new Intl.NumberFormat("en-US").format(Number(value)), "Population"]}
          cursor={{ fill: "rgb(255 255 255 / 0.05)" }}
        />
        <Bar
          dataKey="value"
          fill="#00b8c4"
          radius={[4, 4, 0, 0]}
          isAnimationActive={false}
          maxBarSize={48}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

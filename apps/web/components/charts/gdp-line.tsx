"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const tooltipStyle = {
  backgroundColor: "var(--popover)",
  border: "1px solid rgb(255 255 255 / 0.1)",
  borderRadius: "0.375rem",
  color: "var(--foreground)",
  fontSize: 12,
};

export function GdpLine({ data }: { data: { year: number; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
        <CartesianGrid stroke="rgb(255 255 255 / 0.05)" vertical={false} />
        <XAxis
          dataKey="year"
          stroke="var(--muted-foreground)"
          tickLine={false}
          axisLine={false}
          fontSize={12}
        />
        <YAxis
          stroke="var(--muted-foreground)"
          tickLine={false}
          axisLine={false}
          fontSize={12}
          unit="%"
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value) => [`${value}%`, "GDP growth"]}
          cursor={{ stroke: "rgb(255 255 255 / 0.2)" }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="var(--primary)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

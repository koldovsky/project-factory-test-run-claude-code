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

import { t } from "@/lib/i18n";
import { type Forecast } from "@/lib/weather";

// Hourly temperature line chart (FR-FORECAST-03). Client component: Recharts is
// browser-only and heavy, so it is loaded via `HourlyChartLazy`
// (dynamic, ssr:false) to keep it out of the initial/empty-state bundle
// (NFR-PERF-03, bundle-dynamic-imports). The chart region carries a Ukrainian
// accessible name (FR-FORECAST-03 a11y). Temperatures are °C.

export interface HourlyChartProps {
  hourly: Forecast["hourly"];
}

interface HourPoint {
  /** "HH:mm" tick label derived from the local "YYYY-MM-DDTHH:mm" timestamp. */
  label: string;
  tempC: number;
}

/** Extract the "HH:mm" portion of a local "YYYY-MM-DDTHH:mm" string. */
function hourLabel(timestamp: string): string {
  const time = timestamp.split("T")[1] ?? "";
  return time.slice(0, 5);
}

export function HourlyChart({ hourly }: HourlyChartProps) {
  const data: HourPoint[] = hourly.tempC.map((tempC, index) => ({
    label: hourLabel(hourly.time[index] ?? ""),
    tempC,
  }));

  return (
    <figure
      role="img"
      aria-label={t("hourlyChartLabel")}
      className="w-full"
    >
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="label"
            interval={5}
            tick={{ fontSize: 12 }}
            className="fill-muted-foreground"
          />
          <YAxis
            unit="°C"
            width={48}
            tick={{ fontSize: 12 }}
            className="fill-muted-foreground"
          />
          <Tooltip
            formatter={(value) => [`${value}°C`, ""]}
            labelClassName="text-foreground"
          />
          <Line
            type="monotone"
            dataKey="tempC"
            stroke="currentColor"
            className="text-primary"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </figure>
  );
}

export default HourlyChart;

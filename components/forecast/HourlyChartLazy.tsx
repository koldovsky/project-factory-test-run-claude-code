"use client";

import dynamic from "next/dynamic";

import { type Forecast } from "@/lib/weather";

// Lazy client wrapper for the Recharts hourly chart (FR-FORECAST-03,
// NFR-PERF-03). `ssr:false` keeps Recharts out of the server render AND the
// initial/empty-state bundle; the Next 16 gotcha is that `ssr:false` dynamic
// imports are only allowed from a Client Component, never a Server Component —
// hence this thin `"use client"` wrapper (bundle-dynamic-imports). A fixed-height
// placeholder of equal footprint avoids layout shift while the chunk loads.

const HourlyChart = dynamic(() => import("./HourlyChart"), {
  ssr: false,
  loading: () => <div aria-hidden="true" className="h-[240px] w-full" />,
});

export interface HourlyChartLazyProps {
  hourly: Forecast["hourly"];
}

export function HourlyChartLazy({ hourly }: HourlyChartLazyProps) {
  return <HourlyChart hourly={hourly} />;
}

"use client";

import dynamic from "next/dynamic";

import { t } from "@/lib/i18n";
import type { ActiveLocation } from "@/lib/location/types";

// Client-only map wrapper (FR-MAP-05). The Next 16 gotcha: `dynamic({ ssr:false })`
// is only allowed from a Client Component, never a Server Component — hence this
// thin `"use client"` boundary around `MapView`, which would otherwise crash SSR
// (Leaflet reaches for `window`). The `loading` placeholder and the SSR output
// share the map's exact footprint (same fixed height, full width) so there is no
// layout shift when the interactive map mounts (bundle-dynamic-imports).

const MAP_FOOTPRINT = "h-[360px] w-full";

/** Equal-footprint skeleton shown during SSR and before the map chunk mounts. */
function MapSkeleton() {
  return (
    <div
      role="status"
      aria-label={t("mapLoading")}
      className={`${MAP_FOOTPRINT} animate-pulse rounded-md border border-border bg-muted`}
    />
  );
}

const MapView = dynamic(() => import("./MapView").then((mod) => mod.MapView), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

export interface MapPanelProps {
  location: ActiveLocation;
}

export function MapPanel({ location }: MapPanelProps) {
  return (
    <div className={MAP_FOOTPRINT}>
      <MapView location={location} />
    </div>
  );
}

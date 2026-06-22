"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import { t } from "@/lib/i18n";
import { coordinateLabel } from "@/lib/location/coordinateLabel";
import { toLocationQuery } from "@/lib/location/url";
import type { ActiveLocation } from "@/lib/location/types";

// Interactive OSM Leaflet map bound to the active location (FR-MAP-01..05,
// TC-MAP-01, ADR-0004). Client-only — it is always loaded through `MapPanel`'s
// `dynamic({ ssr:false })` wrapper, never server-rendered (Leaflet touches
// `window`). All copy comes from `lib/i18n`; the click->location math reuses the
// pure `lib/location` helpers.
//
// Behaviors:
//  - Centers on the active location at ~z10; recenters when it changes.
//  - OSM raster tiles over HTTPS with the required attribution (FR-MAP-04).
//  - Marker + popup naming the active location (city name, or coordinateLabel
//    for a click). FR-MAP-02.
//  - Click validates bounds via lib/location, then navigates to `?lat&lon&name`
//    (name = coordinateLabel) which re-renders the view + re-fetches the
//    forecast server-side. Out-of-range/malformed clicks are rejected and the
//    prior location is kept. FR-MAP-03.
//  - Tile load failure -> calm inline state, footprint + attribution preserved.

const CITY_ZOOM = 10;
const OSM_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

const LAT_MIN = -90;
const LAT_MAX = 90;
const LON_MIN = -180;
const LON_MAX = 180;

/** Leaflet's default marker icon URLs break under bundlers; point them at the
 *  hashed asset URLs the bundler produces for the imported PNGs (design dec. 2).
 *  `src` is what Next emits for an imported image. Done once at module load. */
function configureDefaultIcon(): void {
  const resolve = (asset: string | { src: string }): string =>
    typeof asset === "string" ? asset : asset.src;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: resolve(markerIcon2x),
    iconUrl: resolve(markerIcon),
    shadowUrl: resolve(markerShadow),
  });
}

configureDefaultIcon();

function inBounds(lat: number, lon: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= LAT_MIN &&
    lat <= LAT_MAX &&
    lon >= LON_MIN &&
    lon <= LON_MAX
  );
}

/** Keep the map centered on the active location when it changes (design dec. 5).
 *  A child of MapContainer so it can read the live map instance via useMap. */
function RecenterOnLocation({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lon], map.getZoom());
  }, [map, lat, lon]);
  return null;
}

/** Translate a map click into a location navigation (FR-MAP-03). Validates
 *  bounds before navigating; an out-of-range click is ignored, keeping the prior
 *  location. Rendered as a child so it can subscribe to map events. */
function ClickToSetLocation({
  onSelect,
  onReject,
}: {
  onSelect: (location: ActiveLocation) => void;
  onReject: () => void;
}) {
  useMapEvents({
    click(event) {
      const { lat, lng } = event.latlng;
      // Out-of-range clicks (e.g. antimeridian wrap / polar overscroll at low
      // zoom) keep the prior location AND surface a calm inline message, never a
      // silent drop (FR-MAP-03 reject scenario).
      if (!inBounds(lat, lng)) {
        onReject();
        return;
      }
      onSelect({ lat, lon: lng, name: coordinateLabel(lat, lng) });
    },
  });
  return null;
}

export interface MapViewProps {
  location: ActiveLocation;
}

export function MapView({ location }: MapViewProps) {
  const router = useRouter();
  const [tileError, setTileError] = useState(false);
  const [outOfRange, setOutOfRange] = useState(false);

  const center = useMemo<[number, number]>(
    () => [location.lat, location.lon],
    [location.lat, location.lon],
  );

  const handleSelect = useCallback(
    (next: ActiveLocation) => {
      setOutOfRange(false);
      router.push(`/?${toLocationQuery(next)}`);
    },
    [router],
  );

  const handleReject = useCallback(() => {
    setOutOfRange(true);
  }, []);

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={CITY_ZOOM}
        scrollWheelZoom
        className="h-full w-full rounded-md"
        aria-label={t("mapRegionLabel")}
      >
        <TileLayer
          url={OSM_TILE_URL}
          attribution={t("mapAttribution")}
          eventHandlers={{
            // A tile error surfaces a calm inline state without tearing down the
            // map (footprint + attribution stay) — NFR-OBS-01, FR-MAP error path.
            tileerror() {
              setTileError(true);
            },
            tileload() {
              setTileError(false);
            },
          }}
        />
        <Marker position={center} title={location.name} alt={location.name}>
          <Popup>{location.name}</Popup>
        </Marker>
        <RecenterOnLocation lat={location.lat} lon={location.lon} />
        <ClickToSetLocation onSelect={handleSelect} onReject={handleReject} />
      </MapContainer>

      {tileError || outOfRange ? (
        <p
          role="status"
          className="pointer-events-none absolute inset-x-0 top-2 z-[400] mx-auto w-fit max-w-[90%] rounded-md bg-background/90 px-3 py-2 text-center text-sm text-muted-foreground shadow"
        >
          {tileError ? t("mapTileError") : t("mapClickOutOfRange")}
        </p>
      ) : null}
    </div>
  );
}

export default MapView;

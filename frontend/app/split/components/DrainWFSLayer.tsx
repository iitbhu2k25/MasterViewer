"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { GeoJSON } from "react-leaflet";
import L from "leaflet";
import type { FeatureCollection } from "../../(holistic-approach)/holistic/types/location";

const GEOSERVER_WFS = "http://localhost:9090/geoserver/dss_vector/ows";

export const DRAIN_CONFIGS = [
  { key: "stp",      typeName: "dss_vector:stp",                  color: "#2563eb", label: "STP (Sewage Treatment Plant)" },
  { key: "tapped",   typeName: "dss_vector:tapped",               color: "#16a34a", label: "Tapped Drain" },
  { key: "partial",  typeName: "dss_vector:partial_tapped_drain",  color: "#d97706", label: "Partial Tapped Drain" },
  { key: "untapped", typeName: "dss_vector:untapped_drain",        color: "#dc2626", label: "Untapped Drain" },
] as const;

/* ─── Flag SVG icon ─────────────────────────────────────────────────────── */
function makeFlagIcon(color: string): L.DivIcon {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="32" viewBox="0 0 22 32">
    <line x1="3.5" y1="1" x2="3.5" y2="32" stroke="${color}" stroke-width="2.2" stroke-linecap="round"/>
    <polygon points="3.5,2 21,9 3.5,16" fill="${color}" stroke="${color}" stroke-width="1" stroke-linejoin="round" opacity="0.93"/>
    <circle cx="3.5" cy="32" r="2.2" fill="${color}" opacity="0.8"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [22, 32],
    iconAnchor: [3, 32],
    popupAnchor: [6, -32],
  });
}

/* ─── Point-in-polygon (GeoJSON coords = [lng, lat]) ───────────────────── */
function pip(pt: number[], ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function coordInZone(coord: number[], zoneFeature: any): boolean {
  const g = zoneFeature?.geometry;
  if (!g) return false;
  const rings: number[][][] =
    g.type === "Polygon" ? [g.coordinates[0]]
    : g.type === "MultiPolygon" ? g.coordinates.map((p: any) => p[0])
    : [];
  return rings.some((r) => pip(coord, r));
}

/** Sample representative coordinates from a feature for zone-intersection check */
function sampleCoords(feature: any): number[][] {
  const g = feature?.geometry;
  if (!g) return [];
  switch (g.type) {
    case "Point":
      return [g.coordinates];
    case "MultiPoint":
      return g.coordinates;
    case "LineString": {
      const c: number[][] = g.coordinates;
      return [c[0], c[Math.floor(c.length / 2)], c[c.length - 1]];
    }
    case "MultiLineString":
      return (g.coordinates as number[][][]).flatMap((line) => [line[0], line[Math.floor(line.length / 2)]]);
    default:
      return [];
  }
}

function filterByZones(fc: any, zoneFeatures: any[]): any {
  if (!fc?.features) return fc;
  const features = fc.features.filter((f: any) =>
    sampleCoords(f).some((coord) => zoneFeatures.some((zf) => coordInZone(coord, zf))),
  );
  return { type: "FeatureCollection", features };
}

/** Return a GeoJSON Point feature at the midpoint of a line/multiline feature */
function midpointOf(f: any): any | null {
  const g = f?.geometry;
  if (!g) return null;
  let coord: number[] | null = null;
  if (g.type === "LineString" && g.coordinates.length) {
    coord = g.coordinates[Math.floor(g.coordinates.length / 2)];
  } else if (g.type === "MultiLineString" && g.coordinates.length) {
    const line: number[][] = g.coordinates[0];
    coord = line[Math.floor(line.length / 2)];
  }
  if (!coord) return null;
  return { type: "Feature", geometry: { type: "Point", coordinates: coord }, properties: f.properties ?? {} };
}

function getZoneName(f: any): string {
  const p = f?.properties || {};
  return String(p.id_ ?? p.ID_ ?? p.zone ?? p.Zone ?? p.ZONE ?? p.area_name ?? p.Area ?? p.NAME ?? "").trim().toUpperCase();
}

/* ─── Main component ────────────────────────────────────────────────────── */
type Props = {
  areaGeojson: FeatureCollection | null;
  selectedZones: string[];
};

export default function DrainWFSLayer({ areaGeojson, selectedZones }: Props) {
  const [rawData, setRawData] = useState<Record<string, any>>({});

  // Fetch once on mount
  useEffect(() => {
    DRAIN_CONFIGS.forEach(({ key, typeName }) => {
      fetch(
        `${GEOSERVER_WFS}?service=WFS&version=1.0.0&request=GetFeature&typeName=${typeName}&outputFormat=application%2Fjson`,
      )
        .then((r) => r.json())
        .then((data) => setRawData((prev) => ({ ...prev, [key]: data })))
        .catch(() => {/* silently ignore fetch errors */});
    });
  }, []);

  const zoneFeatures = useMemo(() => {
    if (!areaGeojson?.features || selectedZones.length === 0) return [];
    return areaGeojson.features.filter((f: any) => selectedZones.includes(getZoneName(f)));
  }, [areaGeojson, selectedZones]);

  return (
    <>
      {DRAIN_CONFIGS.map(({ key, color, label }) => {
        const raw = rawData[key];
        if (!raw?.features) return null;

        const filtered = zoneFeatures.length > 0 ? filterByZones(raw, zoneFeatures) : raw;
        if (!filtered?.features?.length) return null;

        const lineFeats = filtered.features.filter((f: any) =>
          f.geometry?.type === "LineString" || f.geometry?.type === "MultiLineString",
        );
        const pointFeats = filtered.features.filter((f: any) =>
          f.geometry?.type === "Point" || f.geometry?.type === "MultiPoint",
        );
        const midpointFeats = lineFeats.map(midpointOf).filter(Boolean);

        const flagIcon = makeFlagIcon(color);
        const zoneKey = selectedZones.join("|");

        const withTooltip = (_f: any, latlng: L.LatLng) =>
          L.marker(latlng, { icon: flagIcon }).bindTooltip(label, {
            direction: "top",
            offset: [6, -28],
            className: "drain-tooltip",
          });

        return (
          <Fragment key={`drain-${key}-${zoneKey}`}>
            {/* Colored lines */}
            {lineFeats.length > 0 && (
              <GeoJSON
                key={`dl-${key}-${zoneKey}`}
                data={{ type: "FeatureCollection", features: lineFeats } as any}
                style={() => ({ color, weight: 2.5, opacity: 0.9, fillOpacity: 0 })}
                onEachFeature={(_f, layer) => layer.bindTooltip(label, { sticky: true, className: "drain-tooltip" })}
              />
            )}
            {/* Flag at the midpoint of each line */}
            {midpointFeats.length > 0 && (
              <GeoJSON
                key={`dm-${key}-${zoneKey}`}
                data={{ type: "FeatureCollection", features: midpointFeats } as any}
                pointToLayer={withTooltip}
              />
            )}
            {/* Point features (e.g. STP) as flag markers */}
            {pointFeats.length > 0 && (
              <GeoJSON
                key={`dp-${key}-${zoneKey}`}
                data={{ type: "FeatureCollection", features: pointFeats } as any}
                pointToLayer={withTooltip}
              />
            )}
          </Fragment>
        );
      })}
    </>
  );
}

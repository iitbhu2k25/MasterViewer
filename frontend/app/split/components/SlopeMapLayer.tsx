"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import type { FeatureCollection } from "../../(holistic-approach)/holistic/types/location";

const GEOSERVER_WMS = "http://localhost:9090/geoserver/dss_raster/wms";
const SLOPE_LAYER = "dss_raster:slope_Slope_aviral";

function getZoneName(f: any): string {
  const p = f?.properties || {};
  return String(p.id_ ?? p.ID_ ?? p.zone ?? p.Zone ?? p.ZONE ?? p.area_name ?? p.Area ?? p.NAME ?? "").trim().toUpperCase();
}

function getGeoBounds(features: any[]) {
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  for (const f of features) {
    const g = f?.geometry;
    if (!g) continue;
    const rings: number[][][] =
      g.type === "Polygon" ? [g.coordinates[0]] :
      g.type === "MultiPolygon" ? g.coordinates.map((p: any) => p[0]) : [];
    for (const ring of rings) {
      for (const [lng, lat] of ring) {
        if (lng < minLng) minLng = lng;
        if (lat < minLat) minLat = lat;
        if (lng > maxLng) maxLng = lng;
        if (lat > maxLat) maxLat = lat;
      }
    }
  }
  return { minLng, minLat, maxLng, maxLat };
}

/**
 * Renders the slope WMS raster ONLY inside the selected zone polygons.
 * Uses an SVG overlay with a clipPath built from the zone polygon coordinates
 * so no blur-mask covers the rest of the map.
 */
function SlopeOverlay({ zoneFeatures }: { zoneFeatures: any[] }) {
  const map = useMap();
  const [, forceUpdate] = useState(0);
  // Stable clip-path id per component instance (avoids conflicts with multiple maps)
  const clipIdRef = useRef(`slope-clip-${Math.random().toString(36).slice(2, 8)}`);

  useEffect(() => {
    const update = () => forceUpdate((v) => v + 1);
    map.on("move zoom resize", update);
    return () => { map.off("move zoom resize", update); };
  }, [map]);

  const bounds = useMemo(() => getGeoBounds(zoneFeatures), [zoneFeatures]);

  if (!zoneFeatures.length || bounds.minLng === Infinity) return null;

  const mapSize = map.getSize();

  // Map the geographic bbox to container pixel coordinates
  const tl = map.latLngToContainerPoint([bounds.maxLat, bounds.minLng]);
  const br = map.latLngToContainerPoint([bounds.minLat, bounds.maxLng]);
  const imgX = tl.x;
  const imgY = tl.y;
  const imgW = br.x - tl.x;
  const imgH = br.y - tl.y;

  // Bail out if the zone is completely off-screen or inverted
  if (imgW <= 0 || imgH <= 0) return null;

  // WMS GetMap request — pixel size matches the current view for crisp rendering
  const pixW = Math.max(64, Math.round(imgW));
  const pixH = Math.max(64, Math.round(imgH));
  const wmsUrl =
    `${GEOSERVER_WMS}?SERVICE=WMS&VERSION=1.1.0&REQUEST=GetMap` +
    `&LAYERS=${encodeURIComponent(SLOPE_LAYER)}&STYLES=` +
    `&SRS=EPSG:4326` +
    `&BBOX=${bounds.minLng},${bounds.minLat},${bounds.maxLng},${bounds.maxLat}` +
    `&WIDTH=${pixW}&HEIGHT=${pixH}` +
    `&FORMAT=image/png&TRANSPARENT=true`;

  // Build the SVG <path> for the clip region from zone polygon coordinates
  const pathParts: string[] = [];
  for (const f of zoneFeatures) {
    const g = f?.geometry;
    if (!g) continue;
    const rings: number[][][] =
      g.type === "Polygon" ? [g.coordinates[0]] :
      g.type === "MultiPolygon" ? g.coordinates.map((p: any) => p[0]) : [];
    for (const ring of rings) {
      const pts = ring
        .map(([lng, lat]) => {
          const pt = map.latLngToContainerPoint([lat, lng]);
          return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
        })
        .join(" L ");
      if (pts) pathParts.push(`M ${pts} Z`);
    }
  }

  if (!pathParts.length) return null;

  const clipId = clipIdRef.current;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 300,
        pointerEvents: "none",
      }}
    >
      <svg
        width={mapSize.x}
        height={mapSize.y}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <defs>
          {/* Clip path shaped exactly to the selected zone polygons */}
          <clipPath id={clipId}>
            <path d={pathParts.join(" ")} fillRule="evenodd" />
          </clipPath>
        </defs>
        {/* WMS image clipped to zones — full color, no mask on surrounding map */}
        <image
          href={wmsUrl}
          x={imgX}
          y={imgY}
          width={imgW}
          height={imgH}
          clipPath={`url(#${clipId})`}
          preserveAspectRatio="none"
          style={{ opacity: 0.9 }}
        />
      </svg>
    </div>
  );
}

type Props = {
  areaGeojson: FeatureCollection | null;
  selectedZones: string[];
};

export default function SlopeMapLayer({ areaGeojson, selectedZones }: Props) {
  const zoneFeatures = useMemo(() => {
    if (!areaGeojson?.features || !selectedZones.length) return [];
    return areaGeojson.features.filter((f: any) => selectedZones.includes(getZoneName(f)));
  }, [areaGeojson, selectedZones]);

  if (!zoneFeatures.length) return null;
  return <SlopeOverlay zoneFeatures={zoneFeatures} />;
}

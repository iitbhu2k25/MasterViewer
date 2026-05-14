"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";

type Props = {
  enabled: boolean;
  selectedZones: string[];
  clipApiBase: string;
};

// Baseline datasets — slate/gray gradient
const getBaselineColor = (val: number): string | null => {
  const v = val < 0 ? -val : val;
  if (v < 0.01) return null;
  if (v < 0.05) return "#f8fafc";
  if (v < 0.1)  return "#cbd5e1";
  if (v < 0.2)  return "#94a3b8";
  if (v < 0.3)  return "#64748b";
  if (v < 0.4)  return "#475569";
  return "#334155";
};

// Remote sensing + GIS — lime/yellow-green gradient
const getGisDataColor = (val: number): string | null => {
  const v = val < 0 ? -val : val;
  if (v < 0.01) return null;
  if (v < 0.05) return "#f7fee7";
  if (v < 0.1)  return "#bef264";
  if (v < 0.2)  return "#84cc16";
  if (v < 0.3)  return "#4d7c0f";
  if (v < 0.4)  return "#3f6212";
  return "#365314";
};

// SWAT model — sky/blue gradient
const getSwatColor = (val: number): string | null => {
  const v = val < 0 ? -val : val;
  if (v < 0.01) return null;
  if (v < 0.05) return "#f0f9ff";
  if (v < 0.1)  return "#7dd3fc";
  if (v < 0.2)  return "#0ea5e9";
  if (v < 0.3)  return "#0369a1";
  if (v < 0.4)  return "#075985";
  return "#0c4a6e";
};

// Hydrogeology — brown/orange gradient
const getHydrogeologyColor = (val: number): string | null => {
  const v = val < 0 ? -val : val;
  if (v < 0.01) return null;
  if (v < 0.05) return "#fff7ed";
  if (v < 0.1)  return "#fdba74";
  if (v < 0.2)  return "#f97316";
  if (v < 0.3)  return "#c2410c";
  if (v < 0.4)  return "#9a3412";
  return "#7c2d12";
};

// Monitoring sensors — violet/indigo gradient
const getSensorColor = (val: number): string | null => {
  const v = val < 0 ? -val : val;
  if (v < 0.01) return null;
  if (v < 0.05) return "#f5f3ff";
  if (v < 0.1)  return "#c4b5fd";
  if (v < 0.2)  return "#8b5cf6";
  if (v < 0.3)  return "#6d28d9";
  if (v < 0.4)  return "#5b21b6";
  return "#4c1d95";
};

function GyanRasterLayer({
  enabled,
  selectedZones,
  clipApiBase,
  layerName,
  colorFn,
}: Props & {
  layerName: string;
  colorFn: (val: number) => string | null;
}) {
  const map = useMap();
  const layerRef = useRef<any>(null);
  const zonesKey = selectedZones.slice().sort().join(",");

  useEffect(() => {
    let cancelled = false;

    const cleanup = () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };

    if (!enabled || !selectedZones.length) {
      cleanup();
      return;
    }

    const load = async () => {
      try {
        cleanup();
        const response = await fetch(`${clipApiBase}/analysis/aviral-geoserver-clip`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selected_zones: selectedZones, layer_name: layerName }),
        });

        if (cancelled) return;
        if (!response.ok) {
          const text = await response.text().catch(() => "(no body)");
          console.error(`GyanRasterLayer [${layerName}] HTTP ${response.status}:`, text);
          return;
        }

        const arrayBuffer = await response.arrayBuffer();
        const parseGeorasterModule: any = await import("georaster");
        const georasterLayerModule: any = await import("georaster-layer-for-leaflet");
        const parseGeoraster = parseGeorasterModule.default || parseGeorasterModule;
        const GeoRasterLayer = georasterLayerModule.default || georasterLayerModule;

        const georaster: any = await parseGeoraster(arrayBuffer);
        const nodata = georaster?.noDataValue;

        const layer = new GeoRasterLayer({
          georaster,
          opacity: 0.85,
          resolution: 256,
          pixelValuesToColorFn: (pixelValues: number[]) => {
            const val = pixelValues[0];
            if (val === undefined || val === null || isNaN(val)) return null;
            if (nodata !== undefined && nodata !== null && Math.abs(val - Number(nodata)) < 1) return null;
            return colorFn(val);
          },
        });

        if (!cancelled) {
          layer.addTo(map);
          layerRef.current = layer;
        }
      } catch (err) {
        console.error(`GyanRasterLayer (${layerName}) error:`, err);
      }
    };

    void load();
    return () => { cancelled = true; cleanup(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, map, zonesKey, clipApiBase, layerName]);

  return null;
}

export function GyanBaselineLayer(props: Props) {
  return <GyanRasterLayer {...props} layerName="gyan_baseline" colorFn={getBaselineColor} />;
}
export function GyanGisDataLayer(props: Props) {
  return <GyanRasterLayer {...props} layerName="gyan_gisdata" colorFn={getGisDataColor} />;
}
export function GyanSwatLayer(props: Props) {
  return <GyanRasterLayer {...props} layerName="gyan_swat" colorFn={getSwatColor} />;
}
export function GyanHydrogeologyLayer(props: Props) {
  return <GyanRasterLayer {...props} layerName="gyan_hydrogeology" colorFn={getHydrogeologyColor} />;
}
export function GyanSensorLayer(props: Props) {
  return <GyanRasterLayer {...props} layerName="gyan_sensor" colorFn={getSensorColor} />;
}

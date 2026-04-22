"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";

type Props = {
  enabled: boolean;
  selectedZones: string[];
  clipApiBase: string;
  dataType: "direction" | "accumulation";
};

// D8 direction values → color
const getDirectionColor = (val: number): string | null => {
  switch (Math.round(val)) {
    case 1:   return "#3b82f6"; // E  — Blue
    case 2:   return "#06b6d4"; // SE — Cyan
    case 4:   return "#22c55e"; // S  — Green
    case 8:   return "#84cc16"; // SW — Lime
    case 16:  return "#eab308"; // W  — Yellow
    case 32:  return "#f97316"; // NW — Orange
    case 64:  return "#ef4444"; // N  — Red
    case 128: return "#a855f7"; // NE — Purple
    default:  return null;
  }
};

// Accumulation value → blue gradient
const getAccumulationColor = (val: number): string | null => {
  if (val <= 0) return null;
  if (val < 3)   return "#e0f2fe";
  if (val < 8)   return "#7dd3fc";
  if (val < 20)  return "#38bdf8";
  if (val < 50)  return "#0284c7";
  if (val < 120) return "#1e40af";
  return "#172554";
};

export default function FlowDirectionRasterLayer({ enabled, selectedZones, clipApiBase, dataType }: Props) {
  const map = useMap();
  const layerRef = useRef<any>(null);

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
        const response = await fetch(`${clipApiBase}/analysis/flow-direction-clip`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selected_zones: selectedZones, data_type: dataType }),
        });

        if (!response.ok || cancelled) return;

        const arrayBuffer = await response.arrayBuffer();
        const parseGeorasterModule: any = await import("georaster");
        const georasterLayerModule: any = await import("georaster-layer-for-leaflet");
        const parseGeoraster = parseGeorasterModule.default || parseGeorasterModule;
        const GeoRasterLayer = georasterLayerModule.default || georasterLayerModule;

        const georaster: any = await parseGeoraster(arrayBuffer);
        const nodata = georaster?.noDataValue;

        const layer = new GeoRasterLayer({
          georaster,
          opacity: 0.82,
          resolution: 256,
          pixelValuesToColorFn: (pixelValues: number[]) => {
            const val = pixelValues[0];
            if (val === undefined || val === null || isNaN(val)) return null;
            if (nodata !== undefined && nodata !== null) {
              const nd = Number(nodata);
              const isNodata = Math.abs(nd) > 1e20
                ? Math.abs(val - nd) < 1e20
                : val === nd;
              if (isNodata) return null;
            }
            return dataType === "direction"
              ? getDirectionColor(val)
              : getAccumulationColor(val);
          },
        });

        if (!cancelled) {
          layer.addTo(map);
          layerRef.current = layer;
        }
      } catch (err) {
        console.error(`FlowDirectionRasterLayer (${dataType}) error:`, err);
      }
    };

    void load();
    return () => { cancelled = true; cleanup(); };
  }, [enabled, map, selectedZones, clipApiBase, dataType]);

  return null;
}

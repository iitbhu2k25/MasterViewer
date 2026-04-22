"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";

// Groundwater Quality Index color scale — values 0–1, higher = better quality
const getGwqColor = (val: number): string => {
  if (val >= 0.8) return "#22c55e"; // Excellent — green
  if (val >= 0.6) return "#84cc16"; // Good — lime
  if (val >= 0.4) return "#facc15"; // Moderate — yellow
  if (val >= 0.2) return "#f97316"; // Poor — orange
  return "#dc2626";                  // Critical — red
};

type Props = {
  enabled: boolean;
  selectedZones: string[];
  clipApiBase: string;
};

export default function NirmalGwqLayer({ enabled, selectedZones, clipApiBase }: Props) {
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

        const response = await fetch(`${clipApiBase}/analysis/nirmal-gwq-clip`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selected_zones: selectedZones }),
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
              const isNodata = Math.abs(nd) > 1e20 ? Math.abs(val - nd) < 1e20 : val === nd;
              if (isNodata) return null;
            }
            if (val <= 0) return null;
            return getGwqColor(val);
          },
        });

        if (!cancelled) {
          layer.addTo(map);
          layerRef.current = layer;
        }
      } catch (err) {
        console.error("Failed to load Nirmal GWQ raster:", err);
      }
    };

    void load();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [enabled, map, selectedZones, clipApiBase]);

  return null;
}

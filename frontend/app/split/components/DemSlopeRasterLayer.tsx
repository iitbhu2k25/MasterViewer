"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";

type Props = {
  enabled: boolean;
  selectedZones: string[];
  clipApiBase: string;
  dataType: "dem" | "slope";
};

const getSlopeColor = (val: number) => {
  if (val < 2) return "#15803d"; // Deep Green
  if (val < 5) return "#22c55e"; // Green
  if (val < 10) return "#84cc16"; // Lime
  if (val < 15) return "#facc15"; // Yellow
  if (val < 25) return "#f59e0b"; // Amber
  if (val < 45) return "#ea580c"; // Orange
  return "#dc2626"; // Red
};

const getDemColor = (val: number) => {
  // Cool Spectral palette for high contrast against Slope layer
  if (val < 100) return "#4c1d95"; // Deep Purple
  if (val < 250) return "#7c3aed"; // Purple
  if (val < 400) return "#2563eb"; // Blue
  if (val < 600) return "#0ea5e9"; // Sky
  if (val < 800) return "#22d3ee"; // Cyan
  if (val < 1000) return "#a5f3fc"; // Light Cyan
  if (val < 1200) return "#e0f2fe"; // Soft Blue
  return "#ffffff"; // White (Peak)
};

export default function DemSlopeRasterLayer({
  enabled,
  selectedZones,
  clipApiBase,
  dataType,
}: Props) {
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
        
        const response = await fetch(`${clipApiBase}/analysis/dem-slope-clip`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            selected_zones: selectedZones,
            data_type: dataType,
          }),
        });

        if (!response.ok || cancelled) return;

        const arrayBuffer = await response.arrayBuffer();
        
        // Dynamic imports for georaster libs
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
            if (nodata !== undefined && nodata !== null && Math.abs(val - nodata) < 0.0001) return null;
            
            // Mask extremely low values if they are likely artifacts or water
            if (dataType === "slope" && val < 0) return null;
            if (dataType === "dem" && val < -100) return null;

            return dataType === "slope" ? getSlopeColor(val) : getDemColor(val);
          },
        });

        if (!cancelled) {
          layer.addTo(map);
          layerRef.current = layer;
        }
      } catch (err) {
        console.error(`Failed to load ${dataType} raster:`, err);
      }
    };

    void load();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [enabled, map, selectedZones, clipApiBase, dataType]);

  return null;
}

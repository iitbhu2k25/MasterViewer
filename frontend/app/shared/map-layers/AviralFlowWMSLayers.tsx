"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";

type Props = {
  enabled: boolean;
  selectedZones: string[];
  clipApiBase: string;
};

// River flow — blue gradient, works for normalised [-1, 1] or raw [0, n] values
const getRiverFlowColor = (val: number): string | null => {
  // Normalise negative range [-0.5, 0] → treat as positive magnitude for coloring
  const v = val < 0 ? -val : val;
  if (v < 0.01) return null; // true nodata / zero
  if (v < 0.05) return "#e0f2fe";
  if (v < 0.1)  return "#7dd3fc";
  if (v < 0.2)  return "#38bdf8";
  if (v < 0.3)  return "#0284c7";
  if (v < 0.4)  return "#1e40af";
  return "#172554";
};

// Drain flow — teal gradient, same normalised range
const getDrainFlowColor = (val: number): string | null => {
  const v = val < 0 ? -val : val;
  if (v < 0.01) return null;
  if (v < 0.05) return "#ccfbf1";
  if (v < 0.1)  return "#5eead4";
  if (v < 0.2)  return "#14b8a6";
  if (v < 0.3)  return "#0d9488";
  if (v < 0.4)  return "#0f766e";
  return "#134e4a";
};

// Channel geometry — indigo gradient, same normalised range
const getChannelColor = (val: number): string | null => {
  const v = val < 0 ? -val : val;
  if (v < 0.01) return null;
  if (v < 0.05) return "#ede9fe";
  if (v < 0.1)  return "#a78bfa";
  if (v < 0.2)  return "#7c3aed";
  if (v < 0.3)  return "#5b21b6";
  if (v < 0.4)  return "#3b0764";
  return "#1e1b4b";
};

function AviralGeoServerClipLayer({
  enabled,
  selectedZones,
  clipApiBase,
  layerName,
  colorFn,
}: Props & {
  layerName: "river_flow" | "drain_flow" | "channel";
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
          console.error(`aviral-geoserver-clip [${layerName}] HTTP ${response.status}:`, text);
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
            if (nodata !== undefined && nodata !== null) {
              const nd = Number(nodata);
              if (Math.abs(val - nd) < 1) return null;
            }
            return colorFn(val);
          },
        });

        if (!cancelled) {
          layer.addTo(map);
          layerRef.current = layer;
        }
      } catch (err) {
        console.error(`AviralGeoServerClipLayer (${layerName}) error:`, err);
      }
    };

    void load();
    return () => { cancelled = true; cleanup(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, map, zonesKey, clipApiBase, layerName]);

  return null;
}

export function RiverFlowWMSLayer({ enabled, selectedZones, clipApiBase }: Props) {
  return (
    <AviralGeoServerClipLayer
      enabled={enabled}
      selectedZones={selectedZones}
      clipApiBase={clipApiBase}
      layerName="river_flow"
      colorFn={getRiverFlowColor}
    />
  );
}

export function DrainFlowWMSLayer({ enabled, selectedZones, clipApiBase }: Props) {
  return (
    <AviralGeoServerClipLayer
      enabled={enabled}
      selectedZones={selectedZones}
      clipApiBase={clipApiBase}
      layerName="drain_flow"
      colorFn={getDrainFlowColor}
    />
  );
}

export function ChannelGeometryWMSLayer({ enabled, selectedZones, clipApiBase }: Props) {
  return (
    <AviralGeoServerClipLayer
      enabled={enabled}
      selectedZones={selectedZones}
      clipApiBase={clipApiBase}
      layerName="channel"
      colorFn={getChannelColor}
    />
  );
}

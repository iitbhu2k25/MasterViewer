"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";

type Props = {
  enabled: boolean;
  selectedZones: string[];
  clipApiBase: string;
};

// Wetlands — teal/emerald gradient
const getWetlandsColor = (val: number): string | null => {
  const v = val < 0 ? -val : val;
  if (v < 0.01) return null;
  if (v < 0.05) return "#f0fdfa";
  if (v < 0.1)  return "#99f6e4";
  if (v < 0.2)  return "#2dd4bf";
  if (v < 0.3)  return "#0d9488";
  if (v < 0.4)  return "#0f766e";
  return "#134e4a";
};

// Riparian vegetation — green gradient
const getRiparianColor = (val: number): string | null => {
  const v = val < 0 ? -val : val;
  if (v < 0.01) return null;
  if (v < 0.05) return "#f0fdf4";
  if (v < 0.1)  return "#86efac";
  if (v < 0.2)  return "#22c55e";
  if (v < 0.3)  return "#15803d";
  if (v < 0.4)  return "#166534";
  return "#14532d";
};

// Biodiversity — amber/yellow gradient
const getBiodiversityColor = (val: number): string | null => {
  const v = val < 0 ? -val : val;
  if (v < 0.01) return null;
  if (v < 0.05) return "#fefce8";
  if (v < 0.1)  return "#fef08a";
  if (v < 0.2)  return "#eab308";
  if (v < 0.3)  return "#a16207";
  if (v < 0.4)  return "#854d0e";
  return "#713f12";
};

// Floodplain — blue/indigo gradient
const getFloodplainColor = (val: number): string | null => {
  const v = val < 0 ? -val : val;
  if (v < 0.01) return null;
  if (v < 0.05) return "#eef2ff";
  if (v < 0.1)  return "#a5b4fc";
  if (v < 0.2)  return "#6366f1";
  if (v < 0.3)  return "#4338ca";
  if (v < 0.4)  return "#3730a3";
  return "#312e81";
};

function JeevantRasterLayer({
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
          console.error(`JeevantRasterLayer [${layerName}] HTTP ${response.status}:`, text);
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
        console.error(`JeevantRasterLayer (${layerName}) error:`, err);
      }
    };

    void load();
    return () => { cancelled = true; cleanup(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, map, zonesKey, clipApiBase, layerName]);

  return null;
}

export function JeevantWetlandsLayer(props: Props) {
  return <JeevantRasterLayer {...props} layerName="jeevant_wetlands" colorFn={getWetlandsColor} />;
}
export function JeevantRiparianLayer(props: Props) {
  return <JeevantRasterLayer {...props} layerName="jeevant_riparian" colorFn={getRiparianColor} />;
}
export function JeevantBiodiversityLayer(props: Props) {
  return <JeevantRasterLayer {...props} layerName="jeevant_biodiversity" colorFn={getBiodiversityColor} />;
}
export function JeevantFloodplainLayer(props: Props) {
  return <JeevantRasterLayer {...props} layerName="jeevant_floodplain" colorFn={getFloodplainColor} />;
}

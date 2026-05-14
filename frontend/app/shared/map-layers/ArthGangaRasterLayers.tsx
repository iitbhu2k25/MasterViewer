"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";

type Props = {
  enabled: boolean;
  selectedZones: string[];
  clipApiBase: string;
};

// Agriculture — green gradient (low → high crop density)
const getAgricultureColor = (val: number): string | null => {
  const v = val < 0 ? -val : val;
  if (v < 0.01) return null;
  if (v < 0.05) return "#f0fdf4";
  if (v < 0.1)  return "#86efac";
  if (v < 0.2)  return "#22c55e";
  if (v < 0.3)  return "#15803d";
  if (v < 0.4)  return "#166534";
  return "#14532d";
};

// Irrigation — cyan/blue gradient
const getIrrigationColor = (val: number): string | null => {
  const v = val < 0 ? -val : val;
  if (v < 0.01) return null;
  if (v < 0.05) return "#ecfeff";
  if (v < 0.1)  return "#67e8f9";
  if (v < 0.2)  return "#06b6d4";
  if (v < 0.3)  return "#0e7490";
  if (v < 0.4)  return "#155e75";
  return "#164e63";
};

// Tourism — amber/orange gradient
const getTourismColor = (val: number): string | null => {
  const v = val < 0 ? -val : val;
  if (v < 0.01) return null;
  if (v < 0.05) return "#fffbeb";
  if (v < 0.1)  return "#fde68a";
  if (v < 0.2)  return "#f59e0b";
  if (v < 0.3)  return "#d97706";
  if (v < 0.4)  return "#92400e";
  return "#78350f";
};

// Ghats & heritage — rose/pink gradient
const getGhatsColor = (val: number): string | null => {
  const v = val < 0 ? -val : val;
  if (v < 0.01) return null;
  if (v < 0.05) return "#fff1f2";
  if (v < 0.1)  return "#fda4af";
  if (v < 0.2)  return "#f43f5e";
  if (v < 0.3)  return "#be123c";
  if (v < 0.4)  return "#9f1239";
  return "#881337";
};

// Economic activity — purple gradient
const getEconomicColor = (val: number): string | null => {
  const v = val < 0 ? -val : val;
  if (v < 0.01) return null;
  if (v < 0.05) return "#faf5ff";
  if (v < 0.1)  return "#d8b4fe";
  if (v < 0.2)  return "#a855f7";
  if (v < 0.3)  return "#7e22ce";
  if (v < 0.4)  return "#6b21a8";
  return "#581c87";
};

function ArthRasterLayer({
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
          console.error(`ArthRasterLayer [${layerName}] HTTP ${response.status}:`, text);
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
        console.error(`ArthRasterLayer (${layerName}) error:`, err);
      }
    };

    void load();
    return () => { cancelled = true; cleanup(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, map, zonesKey, clipApiBase, layerName]);

  return null;
}

export function ArthAgricultureLayer(props: Props) {
  return <ArthRasterLayer {...props} layerName="arth_agriculture" colorFn={getAgricultureColor} />;
}
export function ArthIrrigationLayer(props: Props) {
  return <ArthRasterLayer {...props} layerName="arth_irrigation" colorFn={getIrrigationColor} />;
}
export function ArthTourismLayer(props: Props) {
  return <ArthRasterLayer {...props} layerName="arth_tourism" colorFn={getTourismColor} />;
}
export function ArthGhatsLayer(props: Props) {
  return <ArthRasterLayer {...props} layerName="arth_heritage" colorFn={getGhatsColor} />;
}
export function ArthEconomicLayer(props: Props) {
  return <ArthRasterLayer {...props} layerName="arth_economic" colorFn={getEconomicColor} />;
}

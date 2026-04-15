"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchLayerGeometry } from "../services/geoserverService";
import { FeatureCollection, ZoneOption } from "../types/location";

const guessZoneField = (featureCollection: FeatureCollection | null) => {
  const props = featureCollection?.features?.[0]?.properties;
  if (!props || typeof props !== "object") return "";
  const keys = Object.keys(props);
  const priority = [
    "zone",
    "Zone",
    "ZONE",
    "area_name",
    "Area_Name",
    "AREA_NAME",
    "area",
    "Area",
    "AREA",
    "name",
    "Name",
    "NAME",
  ];
  for (const key of priority) {
    if (keys.includes(key)) return key;
  }
  return keys.find((k) => typeof props[k] === "string") || keys[0] || "";
};

export const useHolisticLocation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [areaGeojson, setAreaGeojson] = useState<FeatureCollection | null>(null);
  const [riversGeojson, setRiversGeojson] = useState<FeatureCollection | null>(null);
  const [basinGeojson, setBasinGeojson] = useState<FeatureCollection | null>(null);
  const [selectedZoneGeojson, setSelectedZoneGeojson] = useState<FeatureCollection | null>(null);
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [zoneField, setZoneField] = useState("");

  useEffect(() => {
    let active = true;
    const loadInitialLayers = async () => {
      setLoading(true);
      setError("");
      try {
        const [area, rivers, basin] = await Promise.all([
          fetchLayerGeometry("Area"),
          fetchLayerGeometry("Rivers"),
          fetchLayerGeometry("basin_boundary"),
        ]);
        if (!active) return;
        setAreaGeojson(area);
        setRiversGeojson(rivers);
        setBasinGeojson(basin);
        setZoneField(guessZoneField(area));
      } catch (err) {
        if (!active) return;
        const message = err instanceof Error ? err.message : "Unable to load map layers";
        setError(message);
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadInitialLayers();
    return () => {
      active = false;
    };
  }, []);

  const zoneOptions: ZoneOption[] = useMemo(() => {
    if (!areaGeojson || !zoneField) return [];
    const optionsMap = new Map<string, ZoneOption>();
    for (const feature of areaGeojson.features || []) {
      const props = feature?.properties || {};
      const raw = props[zoneField];
      if (raw === undefined || raw === null) continue;
      const label = String(raw).trim();
      if (!label) continue;
      if (!optionsMap.has(label)) {
        optionsMap.set(label, { label, value: label });
      }
    }
    return Array.from(optionsMap.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [areaGeojson, zoneField]);

  const onZoneChange = async (zoneValues: string[]) => {
    setSelectedZones(zoneValues);
    if (!zoneValues.length || !areaGeojson || !zoneField) {
      setSelectedZoneGeojson(null);
      return;
    }

    const selectedSet = new Set(zoneValues);
    const selectedFeatures = (areaGeojson.features || []).filter((feature: any) => {
      const props = feature?.properties || {};
      return selectedSet.has(String(props[zoneField] ?? "").trim());
    });

    setSelectedZoneGeojson({
      type: "FeatureCollection",
      features: selectedFeatures,
    });
  };

  return {
    loading,
    error,
    zoneOptions,
    selectedZones,
    areaGeojson,
    riversGeojson,
    basinGeojson,
    selectedZoneGeojson,
    displayedZones: selectedZoneGeojson?.features?.length || 0,
    onZoneChange,
  };
};

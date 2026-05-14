"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import "leaflet/dist/leaflet.css";
import AdminLocation, { STAGE_CONFIGS } from "./components/AdminLocation";
import AdminMap from "./components/AdminMap";
import type { BasemapType } from "./components/AdminMap";
import type { RwqSeason } from "../../shared/map-layers/NirmalRwqLayer";
import { useLocationSelection } from "../../shared/hooks/useLocationSelection";
import SplitActivityPanel from "./components/SplitActivityPanel";

const BASEMAP_OPTIONS: { key: BasemapType; label: string; emoji: string }[] = [
  { key: "terrain",   label: "Terrain",   emoji: "⛰️" },
  { key: "satellite", label: "Satellite", emoji: "🛰️" },
  { key: "streets",   label: "Streets",   emoji: "🛣️" },
  { key: "dark",      label: "Dark",      emoji: "🌑" },
];

type HolisticModuleProps = {
  hideLeftPanel?: boolean;
};

type IndustrialRecord = {
  layer: string;
  label: string;
  zone: string;
  name: string;
  district: string;
  type_of_industry: string;
  category: string;
  pollution_index: string;
  near_river: string;
  dist_km: number | null;
  distance_zone: string;
  latitude: number | null;
  longitude: number | null;
};

type IndustrialLayer = {
  layer: string;
  label: string;
  count: number;
  records: IndustrialRecord[];
  error?: string;
};

type PopulationRecord = {
  village: string;
  gram_panchayat: string;
  block: string;
  subdistrict: string;
  district: string;
  total_population: number | null;
  total_male: number | null;
  total_female: number | null;
  total_households: number | null;
  urban_rural: string;
  zone: string;
};

type GramPanchayatRecord = {
  id: number | null;
  name: string;
  state_code: number | null;
  subdis_cod: number | null;
  zone: string;
};

type RiverFlowRecord = {
  Subbasin: number;
  SUB: string;
  year: number;
  month: number;
  area_km2: number;
  flow_in_cm: number;
  flow_out_c: number;
  yyyyddd: number;
};

type StageSnapshot = {
  selectedDataUsed: string[];
  proceededCriteria: string[];
  proceededOnce: boolean;
  analysisResult: any;
  showRainfallLayer: boolean;
  showRechargeLayer: boolean;
  selectedRainfallYear: number | null;
  outputLoading: boolean;
  rainfallError: string;
  groundwaterError: string;
  tributaryDrainError: string;
  demSlopeError: string;
  flowDirectionError: string;
  showOutputs: boolean;
  rwqSeason: RwqSeason;
  rwqStats: Record<string, Record<string, { mean: number | null; min: number | null; max: number | null }>> | null;
  rwqError: string;
  stpData: any[] | null;
  stpError: string;
  riverFlowStats: Record<string, { mean: number | null; min: number | null; max: number | null }> | null;
  riverFlowError: string;
  drainFlowStats: Record<string, { mean: number | null; min: number | null; max: number | null }> | null;
  channelGeomStats: Record<string, { mean: number | null; min: number | null; max: number | null }> | null;
  channelGeomError: string;
  arthStats: Record<string, { by_zone?: Record<string, { mean: number | null; min: number | null; max: number | null }>; error?: string }> | null;
  arthError: string;
  gyanStats: Record<string, { by_zone?: Record<string, { mean: number | null; min: number | null; max: number | null }>; error?: string }> | null;
  gyanError: string;
  jeevantStats: Record<string, { by_zone?: Record<string, { mean: number | null; min: number | null; max: number | null }>; error?: string }> | null;
  jeevantError: string;
  // kept for potential future use but no longer populated
  riverFlowData: RiverFlowRecord[] | null;
  riverFlowSubbasins: number[] | null;
  riverFlowGeojson: any | null;
  industrialLayers: IndustrialLayer[] | null;
  industrialGeojson: any | null;
  industrialError: string;
  gramPanchayatData: GramPanchayatRecord[] | null;
  gramPanchayatGeojson: any | null;
  gramPanchayatError: string;
  populationData: PopulationRecord[] | null;
  populationGeojson: any | null;
  populationError: string;
  populationTotal: number | null;
  // Phase raster analysis (all stages)
  criteriaWeights: Record<string, number>;
  phaseLoading: boolean;
  phaseError: string;
  phaseTiff: ArrayBuffer | null;
  showPhaseOnMap: boolean;
  showPhasePanel: boolean;
};

function emptySnapshot(): StageSnapshot {
  return {
    selectedDataUsed: [],
    proceededCriteria: [],
    proceededOnce: false,
    analysisResult: null,
    showRainfallLayer: false,
    showRechargeLayer: false,
    selectedRainfallYear: 2024,
    outputLoading: false,
    rainfallError: "",
    groundwaterError: "",
    tributaryDrainError: "",
    demSlopeError: "",
    flowDirectionError: "",
    showOutputs: false,
    rwqSeason: "monsoon" as RwqSeason,
    rwqStats: null,
    rwqError: "",
    stpData: null,
    stpError: "",
    riverFlowStats: null,
    riverFlowError: "",
    drainFlowStats: null,
    channelGeomStats: null,
    channelGeomError: "",
    arthStats: null,
    arthError: "",
    gyanStats: null,
    gyanError: "",
    jeevantStats: null,
    jeevantError: "",
    riverFlowData: null,
    riverFlowSubbasins: null,
    riverFlowGeojson: null,
    industrialLayers: null,
    industrialGeojson: null,
    industrialError: "",
    gramPanchayatData: null,
    gramPanchayatGeojson: null,
    gramPanchayatError: "",
    populationData: null,
    populationGeojson: null,
    populationError: "",
    populationTotal: null,
    criteriaWeights: {},
    phaseLoading: false,
    phaseError: "",
    phaseTiff: null,
    showPhaseOnMap: false,
    showPhasePanel: false,
  };
}

export default function HolisticModule({ hideLeftPanel = false }: HolisticModuleProps) {
  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9000";
  const {
    loading,
    error,
    zoneOptions,
    selectedZones,
    areaGeojson,
    riversGeojson,
    basinGeojson,
    selectedZoneGeojson,
    displayedZones,
    onZoneChange,
  } = useLocationSelection();

  const [locationVisible, setLocationVisible] = useState(!hideLeftPanel);
  const [basemap, setBasemap] = useState<BasemapType>("terrain");
  const [showBasemapPicker, setShowBasemapPicker] = useState(false);

  // All stage snapshots — index 0 = stage 1 (Aviral Ganga), index 1 = stage 2 (Nirmal Ganga), etc.
  const [stageIndex, setStageIndex] = useState(0);
  const [snapshots, setSnapshots] = useState<StageSnapshot[]>([emptySnapshot()]);

  // Current snapshot (convenience alias)
  const snap = snapshots[stageIndex];

  // Updater — patches only the current snapshot
  const patchSnap = (patch: Partial<StageSnapshot>) => {
    setSnapshots((prev) => {
      const next = [...prev];
      next[stageIndex] = { ...next[stageIndex], ...patch };
      return next;
    });
  };

  useEffect(() => {
    document.body.classList.add("holistic-fullscreen-mode");
    return () => {
      document.body.classList.remove("holistic-fullscreen-mode");
    };
  }, []);

  // Derive map criteria from the current snapshot
  const { proceededCriteria } = snap;
  const wantsRainfall = proceededCriteria.some((i) => i.toLowerCase().includes("rainfall"));
  // "Groundwater recharge" (Aviral) — must NOT match "Groundwater quality" (Nirmal)
  const wantsGroundwater = proceededCriteria.some((i) => i.toLowerCase().includes("groundwater recharge"));
  const wantsGroundwaterQuality = proceededCriteria.some((i) => i.toLowerCase().includes("groundwater quality"));
  const wantsRiverWaterQuality = proceededCriteria.some((i) => i.toLowerCase().includes("river water quality"));
  const wantsStp = proceededCriteria.some((i) => i.toLowerCase().includes("stp"));
  const wantsRiverFlow = proceededCriteria.some((i) => i.toLowerCase().includes("river flow"));
  const wantsIndustrial = proceededCriteria.some((i) => i.toLowerCase().includes("industrial"));
  const wantsGramPanchayat = proceededCriteria.some((i) => i.toLowerCase().includes("gram panchayat"));
  const wantsPopulation = proceededCriteria.some((i) => i.toLowerCase().includes("population"));
  const wantsTributaryDrain = proceededCriteria.some((i) => { const v = i.toLowerCase(); return v.includes("tributary") || v.includes("drain"); });
  const wantsDemSlope = proceededCriteria.some((i) => { const v = i.toLowerCase(); return /\bdem\b/.test(v) || v.includes("slope"); });
  const wantsFlowDirection = proceededCriteria.some((i) => i.toLowerCase().includes("surface flow"));
  const wantsChannelGeom = proceededCriteria.some((i) => i.toLowerCase().includes("channel geometry"));
  const wantsAgriculture = proceededCriteria.some((i) => i.toLowerCase().includes("agriculture"));
  const wantsIrrigation  = proceededCriteria.some((i) => i.toLowerCase().includes("irrigation"));
  const wantsTourism     = proceededCriteria.some((i) => i.toLowerCase().includes("tourism"));
  const wantsGhats       = proceededCriteria.some((i) => i.toLowerCase().includes("ghats"));
  const wantsEconomic    = proceededCriteria.some((i) => i.toLowerCase().includes("economic"));
  const wantsBaseline    = proceededCriteria.some((i) => i.toLowerCase().includes("baseline"));
  const wantsGisData     = proceededCriteria.some((i) => i.toLowerCase().includes("remote sensing"));
  const wantsSwat        = proceededCriteria.some((i) => i.toLowerCase().includes("swat"));
  const wantsHydrogeology = proceededCriteria.some((i) => i.toLowerCase().includes("hydrogeology"));
  const wantsSensor      = proceededCriteria.some((i) => i.toLowerCase().includes("monitoring stations"));
  const wantsWetlands    = proceededCriteria.some((i) => i.toLowerCase().includes("wetlands"));
  const wantsRiparian    = proceededCriteria.some((i) => i.toLowerCase().includes("riparian"));
  const wantsBiodiversity = proceededCriteria.some((i) => i.toLowerCase().includes("biodiversity"));
  const wantsFloodplain  = proceededCriteria.some((i) => i.toLowerCase().includes("floodplain"));

  const onToggleDataUsed = (item: string) => {
    const isRemoving = snap.selectedDataUsed.includes(item);
    const nextSelected = isRemoving
      ? snap.selectedDataUsed.filter((v) => v !== item)
      : [...snap.selectedDataUsed, item];
    const nextProceed = isRemoving
      ? snap.proceededCriteria.filter((v) => v !== item)
      : snap.proceededCriteria;
    const patch: Partial<StageSnapshot> = { selectedDataUsed: nextSelected, proceededCriteria: nextProceed };
    if (isRemoving && item.toLowerCase().includes("rainfall")) patch.showRainfallLayer = false;
    if (isRemoving && item.toLowerCase().includes("groundwater")) patch.showRechargeLayer = false;
    patchSnap(patch);
  };

  const onProceed = async () => {
    const criteria = snap.selectedDataUsed;
    const nowWantsRainfall = criteria.some((i) => i.toLowerCase().includes("rainfall"));
    const nowWantsGroundwater = criteria.some((i) => i.toLowerCase().includes("groundwater"));
    const nowWantsTributaryDrain = criteria.some((i) => { const v = i.toLowerCase(); return v.includes("tributary") || v.includes("drain"); });
    const nowWantsDemSlope = criteria.some((i) => { const v = i.toLowerCase(); return /\bdem\b/.test(v) || v.includes("slope"); });
    const nowWantsFlowDirection = criteria.some((i) => i.toLowerCase().includes("surface flow"));
    const nowWantsRiverWaterQuality = criteria.some((i) => i.toLowerCase().includes("river water quality"));
    const nowWantsStp = criteria.some((i) => i.toLowerCase().includes("stp"));
    const nowWantsRiverFlow = criteria.some((i) => i.toLowerCase().includes("river flow"));
    const nowWantsChannelGeom = criteria.some((i) => i.toLowerCase().includes("channel geometry"));
    const nowWantsIndustrial = criteria.some((i) => i.toLowerCase().includes("industrial"));
    const nowWantsGramPanchayat = criteria.some((i) => i.toLowerCase().includes("gram panchayat"));
    const nowWantsPopulation = criteria.some((i) => i.toLowerCase().includes("population"));
    const ARTH_CRITERION_KEYS = ["Agriculture (crop area, water demand)", "Irrigation dependency", "Tourism & cultural nodes", "Ghats & heritage sites", "Economic activity zones"];
    const nowWantsArth = criteria.some((i) => ARTH_CRITERION_KEYS.includes(i));
    const arthCriteriaNeeded = criteria.filter((i) => ARTH_CRITERION_KEYS.includes(i));
    const GYAN_CRITERION_KEYS = ["All baseline datasets", "Remote sensing + GIS maps", "SWAT model outputs", "Hydrogeology (aquifer, MAR, paleo-channels)", "Monitoring stations & sensors"];
    const nowWantsGyan = criteria.some((i) => GYAN_CRITERION_KEYS.includes(i));
    const gyanCriteriaNeeded = criteria.filter((i) => GYAN_CRITERION_KEYS.includes(i));
    const JEEVANT_CRITERION_KEYS = ["Wetlands, ponds, lakes", "Riparian vegetation", "Biodiversity (fish, birds, invasive species)", "Floodplain & habitat data"];
    const nowWantsJeevant = criteria.some((i) => JEEVANT_CRITERION_KEYS.includes(i));
    const jeevantCriteriaNeeded = criteria.filter((i) => JEEVANT_CRITERION_KEYS.includes(i));

    patchSnap({
      showOutputs: true,
      outputLoading: true,
      proceededCriteria: criteria,
      proceededOnce: true,
      showRainfallLayer: nowWantsRainfall,
      showRechargeLayer: false,
      rainfallError: "",
      groundwaterError: "",
      tributaryDrainError: "",
      demSlopeError: "",
      flowDirectionError: "",
      rwqError: "",
      rwqStats: null,
      stpError: "",
      stpData: null,
      riverFlowStats: null,
      riverFlowError: "",
      drainFlowStats: null,
      channelGeomStats: null,
      channelGeomError: "",
      arthStats: null,
      arthError: "",
      gyanStats: null,
      gyanError: "",
      jeevantStats: null,
      jeevantError: "",
      riverFlowData: null,
      riverFlowSubbasins: null,
      riverFlowGeojson: null,
      industrialLayers: null,
      industrialGeojson: null,
      industrialError: "",
      gramPanchayatData: null,
      gramPanchayatGeojson: null,
      gramPanchayatError: "",
      populationData: null,
      populationGeojson: null,
      populationError: "",
      populationTotal: null,
      phaseLoading: false,
      phaseError: "",
      phaseTiff: null,
      showPhaseOnMap: false,
      showPhasePanel: false,
    });

    const nextResult: any = {
      selected_zones: selectedZones,
      rainfall: { years: [], by_zone: {} },
      groundwater: { by_zone: {} },
      tributary_drain: { layers: [], summary: {} },
      dem_slope: { slope: null, dem: null, errors: { slope: [], dem: [] } },
      flow_direction: { direction: { by_zone: {} }, accumulation: { by_zone: {} } },
    };

    try {
      if (nowWantsRainfall) {
        const res = await fetch(`${backendBase}/analysis/rainfall`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selected_zones: selectedZones }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          patchSnap({ rainfallError: data?.detail || `Rainfall analysis failed (${res.status})` });
        } else {
          nextResult.rainfall = data?.rainfall || nextResult.rainfall;
          const years = Array.isArray(data?.rainfall?.years)
            ? data.rainfall.years.filter((y: any) => Number.isFinite(Number(y)))
            : [];
          if (years.length) {
            const sorted = [...years].map(Number).sort((a: number, b: number) => a - b);
            patchSnap({ selectedRainfallYear: sorted[sorted.length - 1] });
          }
        }
      }

      if (nowWantsGroundwater) {
        const res = await fetch(`${backendBase}/analysis/groundwater`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selected_zones: selectedZones }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          patchSnap({ groundwaterError: data?.detail || `Groundwater analysis failed (${res.status})` });
        } else {
          nextResult.groundwater = data?.groundwater || nextResult.groundwater;
        }
      }

      if (nowWantsTributaryDrain) {
        const res = await fetch(`${backendBase}/analysis/tributary-drain`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selected_zones: selectedZones }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          patchSnap({ tributaryDrainError: data?.detail || `Tributary & drain analysis failed (${res.status})` });
        } else {
          patchSnap({ drainFlowStats: data.drain_flow?.by_zone ?? null });
        }
      }

      if (nowWantsDemSlope) {
        const res = await fetch(`${backendBase}/analysis/dem-slope`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selected_zones: selectedZones }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          patchSnap({ demSlopeError: data?.detail || `DEM/Slope analysis failed (${res.status})` });
        } else {
          nextResult.dem_slope = data?.dem_slope || nextResult.dem_slope;
        }
      }

      if (nowWantsFlowDirection) {
        const res = await fetch(`${backendBase}/analysis/flow-direction`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selected_zones: selectedZones }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          patchSnap({ flowDirectionError: data?.detail || `Flow direction analysis failed (${res.status})` });
        } else {
          nextResult.flow_direction = data?.flow_direction || nextResult.flow_direction;
        }
      }

      if (nowWantsStp) {
        const res = await fetch(`${backendBase}/analysis/nirmal-stp`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selected_zones: selectedZones }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          patchSnap({ stpError: data?.detail || `STP analysis failed (${res.status})` });
        } else {
          patchSnap({ stpData: data?.stps || [] });
        }
      }

      if (nowWantsRiverWaterQuality) {
        const res = await fetch(`${backendBase}/analysis/nirmal-rwq-stats`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selected_zones: selectedZones }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          patchSnap({ rwqError: data?.detail || `RWQ stats failed (${res.status})` });
        } else {
          patchSnap({ rwqStats: data?.rwq || null });
        }
      }

      if (nowWantsRiverFlow) {
        const res = await fetch(`${backendBase}/analysis/river-flow`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selected_zones: selectedZones }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          patchSnap({ riverFlowError: data?.detail || `River flow fetch failed (${res.status})` });
        } else {
          patchSnap({ riverFlowStats: data.river_flow?.by_zone ?? null });
        }
      }

      if (nowWantsChannelGeom) {
        const res = await fetch(`${backendBase}/analysis/channel-geometry`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selected_zones: selectedZones }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          patchSnap({ channelGeomError: data?.detail || `Channel geometry fetch failed (${res.status})` });
        } else {
          patchSnap({ channelGeomStats: data.channel_geometry?.by_zone ?? null });
        }
      }

      if (nowWantsArth && arthCriteriaNeeded.length) {
        const res = await fetch(`${backendBase}/analysis/arth-ganga`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selected_zones: selectedZones, criteria: arthCriteriaNeeded }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          patchSnap({ arthError: data?.detail || `Arth Ganga fetch failed (${res.status})` });
        } else {
          patchSnap({ arthStats: data.arth_ganga ?? null });
        }
      }

      if (nowWantsGyan && gyanCriteriaNeeded.length) {
        const res = await fetch(`${backendBase}/analysis/gyan-ganga`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selected_zones: selectedZones, criteria: gyanCriteriaNeeded }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          patchSnap({ gyanError: data?.detail || `Gyan Ganga fetch failed (${res.status})` });
        } else {
          patchSnap({ gyanStats: data.gyan_ganga ?? null });
        }
      }

      if (nowWantsJeevant && jeevantCriteriaNeeded.length) {
        const res = await fetch(`${backendBase}/analysis/jeevant-ganga`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selected_zones: selectedZones, criteria: jeevantCriteriaNeeded }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          patchSnap({ jeevantError: data?.detail || `Jeevant Ganga fetch failed (${res.status})` });
        } else {
          patchSnap({ jeevantStats: data.jeevant_ganga ?? null });
        }
      }

      if (nowWantsPopulation) {
        const res = await fetch(`${backendBase}/analysis/population`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selected_zones: selectedZones }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          patchSnap({ populationError: data?.detail || `Population fetch failed (${res.status})` });
        } else {
          patchSnap({ populationData: data.records ?? [], populationGeojson: data.geojson ?? null, populationTotal: data.total_population ?? null });
        }
      }

      if (nowWantsGramPanchayat) {
        const res = await fetch(`${backendBase}/analysis/gram-panchayat`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selected_zones: selectedZones }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          patchSnap({ gramPanchayatError: data?.detail || `Gram Panchayat fetch failed (${res.status})` });
        } else {
          patchSnap({ gramPanchayatData: data.records ?? [], gramPanchayatGeojson: data.geojson ?? null });
        }
      }

      if (nowWantsIndustrial) {
        const res = await fetch(`${backendBase}/analysis/industrial-discharge`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selected_zones: selectedZones }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          patchSnap({ industrialError: data?.detail || `Industrial discharge fetch failed (${res.status})` });
        } else {
          patchSnap({ industrialLayers: data.layers ?? [], industrialGeojson: data.geojson ?? null });
        }
      }

      patchSnap({ analysisResult: nextResult });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Analysis request failed";
      patchSnap({
        rainfallError: msg, groundwaterError: msg,
        tributaryDrainError: msg, demSlopeError: msg, flowDirectionError: msg,
        rwqError: msg, stpError: msg,
      });
    } finally {
      patchSnap({ outputLoading: false });
    }
  };

  const onNext = () => {
    const nextIndex = stageIndex + 1;
    // Ensure a snapshot slot exists for the next stage
    setSnapshots((prev) => {
      if (prev.length <= nextIndex) {
        return [...prev, emptySnapshot()];
      }
      return prev;
    });
    setStageIndex(nextIndex);
  };

  const onPrevious = () => {
    if (stageIndex > 0) setStageIndex(stageIndex - 1);
  };

  const onStpDataLoaded = useCallback((stps: any[]) => {
    patchSnap({ stpData: stps });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageIndex]);

  const onWeightChange = useCallback((criterion: string, value: number) => {
    patchSnap({ criteriaWeights: { ...snap.criteriaWeights, [criterion]: value } });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap.criteriaWeights, stageIndex]);

  const onGeneratePhaseRaster = useCallback(async () => {
    if (snap.phaseLoading || !snap.selectedDataUsed.length || !selectedZones.length) return;
    patchSnap({ phaseLoading: true, phaseError: "", phaseTiff: null, showPhaseOnMap: false });
    try {
      const weights: Record<string, number> = {};
      for (const c of snap.selectedDataUsed) {
        weights[c] = snap.criteriaWeights[c] ?? 5;
      }
      const res = await fetch(`${backendBase}/analysis/phase-raster`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage_index: stageIndex, selected_zones: selectedZones, criteria_weights: weights }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        patchSnap({ phaseError: data?.detail || `Analysis failed (${res.status})`, phaseLoading: false });
        return;
      }
      const tiff = await res.arrayBuffer();
      patchSnap({ phaseTiff: tiff, phaseLoading: false });
      // Persist to media/temp on the backend so /split page can read it
      try {
        const form = new FormData();
        form.append("stage_index", String(stageIndex));
        form.append("stage_name", STAGE_CONFIGS[stageIndex]?.title ?? `Stage ${stageIndex + 1}`);
        form.append("criteria", JSON.stringify(snap.selectedDataUsed));
        form.append("weights", JSON.stringify(weights));
        form.append("tiff", new Blob([tiff], { type: "image/tiff" }), `phase_raster_${stageIndex}.tif`);
        await fetch(`${backendBase}/analysis/save-phase-raster`, { method: "POST", body: form });
      } catch { /* non-critical — ignore save errors */ }
    } catch (err) {
      patchSnap({ phaseError: err instanceof Error ? err.message : "Request failed", phaseLoading: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap.phaseLoading, snap.selectedDataUsed, snap.criteriaWeights, selectedZones, backendBase, stageIndex]);

  const { analysisResult, showRainfallLayer, showRechargeLayer, selectedRainfallYear,
    outputLoading, rainfallError, groundwaterError, tributaryDrainError,
    demSlopeError, flowDirectionError, showOutputs, rwqSeason, rwqStats, rwqError,
    stpData, stpError, riverFlowStats, riverFlowError, drainFlowStats, channelGeomStats, channelGeomError,
    arthStats, arthError,
    gyanStats, gyanError,
    jeevantStats, jeevantError,
    industrialLayers, industrialGeojson, industrialError,
    gramPanchayatData, gramPanchayatGeojson, gramPanchayatError,
    populationData, populationGeojson, populationError, populationTotal,
    criteriaWeights } = snap;
  const { phaseLoading, phaseError, phaseTiff, showPhaseOnMap } = snap;


  return (
    <div className="min-h-screen bg-[#eef2f8] p-1 md:p-2">
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 md:px-4">
          <h1 className="text-3xl font-extrabold tracking-tight text-blue-800 md:text-[42px]">Holistic River Management</h1>
          <div className="flex items-center gap-3">
            <SplitActivityPanel />
            <Link
              href="/homepage"
              className="rounded-lg bg-slate-300 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              Home
            </Link>
          </div>
        </div>

        <div className="relative h-[calc(100vh-96px)] min-h-[620px] overflow-hidden p-2">
          <div className="h-full w-full">
            <AdminMap
              selectedZones={selectedZones}
              zoneOptions={zoneOptions.map((z) => z.value)}
              areaGeojson={areaGeojson}
              riversGeojson={riversGeojson}
              basinGeojson={basinGeojson}
              selectedZoneGeojson={selectedZoneGeojson}
              analysisResult={analysisResult}
              showRainfallLayer={showRainfallLayer}
              showRechargeLayer={showRechargeLayer}
              rainfallYear={selectedRainfallYear}
              clipApiBase={backendBase}
              industrialGeojson={wantsIndustrial ? industrialGeojson : null}
              gramPanchayatGeojson={wantsGramPanchayat ? gramPanchayatGeojson : null}
              populationGeojson={wantsPopulation ? populationGeojson : null}
              activeCriteria={[
                ...(wantsRiverFlow ? ["River flow"] : []),
                ...(wantsIndustrial ? ["Industrial discharge"] : []),
                ...(wantsGramPanchayat ? ["Gram Panchayat data"] : []),
                ...(wantsPopulation ? ["Population (urban/rural)"] : []),
                ...(wantsTributaryDrain ? ["Tributary & drain flow"] : []),
                ...(wantsChannelGeom ? ["Channel geometry (width, depth)"] : []),
                ...(wantsDemSlope ? ["DEM, slope maps"] : []),
                ...(wantsFlowDirection ? ["Surface flow direction & accumulation maps"] : []),
                ...(wantsGroundwaterQuality ? ["Groundwater quality"] : []),
                ...(wantsRiverWaterQuality ? ["River water quality"] : []),
                ...(wantsStp ? ["STP details"] : []),
                ...(wantsAgriculture   ? ["Agriculture (crop area, water demand)"] : []),
                ...(wantsIrrigation   ? ["Irrigation dependency"] : []),
                ...(wantsTourism      ? ["Tourism & cultural nodes"] : []),
                ...(wantsGhats        ? ["Ghats & heritage sites"] : []),
                ...(wantsEconomic     ? ["Economic activity zones"] : []),
                ...(wantsBaseline     ? ["All baseline datasets"] : []),
                ...(wantsGisData      ? ["Remote sensing + GIS maps"] : []),
                ...(wantsSwat         ? ["SWAT model outputs"] : []),
                ...(wantsHydrogeology ? ["Hydrogeology (aquifer, MAR, paleo-channels)"] : []),
                ...(wantsSensor       ? ["Monitoring stations & sensors"] : []),
                ...(wantsWetlands     ? ["Wetlands, ponds, lakes"] : []),
                ...(wantsRiparian     ? ["Riparian vegetation"] : []),
                ...(wantsBiodiversity ? ["Biodiversity (fish, birds, invasive species)"] : []),
                ...(wantsFloodplain   ? ["Floodplain & habitat data"] : []),
              ]}
              rwqSeason={rwqSeason}
              onStpDataLoaded={onStpDataLoaded}
              aviralTiff={showPhaseOnMap ? phaseTiff : null}
              basemap={basemap}
            />

            {/* ── Basemap switcher — bottom-right inside the map ── */}
            <div style={{ position: "absolute", bottom: 24, right: 16, zIndex: 950, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
              {showBasemapPicker && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4, background: "rgba(255,255,255,0.95)", borderRadius: 12, padding: "8px 6px", boxShadow: "0 4px 20px rgba(0,0,0,0.15)", border: "1px solid #e2e8f0" }}>
                  {BASEMAP_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => { setBasemap(opt.key); setShowBasemapPicker(false); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                        background: basemap === opt.key ? "#eff6ff" : "transparent",
                        color: basemap === opt.key ? "#1d4ed8" : "#374151",
                        fontWeight: basemap === opt.key ? 700 : 500,
                        fontSize: 12,
                        outline: basemap === opt.key ? "1.5px solid #93c5fd" : "none",
                        transition: "all 0.15s",
                      }}
                    >
                      <span style={{ fontSize: 15 }}>{opt.emoji}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowBasemapPicker((p) => !p)}
                title="Change basemap"
                style={{
                  width: 40, height: 40, borderRadius: "50%", border: "2px solid #e2e8f0",
                  background: "#fff", boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
                  cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "box-shadow 0.15s",
                }}
              >
                {BASEMAP_OPTIONS.find((o) => o.key === basemap)?.emoji ?? "🗺️"}
              </button>
            </div>
          </div>

          {!hideLeftPanel ? (
            <>
              <button
                type="button"
                onClick={() => setLocationVisible((prev) => !prev)}
                className="absolute left-4 top-4 z-[950] rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm font-bold text-slate-700 shadow transition hover:bg-slate-50"
                title={locationVisible ? "Hide Location" : "Show Location"}
                aria-label={locationVisible ? "Hide Location" : "Show Location"}
              >
                {locationVisible ? "◀" : "▶"}
              </button>

              <div
                className={`pointer-events-none absolute bottom-4 left-4 top-4 z-[900] w-[340px] max-w-[90vw] transform transition-all duration-300 ease-out ${
                  locationVisible ? "translate-x-0 opacity-100" : "-translate-x-[105%] opacity-0"
                }`}
              >
                <div className="pointer-events-auto h-full">
                  <AdminLocation
                    error={error}
                    loading={loading}
                    onToggleLocation={() => setLocationVisible(false)}
                    stageIndex={stageIndex}
                    selectedDataUsed={snap.selectedDataUsed}
                    onToggleDataUsed={onToggleDataUsed}
                    onProceed={onProceed}
                    proceedDisabled={snap.selectedDataUsed.length === 0}
                    proceededOnce={snap.proceededOnce}
                    onNext={onNext}
                    onPrevious={onPrevious}
                    onGeneratePdf={() => window.print()}
                    selectedZones={selectedZones}
                    zoneOptions={zoneOptions}
                    displayedZones={displayedZones}
                    onZoneChange={onZoneChange}
                    criteriaWeights={criteriaWeights}
                    onWeightChange={onWeightChange}
                    onGenerateSuitability={onGeneratePhaseRaster}
                    suitabilityLoading={phaseLoading}
                    suitabilityError={phaseError}
                    suitabilityReady={!!phaseTiff}
                    showSuitabilityOnMap={showPhaseOnMap}
                    onToggleSuitabilityOnMap={() => patchSnap({ showPhaseOnMap: !snap.showPhaseOnMap })}
                    showAviralPanel={snap.showPhasePanel}
                    onToggleAviralPanel={() => patchSnap({ showPhasePanel: !snap.showPhasePanel })}
                  />
                </div>
              </div>
            </>
          ) : null}

          {showOutputs ? (
            <aside className="absolute bottom-4 right-4 top-4 z-[900] w-[430px] max-w-[42vw] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
              <div className="h-full overflow-y-auto p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">Outputs</h3>
                    <p className="text-xs text-slate-500">{STAGE_CONFIGS[stageIndex]?.title ?? `Stage ${stageIndex + 1}`}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => patchSnap({ showOutputs: false })}
                    className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Hide
                  </button>
                </div>
                <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <p>
                    <span className="font-semibold">Selected Zone(s):</span>{" "}
                    {selectedZones.length ? selectedZones.join(", ") : "N/A"}
                  </p>
                  <p className="mt-1">
                    <span className="font-semibold">Selected Inputs:</span> {snap.selectedDataUsed.length}
                  </p>
                </div>

                {wantsRiverFlow ? (
                  <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <p className="mb-2 text-sm font-bold text-blue-900">River Flow — Zonal Stats (dss_raster:river_flow_1)</p>
                    {outputLoading && !riverFlowStats ? <p className="text-sm text-blue-700">Loading…</p> : null}
                    {riverFlowError ? <p className="text-sm text-red-700">{riverFlowError}</p> : null}
                    {riverFlowStats && (
                      <div className="overflow-auto rounded border border-blue-100 bg-white">
                        <table className="w-full border-collapse text-xs text-slate-700">
                          <thead className="sticky top-0 bg-blue-100">
                            <tr>
                              <th className="border border-blue-200 px-2 py-1 text-left">Zone</th>
                              <th className="border border-blue-200 px-2 py-1 text-right">Mean</th>
                              <th className="border border-blue-200 px-2 py-1 text-right">Min</th>
                              <th className="border border-blue-200 px-2 py-1 text-right">Max</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(riverFlowStats).map(([zone, s], i) => (
                              <tr key={zone} className={i % 2 === 0 ? "bg-white" : "bg-blue-50"}>
                                <td className="border border-blue-100 px-2 py-1 font-medium">{zone}</td>
                                <td className="border border-blue-100 px-2 py-1 text-right">{s.mean != null ? s.mean.toFixed(4) : "—"}</td>
                                <td className="border border-blue-100 px-2 py-1 text-right">{s.min != null ? s.min.toFixed(4) : "—"}</td>
                                <td className="border border-blue-100 px-2 py-1 text-right">{s.max != null ? s.max.toFixed(4) : "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : null}

                {wantsPopulation ? (
                  <div className="mt-3 rounded-lg border border-violet-200 bg-violet-50 p-3">
                    <p className="mb-1 text-sm font-bold text-violet-900">Population (Urban/Rural)</p>
                    {outputLoading && !populationData ? <p className="text-sm text-violet-700">Loading population data…</p> : null}
                    {populationError ? <p className="text-sm text-red-700">{populationError}</p> : null}
                    {populationData && (
                      <>
                        {/* Legend */}
                        <div className="mb-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600">
                          <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-3 rounded-sm" style={{ background: "#86efac" }} />≤500</span>
                          <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-3 rounded-sm" style={{ background: "#479fda" }} />501–1000</span>
                          <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-3 rounded-sm" style={{ background: "#facc15" }} />1001–2000</span>
                          <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-3 rounded-sm" style={{ background: "#f97316" }} />2001–5000</span>
                          <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-3 rounded-sm" style={{ background: "#dc2626" }} />{">"}5000</span>
                        </div>
                        <p className="mb-2 text-[11px] text-slate-500">
                          {populationData.length} villages · Total population: <strong>{populationTotal != null ? populationTotal.toLocaleString() : "—"}</strong>
                        </p>
                        <div className="max-h-72 overflow-auto rounded border border-violet-100 bg-white">
                          <table className="w-full border-collapse text-xs text-slate-700">
                            <thead className="sticky top-0 bg-violet-100">
                              <tr>
                                <th className="border border-violet-200 px-2 py-1 text-left">Village</th>
                                <th className="border border-violet-200 px-2 py-1 text-left">Block</th>
                                <th className="border border-violet-200 px-2 py-1 text-left">U/R</th>
                                <th className="border border-violet-200 px-2 py-1 text-right">Population</th>
                                <th className="border border-violet-200 px-2 py-1 text-right">HH</th>
                              </tr>
                            </thead>
                            <tbody>
                              {populationData.map((r, i) => (
                                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-violet-50"}>
                                  <td className="border border-violet-100 px-2 py-1 font-medium max-w-[90px] truncate" title={r.village}>{r.village || "—"}</td>
                                  <td className="border border-violet-100 px-2 py-1 max-w-[70px] truncate" title={r.block}>{r.block || "—"}</td>
                                  <td className="border border-violet-100 px-2 py-1">{r.urban_rural || "—"}</td>
                                  <td className="border border-violet-100 px-2 py-1 text-right">{r.total_population != null ? r.total_population.toLocaleString() : "—"}</td>
                                  <td className="border border-violet-100 px-2 py-1 text-right">{r.total_households != null ? r.total_households.toLocaleString() : "—"}</td>
                                </tr>
                              ))}
                              {populationData.length === 0 && (
                                <tr><td colSpan={5} className="px-2 py-3 text-center text-slate-400 italic">No villages found in selected zones.</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>
                ) : null}

                {wantsGramPanchayat ? (
                  <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                    <p className="mb-2 text-sm font-bold text-emerald-900">Gram Panchayat Data</p>
                    {outputLoading && !gramPanchayatData ? <p className="text-sm text-emerald-700">Loading gram panchayat data…</p> : null}
                    {gramPanchayatError ? <p className="text-sm text-red-700">{gramPanchayatError}</p> : null}
                    {gramPanchayatData && (
                      <>
                        <p className="mb-2 text-[11px] text-slate-500">{gramPanchayatData.length} gram panchayat(s) found in selected zones</p>
                        <div className="max-h-72 overflow-auto rounded border border-emerald-100 bg-white">
                          <table className="w-full border-collapse text-xs text-slate-700">
                            <thead className="sticky top-0 bg-emerald-100">
                              <tr>
                                <th className="border border-emerald-200 px-2 py-1 text-left">Name</th>
                                <th className="border border-emerald-200 px-2 py-1 text-left">Zone</th>
                                <th className="border border-emerald-200 px-2 py-1 text-right">Sub-dist Code</th>
                                <th className="border border-emerald-200 px-2 py-1 text-right">ID</th>
                              </tr>
                            </thead>
                            <tbody>
                              {gramPanchayatData.map((r, i) => (
                                <tr key={r.id ?? i} className={i % 2 === 0 ? "bg-white" : "bg-emerald-50"}>
                                  <td className="border border-emerald-100 px-2 py-1 font-medium">{r.name || "—"}</td>
                                  <td className="border border-emerald-100 px-2 py-1">{r.zone || "—"}</td>
                                  <td className="border border-emerald-100 px-2 py-1 text-right">{r.subdis_cod ?? "—"}</td>
                                  <td className="border border-emerald-100 px-2 py-1 text-right">{r.id ?? "—"}</td>
                                </tr>
                              ))}
                              {gramPanchayatData.length === 0 && (
                                <tr><td colSpan={4} className="px-2 py-3 text-center text-slate-400 italic">No gram panchayats found in selected zones.</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>
                ) : null}

                {wantsIndustrial ? (
                  <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 p-3">
                    <p className="mb-2 text-sm font-bold text-orange-900">Industrial Discharge</p>
                    {outputLoading && !industrialLayers ? <p className="text-sm text-orange-700">Loading industrial data…</p> : null}
                    {industrialError ? <p className="text-sm text-red-700">{industrialError}</p> : null}
                    {industrialLayers && (
                      <>
                        {/* Legend */}
                        <div className="mb-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600">
                          <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />Green (low)</span>
                          <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-400" />Orange (medium)</span>
                          <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />Red (high)</span>
                        </div>
                        <p className="mb-2 text-[11px] text-slate-500">
                          {industrialLayers.reduce((s, l) => s + l.count, 0)} industries found across {industrialLayers.filter(l => l.count > 0).length} layer(s)
                        </p>
                        {industrialLayers.filter(l => l.count > 0).map((lyr) => (
                          <div key={lyr.layer} className="mb-3">
                            <p className="mb-1 text-xs font-semibold text-slate-800">{lyr.label} <span className="text-slate-400 font-normal">({lyr.count})</span></p>
                            {lyr.error ? <p className="text-xs text-red-600">{lyr.error}</p> : (
                              <div className="max-h-48 overflow-auto rounded border border-orange-100 bg-white">
                                <table className="w-full border-collapse text-xs text-slate-700">
                                  <thead className="sticky top-0 bg-orange-100">
                                    <tr>
                                      <th className="border border-orange-200 px-2 py-1 text-left">Name</th>
                                      <th className="border border-orange-200 px-2 py-1 text-left">Type</th>
                                      <th className="border border-orange-200 px-2 py-1 text-left">Cat.</th>
                                      <th className="border border-orange-200 px-2 py-1 text-right">Dist (km)</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {lyr.records.map((rec, i) => {
                                      const cat = (rec.category ?? "").toLowerCase();
                                      const dotColor = cat === "red" ? "#ef4444" : cat === "orange" ? "#f97316" : "#22c55e";
                                      return (
                                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-orange-50"}>
                                          <td className="border border-orange-100 px-2 py-1 max-w-[90px] truncate" title={rec.name}>{rec.name ?? "—"}</td>
                                          <td className="border border-orange-100 px-2 py-1 max-w-[80px] truncate" title={rec.type_of_industry}>{rec.type_of_industry ?? "—"}</td>
                                          <td className="border border-orange-100 px-2 py-1">
                                            <span className="flex items-center gap-1">
                                              <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ background: dotColor }} />
                                              {rec.category ?? "—"}
                                            </span>
                                          </td>
                                          <td className="border border-orange-100 px-2 py-1 text-right">{rec.dist_km != null ? Number(rec.dist_km).toFixed(2) : "—"}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        ))}
                        {industrialLayers.every(l => l.count === 0) && (
                          <p className="text-xs text-slate-500">No industries found in selected zones.</p>
                        )}
                      </>
                    )}
                  </div>
                ) : null}

                {wantsTributaryDrain ? (
                  <div className="mt-3 rounded-lg border border-teal-200 bg-teal-50 p-3">
                    <p className="mb-2 text-sm font-bold text-teal-900">Drain Flow — Zonal Stats (dss_raster:drain_flow_1)</p>
                    {outputLoading && !drainFlowStats ? <p className="text-sm text-teal-700">Loading…</p> : null}
                    {tributaryDrainError ? <p className="text-sm text-red-700">{tributaryDrainError}</p> : null}
                    {drainFlowStats && (
                      <div className="overflow-auto rounded border border-teal-100 bg-white">
                        <table className="w-full border-collapse text-xs text-slate-700">
                          <thead className="sticky top-0 bg-teal-100">
                            <tr>
                              <th className="border border-teal-200 px-2 py-1 text-left">Zone</th>
                              <th className="border border-teal-200 px-2 py-1 text-right">Mean</th>
                              <th className="border border-teal-200 px-2 py-1 text-right">Min</th>
                              <th className="border border-teal-200 px-2 py-1 text-right">Max</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(drainFlowStats).map(([zone, s], i) => (
                              <tr key={zone} className={i % 2 === 0 ? "bg-white" : "bg-teal-50"}>
                                <td className="border border-teal-100 px-2 py-1 font-medium">{zone}</td>
                                <td className="border border-teal-100 px-2 py-1 text-right">{s.mean != null ? s.mean.toFixed(4) : "—"}</td>
                                <td className="border border-teal-100 px-2 py-1 text-right">{s.min != null ? s.min.toFixed(4) : "—"}</td>
                                <td className="border border-teal-100 px-2 py-1 text-right">{s.max != null ? s.max.toFixed(4) : "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : null}

                {wantsChannelGeom ? (
                  <div className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50 p-3">
                    <p className="mb-2 text-sm font-bold text-indigo-900">Channel Geometry — Zonal Stats (dss_raster:channel_1)</p>
                    {outputLoading && !channelGeomStats ? <p className="text-sm text-indigo-700">Loading…</p> : null}
                    {channelGeomError ? <p className="text-sm text-red-700">{channelGeomError}</p> : null}
                    {channelGeomStats && (
                      <div className="overflow-auto rounded border border-indigo-100 bg-white">
                        <table className="w-full border-collapse text-xs text-slate-700">
                          <thead className="sticky top-0 bg-indigo-100">
                            <tr>
                              <th className="border border-indigo-200 px-2 py-1 text-left">Zone</th>
                              <th className="border border-indigo-200 px-2 py-1 text-right">Mean</th>
                              <th className="border border-indigo-200 px-2 py-1 text-right">Min</th>
                              <th className="border border-indigo-200 px-2 py-1 text-right">Max</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(channelGeomStats).map(([zone, s], i) => (
                              <tr key={zone} className={i % 2 === 0 ? "bg-white" : "bg-indigo-50"}>
                                <td className="border border-indigo-100 px-2 py-1 font-medium">{zone}</td>
                                <td className="border border-indigo-100 px-2 py-1 text-right">{s.mean != null ? s.mean.toFixed(4) : "—"}</td>
                                <td className="border border-indigo-100 px-2 py-1 text-right">{s.min != null ? s.min.toFixed(4) : "—"}</td>
                                <td className="border border-indigo-100 px-2 py-1 text-right">{s.max != null ? s.max.toFixed(4) : "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : null}

                {(wantsBaseline || wantsGisData || wantsSwat || wantsHydrogeology || wantsSensor) ? (
                  <div className="mt-3 space-y-3">
                    {gyanError ? <p className="text-sm text-red-700">{gyanError}</p> : null}
                    {outputLoading && !gyanStats ? <p className="text-sm text-slate-500">Loading Gyan Ganga data…</p> : null}
                    {([
                      { key: "All baseline datasets",                       wants: wantsBaseline,     label: "Baseline Datasets",    border: "border-slate-300",  bg: "bg-slate-50",  hbg: "bg-slate-100",  text: "text-slate-900",  cellBorder: "border-slate-200",  cellBg: "bg-slate-50"  },
                      { key: "Remote sensing + GIS maps",                   wants: wantsGisData,      label: "Remote Sensing / GIS", border: "border-lime-300",   bg: "bg-lime-50",   hbg: "bg-lime-100",   text: "text-lime-900",   cellBorder: "border-lime-200",   cellBg: "bg-lime-50"   },
                      { key: "SWAT model outputs",                          wants: wantsSwat,         label: "SWAT Model",           border: "border-sky-200",    bg: "bg-sky-50",    hbg: "bg-sky-100",    text: "text-sky-900",    cellBorder: "border-sky-100",    cellBg: "bg-sky-50"    },
                      { key: "Hydrogeology (aquifer, MAR, paleo-channels)", wants: wantsHydrogeology, label: "Hydrogeology",         border: "border-orange-200", bg: "bg-orange-50", hbg: "bg-orange-100", text: "text-orange-900", cellBorder: "border-orange-100", cellBg: "bg-orange-50" },
                      { key: "Monitoring stations & sensors",               wants: wantsSensor,       label: "Monitoring Sensors",   border: "border-violet-200", bg: "bg-violet-50", hbg: "bg-violet-100", text: "text-violet-900", cellBorder: "border-violet-100", cellBg: "bg-violet-50" },
                    ] as const).filter(({ wants }) => wants).map(({ key, label, border, bg, hbg, text, cellBorder, cellBg }) => {
                      const entry = gyanStats?.[key];
                      return (
                        <div key={key} className={`rounded-lg border ${border} ${bg} p-3`}>
                          <p className={`mb-2 text-sm font-bold ${text}`}>{label} — Zonal Stats</p>
                          {entry?.error ? <p className="text-sm text-red-700">{entry.error}</p> : null}
                          {entry?.by_zone && (
                            <div className="overflow-auto rounded border bg-white" style={{ borderColor: "inherit" }}>
                              <table className="w-full border-collapse text-xs text-slate-700">
                                <thead className={`sticky top-0 ${hbg}`}>
                                  <tr>
                                    <th className={`border ${cellBorder} px-2 py-1 text-left`}>Zone</th>
                                    <th className={`border ${cellBorder} px-2 py-1 text-right`}>Mean</th>
                                    <th className={`border ${cellBorder} px-2 py-1 text-right`}>Min</th>
                                    <th className={`border ${cellBorder} px-2 py-1 text-right`}>Max</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {Object.entries(entry.by_zone).map(([zone, s], i) => (
                                    <tr key={zone} className={i % 2 === 0 ? "bg-white" : cellBg}>
                                      <td className={`border ${cellBorder} px-2 py-1 font-medium`}>{zone}</td>
                                      <td className={`border ${cellBorder} px-2 py-1 text-right`}>{s.mean != null ? Number(s.mean).toFixed(4) : "—"}</td>
                                      <td className={`border ${cellBorder} px-2 py-1 text-right`}>{s.min != null ? Number(s.min).toFixed(4) : "—"}</td>
                                      <td className={`border ${cellBorder} px-2 py-1 text-right`}>{s.max != null ? Number(s.max).toFixed(4) : "—"}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                {(wantsWetlands || wantsRiparian || wantsBiodiversity || wantsFloodplain) ? (
                  <div className="mt-3 space-y-3">
                    {jeevantError ? <p className="text-sm text-red-700">{jeevantError}</p> : null}
                    {outputLoading && !jeevantStats ? <p className="text-sm text-slate-500">Loading Jeevant Ganga data…</p> : null}
                    {([
                      { key: "Wetlands, ponds, lakes",                       wants: wantsWetlands,    label: "Wetlands",       border: "border-teal-200",  bg: "bg-teal-50",  hbg: "bg-teal-100",  text: "text-teal-900",  cellBorder: "border-teal-100",  cellBg: "bg-teal-50"  },
                      { key: "Riparian vegetation",                           wants: wantsRiparian,    label: "Riparian Veg.",  border: "border-green-200", bg: "bg-green-50", hbg: "bg-green-100", text: "text-green-900", cellBorder: "border-green-100", cellBg: "bg-green-50" },
                      { key: "Biodiversity (fish, birds, invasive species)",  wants: wantsBiodiversity,label: "Biodiversity",   border: "border-yellow-200",bg: "bg-yellow-50",hbg: "bg-yellow-100",text: "text-yellow-900",cellBorder: "border-yellow-100",cellBg: "bg-yellow-50"},
                      { key: "Floodplain & habitat data",                     wants: wantsFloodplain,  label: "Floodplain",     border: "border-indigo-200",bg: "bg-indigo-50",hbg: "bg-indigo-100",text: "text-indigo-900",cellBorder: "border-indigo-100",cellBg: "bg-indigo-50"},
                    ] as const).filter(({ wants }) => wants).map(({ key, label, border, bg, hbg, text, cellBorder, cellBg }) => {
                      const entry = jeevantStats?.[key];
                      return (
                        <div key={key} className={`rounded-lg border ${border} ${bg} p-3`}>
                          <p className={`mb-2 text-sm font-bold ${text}`}>{label} — Zonal Stats</p>
                          {entry?.error ? <p className="text-sm text-red-700">{entry.error}</p> : null}
                          {entry?.by_zone && (
                            <div className="overflow-auto rounded border bg-white" style={{ borderColor: "inherit" }}>
                              <table className="w-full border-collapse text-xs text-slate-700">
                                <thead className={`sticky top-0 ${hbg}`}>
                                  <tr>
                                    <th className={`border ${cellBorder} px-2 py-1 text-left`}>Zone</th>
                                    <th className={`border ${cellBorder} px-2 py-1 text-right`}>Mean</th>
                                    <th className={`border ${cellBorder} px-2 py-1 text-right`}>Min</th>
                                    <th className={`border ${cellBorder} px-2 py-1 text-right`}>Max</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {Object.entries(entry.by_zone).map(([zone, s], i) => (
                                    <tr key={zone} className={i % 2 === 0 ? "bg-white" : cellBg}>
                                      <td className={`border ${cellBorder} px-2 py-1 font-medium`}>{zone}</td>
                                      <td className={`border ${cellBorder} px-2 py-1 text-right`}>{s.mean != null ? Number(s.mean).toFixed(4) : "—"}</td>
                                      <td className={`border ${cellBorder} px-2 py-1 text-right`}>{s.min != null ? Number(s.min).toFixed(4) : "—"}</td>
                                      <td className={`border ${cellBorder} px-2 py-1 text-right`}>{s.max != null ? Number(s.max).toFixed(4) : "—"}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                {(wantsAgriculture || wantsIrrigation || wantsTourism || wantsGhats || wantsEconomic) ? (
                  <div className="mt-3 space-y-3">
                    {arthError ? <p className="text-sm text-red-700">{arthError}</p> : null}
                    {outputLoading && !arthStats ? <p className="text-sm text-slate-500">Loading Arth Ganga data…</p> : null}
                    {([
                      { key: "Agriculture (crop area, water demand)", wants: wantsAgriculture, label: "Agriculture",       border: "border-green-200",  bg: "bg-green-50",  hbg: "bg-green-100",  text: "text-green-900",  cellBorder: "border-green-100",  cellBg: "bg-green-50"  },
                      { key: "Irrigation dependency",                 wants: wantsIrrigation,  label: "Irrigation",        border: "border-cyan-200",   bg: "bg-cyan-50",   hbg: "bg-cyan-100",   text: "text-cyan-900",   cellBorder: "border-cyan-100",   cellBg: "bg-cyan-50"   },
                      { key: "Tourism & cultural nodes",              wants: wantsTourism,     label: "Tourism & Culture", border: "border-amber-200",  bg: "bg-amber-50",  hbg: "bg-amber-100",  text: "text-amber-900",  cellBorder: "border-amber-100",  cellBg: "bg-amber-50"  },
                      { key: "Ghats & heritage sites",               wants: wantsGhats,       label: "Ghats & Heritage",  border: "border-rose-200",   bg: "bg-rose-50",   hbg: "bg-rose-100",   text: "text-rose-900",   cellBorder: "border-rose-100",   cellBg: "bg-rose-50"   },
                      { key: "Economic activity zones",               wants: wantsEconomic,    label: "Economic Activity", border: "border-purple-200", bg: "bg-purple-50", hbg: "bg-purple-100", text: "text-purple-900", cellBorder: "border-purple-100", cellBg: "bg-purple-50" },
                    ] as const).filter(({ wants }) => wants).map(({ key, label, border, bg, hbg, text, cellBorder, cellBg }) => {
                      const entry = arthStats?.[key];
                      return (
                        <div key={key} className={`rounded-lg border ${border} ${bg} p-3`}>
                          <p className={`mb-2 text-sm font-bold ${text}`}>{label} — Zonal Stats</p>
                          {entry?.error ? <p className="text-sm text-red-700">{entry.error}</p> : null}
                          {entry?.by_zone && (
                            <div className="overflow-auto rounded border bg-white" style={{ borderColor: "inherit" }}>
                              <table className="w-full border-collapse text-xs text-slate-700">
                                <thead className={`sticky top-0 ${hbg}`}>
                                  <tr>
                                    <th className={`border ${cellBorder} px-2 py-1 text-left`}>Zone</th>
                                    <th className={`border ${cellBorder} px-2 py-1 text-right`}>Mean</th>
                                    <th className={`border ${cellBorder} px-2 py-1 text-right`}>Min</th>
                                    <th className={`border ${cellBorder} px-2 py-1 text-right`}>Max</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {Object.entries(entry.by_zone).map(([zone, s], i) => (
                                    <tr key={zone} className={i % 2 === 0 ? "bg-white" : cellBg}>
                                      <td className={`border ${cellBorder} px-2 py-1 font-medium`}>{zone}</td>
                                      <td className={`border ${cellBorder} px-2 py-1 text-right`}>{s.mean != null ? Number(s.mean).toFixed(4) : "—"}</td>
                                      <td className={`border ${cellBorder} px-2 py-1 text-right`}>{s.min != null ? Number(s.min).toFixed(4) : "—"}</td>
                                      <td className={`border ${cellBorder} px-2 py-1 text-right`}>{s.max != null ? Number(s.max).toFixed(4) : "—"}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                {wantsRainfall ? (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                    <p className="mb-2 text-sm font-bold text-slate-900">Rainfall Output (Selected Zones)</p>
                    <div className="mb-2 rounded border border-slate-200 bg-slate-50 p-2 text-[11px]">
                      <p className="mb-1 font-semibold text-slate-700">Legend (Rainfall mm)</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-700">
                        <span className="flex items-center gap-1"><span className="inline-block h-3 w-4 border border-slate-500 bg-[rgba(0,248,33,0.72)]" />{"< 900"}</span>
                        <span className="flex items-center gap-1"><span className="inline-block h-3 w-4 border border-slate-500 bg-[rgba(37,99,235,0.72)]" />900-1000</span>
                        <span className="flex items-center gap-1"><span className="inline-block h-3 w-4 border border-slate-500 bg-[rgba(6,182,212,0.72)]" />1000-1100</span>
                        <span className="flex items-center gap-1"><span className="inline-block h-3 w-4 border border-slate-500 bg-[rgba(245,158,11,0.72)]" />1100-1200</span>
                        <span className="flex items-center gap-1"><span className="inline-block h-3 w-4 border border-slate-500 bg-[rgba(239,68,68,0.72)]" />1200-1300</span>
                        <span className="flex items-center gap-1"><span className="inline-block h-3 w-4 border border-slate-500 bg-[rgba(147,51,234,0.72)]" />1300-1400</span>
                        <span className="flex items-center gap-1"><span className="inline-block h-3 w-4 border border-slate-500 bg-[rgba(240,0,208,0.85)]" />{"> 1400"}</span>
                      </div>
                    </div>
                    {outputLoading ? <p className="text-sm text-blue-700">Running analysis...</p> : null}
                    {rainfallError ? <p className="text-sm text-red-700">{rainfallError}</p> : null}
                    {!outputLoading && !rainfallError && analysisResult?.rainfall?.years?.length ? (
                      <div className="mb-2">
                        <label className="mb-1 block text-xs font-semibold text-slate-700">Rainfall Year (Map)</label>
                        <select
                          className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                          value={selectedRainfallYear ?? ""}
                          onChange={(e) => patchSnap({ selectedRainfallYear: Number(e.target.value) })}
                        >
                          {analysisResult.rainfall.years.map((year: number) => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                    ) : null}
                    {!outputLoading && !rainfallError && analysisResult?.rainfall?.by_zone ? (
                      <div className="max-h-72 overflow-auto text-xs text-slate-700">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-slate-50">
                              <th className="border border-slate-200 px-2 py-1 text-left">Zone</th>
                              <th className="border border-slate-200 px-2 py-1 text-left">Year</th>
                              <th className="border border-slate-200 px-2 py-1 text-left">Mean Rainfall</th>
                              <th className="border border-slate-200 px-2 py-1 text-left">Min Rainfall</th>
                              <th className="border border-slate-200 px-2 py-1 text-left">Max Rainfall</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(analysisResult.rainfall.by_zone).map(([zone, rows]: [string, any]) => {
                              const rowForYear = (rows || []).find((r: any) => Number(r?.year) === Number(selectedRainfallYear)) || null;
                              return (
                                <tr key={`${zone}-${selectedRainfallYear ?? "na"}`}>
                                  <td className="border border-slate-200 px-2 py-1 font-semibold">{zone}</td>
                                  <td className="border border-slate-200 px-2 py-1">{selectedRainfallYear ?? "N/A"}</td>
                                  <td className="border border-slate-200 px-2 py-1">{rowForYear?.mean == null ? "N/A" : rowForYear.mean}</td>
                                  <td className="border border-slate-200 px-2 py-1">{rowForYear?.min == null ? "N/A" : rowForYear.min}</td>
                                  <td className="border border-slate-200 px-2 py-1">{rowForYear?.max == null ? "N/A" : rowForYear.max}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {wantsGroundwater ? (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                    <p className="mb-2 text-sm font-bold text-slate-900">Groundwater Recharge Output (Selected Zones)</p>
                    {outputLoading ? <p className="text-sm text-blue-700">Running analysis...</p> : null}
                    {groundwaterError ? <p className="text-sm text-red-700">{groundwaterError}</p> : null}
                    {!outputLoading && !groundwaterError && analysisResult?.groundwater?.by_zone ? (
                      <div className="max-h-56 overflow-auto text-xs text-slate-700">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-slate-50">
                              <th className="border border-slate-200 px-2 py-1 text-left">Zone</th>
                              <th className="border border-slate-200 px-2 py-1 text-left">Year</th>
                              <th className="border border-slate-200 px-2 py-1 text-left">Mean Recharge</th>
                              <th className="border border-slate-200 px-2 py-1 text-left">Min Recharge</th>
                              <th className="border border-slate-200 px-2 py-1 text-left">Max Recharge</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(analysisResult.groundwater.by_zone).flatMap(([zone, rows]: [string, any]) => {
                              const entries = Array.isArray(rows) ? rows : [rows];
                              return entries.map((row: any, i: number) => (
                                <tr key={`gw-${zone}-${i}`}>
                                  {i === 0 && <td className="border border-slate-200 px-2 py-1 font-semibold" rowSpan={entries.length}>{zone}</td>}
                                  <td className="border border-slate-200 px-2 py-1">{row?.year ?? "—"}</td>
                                  <td className="border border-slate-200 px-2 py-1">{row?.mean == null ? "N/A" : Number(row.mean).toFixed(2)}</td>
                                  <td className="border border-slate-200 px-2 py-1">{row?.min == null ? "N/A" : Number(row.min).toFixed(2)}</td>
                                  <td className="border border-slate-200 px-2 py-1">{row?.max == null ? "N/A" : Number(row.max).toFixed(2)}</td>
                                </tr>
                              ));
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {wantsDemSlope ? (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                    <p className="mb-2 text-sm font-bold text-slate-900">DEM & Slope Output (Selected Zones)</p>
                    {outputLoading ? <p className="text-sm text-blue-700">Running analysis...</p> : null}
                    {demSlopeError ? <p className="text-sm text-red-700">{demSlopeError}</p> : null}

                    {!outputLoading && !demSlopeError && analysisResult?.dem_slope?.slope?.by_zone ? (
                      <div className="mb-3">
                        <p className="mb-1 text-xs font-semibold text-slate-700">Slope ({analysisResult?.dem_slope?.slope?.coverage || "N/A"})</p>
                        <div className="max-h-44 overflow-auto text-xs text-slate-700">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-slate-50">
                                <th className="border border-slate-200 px-2 py-1 text-left">Zone</th>
                                <th className="border border-slate-200 px-2 py-1 text-left">Mean</th>
                                <th className="border border-slate-200 px-2 py-1 text-left">Min</th>
                                <th className="border border-slate-200 px-2 py-1 text-left">Max</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(analysisResult.dem_slope.slope.by_zone).map(([zone, row]: [string, any]) => (
                                <tr key={`slope-${zone}`}>
                                  <td className="border border-slate-200 px-2 py-1 font-semibold">{zone}</td>
                                  <td className="border border-slate-200 px-2 py-1">{row?.mean ?? "N/A"}</td>
                                  <td className="border border-slate-200 px-2 py-1">{row?.min ?? "N/A"}</td>
                                  <td className="border border-slate-200 px-2 py-1">{row?.max ?? "N/A"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : null}

                    {!outputLoading && !demSlopeError && analysisResult?.dem_slope?.dem?.by_zone ? (
                      <div>
                        <p className="mb-1 text-xs font-semibold text-slate-700">DEM ({analysisResult?.dem_slope?.dem?.coverage || "N/A"})</p>
                        <div className="max-h-44 overflow-auto text-xs text-slate-700">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-slate-50">
                                <th className="border border-slate-200 px-2 py-1 text-left">Zone</th>
                                <th className="border border-slate-200 px-2 py-1 text-left">Mean</th>
                                <th className="border border-slate-200 px-2 py-1 text-left">Min</th>
                                <th className="border border-slate-200 px-2 py-1 text-left">Max</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(analysisResult.dem_slope.dem.by_zone).map(([zone, row]: [string, any]) => (
                                <tr key={`dem-${zone}`}>
                                  <td className="border border-slate-200 px-2 py-1 font-semibold">{zone}</td>
                                  <td className="border border-slate-200 px-2 py-1">{row?.mean ?? "N/A"}</td>
                                  <td className="border border-slate-200 px-2 py-1">{row?.min ?? "N/A"}</td>
                                  <td className="border border-slate-200 px-2 py-1">{row?.max ?? "N/A"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {wantsFlowDirection ? (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                    <p className="mb-2 text-sm font-bold text-slate-900">Surface Flow Direction & Accumulation Output</p>
                    {outputLoading ? <p className="text-sm text-blue-700">Running analysis...</p> : null}
                    {flowDirectionError ? <p className="text-sm text-red-700">{flowDirectionError}</p> : null}

                    {!outputLoading && !flowDirectionError && (
                      <div className="mb-2 rounded border border-slate-200 bg-slate-50 p-2 text-[11px]">
                        <p className="mb-1 font-semibold text-slate-700">Direction Legend</p>
                        <div className="flex flex-wrap gap-x-2 gap-y-1">
                          {[["→ E","#3b82f6"],["↘ SE","#06b6d4"],["↓ S","#22c55e"],["↙ SW","#84cc16"],["← W","#eab308"],["↖ NW","#f97316"],["↑ N","#ef4444"],["↗ NE","#a855f7"]].map(([label, color]) => (
                            <span key={label} className="flex items-center gap-1">
                              <span className="inline-block h-3 w-4 rounded-sm border border-slate-300" style={{ background: color }} />
                              {label}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {!outputLoading && !flowDirectionError && analysisResult?.flow_direction?.direction?.by_zone &&
                      Object.keys(analysisResult.flow_direction.direction.by_zone).length > 0 ? (
                      <div className="mb-3">
                        <p className="mb-1 text-xs font-semibold text-slate-700">Flow Direction (per zone)</p>
                        <div className="max-h-48 overflow-auto text-xs text-slate-700">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-slate-50">
                                <th className="border border-slate-200 px-2 py-1 text-left">Zone</th>
                                <th className="border border-slate-200 px-2 py-1 text-left">Dominant Dir.</th>
                                <th className="border border-slate-200 px-2 py-1 text-left">%</th>
                                <th className="border border-slate-200 px-2 py-1 text-left">Distribution</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(analysisResult.flow_direction.direction.by_zone).map(([zone, row]: [string, any]) => (
                                <tr key={`fd-${zone}`}>
                                  <td className="border border-slate-200 px-2 py-1 font-semibold">{zone}</td>
                                  <td className="border border-slate-200 px-2 py-1">{row?.dominant_direction ?? "N/A"}</td>
                                  <td className="border border-slate-200 px-2 py-1">{row?.dominant_pct != null ? `${row.dominant_pct}%` : "N/A"}</td>
                                  <td className="border border-slate-200 px-2 py-1 text-[10px]">
                                    {row?.distribution ? Object.entries(row.distribution).map(([d, p]: [string, any]) => `${d}:${p}%`).join(" ") : "N/A"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {wantsRiverWaterQuality ? (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                    <p className="mb-2 text-sm font-bold text-slate-900">River Water Quality (Nirmal Ganga)</p>
                    {/* Season switcher — also updates map layer */}
                    <div className="mb-2 flex gap-1">
                      {(["premonsoon", "monsoon", "postmonsoon"] as RwqSeason[]).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => patchSnap({ rwqSeason: s })}
                          className={`flex-1 rounded border px-2 py-1 text-[11px] font-semibold transition ${
                            rwqSeason === s
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {s === "premonsoon" ? "Pre-Monsoon" : s === "monsoon" ? "Monsoon" : "Post-Monsoon"}
                        </button>
                      ))}
                    </div>
                    {/* Legend */}
                    <div className="mb-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600">
                      {([["#22c55e","≥150 Excellent"],["#84cc16","≥120 Good"],["#facc15","≥100 Moderate"],["#f97316","≥80 Poor"],["#dc2626","<80 Critical"]] as [string,string][]).map(([bg, label]) => (
                        <span key={label} className="flex items-center gap-1">
                          <span className="inline-block h-3 w-4 rounded-sm border border-slate-300" style={{ background: bg }} />
                          {label}
                        </span>
                      ))}
                    </div>
                    {/* Stats table */}
                    {outputLoading ? <p className="text-sm text-blue-700">Running analysis...</p> : null}
                    {rwqError ? <p className="text-sm text-red-700">{rwqError}</p> : null}
                    {!outputLoading && !rwqError && rwqStats ? (() => {
                      const seasonData = rwqStats[rwqSeason] ?? {};
                      const zones = Object.keys(seasonData);
                      if (!zones.length) return <p className="text-xs text-slate-500">No data for selected zones.</p>;
                      const seasonLabel = rwqSeason === "premonsoon" ? "Pre-Monsoon" : rwqSeason === "monsoon" ? "Monsoon" : "Post-Monsoon";
                      return (
                        <div className="overflow-auto">
                          <p className="mb-1 text-[11px] font-semibold text-slate-600">{seasonLabel} — RWQ Index per Zone</p>
                          <table className="w-full border-collapse text-xs text-slate-700">
                            <thead>
                              <tr className="bg-slate-50">
                                <th className="border border-slate-200 px-2 py-1 text-left">Zone</th>
                                <th className="border border-slate-200 px-2 py-1 text-right">Min</th>
                                <th className="border border-slate-200 px-2 py-1 text-right">Mean</th>
                                <th className="border border-slate-200 px-2 py-1 text-right">Max</th>
                                <th className="border border-slate-200 px-2 py-1 text-left">Quality</th>
                              </tr>
                            </thead>
                            <tbody>
                              {zones.map((zone) => {
                                const row = seasonData[zone];
                                const mean = row?.mean;
                                const quality = mean == null ? "—"
                                  : mean >= 150 ? "Excellent"
                                  : mean >= 120 ? "Good"
                                  : mean >= 100 ? "Moderate"
                                  : mean >= 80  ? "Poor"
                                  : "Critical";
                                const qualityColor = mean == null ? "#94a3b8"
                                  : mean >= 150 ? "#22c55e"
                                  : mean >= 120 ? "#84cc16"
                                  : mean >= 100 ? "#ca8a04"
                                  : mean >= 80  ? "#f97316"
                                  : "#dc2626";
                                return (
                                  <tr key={zone}>
                                    <td className="border border-slate-200 px-2 py-1 font-semibold">{zone}</td>
                                    <td className="border border-slate-200 px-2 py-1 text-right">{row?.min ?? "N/A"}</td>
                                    <td className="border border-slate-200 px-2 py-1 text-right">{row?.mean ?? "N/A"}</td>
                                    <td className="border border-slate-200 px-2 py-1 text-right">{row?.max ?? "N/A"}</td>
                                    <td className="border border-slate-200 px-2 py-1 font-semibold" style={{ color: qualityColor }}>{quality}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                          <p className="mt-1 text-[10px] text-slate-400">Higher RWQ index = better water quality. Values from {seasonLabel.toLowerCase()} raster clipped to selected zones.</p>
                        </div>
                      );
                    })() : null}
                  </div>
                ) : null}

                {wantsStp ? (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                    <p className="mb-2 text-sm font-bold text-slate-900">STP Details (Selected Zones)</p>
                    {outputLoading ? <p className="text-sm text-blue-700">Running analysis...</p> : null}
                    {stpError ? <p className="text-sm text-red-700">{stpError}</p> : null}
                    {!outputLoading && !stpError && stpData != null ? (
                      stpData.length === 0
                        ? <p className="text-xs text-slate-500">No STPs found in selected zones.</p>
                        : (
                          <div className="max-h-96 overflow-auto">
                            <p className="mb-2 text-[11px] text-slate-500">{stpData.length} STP{stpData.length > 1 ? "s" : ""} found — click markers on map for full details</p>
                            {stpData.map((stp: any, i: number) => {
                              const obod = stp.outlet_BOD;
                              const dotColor = obod == null ? "#f59e0b" : obod <= 30 ? "#22c55e" : obod <= 60 ? "#f97316" : "#ef4444";
                              const v = (val: number | null) => val != null ? val : "—";
                              return (
                                <div key={i} className="mb-3 rounded border border-slate-200 p-2">
                                  <div className="mb-1 flex items-start justify-between gap-2">
                                    <span className="text-[11px] font-bold text-slate-800 leading-tight">{stp.name}</span>
                                    <span className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold text-white" style={{ background: dotColor }}>
                                      {stp.status ?? "Live"}
                                    </span>
                                  </div>
                                  <p className="mb-1 text-[10px] text-slate-500">{[stp.city, stp.district, stp.state].filter(Boolean).join(" · ")}{stp.capacity_mld != null ? ` · ${stp.capacity_mld} MLD` : ""}</p>
                                  <table className="w-full border-collapse text-[11px] text-slate-700">
                                    <thead>
                                      <tr className="bg-slate-50">
                                        <th className="border border-slate-200 px-1.5 py-1 text-left text-[10px] text-slate-500">Param</th>
                                        <th className="border border-slate-200 px-1.5 py-1 text-right text-[10px] text-slate-500">Inlet</th>
                                        <th className="border border-slate-200 px-1.5 py-1 text-right text-[10px] text-slate-500">Outlet</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {[
                                        ["BOD (mg/L)", stp.inlet_BOD, stp.outlet_BOD],
                                        ["COD (mg/L)", stp.inlet_COD, stp.outlet_COD],
                                        ["TSS (mg/L)", stp.inlet_TSS, stp.outlet_TSS],
                                        ["pH", stp.inlet_pH, stp.outlet_pH],
                                      ].map(([param, inlet, outlet]) => (
                                        <tr key={String(param)}>
                                          <td className="border border-slate-200 px-1.5 py-1 text-slate-600">{param}</td>
                                          <td className="border border-slate-200 px-1.5 py-1 text-right">{v(inlet as number | null)}</td>
                                          <td className="border border-slate-200 px-1.5 py-1 text-right font-semibold">{v(outlet as number | null)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                  {stp.last_seen && <p className="mt-1 text-[9px] text-slate-400">Last seen: {stp.last_seen}</p>}
                                </div>
                              );
                            })}
                            <div className="mt-1 flex gap-3 text-[10px] text-slate-500">
                              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-green-500" />Outlet BOD ≤30</span>
                              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-orange-400" />≤60</span>
                              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-red-500" />&gt;60</span>
                              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-amber-400" />No data</span>
                            </div>
                          </div>
                        )
                    ) : null}
                  </div>
                ) : null}

                {wantsGroundwaterQuality ? (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                    <p className="mb-2 text-sm font-bold text-slate-900">Groundwater Quality (Nirmal Ganga)</p>
                  
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600">
                      <span className="flex items-center gap-1"><span className="inline-block h-3 w-4 rounded-sm border border-slate-300" style={{ background: "#22c55e" }} /> Excellent (0.8 - 1)</span>
                      <span className="flex items-center gap-1"><span className="inline-block h-3 w-4 rounded-sm border border-slate-300" style={{ background: "#84cc16" }} /> Good (0.6 - 0.8)</span>
                      <span className="flex items-center gap-1"><span className="inline-block h-3 w-4 rounded-sm border border-slate-300" style={{ background: "#facc15" }} /> Moderate (0.4 - 0.6)</span>
                      <span className="flex items-center gap-1"><span className="inline-block h-3 w-4 rounded-sm border border-slate-300" style={{ background: "#f97316" }} /> Poor (0.2 - 0.4)</span>
                      <span className="flex items-center gap-1"><span className="inline-block h-3 w-4 rounded-sm border border-slate-300" style={{ background: "#dc2626" }} /> Critical (0 - 0.2)</span>
                    </div>
                  </div>
                ) : null}
              </div>
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { GeoJSON, MapContainer, TileLayer, useMap, useMapEvents, WMSTileLayer, ZoomControl } from "react-leaflet";
import type { FeatureCollection, StickyNote, BasemapType } from "../../shared/types";
import { BASEMAP_TILES } from "../../shared/types";
import DrainWFSLayer from "../../shared/map-layers/DrainWFSLayer";
import DemSlopeRasterLayer from "../../shared/map-layers/DemSlopeRasterLayer";
import FlowDirectionRasterLayer from "../../shared/map-layers/FlowDirectionRasterLayer";
import NirmalGwqLayer from "../../shared/map-layers/NirmalGwqLayer";
import NirmalRwqLayer from "../../shared/map-layers/NirmalRwqLayer";
import type { RwqSeason } from "../../shared/map-layers/NirmalRwqLayer";
import StpPointLayer from "../../shared/map-layers/StpPointLayer";

/* ── Forces Leaflet to re-measure the container after layout settles ── */
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    let lastW = container.offsetWidth;
    let lastH = container.offsetHeight;

    const invalidate = () => map.invalidateSize(false);

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const w = Math.round(entry.contentRect.width);
      const h = Math.round(entry.contentRect.height);
      if (w !== lastW || h !== lastH) {
        lastW = w;
        lastH = h;
        invalidate();
      }
    });
    ro.observe(container);

    const t = setTimeout(invalidate, 100);

    return () => {
      clearTimeout(t);
      ro.disconnect();
    };
  }, [map]);
  return null;
}

// Re-exported from shared so existing imports of BasemapType/BASEMAP_TILES from this file still work
export type { BasemapType } from "../../shared/types";
export { BASEMAP_TILES } from "../../shared/types";

const INDIA_CENTER: [number, number] = [22.5937, 78.9629];
const INDIA_ZOOM = 5;
const RAINFALL_CLASS_COLORS = {
  c0: "rgba(0, 248, 33, 0.72)", // <900
  c1: "rgba(37,99,235,0.72)", // 900-1000
  c2: "rgba(6,182,212,0.72)", // 1000-1100
  c3: "rgba(245,158,11,0.72)", // 1100-1200
  c4: "rgba(239,68,68,0.72)", // 1200-1300
  c5: "rgba(147,51,234,0.72)", // 1300-1400
  c6: "rgba(240, 0, 208, 0.85)", // >1400
};

const fixedRainfallColor = (value: number) => {
  if (!Number.isFinite(value)) return null;
  if (value < 900) return RAINFALL_CLASS_COLORS.c0;
  if (value < 1000) return RAINFALL_CLASS_COLORS.c1;
  if (value < 1100) return RAINFALL_CLASS_COLORS.c2;
  if (value < 1200) return RAINFALL_CLASS_COLORS.c3;
  if (value < 1300) return RAINFALL_CLASS_COLORS.c4;
  if (value <= 1400) return RAINFALL_CLASS_COLORS.c5;
  return RAINFALL_CLASS_COLORS.c6;
};


function AviralRasterLayer({ tiff }: { tiff: ArrayBuffer | null }) {
  const map = useMap();
  const layerRef = useRef<any>(null);

  useEffect(() => {
    const cleanup = () => {
      if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null; }
    };
    if (!tiff) { cleanup(); return; }
    let cancelled = false;
    const load = async () => {
      cleanup();
      const parseGeoraster: any = await import("georaster").then(m => m.default ?? m);
      const GeoRasterLayer: any = await import("georaster-layer-for-leaflet").then(m => m.default ?? m);
      const georaster: any = await parseGeoraster(tiff.slice(0));
      const nodata = georaster?.noDataValue;
      const layer = new GeoRasterLayer({
        georaster,
        opacity: 0.85,
        resolution: 256,
        pixelValuesToColorFn: (vals: number[]) => {
          const v = vals?.[0];
          if (v === undefined || v === null || !Number.isFinite(v)) return null;
          if (nodata !== undefined && nodata !== null && Math.abs(v - nodata) < 1e-6) return null;
          if (v < 0) return null;
          const t = Math.max(0, Math.min(1, v));
          const r = Math.round(255 * t);
          const g = Math.round(255 * (1 - t));
          return `rgba(${r},${g},60,0.82)`;
        },
      });
      if (!cancelled) { layer.addTo(map); layerRef.current = layer; }
    };
    void load();
    return () => { cancelled = true; cleanup(); };
  }, [tiff, map]);

  return null;
}

function RainfallRasterLayer({
  enabled,
  selectedZones,
  rainfallYear,
  clipApiBase,
}: {
  enabled?: boolean;
  selectedZones: string[];
  rainfallYear?: number | null;
  clipApiBase: string;
}) {
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

    if (!enabled) {
      cleanup();
      return;
    }

    const load = async () => {
      cleanup();
      if (!rainfallYear || !selectedZones.length) return;
      const response = await fetch(`${clipApiBase}/analysis/rainfall-clip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selected_zones: selectedZones,
          year: rainfallYear,
        }),
      });
      if (!response.ok) return;

      const arrayBuffer = await response.arrayBuffer();
      const parseGeorasterModule: any = await import("georaster");
      const georasterLayerModule: any = await import("georaster-layer-for-leaflet");
      const parseGeoraster = parseGeorasterModule.default || parseGeorasterModule;
      const GeoRasterLayer = georasterLayerModule.default || georasterLayerModule;
      const georaster: any = await parseGeoraster(arrayBuffer);
      const nodata = georaster?.noDataValue;

      const layer = new GeoRasterLayer({
        georaster,
        opacity: 0.9,
        resolution: 256,
        pixelValuesToColorFn: (pixelValues: number[]) => {
          const value = pixelValues?.[0];
          if (value === undefined || value === null) return null;
          if (!Number.isFinite(value)) return null;
          if (nodata !== undefined && nodata !== null && Math.abs(value - nodata) < 1e-9) return null;
          if (value < 100) return null;
          return fixedRainfallColor(value);
        },
      });

      if (!cancelled) {
        layer.addTo(map);
        layerRef.current = layer;
      }
    };

    void load();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [enabled, map, selectedZones, rainfallYear, clipApiBase]);

  return null;
}

function FitMapToGeoJSON({ data }: { data: FeatureCollection | null }) {
  const map = useMap();

  useEffect(() => {
    if (!data?.features?.length) {
      map.setView(INDIA_CENTER, INDIA_ZOOM);
      return;
    }
    const layer = L.geoJSON(data as any);
    const bounds = layer.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.2), { padding: [50, 50], maxZoom: 11 });
    }
  }, [data, map]);

  return null;
}

function MapViewBroadcaster({ onViewChange }: { onViewChange?: (center: [number, number], zoom: number) => void }) {
  const map = useMap();

  useEffect(() => {
    if (!onViewChange) return;
    const handler = () => {
      const c = map.getCenter();
      onViewChange([c.lat, c.lng], map.getZoom());
    };
    map.on("moveend", handler);
    map.on("zoomend", handler);
    // Fire once on mount
    handler();
    return () => {
      map.off("moveend", handler);
      map.off("zoomend", handler);
    };
  }, [map, onViewChange]);

  return null;
}

function StickyMapClickHandler({
  enabled,
  onMapClick,
}: {
  enabled: boolean;
  onMapClick?: (lat: number, lng: number) => void;
}) {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    container.style.cursor = enabled ? "crosshair" : "";
    return () => { container.style.cursor = ""; };
  }, [enabled, map]);

  useMapEvents({
    click(event) {
      if (!enabled || !onMapClick) return;
      onMapClick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function hexToRgba(hex: string, alpha: number): string {
  if (!hex || hex === "transparent" || !hex.startsWith("#")) return hex;
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Div-overlay layer — mirrors StickyNotesLayer in SplitMapViewer for identical inline editing */
function StickyNotesOverlay({
  stickyNotes,
  editingStickyNoteId,
  onUpdateStickyNote,
  onOpenStickyEditor,
  onDeleteStickyNote,
  viewerSide,
  screenNames,
}: {
  stickyNotes: StickyNote[];
  editingStickyNoteId?: string | null;
  onUpdateStickyNote?: (id: string, text: string) => void;
  onOpenStickyEditor?: (id: string | null) => void;
  onDeleteStickyNote?: (id: string) => void;
  viewerSide?: string;
  screenNames?: Record<string, string>;
}) {
  const map = useMap();
  const [, forceUpdate] = useState(0);

  const sideToLabel: Record<string, string> = {
    top: screenNames?.top ?? "Screen 1",
    topSecondary: screenNames?.topSecondary ?? "Screen 2",
    left: screenNames?.left ?? "Screen 3",
    right: screenNames?.right ?? "Screen 4",
    bottom: screenNames?.bottom ?? "Main Screen",
    main: screenNames?.bottom ?? "Main Screen",
  };

  useEffect(() => {
    const update = () => forceUpdate((v) => v + 1);
    map.on("move zoom resize", update);
    return () => { map.off("move zoom resize", update); };
  }, [map]);

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 650, pointerEvents: "none" }}>
      {stickyNotes.map((note) => {
        const point = map.latLngToContainerPoint([note.lat, note.lng]);
        const isEditing = editingStickyNoteId === note.id;
        const isOwner = note.ownerSide === (viewerSide || "main");

        const screenLabel =
          viewerSide === "main" && note.ownerSide && note.ownerSide !== "main"
            ? (sideToLabel[note.ownerSide] ?? note.ownerSide)
            : null;

        /* ── TEXT label ── */
        if (note.shape === "text") {
          return (
            <div
              key={note.id}
              style={{
                position: "absolute",
                left: point.x,
                top: point.y,
                transform: "translate(-50%, -50%)",
                pointerEvents: "auto",
              }}
              onClick={(e) => { e.stopPropagation(); onOpenStickyEditor?.(note.id); }}
            >
              {isOwner && onDeleteStickyNote && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDeleteStickyNote(note.id); }}
                  style={{
                    position: "absolute", top: -14, left: -6, zIndex: 70,
                    background: "#ef4444", color: "#fff", border: "1px solid #dc2626",
                    borderRadius: "50%", width: 18, height: 18, fontSize: 10, fontWeight: 900,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                  }}
                  title="Delete"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              )}
              <div style={{ position: "relative", display: "inline-block" }}>
                {isEditing && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onOpenStickyEditor?.(null); }}
                    style={{
                      position: "absolute", top: -8, right: -8, zIndex: 10,
                      background: "rgba(15,23,42,.85)", border: "none", color: "white",
                      borderRadius: "50%", width: 16, height: 16, fontSize: 9, fontWeight: "bold",
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >✕</button>
                )}
                {screenLabel && (
                  <span style={{
                    position: "absolute",
                    bottom: "100%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    marginBottom: 4,
                    fontSize: 8,
                    fontWeight: 800,
                    color: "#fff",
                    background: "rgba(15,23,42,0.85)",
                    borderRadius: 3,
                    padding: "1px 6px",
                    textAlign: "center",
                    letterSpacing: 0.4,
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                    textShadow: "none",
                  }}>
                    {screenLabel}
                  </span>
                )}
                <span
                  style={{
                    display: "block",
                    fontSize: isEditing ? 16 : 14,
                    fontWeight: 700,
                    color: "#1e293b",
                    textShadow: "0 0 4px rgba(255,255,255,0.9), 0 1px 3px rgba(255,255,255,0.7)",
                    background: isEditing ? "rgba(255,255,255,0.78)" : "transparent",
                    padding: isEditing ? "3px 7px" : "1px 3px",
                    borderRadius: 5,
                    border: isEditing ? "2px solid #3b82f6" : "none",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    maxWidth: 180,
                    minWidth: 30,
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  {note.text || (isEditing ? "Start typing…" : "Text")}
                </span>
              </div>
            </div>
          );
        }

        /* ── Sticky / Shape ── */
        return (
          <div
            key={note.id}
            style={{
              position: "absolute",
              left: point.x,
              top: point.y,
              transform: "translate(-50%, -50%)",
              pointerEvents: "auto",
            }}
            onClick={(e) => { e.stopPropagation(); onOpenStickyEditor?.(note.id); }}
          >
            {isOwner && onDeleteStickyNote && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDeleteStickyNote(note.id); }}
                style={{
                  position: "absolute", top: (note.shape === "triangle" ? 18 : -8), left: (note.shape === "triangle" ? 18 : -8), zIndex: 70,
                  background: "#ef4444", color: "#fff", border: "1px solid #dc2626",
                  borderRadius: "50%", width: 22, height: 22, fontSize: 10, fontWeight: 900,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                }}
                title="Delete Marking"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </button>
            )}
            <div
              style={{
                minWidth: isEditing ? 120 : 94,
                minHeight: isEditing ? 120 : 94,
                maxWidth: 150,
                padding: isEditing
                  ? (note.shape === "triangle" ? "32px 12px 10px" : "24px 12px 12px")
                  : (note.shape === "triangle" ? "24px 10px 6px" : 10),
                background: hexToRgba(note.color, 0.5),
                color: "#1e293b",
                borderRadius: note.shape === "oval" ? "50%" : (note.shape === "rect" || note.shape === "rhombus" || note.shape === "triangle" ? 0 : 6),
                border: isEditing ? "3px solid #3b82f6" : "1px solid rgba(15,23,42,0.12)",
                boxShadow: isEditing
                  ? "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1), 0 0 0 4px rgba(59,130,246,0.2)"
                  : "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
                position: "relative",
                clipPath: note.shape === "rhombus"
                  ? "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)"
                  : (note.shape === "triangle" ? "polygon(50% 0%, 0% 100%, 100% 100%)" : "none"),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {isEditing && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onOpenStickyEditor?.(null); }}
                  style={{
                    position: "absolute", top: 2, right: 2,
                    background: "rgba(15,23,42,.85)", border: "none", color: "white",
                    borderRadius: "50%", width: 20, height: 20, fontSize: 10, fontWeight: "bold",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >✕</button>
              )}
              {screenLabel && (
                <div style={{
                  position: "absolute",
                  top: -10,
                  left: "50%",
                  transform: "translateX(-50%)",
                  fontSize: 8,
                  fontWeight: 800,
                  color: "#fff",
                  background: "rgba(15,23,42,0.90)",
                  borderRadius: 3,
                  padding: "1px 6px",
                  letterSpacing: 0.4,
                  whiteSpace: "nowrap",
                  pointerEvents: "none",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.4)",
                  zIndex: 10,
                }}>{screenLabel}</div>
              )}
              <div style={{
                fontSize: isEditing ? 16 : 14,
                lineHeight: 1.2,
                fontWeight: 500,
                textAlign: "center",
                wordBreak: "break-word",
                color: "#1e293b",
              }}>
                {note.text || (isEditing ? "Start typing..." : "Tap to write")}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

type Props = {
  selectedZones: string[];
  zoneOptions?: string[];
  areaGeojson: FeatureCollection | null;
  riversGeojson: FeatureCollection | null;
  basinGeojson: FeatureCollection | null;
  selectedZoneGeojson: FeatureCollection | null;
  analysisResult?: any;
  showRainfallLayer?: boolean;
  showRechargeLayer?: boolean;
  rainfallYear?: number | null;
  clipApiBase: string;
  interactive?: boolean;
  basemap?: BasemapType;
  showBasemap?: boolean;
  borderless?: boolean;
  onViewChange?: (center: [number, number], zoom: number) => void;
  onZoneClick?: (zoneName: string) => void;
  stickyNotes?: StickyNote[];
  editingStickyNoteId?: string | null;
  onUpdateStickyNote?: (id: string, text: string) => void;
  onOpenStickyEditor?: (id: string | null) => void;
  onDeleteStickyNote?: (id: string) => void;
  viewerSide?: string;
  stickyMode?: boolean;
  onStickyMapClick?: (lat: number, lng: number) => void;
  activeCriteria?: string[];
  riverFlowSubbasins?: number[];
  riverFlowGeojson?: any | null;
  riverFlowRecords?: any[];
  industrialGeojson?: any | null;
  gramPanchayatGeojson?: any | null;
  populationGeojson?: any | null;
  rwqSeason?: RwqSeason;
  onStpDataLoaded?: (stps: any[]) => void;
  screenNames?: Record<string, string>;
  stpWmsLayer?: { url: string; layers: string } | null;
  stpAreaWmsLayer?: { url: string; layers: string } | null;
  stpWmsLayers?: { url: string; layers: string }[];
  stpAreaWmsLayers?: { url: string; layers: string }[];
  aviralTiff?: ArrayBuffer | null;
};

export default function AdminMap({
  selectedZones,
  zoneOptions = [],
  areaGeojson,
  riversGeojson,
  basinGeojson,
  selectedZoneGeojson,
  analysisResult,
  showRainfallLayer,
  showRechargeLayer,
  rainfallYear,
  clipApiBase,
  interactive = true,
  basemap,
  showBasemap = true,
  borderless = false,
  onViewChange,
  onZoneClick,
  stickyNotes = [],
  editingStickyNoteId = null,
  onUpdateStickyNote,
  onOpenStickyEditor,
  onDeleteStickyNote,
  viewerSide = "main",
  stickyMode = false,
  onStickyMapClick,
  activeCriteria = [],
  riverFlowSubbasins = [],
  riverFlowGeojson = null,
  riverFlowRecords = [],
  industrialGeojson = null,
  gramPanchayatGeojson = null,
  populationGeojson = null,
  rwqSeason = "monsoon",
  onStpDataLoaded,
  screenNames,
  stpWmsLayer = null,
  stpAreaWmsLayer = null,
  stpWmsLayers = [],
  stpAreaWmsLayers = [],
  aviralTiff = null,
}: Props) {
  const tileConfig = basemap ? BASEMAP_TILES[basemap] : BASEMAP_TILES.streets;

  /* Fetch industrial discharge GeoJSON when criterion is active */
  const [internalIndustrialGeojson, setInternalIndustrialGeojson] = useState<any>(null);
  useEffect(() => {
    if (!activeCriteria.includes("Industrial discharge") || !selectedZones.length) {
      setInternalIndustrialGeojson(null);
      return;
    }
    fetch(`${clipApiBase}/analysis/industrial-discharge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selected_zones: selectedZones }),
    })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setInternalIndustrialGeojson(d?.geojson ?? null))
      .catch(() => setInternalIndustrialGeojson(null));
  }, [activeCriteria, selectedZones, clipApiBase]); // eslint-disable-line react-hooks/exhaustive-deps

  const resolvedIndustrialGeojson = industrialGeojson ?? internalIndustrialGeojson;

  /* Fetch population GeoJSON when criterion is active */
  const [internalPopulationGeojson, setInternalPopulationGeojson] = useState<any>(null);
  useEffect(() => {
    if (!activeCriteria.includes("Population (urban/rural)") || !selectedZones.length) {
      setInternalPopulationGeojson(null); return;
    }
    fetch(`${clipApiBase}/analysis/population`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selected_zones: selectedZones }),
    })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setInternalPopulationGeojson(d?.geojson ?? null))
      .catch(() => setInternalPopulationGeojson(null));
  }, [activeCriteria, selectedZones, clipApiBase]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Fetch gram panchayat GeoJSON when criterion is active */
  const [internalGramPanchayatGeojson, setInternalGramPanchayatGeojson] = useState<any>(null);
  useEffect(() => {
    if (!activeCriteria.includes("Gram Panchayat data") || !selectedZones.length) {
      setInternalGramPanchayatGeojson(null); return;
    }
    fetch(`${clipApiBase}/analysis/gram-panchayat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selected_zones: selectedZones }),
    })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setInternalGramPanchayatGeojson(d?.geojson ?? null))
      .catch(() => setInternalGramPanchayatGeojson(null));
  }, [activeCriteria, selectedZones, clipApiBase]); // eslint-disable-line react-hooks/exhaustive-deps

  const resolvedPopulationGeojson = populationGeojson ?? internalPopulationGeojson;
  const resolvedGramPanchayatGeojson = gramPanchayatGeojson ?? internalGramPanchayatGeojson;

  /* Physical keyboard handler — lets users type directly on a selected note */
  const editingTextRef = useRef("");
  const editedNote = editingStickyNoteId ? stickyNotes.find((n) => n.id === editingStickyNoteId) : null;
  useEffect(() => { editingTextRef.current = editedNote?.text ?? ""; }, [editedNote?.text]);
  useEffect(() => {
    if (!editingStickyNoteId || !onUpdateStickyNote) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const cur = editingTextRef.current;
      let next: string;
      if (e.key === "Backspace") { e.preventDefault(); next = cur.slice(0, -1); }
      else if (e.key === "Enter") { next = cur + "\n"; }
      else if (e.key === " ") { e.preventDefault(); next = cur + " "; }
      else if (e.key.length === 1) { next = cur + e.key; }
      else return;
      editingTextRef.current = next;
      onUpdateStickyNote(editingStickyNoteId, next);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingStickyNoteId, onUpdateStickyNote]);

  const getZoneName = (feature: any) => {
    const props = feature?.properties || {};
    return String(
      props.id_ ??
      props.ID_ ??
      props.zone ??
      props.Zone ??
      props.ZONE ??
      props.area_name ??
      props.Area ??
      props.NAME ??
      "",
    )
      .trim()
      .toUpperCase();
  };

  const zonePalette = useMemo(
    () => ["#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ef4444", "#14b8a6", "#f97316", "#06b6d4", "#84cc16"],
    [],
  );

  const areaStyle = useMemo(
    () => (feature: any) => {
      const props = feature?.properties || {};
      const key = String(props.id_ ?? props.ID_ ?? props.zone ?? props.Zone ?? props.ZONE ?? props.area_name ?? props.Area ?? props.NAME ?? "");
      let hash = 0;
      for (let i = 0; i < key.length; i += 1) {
        hash = (hash << 5) - hash + key.charCodeAt(i);
        hash |= 0;
      }
      const color = zonePalette[Math.abs(hash) % zonePalette.length];
      return {
        color: "#475569",
        weight: 2.1,
        fill: true,
        fillColor: "#000000",
        fillOpacity: 0.01,
      };
    },
    [zonePalette],
  );

  /** Base area layer: only known zone features, excluding currently selected ones */
  const unselectedAreaGeojson = useMemo(() => {
    if (!areaGeojson) return null;
    const selectedUpper = new Set(selectedZones.map((z) => z.trim().toUpperCase()));
    const validUpper = zoneOptions.length
      ? new Set(zoneOptions.map((z) => z.trim().toUpperCase()))
      : null;
    const features = areaGeojson.features.filter((f) => {
      const name = getZoneName(f); // already toUpperCase
      if (!name) return false;
      if (validUpper && !validUpper.has(name)) return false; // skip non-zone features (bounding box etc.)
      return !selectedUpper.has(name);
    });
    return { ...areaGeojson, features };
  }, [areaGeojson, selectedZones, zoneOptions]);

  const basinStyle = useMemo(
    () => ({
      color: "#1d4ed8",
      weight: 2.5,
      dashArray: "8 5",
      fill: false,
      fillOpacity: 0,
    }),
    [],
  );

  const riversGroup1 = useMemo<FeatureCollection | null>(() => {
    if (!riversGeojson?.features?.length) return null;
    return {
      type: "FeatureCollection",
      features: riversGeojson.features.filter((_, idx) => idx % 3 === 0),
    };
  }, [riversGeojson]);

  const riversGroup2 = useMemo<FeatureCollection | null>(() => {
    if (!riversGeojson?.features?.length) return null;
    return {
      type: "FeatureCollection",
      features: riversGeojson.features.filter((_, idx) => idx % 3 === 1),
    };
  }, [riversGeojson]);

  const riversGroup3 = useMemo<FeatureCollection | null>(() => {
    if (!riversGeojson?.features?.length) return null;
    return {
      type: "FeatureCollection",
      features: riversGeojson.features.filter((_, idx) => idx % 3 === 2),
    };
  }, [riversGeojson]);

  const riverStyle1 = useMemo(
    () => ({
      color: "#06b6d4",
      weight: 2.2,
      fill: false,
      fillOpacity: 0,
    }),
    [],
  );

  const riverStyle2 = useMemo(
    () => ({
      color: "#eb8f25",
      weight: 2.2,
      fill: false,
      fillOpacity: 0,
    }),
    [],
  );

  const riverStyle3 = useMemo(
    () => ({
      color: "#22c55e",
      weight: 2.2,
      fill: false,
      fillOpacity: 0,
    }),
    [],
  );

  const rainfallByZone = useMemo(() => {
    const byZone = analysisResult?.rainfall?.by_zone || {};
    const output: Record<string, number> = {};
    Object.entries(byZone).forEach(([zone, rows]: [string, any]) => {
      const latest = [...(rows || [])]
        .filter((r: any) => typeof r?.year === "number")
        .sort((a: any, b: any) => b.year - a.year)[0];
      if (latest && typeof latest.mean === "number" && Number.isFinite(latest.mean)) {
        output[String(zone).trim().toUpperCase()] = latest.mean;
      }
    });
    return output;
  }, [analysisResult]);

  const rainfallRange = useMemo(() => {
    const values = Object.values(rainfallByZone).filter((v) => Number.isFinite(v));
    if (!values.length) return { min: 0, max: 0 };
    return { min: Math.min(...values), max: Math.max(...values) };
  }, [rainfallByZone]);

  const rainfallColor = (value: number) => {
    const { min, max } = rainfallRange;
    if (max <= min) return "#22c55e";
    const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)));
    if (ratio < 0.33) return "#84cc16";
    if (ratio < 0.66) return "#f59e0b";
    return "#ef4444";
  };

  const selectedZoneStyle = useMemo(
    () => (feature: any) => {
      const zoneName = getZoneName(feature);
      const rainfallValue = rainfallByZone[zoneName];
      return {
        color: "#15803d",
        weight: 3.8,
        dashArray: "5 3",
        fill: false,
        fillColor: typeof rainfallValue === "number" ? rainfallColor(rainfallValue) : "#22c55e",
        fillOpacity: 0,
      };
    },
    [rainfallByZone, rainfallRange.min, rainfallRange.max],
  );

  const selectedZoneOnEach = (feature: any, layer: L.Layer) => {
    const zoneName = getZoneName(feature);
    const rainfallValue = rainfallByZone[zoneName];
    const text =
      typeof rainfallValue === "number"
        ? `Zone: ${zoneName} | Rainfall: ${rainfallValue.toFixed(2)}`
        : `Zone: ${zoneName}`;
    (layer as any).bindTooltip(text, { sticky: true, direction: "top", opacity: 0.95 });
  };

  const areaZoneOnEach = (feature: any, layer: L.Layer) => {
    const zoneName = getZoneName(feature);
    if (!zoneName) return;
    (layer as any).bindTooltip(`Zone: ${zoneName}`, {
      sticky: true,
      direction: "top",
      opacity: 0.95,
    });
    if (onZoneClick) {
      (layer as any).on("click", () => onZoneClick(zoneName));
    }
  };

  const rootStyle = borderless
    ? ({
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      minHeight: "100%",
      maxHeight: "100%",
    } as const)
    : undefined;

  return (
    <section
      className={`relative h-full overflow-hidden ${borderless ? '' : 'rounded-xl border-4 border-emerald-500 shadow'} bg-white`}
      style={rootStyle}
    >
      <MapContainer
        center={INDIA_CENTER}
        zoom={INDIA_ZOOM}
        className="h-full w-full"
        style={{ width: "100%", height: "100%", minHeight: "100%", maxHeight: "100%" }}
        zoomControl={false}
        dragging={interactive}
        touchZoom={interactive}
        scrollWheelZoom={interactive}
        doubleClickZoom={interactive}
        boxZoom={interactive}
        keyboard={interactive}
      >
        <MapResizer />
        {showBasemap ? (
          <TileLayer
            key={basemap || "streets"}
            attribution={tileConfig.attribution}
            url={tileConfig.url}
          />
        ) : null}
        {showRechargeLayer ? (
          <WMSTileLayer
            key="recharge-gw-wms"
            url="http://localhost:9090/geoserver/dss_raster/wms"
            params={{
              layers: "dss_raster:recharge_gw",
              format: "image/png",
              transparent: true,
              version: "1.1.0",
            }}
            opacity={0.65}
          />
        ) : null}
        {stpWmsLayer && (
          <WMSTileLayer
            key={`stp-wms-main-${stpWmsLayer.layers}`}
            url={stpWmsLayer.url}
            params={{ layers: stpWmsLayer.layers, format: "image/png", transparent: true, version: "1.1.0" } as any}
            opacity={0.7}
            zIndex={500}
          />
        )}
        {stpAreaWmsLayer && (
          <WMSTileLayer
            key={`stp-area-main-${stpAreaWmsLayer.layers}`}
            url={stpAreaWmsLayer.url}
            params={{ layers: stpAreaWmsLayer.layers, format: "image/png", transparent: true, version: "1.1.0" } as any}
            opacity={0.85}
            zIndex={501}
          />
        )}
        {stpWmsLayers.map((lyr, i) => (
          <WMSTileLayer
            key={`stp-wms-multi-${lyr.layers}-${i}`}
            url={lyr.url}
            params={{ layers: lyr.layers, format: "image/png", transparent: true, version: "1.1.0" } as any}
            opacity={0.7}
            zIndex={500 + i}
          />
        ))}
        {stpAreaWmsLayers.map((lyr, i) => (
          <WMSTileLayer
            key={`stp-area-multi-${lyr.layers}-${i}`}
            url={lyr.url}
            params={{ layers: lyr.layers, format: "image/png", transparent: true, version: "1.1.0" } as any}
            opacity={0.85}
            zIndex={510 + i}
          />
        ))}
        {activeCriteria.includes("River flow") && riverFlowGeojson?.features?.length > 0 && (
          <GeoJSON
            key={`river-flow-geojson-${riverFlowSubbasins.join(",")}`}
            data={riverFlowGeojson}
            style={(feature: any) => {
              const sub = feature?.properties?.Subbasin;
              const records = riverFlowRecords.filter((r: any) => r.Subbasin === sub);
              const avgFlow = records.length
                ? records.reduce((s: number, r: any) => s + (r.flow_in_cm ?? 0), 0) / records.length
                : 0;
              const maxFlow = 1.5;
              const t = Math.min(avgFlow / maxFlow, 1);
              const r = Math.round(29 + (147 - 29) * (1 - t));
              const g = Math.round(78 + (210 - 78) * (1 - t));
              const b = Math.round(216 + (234 - 216) * (1 - t));
              return {
                fillColor: `rgb(${r},${g},${b})`,
                fillOpacity: 0.7,
                color: "#1e3a8a",
                weight: 1.5,
              };
            }}
            onEachFeature={(feature: any, layer: any) => {
              const sub = feature?.properties?.Subbasin;
              const subLabel = feature?.properties?.SUB ?? sub;
              const records = riverFlowRecords.filter((r: any) => r.Subbasin === sub);
              if (!records.length) return;
              const rows = records.map((r: any) =>
                `<tr style="border-bottom:1px solid #e2e8f0">
                  <td style="padding:2px 6px">${r.year}</td>
                  <td style="padding:2px 6px">${r.month}</td>
                  <td style="padding:2px 6px;text-align:right">${r.flow_in_cm?.toFixed(4) ?? "-"}</td>
                  <td style="padding:2px 6px;text-align:right">${r.flow_out_c?.toFixed(4) ?? "-"}</td>
                </tr>`
              ).join("");
              const popup = `
                <div style="font-family:sans-serif;font-size:12px;min-width:240px;max-height:220px;overflow:auto">
                  <div style="font-weight:700;font-size:13px;margin-bottom:4px;color:#1e3a8a">
                    Subbasin ${sub} (${subLabel})
                  </div>
                  <div style="font-size:11px;color:#475569;margin-bottom:4px">
                    Area: <strong>${records[0]?.area_km2?.toFixed(2) ?? "-"} km²</strong>
                  </div>
                  <table style="width:100%;border-collapse:collapse;font-size:11px">
                    <thead>
                      <tr style="background:#dbeafe">
                        <th style="padding:2px 6px;text-align:left">Year</th>
                        <th style="padding:2px 6px;text-align:left">Month</th>
                        <th style="padding:2px 6px;text-align:right">Flow In (cm)</th>
                        <th style="padding:2px 6px;text-align:right">Flow Out (cm)</th>
                      </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                  </table>
                </div>`;
              layer.bindPopup(popup, { maxWidth: 320 });
            }}
          />
        )}
        {activeCriteria.includes("Population (urban/rural)") && resolvedPopulationGeojson?.features?.length > 0 && (
          <GeoJSON
            key={`population-${resolvedPopulationGeojson.features.length}`}
            data={resolvedPopulationGeojson}
            style={(feature: any) => {
              const pop = feature?.properties?.total_population ?? 0;
              const color = pop > 5000 ? "#dc2626" : pop > 2000 ? "#f97316" : pop > 1000 ? "#facc15" : pop > 500 ? "#479fda" : "#86efac";
              return { fillColor: color, fillOpacity: 0.6, color: "#1e293b", weight: 0.8 };
            }}
            onEachFeature={(feature: any, layer: any) => {
              const p = feature?.properties ?? {};
              const pop = p.total_population != null ? p.total_population.toLocaleString() : "—";
              layer.bindTooltip(`${p.village ?? "Village"} — Pop: ${pop}`, { sticky: true, direction: "top", opacity: 0.95 });
              layer.bindPopup(
                `<div style="font-family:sans-serif;font-size:12px;min-width:180px">
                  <div style="font-weight:700;font-size:13px;margin-bottom:5px">${p.village ?? "—"}</div>
                  <table style="width:100%;border-collapse:collapse;font-size:11px">
                    <tr><td style="color:#64748b;padding:2px 4px">Gram Panchayat</td><td style="font-weight:600;padding:2px 4px">${p.gram_panchayat ?? "—"}</td></tr>
                    <tr><td style="color:#64748b;padding:2px 4px">Block</td><td style="font-weight:600;padding:2px 4px">${p.block ?? "—"}</td></tr>
                    <tr><td style="color:#64748b;padding:2px 4px">District</td><td style="font-weight:600;padding:2px 4px">${p.district ?? "—"}</td></tr>
                    <tr><td style="color:#64748b;padding:2px 4px">Zone</td><td style="font-weight:600;padding:2px 4px">${p.zone ?? "—"}</td></tr>
                    <tr><td style="color:#64748b;padding:2px 4px">Urban/Rural</td><td style="font-weight:600;padding:2px 4px">${p.urban_rural ?? "—"}</td></tr>
                    <tr><td style="color:#64748b;padding:2px 4px">Total Population</td><td style="font-weight:600;padding:2px 4px">${p.total_population != null ? p.total_population.toLocaleString() : "—"}</td></tr>
                    <tr><td style="color:#64748b;padding:2px 4px">Male</td><td style="font-weight:600;padding:2px 4px">${p.total_male != null ? p.total_male.toLocaleString() : "—"}</td></tr>
                    <tr><td style="color:#64748b;padding:2px 4px">Female</td><td style="font-weight:600;padding:2px 4px">${p.total_female != null ? p.total_female.toLocaleString() : "—"}</td></tr>
                    <tr><td style="color:#64748b;padding:2px 4px">Households</td><td style="font-weight:600;padding:2px 4px">${p.total_households != null ? p.total_households.toLocaleString() : "—"}</td></tr>
                  </table>
                </div>`,
                { maxWidth: 280 }
              );
            }}
          />
        )}
        {activeCriteria.includes("Gram Panchayat data") && resolvedGramPanchayatGeojson?.features?.length > 0 && (
          <GeoJSON
            key={`gram-panchayat-${resolvedGramPanchayatGeojson.features.length}`}
            data={resolvedGramPanchayatGeojson}
            style={(feature: any) => {
              const zone = (feature?.properties?.zone ?? "").toUpperCase();
              const palette = ["#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ef4444", "#14b8a6", "#f97316", "#06b6d4"];
              let hash = 0;
              for (let i = 0; i < zone.length; i++) { hash = (hash << 5) - hash + zone.charCodeAt(i); hash |= 0; }
              const fill = palette[Math.abs(hash) % palette.length];
              return { fillColor: fill, fillOpacity: 0.45, color: "#1e293b", weight: 1 };
            }}
            onEachFeature={(feature: any, layer: any) => {
              const p = feature?.properties ?? {};
              layer.bindTooltip(p.name ?? "Gram Panchayat", { sticky: true, direction: "top", opacity: 0.95 });
              layer.bindPopup(
                `<div style="font-family:sans-serif;font-size:12px;min-width:160px">
                  <div style="font-weight:700;font-size:13px;margin-bottom:4px">${p.name ?? "—"}</div>
                  <div style="color:#475569;font-size:11px">Zone: <strong>${p.zone ?? "—"}</strong></div>
                  <div style="color:#475569;font-size:11px">Sub-district code: <strong>${p.subdis_cod ?? "—"}</strong></div>
                  <div style="color:#475569;font-size:11px">ID: ${p.id ?? "—"}</div>
                </div>`,
                { maxWidth: 240 }
              );
            }}
          />
        )}
        {activeCriteria.includes("Industrial discharge") && resolvedIndustrialGeojson?.features?.length > 0 && (
          <GeoJSON
            key={`industrial-geojson-${resolvedIndustrialGeojson.features.length}`}
            data={resolvedIndustrialGeojson}
            pointToLayer={(_feature: any, latlng: any) => {
              const cat = (_feature?.properties?.category ?? "").toString().toLowerCase();
              const color = cat === "red" ? "#ef4444" : cat === "orange" ? "#f97316" : "#22c55e";
              const icon = L.divIcon({
                className: "",
                html: `<div style="width:12px;height:12px;background:${color};border:1.5px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.4);"></div>`,
                iconSize: [12, 12],
                iconAnchor: [6, 6],
              });
              return L.marker(latlng, { icon });
            }}
            onEachFeature={(feature: any, layer: any) => {
              const p = feature?.properties ?? {};
              const cat = (p.category ?? "").toString().toLowerCase();
              const dotColor = cat === "red" ? "#ef4444" : cat === "orange" ? "#f97316" : "#22c55e";
              const row = (label: string, val: any) =>
                `<tr><td style="padding:2px 6px;color:#64748b;white-space:nowrap">${label}</td><td style="padding:2px 6px;font-weight:600">${val ?? "—"}</td></tr>`;
              const popup = `
                <div style="font-family:sans-serif;font-size:12px;min-width:220px">
                  <div style="font-weight:700;font-size:13px;margin-bottom:6px;display:flex;align-items:center;gap:6px">
                    <span style="display:inline-block;width:10px;height:10px;background:${dotColor};flex-shrink:0"></span>
                    ${p.name ?? "Industry"}
                  </div>
                  <table style="width:100%;border-collapse:collapse;font-size:11px">
                    ${row("District", p.district)}
                    ${row("Type", p.type_of_industry)}
                    ${row("Category", p.category)}
                    ${row("Pollution Index", p.pollution_index)}
                    ${row("Near River", p.near_river)}
                    ${row("Dist. to River (km)", p.dist_km != null ? Number(p.dist_km).toFixed(2) : null)}
                    ${row("Distance Zone", p.distance_zone)}
                  </table>
                </div>`;
              layer.bindPopup(popup, { maxWidth: 300 });
            }}
          />
        )}
        {(activeCriteria.includes("Tributary & drain flow") || activeCriteria.includes("Drains & discharge points")) && (
          <DrainWFSLayer areaGeojson={areaGeojson} selectedZones={selectedZones} />
        )}
        {activeCriteria.includes("Groundwater quality") && (
          <NirmalGwqLayer enabled={true} selectedZones={selectedZones} clipApiBase={clipApiBase} />
        )}
        {activeCriteria.includes("River water quality") && (
          <NirmalRwqLayer enabled={true} selectedZones={selectedZones} clipApiBase={clipApiBase} season={rwqSeason} />
        )}
        {activeCriteria.includes("STP details") && (
          <StpPointLayer enabled={true} selectedZones={selectedZones} apiBase={clipApiBase} onDataLoaded={onStpDataLoaded} />
        )}
        {activeCriteria.includes("DEM, slope maps") && (
          <>
            <DemSlopeRasterLayer enabled={true} selectedZones={selectedZones} clipApiBase={clipApiBase} dataType="dem" />
            <DemSlopeRasterLayer enabled={true} selectedZones={selectedZones} clipApiBase={clipApiBase} dataType="slope" />
          </>
        )}
        {activeCriteria.includes("Surface flow direction & accumulation maps") && (
          <FlowDirectionRasterLayer enabled={true} selectedZones={selectedZones} clipApiBase={clipApiBase} dataType="direction" />
        )}
        <RainfallRasterLayer enabled={showRainfallLayer} selectedZones={selectedZones} rainfallYear={rainfallYear} clipApiBase={clipApiBase} />
        <AviralRasterLayer tiff={aviralTiff} />
        {interactive ? <ZoomControl position="topright" /> : null}
        {basinGeojson ? <GeoJSON key="basin-boundary" data={basinGeojson as any} style={basinStyle as any} /> : null}
        {riversGroup1 ? <GeoJSON key="rivers-group-1" data={riversGroup1 as any} style={riverStyle1 as any} /> : null}
        {riversGroup2 ? <GeoJSON key="rivers-group-2" data={riversGroup2 as any} style={riverStyle2 as any} /> : null}
        {riversGroup3 ? <GeoJSON key="rivers-group-3" data={riversGroup3 as any} style={riverStyle3 as any} /> : null}
        {unselectedAreaGeojson ? <GeoJSON key={`areas-${selectedZones.join("|")}`} data={unselectedAreaGeojson as any} style={areaStyle as any} onEachFeature={areaZoneOnEach as any} /> : null}
        {selectedZoneGeojson ? (
          <GeoJSON
            key={`selected-zone-${selectedZones.length ? selectedZones.join("|") : "none"}`}
            data={selectedZoneGeojson as any}
            style={selectedZoneStyle as any}
            onEachFeature={selectedZoneOnEach as any}
          />
        ) : null}
        <StickyNotesOverlay
          stickyNotes={stickyNotes}
          editingStickyNoteId={editingStickyNoteId}
          onUpdateStickyNote={onUpdateStickyNote}
          onOpenStickyEditor={onOpenStickyEditor}
          onDeleteStickyNote={onDeleteStickyNote}
          viewerSide={viewerSide}
          screenNames={screenNames}
        />
        <StickyMapClickHandler enabled={stickyMode} onMapClick={onStickyMapClick} />
        <FitMapToGeoJSON data={selectedZoneGeojson || areaGeojson || basinGeojson} />
        <MapViewBroadcaster onViewChange={onViewChange} />
      </MapContainer>
    </section>
  );
}

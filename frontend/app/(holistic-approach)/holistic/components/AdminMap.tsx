import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { GeoJSON, MapContainer, TileLayer, useMap, useMapEvents, WMSTileLayer, ZoomControl } from "react-leaflet";
import { FeatureCollection } from "../types/location";
import type { StickyNote } from "../../../split/components/SplitViewerWindow";
import DrainWFSLayer from "../../../split/components/DrainWFSLayer";
import DemSlopeRasterLayer from "../../../split/components/DemSlopeRasterLayer";

/* ── Forces Leaflet to re-measure the container after layout settles ── */
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    // Fire invalidateSize at multiple intervals to catch any layout shift
    const t1 = setTimeout(() => map.invalidateSize(), 50);
    const t2 = setTimeout(() => map.invalidateSize(), 200);
    const t3 = setTimeout(() => map.invalidateSize(), 500);
    // Also re-measure on any window resize
    const onResize = () => map.invalidateSize();
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener("resize", onResize);
    };
  }, [map]);
  return null;
}

export type BasemapType = "terrain" | "satellite" | "streets" | "dark";

export const BASEMAP_TILES: Record<BasemapType, { url: string; attribution: string }> = {
  terrain: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
  },
  streets: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
  },
};

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

function InvalidateMapSize() {
  const map = useMap();

  useEffect(() => {
    const refresh = () => map.invalidateSize(false);
    refresh();
    const timeoutId = window.setTimeout(refresh, 180);
    window.addEventListener("resize", refresh);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("resize", refresh);
    };
  }, [map]);

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
}: {
  stickyNotes: StickyNote[];
  editingStickyNoteId?: string | null;
  onUpdateStickyNote?: (id: string, text: string) => void;
  onOpenStickyEditor?: (id: string | null) => void;
  onDeleteStickyNote?: (id: string) => void;
  viewerSide?: string;
}) {
  const map = useMap();
  const [version, setVersion] = useState(0);

  const sideToLabel: Record<string, string> = {
    top: "Screen 1",
    topSecondary: "Screen 2",
    left: "Screen 3",
    right: "Screen 4",
    bottom: "Main Screen",
  };

  useEffect(() => {
    const update = () => setVersion((v) => v + 1);
    map.on("move zoom resize", update);
    return () => { map.off("move zoom resize", update); };
  }, [map]);

  return (
    <div
      key={version}
      style={{ position: "absolute", inset: 0, zIndex: 650, pointerEvents: "none" }}
    >
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
};

export default function AdminMap({
  selectedZones,
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
}: Props) {
  const tileConfig = basemap ? BASEMAP_TILES[basemap] : BASEMAP_TILES.streets;

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
        weight: 1.1,
        dashArray: "3 2",
        // Keep visual look as boundary-only, but retain an invisible fill for hover hit-area.
        fill: true,
        fillColor: "#000000",
        fillOpacity: 0.01,
      };
    },
    [zonePalette],
  );

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
        ? `Zone: ${zoneName}<br/>Rainfall (latest year): ${rainfallValue.toFixed(2)}`
        : `Zone: ${zoneName}`;
    (layer as any).bindPopup(text);
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

  return (
    <section className={`relative h-full overflow-hidden ${borderless ? '' : 'rounded-xl border-4 border-emerald-500 shadow'} bg-white`}>
      <MapContainer
        center={INDIA_CENTER}
        zoom={INDIA_ZOOM}
        className="h-full w-full"
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
        {activeCriteria.includes("Tributary & drain flow") && (
          <DrainWFSLayer areaGeojson={areaGeojson} selectedZones={selectedZones} />
        )}
        {activeCriteria.includes("DEM, slope maps") && (
          <>
            <DemSlopeRasterLayer 
              enabled={true} 
              selectedZones={selectedZones} 
              clipApiBase={clipApiBase} 
              dataType="dem" 
            />
            <DemSlopeRasterLayer 
              enabled={true} 
              selectedZones={selectedZones} 
              clipApiBase={clipApiBase} 
              dataType="slope" 
            />
          </>
        )}
        <RainfallRasterLayer enabled={showRainfallLayer} selectedZones={selectedZones} rainfallYear={rainfallYear} clipApiBase={clipApiBase} />
        {interactive ? <ZoomControl position="topright" /> : null}
        {basinGeojson ? <GeoJSON key="basin-boundary" data={basinGeojson as any} style={basinStyle as any} /> : null}
        {riversGroup1 ? <GeoJSON key="rivers-group-1" data={riversGroup1 as any} style={riverStyle1 as any} /> : null}
        {riversGroup2 ? <GeoJSON key="rivers-group-2" data={riversGroup2 as any} style={riverStyle2 as any} /> : null}
        {riversGroup3 ? <GeoJSON key="rivers-group-3" data={riversGroup3 as any} style={riverStyle3 as any} /> : null}
        {areaGeojson ? <GeoJSON key="areas" data={areaGeojson as any} style={areaStyle as any} onEachFeature={areaZoneOnEach as any} /> : null}
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
        />
        <StickyMapClickHandler enabled={stickyMode} onMapClick={onStickyMapClick} />
        <InvalidateMapSize />
        <FitMapToGeoJSON data={selectedZoneGeojson || areaGeojson || basinGeojson} />
        <MapViewBroadcaster onViewChange={onViewChange} />
      </MapContainer>
    </section>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { GeoJSON, MapContainer, TileLayer, WMSTileLayer, useMap, useMapEvents } from "react-leaflet";
import type { STPWmsLayer } from "./STPSuitabilityPanel";
import type { BasemapType, FeatureCollection, StickyNote } from "../../shared/types";
import { BASEMAP_TILES } from "../../shared/types";
import DrainWFSLayer from "../../shared/map-layers/DrainWFSLayer";
import DemSlopeRasterLayer from "../../shared/map-layers/DemSlopeRasterLayer";
import FlowDirectionRasterLayer from "../../shared/map-layers/FlowDirectionRasterLayer";
import NirmalGwqLayer from "../../shared/map-layers/NirmalGwqLayer";
import NirmalRwqLayer from "../../shared/map-layers/NirmalRwqLayer";
import StpPointLayer from "../../shared/map-layers/StpPointLayer";

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

const GEOSERVER_WMS = "http://localhost:9090/geoserver/dss_raster/wms";

/* Rainfall raster — fetches most-recent year automatically */
function ViewerRainfallLayer({ enabled, selectedZones, clipApiBase }: { enabled: boolean; selectedZones: string[]; clipApiBase: string }) {
  const map = useMap();
  const layerRef = useRef<any>(null);
  const zonesKey = selectedZones.join(",");

  useEffect(() => {
    const cleanup = () => { if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null; } };
    if (!enabled || !selectedZones.length) { cleanup(); return; }
    let cancelled = false;

    const load = async () => {
      // Get available years first, use most recent
      let year: number | null = null;
      try {
        const meta = await fetch(`${clipApiBase}/analysis/rainfall`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selected_zones: selectedZones }),
        });
        if (meta.ok) {
          const d = await meta.json();
          const years: number[] = (d?.years ?? []).map(Number).sort((a: number, b: number) => b - a);
          year = years[0] ?? null;
        }
      } catch { /* ignore */ }
      if (!year || cancelled) return;

      const res = await fetch(`${clipApiBase}/analysis/rainfall-clip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selected_zones: selectedZones, year }),
      });
      if (!res.ok || cancelled) return;
      const buf = await res.arrayBuffer();
      if (cancelled) return;
      cleanup();
      const parseGeoraster: any = await import("georaster").then(m => m.default ?? m);
      const GeoRasterLayer: any = await import("georaster-layer-for-leaflet").then(m => m.default ?? m);
      const georaster: any = await parseGeoraster(buf);
      const nodata = georaster?.noDataValue;
      const layer = new GeoRasterLayer({
        georaster, opacity: 0.9, resolution: 256,
        pixelValuesToColorFn: (vals: number[]) => {
          const v = vals?.[0];
          if (v === undefined || v === null || !Number.isFinite(v)) return null;
          if (nodata !== undefined && nodata !== null && Math.abs(v - nodata) < 1e-9) return null;
          if (v < 100) return null;
          const t = Math.min(1, (v - 100) / 1900);
          const r = Math.round(200 - 150 * t);
          const g = Math.round(220 - 100 * t);
          const b = Math.round(255 - 55 * t);
          return `rgba(${r},${g},${b},0.75)`;
        },
      });
      if (!cancelled) { layer.addTo(map); layerRef.current = layer; }
    };
    void load();
    return () => { cancelled = true; cleanup(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, zonesKey, clipApiBase]);

  return null;
}

/* Groundwater recharge — WMS layer from GeoServer */
function ViewerRechargeLayer({ enabled }: { enabled: boolean }) {
  return enabled ? (
    <WMSTileLayer
      key="viewer-recharge-wms"
      url={GEOSERVER_WMS}
      params={{ layers: "dss_raster:recharge_gw", format: "image/png", transparent: true, version: "1.1.0" } as any}
      opacity={0.65}
    />
  ) : null;
}

/* Syncs this mini-map's view to the master map's center & zoom */
function MapViewSync({
  mapView,
  paused = false,
}: {
  mapView: { center: [number, number]; zoom: number } | null;
  paused?: boolean;
}) {
  const map = useMap();
  const initialFitDone = useRef(false);

  useEffect(() => {
    if (!mapView || paused) return;
    if (!initialFitDone.current) {
      initialFitDone.current = true;
    }
    map.setView(mapView.center, mapView.zoom, { animate: false });
  }, [mapView, map, paused]);

  return null;
}

function MapClickHandler({
  stickyMode,
  onMapClick,
  editingStickyNoteId,
  onOpenStickyEditor,
}: {
  stickyMode: boolean;
  onMapClick?: (lat: number, lng: number) => void;
  editingStickyNoteId?: string | null;
  onOpenStickyEditor?: (id: string | null) => void;
}) {
  useMapEvents({
    click(event) {
      if (stickyMode && onMapClick) {
        onMapClick(event.latlng.lat, event.latlng.lng);
      } else if (editingStickyNoteId) {
        onOpenStickyEditor?.(null);
      }
    },
  });

  return null;
}


function MapInteractivity({ interactive }: { interactive: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (interactive) {
      if (map.dragging && !map.dragging.enabled()) map.dragging.enable();
      if (map.touchZoom && !map.touchZoom.enabled()) map.touchZoom.enable();
      if (map.scrollWheelZoom && !map.scrollWheelZoom.enabled()) map.scrollWheelZoom.enable();
      if (map.doubleClickZoom && !map.doubleClickZoom.enabled()) map.doubleClickZoom.enable();
      if (map.boxZoom && !map.boxZoom.enabled()) map.boxZoom.enable();
      if (map.keyboard && !map.keyboard.enabled()) map.keyboard.enable();
    } else {
      if (map.dragging && map.dragging.enabled()) map.dragging.disable();
      if (map.touchZoom && map.touchZoom.enabled()) map.touchZoom.disable();
      if (map.scrollWheelZoom && map.scrollWheelZoom.enabled()) map.scrollWheelZoom.disable();
      if (map.doubleClickZoom && map.doubleClickZoom.enabled()) map.doubleClickZoom.disable();
      if (map.boxZoom && map.boxZoom.enabled()) map.boxZoom.disable();
      if (map.keyboard && map.keyboard.enabled()) map.keyboard.disable();
    }
  }, [interactive, map]);
  return null;
}

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

    const t = window.setTimeout(invalidate, 100);

    return () => {
      window.clearTimeout(t);
      ro.disconnect();
    };
  }, [map]);

  return null;
}

function StickyNotesLayer({
  stickyNotes,
  editingStickyNoteId,
  activeEditors,
  viewerSide,
  onUpdateStickyNote,
  onOpenStickyEditor,
  onDeleteStickyNote,
}: {
  stickyNotes: StickyNote[];
  editingStickyNoteId?: string | null;
  activeEditors?: Record<string, string>;
  viewerSide?: string;
  onUpdateStickyNote?: (id: string, text: string) => void;
  onOpenStickyEditor?: (id: string | null) => void;
  onDeleteStickyNote?: (id: string) => void;
}) {
  const map = useMap();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const update = () => setVersion((prev) => prev + 1);
    map.on("move zoom resize", update);
    return () => {
      map.off("move zoom resize", update);
    };
  }, [map]);

  return (
    <div
      key={version}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 650,
        pointerEvents: "none",
      }}
    >
      {stickyNotes.map((note) => {
        const point = map.latLngToContainerPoint([note.lat, note.lng]);
        const isEditing = editingStickyNoteId === note.id;
        const isLocked = note.ownerSide ? note.ownerSide !== viewerSide : false;

        // ── TEXT label: no background, just the text ─────────────────────
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
              onClick={(event) => {
                event.stopPropagation();
                if (!isLocked) onOpenStickyEditor?.(note.id);
              }}
            >
              {/* Delete button — owner only */}
              {!isLocked && onDeleteStickyNote && (
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
                    outline: "none",
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

        // ── Sticky / Shape ────────────────────────────────────────────────
        const shapeClip = note.shape === "rhombus"
          ? "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)"
          : note.shape === "triangle" ? "polygon(50% 0%, 0% 100%, 100% 100%)" : "none";
        const shapeSize = isEditing ? 120 : 94;

        return (
          <div
            key={note.id}
            style={{
              position: "absolute",
              left: point.x,
              top: point.y,
              transform: "translate(-50%, -50%)",
              pointerEvents: "auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
            onClick={(event) => {
              event.stopPropagation();
              if (!isLocked) onOpenStickyEditor?.(note.id);
            }}
          >
            {/* clipped background shape — purely visual, no children clipped */}
            <div style={{ position: "relative", width: shapeSize, height: shapeSize, maxWidth: 150 }}>
              {/* background fill with clipPath */}
              <div style={{
                position: "absolute", inset: 0,
                background: hexToRgba(note.color, 0.5),
                clipPath: shapeClip,
                borderRadius: note.shape === "oval" ? "50%" : (note.shape === "rect" || note.shape === "rhombus" || note.shape === "triangle" ? 0 : 6),
                boxShadow: isEditing
                  ? "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 0 0 4px rgba(59,130,246,0.2)"
                  : "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                border: isEditing ? "3px solid #3b82f6" : "1px solid rgba(15,23,42,0.12)",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              }} />

              {/* content layer — NOT clipped */}
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                padding: 8,
              }}>
                <div style={{
                  fontSize: isEditing ? 16 : 14,
                  lineHeight: 1.2, fontWeight: 500,
                  textAlign: "center", wordBreak: "break-word",
                  color: "#1e293b",
                }}>
                  {note.text || (isEditing ? "Start typing..." : "Tap to write")}
                </div>
              </div>

              {/* close button */}
              {isEditing && (
                <button
                  type="button"
                  onClick={(event) => { event.stopPropagation(); onOpenStickyEditor?.(null); }}
                  style={{
                    position: "absolute", top: 2, right: 2, zIndex: 10,
                    background: "rgba(15,23,42,.85)", border: "none", color: "white",
                    borderRadius: "50%", width: 20, height: 20, fontSize: 10, fontWeight: "bold",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >✕</button>
              )}

              {/* delete button — owner only */}
              {!isLocked && onDeleteStickyNote && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDeleteStickyNote(note.id); }}
                  style={{
                    position: "absolute",
                    top: note.shape === "triangle" ? 18 : -8,
                    left: note.shape === "triangle" ? 18 : -8,
                    zIndex: 70,
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
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Fixes touch-pan direction for CSS-rotated viewer maps.
 * Leaflet reads touch clientX/Y in screen space but the map container is CSS-rotated,
 * so the raw delta produces wrong-direction panning. We intercept touchmove in the
 * capture phase, compute the geometrically correct panBy arguments, and stop
 * propagation so Leaflet's own drag handler never fires.
 */
function MapDragRotationFix({ angleDeg }: { angleDeg: number }) {
  const map = useMap();

  useEffect(() => {
    if (!angleDeg) return; // 0° = Leaflet default is already correct

    const rad = (angleDeg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    let active = false;
    let startX = 0, startY = 0, lastX = 0, lastY = 0;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      active = true;
      startX = lastX = e.touches[0].clientX;
      startY = lastY = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!active || e.touches.length !== 1) return;
      // Always intercept so Leaflet doesn't also process the event and double-pan
      e.stopPropagation();

      const cx = e.touches[0].clientX;
      const cy = e.touches[0].clientY;
      const dx = cx - lastX;
      const dy = cy - lastY;
      lastX = cx;
      lastY = cy;

      // Below tap threshold — do nothing (let Leaflet fire a click on touchend)
      if (Math.hypot(cx - startX, cy - startY) < 5) return;

      e.preventDefault();
      if (!dx && !dy) return;

      // Correct CSS-rotation pan formula (derived from visual ↔ internal coordinate transform):
      // panBy_x = -dx·cos(θ) - dy·sin(θ)
      // panBy_y =  dx·sin(θ) - dy·cos(θ)
      map.panBy([-dx * cos - dy * sin, dx * sin - dy * cos], { animate: false });
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!active) return;
      active = false;
      const t = e.changedTouches[0];
      // Suppress the spurious click Leaflet would fire after a real drag
      if (Math.hypot(t.clientX - startX, t.clientY - startY) >= 5) {
        e.stopPropagation();
      }
    };

    const onTouchCancel = () => { active = false; };

    const container = map.getContainer();
    container.addEventListener("touchstart",  onTouchStart,  { passive: true,  capture: true });
    container.addEventListener("touchmove",   onTouchMove,   { passive: false, capture: true });
    container.addEventListener("touchend",    onTouchEnd,    { capture: true });
    container.addEventListener("touchcancel", onTouchCancel, { passive: true, capture: true });

    return () => {
      container.removeEventListener("touchstart",  onTouchStart,  true);
      container.removeEventListener("touchmove",   onTouchMove,   true);
      container.removeEventListener("touchend",    onTouchEnd,    true);
      container.removeEventListener("touchcancel", onTouchCancel, true);
    };
  }, [map, angleDeg]);

  return null;
}

/** Convert a hex color to rgba so the sticky note background is translucent but text stays opaque */
function hexToRgba(hex: string, alpha: number): string {
  if (!hex || hex === "transparent" || !hex.startsWith("#")) return hex;
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Mirrors the same property-name fallback used in AdminMap */
function getZoneName(feature: any): string {
  const props = feature?.properties || {};
  return String(
    props.id_ ?? props.ID_ ?? props.zone ?? props.Zone ?? props.ZONE ??
    props.area_name ?? props.Area ?? props.NAME ?? "",
  ).trim().toUpperCase();
}

type Props = {
  basemap: BasemapType;
  showBasemap?: boolean;
  interactive?: boolean;
  pauseSync?: boolean;
  areaGeojson: FeatureCollection | null;
  riversGeojson: FeatureCollection | null;
  basinGeojson: FeatureCollection | null;
  layerState: { basin: boolean; rivers: boolean; area: boolean };
  mapView: { center: [number, number]; zoom: number } | null;
  selectedZones?: string[];
  stickyNotes?: StickyNote[];
  stickyMode?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
  editingStickyNoteId?: string | null;
  activeEditors?: Record<string, string>;
  viewerSide?: string;
  onUpdateStickyNote?: (id: string, text: string) => void;
  onOpenStickyEditor?: (id: string | null) => void;
  onDeleteStickyNote?: (id: string) => void;
  activeCriteria?: string[];
  clipApiBase: string;
  /** CSS rotation angle applied to the viewer container (0, 90, 180, -90). Used to fix touch-pan direction. */
  mapRotation?: number;
  stpWmsLayer?:  STPWmsLayer | null;
  stpAreaLayer?: STPWmsLayer | null;
  aviralTiff?: ArrayBuffer | null;
};

export default function SplitMapViewer({
  basemap,
  showBasemap = true,
  interactive = false,
  pauseSync = false,
  areaGeojson,
  riversGeojson,
  basinGeojson,
  layerState,
  mapView,
  selectedZones = [],
  stickyNotes = [],
  stickyMode = false,
  onMapClick,
  editingStickyNoteId = null,
  activeEditors = {},
  viewerSide,
  onUpdateStickyNote,
  onOpenStickyEditor,
  onDeleteStickyNote,
  activeCriteria = [],
  clipApiBase,
  mapRotation = 0,
  stpWmsLayer  = null,
  stpAreaLayer = null,
  aviralTiff   = null,
}: Props) {
  const tileConfig = BASEMAP_TILES[basemap];

  /* Fetch industrial discharge GeoJSON when criterion is active */
  const [industrialGeojson, setIndustrialGeojson] = useState<any>(null);
  useEffect(() => {
    if (!activeCriteria.includes("Industrial discharge") || !selectedZones.length) {
      setIndustrialGeojson(null); return;
    }
    fetch(`${clipApiBase}/analysis/industrial-discharge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selected_zones: selectedZones }),
    })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setIndustrialGeojson(d?.geojson ?? null))
      .catch(() => setIndustrialGeojson(null));
  }, [activeCriteria, selectedZones, clipApiBase]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Fetch population GeoJSON when criterion is active */
  const [populationGeojson, setPopulationGeojson] = useState<any>(null);
  useEffect(() => {
    if (!activeCriteria.includes("Population (urban/rural)") || !selectedZones.length) {
      setPopulationGeojson(null); return;
    }
    fetch(`${clipApiBase}/analysis/population`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selected_zones: selectedZones }),
    })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setPopulationGeojson(d?.geojson ?? null))
      .catch(() => setPopulationGeojson(null));
  }, [activeCriteria, selectedZones, clipApiBase]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Fetch gram panchayat GeoJSON when criterion is active */
  const [gramPanchayatGeojson, setGramPanchayatGeojson] = useState<any>(null);
  useEffect(() => {
    if (!activeCriteria.includes("Gram Panchayat data") || !selectedZones.length) {
      setGramPanchayatGeojson(null); return;
    }
    fetch(`${clipApiBase}/analysis/gram-panchayat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selected_zones: selectedZones }),
    })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setGramPanchayatGeojson(d?.geojson ?? null))
      .catch(() => setGramPanchayatGeojson(null));
  }, [activeCriteria, selectedZones, clipApiBase]); // eslint-disable-line react-hooks/exhaustive-deps

  const basinStyle = useMemo(
    () => ({ color: "#1d4ed8", weight: 2, dashArray: "6 4", fill: false, fillOpacity: 0 }),
    [],
  );

  const riverStyle = useMemo(
    () => ({ color: "#06b6d4", weight: 1.5, fill: false, fillOpacity: 0 }),
    [],
  );

  const areaStyle = useMemo(
    () => ({
      color: "#475569",
      weight: 1,
      dashArray: "3 2",
      fill: true,
      fillColor: "#000000",
      fillOpacity: 0.01,
    }),
    [],
  );

  /** Amber highlight applied to selected zones */
  const highlightStyle = useMemo(
    () => ({
      color: "#f59e0b",
      weight: 3,
      dashArray: undefined,
      fill: true,
      fillColor: "#fef08a",
      fillOpacity: 0,
    }),
    [],
  );

  /** Filter areaGeojson to only the features matching selectedZones */
  const highlightGeojson = useMemo<FeatureCollection | null>(() => {
    if (!areaGeojson || !selectedZones.length) return null;
    const features = areaGeojson.features.filter(
      (f) => selectedZones.includes(getZoneName(f)),
    );
    if (!features.length) return null;
    return { type: "FeatureCollection", features };
  }, [areaGeojson, selectedZones]);


  const initialCenter = mapView?.center ?? ([22.5937, 78.9629] as [number, number]);
  const initialZoom   = mapView?.zoom ?? 5;

  return (
    <MapContainer
      center={initialCenter}
      zoom={initialZoom}
      className="h-full w-full"
      zoomControl={interactive}
      dragging={interactive}
      touchZoom={interactive}
      scrollWheelZoom={interactive}
      doubleClickZoom={interactive}
      boxZoom={interactive}
      keyboard={interactive}
      attributionControl={false}
    >
      <MapResizer />
      {showBasemap ? <TileLayer key={basemap} url={tileConfig.url} attribution={tileConfig.attribution} /> : null}

      {layerState.basin && basinGeojson ? (
        <GeoJSON key="mini-basin" data={basinGeojson as any} style={basinStyle as any} />
      ) : null}
      {layerState.rivers && riversGeojson ? (
        <GeoJSON key="mini-rivers" data={riversGeojson as any} style={riverStyle as any} />
      ) : null}
      {layerState.area && areaGeojson ? (
        <GeoJSON key="mini-area" data={areaGeojson as any} style={areaStyle as any} />
      ) : null}

      {/* Highlighted selected zones — rendered on top of base area layer */}
      {highlightGeojson ? (
        <GeoJSON
          key={`mini-highlight-${selectedZones.join("|")}`}
          data={highlightGeojson as any}
          style={highlightStyle as any}
        />
      ) : null}

      <ViewerRainfallLayer enabled={activeCriteria.includes("Rainfall & runoff")} selectedZones={selectedZones} clipApiBase={clipApiBase} />
      <ViewerRechargeLayer enabled={activeCriteria.includes("Groundwater recharge")} />

      {/* Drain flow WFS layers — real features filtered to selected zones */}
      {(activeCriteria.includes("Tributary & drain flow") || activeCriteria.includes("Drains & discharge points")) && (
        <DrainWFSLayer areaGeojson={areaGeojson} selectedZones={selectedZones} />
      )}

      {/* Slope/DEM raster with zonal clipping and high-variance coloring */}
      {activeCriteria.includes("DEM, slope maps") && (
        <>
          <DemSlopeRasterLayer enabled={true} selectedZones={selectedZones} clipApiBase={clipApiBase} dataType="dem" />
          <DemSlopeRasterLayer enabled={true} selectedZones={selectedZones} clipApiBase={clipApiBase} dataType="slope" />
        </>
      )}
      {activeCriteria.includes("Surface flow direction & accumulation maps") && (
        <FlowDirectionRasterLayer enabled={true} selectedZones={selectedZones} clipApiBase={clipApiBase} dataType="direction" />
      )}
      {activeCriteria.includes("Groundwater quality") && (
        <NirmalGwqLayer enabled={true} selectedZones={selectedZones} clipApiBase={clipApiBase} />
      )}
      {activeCriteria.includes("River water quality") && (
        <NirmalRwqLayer enabled={true} selectedZones={selectedZones} clipApiBase={clipApiBase} season="monsoon" />
      )}
      {activeCriteria.includes("STP details") && (
        <StpPointLayer enabled={true} selectedZones={selectedZones} apiBase={clipApiBase} />
      )}
      {activeCriteria.includes("Industrial discharge") && industrialGeojson?.features?.length > 0 && (
        <GeoJSON
          key={`viewer-industrial-${industrialGeojson.features.length}`}
          data={industrialGeojson}
          pointToLayer={(_feature: any, latlng: any) => {
            const cat = (_feature?.properties?.category ?? "").toString().toLowerCase();
            const color = cat === "red" ? "#ef4444" : cat === "orange" ? "#f97316" : "#22c55e";
            const icon = L.divIcon({
              className: "",
              html: `<div style="width:11px;height:11px;background:${color};border:1.5px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.4);"></div>`,
              iconSize: [11, 11],
              iconAnchor: [5, 5],
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
              <div style="font-family:sans-serif;font-size:12px;min-width:200px">
                <div style="font-weight:700;font-size:13px;margin-bottom:6px;display:flex;align-items:center;gap:6px">
                  <span style="display:inline-block;width:10px;height:10px;background:${dotColor};flex-shrink:0"></span>
                  ${p.name ?? "Industry"}
                </div>
                <table style="width:100%;border-collapse:collapse;font-size:11px">
                  ${row("Type", p.type_of_industry)}
                  ${row("Category", p.category)}
                  ${row("Dist. to River (km)", p.dist_km != null ? Number(p.dist_km).toFixed(2) : null)}
                </table>
              </div>`;
            layer.bindPopup(popup, { maxWidth: 260 });
          }}
        />
      )}

      {activeCriteria.includes("Population (urban/rural)") && populationGeojson?.features?.length > 0 && (
        <GeoJSON
          key={`viewer-population-${populationGeojson.features.length}`}
          data={populationGeojson}
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

      {activeCriteria.includes("Gram Panchayat data") && gramPanchayatGeojson?.features?.length > 0 && (
        <GeoJSON
          key={`viewer-gram-panchayat-${gramPanchayatGeojson.features.length}`}
          data={gramPanchayatGeojson}
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

      {stpWmsLayer && (
        <WMSTileLayer
          key={`stp-wms-${stpWmsLayer.layers}`}
          url={stpWmsLayer.url}
          params={{ layers: stpWmsLayer.layers, format: "image/png", transparent: true, version: "1.1.0" } as any}
          opacity={0.7}
          zIndex={500}
        />
      )}

      {stpAreaLayer && (
        <WMSTileLayer
          key={`stp-area-${stpAreaLayer.layers}`}
          url={stpAreaLayer.url}
          params={{ layers: stpAreaLayer.layers, format: "image/png", transparent: true, version: "1.1.0" } as any}
          opacity={0.85}
          zIndex={501}
        />
      )}

      <MapClickHandler
        stickyMode={stickyMode}
        onMapClick={onMapClick}
        editingStickyNoteId={editingStickyNoteId}
        onOpenStickyEditor={onOpenStickyEditor}
      />
      <MapViewSync mapView={mapView} paused={pauseSync} />
      <MapInteractivity interactive={interactive} />
      {mapRotation !== 0 && <MapDragRotationFix angleDeg={mapRotation} />}
      <StickyNotesLayer
        stickyNotes={stickyNotes}
        editingStickyNoteId={editingStickyNoteId}
        activeEditors={activeEditors}
        viewerSide={viewerSide}
        onUpdateStickyNote={onUpdateStickyNote}
        onOpenStickyEditor={onOpenStickyEditor}
        onDeleteStickyNote={onDeleteStickyNote}
      />
      {activeCriteria.includes("Combined Output") && <AviralRasterLayer tiff={aviralTiff ?? null} />}
    </MapContainer>
  );
}

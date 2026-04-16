"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GeoJSON, MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import {
  BasemapType,
  BASEMAP_TILES,
} from "../../(holistic-approach)/holistic/components/AdminMap";
import { FeatureCollection } from "../../(holistic-approach)/holistic/types/location";
import { StickyNote } from "./SplitViewerWindow";
import DrainWFSLayer from "./DrainWFSLayer";
import DemSlopeRasterLayer from "./DemSlopeRasterLayer";

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
                  ? "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1), 0 0 0 4px rgba(59, 130, 246, 0.2)"
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
               {isEditing ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenStickyEditor?.(null);
                  }}
                  style={{
                    position: "absolute",
                    top: 2,
                    right: 2,
                    background: "rgba(15,23,42,.85)",
                    border: "none",
                    color: "white",
                    borderRadius: "50%",
                    width: 20,
                    height: 20,
                    fontSize: 10,
                    fontWeight: "bold",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ✕
                </button>
              ) : null}

              {/* Delete button — owner only */}
              {!isLocked && onDeleteStickyNote && (
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
                  minHeight: 70,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  fontSize: 18,
                  lineHeight: 1.2,
                  fontWeight: 500,
                  wordBreak: "break-word",
                }}
              >
                {note.text || (isEditing ? "Start typing..." : "Tap to write")}
              </div>
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
}: Props) {
  const tileConfig = BASEMAP_TILES[basemap];

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
      fillOpacity: 0.38,
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

      {/* Drain flow WFS layers — real features filtered to selected zones */}
      {activeCriteria.includes("Tributary & drain flow") && (
        <DrainWFSLayer areaGeojson={areaGeojson} selectedZones={selectedZones} />
      )}

      {/* Slope/DEM raster with zonal clipping and high-variance coloring */}
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
    </MapContainer>
  );
}

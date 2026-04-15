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

function StickyMapClickHandler({
  enabled,
  onMapClick,
}: {
  enabled: boolean;
  onMapClick?: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(event) {
      if (!enabled || !onMapClick) return;
      onMapClick(event.latlng.lat, event.latlng.lng);
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
}: {
  stickyNotes: StickyNote[];
  editingStickyNoteId?: string | null;
  activeEditors?: Record<string, string>;
  viewerSide?: string;
  onUpdateStickyNote?: (id: string, text: string) => void;
  onOpenStickyEditor?: (id: string | null) => void;
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
                    background: isEditing ? "rgba(255,255,255,0.88)" : "transparent",
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
                background: note.color,
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
  activeCriteria?: string[];
  clipApiBase: string;
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
  activeCriteria = [],
  clipApiBase,
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

      <StickyMapClickHandler enabled={stickyMode} onMapClick={onMapClick} />
      <MapViewSync mapView={mapView} paused={pauseSync} />
      <MapInteractivity interactive={interactive} />
      <StickyNotesLayer
        stickyNotes={stickyNotes}
        editingStickyNoteId={editingStickyNoteId}
        activeEditors={activeEditors}
        viewerSide={viewerSide}
        onUpdateStickyNote={onUpdateStickyNote}
        onOpenStickyEditor={onOpenStickyEditor}
      />
    </MapContainer>
  );
}

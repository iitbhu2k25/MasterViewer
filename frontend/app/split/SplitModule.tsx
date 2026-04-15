"use client";

import "leaflet/dist/leaflet.css";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocationSelection } from "../(holistic-approach)/holistic/hooks/useLocationSelection";
import { BasemapType } from "../(holistic-approach)/holistic/components/AdminMap";
import SplitMasterPanel from "./components/SplitMasterPanel";
import SplitViewerWindow, { type StickyNote, type ViewerMessage } from "./components/SplitViewerWindow";

const AdminMap = dynamic(
  () => import("../(holistic-approach)/holistic/components/AdminMap"),
  { ssr: false },
);

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

export default function SplitModule() {
  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9000";
  const { areaGeojson, riversGeojson, basinGeojson } = useLocationSelection();

  const [layerState] = useState({ basin: true, rivers: true, area: true });
  const [showViewers, setShowViewers] = useState(false);
  const [basemap, setBasemap] = useState<BasemapType>("terrain");
  const [showBasemap, setShowBasemap] = useState(true);
  const [masterCollapsed, setMasterCollapsed] = useState(false);
  const [viewerScale, setViewerScale] = useState(1);
  const [mapView, setMapView] = useState<{ center: [number, number]; zoom: number } | null>(null);
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([]);
  const [activeEditors, setActiveEditors] = useState<Record<string, string>>({});
  const [masterStickyMode, setMasterStickyMode] = useState(false);
  const [masterNoteColor, setMasterNoteColor] = useState("#fde047");
  const [masterNoteShape, setMasterNoteShape] = useState<StickyNote["shape"]>("sticky");
  const [viewerMessages, setViewerMessages] = useState<ViewerMessage[]>([]);
  const [aviralCriteria, setAviralCriteria] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = useCallback((fromSide: string, fromTitle: string, text: string) => {
    const to: "all" | "main" = fromSide === "bottom" ? "all" : "main";
    setViewerMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, text, fromSide, fromTitle, to, timestamp: Date.now() },
    ]);
  }, []);

  // Zone names derived from areaGeojson
  const availableZones = useMemo(() => {
    if (!areaGeojson?.features) return [];
    return Array.from(new Set(
      areaGeojson.features.map(getZoneName).filter(Boolean)
    )).sort();
  }, [areaGeojson]);

  const handleZoneClick = useCallback((zoneName: string) => {
    setSelectedZones((prev) => (prev[0] === zoneName ? [] : [zoneName]));
  }, []);

  const handleMasterZoneToggle = useCallback((zone: string) => {
    setSelectedZones((prev) =>
      prev.includes(zone) ? prev.filter((z) => z !== zone) : [...prev, zone]
    );
  }, []);

  const handleSelectAllZones = useCallback(() => {
    setSelectedZones(availableZones);
  }, [availableZones]);

  const handleClearZones = useCallback(() => {
    setSelectedZones([]);
  }, []);

  const selectedZoneGeojson = useMemo(() => {
    if (!areaGeojson?.features?.length || selectedZones.length === 0) return null;

    const features = areaGeojson.features.filter((feature) => selectedZones.includes(getZoneName(feature)));
    if (!features.length) return null;

    return {
      type: "FeatureCollection" as const,
      features,
    };
  }, [areaGeojson, selectedZones]);

  const handleCreateStickyNote = useCallback((note: Omit<StickyNote, "id">) => {
    const id = `${Date.now()}-${Math.random()}`;
    setStickyNotes((prev) => [
      ...prev,
      { id, ...note },
    ]);
    setActiveEditors((prev) => ({ ...prev, [id]: note.author }));
  }, []);

  const handleUpdateStickyNote = useCallback((id: string, text: string) => {
    setStickyNotes((prev) =>
      prev.map((note) => (note.id === id ? { ...note, text } : note)),
    );
  }, []);

  const handleMasterToolSelect = useCallback((color: string, shape: StickyNote["shape"]) => {
    setMasterNoteColor(color);
    setMasterNoteShape(shape);
    setMasterStickyMode(true);
  }, []);

  const handleMasterMapClick = useCallback((lat: number, lng: number) => {
    if (!masterStickyMode) return;
    const id = `${Date.now()}-${Math.random()}`;
    setStickyNotes((prev) => [
      ...prev,
      { id, author: "Main Screen", ownerSide: "main", text: "", color: masterNoteColor, lat, lng, shape: masterNoteShape },
    ]);
    setActiveEditors((prev) => ({ ...prev, [id]: "main" }));
    setMasterStickyMode(false);
  }, [masterStickyMode, masterNoteColor, masterNoteShape]);

  const handleOpenStickyEditor = useCallback((noteId: string | null, viewerSide: string) => {
    setActiveEditors((prev) => {
      const next = { ...prev };
      if (!noteId) {
        for (const [id, side] of Object.entries(next)) {
          if (side === viewerSide) delete next[id];
        }
      } else {
        if (next[noteId] && next[noteId] !== viewerSide) return prev;
        for (const [id, side] of Object.entries(next)) {
          if (side === viewerSide) delete next[id];
        }
        next[noteId] = viewerSide;
      }
      return next;
    });
  }, []);

  const handleMapViewChange = useCallback((center: [number, number], zoom: number) => {
    setMapView({ center, zoom });
  }, []);

  useEffect(() => {
    document.body.classList.add("holistic-fullscreen-mode");
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }

    return () => {
      document.body.classList.remove("holistic-fullscreen-mode");
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => window.dispatchEvent(new Event("resize")), 200);
    return () => window.clearTimeout(timer);
  }, []);

  // When criteria panel is open viewers expand 20% wider — increase top pair offsets to prevent overlap
  const topPairOffset = aviralCriteria.length > 0 ? 275 : 240;

  const viewerWindows: {
    side: "top" | "topSecondary" | "left" | "right" | "bottom";
    title: string;
    subtitle: string;
    initialOffset?: number;
    isMainScreen: boolean;
  }[] = [
    { side: "top", title: "Screen 1", subtitle: "", initialOffset: -topPairOffset, isMainScreen: false },
    { side: "topSecondary", title: "Screen 2", subtitle: "", initialOffset: topPairOffset, isMainScreen: false },
    { side: "left", title: "Screen 3", subtitle: "", initialOffset: -30, isMainScreen: false },
    { side: "right", title: "Screen 4", subtitle: "", initialOffset: 30, isMainScreen: false },
    { side: "bottom", title: "Main Screen", subtitle: "", initialOffset: 0, isMainScreen: true },
  ];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 h-screen w-screen overflow-hidden bg-[#0a0e1a]"
      style={{ width: "100vw", height: "100dvh" }}
    >
      <div className="absolute right-4 top-4 z-[950]">
        <a
          href="/dashboard"
          className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white backdrop-blur-md ring-1 ring-white/10 transition-all hover:bg-white/20 hover:shadow-lg"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Dashboard
        </a>
      </div>

  

      <div className="absolute inset-0 split-main-map">
        <AdminMap
          selectedZones={selectedZones}
          areaGeojson={layerState.area ? areaGeojson : null}
          riversGeojson={layerState.rivers ? riversGeojson : null}
          basinGeojson={layerState.basin ? basinGeojson : null}
          selectedZoneGeojson={selectedZoneGeojson}
          analysisResult={null}
          showRainfallLayer={false}
          showRechargeLayer={false}
          rainfallYear={null}
          clipApiBase={backendBase}
          interactive={true}
          basemap={basemap}
          showBasemap={showBasemap}
          borderless={true}
          onViewChange={handleMapViewChange}
          onZoneClick={handleZoneClick}
          stickyNotes={stickyNotes}
          editingStickyNoteId={Object.keys(activeEditors).find(id => activeEditors[id] === "main") || null}
          onUpdateStickyNote={handleUpdateStickyNote}
          onOpenStickyEditor={(id) => handleOpenStickyEditor(id, "main")}
          stickyMode={masterStickyMode}
          onStickyMapClick={handleMasterMapClick}
          activeCriteria={aviralCriteria}
        />
      </div>

      {viewerWindows.map((viewer) => (
        <SplitViewerWindow
          key={viewer.side}
          side={viewer.side}
          title={viewer.title}
          subtitle={viewer.subtitle}
          visible={showViewers}
          basemap={basemap}
          showBasemap={showBasemap}
          scale={viewerScale}
          initialOffset={viewer.initialOffset}
          areaGeojson={areaGeojson}
          riversGeojson={riversGeojson}
          basinGeojson={basinGeojson}
          layerState={layerState}
          mapView={mapView}
          selectedZones={selectedZones}
          stickyNotes={stickyNotes}
          onCreateStickyNote={(note) => {
            const id = `${Date.now()}-${Math.random()}`;
            setStickyNotes((prev) => [...prev, { id, ownerSide: viewer.side, ...note }]);
            setActiveEditors((prev) => ({ ...prev, [id]: viewer.side }));
          }}
          activeEditors={activeEditors}
          onUpdateStickyNote={handleUpdateStickyNote}
          onOpenStickyEditor={(id) => handleOpenStickyEditor(id, viewer.side)}
          messages={viewerMessages}
          onSendMessage={(text) => handleSendMessage(viewer.side, viewer.title, text)}
          activeCriteria={aviralCriteria}
          clipApiBase={backendBase}
        />
      ))}

      <SplitMasterPanel
        showViewers={showViewers}
        onToggleViewers={() => setShowViewers((prev) => !prev)}
        basemap={basemap}
        onBasemapChange={setBasemap}
        showBasemap={showBasemap}
        onToggleBasemap={() => setShowBasemap((prev) => !prev)}
        viewerScale={viewerScale}
        onViewerScaleChange={setViewerScale}
        collapsed={masterCollapsed}
        onToggleCollapse={() => setMasterCollapsed((prev) => !prev)}
        stickyMode={masterStickyMode}
        onToolSelect={handleMasterToolSelect}
        onCancelTool={() => setMasterStickyMode(false)}
        zones={availableZones}
        selectedZones={selectedZones}
        onZoneToggle={handleMasterZoneToggle}
        onSelectAllZones={handleSelectAllZones}
        onClearZones={handleClearZones}
        aviralCriteria={aviralCriteria}
        onAviralCriteriaChange={setAviralCriteria}
      />
    </div>
  );
}

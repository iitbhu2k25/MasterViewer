"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BasemapType } from "../../(holistic-approach)/holistic/components/AdminMap";
import type { StickyNote } from "./SplitViewerWindow";

type SplitMasterPanelProps = {
  showViewers: boolean;
  onToggleViewers: () => void;
  basemap: BasemapType;
  onBasemapChange: (basemap: BasemapType) => void;
  showBasemap: boolean;
  onToggleBasemap: () => void;
  viewerScale: number;
  onViewerScaleChange: (scale: number) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  stickyMode?: boolean;
  onToolSelect?: (color: string, shape: StickyNote["shape"]) => void;
  onCancelTool?: () => void;
  zones?: string[];
  selectedZones?: string[];
  onZoneToggle?: (zone: string) => void;
  onSelectAllZones?: () => void;
  onClearZones?: () => void;
  aviralCriteria?: string[];
  onAviralCriteriaChange?: (criteria: string[]) => void;
};

const basemapOptions: { key: BasemapType; label: string; icon: string }[] = [
  { key: "terrain",   label: "Terrain",   icon: "T" },
  { key: "satellite", label: "Satellite", icon: "S" },
  { key: "streets",   label: "Streets",   icon: "R" },
  { key: "dark",      label: "Dark",      icon: "D" },
];

/** Same accent as the bottom viewer for visual consistency */
const ACCENT = "#60a5fa";

export default function SplitMasterPanel({
  showViewers,
  onToggleViewers,
  basemap,
  onBasemapChange,
  showBasemap: _showBasemap,
  onToggleBasemap: _onToggleBasemap,
  viewerScale,
  onViewerScaleChange,
  collapsed,
  onToggleCollapse,
  stickyMode = false,
  onToolSelect,
  onCancelTool,
  zones = [],
  selectedZones = [],
  onZoneToggle,
  onSelectAllZones,
  onClearZones,
  aviralCriteria = [],
  onAviralCriteriaChange,
}: SplitMasterPanelProps) {
  const [showViewerSize, setShowViewerSize] = useState(false);
  const [showBasemapOptions, setShowBasemapOptions] = useState(true);
  const [activeModule, setActiveModule] = useState<"Aviral Ganga" | "Nirmal Ganga">("Aviral Ganga");
  const [showZoneDropdown, setShowZoneDropdown] = useState(false);
  const zoneDropdownRef = useRef<HTMLDivElement>(null);

  // Close zone dropdown when clicking outside
  useEffect(() => {
    if (!showZoneDropdown) return;
    const handler = (e: MouseEvent) => {
      if (zoneDropdownRef.current && !zoneDropdownRef.current.contains(e.target as Node)) {
        setShowZoneDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showZoneDropdown]);

  const AVIRAL_CRITERIA = [
    "Rainfall & runoff",
    "Groundwater recharge",
    "DEM, slope maps",
    "Tributary & drain flow",
  ] as const;

  const allZonesSelected = zones.length > 0 && zones.every((z) => selectedZones.includes(z));
  const [showToolsSection, setShowToolsSection] = useState(false);
  const [toolsSubMenu, setToolsSubMenu] = useState<"none" | "colors" | "shapes">("none");
  const [selectedColor, setSelectedColor] = useState("#fde047");
  const [selectedShape, setSelectedShape] = useState<StickyNote["shape"]>("sticky");

  // Collapse tools panel once placement mode becomes active
  useEffect(() => {
    if (stickyMode) {
      setShowToolsSection(false);
      setToolsSubMenu("none");
    }
  }, [stickyMode]);

  /* X-axis only offset — identical axis logic to the bottom viewer */
  const [offsetX, setOffsetX]   = useState(0);
  const dragging    = useRef(false);
  const dragStartX  = useRef(0);
  const offsetStartX = useRef(0);

  const onDragStart = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("input")) return;
    dragging.current    = true;
    dragStartX.current  = e.clientX;
    offsetStartX.current = offsetX;
    target.setPointerCapture(e.pointerId);
  }, [offsetX]);

  const onDragMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const dx = e.clientX - dragStartX.current;
    setOffsetX(offsetStartX.current + dx);
  }, []);

  const onDragEnd = useCallback(() => { dragging.current = false; }, []);

  return (
    <div
      className="split-master-panel pointer-events-auto absolute bottom-4 left-1/2 z-[940]"
      style={{
        width: collapsed ? "auto" : "min(500px, 66vw)",
        transform: `translateX(calc(-50% + ${offsetX}px))`,
        transition: "width 0.4s ease",
        cursor: "ew-resize",
      }}
      onPointerDown={onDragStart}
      onPointerMove={onDragMove}
      onPointerUp={onDragEnd}
      onPointerCancel={onDragEnd}
    >
      {/* 5-dot drag indicator */}
      <div className="flex justify-center mb-1 pointer-events-none select-none">
        <div className="flex gap-1 opacity-50">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="block h-1 w-1 rounded-full bg-blue-300" />
          ))}
        </div>
      </div>

      {/* Show / Hide Master tab button */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="relative -mb-px rounded-t-xl backdrop-blur-xl transition-all hover:text-white"
          style={{
            background: "rgba(15,23,42,0.95)",
            border: "1.5px solid rgba(96,165,250,0.35)",
            borderBottom: "none",
            boxShadow: "0 0 12px 2px rgba(96,165,250,0.12)",
            padding: "6px 20px",
            fontSize: "10px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "#93c5fd",
          }}
        >
          {collapsed ? "▲ Show Master" : "▼ Hide Master"}
        </button>
      </div>

      {/* ── Panel body ── */}
      <div
        className="overflow-hidden transition-all duration-500 ease-in-out"
        style={{
          maxHeight: collapsed ? "0px" : "400px",
          opacity: collapsed ? 0 : 1,
          background: "rgba(12,17,27,0.93)",
          border: `1.5px solid ${ACCENT}50`,
          borderTop: "none",
          borderRadius: "0 0 16px 16px",
          boxShadow: [
            `0 0 0 1.5px ${ACCENT}18`,
            `0 0 24px 4px ${ACCENT}18`,
            "0 16px 40px rgba(0,0,0,0.75)",
            "inset 0 0 0 1px rgba(255,255,255,0.04)",
          ].join(", "),
          padding: collapsed ? "0 16px" : "10px 16px 12px",
          position: "relative",
        }}
      >
        {/* Right column — Zone selector + Modules + Criteria, absolutely positioned */}
        <div className="absolute top-2.5 right-4 flex flex-col items-end gap-2" style={{ maxWidth: activeModule === "Aviral Ganga" ? 340 : 180 }}>

          {/* ── Zone selector ── */}
          <div className="w-full" ref={zoneDropdownRef}>
            <p className="mb-1 text-right text-[10px] font-semibold uppercase tracking-widest text-blue-400/70">Zone</p>
            {/* Dropdown trigger */}
            <button
              type="button"
              onClick={() => setShowZoneDropdown((p) => !p)}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "rgba(255,255,255,0.07)", border: "1px solid rgba(96,165,250,0.35)",
                borderRadius: 7, padding: "4px 8px", fontSize: 10, color: "#cbd5e1", cursor: "pointer",
              }}
            >
              <span>{selectedZones.length > 0 ? `${selectedZones.length} zone${selectedZones.length > 1 ? "s" : ""} selected` : "Select zones"}</span>
              <span style={{ fontSize: 8, opacity: 0.7 }}>{showZoneDropdown ? "▲" : "▼"}</span>
            </button>

            {/* Dropdown list */}
            {showZoneDropdown && zones.length > 0 && (
              <div style={{
                marginTop: 2, background: "rgba(15,23,42,0.97)", border: "1px solid rgba(96,165,250,0.3)",
                borderRadius: 7, overflow: "hidden",
              }}>
                {/* Select all row */}
                <label style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", borderBottom: "1px solid rgba(96,165,250,0.15)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={allZonesSelected}
                    onChange={() => allZonesSelected ? onClearZones?.() : onSelectAllZones?.()}
                    style={{ accentColor: "#60a5fa", width: 11, height: 11 }}
                  />
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#93c5fd" }}>Select all zones</span>
                </label>
                {/* Scrollable zone list */}
                <div style={{ maxHeight: 110, overflowY: "auto" }}>
                  {zones.map((zone) => (
                    <label key={zone} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={selectedZones.includes(zone)}
                        onChange={() => onZoneToggle?.(zone)}
                        style={{ accentColor: "#60a5fa", width: 11, height: 11 }}
                      />
                      <span style={{ fontSize: 10, color: "#cbd5e1" }}>{zone}</span>
                    </label>
                  ))}
                </div>
                {selectedZones.length > 0 && (
                  <div style={{ padding: "3px 8px 5px", borderTop: "1px solid rgba(96,165,250,0.15)" }}>
                    <span style={{ fontSize: 9, color: "#64748b" }}>Displayed zones: {selectedZones.length}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Modules + Criteria side-by-side ── */}
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start", justifyContent: "flex-end", width: "100%" }}>

            {/* Criteria — left of modules, only when Aviral Ganga active */}
            {activeModule === "Aviral Ganga" && (
              <div style={{ flexShrink: 0 }}>
                <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#60a5fa99" }}>Criteria</p>
                {selectedZones.length === 0 ? (
                  <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(96,165,250,0.15)", borderRadius: 7, padding: "7px 10px", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 9, color: "#64748b", fontStyle: "italic", whiteSpace: "nowrap" }}>Select zones first</span>
                  </div>
                ) : (
                  <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 7, padding: "5px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
                    {AVIRAL_CRITERIA.map((criterion) => (
                      <label key={criterion} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", whiteSpace: "nowrap" }}>
                        <input
                          type="checkbox"
                          checked={aviralCriteria.includes(criterion)}
                          onChange={() => {
                            const next = aviralCriteria.includes(criterion)
                              ? aviralCriteria.filter((c: string) => c !== criterion)
                              : [...aviralCriteria, criterion];
                            onAviralCriteriaChange?.(next);
                          }}
                          style={{ accentColor: "#60a5fa", width: 11, height: 11, flexShrink: 0 }}
                        />
                        <span style={{ fontSize: 10, color: "#cbd5e1" }}>{criterion}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Modules — always on the right */}
            <div style={{ flexShrink: 0 }}>
              <p style={{ margin: "0 0 4px", textAlign: "right", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#60a5fa99" }}>Modules</p>
              <div className="flex flex-col gap-1.5">
                {(["Aviral Ganga", "Nirmal Ganga"] as const).map((moduleName) => (
                  <button
                    key={moduleName}
                    type="button"
                    onClick={() => setActiveModule(moduleName)}
                    className={`rounded-lg px-3 py-2 text-[11px] font-bold transition-all ${
                      activeModule === moduleName
                        ? "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/40"
                        : "bg-white/5 text-slate-300 ring-1 ring-white/5 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {moduleName}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Row 1: Show/Hide screens — compact, no height inflation */}
        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 text-sm font-black text-white shadow-lg shadow-blue-500/30">
            S
          </div>
          <button
            type="button"
            onClick={onToggleViewers}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wide transition-all duration-300 ${
              showViewers
                ? "bg-red-500/20 text-red-200 ring-1 ring-red-500/40 shadow-lg shadow-red-950/30 hover:bg-red-500/30"
                : "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-500/40 shadow-lg shadow-emerald-950/30 hover:bg-emerald-500/30"
            }`}
          >
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full transition-all ${
                showViewers
                  ? "bg-red-400 shadow-lg shadow-red-400/50"
                  : "bg-emerald-400 shadow-lg shadow-emerald-400/50 animate-pulse"
              }`}
            />
            {showViewers ? "Hide Screens" : "Show Screens"}
          </button>
        </div>

        {/* Row 2a: Basemap — own row so height doesn't inflate due to modules */}
        <div className="mb-2">
          <div className="mb-1.5 flex items-center gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-400/70">Basemap</p>
            <button
              type="button"
              onClick={() => setShowBasemapOptions((prev) => !prev)}
              className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-semibold text-white hover:bg-white/20"
            >
              {showBasemapOptions ? "Hide" : "Show"}
            </button>
          </div>
          {showBasemapOptions ? (
            <div className="flex gap-2">
              {basemapOptions.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => onBasemapChange(opt.key)}
                  className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all duration-200 ${
                    basemap === opt.key
                      ? "bg-blue-500/20 text-blue-200 ring-1 ring-blue-400/40 shadow-lg shadow-blue-500/10"
                      : "bg-white/5 text-slate-400 ring-1 ring-white/5 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className="text-base">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>


        {/* Row 3: Viewer size */}
        <div className="mb-2">
          <div className="flex items-center gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-400/70 shrink-0">
              Viewer Size
            </p>
            <button
              type="button"
              onClick={() => setShowViewerSize((p) => !p)}
              className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-semibold text-white hover:bg-white/20 shrink-0"
            >
              {showViewerSize ? "Hide" : "Show"}
            </button>
          </div>
          {showViewerSize ? (
            <div className="mt-3 flex items-center gap-3">
              <input
                type="range"
                min={70}
                max={130}
                step={1}
                value={Math.round(viewerScale * 100)}
                onChange={(e) => onViewerScaleChange(Number(e.target.value) / 100)}
                className="w-[180px] accent-cyan-400"
              />
              <span className="text-[11px] font-bold text-cyan-300 tabular-nums shrink-0">
                {Math.round(viewerScale * 100)}%
              </span>
            </div>
          ) : null}
        </div>

        {/* Row 4: Tools (main map note/shape placement) */}
        <div>
          <div className="flex items-center gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-400/70 shrink-0">
              Tools
            </p>
            <button
              type="button"
              onClick={() => {
                setShowToolsSection((p) => !p);
                setToolsSubMenu("none");
              }}
              className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-semibold text-white hover:bg-white/20 shrink-0"
            >
              {showToolsSection ? "Hide" : "Show"}
            </button>
            {stickyMode && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-emerald-300 animate-pulse">
                  ● Click map to place
                </span>
                <button
                  type="button"
                  onClick={onCancelTool}
                  className="rounded-md bg-red-500/20 px-2 py-1 text-[10px] font-semibold text-red-300 ring-1 ring-red-500/40 hover:bg-red-500/30"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {showToolsSection && !stickyMode ? (
            <div className="mt-2">
              <div
                style={{
                  display: "inline-flex",
                  flexDirection: "column",
                  padding: "6px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(96,165,250,0.2)",
                  gap: 5,
                  width: "fit-content",
                }}
              >
                {/* Icon row: sticky | text | shapes */}
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    title="Sticky Note"
                    onClick={() => setToolsSubMenu(toolsSubMenu === "colors" ? "none" : "colors")}
                    style={{
                      width: 32, height: 32, borderRadius: 7,
                      border: toolsSubMenu === "colors" ? "2px solid #60a5fa" : "1px solid rgba(148,163,184,.4)",
                      background: toolsSubMenu === "colors" ? "rgba(96,165,250,0.18)" : "rgba(255,255,255,0.08)",
                      display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5Z"/>
                      <path d="M15 3v6h6"/>
                    </svg>
                  </button>

                  <button
                    type="button"
                    title="Text label"
                    onClick={() => {
                      setSelectedShape("text");
                      setSelectedColor("transparent");
                      onToolSelect?.("transparent", "text");
                    }}
                    style={{
                      width: 32, height: 32, borderRadius: 7,
                      border: "1px solid rgba(148,163,184,.4)",
                      background: "rgba(255,255,255,0.08)",
                      display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="4 7 4 4 20 4 20 7"/>
                      <line x1="9" y1="20" x2="15" y2="20"/>
                      <line x1="12" y1="4" x2="12" y2="20"/>
                    </svg>
                  </button>

                  <button
                    type="button"
                    title="Shapes"
                    onClick={() => setToolsSubMenu(toolsSubMenu === "shapes" ? "none" : "shapes")}
                    style={{
                      width: 32, height: 32, borderRadius: 7,
                      border: toolsSubMenu === "shapes" ? "2px solid #60a5fa" : "1px solid rgba(148,163,184,.4)",
                      background: toolsSubMenu === "shapes" ? "rgba(96,165,250,0.18)" : "rgba(255,255,255,0.08)",
                      display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="9" height="9"/>
                      <circle cx="17.5" cy="6.5" r="3.5"/>
                      <polygon points="2,22 11,22 6.5,14"/>
                      <polygon points="13,18 22,22 18,13"/>
                    </svg>
                  </button>
                </div>

                {/* Color swatches for sticky note */}
                {toolsSubMenu === "colors" && (
                  <div style={{ display: "flex", gap: 6, paddingLeft: 2 }}>
                    {["#fde047", "#fb7185", "#93c5fd"].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          setSelectedShape("sticky");
                          setSelectedColor(color);
                          onToolSelect?.(color, "sticky");
                        }}
                        style={{
                          width: 24, height: 24, borderRadius: 5,
                          border: selectedColor === color && selectedShape === "sticky"
                            ? "2px solid #fff"
                            : "1px solid rgba(148,163,184,.4)",
                          background: color, cursor: "pointer",
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Shape picker */}
                {toolsSubMenu === "shapes" && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", paddingLeft: 2 }}>
                    {(["rect", "oval", "rhombus", "triangle"] as const).map((shape) => (
                      <button
                        key={shape}
                        type="button"
                        title={shape}
                        onClick={() => {
                          setSelectedShape(shape);
                          setSelectedColor("#ffffff");
                          onToolSelect?.("#ffffff", shape);
                        }}
                        style={{
                          width: 28, height: 28, borderRadius: 5,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          border: selectedShape === shape
                            ? "2px solid #60a5fa"
                            : "1px solid rgba(148,163,184,.4)",
                          background: "rgba(255,255,255,0.08)", cursor: "pointer",
                        }}
                      >
                        {shape === "rect" && <div style={{ width: 14, height: 9, border: "2px solid #93c5fd" }} />}
                        {shape === "oval" && <div style={{ width: 14, height: 9, border: "2px solid #93c5fd", borderRadius: "50%" }} />}
                        {shape === "rhombus" && <div style={{ width: 9, height: 9, border: "2px solid #93c5fd", transform: "rotate(45deg)" }} />}
                        {shape === "triangle" && (
                          <svg width="13" height="11" viewBox="0 0 13 11">
                            <polygon points="6.5,1 12,10 1,10" fill="none" stroke="#93c5fd" strokeWidth="2" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

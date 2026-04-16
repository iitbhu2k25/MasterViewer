"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import { BasemapType } from "../../(holistic-approach)/holistic/components/AdminMap";
import { FeatureCollection } from "../../(holistic-approach)/holistic/types/location";

const SplitMapViewer = dynamic(() => import("./SplitMapViewer"), { ssr: false });
const CriteriaDataPanel = dynamic(() => import("./CriteriaDataPanel"), { ssr: false });
import VirtualKeyboard from "./VirtualKeyboard";

export type StickyNote = {
  id: string;
  author: string;
  /** Side that created this note — used for permanent ownership lock */
  ownerSide: string;
  text: string;
  color: string;
  lat: number;
  lng: number;
  shape?: "sticky" | "rect" | "oval" | "rhombus" | "triangle" | "text";
};

export type ViewerMessage = {
  id: string;
  text: string;
  fromSide: string;
  fromTitle: string;
  /** "all" = sent by main screen → everyone sees it; "main" = sent by other screen → only main sees it */
  to: "all" | "main";
  timestamp: number;
  /** Present when the message is a note-placement notification — enables the Reveal button */
  noteId?: string;
};

export type SplitViewerWindowProps = {
  side: "top" | "topSecondary" | "left" | "right" | "bottom";
  title: string;
  subtitle: string;
  visible: boolean;
  basemap: BasemapType;
  showBasemap?: boolean;
  scale?: number;
  initialOffset?: number;
  areaGeojson: FeatureCollection | null;
  riversGeojson: FeatureCollection | null;
  basinGeojson: FeatureCollection | null;
  layerState: { basin: boolean; rivers: boolean; area: boolean };
  mapView: { center: [number, number]; zoom: number } | null;
  selectedZones?: string[];
  stickyNotes?: StickyNote[];
  onCreateStickyNote?: (note: Omit<StickyNote, "id" | "ownerSide">) => void;
  activeEditors?: Record<string, string>;
  onUpdateStickyNote?: (id: string, text: string) => void;
  onOpenStickyEditor?: (id: string | null) => void;
  messages?: ViewerMessage[];
  onSendMessage?: (text: string) => void;
  activeCriteria?: string[];
  clipApiBase: string;
  /** noteId → list of viewer sides that have opted-in to see that note */
  revealedNotes?: Record<string, string[]>;
  onRevealNote?: (noteId: string) => void;
  onHideNote?: (noteId: string) => void;
  onDeleteStickyNote?: (id: string) => void;
};

const BEZEL_ACCENT = "#5f5099 ";
const PANEL_H = 58;

/** Three distinct sticky-note colors per viewer — no overlap across screens */
const SIDE_COLOR_PALETTES: Record<string, [string, string, string]> = {
  top:          ["#fde047", "#fbbf24", "#fb923c"], // yellows / amber / orange
  topSecondary: ["#fb7185", "#f43f5e", "#fda4af"], // pinks / rose / red
  left:         ["#93c5fd", "#60a5fa", "#38bdf8"], // blues / sky
  right:        ["#86efac", "#4ade80", "#34d399"], // greens / emerald
  bottom:       ["#c4b5fd", "#a78bfa", "#f0abfc"], // purples / violet
};

const sideConfig: Record<
  string,
  {
    axis: "x" | "y";
    size: { w: number; h: number };
    rotation: string;
    getHiddenStyle: (offset: number) => CSSProperties;
    getVisibleStyle: (offset: number) => CSSProperties;
    clampOffset: (offset: number, viewportW: number, viewportH: number, w: number, h: number) => number;
  }
> = {
  top: {
    axis: "x",
    size: { w: 420, h: 340 },
    rotation: "rotate(180deg)",
    getHiddenStyle: (offset) => ({
      top: 0,
      left: "50%",
      transform: `translateX(calc(-50% + ${offset}px)) translateY(-110%)`,
    }),
    getVisibleStyle: (offset) => ({
      top: 0,
      left: "50%",
      transform: `translateX(calc(-50% + ${offset}px)) translateY(14px)`,
    }),
    clampOffset: (_o, vw, _vh, w) => {
      const half = vw / 2 - w / 2;
      return Math.max(-half, Math.min(half, _o));
    },
  },
  topSecondary: {
    axis: "x",
    size: { w: 420, h: 340 },
    rotation: "rotate(180deg)",
    getHiddenStyle: (offset) => ({
      top: 0,
      left: "50%",
      transform: `translateX(calc(-50% + ${offset}px)) translateY(-110%)`,
    }),
    getVisibleStyle: (offset) => ({
      top: 0,
      left: "50%",
      transform: `translateX(calc(-50% + ${offset}px)) translateY(14px)`,
    }),
    clampOffset: (_o, vw, _vh, w) => {
      const half = vw / 2 - w / 2;
      return Math.max(-half, Math.min(half, _o));
    },
  },
  bottom: {
    axis: "x",
    size: { w: 420, h: 340 },
    rotation: "rotate(0deg)",
    getHiddenStyle: (offset) => ({
      bottom: 0,
      left: "50%",
      transform: `translateX(calc(-50% + ${offset}px)) translateY(115%)`,
    }),
    getVisibleStyle: (offset) => ({
      bottom: 0,
      left: "50%",
      transform: `translateX(calc(-50% + ${offset}px)) translateY(-14px)`,
    }),
    clampOffset: (_o, vw, _vh, w) => {
      const half = vw / 2 - w / 2;
      return Math.max(-half, Math.min(half, _o));
    },
  },
  left: {
    axis: "y",
    size: { w: 380, h: 380 },
    rotation: "rotate(90deg)",
    getHiddenStyle: (offset) => ({
      left: 0,
      top: "50%",
      transform: `translateY(calc(-50% + ${offset}px)) translateX(-112%)`,
    }),
    getVisibleStyle: (offset) => ({
      left: 0,
      top: "50%",
      transform: `translateY(calc(-50% + ${offset}px)) translateX(14px)`,
    }),
    clampOffset: (_o, _vw, vh, _w, h) => {
      const half = vh / 2 - h / 2;
      return Math.max(-half, Math.min(half, _o));
    },
  },
  right: {
    axis: "y",
    size: { w: 380, h: 380 },
    rotation: "rotate(-90deg)",
    getHiddenStyle: (offset) => ({
      right: 0,
      top: "50%",
      transform: `translateY(calc(-50% + ${offset}px)) translateX(112%)`,
    }),
    getVisibleStyle: (offset) => ({
      right: 0,
      top: "50%",
      transform: `translateY(calc(-50% + ${offset}px)) translateX(-14px)`,
    }),
    clampOffset: (_o, _vw, vh, _w, h) => {
      const half = vh / 2 - h / 2;
      return Math.max(-half, Math.min(half, _o));
    },
  },
};

export default function SplitViewerWindow({
  side,
  title,
  visible,
  basemap,
  showBasemap = true,
  scale = 1,
  initialOffset = 0,
  areaGeojson,
  riversGeojson,
  basinGeojson,
  layerState,
  mapView,
  selectedZones = [],
  stickyNotes = [],
  onCreateStickyNote,
  activeEditors = {},
  onUpdateStickyNote,
  onOpenStickyEditor,
  messages = [],
  onSendMessage,
  activeCriteria = [],
  clipApiBase,
  revealedNotes = {},
  onRevealNote,
  onHideNote,
  onDeleteStickyNote,
}: SplitViewerWindowProps) {
  const cfg = sideConfig[side];
  // Extract the rotation angle from the CSS string e.g. "rotate(-90deg)" → -90
  const rotationAngle = parseInt(cfg.rotation.match(/-?\d+/)?.[0] ?? "0", 10);
  const effectiveW = activeCriteria.length > 0 ? Math.round(cfg.size.w * 1.2) : cfg.size.w;
  // Use actual pixel dimensions (not CSS scale) so Leaflet renders tiles at full resolution → no blur
  const scaledW = Math.round(effectiveW * scale);
  const scaledH = Math.round(cfg.size.h * scale);
  const [offset, setOffset] = useState(initialOffset);
  const [criteriaWidth, setCriteriaWidth] = useState(160);
  const criteriaDragRef = useRef<{ startX: number; startW: number } | null>(null);
  const [msgInput, setMsgInput] = useState("");
  const [showMsgKeyboard, setShowMsgKeyboard] = useState(false);
  const msgEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll message list to bottom whenever a new message arrives
  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  const editingStickyNoteId = Object.keys(activeEditors).find((id) => activeEditors[id] === side) || null;
  const editedNote = editingStickyNoteId ? stickyNotes.find((n) => n.id === editingStickyNoteId) : null;
  const [noteColor, setNoteColor] = useState(() => (SIDE_COLOR_PALETTES[side] ?? SIDE_COLOR_PALETTES.top)[0]);
  const [noteShape, setNoteShape] = useState<StickyNote['shape']>('sticky');
  const [stickyMode, setStickyMode] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState<'none' | 'colors' | 'shapes'>('none');
  const dragging = useRef(false);
  const dragStart = useRef(0);
  const offsetStart = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const msgKeyboardRef = useRef<HTMLDivElement>(null);
  const stickyKeyboardRef = useRef<HTMLDivElement>(null);
  const msgInputRef = useRef<HTMLInputElement>(null);
  const editingTextRef = useRef("");

  useEffect(() => {
    const handleClickOutside = (e: PointerEvent) => {
      const target = e.target as HTMLElement;

      // 1. Tools Menu Click Outside
      if (showToolsMenu && toolsMenuRef.current && !toolsMenuRef.current.contains(target)) {
        // If target is the toggle button, let the button's own onClick handle it
        const toggleBtn = panelRef.current?.querySelector('[title="Tools Menu"]');
        if (!toggleBtn || !toggleBtn.contains(target)) {
          setShowToolsMenu(false);
          setActiveSubMenu("none");
          setStickyMode(false);
        }
      }

      // 2. Message Keyboard Click Outside
      if (showMsgKeyboard && msgKeyboardRef.current && !msgKeyboardRef.current.contains(target)) {
        if (msgInputRef.current && !msgInputRef.current.contains(target)) {
          setShowMsgKeyboard(false);
        }
      }

      // 3. Sticky Note Editor Click Outside (Bezel/Panels)
      // Map clicks are handled by MapClickHandler in SplitMapViewer.
      if (editingStickyNoteId && stickyKeyboardRef.current && !stickyKeyboardRef.current.contains(target)) {
        const mapContainer = panelRef.current?.querySelector(".leaflet-container");
        const isOutsideMap = !mapContainer || !mapContainer.contains(target);
        if (isOutsideMap) {
          onOpenStickyEditor?.(null);
        }
      }
    };

    window.addEventListener("pointerdown", handleClickOutside, { capture: true });
    return () => window.removeEventListener("pointerdown", handleClickOutside, { capture: true });
  }, [showToolsMenu, showMsgKeyboard, editingStickyNoteId, onOpenStickyEditor]);


  useEffect(() => {
    setOffset(initialOffset);
  }, [initialOffset]);

  // Keep editingTextRef in sync with the current note text
  useEffect(() => {
    editingTextRef.current = editedNote?.text ?? "";
  }, [editedNote?.text]);

  // Physical keyboard support while a note is being edited — Main Screen only
  useEffect(() => {
    if (side !== "bottom") return;        // other screens: virtual keyboard only
    if (!editingStickyNoteId || !onUpdateStickyNote) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Let browser handle input/textarea elements normally
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const cur = editingTextRef.current;
      let next: string;

      if (e.key === "Backspace") {
        e.preventDefault();
        next = cur.slice(0, -1);
      } else if (e.key === "Enter") {
        next = cur + "\n";
      } else if (e.key === " ") {
        e.preventDefault();
        next = cur + " ";
      } else if (e.key.length === 1) {
        next = cur + e.key;
      } else {
        return;
      }

      editingTextRef.current = next;
      onUpdateStickyNote(editingStickyNoteId, next);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [side, editingStickyNoteId, onUpdateStickyNote]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!panelRef.current) return;
      dragging.current = true;
      dragStart.current = cfg.axis === "x" ? e.clientX : e.clientY;
      offsetStart.current = offset;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [cfg.axis, offset],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      const delta = cfg.axis === "x" ? e.clientX - dragStart.current : e.clientY - dragStart.current;
      const raw = offsetStart.current + delta;
      const clamped = cfg.clampOffset(raw, window.innerWidth, window.innerHeight, scaledW, scaledH);
      setOffset(clamped);
    },
    [cfg, scaledW, scaledH],
  );

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const handleMapNotePlacement = useCallback(
    (lat: number, lng: number) => {
      if (!stickyMode || !onCreateStickyNote) return;

      onCreateStickyNote({
        author: title,
        text: "",
        color: noteColor,
        lat,
        lng,
        shape: noteShape,
      });

      setStickyMode(false);
      setShowToolsMenu(false);
      setActiveSubMenu('none');
    },
    [stickyMode, onCreateStickyNote, title, noteColor, noteShape],
  );

  const stickyToolActive = showToolsMenu || stickyMode || !!editingStickyNoteId;

  /**
   * Notes visible on THIS viewer:
   * Each viewer only sees notes it placed itself, plus any notes it has revealed.
   * The central AdminMap (not this viewer) always shows all notes.
   */
  const visibleNotes = useMemo(() => {
    return stickyNotes.filter(
      (n) => n.ownerSide === side || (revealedNotes[n.id]?.includes(side) ?? false),
    );
  }, [stickyNotes, side, revealedNotes]);

  // When scale changes, tell Leaflet to recompute its container size
  useEffect(() => {
    const t = window.setTimeout(() => window.dispatchEvent(new Event("resize")), 150);
    return () => window.clearTimeout(t);
  }, [scale]);

  const dragCursor = cfg.axis === "x" ? "ew-resize" : "ns-resize";
  const posStyle = visible ? cfg.getVisibleStyle(offset) : cfg.getHiddenStyle(offset);

  return (
    <div
      ref={panelRef}
      className="split-viewer-panel absolute z-[920] pointer-events-auto"
      style={{
        width: scaledW,
        height: scaledH,
        ...posStyle,
        opacity: visible ? 1 : 0,
        transition: dragging.current
          ? "opacity 0.3s ease"
          : "transform 0.5s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s ease",
      }}
    >
      <div
        className="relative flex h-full w-full flex-col overflow-hidden"
        style={{
          transform: cfg.rotation,
          transformOrigin: "center center",
          background: BEZEL_ACCENT,
          borderRadius: "18px",
          border: `8px solid ${BEZEL_ACCENT}`,
          boxShadow: [
            `0 0 0 1.5px ${BEZEL_ACCENT}cc`,
            `0 0 28px 8px ${BEZEL_ACCENT}40`,
            "0 20px 56px rgba(0,0,0,0.80)",
            "inset 0 0 0 1px rgba(255,255,255,0.08)",
          ].join(", "),
        }}
      >
        <div
          className="flex shrink-0 items-center justify-between select-none"
          style={{
            height: "44px",
            padding: "0 10px",
            cursor: dragCursor,
            background: BEZEL_ACCENT,
            zIndex: 20,
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <span
            style={{
              color: "#ffffff",
              fontWeight: 800,
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.13em",
              userSelect: "none",
            }}
          >
            {title}
          </span>
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onPointerMove={(event) => event.stopPropagation()}
            onPointerUp={(event) => event.stopPropagation()}
            onClick={() => {
              setShowToolsMenu((prev) => {
                const next = !prev;
                if (!next) {
                  setStickyMode(false);
                  setActiveSubMenu("none");
                }
                return next;
              });
            }}
            style={{
              display: "flex",
              gap: 4,
              opacity: 0.9,
              cursor: "pointer",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "none",
              padding: "10px 8px",
              margin: "-10px -8px",
            }}
            title="Tools Menu"
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{ display: "block", width: 5, height: 5, borderRadius: "50%", background: "#fff" }}
              />
            ))}
          </button>
        </div>

        <div className="flex flex-col overflow-hidden" style={{ flex: 1, minHeight: 0, borderRadius: "0 0 10px 10px" }}>
          <div style={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden" }}>
            <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
            <div
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                zIndex: 700,
                display: "flex",
                alignItems: "center",
                gap: 8,
                pointerEvents: "auto",
              }}
            >
              {showToolsMenu ? (
                <div
                  ref={toolsMenuRef}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    width: 132,
                    padding: "6px",
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.98)",
                    boxShadow: "0 12px 28px rgba(15,23,42,.22)",
                    border: "1px solid rgba(148,163,184,.35)",
                    gap: 5,
                  }}
                >
                  {/* Icon row: sticky | text | shapes */}
                  <div style={{ display: "flex", justifyContent: "space-around", gap: 4 }}>
                    {/* Sticky Note icon — opens this screen's 3 unique color swatches */}
                    <button
                      type="button"
                      title="Sticky Note"
                      onClick={() => setActiveSubMenu(activeSubMenu === "colors" ? "none" : "colors")}
                      style={{
                        width: 38, height: 38, borderRadius: 9,
                        border: activeSubMenu === "colors" ? "2px solid #3b82f6" : "1px solid #cbd5e1",
                        background: activeSubMenu === "colors" ? "#eff6ff" : "#f8fafc",
                        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5Z"/>
                        <path d="M15 3v6h6"/>
                      </svg>
                    </button>

                    {/* Text icon */}
                    <button
                      type="button"
                      title="Text"
                      onClick={() => {
                        setNoteShape("text");
                        setNoteColor("transparent");
                        setStickyMode(true);
                        setShowToolsMenu(false);
                        setActiveSubMenu("none");
                      }}
                      style={{
                        width: 38, height: 38, borderRadius: 9, border: "1px solid #cbd5e1",
                        background: "#f8fafc",
                        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="4 7 4 4 20 4 20 7"/>
                        <line x1="9" y1="20" x2="15" y2="20"/>
                        <line x1="12" y1="4" x2="12" y2="20"/>
                      </svg>
                    </button>

                    {/* Shapes icon */}
                    <button
                      type="button"
                      title="Shapes"
                      onClick={() => setActiveSubMenu(activeSubMenu === "shapes" ? "none" : "shapes")}
                      style={{
                        width: 38, height: 38, borderRadius: 9, border: activeSubMenu === "shapes" ? "2px solid #3b82f6" : "1px solid #cbd5e1",
                        background: activeSubMenu === "shapes" ? "#eff6ff" : "#f8fafc",
                        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="9" height="9"/>
                        <circle cx="17.5" cy="6.5" r="3.5"/>
                        <polygon points="2,22 11,22 6.5,14"/>
                        <polygon points="13,18 22,22 18,13"/>
                      </svg>
                    </button>
                  </div>

                  {/* Color swatches — 3 colors unique to this screen */}
                  {activeSubMenu === "colors" && (
                    <div style={{ display: "flex", justifyContent: "space-around", padding: "2px 2px 0" }}>
                      {(SIDE_COLOR_PALETTES[side] ?? SIDE_COLOR_PALETTES.top).map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => {
                            setNoteShape("sticky");
                            setNoteColor(color);
                            setStickyMode(true);
                            setShowToolsMenu(false);
                            setActiveSubMenu("none");
                          }}
                          style={{
                            width: 34, height: 34, borderRadius: 8,
                            border: noteColor === color && noteShape === "sticky" ? "2px solid #0f172a" : "1px solid #cbd5e1",
                            background: color, cursor: "pointer",
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Shape picker */}
                  {activeSubMenu === "shapes" && (
                    <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 4, padding: "2px 2px 0" }}>
                      {(["rect", "oval", "rhombus", "triangle"] as const).map((shape) => (
                        <button
                          key={shape}
                          type="button"
                          title={shape}
                          onClick={() => {
                            setNoteShape(shape);
                            setNoteColor("#ffffff");
                            setStickyMode(true);
                            setShowToolsMenu(false);
                            setActiveSubMenu("none");
                          }}
                          style={{
                            width: 34, height: 34, borderRadius: 8,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            border: noteShape === shape ? "2px solid #3b82f6" : "1px solid #cbd5e1",
                            background: "#f1f5f9", cursor: "pointer",
                          }}
                        >
                          {shape === "rect" && <div style={{ width: 14, height: 9, border: "2px solid #475569" }} />}
                          {shape === "oval" && <div style={{ width: 14, height: 9, border: "2px solid #475569", borderRadius: "50%" }} />}
                          {shape === "rhombus" && <div style={{ width: 9, height: 9, border: "2px solid #475569", transform: "rotate(45deg)" }} />}
                          {shape === "triangle" && (
                            <svg width="13" height="11" viewBox="0 0 13 11">
                              <polygon points="6.5,1 12,10 1,10" fill="none" stroke="#475569" strokeWidth="2" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
            {visible ? (
              <SplitMapViewer
                basemap={basemap}
                showBasemap={showBasemap}
                interactive={true}
                pauseSync={stickyToolActive}
                areaGeojson={areaGeojson}
                riversGeojson={riversGeojson}
                basinGeojson={basinGeojson}
                layerState={layerState}
                mapView={mapView}
                selectedZones={selectedZones}
                stickyNotes={visibleNotes}
                stickyMode={stickyMode}
                onMapClick={handleMapNotePlacement}
                editingStickyNoteId={editingStickyNoteId}
                onUpdateStickyNote={onUpdateStickyNote}
                onOpenStickyEditor={onOpenStickyEditor}
                onDeleteStickyNote={onDeleteStickyNote}
                activeEditors={activeEditors || {}}
                viewerSide={side}
                activeCriteria={activeCriteria}
                clipApiBase={clipApiBase}
                mapRotation={rotationAngle}
              />
            ) : null}
            {editedNote && onUpdateStickyNote && editingStickyNoteId ? (
              <div ref={stickyKeyboardRef} className="absolute inset-0 pointer-events-none z-[9999]" style={{ transform: "none" }}>
                <VirtualKeyboard
                  value={editedNote.text}
                  onChange={(val) => onUpdateStickyNote(editingStickyNoteId, val)}
                />
              </div>
            ) : null}
            {/* Message keyboard — all screens */}
            {showMsgKeyboard ? (
              <div ref={msgKeyboardRef} className="absolute inset-0 pointer-events-none z-[9999]" style={{ transform: "none" }}>
                <VirtualKeyboard
                  value={msgInput}
                  onChange={(val) => {
                    // {enter} appends \n — treat that as Send
                    if (val.endsWith("\n")) {
                      const text = val.trimEnd();
                      if (text) { onSendMessage?.(text); }
                      setMsgInput("");
                      setShowMsgKeyboard(false);
                    } else {
                      setMsgInput(val);
                    }
                  }}
                />
              </div>
            ) : null}
            </div>
            {activeCriteria.length > 0 && (
              <>
                {/* Draggable divider — 18px hit area, 5px visual bar */}
                <div
                  style={{ width: 18, flexShrink: 0, cursor: "col-resize", position: "relative", zIndex: 10 }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    criteriaDragRef.current = { startX: e.clientX, startW: criteriaWidth };
                    (e.target as HTMLElement).setPointerCapture(e.pointerId);
                  }}
                  onPointerMove={(e) => {
                    if (!criteriaDragRef.current) return;
                    e.stopPropagation();
                    const dx = criteriaDragRef.current.startX - e.clientX;
                    setCriteriaWidth(Math.max(90, Math.min(effectiveW - 80, criteriaDragRef.current.startW + dx)));
                  }}
                  onPointerUp={(e) => { e.stopPropagation(); criteriaDragRef.current = null; }}
                  onPointerCancel={() => { criteriaDragRef.current = null; }}
                >
                  <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", top: 0, bottom: 0, width: 5, background: "#bfdbfe" }} />
                </div>
                <div style={{ width: criteriaWidth, flexShrink: 0, overflow: "hidden" }}>
                  <CriteriaDataPanel activeCriteria={activeCriteria} selectedZones={selectedZones} />
                </div>
              </>
            )}
          </div>

          {/* ── Messaging panel — left: send | right: received ── */}
          <div
            className="shrink-0"
            style={{
              height: PANEL_H,
              background: "#f0f6ff",
              borderTop: `2px solid ${BEZEL_ACCENT}`,
              display: "flex",
              gap: 0,
            }}
          >
            {/* LEFT — Send */}
            <div style={{ flex: "0 0 50%", display: "flex", alignItems: "center", padding: "5px 6px", borderRight: "1px solid #bfdbfe", gap: 4 }}>
              <input
                ref={msgInputRef}
                type="text"
                value={msgInput}
                onChange={(e) => setMsgInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && msgInput.trim()) {
                    onSendMessage?.(msgInput.trim());
                    setMsgInput("");
                  }
                }}
                placeholder="Type message…"
                readOnly={side !== "bottom"}
                onClick={() => setShowMsgKeyboard(true)}
                style={{ flex: 1, border: "1px solid #bfdbfe", borderRadius: 4, padding: "5px 7px", fontSize: 10, outline: "none", background: "#fff", color: "#1e293b", minWidth: 0, height: "100%", boxSizing: "border-box", cursor: "pointer" }}
                onPointerDown={(e) => e.stopPropagation()}
                onPointerMove={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
              />
              <button
                type="button"
                onClick={() => { if (msgInput.trim()) { onSendMessage?.(msgInput.trim()); setMsgInput(""); } }}
                style={{ background: BEZEL_ACCENT, color: "#fff", border: "none", borderRadius: 4, padding: "5px 9px", fontSize: 10, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                Send
              </button>
            </div>

            {/* RIGHT — Received */}
            <div style={{ flex: "0 0 50%", display: "flex", flexDirection: "column", padding: "5px 6px", overflow: "hidden" }}>
              <p style={{ margin: "0 0 3px", fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: BEZEL_ACCENT, flexShrink: 0 }}>
                Received
              </p>
              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
                {(() => {
                  const inbound = messages.filter((m) =>
                    side === "bottom" ? m.fromSide !== side : m.to === "all",
                  );
                  if (!inbound.length) return <span style={{ fontSize: 8, color: "#94a3b8", fontStyle: "italic" }}>No messages yet.</span>;
                  return inbound.map((m) => {
                    const isNoteNotif = !!m.noteId && m.fromSide !== side;
                    const alreadyRevealed = m.noteId ? (revealedNotes[m.noteId]?.includes(side) ?? false) : false;
                    return (
                      <div key={m.id} style={{ fontSize: 9, color: "#1e293b", background: isNoteNotif ? "#eff6ff" : "#e2e8f0", borderRadius: 4, padding: "2px 5px", lineHeight: 1.4, border: isNoteNotif ? "1px solid #bfdbfe" : "none" }}>
                        <span style={{ fontSize: 8, fontWeight: 700, color: BEZEL_ACCENT }}>{m.fromTitle}: </span>
                        {m.text}
                        {isNoteNotif && (
                          alreadyRevealed ? (
                            <button
                              type="button"
                              onClick={() => onHideNote?.(m.noteId!)}
                              style={{
                                marginLeft: 4, fontSize: 7, fontWeight: 700, cursor: "pointer",
                                background: "#fee2e2", color: "#991b1b",
                                border: "1px solid #fca5a5", borderRadius: 3, padding: "1px 5px", flexShrink: 0,
                              }}
                            >
                              Hide
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onRevealNote?.(m.noteId!)}
                              style={{
                                marginLeft: 4, fontSize: 7, fontWeight: 700, cursor: "pointer",
                                background: "#2563eb", color: "#fff",
                                border: "none", borderRadius: 3, padding: "1px 5px", flexShrink: 0,
                              }}
                            >
                              Reveal
                            </button>
                          )
                        )}
                      </div>
                    );
                  });
                })()}
                <div ref={msgEndRef} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

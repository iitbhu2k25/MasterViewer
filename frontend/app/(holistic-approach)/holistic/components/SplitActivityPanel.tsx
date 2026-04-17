"use client";

import { useEffect, useRef, useState } from "react";
import type { StickyNote } from "../../../split/components/SplitViewerWindow";

export type SplitMark = {
  id: string;
  timestamp: number;
  viewerSide: string;
  viewerTitle: string;
  tool: string;
  color: string;
  text: string;
  lat: number;
  lng: number;
  shape?: string;
};

export type SplitSession = {
  sessionId: string;
  startedAt: number;
  lastActivityAt: number;
  marks: SplitMark[];
  zones: string[];
  activeZones: string[];
  criteria: string[];
  activeCriteria: string[];
  basemap: string;
  stickyNotes: StickyNote[];
};

const SESSIONS_KEY = "split_sessions";
const RESTORE_SESSION_KEY = "split_restore_session";

const SIDE_ACCENT: Record<string, string> = {
  main: "#6366f1", top: "#d97706", topSecondary: "#e11d48",
  left: "#2563eb", right: "#16a34a", bottom: "#7c3aed",
};
const SIDE_BG: Record<string, string> = {
  main: "#eef2ff", top: "#fffbeb", topSecondary: "#fff1f2",
  left: "#eff6ff", right: "#f0fdf4", bottom: "#faf5ff",
};

function fmt(ts: number) {
  return new Date(ts).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}
function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString(undefined, { timeStyle: "short" });
}
function duration(start: number, end: number) {
  const s = Math.floor((end - start) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}
function timeAgo(ts: number) {
  const d = Math.floor((Date.now() - ts) / 1000);
  if (d < 60) return `${d}s ago`;
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return new Date(ts).toLocaleDateString();
}

function ShapeIcon({ tool, color, size = 15 }: { tool: string; color: string; size?: number }) {
  const s = color === "transparent" || !color ? "#475569" : color;
  if (tool === "sticky note") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={s} fillOpacity={0.3} stroke={s} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5Z"/>
      <path d="M15 3v6h6"/>
    </svg>
  );
  if (tool === "text label") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 7 4 4 20 4 20 7"/>
      <line x1="9" y1="20" x2="15" y2="20"/>
      <line x1="12" y1="4" x2="12" y2="20"/>
    </svg>
  );
  if (tool === "rect") return <div style={{ width: size - 2, height: Math.round((size - 2) * 0.6), border: `2px solid ${s}` }} />;
  if (tool === "oval") return <div style={{ width: size - 2, height: Math.round((size - 2) * 0.6), border: `2px solid ${s}`, borderRadius: "50%" }} />;
  if (tool === "rhombus") return <div style={{ width: size - 4, height: size - 4, border: `2px solid ${s}`, transform: "rotate(45deg)" }} />;
  if (tool === "triangle") return (
    <svg width={size} height={size - 2} viewBox="0 0 13 11">
      <polygon points="6.5,1 12,10 1,10" fill="none" stroke={s} strokeWidth="2" />
    </svg>
  );
  return <span style={{ fontSize: size - 2 }}>📍</span>;
}

// ── PDF export ────────────────────────────────────────────────────────────────
function exportPDF(s: SplitSession) {
  const lines: string[] = [];
  lines.push("SPLIT SCREEN SESSION REPORT");
  lines.push("=".repeat(52));
  lines.push(`Session ID   : ${s.sessionId}`);
  lines.push(`Started      : ${fmt(s.startedAt)}`);
  lines.push(`Last Active  : ${fmt(s.lastActivityAt)}`);
  lines.push(`Duration     : ${duration(s.startedAt, s.lastActivityAt)}`);
  lines.push(`Basemap      : ${s.basemap}`);
  lines.push("");

  lines.push(`ZONES SELECTED (${s.zones.length} total)`);
  lines.push("-".repeat(36));
  lines.push(s.zones.length ? s.zones.join(", ") : "None");
  if (s.activeZones?.length) lines.push(`  Active at session end: ${s.activeZones.join(", ")}`);
  lines.push("");

  lines.push(`MODULES / CRITERIA (${s.criteria.length} total)`);
  lines.push("-".repeat(36));
  lines.push(s.criteria.length ? s.criteria.join(", ") : "None");
  lines.push("");

  lines.push(`MARKS PLACED (${s.marks.length})`);
  lines.push("-".repeat(36));
  s.marks.forEach((m, i) => {
    lines.push(`  ${i + 1}. [${m.viewerTitle}]  Tool: ${m.tool}  Time: ${fmtTime(m.timestamp)}`);
    lines.push(`     Coordinates : Lat ${m.lat.toFixed(6)}, Lng ${m.lng.toFixed(6)}`);
    lines.push(`     Color       : ${m.color}`);
    if (m.text) lines.push(`     Text        : "${m.text}"`);
    lines.push("");
  });

  lines.push(`STICKY NOTES WITH TEXT (${s.stickyNotes?.filter(n => n.text).length ?? 0})`);
  lines.push("-".repeat(36));
  (s.stickyNotes ?? []).filter(n => n.text).forEach((n, i) => {
    lines.push(`  ${i + 1}. [${n.ownerSide}]  "${n.text}"`);
    lines.push(`     Lat ${n.lat.toFixed(6)}, Lng ${n.lng.toFixed(6)}  Color: ${n.color}`);
    lines.push("");
  });

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Split Session Report — ${fmt(s.startedAt)}</title>
<style>
  body { font-family: 'Segoe UI', Arial, monospace; font-size: 13px; margin: 40px; color: #1e293b; line-height: 1.6; }
  h1 { font-size: 20px; color: #1e3a8a; margin-bottom: 2px; }
  .sub { font-size: 11px; color: #64748b; margin-bottom: 20px; }
  pre { white-space: pre-wrap; word-break: break-word; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; font-size: 12px; }
  @media print { body { margin: 20px; } pre { border: none; padding: 0; background: none; } }
</style></head><body>
<h1>Split Screen Session Report</h1>
<div class="sub">Generated: ${new Date().toLocaleString()}</div>
<pre>${lines.join("\n")}</pre>
</body></html>`;

  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
}

// ─────────────────────────────────────────────────────────────────────────────

export default function SplitActivityPanel() {
  const [sessions, setSessions] = useState<SplitSession[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<SplitSession | null>(null);
  const [lastSeen, setLastSeen] = useState<number>(() => {
    try { return parseInt(localStorage.getItem("split_notif_lastseen") ?? "0", 10); } catch { return 0; }
  });
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem(SESSIONS_KEY);
        if (raw) setSessions(JSON.parse(raw));
      } catch { /* ignore */ }
    };
    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, []);

  const unseen = sessions.filter((s) => s.lastActivityAt > lastSeen).length;

  const handleOpen = () => {
    const now = Date.now();
    setOpen(true);
    setLastSeen(now);
    try { localStorage.setItem("split_notif_lastseen", String(now)); } catch { /* ignore */ }
  };

  const handleDeleteSession = (sessionId: string) => {
    const next = sessions.filter((s) => s.sessionId !== sessionId);
    setSessions(next);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(next));
    if (selected?.sessionId === sessionId) setSelected(null);
  };

  const handleGoToSession = (s: SplitSession) => {
    localStorage.setItem(RESTORE_SESSION_KEY, JSON.stringify(s));
    window.location.href = "/split";
  };

  const panelW = selected ? Math.min(820, typeof window !== "undefined" ? window.innerWidth : 820) : 380;

  return (
    <>
      {/* Bell button with label — styled for light white header */}
      <button type="button" onClick={handleOpen}
        style={{
          display: "flex", alignItems: "center", gap: 7,
          background: unseen > 0 ? "#eff6ff" : "#f8fafc",
          border: `1.5px solid ${unseen > 0 ? "#93c5fd" : "#e2e8f0"}`,
          borderRadius: 22, padding: "6px 13px 6px 9px",
          cursor: "pointer", flexShrink: 0,
          transition: "all 0.2s",
        }}
        title="Split screen activity"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={unseen > 0 ? "#2563eb" : "#64748b"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <span style={{ fontSize: 12, fontWeight: 700, color: unseen > 0 ? "#1d4ed8" : "#475569", letterSpacing: "0.01em" }}>
          Notifications
        </span>
        {unseen > 0 ? (
          <span style={{
            background: "#ef4444", color: "#fff", borderRadius: 10,
            minWidth: 18, height: 18, fontSize: 10, fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px",
          }}>
            {unseen > 9 ? "9+" : unseen}
          </span>
        ) : (
          <span style={{
            background: "#e2e8f0", color: "#94a3b8", borderRadius: 10,
            minWidth: 18, height: 18, fontSize: 10, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px",
          }}>
            {sessions.length}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9000, display: "flex", alignItems: "flex-start", justifyContent: "flex-end" }}>
          {/* Backdrop */}
          <div style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.45)" }} onClick={() => { setOpen(false); setSelected(null); }} />

          {/* Panel */}
          <div ref={panelRef} style={{ position: "relative", zIndex: 1, height: "100vh", width: panelW, maxWidth: "97vw", background: "#ffffff", boxShadow: "-8px 0 40px rgba(0,0,0,0.18)", display: "flex", overflow: "hidden", transition: "width 0.25s ease" }}>

            {/* ── Session list (left column) ── */}
            <div style={{ width: 380, flexShrink: 0, display: "flex", flexDirection: "column", height: "100%", borderRight: "1px solid #e2e8f0" }}>
              {/* Header */}
              <div style={{ padding: "16px 16px 12px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Ideum Sessions</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>{sessions.length} session{sessions.length !== 1 ? "s" : ""} recorded</p>
                </div>
                <button type="button" onClick={() => { setOpen(false); setSelected(null); }}
                  style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#64748b", borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                  ✕
                </button>
              </div>

              {/* Session list */}
              <div style={{ flex: 1, overflowY: "auto", background: "#fff" }}>
                {sessions.length === 0 ? (
                  <div style={{ padding: "48px 20px", textAlign: "center" }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#f1f5f9", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                      </svg>
                    </div>
                    <p style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>No sessions yet</p>
                    <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Place marks or select zones on the Split screen to record activity.</p>
                  </div>
                ) : (
                  [...sessions].reverse().map((s) => {
                    const isActive = selected?.sessionId === s.sessionId;
                    const hasActivity = s.marks.length > 0 || s.zones.length > 0 || s.criteria.length > 0;
                    return (
                      <div key={s.sessionId}
                        style={{ borderBottom: "1px solid #f1f5f9", background: isActive ? "#eff6ff" : "#fff", borderLeft: `3px solid ${isActive ? "#2563eb" : "transparent"}`, transition: "background 0.1s" }}
                      >
                        <button type="button" onClick={() => setSelected(isActive ? null : s)}
                          style={{ width: "100%", textAlign: "left", background: "transparent", border: "none", padding: "12px 14px", cursor: "pointer", display: "flex", gap: 11, alignItems: "flex-start" }}
                        >
                          {/* Icon */}
                          <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: hasActivity ? "#dbeafe" : "#f8fafc", border: `1.5px solid ${hasActivity ? "#93c5fd" : "#e2e8f0"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={hasActivity ? "#2563eb" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
                            </svg>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{fmt(s.startedAt)}</span>
                              <span style={{ fontSize: 10, color: "#94a3b8" }}>{timeAgo(s.startedAt)}</span>
                            </div>
                            <p style={{ margin: "3px 0 0", fontSize: 11, color: "#475569" }}>
                              <span style={{ fontWeight: 600, color: "#2563eb" }}>{s.marks.length}</span> mark{s.marks.length !== 1 ? "s" : ""}
                              {s.zones.length > 0 ? <> · <span style={{ fontWeight: 600, color: "#16a34a" }}>{s.zones.length}</span> zone{s.zones.length !== 1 ? "s" : ""}</> : ""}
                              {s.criteria.length > 0 ? <> · <span style={{ fontWeight: 600, color: "#d97706" }}>{s.criteria.length}</span> criteria</> : ""}
                            </p>
                            <p style={{ margin: "2px 0 0", fontSize: 10, color: "#94a3b8" }}>
                              {duration(s.startedAt, s.lastActivityAt)} · {s.basemap}
                            </p>
                          </div>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* ── Session detail (right pane) ── */}
            {selected && (
              <div style={{ flex: 1, overflow: "auto", background: "#f8fafc", display: "flex", flexDirection: "column" }}>
                {/* Detail header */}
                <div style={{ padding: "14px 18px 12px", background: "#fff", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, position: "sticky", top: 0, zIndex: 10 }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Session Detail</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>{fmt(selected.startedAt)}</p>
                  </div>
                  <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <button type="button" onClick={() => handleGoToSession(selected)}
                      style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: "#16a34a", border: "none", borderRadius: 7, padding: "6px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>
                      </svg>
                      Resume Session
                    </button>
                    <button type="button" onClick={() => exportPDF(selected)}
                      style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: "#2563eb", border: "none", borderRadius: 7, padding: "6px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      PDF Report
                    </button>
                    <button type="button" onClick={() => handleDeleteSession(selected.sessionId)}
                      style={{ fontSize: 11, color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 7, padding: "6px 11px", cursor: "pointer", fontWeight: 600 }}>
                      Delete
                    </button>
                    <button type="button" onClick={() => setSelected(null)}
                      style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#64748b", borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                      ✕
                    </button>
                  </div>
                </div>

                <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
                  {/* Summary cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                    {[
                      { label: "Marks", value: selected.marks.length, color: "#2563eb", bg: "#dbeafe" },
                      { label: "Zones", value: selected.zones.length, color: "#16a34a", bg: "#dcfce7" },
                      { label: "Criteria", value: selected.criteria.length, color: "#d97706", bg: "#fef3c7" },
                    ].map((c) => (
                      <div key={c.label} style={{ background: c.bg, borderRadius: 10, padding: "12px 14px", textAlign: "center", border: `1px solid ${c.color}22` }}>
                        <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: c.color }}>{c.value}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 10, color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{c.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Session Info */}
                  <Card title="Session Info">
                    <InfoRow label="Started" value={fmt(selected.startedAt)} />
                    <InfoRow label="Last Active" value={fmt(selected.lastActivityAt)} />
                    <InfoRow label="Duration" value={duration(selected.startedAt, selected.lastActivityAt)} />
                    <InfoRow label="Basemap" value={selected.basemap} />
                  </Card>

                  {/* Zones */}
                  {selected.zones.length > 0 && (
                    <Card title={`Zones Selected — ${selected.zones.length} total`}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingTop: 6 }}>
                        {selected.zones.map((z) => (
                          <span key={z} style={{ fontSize: 11, background: selected.activeZones?.includes(z) ? "#dcfce7" : "#f1f5f9", color: selected.activeZones?.includes(z) ? "#15803d" : "#475569", border: `1px solid ${selected.activeZones?.includes(z) ? "#86efac" : "#e2e8f0"}`, borderRadius: 5, padding: "3px 9px", fontWeight: 600 }}>
                            {z}
                            {selected.activeZones?.includes(z) && <span style={{ fontSize: 9, marginLeft: 4, color: "#16a34a" }}>● active</span>}
                          </span>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Criteria / Modules */}
                  {selected.criteria.length > 0 && (
                    <Card title={`Modules / Criteria — ${selected.criteria.length} total`}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingTop: 6 }}>
                        {selected.criteria.map((c) => (
                          <span key={c} style={{ fontSize: 11, background: selected.activeCriteria?.includes(c) ? "#fef3c7" : "#f1f5f9", color: selected.activeCriteria?.includes(c) ? "#92400e" : "#475569", border: `1px solid ${selected.activeCriteria?.includes(c) ? "#fcd34d" : "#e2e8f0"}`, borderRadius: 5, padding: "3px 9px", fontWeight: 600 }}>
                            {c}
                            {selected.activeCriteria?.includes(c) && <span style={{ fontSize: 9, marginLeft: 4, color: "#d97706" }}>● active</span>}
                          </span>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Marks — note text shown inline inside each mark */}
                  {selected.marks.length > 0 && (
                    <Card title={`Marks Placed — ${selected.marks.length} total`}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 6 }}>
                        {selected.marks.map((m, i) => {
                          const accent = SIDE_ACCENT[m.viewerSide] ?? "#2563eb";
                          const bg = SIDE_BG[m.viewerSide] ?? "#eff6ff";
                          // Find the latest text for this mark from stickyNotes snapshot
                          const noteText = (selected.stickyNotes ?? []).find(n => n.id === m.id)?.text || m.text || "";
                          return (
                            <div key={m.id} style={{ background: bg, border: `1px solid ${accent}33`, borderLeft: `3px solid ${accent}`, borderRadius: 8, padding: "10px 12px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                              {/* Shape icon */}
                              <div style={{ width: 34, height: 34, borderRadius: 7, flexShrink: 0, background: m.color === "transparent" ? "#f8fafc" : `${m.color}33`, border: `1.5px solid ${m.color === "transparent" ? "#e2e8f0" : m.color}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <ShapeIcon tool={m.tool} color={m.color} size={15} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <span style={{ fontSize: 12, fontWeight: 700, color: accent }}>#{i + 1} · {m.viewerTitle}</span>
                                  <span style={{ fontSize: 10, color: "#94a3b8" }}>{fmtTime(m.timestamp)}</span>
                                </div>
                                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#374151", textTransform: "capitalize", fontWeight: 600 }}>{m.tool}</p>
                                <p style={{ margin: "2px 0 0", fontSize: 10, color: "#6b7280", fontFamily: "monospace" }}>
                                  Lat {m.lat.toFixed(5)}, Lng {m.lng.toFixed(5)}
                                </p>
                                {m.color !== "transparent" && (
                                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                                    <div style={{ width: 11, height: 11, borderRadius: 2, background: m.color, border: "1px solid rgba(0,0,0,0.12)", flexShrink: 0 }} />
                                    <span style={{ fontSize: 10, color: "#6b7280" }}>{m.color}</span>
                                  </div>
                                )}
                                {noteText && (
                                  <div style={{ marginTop: 6, background: "#fff", border: `1px solid ${accent}44`, borderRadius: 6, padding: "6px 9px" }}>
                                    <span style={{ fontSize: 9, fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: "0.06em" }}>Note text</span>
                                    <p style={{ margin: "3px 0 0", fontSize: 11, color: "#1e293b", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{noteText}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  )}

                  {selected.marks.length === 0 && selected.zones.length === 0 && selected.criteria.length === 0 && (
                    <div style={{ padding: "32px 0", textAlign: "center" }}>
                      <p style={{ fontSize: 12, color: "#94a3b8" }}>No activity recorded in this session yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", padding: "12px 14px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: "#64748b" }}>{title}</p>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid #f1f5f9" }}>
      <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 12, color: "#1e293b" }}>{value}</span>
    </div>
  );
}

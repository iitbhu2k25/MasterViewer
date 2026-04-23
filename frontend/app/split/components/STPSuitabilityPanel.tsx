"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FeatureCollection } from "../../shared/types";

const STP_BACKEND   = "http://localhost:7100/api/stp_operation";
const GEOSERVER_URL = process.env.NEXT_PUBLIC_GEOSERVER_URL ?? "http://localhost:9090/geoserver";

const TECH_OPTIONS = [
  { label: "Trickling Filter",         land: 0.25 },
  { label: "Activated Sludge Process", land: 0.15 },
  { label: "Extended Aeration",        land: 0.15 },
  { label: "Sequential Batch Reactor", land: 0.10 },
  { label: "BIOFOR-F",                 land: 0.08 },
  { label: "Membrane Bioreactor",      land: 0.05 },
] as const;

/* ── Types ──────────────────────────────────────────────────────────────── */
type RasterRow = {
  id:              number;
  file_name:       string;
  weight:          number;
  raster_category: string;
  details?:        string;
};

type CsvRow = {
  Village_Name: string;
  Very_Low:     number;
  Low:          number;
  Medium:       number;
  High:         number;
  Very_High:    number;
};

type AnalyzeResult = {
  workspace:   string;
  layer_name:  string;
  csv_details: CsvRow[];
};

type AreaInputs = {
  mldCapacity: number;
  techFactor:  number;
};

type AreaResult = {
  cluster_name: string | null;
};

export type STPWmsLayer = { url: string; layers: string };

/* ── Props ───────────────────────────────────────────────────────────────── */
type Props = {
  selectedZones?:      string[];
  areaGeojson?:        FeatureCollection | null;
  onResultLayer:       (layer: STPWmsLayer | null) => void;
  onPresentToMain:     (layer: STPWmsLayer | null) => void;
  onAreaLayer?:        (layer: STPWmsLayer | null) => void;
  onAreaPresentToMain?:(layer: STPWmsLayer | null) => void;
  onRequestMldKeyboard?: (currentValue: string, onChange: (val: string) => void) => void;
};

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function extractClipIds(
  zones:      string[],
  geojson:    FeatureCollection | null | undefined,
): number[] {
  if (!geojson?.features?.length || !zones.length) return [];
  const ids: number[] = [];
  for (const f of geojson.features) {
    const p   = f.properties ?? {};
    const name = String(
      p.id_ ?? p.ID_ ?? p.zone ?? p.Zone ?? p.ZONE ??
      p.area_name ?? p.Area ?? p.NAME ?? "",
    ).trim().toUpperCase();
    if (zones.includes(name)) {
      const id = Number(p.ID ?? p.id ?? p.OBJECTID ?? p.FID ?? NaN);
      if (!isNaN(id)) ids.push(id);
    }
  }
  return ids;
}

/* Weight = influence_i / Σ influences (auto-normalised) */
function deriveWeight(influence: number, influences: number[]): number {
  const total = influences.reduce((s, v) => s + v, 0);
  return total === 0 ? 0 : influence / total;
}

/* ── Component ───────────────────────────────────────────────────────────── */
export default function STPSuitabilityPanel({
  selectedZones  = [],
  areaGeojson,
  onResultLayer,
  onPresentToMain,
  onAreaLayer,
  onAreaPresentToMain,
  onRequestMldKeyboard,
}: Props) {
  /* ── raw data ── */
  const [conditions,   setConditions]   = useState<RasterRow[]>([]);
  const [constraints,  setConstraints]  = useState<RasterRow[]>([]);
  const [fetchState,   setFetchState]   = useState<"idle"|"loading"|"ok"|"error">("idle");
  const [fetchError,   setFetchError]   = useState("");
  const fetchedRef = useRef(false);

  /* ── selection / influence ── */
  const [selCond,   setSelCond]   = useState<Set<number>>(new Set());
  const [selConstr, setSelConstr] = useState<Set<number>>(new Set());
  /* influence score 1–10 per id */
  const [infl, setInfl] = useState<Record<number, number>>({});

  /* ── UI state ── */
  const [tab,      setTab]      = useState<"condition"|"constraint">("condition");
  const [unlocked, setUnlocked] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");
  const [result,   setResult]   = useState<AnalyzeResult | null>(null);
  const [wmsLayer, setWmsLayer] = useState<STPWmsLayer | null>(null);
  const [isOnMain,     setIsOnMain]     = useState(false);
  const [isAreaOnMain, setIsAreaOnMain] = useState(false);

  /* ── STP Area state ── */
  const [showAreaFinder, setShowAreaFinder] = useState(false);
  const [selectedTech, setSelectedTech] = useState<typeof TECH_OPTIONS[number] | null>(null);
  const [techOpen,     setTechOpen]     = useState(false);
  const [areaInputs, setAreaInputs] = useState<AreaInputs>({ mldCapacity: 1, techFactor: 0.25 });
  const [findingArea, setFindingArea]       = useState(false);
  const [areaError, setAreaError]           = useState("");
  const [areaResult, setAreaResult]         = useState<AreaResult | null>(null);
  const [areaWmsLayer, setAreaWmsLayer]     = useState<STPWmsLayer | null>(null);

  /* ── load categories ── */
  const loadCategories = useCallback(() => {
    setFetchState("loading");
    setFetchError("");
    const get = (cat: string) =>
      fetch(`${STP_BACKEND}/get_suitability_by_category?category=${cat}&all_data=true`)
        .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); });

    Promise.all([get("condition"), get("constraint")])
      .then(([cond, constr]: [RasterRow[], RasterRow[]]) => {
        setConditions(Array.isArray(cond)   ? cond   : []);
        setConstraints(Array.isArray(constr) ? constr : []);
        /* init influence from DB weight (convert 0–1 → 1–10 scale) */
        const init: Record<number, number> = {};
        [...(cond ?? []), ...(constr ?? [])].forEach(r => {
          init[r.id] = Math.max(1, Math.min(10, Math.round(r.weight * 10)));
        });
        setInfl(init);
        setFetchState("ok");
      })
      .catch((e: Error) => {
        setFetchError(e.message || "Network error");
        setFetchState("error");
      });
  }, []);

  useEffect(() => {
    if (!fetchedRef.current) { fetchedRef.current = true; loadCategories(); }
  }, [loadCategories]);

  /* ── derived weights for selected conditions ── */
  const selectedCondInfluences = useMemo(
    () => [...selCond].map(id => infl[id] ?? 1),
    [selCond, infl],
  );

  const condWeight = useCallback(
    (id: number) => deriveWeight(infl[id] ?? 1, selectedCondInfluences),
    [infl, selectedCondInfluences],
  );

  /* ── clip IDs from selected zones ── */
  const clipIds = useMemo(
    () => extractClipIds(selectedZones, areaGeojson),
    [selectedZones, areaGeojson],
  );

  const canAnalyze =
    selCond.size > 0 &&
    selectedZones.length > 0 &&
    !analyzing;

  /* ── analyze ── */
  const handleAnalyze = useCallback(async () => {
    if (!canAnalyze) return;
    setAnalyzing(true);
    setAnalyzeError("");

    /* build payload — conditions carry influence-derived weight; constraints are binary */
    const condData = [...selCond].map(id => {
      const r = conditions.find(c => c.id === id)!;
      return {
        id:        r.id,
        file_name: r.file_name,
        Influence: "positive",
        weight:    Number(condWeight(id).toFixed(4)),
      };
    });
    const constrData = [...selConstr].map(id => {
      const r = constraints.find(c => c.id === id)!;
      return { id: r.id, file_name: r.file_name, Influence: "positive", weight: 0 };
    });

    const payload = {
      data:          [...condData, ...constrData],
      clip:          clipIds.length ? clipIds : undefined,
      place:         selectedZones.join(","),
      village_layer: null,
      all_data:      false,
    };

    try {
      const resp = await fetch(`${STP_BACKEND}/stp_suitability`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data: AnalyzeResult = await resp.json();

      /* handle both response shapes:
         - {workspace, layer_name, csv_details}  (reference deployment)
         - {raster_layer:[{workspace,layer_name}], vector_layer}  (schema) */
      const ws  = data.workspace  ?? (data as any).raster_layer?.[0]?.workspace;
      const ln  = data.layer_name ?? (data as any).raster_layer?.[0]?.layer_name;
      const csv: CsvRow[] = data.csv_details ?? [];

      if (ws && ln) {
        const layer: STPWmsLayer = {
          url:    `${GEOSERVER_URL}/${ws}/wms`,
          layers: `${ws}:${ln}`,
        };
        setWmsLayer(layer);
        setResult({ workspace: ws, layer_name: ln, csv_details: csv });
        onResultLayer(layer);
        setIsOnMain(false);
      } else {
        setAnalyzeError("No layer in response — check backend logs.");
      }
    } catch (e: unknown) {
      setAnalyzeError(e instanceof Error ? e.message : "Analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  }, [canAnalyze, selCond, selConstr, conditions, constraints, condWeight, clipIds, selectedZones, onResultLayer]);

  /* ── find STP area ── */
  const handleFindArea = useCallback(async () => {
    if (!result?.layer_name || selectedZones.length === 0 || findingArea) return;
    setFindingArea(true);
    setAreaError("");
    setAreaResult(null);
    setAreaWmsLayer(null);
    onAreaLayer?.(null);
    if (isAreaOnMain) { onAreaPresentToMain?.(null); setIsAreaOnMain(false); }
    try {
      const resp = await fetch(`${STP_BACKEND}/stp_area`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mld_capacity:         areaInputs.mldCapacity,
          treatment_technology: areaInputs.techFactor,
          custom_land_per_mld:  2.0,
          layer_name:           result.layer_name,
          place:                selectedZones[0],
        }),
      });
      if (!resp.ok) {
        const detail = await resp.json().catch(() => ({}));
        throw new Error(detail?.detail ?? `HTTP ${resp.status}`);
      }
      const data: AreaResult = await resp.json();
      setAreaResult(data);
      if (data.cluster_name) {
        const layer: STPWmsLayer = {
          url:    `${GEOSERVER_URL}/vector_work/wms`,
          layers: `vector_work:${data.cluster_name}`,
        };
        setAreaWmsLayer(layer);
        onAreaLayer?.(layer);
      }
    } catch (e: unknown) {
      setAreaError(e instanceof Error ? e.message : "Area analysis failed.");
    } finally {
      setFindingArea(false);
    }
  }, [result, selectedZones, areaInputs, findingArea, onAreaLayer, isAreaOnMain, onAreaPresentToMain]);

  /* ── tiny styled atoms ── */
  const C = {
    sec:   { padding: "5px 7px", borderBottom: "1px solid #dbeafe", flexShrink: 0 as const },
    label: { margin: "0 0 2px" as const, fontSize: 7, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.07em", color: "#1d4ed8" },
    chip:  (on: boolean): React.CSSProperties => ({
      padding: "1px 5px", fontSize: 7, fontWeight: 700, borderRadius: 3, cursor: "pointer",
      border: on ? "1.5px solid #2563eb" : "1px solid #bfdbfe",
      background: on ? "#dbeafe" : "#fff", color: on ? "#1e40af" : "#475569",
    }),
    btn: (color: string, disabled = false): React.CSSProperties => ({
      width: "100%", padding: "5px 0", fontSize: 8, fontWeight: 700,
      textTransform: "uppercase" as const, letterSpacing: "0.07em", borderRadius: 5,
      border: "none", cursor: disabled ? "not-allowed" : "pointer",
      background: disabled ? "#94a3b8" : color, color: "#fff",
    }),
  };

  /* ── render ── */
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#f0f6ff", overflowY: "auto", fontSize: 9 }}>

      {/* Header */}
      <div style={{ padding: "4px 7px", background: "#1e40af", flexShrink: 0 }}>
        <p style={{ margin: 0, fontSize: 8, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#fff" }}>STP Suitability</p>
      </div>

      {/* Fetch status */}
      {fetchState === "loading" && (
        <div style={{ padding: "6px 7px", fontSize: 8, color: "#2563eb", fontStyle: "italic", flexShrink: 0 }}>Loading categories…</div>
      )}
      {fetchState === "error" && (
        <div style={{ ...C.sec, background: "#fee2e2" }}>
          <p style={{ margin: "0 0 3px", fontSize: 8, color: "#dc2626", fontWeight: 600 }}>{fetchError}</p>
          <button type="button" onClick={loadCategories} style={{ fontSize: 7, padding: "1px 6px", borderRadius: 3, border: "1px solid #dc2626", background: "#fff", color: "#dc2626", cursor: "pointer" }}>Retry</button>
        </div>
      )}

      {/* Zone chips */}
      {/* <div style={C.sec}>
        <p style={C.label}>Analysis Zone</p>
        {selectedZones.length === 0 ? (
          <div style={{ padding: "3px 5px", borderRadius: 3, background: "#fef9c3", border: "1px solid #fde047", fontSize: 7, color: "#854d0e", fontWeight: 600 }}>
            ⚠ Select zones first
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            {selectedZones.map(z => (
              <span key={z} style={{ fontSize: 7, fontWeight: 700, padding: "1px 4px", borderRadius: 3, background: "#dbeafe", color: "#1e40af", border: "1px solid #93c5fd" }}>{z}</span>
            ))}
          </div>
        )}
      </div> */}

      {/* Tab bar + lock button */}
      {fetchState === "ok" && (
        <div style={{ ...C.sec, display: "flex", alignItems: "center", gap: 3 }}>
          {(["condition", "constraint"] as const).map(t => (
            <button key={t} type="button" onClick={() => setTab(t)} style={C.chip(tab === t)}>
              {t === "condition" ? "Conditions" : "Constraints"}
            </button>
          ))}
          <button
            type="button"
            title={unlocked ? "Lock sliders" : "Unlock to edit"}
            onClick={() => setUnlocked(v => !v)}
            style={{ marginLeft: "auto", fontSize: 9, padding: "1px 4px", borderRadius: 3, border: "1px solid #94a3b8", background: unlocked ? "#dbeafe" : "#f8fafc", color: unlocked ? "#1e40af" : "#64748b", cursor: "pointer" }}
          >
            {unlocked ? "🔓" : "🔒"}
          </button>
        </div>
      )}

      {/* ── Conditions tab ── */}
      {fetchState === "ok" && tab === "condition" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 7px 2px", borderBottom: "1px solid #dbeafe" }}>
          {/* Select/Clear All */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 3, marginBottom: 4 }}>
            <button type="button" onClick={() => setSelCond(new Set(conditions.map(c => c.id)))} style={{ fontSize: 7, padding: "1px 5px", borderRadius: 3, border: "none", background: "#2563eb", color: "#fff", cursor: "pointer" }}>All</button>
            <button type="button" onClick={() => setSelCond(new Set())} style={{ fontSize: 7, padding: "1px 5px", borderRadius: 3, border: "none", background: "#ef4444", color: "#fff", cursor: "pointer" }}>Clear</button>
          </div>

          {/* Column headers */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 18px 28px", gap: 2, marginBottom: 3 }}>
            <span style={{ fontSize: 7, fontWeight: 700, color: "#64748b" }}>Category</span>
            <span style={{ fontSize: 7, fontWeight: 700, color: "#64748b", textAlign: "center" }}>Infl</span>
            <span style={{ fontSize: 7, fontWeight: 700, color: "#64748b", textAlign: "right" }}>Wt</span>
          </div>

          {conditions.length === 0 && <p style={{ fontSize: 8, color: "#94a3b8", fontStyle: "italic" }}>No condition data.</p>}

          {conditions.map(cat => {
            const on  = selCond.has(cat.id);
            const inf = infl[cat.id] ?? 1;
            const wt  = on ? condWeight(cat.id) : 0;
            return (
              <div key={cat.id} style={{ marginBottom: 7 }}>
                {/* Row: checkbox | name | influence | weight */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 18px 28px", gap: 2, alignItems: "center", marginBottom: 2 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 3, cursor: "pointer", minWidth: 0 }}>
                    <input type="checkbox" checked={on} onChange={() => setSelCond(prev => { const n = new Set(prev); on ? n.delete(cat.id) : n.add(cat.id); return n; })} style={{ width: 10, height: 10, flexShrink: 0, accentColor: "#2563eb" }} />
                    <span style={{ fontSize: 7, fontWeight: 600, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={cat.file_name}>
                      {cat.file_name.split(/[/\\]/).pop()?.replace(/_/g, " ")}
                    </span>
                  </label>
                  <span style={{ fontSize: 7, fontWeight: 700, color: on ? "#1e40af" : "#94a3b8", textAlign: "center" }}>{Math.round(inf)}</span>
                  <span style={{ fontSize: 7, fontWeight: 700, color: on ? "#059669" : "#94a3b8", textAlign: "right" }}>{on ? wt.toFixed(2) : "—"}</span>
                </div>
                {/* Influence slider */}
                <div style={{ opacity: on && unlocked ? 1 : 0.4, paddingLeft: 14 }}>
                  <input
                    type="range" min={1} max={10} step={0.1}
                    value={inf}
                    disabled={!on || !unlocked}
                    onChange={e => setInfl(prev => ({ ...prev, [cat.id]: parseFloat(e.target.value) }))}
                    style={{ width: "100%", accentColor: "#2563eb", margin: 0, display: "block", height: 4 }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 1 }}>
                    <span style={{ fontSize: 6, color: "#94a3b8" }}>1 Least</span>
                    <span style={{ fontSize: 6, color: "#94a3b8" }}>10 Most</span>
                  </div>
                </div>
              </div>
            );
          })}

          <div style={{ marginTop: 4, padding: "4px 5px", background: "#eff6ff", borderLeft: "3px solid #3b82f6", borderRadius: "0 3px 3px 0", fontSize: 7, color: "#475569" }}>
            Check to select · Unlock to adjust influence
          </div>
        </div>
      )}

      {/* ── Constraints tab ── */}
      {fetchState === "ok" && tab === "constraint" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 7px 2px", borderBottom: "1px solid #dbeafe" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 3, marginBottom: 4 }}>
            <button type="button" onClick={() => setSelConstr(new Set(constraints.map(c => c.id)))} style={{ fontSize: 7, padding: "1px 5px", borderRadius: 3, border: "none", background: "#2563eb", color: "#fff", cursor: "pointer" }}>All</button>
            <button type="button" onClick={() => setSelConstr(new Set())} style={{ fontSize: 7, padding: "1px 5px", borderRadius: 3, border: "none", background: "#ef4444", color: "#fff", cursor: "pointer" }}>Clear</button>
          </div>

          {constraints.length === 0 && <p style={{ fontSize: 8, color: "#94a3b8", fontStyle: "italic" }}>No constraint data.</p>}

          {constraints.map(cat => {
            const on = selConstr.has(cat.id);
            return (
              <div key={cat.id} style={{ marginBottom: 5, padding: "3px 5px", background: on ? "#fef2f2" : "#f8fafc", border: `1px solid ${on ? "#fca5a5" : "#e2e8f0"}`, borderRadius: 4 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                  <input type="checkbox" checked={on} onChange={() => setSelConstr(prev => { const n = new Set(prev); on ? n.delete(cat.id) : n.add(cat.id); return n; })} style={{ width: 10, height: 10, flexShrink: 0, accentColor: "#ef4444" }} />
                  <span style={{ fontSize: 7, fontWeight: 600, color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }} title={cat.file_name}>
                    {cat.file_name.split(/[/\\]/).pop()?.replace(/_/g, " ")}
                  </span>
                  <span style={{ fontSize: 6, padding: "1px 3px", borderRadius: 2, background: "#fee2e2", color: "#dc2626", flexShrink: 0 }}>C</span>
                </label>
              </div>
            );
          })}

          <div style={{ marginTop: 4, padding: "4px 5px", background: "#fff7ed", borderLeft: "3px solid #f97316", borderRadius: "0 3px 3px 0", fontSize: 7, color: "#475569" }}>
            Constraints define excluded areas.
          </div>
        </div>
      )}

      {/* Analyze error */}
      {analyzeError && (
        <div style={{ padding: "4px 7px", background: "#fee2e2", flexShrink: 0 }}>
          <p style={{ margin: 0, fontSize: 7, color: "#dc2626", fontWeight: 600 }}>{analyzeError}</p>
        </div>
      )}

      {/* Buttons */}
      <div style={{ padding: "3px 7px", display: "flex", flexDirection: "column", gap: 3, background: "#eff6ff", flexShrink: 0 }}>
        {selCond.size === 0 && fetchState === "ok" && (
          <p style={{ margin: "0 0 1px", fontSize: 7, color: "#c2410c", fontWeight: 600 }}>⚠ Select at least 1 condition</p>
        )}
        {/* Row 1: Analyze + Clear */}
        <div style={{ display: "flex", gap: 3 }}>
          <button
            type="button"
            disabled={!canAnalyze}
            onClick={handleAnalyze}
            title={selectedZones.length === 0 ? "Select zones first" : selCond.size === 0 ? "Select at least one condition" : ""}
            style={{ flex: 1, padding: "3px 5px", fontSize: 8, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em", borderRadius: 4, border: "none", cursor: !canAnalyze ? "not-allowed" : "pointer", background: !canAnalyze ? "#94a3b8" : analyzing ? "#93c5fd" : "#2563eb", color: "#fff" }}
          >
            {analyzing ? "…" : "Analyze"}
          </button>
          {wmsLayer && (
            <button
              type="button"
              onClick={() => { setWmsLayer(null); setResult(null); onResultLayer(null); if (isOnMain) { onPresentToMain(null); setIsOnMain(false); } }}
              style={{ padding: "3px 7px", fontSize: 8, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em", borderRadius: 4, border: "1px solid #fca5a5", background: "#fff", color: "#dc2626", cursor: "pointer" }}
            >
              Clear
            </button>
          )}
        </div>
        {/* Row 2: Show on Main */}
        {wmsLayer && (
          <button
            type="button"
            onClick={() => { if (isOnMain) { onPresentToMain(null); setIsOnMain(false); } else { onPresentToMain(wmsLayer); setIsOnMain(true); } }}
            style={{ width: "100%", padding: "3px 5px", fontSize: 8, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em", borderRadius: 4, border: `1.5px solid ${isOnMain ? "#dc2626" : "#2563eb"}`, background: "#fff", color: isOnMain ? "#dc2626" : "#2563eb", cursor: "pointer" }}
          >
            {isOnMain ? "✕ Hide from Main" : "↑ Show on Main Screen"}
          </button>
        )}
      </div>

      {/* ── STP Area Finder ── shown after a successful suitability analysis */}
      {result && (
        <div style={{ flexShrink: 0, borderTop: "2px solid #1e40af" }}>
          {/* Collapsible header */}
          <button
            type="button"
            onClick={() => setShowAreaFinder(v => !v)}
            style={{ width: "100%", padding: "4px 7px", background: "#1e3a8a", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <span style={{ fontSize: 8, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#fff" }}>STP Site Finder</span>
            <span style={{ fontSize: 9, color: "#93c5fd" }}>{showAreaFinder ? "▲" : "▼"}</span>
          </button>

          {showAreaFinder && (
            <div style={{ padding: "5px 7px", background: "#eff6ff", display: "flex", flexDirection: "column", gap: 4 }}>
              {/* MLD Capacity */}
              <div>
                <p style={{ margin: "0 0 1px", fontSize: 7, fontWeight: 700, textTransform: "uppercase", color: "#1d4ed8" }}>MLD Capacity</p>
                <input
                  type="text"
                  inputMode="decimal"
                  value={areaInputs.mldCapacity}
                  readOnly
                  onClick={() => onRequestMldKeyboard?.(
                    String(areaInputs.mldCapacity),
                    (val) => {
                      const num = parseFloat(val);
                      setAreaInputs(p => ({ ...p, mldCapacity: isNaN(num) ? 0 : num }));
                    }
                  )}
                  style={{ width: "100%", fontSize: 8, padding: "2px 4px", borderRadius: 3, border: "1px solid #bfdbfe", boxSizing: "border-box" as const, cursor: "pointer" }}
                />
              </div>

              {/* Treatment Technology — custom dropdown (rotation-safe) */}
              <div style={{ position: "relative" }}>
                <p style={{ margin: "0 0 1px", fontSize: 7, fontWeight: 700, textTransform: "uppercase", color: "#1d4ed8" }}>Technology</p>
                <button
                  type="button"
                  onClick={() => setTechOpen(v => !v)}
                  style={{
                    width: "100%", fontSize: 8, padding: "2px 6px 2px 4px", borderRadius: 3,
                    border: `1px solid ${techOpen ? "#2563eb" : "#bfdbfe"}`,
                    background: "#fff", color: selectedTech ? "#1e293b" : "#94a3b8",
                    cursor: "pointer", display: "flex", justifyContent: "space-between",
                    alignItems: "center", boxSizing: "border-box" as const, textAlign: "left" as const,
                  }}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                    {selectedTech?.label ?? "— Select technology —"}
                  </span>
                  <span style={{ fontSize: 6, marginLeft: 3, flexShrink: 0 }}>{techOpen ? "▲" : "▼"}</span>
                </button>

                {techOpen && (
                  <div style={{
                    position: "absolute",
                    bottom: "calc(100% + 2px)",   /* opens upward — correct in any rotation */
                    left: 0, right: 0, zIndex: 9999,
                    background: "#fff", border: "1px solid #bfdbfe", borderRadius: 3,
                    boxShadow: "0 -4px 12px rgba(0,0,0,0.18)",
                    overflow: "hidden",
                  }}>
                    {TECH_OPTIONS.map(t => (
                      <button
                        key={t.label}
                        type="button"
                        onClick={() => {
                          setSelectedTech(t);
                          setAreaInputs(p => ({ ...p, techFactor: t.land }));
                          setTechOpen(false);
                        }}
                        style={{
                          width: "100%", textAlign: "left" as const, padding: "3px 6px",
                          fontSize: 7, border: "none", borderBottom: "1px solid #e2e8f0",
                          background: selectedTech?.label === t.label ? "#dbeafe" : "#fff",
                          color: "#1e293b", cursor: "pointer", display: "flex",
                          justifyContent: "space-between", alignItems: "center",
                        }}
                      >
                        <span style={{ fontWeight: selectedTech?.label === t.label ? 700 : 400 }}>{t.label}</span>
                        <span style={{ fontSize: 6, color: "#64748b", flexShrink: 0, marginLeft: 3 }}>{t.land} ha</span>
                      </button>
                    ))}
                  </div>
                )}

                {selectedTech && (
                  <p style={{ margin: "2px 0 0", fontSize: 6, color: "#475569" }}>
                    Land: <strong>{selectedTech.land} ha/MLD</strong>
                  </p>
                )}
              </div>


              {/* Zone note */}
              <div style={{ fontSize: 7, color: "#64748b", padding: "2px 4px", background: "#dbeafe", borderRadius: 3 }}>
                Zone: <strong>{selectedZones[0] ?? "—"}</strong>
              </div>

              {/* Error */}
              {areaError && (
                <p style={{ margin: 0, fontSize: 7, color: "#dc2626", fontWeight: 600 }}>{areaError}</p>
              )}

              {/* Find Site button */}
              {!selectedTech && (
                <p style={{ margin: "0", fontSize: 7, color: "#c2410c", fontWeight: 600 }}>⚠ Select a technology</p>
              )}
              <button
                type="button"
                disabled={findingArea || !selectedZones.length || !selectedTech}
                onClick={handleFindArea}
                style={{
                  width: "100%", padding: "5px 0", fontSize: 8, fontWeight: 700,
                  textTransform: "uppercase" as const, letterSpacing: "0.07em", borderRadius: 5,
                  border: "none",
                  cursor: findingArea || !selectedZones.length || !selectedTech ? "not-allowed" : "pointer",
                  background: findingArea ? "#93c5fd" : (!selectedZones.length || !selectedTech) ? "#94a3b8" : "#0369a1",
                  color: "#fff",
                }}
              >
                {findingArea ? "Finding…" : "Find STP Site"}
              </button>

              {/* Result */}
              {areaResult && (
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {/* <div style={{ padding: "4px 6px", borderRadius: 4, background: areaResult.cluster_name ? "#dcfce7" : "#fef9c3", border: `1px solid ${areaResult.cluster_name ? "#86efac" : "#fde047"}` }}>
                    {areaResult.cluster_name ? (
                      <>
                        <p style={{ margin: "0 0 1px", fontSize: 7, fontWeight: 700, color: "#15803d" }}>✓ Site clusters found</p>
                        <p style={{ margin: 0, fontSize: 6, color: "#166534", wordBreak: "break-all" as const }}>{areaResult.cluster_name}</p>
                      </>
                    ) : (
                      <p style={{ margin: 0, fontSize: 7, fontWeight: 600, color: "#854d0e" }}>⚠ No suitable site found for given inputs</p>
                    )}
                  </div> */}
                  {areaWmsLayer && (
                    <button
                      type="button"
                      onClick={() => {
                        if (isAreaOnMain) { onAreaPresentToMain?.(null); setIsAreaOnMain(false); }
                        else { onAreaPresentToMain?.(areaWmsLayer); setIsAreaOnMain(true); }
                      }}
                      style={{ width: "100%", padding: "4px 0", fontSize: 8, fontWeight: 700,
                        textTransform: "uppercase" as const, letterSpacing: "0.07em", borderRadius: 5,
                        border: `1.5px solid ${isAreaOnMain ? "#dc2626" : "#0369a1"}`,
                        background: "#fff", color: isAreaOnMain ? "#dc2626" : "#0369a1", cursor: "pointer" }}
                    >
                      {isAreaOnMain ? "✕ Hide from Main" : "↑ Site on Main Map"}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Results table — shown automatically when available */}
      {result?.csv_details && result.csv_details.length > 0 && (
        <div style={{ flexShrink: 0, overflowX: "auto", borderTop: "1px solid #bfdbfe", background: "#fff" }}>
          <p style={{ margin: "4px 7px 2px", fontSize: 7, fontWeight: 700, textTransform: "uppercase", color: "#1d4ed8" }}>
            Village Results ({result.csv_details.length})
          </p>
          <table style={{ width: "100%", fontSize: 7, borderCollapse: "collapse", color: "#334155" }}>
            <thead>
              <tr style={{ background: "#dbeafe" }}>
                <th style={{ padding: "2px 4px", textAlign: "left", fontWeight: 700, borderBottom: "1px solid #bfdbfe", whiteSpace: "nowrap" }}>Village</th>
                <th style={{ padding: "2px 4px", textAlign: "right", fontWeight: 700, borderBottom: "1px solid #bfdbfe" }}>VL</th>
                <th style={{ padding: "2px 4px", textAlign: "right", fontWeight: 700, borderBottom: "1px solid #bfdbfe" }}>L</th>
                <th style={{ padding: "2px 4px", textAlign: "right", fontWeight: 700, borderBottom: "1px solid #bfdbfe" }}>M</th>
                <th style={{ padding: "2px 4px", textAlign: "right", fontWeight: 700, borderBottom: "1px solid #bfdbfe" }}>H</th>
                <th style={{ padding: "2px 4px", textAlign: "right", fontWeight: 700, borderBottom: "1px solid #bfdbfe" }}>VH</th>
              </tr>
            </thead>
            <tbody>
              {result.csv_details.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#f8fafc" : "#fff" }}>
                  <td style={{ padding: "2px 4px", borderBottom: "1px solid #e2e8f0", maxWidth: 70, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={row.Village_Name}>{row.Village_Name}</td>
                  <td style={{ padding: "2px 4px", textAlign: "right", borderBottom: "1px solid #e2e8f0" }}>{row.Very_Low?.toFixed(1)}</td>
                  <td style={{ padding: "2px 4px", textAlign: "right", borderBottom: "1px solid #e2e8f0" }}>{row.Low?.toFixed(1)}</td>
                  <td style={{ padding: "2px 4px", textAlign: "right", borderBottom: "1px solid #e2e8f0" }}>{row.Medium?.toFixed(1)}</td>
                  <td style={{ padding: "2px 4px", textAlign: "right", borderBottom: "1px solid #e2e8f0" }}>{row.High?.toFixed(1)}</td>
                  <td style={{ padding: "2px 4px", textAlign: "right", borderBottom: "1px solid #e2e8f0" }}>{row.Very_High?.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

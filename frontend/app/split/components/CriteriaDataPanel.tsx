"use client";

import { useEffect, useState } from "react";
import {
  CartesianGrid, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { DRAIN_CONFIGS } from "../../shared/map-layers/DrainWFSLayer";

const ZONE_PALETTE = ["#2563eb","#059669","#dc2626","#d97706","#7c3aed","#db2777","#0284c7","#0f766e"];

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9000";
const GEOSERVER = "http://localhost:9090/geoserver/dss_raster/wms";

/* ─── Tiny helpers ─────────────────────────────────────────────────────── */
function T({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: "0 0 5px", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#1d4ed8" }}>{children}</p>;
}
function Spin() {
  return <p style={{ fontSize: 9, color: "#2563eb", fontStyle: "italic" }}>Loading…</p>;
}
function Err({ msg }: { msg: string }) {
  return <p style={{ fontSize: 9, color: "#dc2626" }}>{msg}</p>;
}
function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <th style={{ padding: "2px 5px", textAlign: right ? "right" : "left", borderBottom: "1px solid #bfdbfe", background: "rgba(37,99,235,0.08)", whiteSpace: "nowrap", fontWeight: 700 }}>{children}</th>;
}
function Td({ children, bold }: { children: React.ReactNode; bold?: boolean }) {
  return <td style={{ padding: "2px 5px", borderBottom: "1px solid #e2e8f0", fontWeight: bold ? 700 : undefined, whiteSpace: "nowrap" }}>{children}</td>;
}
function Table({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ fontSize: 8, borderCollapse: "collapse", width: "100%", color: "#334155" }}>{children}</table>
    </div>
  );
}

/* ─── Flag SVG (matches DrainWFSLayer icon) ───────────────────────────── */
function FlagIcon({ color }: { color: string }) {
  return (
    <svg width="14" height="18" viewBox="0 0 22 32" style={{ flexShrink: 0 }}>
      <line x1="3.5" y1="1" x2="3.5" y2="32" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <polygon points="3.5,2 21,9 3.5,16" fill={color} opacity="0.93" />
      <circle cx="3.5" cy="32" r="2.2" fill={color} opacity="0.8" />
    </svg>
  );
}

/* ─── Rainfall recharts line chart — one line per zone, year on x-axis ─── */
function RainfallLineChart({ data }: { data: any }) {
  if (!data?.years?.length || !data?.by_zone) return null;
  const zones = Object.keys(data.by_zone);
  const sortedYears = [...data.years].map(Number).sort((a, b) => a - b);
  if (!zones.length || sortedYears.length < 2) return null;

  // Build [{ year:"2015", A:820, B:756, … }, …]
  const chartData = sortedYears.map((yr) => {
    const pt: Record<string, any> = { year: String(yr) };
    zones.forEach((z) => {
      const row = (data.by_zone[z] || []).find((r: any) => Number(r.year) === yr);
      if (row?.mean != null) pt[z] = Math.round(Number(row.mean) * 10) / 10;
    });
    return pt;
  });

  return (
    <div>
      <ResponsiveContainer width="100%" height={100}>
        <LineChart data={chartData} margin={{ top: 2, right: 4, bottom: 0, left: -24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.07)" />
          <XAxis dataKey="year" tick={{ fontSize: 7, fill: "#475569" }} interval={1} />
          <YAxis tick={{ fontSize: 7, fill: "#475569" }} />
          <Tooltip
            contentStyle={{ fontSize: 9, background: "#fff", border: "1px solid #bfdbfe", borderRadius: 5, padding: "3px 7px" }}
            labelStyle={{ color: "#1e40af", fontWeight: 700 }}
          />
          {zones.map((z, i) => (
            <Line key={z} type="monotone" dataKey={z} stroke={ZONE_PALETTE[i % ZONE_PALETTE.length]} strokeWidth={1.5} dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
      {/* Zone colour key */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 6px" }}>
          {zones.map((z, i) => (
            <span key={z} style={{ fontSize: 8, color: ZONE_PALETTE[i % ZONE_PALETTE.length] }}>● {z}</span>
          ))}
        </div>
        <span style={{ fontSize: 8, color: "#64748b" }}>mm/yr</span>
      </div>
    </div>
  );
}

/* ─── Groundwater recharts line chart — zones on x-axis, mean/min/max lines */
function RechargeLineChart({ data }: { data: any }) {
  if (!data?.by_zone) return null;
  const entries = Object.entries(data.by_zone) as [string, any][];
  if (!entries.length) return null;

  // Build [{ zone:"A", Mean:54, Min:1, Max:96 }, …]
  const chartData = entries.map(([zone, r]) => ({
    zone,
    Mean: r?.mean != null ? Math.round(Number(r.mean) * 100) / 100 : undefined,
    Min:  r?.min  != null ? Math.round(Number(r.min)  * 100) / 100 : undefined,
    Max:  r?.max  != null ? Math.round(Number(r.max)  * 100) / 100 : undefined,
  }));

  return (
    <div>
      <ResponsiveContainer width="100%" height={100}>
        <LineChart data={chartData} margin={{ top: 2, right: 4, bottom: 0, left: -24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.07)" />
          <XAxis dataKey="zone" tick={{ fontSize: 7, fill: "#475569" }} />
          <YAxis tick={{ fontSize: 7, fill: "#475569" }} />
          <Tooltip
            contentStyle={{ fontSize: 9, background: "#fff", border: "1px solid #bfdbfe", borderRadius: 5, padding: "3px 7px" }}
            labelStyle={{ color: "#1e40af", fontWeight: 700 }}
          />
          <Line type="monotone" dataKey="Mean" stroke="#2563eb" strokeWidth={1.5} dot={{ r: 2.5, fill: "#2563eb" }} />
          <Line type="monotone" dataKey="Min"  stroke="#059669" strokeWidth={1.2} dot={{ r: 2, fill: "#059669" }} strokeDasharray="3 2" />
          <Line type="monotone" dataKey="Max"  stroke="#dc2626" strokeWidth={1.2} dot={{ r: 2, fill: "#dc2626" }} strokeDasharray="3 2" />
        </LineChart>
      </ResponsiveContainer>
      <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
        {[["Mean","#2563eb"],["Min","#059669"],["Max","#dc2626"]].map(([k,c]) => (
          <span key={k} style={{ fontSize: 8, color: c }}>— {k}</span>
        ))}
        <span style={{ fontSize: 8, color: "#64748b", marginLeft: "auto" }}>mm</span>
      </div>
    </div>
  );
}

/* ─── Rainfall section ─────────────────────────────────────────────────── */
function RainfallSection({ selectedZones }: { selectedZones: string[] }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const zonesKey = selectedZones.join(",");

  useEffect(() => {
    if (!selectedZones.length) return;
    setLoading(true); setError("");
    fetch(`${BACKEND}/analysis/rainfall`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selected_zones: selectedZones }),
    })
      .then((r) => r.json())
      .then((d) => setData(d?.rainfall))
      .catch((e) => setError(e.message || "Failed"))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zonesKey]);

  return (
    <div>
      <T>Rainfall & Runoff</T>

      {loading ? <Spin /> : error ? <Err msg={error} /> : null}

      {/* Line chart — primary output */}
      {!loading && !error && data && <RainfallLineChart data={data} />}

      {/* Fallback table if chart can't render (e.g. single year) */}
      {!loading && !error && data?.by_zone && data?.years?.length === 1 ? (
        <Table>
          <thead><tr><Th>Zone</Th><Th right>Mean</Th><Th right>Min</Th><Th right>Max</Th></tr></thead>
          <tbody>
            {Object.entries(data.by_zone).map(([zone, rows]: [string, any]) => {
              const row = (rows || [])[0];
              return (
                <tr key={zone}>
                  <Td bold>{zone}</Td>
                  <Td>{row?.mean ?? "N/A"}</Td>
                  <Td>{row?.min ?? "N/A"}</Td>
                  <Td>{row?.max ?? "N/A"}</Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      ) : null}
    </div>
  );
}

/* ─── Groundwater section ──────────────────────────────────────────────── */
function GroundwaterSection({ selectedZones }: { selectedZones: string[] }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const zonesKey = selectedZones.join(",");

  useEffect(() => {
    if (!selectedZones.length) return;
    setLoading(true); setError("");
    fetch(`${BACKEND}/analysis/groundwater`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selected_zones: selectedZones }),
    })
      .then((r) => r.json())
      .then((d) => setData(d?.groundwater))
      .catch((e) => setError(e.message || "Failed"))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zonesKey]);

  return (
    <div>
      <T>Groundwater Recharge</T>
      {loading ? <Spin /> : error ? <Err msg={error} /> : null}

      {/* Line/range chart — primary output */}
      {!loading && !error && data && <RainfallLineChart data={data} />}


    </div>
  );
}

/* ─── Tributary & Drain section ────────────────────────────────────────── */
function TributarySection({ selectedZones }: { selectedZones: string[] }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const zonesKey = selectedZones.join(",");

  useEffect(() => {
    if (!selectedZones.length) return;
    setLoading(true); setError("");
    fetch(`${BACKEND}/analysis/tributary-drain`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selected_zones: selectedZones }),
    })
      .then((r) => r.json())
      .then((d) => setData(d?.tributary_drain))
      .catch((e) => setError(e.message || "Failed"))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zonesKey]);

  return (
    <div>
      <T>Tributary & Drain Flow</T>



      {loading ? <Spin /> : error ? <Err msg={error} /> : null}
      {!loading && !error && data?.layers?.length ? (
        <Table>
          <thead>
            <tr>
              <Th>Layer</Th>
              <Th right>Total</Th>
              {selectedZones.map((z) => <Th key={z} right>{z}</Th>)}
            </tr>
          </thead>
          <tbody>
            {data.layers.map((row: any) => {
              const cfg = DRAIN_CONFIGS.find((c) => c.typeName.endsWith(row.layer) || c.key === row.layer);
              return (
                <tr key={row.layer}>
                  <td style={{ padding: "2px 5px", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      {cfg && <FlagIcon color={cfg.color} />}
                      <span style={{ fontSize: 8 }}>{row.label || row.layer}</span>
                    </div>
                  </td>
                  <Td>{row.error ? "N/A" : row.intersecting_features}</Td>
                  {selectedZones.map((z) => (
                    <Td key={z}>{row.error ? "-" : (row.by_zone?.[z] ?? 0)}</Td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </Table>
      ) : null}
    </div>
  );
}

/* ─── DEM / Slope section ──────────────────────────────────────────────── */
function DemSlopeSection({ selectedZones }: { selectedZones: string[] }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const zonesKey = selectedZones.join(",");

  useEffect(() => {
    if (!selectedZones.length) return;
    setLoading(true); setError("");
    fetch(`${BACKEND}/analysis/dem-slope`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selected_zones: selectedZones }),
    })
      .then((r) => r.json())
      .then((d) => setData(d?.dem_slope))
      .catch((e) => setError(e.message || "Failed"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zonesKey]);

  const SLOPE_RANGES = [
    { label: "< 2°", color: "#15803d" },
    { label: "2-5°", color: "#22c55e" },
    { label: "5-10°", color: "#84cc16" },
    { label: "10-15°", color: "#facc15" },
    { label: "15-25°", color: "#f59e0b" },
    { label: "25-45°", color: "#ea580c" },
    { label: "> 45°", color: "#dc2626" },
  ];

  const DEM_RANGES = [
    { label: "< 100m", color: "#4c1d95" },
    { label: "100-250m", color: "#7c3aed" },
    { label: "250-400m", color: "#2563eb" },
    { label: "400-600m", color: "#0ea5e9" },
    { label: "600-800m", color: "#22d3ee" },
    { label: "800-1000m", color: "#a5f3fc" },
    { label: "1000-1200m", color: "#e0f2fe" },
    { label: "> 1200m", color: "#ffffff" },
  ];

  return (
    <div>
      <T>DEM / Slope Maps</T>
      <p style={{ fontSize: 8, color: "#475569", marginBottom: 8 }}>Restricted to selected zones with high-variance coloring.</p>

      {/* Custom Legends */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
        {/* Slope Legend */}
        <div>
          <p style={{ fontSize: 8, fontWeight: 700, color: "#64748b", marginBottom: 3, textTransform: "uppercase" }}>Slope Gradient (Degrees)</p>
          <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
            {SLOPE_RANGES.map((r) => (
              <div key={r.label} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                <div style={{ height: 14, background: r.color, borderRadius: 1 }} title={r.label} />
                <span style={{ fontSize: 8, color: "#475569", textAlign: "center", fontWeight: 500 }}>{r.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* DEM Legend */}
        <div>
          <p style={{ fontSize: 8, fontWeight: 700, color: "#64748b", marginBottom: 3, textTransform: "uppercase" }}>Elevation / DEM (Meters)</p>
          <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
            {DEM_RANGES.map((r) => (
              <div key={r.label} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                <div style={{ height: 14, background: r.color, borderRadius: 1 }} title={r.label} />
                <span style={{ fontSize: 8, color: "#475569", textAlign: "center", fontWeight: 500, whiteSpace: "nowrap" }}>{r.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {loading ? <Spin /> : error ? <Err msg={error} /> : null}

      {!loading && !error && data?.slope?.by_zone ? (
        <div style={{ marginBottom: 6 }}>
          <p style={{ fontSize: 8, fontWeight: 700, color: "#374151", marginBottom: 3 }}>Slope ({data.slope.coverage || ""})</p>
          <Table>
            <thead><tr><Th>Zone</Th><Th right>Mean</Th><Th right>Min</Th><Th right>Max</Th></tr></thead>
            <tbody>
              {Object.entries(data.slope.by_zone).map(([zone, row]: [string, any]) => (
                <tr key={zone}>
                  <Td bold>{zone}</Td>
                  <Td>{row?.mean ?? "N/A"}</Td>
                  <Td>{row?.min ?? "N/A"}</Td>
                  <Td>{row?.max ?? "N/A"}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      ) : null}

      {!loading && !error && data?.dem?.by_zone ? (
        <div>
          <p style={{ fontSize: 8, fontWeight: 700, color: "#374151", marginBottom: 3 }}>DEM ({data.dem.coverage || ""})</p>
          <Table>
            <thead><tr><Th>Zone</Th><Th right>Mean</Th><Th right>Min</Th><Th right>Max</Th></tr></thead>
            <tbody>
              {Object.entries(data.dem.by_zone).map(([zone, row]: [string, any]) => (
                <tr key={zone}>
                  <Td bold>{zone}</Td>
                  <Td>{row?.mean ?? "N/A"}</Td>
                  <Td>{row?.min ?? "N/A"}</Td>
                  <Td>{row?.max ?? "N/A"}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      ) : null}
    </div>
  );
}

/* ─── River water quality section ─────────────────────────────────────── */
function RwqSection({ selectedZones }: { selectedZones: string[] }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const zonesKey = selectedZones.join(",");

  useEffect(() => {
    if (!selectedZones.length) return;
    setLoading(true); setError("");
    fetch(`${BACKEND}/analysis/nirmal-rwq-stats`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selected_zones: selectedZones }),
    })
      .then((r) => r.json())
      .then((d) => setData(d?.rwq ?? null))
      .catch((e) => setError(e.message || "Failed"))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zonesKey]);

  // data = { monsoon: {zone: {mean,min,max}}, premonsoon: ..., postmonsoon: ... }
  return (
    <div>
      <T>River Water Quality</T>
      {loading ? <Spin /> : error ? <Err msg={error} /> : null}
      {!loading && !error && data && Object.entries(data).map(([season, byZone]: [string, any]) => (
        byZone && !byZone.error && (
          <div key={season} style={{ marginBottom: 6 }}>
            <p style={{ fontSize: 8, fontWeight: 700, color: "#374151", marginBottom: 2, textTransform: "capitalize" }}>{season}</p>
            <Table>
              <thead><tr><Th>Zone</Th><Th right>Mean</Th><Th right>Min</Th><Th right>Max</Th></tr></thead>
              <tbody>
                {Object.entries(byZone).map(([zone, row]: [string, any]) => (
                  <tr key={zone}>
                    <Td bold>{zone}</Td>
                    <Td>{row?.mean != null ? Number(row.mean).toFixed(2) : "N/A"}</Td>
                    <Td>{row?.min  != null ? Number(row.min).toFixed(2)  : "N/A"}</Td>
                    <Td>{row?.max  != null ? Number(row.max).toFixed(2)  : "N/A"}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )
      ))}
    </div>
  );
}

/* ─── Groundwater quality section ─────────────────────────────────────── */
function GwqSection({ selectedZones: _selectedZones }: { selectedZones: string[] }) {
  const GWQ_LEGEND = [
    { color: "#22c55e", label: "Excellent", range: "0.8 – 1" },
    { color: "#84cc16", label: "Good",      range: "0.6 – 0.8" },
    { color: "#facc15", label: "Moderate",  range: "0.4 – 0.6" },
    { color: "#f97316", label: "Poor",      range: "0.2 – 0.4" },
    { color: "#dc2626", label: "Critical",  range: "0 – 0.2" },
  ];
  return (
    <div>
      <T>Groundwater Quality (Nirmal Ganga)</T>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
        {GWQ_LEGEND.map(({ color, label, range }) => (
          <span key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 9, color: "#334155" }}>
            <span style={{ display: "inline-block", width: 16, height: 12, borderRadius: 2, border: "1px solid #cbd5e1", background: color, flexShrink: 0 }} />
            <span style={{ fontWeight: 600 }}>{label}</span>
            <span style={{ color: "#94a3b8" }}>({range})</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Industrial discharge section ────────────────────────────────────── */
function IndustrialSection({ selectedZones }: { selectedZones: string[] }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const zonesKey = selectedZones.join(",");

  useEffect(() => {
    if (!selectedZones.length) return;
    setLoading(true); setError("");
    fetch(`${BACKEND}/analysis/industrial-discharge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selected_zones: selectedZones }),
    })
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch((e) => setError(e.message || "Failed"))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zonesKey]);

  const layers: any[] = data?.layers ?? [];
  const total: number = data?.total ?? 0;
  const activeLayers = layers.filter((l: any) => l.count > 0);

  return (
    <div>
      <T>Industrial Discharge</T>
      {loading ? <Spin /> : error ? <Err msg={error} /> : null}
      {!loading && !error && layers.length > 0 && (
        <>
          {/* Legend */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 8px", marginBottom: 5 }}>
            {[["#22c55e","Green (low)"],["#f97316","Orange (med)"],["#ef4444","Red (high)"]].map(([c,l]) => (
              <span key={l} style={{ fontSize: 8, display: "flex", alignItems: "center", gap: 3 }}>
                <span style={{ display: "inline-block", width: 8, height: 8, background: c, flexShrink: 0 }} />{l}
              </span>
            ))}
          </div>
          <p style={{ fontSize: 8, color: "#64748b", marginBottom: 5 }}>{total} industries found across {activeLayers.length} layer(s)</p>
          {activeLayers.map((lyr: any) => (
            <div key={lyr.layer} style={{ marginBottom: 8 }}>
              <p style={{ fontSize: 8, fontWeight: 700, color: "#334155", marginBottom: 3 }}>
                {lyr.label} <span style={{ fontWeight: 400, color: "#94a3b8" }}>({lyr.count})</span>
              </p>
              {lyr.error ? (
                <p style={{ fontSize: 8, color: "#dc2626" }}>{lyr.error}</p>
              ) : (
                <div style={{ overflowX: "auto", maxHeight: 160, overflowY: "auto" }}>
                  <table style={{ fontSize: 8, borderCollapse: "collapse", width: "100%", color: "#334155" }}>
                    <thead>
                      <tr style={{ background: "#fff7ed" }}>
                        <th style={{ padding: "2px 5px", textAlign: "left", borderBottom: "1px solid #fed7aa", whiteSpace: "nowrap" }}>Name</th>
                        <th style={{ padding: "2px 5px", textAlign: "left", borderBottom: "1px solid #fed7aa", whiteSpace: "nowrap" }}>Type</th>
                        <th style={{ padding: "2px 5px", textAlign: "left", borderBottom: "1px solid #fed7aa", whiteSpace: "nowrap" }}>Cat.</th>
                        <th style={{ padding: "2px 5px", textAlign: "right", borderBottom: "1px solid #fed7aa", whiteSpace: "nowrap" }}>Dist (km)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lyr.records.map((rec: any, i: number) => {
                        const cat = (rec.category ?? "").toLowerCase();
                        const dotColor = cat === "red" ? "#ef4444" : cat === "orange" ? "#f97316" : "#22c55e";
                        return (
                          <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#fff7ed" }}>
                            <td style={{ padding: "2px 5px", borderBottom: "1px solid #fed7aa", maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={rec.name}>{rec.name ?? "—"}</td>
                            <td style={{ padding: "2px 5px", borderBottom: "1px solid #fed7aa", maxWidth: 70, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rec.type_of_industry ?? "—"}</td>
                            <td style={{ padding: "2px 5px", borderBottom: "1px solid #fed7aa" }}>
                              <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
                                {rec.category ?? "—"}
                              </span>
                            </td>
                            <td style={{ padding: "2px 5px", borderBottom: "1px solid #fed7aa", textAlign: "right" }}>{rec.dist_km != null ? Number(rec.dist_km).toFixed(2) : "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
          {activeLayers.length === 0 && (
            <p style={{ fontSize: 8, color: "#64748b", fontStyle: "italic" }}>No industries found in selected zones.</p>
          )}
        </>
      )}
    </div>
  );
}

/* ─── STP details section ──────────────────────────────────────────────── */
function StpSection({ selectedZones }: { selectedZones: string[] }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const zonesKey = selectedZones.join(",");

  useEffect(() => {
    if (!selectedZones.length) return;
    setLoading(true); setError("");
    fetch(`${BACKEND}/analysis/nirmal-stp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selected_zones: selectedZones }),
    })
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch((e) => setError(e.message || "Failed"))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zonesKey]);

  return (
    <div>
      <T>STP Details</T>
      {loading ? <Spin /> : error ? <Err msg={error} /> : null}
      {!loading && !error && data?.stps?.length > 0 && (
        <Table>
          <thead><tr><Th>Name</Th><Th right>Capacity (MLD)</Th></tr></thead>
          <tbody>
            {data.stps.slice(0, 10).map((s: any, i: number) => (
              <tr key={i}>
                <Td bold>{s.name ?? s.stp_name ?? "—"}</Td>
                <Td>{s.capacity_mld ?? s.mld ?? "—"}</Td>
              </tr>
            ))}
            {data.stps.length > 10 && (
              <tr><td colSpan={2} style={{ fontSize: 8, color: "#64748b", padding: "2px 5px" }}>+{data.stps.length - 10} more</td></tr>
            )}
          </tbody>
        </Table>
      )}
    </div>
  );
}

/* ─── Full criteria list per module (must match STAGE_CONFIGS in criteria-configs.ts) ── */
const MODULE_CRITERIA: Record<string, string[]> = {
  "Aviral Ganga": [
    "River flow (monthly)",
    "Tributary & drain flow",
    "Rainfall & runoff",
    "Groundwater recharge",
    "Channel geometry (width, depth)",
    "DEM, slope maps",
    "Surface flow direction & accumulation maps",
  ],
  "Nirmal Ganga": [
    "River water quality (BOD, DO, COD, pH, Turbidity)",
    "Groundwater quality",
    "STP details",
    "Drains & discharge points",
    "Industrial discharge",
    "Septage density",
    "Solid waste hotspots",
  ],
  "Jan Ganga": [
    "Population (urban/rural)",
    "Gram Panchayat data",
    "Fishing communities",
    "Public participation plans",
  ],
  "Arth Ganga": [
    "Agriculture (crop area, water demand)",
    "Irrigation dependency",
    "Tourism & cultural nodes",
    "Ghats & heritage sites",
    "Economic activity zones",
  ],
};

/* Criteria that can produce a raster per stage (matches STAGE_RASTER_CRITERIA) */
const RASTER_CRITERIA: Record<string, string[]> = {
  "Aviral Ganga": [
    "Rainfall & runoff",
    "Groundwater recharge",
    "DEM, slope maps",
    "Surface flow direction & accumulation maps",
  ],
  "Nirmal Ganga": [
    "River water quality (BOD, DO, COD, pH, Turbidity)",
    "Groundwater quality",
  ],
  "Jan Ganga": [],  // no raster criteria defined yet for stage 2
  "Arth Ganga": [], // no raster criteria defined yet for stage 3
};

/* ─── Population section ──────────────────────────────────────────────── */
function PopulationSection({ selectedZones }: { selectedZones: string[] }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const zonesKey = selectedZones.join(",");

  useEffect(() => {
    if (!selectedZones.length) return;
    setLoading(true); setError("");
    fetch(`${BACKEND}/analysis/population`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selected_zones: selectedZones }),
    })
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch((e) => setError(e.message || "Failed"))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zonesKey]);

  const records: any[] = data?.records ?? [];
  return (
    <div>
      <T>Population (Urban/Rural)</T>
      {loading ? <Spin /> : error ? <Err msg={error} /> : null}
      {!loading && !error && records.length > 0 && (
        <>
          <p style={{ fontSize: 8, color: "#64748b", marginBottom: 4 }}>{data.total} villages found</p>
          <div style={{ overflowX: "auto", maxHeight: 200, overflowY: "auto" }}>
            <table style={{ fontSize: 8, borderCollapse: "collapse", width: "100%", color: "#334155" }}>
              <thead>
                <tr style={{ background: "#f0fdf4" }}>
                  <th style={{ padding: "2px 4px", textAlign: "left", borderBottom: "1px solid #bbf7d0" }}>Village</th>
                  <th style={{ padding: "2px 4px", textAlign: "left", borderBottom: "1px solid #bbf7d0" }}>GP</th>
                  <th style={{ padding: "2px 4px", textAlign: "right", borderBottom: "1px solid #bbf7d0" }}>Pop.</th>
                  <th style={{ padding: "2px 4px", textAlign: "right", borderBottom: "1px solid #bbf7d0" }}>HH</th>
                </tr>
              </thead>
              <tbody>
                {records.slice(0, 30).map((r: any, i: number) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f0fdf4" }}>
                    <td style={{ padding: "2px 4px", borderBottom: "1px solid #dcfce7", maxWidth: 70, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.village}>{r.village || "—"}</td>
                    <td style={{ padding: "2px 4px", borderBottom: "1px solid #dcfce7", maxWidth: 60, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.gram_panchayat || "—"}</td>
                    <td style={{ padding: "2px 4px", borderBottom: "1px solid #dcfce7", textAlign: "right" }}>{r.total_population ?? "—"}</td>
                    <td style={{ padding: "2px 4px", borderBottom: "1px solid #dcfce7", textAlign: "right" }}>{r.total_households ?? "—"}</td>
                  </tr>
                ))}
                {records.length > 30 && (
                  <tr><td colSpan={4} style={{ fontSize: 8, color: "#64748b", padding: "2px 4px" }}>+{records.length - 30} more</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Gram Panchayat section ──────────────────────────────────────────── */
function GramPanchayatSection({ selectedZones }: { selectedZones: string[] }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const zonesKey = selectedZones.join(",");

  useEffect(() => {
    if (!selectedZones.length) return;
    setLoading(true); setError("");
    fetch(`${BACKEND}/analysis/gram-panchayat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selected_zones: selectedZones }),
    })
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch((e) => setError(e.message || "Failed"))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zonesKey]);

  const records: any[] = data?.records ?? [];
  return (
    <div>
      <T>Gram Panchayat Data</T>
      {loading ? <Spin /> : error ? <Err msg={error} /> : null}
      {!loading && !error && records.length > 0 && (
        <>
          <p style={{ fontSize: 8, color: "#64748b", marginBottom: 4 }}>{data.total} panchayats found</p>
          <div style={{ overflowX: "auto", maxHeight: 200, overflowY: "auto" }}>
            <table style={{ fontSize: 8, borderCollapse: "collapse", width: "100%", color: "#334155" }}>
              <thead>
                <tr style={{ background: "#f0fdf4" }}>
                  <th style={{ padding: "2px 4px", textAlign: "left", borderBottom: "1px solid #bbf7d0" }}>Name</th>
                  <th style={{ padding: "2px 4px", textAlign: "left", borderBottom: "1px solid #bbf7d0" }}>Zone</th>
                </tr>
              </thead>
              <tbody>
                {records.slice(0, 30).map((r: any, i: number) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f0fdf4" }}>
                    <td style={{ padding: "2px 4px", borderBottom: "1px solid #dcfce7", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.name}>{r.name || "—"}</td>
                    <td style={{ padding: "2px 4px", borderBottom: "1px solid #dcfce7" }}>{r.zone || "—"}</td>
                  </tr>
                ))}
                {records.length > 30 && (
                  <tr><td colSpan={2} style={{ fontSize: 8, color: "#64748b", padding: "2px 4px" }}>+{records.length - 30} more</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Combined Output weight panel ────────────────────────────────────── */
function CombinedWeightPanel({
  selectedZones,
  backendBase,
  activeModule,
  onCombinedTiffUpdate,
}: {
  selectedZones: string[];
  backendBase: string;
  activeModule: "Aviral Ganga" | "Nirmal Ganga" | "Jan Ganga" | "Arth Ganga" | "STP Suitability";
  onCombinedTiffUpdate?: (tiff: ArrayBuffer) => void;
}) {
  const stageIndex = activeModule === "Nirmal Ganga" ? 1 : activeModule === "Jan Ganga" ? 2 : activeModule === "Arth Ganga" ? 3 : 0;
  const allCriteria = MODULE_CRITERIA[activeModule] ?? [];
  const rasterCriteria = RASTER_CRITERIA[activeModule] ?? [];

  const [selected, setSelected] = useState<string[]>([]);
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pre-populate from last holistic run on mount
  useEffect(() => {
    fetch(`${backendBase}/analysis/phase-raster-meta/${stageIndex}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (!d) return;
        if (Array.isArray(d.criteria) && d.criteria.length > 0) setSelected(d.criteria);
        if (d.weights && typeof d.weights === "object") {
          // weights in meta are normalised (0–1), convert back to 1–10 scale for sliders
          const raw = d.weights as Record<string, number>;
          const max = Math.max(...Object.values(raw));
          const scaled = Object.fromEntries(
            Object.entries(raw).map(([k, v]) => [k, max > 0 ? Math.round((v / max) * 9) + 1 : 5])
          );
          setWeights(scaled);
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleCriterion = (c: string) =>
    setSelected((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);

  const hasRaster = selected.some((c) => rasterCriteria.includes(c));
  const totalW = selected.reduce((s, c) => s + (weights[c] ?? 5), 0);

  const handleGenerate = async () => {
    if (!selectedZones.length || !selected.length) return;
    setLoading(true); setError("");
    try {
      const total = selected.reduce((s, c) => s + (weights[c] ?? 5), 0) || 1;
      const normalised = Object.fromEntries(selected.map((c) => [c, (weights[c] ?? 5) / total]));
      const res = await fetch(`${backendBase}/analysis/phase-raster`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage_index: stageIndex, selected_zones: selectedZones, criteria_weights: normalised }),
      });
      if (!res.ok) { setError("Generation failed"); return; }
      const blob = await res.blob();

      const fd = new FormData();
      fd.append("tiff", blob, `phase_raster_${stageIndex}.tif`);
      fd.append("stage_index", String(stageIndex));
      fd.append("stage_name", activeModule);
      fd.append("criteria", JSON.stringify(selected));
      fd.append("weights", JSON.stringify(normalised));
      await fetch(`${backendBase}/analysis/save-phase-raster`, { method: "POST", body: fd });

      const tiffRes = await fetch(`${backendBase}/analysis/phase-raster-tiff/${stageIndex}`);
      if (tiffRes.ok) {
        const buf = await tiffRes.arrayBuffer();
        onCombinedTiffUpdate?.(buf);
      }
    } catch (e: any) {
      setError(e.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  if (!allCriteria.length) return null;

  return (
    <div style={{ borderRadius: 8, border: "1px solid #bae6fd", background: "#f0f9ff", padding: "8px" }}>
      {/* Criteria checkboxes */}
      <p style={{ margin: "0 0 5px", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#0369a1" }}>Select criteria to proceed</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 8 }}>
        {allCriteria.map((c) => (
          <label key={c} style={{ display: "flex", alignItems: "flex-start", gap: 5, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={selected.includes(c)}
              onChange={() => toggleCriterion(c)}
              style={{ accentColor: "#0369a1", marginTop: 1, flexShrink: 0 }}
            />
            <span style={{ fontSize: 8, color: "#334155", lineHeight: 1.4 }}>{c}</span>
          </label>
        ))}
      </div>

      {/* Weight sliders — only when something is selected */}
      {selected.length > 0 && (
        <>
          <div style={{ borderTop: "1px solid #bae6fd", paddingTop: 6, marginBottom: 6 }}>
            <p style={{ margin: "0 0 4px", fontSize: 9, fontWeight: 700, color: "#0369a1" }}>Adjust Criteria Weights</p>
            <p style={{ margin: "0 0 5px", fontSize: 8, color: "#64748b" }}>Move a slider to set influence. The % shown is each criterion's share of the total.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {selected.map((c) => {
                const val = weights[c] ?? 5;
                const pct = totalW > 0 ? Math.round((val / totalW) * 100) : 0;
                return (
                  <div key={c}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
                      <span style={{ fontSize: 8, fontWeight: 600, color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{c}</span>
                      <div style={{ display: "flex", flexShrink: 0, alignItems: "center", gap: 3 }}>
                        <span style={{ fontSize: 8, fontWeight: 700, background: "#e0f2fe", color: "#0369a1", borderRadius: 3, padding: "0 3px" }}>{val}</span>
                        <span style={{ fontSize: 8, fontWeight: 700, background: "#0369a1", color: "#fff", borderRadius: 3, padding: "0 3px" }}>{pct}%</span>
                      </div>
                    </div>
                    <input
                      type="range" min={1} max={10} step={1} value={val}
                      onChange={(e) => setWeights((prev) => ({ ...prev, [c]: Number(e.target.value) }))}
                      style={{ width: "100%", height: 3, accentColor: "#0369a1" }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {!hasRaster ? (
            <p style={{ fontSize: 8, color: "#64748b", background: "#f1f5f9", borderRadius: 4, padding: "4px 6px", textAlign: "center" }}>
              Raster analysis not yet available for the selected criteria.
            </p>
          ) : (
            <>
              {error && <p style={{ fontSize: 8, color: "#dc2626", marginBottom: 4 }}>{error}</p>}
              <button
                type="button"
                disabled={loading || selectedZones.length === 0}
                onClick={handleGenerate}
                style={{
                  width: "100%", padding: "5px 0", fontSize: 9, fontWeight: 700,
                  background: loading || !selectedZones.length ? "#cbd5e1" : "#0369a1",
                  color: "#fff", border: "none", borderRadius: 6, cursor: loading ? "wait" : "pointer",
                }}
              >
                {loading ? "Generating…" : "Generate"}
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Root export ──────────────────────────────────────────────────────── */
type Props = {
  activeCriteria: string[];
  selectedZones: string[];
  activeModule?: "Aviral Ganga" | "Nirmal Ganga" | "Jan Ganga" | "Arth Ganga" | "STP Suitability";
  backendBase?: string;
  onCombinedTiffUpdate?: (tiff: ArrayBuffer) => void;
};

export default function CriteriaDataPanel({ activeCriteria, selectedZones, activeModule = "Aviral Ganga" as "Aviral Ganga" | "Nirmal Ganga" | "Jan Ganga" | "Arth Ganga" | "STP Suitability", backendBase = "", onCombinedTiffUpdate }: Props) {
  return (
    <div style={{ width: "100%", height: "100%", overflowY: "auto", background: "#f0f6ff", borderLeft: "1px solid #bfdbfe", padding: "6px", display: "flex", flexDirection: "column", gap: 10 }}>
      {activeCriteria.includes("Rainfall & runoff") && <RainfallSection selectedZones={selectedZones} />}
      {activeCriteria.includes("Groundwater recharge") && <GroundwaterSection selectedZones={selectedZones} />}
      {(activeCriteria.includes("Tributary & drain flow") || activeCriteria.includes("Drains & discharge points")) && <TributarySection selectedZones={selectedZones} />}
      {activeCriteria.includes("DEM, slope maps") && <DemSlopeSection selectedZones={selectedZones} />}
      {activeCriteria.includes("River water quality") && <RwqSection selectedZones={selectedZones} />}
      {activeCriteria.includes("Groundwater quality") && <GwqSection selectedZones={selectedZones} />}
      {activeCriteria.includes("Industrial discharge") && <IndustrialSection selectedZones={selectedZones} />}
      {activeCriteria.includes("STP details") && <StpSection selectedZones={selectedZones} />}
      {activeCriteria.includes("Population (urban/rural)") && <PopulationSection selectedZones={selectedZones} />}
      {activeCriteria.includes("Gram Panchayat data") && <GramPanchayatSection selectedZones={selectedZones} />}
      {activeCriteria.includes("Combined Output") && backendBase && (
        <CombinedWeightPanel
          selectedZones={selectedZones}
          backendBase={backendBase}
          activeModule={activeModule}
          onCombinedTiffUpdate={onCombinedTiffUpdate}
        />
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  CartesianGrid, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { DRAIN_CONFIGS } from "./DrainWFSLayer";

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

/* ─── Root export ──────────────────────────────────────────────────────── */
type Props = {
  activeCriteria: string[];
  selectedZones: string[];
};

export default function CriteriaDataPanel({ activeCriteria, selectedZones }: Props) {
  return (
    <div style={{ width: "100%", height: "100%", overflowY: "auto", background: "#f0f6ff", borderLeft: "1px solid #bfdbfe", padding: "6px", display: "flex", flexDirection: "column", gap: 10 }}>
      {activeCriteria.includes("Rainfall & runoff") && <RainfallSection selectedZones={selectedZones} />}
      {activeCriteria.includes("Groundwater recharge") && <GroundwaterSection selectedZones={selectedZones} />}
      {activeCriteria.includes("Tributary & drain flow") && <TributarySection selectedZones={selectedZones} />}
      {activeCriteria.includes("DEM, slope maps") && <DemSlopeSection selectedZones={selectedZones} />}
    </div>
  );
}

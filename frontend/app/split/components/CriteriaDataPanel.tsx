"use client";

import { useEffect, useRef, useState } from "react";
import {
  CartesianGrid, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

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

/* ─── River Flow zonal stats section ──────────────────────────────────── */
function RiverFlowSection({ selectedZones }: { selectedZones: string[] }) {
  const [stats, setStats] = useState<Record<string, { mean: number | null; min: number | null; max: number | null }> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const zonesKey = selectedZones.join(",");

  useEffect(() => {
    if (!selectedZones.length) return;
    setLoading(true); setError("");
    fetch(`${BACKEND}/analysis/river-flow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selected_zones: selectedZones }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d?.river_flow?.by_zone) setStats(d.river_flow.by_zone);
        else setError(d?.detail || "No data returned");
      })
      .catch((e) => setError(e.message || "Failed"))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zonesKey]);

  return (
    <div style={{ marginTop: 8, borderRadius: 8, border: "1px solid #bfdbfe", background: "#eff6ff", padding: "8px 10px" }}>
      <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: "#1e3a8a" }}>River Flow — Zonal Stats (dss_raster:river_flow_1)</p>
      {loading ? <Spin /> : error ? <Err msg={error} /> : null}
      {!loading && !error && stats && (
        <div style={{ overflowX: "auto", borderRadius: 4, border: "1px solid #bfdbfe", background: "#fff" }}>
          <Table>
            <thead>
              <tr style={{ background: "#dbeafe" }}>
                <th style={{ padding: "2px 6px", textAlign: "left", fontSize: 9, fontWeight: 700, borderBottom: "1px solid #bfdbfe" }}>Zone</th>
                <th style={{ padding: "2px 6px", textAlign: "right", fontSize: 9, fontWeight: 700, borderBottom: "1px solid #bfdbfe" }}>Mean</th>
                <th style={{ padding: "2px 6px", textAlign: "right", fontSize: 9, fontWeight: 700, borderBottom: "1px solid #bfdbfe" }}>Min</th>
                <th style={{ padding: "2px 6px", textAlign: "right", fontSize: 9, fontWeight: 700, borderBottom: "1px solid #bfdbfe" }}>Max</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats).map(([zone, s], i) => (
                <tr key={zone} style={{ background: i % 2 === 0 ? "#fff" : "#eff6ff" }}>
                  <td style={{ padding: "2px 6px", fontSize: 9, fontWeight: 600, borderBottom: "1px solid #e2e8f0" }}>{zone}</td>
                  <td style={{ padding: "2px 6px", fontSize: 9, textAlign: "right", borderBottom: "1px solid #e2e8f0" }}>{s.mean != null ? s.mean.toFixed(4) : "—"}</td>
                  <td style={{ padding: "2px 6px", fontSize: 9, textAlign: "right", borderBottom: "1px solid #e2e8f0" }}>{s.min != null ? s.min.toFixed(4) : "—"}</td>
                  <td style={{ padding: "2px 6px", fontSize: 9, textAlign: "right", borderBottom: "1px solid #e2e8f0" }}>{s.max != null ? s.max.toFixed(4) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  );
}

/* ─── Drain Flow zonal stats section ──────────────────────────────────── */
function DrainFlowSection({ selectedZones }: { selectedZones: string[] }) {
  const [stats, setStats] = useState<Record<string, { mean: number | null; min: number | null; max: number | null }> | null>(null);
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
      .then((d) => {
        if (d?.drain_flow?.by_zone) setStats(d.drain_flow.by_zone);
        else setError(d?.detail || "No data returned");
      })
      .catch((e) => setError(e.message || "Failed"))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zonesKey]);

  return (
    <div style={{ marginTop: 8, borderRadius: 8, border: "1px solid #99f6e4", background: "#f0fdfa", padding: "8px 10px" }}>
      <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: "#134e4a" }}>Drain Flow — Zonal Stats (dss_raster:drain_flow_1)</p>
      {loading ? <Spin /> : error ? <Err msg={error} /> : null}
      {!loading && !error && stats && (
        <div style={{ overflowX: "auto", borderRadius: 4, border: "1px solid #99f6e4", background: "#fff" }}>
          <Table>
            <thead>
              <tr style={{ background: "#ccfbf1" }}>
                <th style={{ padding: "2px 6px", textAlign: "left", fontSize: 9, fontWeight: 700, borderBottom: "1px solid #99f6e4" }}>Zone</th>
                <th style={{ padding: "2px 6px", textAlign: "right", fontSize: 9, fontWeight: 700, borderBottom: "1px solid #99f6e4" }}>Mean</th>
                <th style={{ padding: "2px 6px", textAlign: "right", fontSize: 9, fontWeight: 700, borderBottom: "1px solid #99f6e4" }}>Min</th>
                <th style={{ padding: "2px 6px", textAlign: "right", fontSize: 9, fontWeight: 700, borderBottom: "1px solid #99f6e4" }}>Max</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats).map(([zone, s], i) => (
                <tr key={zone} style={{ background: i % 2 === 0 ? "#fff" : "#f0fdfa" }}>
                  <td style={{ padding: "2px 6px", fontSize: 9, fontWeight: 600, borderBottom: "1px solid #e2e8f0" }}>{zone}</td>
                  <td style={{ padding: "2px 6px", fontSize: 9, textAlign: "right", borderBottom: "1px solid #e2e8f0" }}>{s.mean != null ? s.mean.toFixed(4) : "—"}</td>
                  <td style={{ padding: "2px 6px", fontSize: 9, textAlign: "right", borderBottom: "1px solid #e2e8f0" }}>{s.min != null ? s.min.toFixed(4) : "—"}</td>
                  <td style={{ padding: "2px 6px", fontSize: 9, textAlign: "right", borderBottom: "1px solid #e2e8f0" }}>{s.max != null ? s.max.toFixed(4) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  );
}

/* ─── Channel Geometry zonal stats section ─────────────────────────────── */
function ChannelGeomSection({ selectedZones }: { selectedZones: string[] }) {
  const [stats, setStats] = useState<Record<string, { mean: number | null; min: number | null; max: number | null }> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const zonesKey = selectedZones.join(",");

  useEffect(() => {
    if (!selectedZones.length) return;
    setLoading(true); setError("");
    fetch(`${BACKEND}/analysis/channel-geometry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selected_zones: selectedZones }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d?.channel_geometry?.by_zone) setStats(d.channel_geometry.by_zone);
        else setError(d?.detail || "No data returned");
      })
      .catch((e) => setError(e.message || "Failed"))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zonesKey]);

  return (
    <div style={{ marginTop: 8, borderRadius: 8, border: "1px solid #c7d2fe", background: "#eef2ff", padding: "8px 10px" }}>
      <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: "#3730a3" }}>Channel Geometry — Zonal Stats (dss_raster:channel_1)</p>
      {loading ? <Spin /> : error ? <Err msg={error} /> : null}
      {!loading && !error && stats && (
        <div style={{ overflowX: "auto", borderRadius: 4, border: "1px solid #c7d2fe", background: "#fff" }}>
          <Table>
            <thead>
              <tr style={{ background: "#e0e7ff" }}>
                <th style={{ padding: "2px 6px", textAlign: "left", fontSize: 9, fontWeight: 700, borderBottom: "1px solid #c7d2fe" }}>Zone</th>
                <th style={{ padding: "2px 6px", textAlign: "right", fontSize: 9, fontWeight: 700, borderBottom: "1px solid #c7d2fe" }}>Mean</th>
                <th style={{ padding: "2px 6px", textAlign: "right", fontSize: 9, fontWeight: 700, borderBottom: "1px solid #c7d2fe" }}>Min</th>
                <th style={{ padding: "2px 6px", textAlign: "right", fontSize: 9, fontWeight: 700, borderBottom: "1px solid #c7d2fe" }}>Max</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats).map(([zone, s], i) => (
                <tr key={zone} style={{ background: i % 2 === 0 ? "#fff" : "#eef2ff" }}>
                  <td style={{ padding: "2px 6px", fontSize: 9, fontWeight: 600, borderBottom: "1px solid #e2e8f0" }}>{zone}</td>
                  <td style={{ padding: "2px 6px", fontSize: 9, textAlign: "right", borderBottom: "1px solid #e2e8f0" }}>{s.mean != null ? s.mean.toFixed(4) : "—"}</td>
                  <td style={{ padding: "2px 6px", fontSize: 9, textAlign: "right", borderBottom: "1px solid #e2e8f0" }}>{s.min != null ? s.min.toFixed(4) : "—"}</td>
                  <td style={{ padding: "2px 6px", fontSize: 9, textAlign: "right", borderBottom: "1px solid #e2e8f0" }}>{s.max != null ? s.max.toFixed(4) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
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
  "Gyan Ganga": [
    "All baseline datasets",
    "Remote sensing + GIS maps",
    "SWAT model outputs",
    "Hydrogeology (aquifer, MAR, paleo-channels)",
    "Monitoring stations & sensors",
  ],
  "Jeevant Ganga": [
    "Wetlands, ponds, lakes",
    "Riparian vegetation",
    "Biodiversity (fish, birds, invasive species)",
    "Floodplain & habitat data",
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
  "Jan Ganga": [],
  "Arth Ganga": [
    "Agriculture (crop area, water demand)",
    "Irrigation dependency",
    "Tourism & cultural nodes",
    "Ghats & heritage sites",
    "Economic activity zones",
  ],
  "Gyan Ganga": [
    "All baseline datasets",
    "Remote sensing + GIS maps",
    "SWAT model outputs",
    "Hydrogeology (aquifer, MAR, paleo-channels)",
    "Monitoring stations & sensors",
  ],
  "Jeevant Ganga": [
    "Wetlands, ponds, lakes",
    "Riparian vegetation",
    "Biodiversity (fish, birds, invasive species)",
    "Floodplain & habitat data",
  ],
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

/* ─── Shared weight slider card (used in both /split and /holistic) ─────── */
export function WeightSliderCard({
  criterion,
  value,
  normalizedWeight,
  locked,
  checked,
  onToggleCheck,
  onToggleLock,
  onChange,
}: {
  criterion: string;
  value: number;
  normalizedWeight: number;
  locked: boolean;
  checked: boolean;
  onToggleCheck: () => void;
  onToggleLock: () => void;
  onChange: (v: number) => void;
}) {
  const pct = ((value - 1) / 9) * 100;
  return (
    <div style={{
      background: "#fff",
      border: "1.5px solid #e2e8f0",
      borderRadius: 12,
      padding: "10px 12px 8px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      overflow: "visible",
    }}>
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggleCheck}
          style={{ accentColor: "#10b981", width: 14, height: 14, flexShrink: 0, cursor: "pointer" }}
        />
        {/* Lock button */}
        <button
          type="button"
          onClick={onToggleLock}
          title={locked ? "Unlock" : "Lock"}
          style={{
            flexShrink: 0, width: 20, height: 20, borderRadius: 5, cursor: "pointer",
            border: `1.5px solid ${locked ? "#94a3b8" : "#10b981"}`,
            background: locked ? "#f1f5f9" : "#ecfdf5",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {locked ? (
            <svg width="9" height="10" viewBox="0 0 14 16" fill="none">
              <rect x="2" y="7" width="10" height="8" rx="2" stroke="#94a3b8" strokeWidth="1.8"/>
              <path d="M4.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="9" height="10" viewBox="0 0 14 16" fill="none">
              <rect x="2" y="7" width="10" height="8" rx="2" stroke="#10b981" strokeWidth="1.8"/>
              <path d="M4.5 7V5a2.5 2.5 0 0 1 5 0" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          )}
        </button>
        {/* Name */}
        <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: checked ? "#1e293b" : "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {criterion}
        </span>
        {/* Weight badge */}
        <span style={{
          flexShrink: 0, fontSize: 10, fontWeight: 700,
          border: "1.5px solid #bae6fd", borderRadius: 6,
          padding: "1px 7px", color: "#0369a1", background: "#f0f9ff",
          letterSpacing: "0.02em",
        }}>
          Weight&nbsp;&nbsp;<span style={{ fontWeight: 800 }}>{normalizedWeight.toFixed(4)}</span>
        </span>
      </div>

      {/* Slider row */}
      <div style={{ position: "relative", paddingTop: 10, paddingBottom: 18 }}>
        {/* Gradient track bg */}
        <div style={{
          position: "absolute", top: 16, left: 0, right: 0, height: 8, borderRadius: 4,
          background: "linear-gradient(90deg, #ef4444 0%, #f97316 25%, #facc15 50%, #84cc16 75%, #22c55e 100%)",
          opacity: checked ? 1 : 0.3,
        }} />
        {/* Value bubble */}
        <div style={{
          position: "absolute",
          top: 6,
          left: `calc(${pct}% - 12px)`,
          width: 24, height: 24, borderRadius: "50%",
          background: checked ? "#10b981" : "#94a3b8",
          border: "3px solid #fff",
          boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
          display: "flex", alignItems: "center", justifyContent: "center",
          pointerEvents: "none",
          zIndex: 2,
          transition: "left 0.05s",
        }}>
          <span style={{ fontSize: 8, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{value}</span>
        </div>
        {/* Native range overlaid */}
        <input
          type="range" min={1} max={10} step={1} value={value}
          disabled={locked || !checked}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            position: "absolute", top: 10, left: 0, width: "100%", height: 20,
            opacity: 0, cursor: locked || !checked ? "not-allowed" : "pointer",
            zIndex: 3, margin: 0,
          }}
        />
        {/* Min / Max labels */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 9, color: "#94a3b8" }}>1 Least</span>
          <span style={{ fontSize: 9, color: "#94a3b8" }}>10 Most</span>
        </div>
      </div>
    </div>
  );
}

type CombinedMeta = { stage_name: string; criteria: string[]; weights: Record<string, number>; generated_at: number } | null;

/* ─── Combined Output weight panel ────────────────────────────────────── */
function CombinedWeightPanel({
  selectedZones,
  backendBase,
  activeModule,
  combinedMeta,
  onViewerTiffUpdate,
  onPresentToMain,
}: {
  selectedZones: string[];
  backendBase: string;
  activeModule: "Aviral Ganga" | "Nirmal Ganga" | "Jan Ganga" | "Arth Ganga" | "Gyan Ganga" | "Jeevant Ganga" | "STP Suitability";
  combinedMeta?: CombinedMeta;
  onViewerTiffUpdate?: (tiff: ArrayBuffer | null) => void;
  onPresentToMain?: (tiff: ArrayBuffer) => void;
}) {
  const stageIndex = activeModule === "Nirmal Ganga" ? 1 : activeModule === "Jan Ganga" ? 2 : activeModule === "Arth Ganga" ? 3 : activeModule === "Gyan Ganga" ? 4 : activeModule === "Jeevant Ganga" ? 5 : 0;
  const allCriteria = MODULE_CRITERIA[activeModule] ?? [];
  const rasterCriteria = RASTER_CRITERIA[activeModule] ?? [];

  const [selected, setSelected] = useState<string[]>([]);
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [locked, setLocked] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Local tiff — only shown on this viewer's map until user clicks "Show on Main Map"
  const [localTiff, setLocalTiff] = useState<ArrayBuffer | null>(null);
  const [shownOnMain, setShownOnMain] = useState(false);

  // When meta arrives from /holistic, pre-seed selected criteria + raw weights
  const seededMetaRef = useRef<number | null>(null);
  useEffect(() => {
    if (!combinedMeta) return;
    if (seededMetaRef.current === combinedMeta.generated_at) return;
    seededMetaRef.current = combinedMeta.generated_at;
    const vals = Object.values(combinedMeta.weights);
    const maxVal = Math.max(...vals, 0.0001);
    const rescaled: Record<string, number> = {};
    for (const [c, w] of Object.entries(combinedMeta.weights)) {
      rescaled[c] = Math.max(1, Math.min(10, Math.round((w / maxVal) * 9) + 1));
    }
    setSelected(combinedMeta.criteria.filter((c) => allCriteria.includes(c)));
    setWeights(rescaled);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combinedMeta]);

  const toggleCriterion = (c: string) =>
    setSelected((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  const toggleLock = (c: string) =>
    setLocked((prev) => ({ ...prev, [c]: !prev[c] }));

  const allLocked = selected.length > 0 && selected.every((c) => locked[c]);
  const totalW = selected.reduce((s, c) => s + (weights[c] ?? 5), 0) || 1;
  const hasRaster = selected.some((c) => rasterCriteria.includes(c));

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
      const buf = await res.arrayBuffer();

      // Save meta to backend so other viewers can read it
      const fd = new FormData();
      fd.append("tiff", new Blob([buf], { type: "image/tiff" }), `phase_raster_${stageIndex}.tif`);
      fd.append("stage_index", String(stageIndex));
      fd.append("stage_name", activeModule);
      fd.append("criteria", JSON.stringify(selected));
      fd.append("weights", JSON.stringify(normalised));
      await fetch(`${backendBase}/analysis/save-phase-raster`, { method: "POST", body: fd });

      // Show only on this viewer's map — user must click "Show on Main Map" explicitly
      setLocalTiff(buf);
      setShownOnMain(false);
      onViewerTiffUpdate?.(buf);
    } catch (e: any) {
      setError(e.message || "Error");
    } finally {
      setLoading(false);
    }
  };



  if (!allCriteria.length) return null;

  return (
    <div style={{ borderRadius: 12, border: "1.5px solid #e2e8f0", background: "#f8fafc", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "8px 12px", background: "#fff", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#0f172a" }}>Selected Categories</span>
          <span style={{ fontSize: 10, fontWeight: 700, background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 20, padding: "1px 8px", color: "#475569" }}>
            {selected.length}/{allCriteria.length}
          </span>
        </div>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          <button
            type="button"
            onClick={() => {
              const next = !allLocked;
              const m: Record<string, boolean> = {};
              selected.forEach((c) => { m[c] = next; });
              setLocked(m);
            }}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 600, cursor: "pointer",
              border: `1.5px solid ${allLocked ? "#94a3b8" : "#10b981"}`,
              background: allLocked ? "#f1f5f9" : "#ecfdf5",
              color: allLocked ? "#64748b" : "#059669",
            }}
          >
            {allLocked ? (
              <svg width="9" height="9" viewBox="0 0 14 16" fill="none"><rect x="2" y="7" width="10" height="8" rx="2" stroke="#94a3b8" strokeWidth="1.8"/><path d="M4.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round"/></svg>
            ) : (
              <svg width="9" height="9" viewBox="0 0 14 16" fill="none"><rect x="2" y="7" width="10" height="8" rx="2" stroke="#10b981" strokeWidth="1.8"/><path d="M4.5 7V5a2.5 2.5 0 0 1 5 0" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round"/></svg>
            )}
            {allLocked ? "Locked" : "Unlocked"}
          </button>
          <button type="button" onClick={() => setSelected(allCriteria.slice())} style={{ padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 600, cursor: "pointer", border: "1.5px solid #e2e8f0", background: "#fff", color: "#475569" }}>Select All</button>
          <button type="button" onClick={() => { setSelected([]); setLocked({}); setLocalTiff(null); onViewerTiffUpdate?.(null); }} style={{ padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700, cursor: "pointer", border: "1.5px solid #ef4444", background: "#ef4444", color: "#fff" }}>Clear</button>
          <button type="button" onClick={() => setWeights({})} style={{ padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 600, cursor: "pointer", border: "1.5px solid #e2e8f0", background: "#fff", color: "#475569" }}>Reset</button>
        </div>
      </div>

      {/* Slider cards */}
      <div style={{ padding: "10px 10px", display: "flex", flexDirection: "column", gap: 8 }}>
        {allCriteria.map((c) => {
          const val = weights[c] ?? 5;
          const normW = val / totalW;
          return (
            <WeightSliderCard
              key={c}
              criterion={c}
              value={val}
              normalizedWeight={normW}
              locked={!!locked[c]}
              checked={selected.includes(c)}
              onToggleCheck={() => toggleCriterion(c)}
              onToggleLock={() => toggleLock(c)}
              onChange={(v) => setWeights((prev) => ({ ...prev, [c]: v }))}
            />
          );
        })}

        {/* Generate + Show on Main Map */}
        {selected.length > 0 && (
          <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 6 }}>
            {!hasRaster ? (
              <p style={{ fontSize: 9, color: "#64748b", background: "#f1f5f9", borderRadius: 6, padding: "6px 10px", textAlign: "center" }}>
                Raster analysis not yet available for the selected criteria.
              </p>
            ) : (
              <>
                {error && <p style={{ fontSize: 9, color: "#dc2626", background: "#fef2f2", borderRadius: 6, padding: "4px 8px" }}>{error}</p>}
                <button
                  type="button"
                  disabled={loading || selectedZones.length === 0}
                  onClick={handleGenerate}
                  style={{
                    width: "100%", padding: "8px 0", fontSize: 11, fontWeight: 700, borderRadius: 8,
                    background: loading || !selectedZones.length ? "#cbd5e1" : "#0369a1",
                    color: "#fff", border: "none", cursor: loading ? "wait" : "pointer",
                    boxShadow: loading || !selectedZones.length ? "none" : "0 2px 8px rgba(3,105,161,0.25)",
                  }}
                >
                  {loading ? "Generating…" : "Generate"}
                </button>
                {localTiff && (
                  <button
                    type="button"
                    onClick={() => {
                      if (shownOnMain) {
                        onPresentToMain?.(null as unknown as ArrayBuffer);
                        setShownOnMain(false);
                      } else {
                        onPresentToMain?.(localTiff);
                        setShownOnMain(true);
                      }
                    }}
                    style={{
                      width: "100%", padding: "7px 0", fontSize: 11, fontWeight: 700, borderRadius: 8,
                      background: shownOnMain ? "#059669" : "#fff",
                      color: shownOnMain ? "#fff" : "#059669",
                      border: "1.5px solid #10b981",
                      cursor: "pointer",
                      boxShadow: shownOnMain ? "0 2px 8px rgba(5,150,105,0.25)" : "none",
                      transition: "all 0.2s",
                    }}
                  >
                    {shownOnMain ? "✓ Shown on Main Map" : "Show on Main Map"}
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Arth Ganga zonal stats section ──────────────────────────────────── */
const ARTH_CRITERIA_MAP: Record<string, { label: string; borderColor: string; bgColor: string; headerBg: string; textColor: string }> = {
  "Agriculture (crop area, water demand)": { label: "Agriculture",        borderColor: "#bbf7d0", bgColor: "#f0fdf4", headerBg: "#dcfce7", textColor: "#14532d" },
  "Irrigation dependency":                 { label: "Irrigation",         borderColor: "#a5f3fc", bgColor: "#ecfeff", headerBg: "#cffafe", textColor: "#164e63" },
  "Tourism & cultural nodes":              { label: "Tourism & Culture",   borderColor: "#fde68a", bgColor: "#fffbeb", headerBg: "#fef9c3", textColor: "#78350f" },
  "Ghats & heritage sites":               { label: "Ghats & Heritage",    borderColor: "#fecdd3", bgColor: "#fff1f2", headerBg: "#ffe4e6", textColor: "#881337" },
  "Economic activity zones":               { label: "Economic Activity",   borderColor: "#e9d5ff", bgColor: "#faf5ff", headerBg: "#f3e8ff", textColor: "#581c87" },
};

function ArthGangaSection({ criterion, selectedZones }: { criterion: string; selectedZones: string[] }) {
  const cfg = ARTH_CRITERIA_MAP[criterion];
  const [stats, setStats] = useState<Record<string, { mean: number | null; min: number | null; max: number | null }> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const zonesKey = selectedZones.join(",");

  useEffect(() => {
    if (!selectedZones.length) return;
    setLoading(true); setError(""); setStats(null);
    fetch(`${BACKEND}/analysis/arth-ganga`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selected_zones: selectedZones, criteria: [criterion] }),
    })
      .then((r) => r.json())
      .then((d) => {
        const result = d?.arth_ganga?.[criterion];
        if (result?.by_zone) setStats(result.by_zone);
        else setError(result?.error || d?.detail || "No data returned");
      })
      .catch((e) => setError(e.message || "Failed"))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zonesKey, criterion]);

  if (!cfg) return null;
  return (
    <div style={{ marginTop: 8, borderRadius: 8, border: `1px solid ${cfg.borderColor}`, background: cfg.bgColor, padding: "8px 10px" }}>
      <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: cfg.textColor }}>{cfg.label} — Zonal Stats</p>
      {loading ? <Spin /> : error ? <Err msg={error} /> : null}
      {!loading && !error && stats && (
        <div style={{ overflowX: "auto", borderRadius: 4, border: `1px solid ${cfg.borderColor}`, background: "#fff" }}>
          <table style={{ fontSize: 9, borderCollapse: "collapse", width: "100%", color: "#334155" }}>
            <thead>
              <tr style={{ background: cfg.headerBg }}>
                <th style={{ padding: "2px 6px", textAlign: "left", fontWeight: 700, borderBottom: `1px solid ${cfg.borderColor}` }}>Zone</th>
                <th style={{ padding: "2px 6px", textAlign: "right", fontWeight: 700, borderBottom: `1px solid ${cfg.borderColor}` }}>Mean</th>
                <th style={{ padding: "2px 6px", textAlign: "right", fontWeight: 700, borderBottom: `1px solid ${cfg.borderColor}` }}>Min</th>
                <th style={{ padding: "2px 6px", textAlign: "right", fontWeight: 700, borderBottom: `1px solid ${cfg.borderColor}` }}>Max</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats).map(([zone, s], i) => (
                <tr key={zone} style={{ background: i % 2 === 0 ? "#fff" : cfg.bgColor }}>
                  <td style={{ padding: "2px 6px", fontSize: 9, fontWeight: 600, borderBottom: "1px solid #e2e8f0" }}>{zone}</td>
                  <td style={{ padding: "2px 6px", fontSize: 9, textAlign: "right", borderBottom: "1px solid #e2e8f0" }}>{s.mean != null ? Number(s.mean).toFixed(4) : "—"}</td>
                  <td style={{ padding: "2px 6px", fontSize: 9, textAlign: "right", borderBottom: "1px solid #e2e8f0" }}>{s.min != null ? Number(s.min).toFixed(4) : "—"}</td>
                  <td style={{ padding: "2px 6px", fontSize: 9, textAlign: "right", borderBottom: "1px solid #e2e8f0" }}>{s.max != null ? Number(s.max).toFixed(4) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Jeevant Ganga zonal stats section ────────────────────────────────── */
const JEEVANT_CRITERIA_MAP: Record<string, { label: string; borderColor: string; bgColor: string; headerBg: string; textColor: string }> = {
  "Wetlands, ponds, lakes":                      { label: "Wetlands",      borderColor: "#99f6e4", bgColor: "#f0fdfa", headerBg: "#ccfbf1", textColor: "#134e4a" },
  "Riparian vegetation":                         { label: "Riparian Veg.", borderColor: "#bbf7d0", bgColor: "#f0fdf4", headerBg: "#dcfce7", textColor: "#14532d" },
  "Biodiversity (fish, birds, invasive species)":{ label: "Biodiversity",  borderColor: "#fef08a", bgColor: "#fefce8", headerBg: "#fef9c3", textColor: "#713f12" },
  "Floodplain & habitat data":                   { label: "Floodplain",    borderColor: "#a5b4fc", bgColor: "#eef2ff", headerBg: "#e0e7ff", textColor: "#312e81" },
};

function JeevantGangaSection({ criterion, selectedZones }: { criterion: string; selectedZones: string[] }) {
  const cfg = JEEVANT_CRITERIA_MAP[criterion];
  const [stats, setStats] = useState<Record<string, { mean: number | null; min: number | null; max: number | null }> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const zonesKey = selectedZones.join(",");

  useEffect(() => {
    if (!selectedZones.length) return;
    setLoading(true); setError(""); setStats(null);
    fetch(`${BACKEND}/analysis/jeevant-ganga`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selected_zones: selectedZones, criteria: [criterion] }),
    })
      .then((r) => r.json())
      .then((d) => {
        const result = d?.jeevant_ganga?.[criterion];
        if (result?.by_zone) setStats(result.by_zone);
        else setError(result?.error || d?.detail || "No data returned");
      })
      .catch((e) => setError(e.message || "Failed"))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zonesKey, criterion]);

  if (!cfg) return null;
  return (
    <div style={{ marginTop: 8, borderRadius: 8, border: `1px solid ${cfg.borderColor}`, background: cfg.bgColor, padding: "8px 10px" }}>
      <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: cfg.textColor }}>{cfg.label} — Zonal Stats</p>
      {loading ? <Spin /> : error ? <Err msg={error} /> : null}
      {!loading && !error && stats && (
        <div style={{ overflowX: "auto", borderRadius: 4, border: `1px solid ${cfg.borderColor}`, background: "#fff" }}>
          <table style={{ fontSize: 9, borderCollapse: "collapse", width: "100%", color: "#334155" }}>
            <thead>
              <tr style={{ background: cfg.headerBg }}>
                <th style={{ padding: "2px 6px", textAlign: "left", fontWeight: 700, borderBottom: `1px solid ${cfg.borderColor}` }}>Zone</th>
                <th style={{ padding: "2px 6px", textAlign: "right", fontWeight: 700, borderBottom: `1px solid ${cfg.borderColor}` }}>Mean</th>
                <th style={{ padding: "2px 6px", textAlign: "right", fontWeight: 700, borderBottom: `1px solid ${cfg.borderColor}` }}>Min</th>
                <th style={{ padding: "2px 6px", textAlign: "right", fontWeight: 700, borderBottom: `1px solid ${cfg.borderColor}` }}>Max</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats).map(([zone, s], i) => (
                <tr key={zone} style={{ background: i % 2 === 0 ? "#fff" : cfg.bgColor }}>
                  <td style={{ padding: "2px 6px", fontSize: 9, fontWeight: 600, borderBottom: "1px solid #e2e8f0" }}>{zone}</td>
                  <td style={{ padding: "2px 6px", fontSize: 9, textAlign: "right", borderBottom: "1px solid #e2e8f0" }}>{s.mean != null ? Number(s.mean).toFixed(4) : "—"}</td>
                  <td style={{ padding: "2px 6px", fontSize: 9, textAlign: "right", borderBottom: "1px solid #e2e8f0" }}>{s.min != null ? Number(s.min).toFixed(4) : "—"}</td>
                  <td style={{ padding: "2px 6px", fontSize: 9, textAlign: "right", borderBottom: "1px solid #e2e8f0" }}>{s.max != null ? Number(s.max).toFixed(4) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Gyan Ganga zonal stats section ──────────────────────────────────── */
const GYAN_CRITERIA_MAP: Record<string, { label: string; borderColor: string; bgColor: string; headerBg: string; textColor: string }> = {
  "All baseline datasets":                       { label: "Baseline Datasets",    borderColor: "#cbd5e1", bgColor: "#f8fafc", headerBg: "#e2e8f0", textColor: "#0f172a" },
  "Remote sensing + GIS maps":                   { label: "Remote Sensing / GIS", borderColor: "#bef264", bgColor: "#f7fee7", headerBg: "#ecfccb", textColor: "#365314" },
  "SWAT model outputs":                          { label: "SWAT Model",           borderColor: "#7dd3fc", bgColor: "#f0f9ff", headerBg: "#e0f2fe", textColor: "#0c4a6e" },
  "Hydrogeology (aquifer, MAR, paleo-channels)": { label: "Hydrogeology",         borderColor: "#fdba74", bgColor: "#fff7ed", headerBg: "#ffedd5", textColor: "#7c2d12" },
  "Monitoring stations & sensors":               { label: "Monitoring Sensors",   borderColor: "#c4b5fd", bgColor: "#f5f3ff", headerBg: "#ede9fe", textColor: "#4c1d95" },
};

function GyanGangaSection({ criterion, selectedZones }: { criterion: string; selectedZones: string[] }) {
  const cfg = GYAN_CRITERIA_MAP[criterion];
  const [stats, setStats] = useState<Record<string, { mean: number | null; min: number | null; max: number | null }> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const zonesKey = selectedZones.join(",");

  useEffect(() => {
    if (!selectedZones.length) return;
    setLoading(true); setError(""); setStats(null);
    fetch(`${BACKEND}/analysis/gyan-ganga`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selected_zones: selectedZones, criteria: [criterion] }),
    })
      .then((r) => r.json())
      .then((d) => {
        const result = d?.gyan_ganga?.[criterion];
        if (result?.by_zone) setStats(result.by_zone);
        else setError(result?.error || d?.detail || "No data returned");
      })
      .catch((e) => setError(e.message || "Failed"))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zonesKey, criterion]);

  if (!cfg) return null;
  return (
    <div style={{ marginTop: 8, borderRadius: 8, border: `1px solid ${cfg.borderColor}`, background: cfg.bgColor, padding: "8px 10px" }}>
      <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: cfg.textColor }}>{cfg.label} — Zonal Stats</p>
      {loading ? <Spin /> : error ? <Err msg={error} /> : null}
      {!loading && !error && stats && (
        <div style={{ overflowX: "auto", borderRadius: 4, border: `1px solid ${cfg.borderColor}`, background: "#fff" }}>
          <table style={{ fontSize: 9, borderCollapse: "collapse", width: "100%", color: "#334155" }}>
            <thead>
              <tr style={{ background: cfg.headerBg }}>
                <th style={{ padding: "2px 6px", textAlign: "left", fontWeight: 700, borderBottom: `1px solid ${cfg.borderColor}` }}>Zone</th>
                <th style={{ padding: "2px 6px", textAlign: "right", fontWeight: 700, borderBottom: `1px solid ${cfg.borderColor}` }}>Mean</th>
                <th style={{ padding: "2px 6px", textAlign: "right", fontWeight: 700, borderBottom: `1px solid ${cfg.borderColor}` }}>Min</th>
                <th style={{ padding: "2px 6px", textAlign: "right", fontWeight: 700, borderBottom: `1px solid ${cfg.borderColor}` }}>Max</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats).map(([zone, s], i) => (
                <tr key={zone} style={{ background: i % 2 === 0 ? "#fff" : cfg.bgColor }}>
                  <td style={{ padding: "2px 6px", fontSize: 9, fontWeight: 600, borderBottom: "1px solid #e2e8f0" }}>{zone}</td>
                  <td style={{ padding: "2px 6px", fontSize: 9, textAlign: "right", borderBottom: "1px solid #e2e8f0" }}>{s.mean != null ? Number(s.mean).toFixed(4) : "—"}</td>
                  <td style={{ padding: "2px 6px", fontSize: 9, textAlign: "right", borderBottom: "1px solid #e2e8f0" }}>{s.min != null ? Number(s.min).toFixed(4) : "—"}</td>
                  <td style={{ padding: "2px 6px", fontSize: 9, textAlign: "right", borderBottom: "1px solid #e2e8f0" }}>{s.max != null ? Number(s.max).toFixed(4) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Root export ──────────────────────────────────────────────────────── */
type Props = {
  activeCriteria: string[];
  selectedZones: string[];
  activeModule?: "Aviral Ganga" | "Nirmal Ganga" | "Jan Ganga" | "Arth Ganga" | "Gyan Ganga" | "Jeevant Ganga" | "STP Suitability";
  backendBase?: string;
  combinedMeta?: CombinedMeta;
  onViewerTiffUpdate?: (tiff: ArrayBuffer | null) => void;
  onPresentToMain?: (tiff: ArrayBuffer) => void;
};

export default function CriteriaDataPanel({ activeCriteria, selectedZones, activeModule = "Aviral Ganga" as "Aviral Ganga" | "Nirmal Ganga" | "Jan Ganga" | "Arth Ganga" | "Gyan Ganga" | "Jeevant Ganga" | "STP Suitability", backendBase = "", combinedMeta, onViewerTiffUpdate, onPresentToMain }: Props) {
  return (
    <div style={{ width: "100%", minHeight: "100%", background: "#f0f6ff", borderLeft: "1px solid #bfdbfe", padding: "6px", display: "flex", flexDirection: "column", gap: 10 }}>
      {activeCriteria.includes("Rainfall & runoff") && <RainfallSection selectedZones={selectedZones} />}
      {activeCriteria.includes("Groundwater recharge") && <GroundwaterSection selectedZones={selectedZones} />}
      {(activeCriteria.includes("River flow (monthly)") || activeCriteria.includes("River flow")) && <RiverFlowSection selectedZones={selectedZones} />}
      {(activeCriteria.includes("Tributary & drain flow") || activeCriteria.includes("Drains & discharge points")) && <DrainFlowSection selectedZones={selectedZones} />}
      {activeCriteria.includes("Channel geometry (width, depth)") && <ChannelGeomSection selectedZones={selectedZones} />}
      {activeCriteria.includes("DEM, slope maps") && <DemSlopeSection selectedZones={selectedZones} />}
      {activeCriteria.includes("River water quality") && <RwqSection selectedZones={selectedZones} />}
      {activeCriteria.includes("Groundwater quality") && <GwqSection selectedZones={selectedZones} />}
      {activeCriteria.includes("Industrial discharge") && <IndustrialSection selectedZones={selectedZones} />}
      {activeCriteria.includes("STP details") && <StpSection selectedZones={selectedZones} />}
      {activeCriteria.includes("Population (urban/rural)") && <PopulationSection selectedZones={selectedZones} />}
      {activeCriteria.includes("Gram Panchayat data") && <GramPanchayatSection selectedZones={selectedZones} />}
      {Object.keys(ARTH_CRITERIA_MAP).filter(c => activeCriteria.includes(c)).map(c => (
        <ArthGangaSection key={c} criterion={c} selectedZones={selectedZones} />
      ))}
      {Object.keys(GYAN_CRITERIA_MAP).filter(c => activeCriteria.includes(c)).map(c => (
        <GyanGangaSection key={c} criterion={c} selectedZones={selectedZones} />
      ))}
      {Object.keys(JEEVANT_CRITERIA_MAP).filter(c => activeCriteria.includes(c)).map(c => (
        <JeevantGangaSection key={c} criterion={c} selectedZones={selectedZones} />
      ))}
      {activeCriteria.includes("Combined Output") && backendBase && (
        <CombinedWeightPanel
          selectedZones={selectedZones}
          backendBase={backendBase}
          activeModule={activeModule}
          combinedMeta={combinedMeta}
          onViewerTiffUpdate={onViewerTiffUpdate}
          onPresentToMain={onPresentToMain}
        />
      )}
    </div>
  );
}

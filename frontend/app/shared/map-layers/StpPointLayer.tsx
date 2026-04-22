"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";

export type StpFeature = {
  zone: string | null;
  name: string;
  district: string | null;
  city: string | null;
  state: string | null;
  status: string | null;
  capacity_mld: number | null;
  last_seen: string | null;
  inlet_BOD: number | null;
  inlet_COD: number | null;
  inlet_TSS: number | null;
  inlet_pH: number | null;
  outlet_BOD: number | null;
  outlet_COD: number | null;
  outlet_TSS: number | null;
  outlet_pH: number | null;
  lat: number;
  lng: number;
};

type Props = {
  enabled: boolean;
  selectedZones: string[];
  apiBase: string;
  onDataLoaded?: (stps: StpFeature[]) => void;
};

export default function StpPointLayer({ enabled, selectedZones, apiBase, onDataLoaded }: Props) {
  const map = useMap();
  const layerGroupRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    const cleanup = () => {
      if (layerGroupRef.current) {
        map.removeLayer(layerGroupRef.current);
        layerGroupRef.current = null;
      }
    };

    if (!enabled || !selectedZones.length) {
      cleanup();
      return;
    }

    const load = async () => {
      try {
        cleanup();
        const res = await fetch(`${apiBase}/analysis/nirmal-stp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selected_zones: selectedZones }),
        });
        if (!res.ok || cancelled) return;

        const data = await res.json();
        const stps: StpFeature[] = data.stps || [];
        if (cancelled) return;

        const L = (await import("leaflet")).default;
        const group = L.layerGroup();

        for (const stp of stps) {
          // All are "Live" — colour by outlet BOD compliance (≤30 mg/L = good)
          const obod = stp.outlet_BOD;
          const dotColor = obod == null ? "#f59e0b" : obod <= 30 ? "#22c55e" : obod <= 60 ? "#f97316" : "#ef4444";

          const marker = L.circleMarker([stp.lat, stp.lng], {
            radius: 8,
            fillColor: dotColor,
            color: "#fff",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9,
          });

          const val = (v: number | null, unit = "") =>
            v != null ? `${v}${unit}` : "<span style='color:#94a3b8'>N/A</span>";

          const paramRow = (param: string, inlet: number | null, outlet: number | null, unit = "") => `
            <tr>
              <td style="color:#64748b;padding:2px 6px 2px 0;white-space:nowrap">${param}</td>
              <td style="padding:2px 4px;text-align:right">${val(inlet, unit)}</td>
              <td style="padding:2px 0;text-align:right">${val(outlet, unit)}</td>
            </tr>`;

          const popup = `
            <div style="font-size:12px;min-width:240px;max-width:300px">
              <div style="font-weight:700;font-size:13px;margin-bottom:4px;color:#1e293b">${stp.name}</div>
              <div style="font-size:10px;color:#64748b;margin-bottom:6px">${[stp.city, stp.district, stp.state].filter(Boolean).join(" · ")}</div>
              <div style="display:flex;gap:6px;align-items:center;margin-bottom:8px">
                <span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;background:#22c55e;color:#fff">${stp.status ?? "Live"}</span>
                ${stp.capacity_mld != null ? `<span style="font-size:11px;color:#475569">Capacity: <b>${stp.capacity_mld} MLD</b></span>` : ""}
              </div>
              <table style="width:100%;border-collapse:collapse;font-size:11px">
                <thead>
                  <tr style="background:#f1f5f9">
                    <th style="padding:3px 6px 3px 0;text-align:left;color:#475569;font-weight:600">Parameter</th>
                    <th style="padding:3px 4px;text-align:right;color:#475569;font-weight:600">Inlet</th>
                    <th style="padding:3px 0;text-align:right;color:#475569;font-weight:600">Outlet</th>
                  </tr>
                </thead>
                <tbody>
                  ${paramRow("BOD (mg/L)", stp.inlet_BOD, stp.outlet_BOD)}
                  ${paramRow("COD (mg/L)", stp.inlet_COD, stp.outlet_COD)}
                  ${paramRow("TSS (mg/L)", stp.inlet_TSS, stp.outlet_TSS)}
                  ${paramRow("pH", stp.inlet_pH, stp.outlet_pH)}
                </tbody>
              </table>
              ${stp.last_seen ? `<div style="margin-top:5px;font-size:10px;color:#94a3b8">Last updated: ${stp.last_seen}</div>` : ""}
            </div>`;

          marker.bindPopup(popup, { maxWidth: 320 });
          group.addLayer(marker);
        }

        if (!cancelled) {
          group.addTo(map);
          layerGroupRef.current = group;
          onDataLoaded?.(stps);
        }
      } catch (err) {
        console.error("Failed to load STP layer:", err);
      }
    };

    void load();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [enabled, map, selectedZones, apiBase]); // onDataLoaded intentionally excluded — stable via useCallback at call site

  return null;
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "leaflet/dist/leaflet.css";
import AdminLocation from "./components/AdminLocation";
import AdminMap from "./components/AdminMap";
import { useLocationSelection } from "./hooks/useLocationSelection";

type HolisticModuleProps = {
  hideLeftPanel?: boolean;
};

export default function HolisticModule({ hideLeftPanel = false }: HolisticModuleProps) {
  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9000";
  const {
    loading,
    error,
    zoneOptions,
    selectedZones,
    areaGeojson,
    riversGeojson,
    basinGeojson,
    selectedZoneGeojson,
    displayedZones,
    onZoneChange,
  } = useLocationSelection();

  const [locationVisible, setLocationVisible] = useState(!hideLeftPanel);
  const [showOutputs, setShowOutputs] = useState(false);
  const [outputLoading, setOutputLoading] = useState(false);
  const [rainfallError, setRainfallError] = useState("");
  const [groundwaterError, setGroundwaterError] = useState("");
  const [tributaryDrainError, setTributaryDrainError] = useState("");
  const [demSlopeError, setDemSlopeError] = useState("");
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [showRainfallLayer, setShowRainfallLayer] = useState(false);
  const [showRechargeLayer, setShowRechargeLayer] = useState(false);
  const [selectedRainfallYear, setSelectedRainfallYear] = useState<number | null>(2024);
  const [selectedDataUsed, setSelectedDataUsed] = useState<string[]>([]);

  const outputItems = ["Environmental Flow (e-flow) Map", "Flow Deficit Zones Map", "Seasonal Flow Variation Map", "Catchment Water Budget (SWAT outputs)", "Runoff Potential Map"];

  useEffect(() => {
    document.body.classList.add("holistic-fullscreen-mode");
    return () => {
      document.body.classList.remove("holistic-fullscreen-mode");
    };
  }, []);

  const onToggleDataUsed = (item: string) => {
    setSelectedDataUsed((prev) => (prev.includes(item) ? prev.filter((v) => v !== item) : [...prev, item]));
  };

  const wantsRainfall = selectedDataUsed.some((item) => item.toLowerCase().includes("rainfall"));
  const wantsGroundwater = selectedDataUsed.some((item) => item.toLowerCase().includes("groundwater"));
  const wantsTributaryDrain = selectedDataUsed.some((item) => {
    const value = item.toLowerCase();
    return value.includes("tributary") || value.includes("drain");
  });
  const wantsDemSlope = selectedDataUsed.some((item) => {
    const value = item.toLowerCase();
    return value.includes("dem") || value.includes("slope");
  });

  const onProceed = async () => {
    setShowOutputs(true);
    setOutputLoading(true);
    setRainfallError("");
    setGroundwaterError("");
    setTributaryDrainError("");
    setDemSlopeError("");
    try {
      setShowRainfallLayer(wantsRainfall);
      // Groundwater should be output-only (right panel), not rendered as map raster.
      setShowRechargeLayer(false);
      const nextResult: any = {
        selected_zones: selectedZones,
        rainfall: { years: [], by_zone: {} },
        groundwater: { by_zone: {} },
        tributary_drain: { layers: [], summary: {} },
        dem_slope: { slope: null, dem: null, errors: { slope: [], dem: [] } },
      };

      if (wantsRainfall) {
        const rainResponse = await fetch(`${backendBase}/analysis/rainfall`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selected_zones: selectedZones }),
        });
        const rainData = await rainResponse.json().catch(() => ({}));
        if (!rainResponse.ok) {
          setRainfallError(rainData?.detail || `Rainfall analysis failed (${rainResponse.status})`);
        } else {
          nextResult.rainfall = rainData?.rainfall || nextResult.rainfall;
          const years = Array.isArray(rainData?.rainfall?.years) ? rainData.rainfall.years.filter((y: any) => Number.isFinite(Number(y))) : [];
          if (years.length) {
            const sortedYears = [...years].map((y: any) => Number(y)).sort((a: number, b: number) => a - b);
            setSelectedRainfallYear(sortedYears[sortedYears.length - 1]);
          }
        }
      }

      if (wantsGroundwater) {
        const gwResponse = await fetch(`${backendBase}/analysis/groundwater`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selected_zones: selectedZones }),
        });
        const gwData = await gwResponse.json().catch(() => ({}));
        if (!gwResponse.ok) {
          setGroundwaterError(gwData?.detail || `Groundwater analysis failed (${gwResponse.status})`);
        } else {
          nextResult.groundwater = gwData?.groundwater || nextResult.groundwater;
        }
      }

      if (wantsTributaryDrain) {
        const tdResponse = await fetch(`${backendBase}/analysis/tributary-drain`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selected_zones: selectedZones }),
        });
        const tdData = await tdResponse.json().catch(() => ({}));
        if (!tdResponse.ok) {
          setTributaryDrainError(tdData?.detail || `Tributary & drain analysis failed (${tdResponse.status})`);
        } else {
          nextResult.tributary_drain = tdData?.tributary_drain || nextResult.tributary_drain;
        }
      }

      if (wantsDemSlope) {
        const dsResponse = await fetch(`${backendBase}/analysis/dem-slope`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selected_zones: selectedZones }),
        });
        const dsData = await dsResponse.json().catch(() => ({}));
        if (!dsResponse.ok) {
          setDemSlopeError(dsData?.detail || `DEM/Slope analysis failed (${dsResponse.status})`);
        } else {
          nextResult.dem_slope = dsData?.dem_slope || nextResult.dem_slope;
        }
      }

      setAnalysisResult(nextResult);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Analysis request failed";
      setRainfallError((prev) => prev || message);
      setGroundwaterError((prev) => prev || message);
      setTributaryDrainError((prev) => prev || message);
      setDemSlopeError((prev) => prev || message);
    } finally {
      setOutputLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eef2f8] p-1 md:p-2">
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 md:px-4">
          <h1 className="text-3xl font-extrabold tracking-tight text-blue-800 md:text-[42px]">Holistic River Management</h1>
          <Link
            href="/homepage"
            className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800"
          >
            Dashboard
          </Link>
        </div>

        <div className="relative h-[calc(100vh-96px)] min-h-[620px] overflow-hidden p-2">
          <div className="h-full w-full">
            <AdminMap
              selectedZones={selectedZones}
              areaGeojson={areaGeojson}
              riversGeojson={riversGeojson}
              basinGeojson={basinGeojson}
              selectedZoneGeojson={selectedZoneGeojson}
              analysisResult={analysisResult}
              showRainfallLayer={showRainfallLayer}
              showRechargeLayer={showRechargeLayer}
              rainfallYear={selectedRainfallYear}
              clipApiBase={backendBase}
            />
          </div>

          {!hideLeftPanel ? (
            <>
              <button
                type="button"
                onClick={() => setLocationVisible((prev) => !prev)}
                className="absolute left-4 top-4 z-[950] rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm font-bold text-slate-700 shadow transition hover:bg-slate-50"
                title={locationVisible ? "Hide Location" : "Show Location"}
                aria-label={locationVisible ? "Hide Location" : "Show Location"}
              >
                {locationVisible ? "◀" : "▶"}
              </button>

              <div
                className={`pointer-events-none absolute bottom-4 left-4 top-4 z-[900] w-[340px] max-w-[90vw] transform transition-all duration-300 ease-out ${
                  locationVisible ? "translate-x-0 opacity-100" : "-translate-x-[105%] opacity-0"
                }`}
              >
                <div className="pointer-events-auto h-full">
                  <AdminLocation
                    error={error}
                    loading={loading}
                    onToggleLocation={() => setLocationVisible(false)}
                    selectedDataUsed={selectedDataUsed}
                    onToggleDataUsed={onToggleDataUsed}
                    onProceed={onProceed}
                    proceedDisabled={selectedZones.length === 0}
                    selectedZones={selectedZones}
                    zoneOptions={zoneOptions}
                    displayedZones={displayedZones}
                    onZoneChange={onZoneChange}
                  />
                </div>
              </div>
            </>
          ) : null}

          {showOutputs ? (
            <aside className="absolute bottom-4 right-4 top-4 z-[900] w-[430px] max-w-[42vw] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
              <div className="h-full overflow-y-auto p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-extrabold text-slate-900">Outputs</h3>
                  <button
                    type="button"
                    onClick={() => setShowOutputs(false)}
                    className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Hide
                  </button>
                </div>
                <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <p>
                    <span className="font-semibold">Selected Zone(s):</span>{" "}
                    {selectedZones.length ? selectedZones.join(", ") : "N/A"}
                  </p>
                  <p className="mt-1">
                    <span className="font-semibold">Selected Inputs:</span> {selectedDataUsed.length}
                  </p>
                </div>
             

                {wantsRainfall ? (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                    <p className="mb-2 text-sm font-bold text-slate-900">Rainfall Output (Selected Zones)</p>
                    <div className="mb-2 rounded border border-slate-200 bg-slate-50 p-2 text-[11px]">
                      <p className="mb-1 font-semibold text-slate-700">Legend (Rainfall mm)</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-700">
                        <span className="flex items-center gap-1"><span className="inline-block h-3 w-4 border border-slate-500 bg-[rgba(0,248,33,0.72)]" />{"< 900"}</span>
                        <span className="flex items-center gap-1"><span className="inline-block h-3 w-4 border border-slate-500 bg-[rgba(37,99,235,0.72)]" />900-1000</span>
                        <span className="flex items-center gap-1"><span className="inline-block h-3 w-4 border border-slate-500 bg-[rgba(6,182,212,0.72)]" />1000-1100</span>
                        <span className="flex items-center gap-1"><span className="inline-block h-3 w-4 border border-slate-500 bg-[rgba(245,158,11,0.72)]" />1100-1200</span>
                        <span className="flex items-center gap-1"><span className="inline-block h-3 w-4 border border-slate-500 bg-[rgba(239,68,68,0.72)]" />1200-1300</span>
                        <span className="flex items-center gap-1"><span className="inline-block h-3 w-4 border border-slate-500 bg-[rgba(147,51,234,0.72)]" />1300-1400</span>
                        <span className="flex items-center gap-1"><span className="inline-block h-3 w-4 border border-slate-500 bg-[rgba(240,0,208,0.85)]" />{"> 1400"}</span>
                      </div>
                    </div>
                    {outputLoading ? <p className="text-sm text-blue-700">Running analysis...</p> : null}
                    {rainfallError ? <p className="text-sm text-red-700">{rainfallError}</p> : null}
                    {!outputLoading && !rainfallError && analysisResult?.rainfall?.years?.length ? (
                      <div className="mb-2">
                        <label className="mb-1 block text-xs font-semibold text-slate-700">Rainfall Year (Map)</label>
                        <select
                          className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                          value={selectedRainfallYear ?? ""}
                          onChange={(e) => setSelectedRainfallYear(Number(e.target.value))}
                        >
                          {analysisResult.rainfall.years.map((year: number) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}
                    {!outputLoading && !rainfallError && analysisResult?.rainfall?.by_zone ? (
                      <div className="max-h-72 overflow-auto text-xs text-slate-700">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-slate-50">
                              <th className="border border-slate-200 px-2 py-1 text-left">Zone</th>
                              <th className="border border-slate-200 px-2 py-1 text-left">Year</th>
                              <th className="border border-slate-200 px-2 py-1 text-left">Mean Rainfall</th>
                              <th className="border border-slate-200 px-2 py-1 text-left">Min Rainfall</th>
                              <th className="border border-slate-200 px-2 py-1 text-left">Max Rainfall</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(analysisResult.rainfall.by_zone).map(([zone, rows]: [string, any]) => {
                              const selectedYear = selectedRainfallYear ?? null;
                              const rowForYear =
                                (rows || []).find((r: any) => Number(r?.year) === Number(selectedYear)) || null;
                              return (
                                <tr key={`${zone}-${selectedYear ?? "na"}`}>
                                  <td className="border border-slate-200 px-2 py-1 font-semibold">{zone}</td>
                                  <td className="border border-slate-200 px-2 py-1">{selectedYear ?? "N/A"}</td>
                                  <td className="border border-slate-200 px-2 py-1">
                                    {rowForYear?.mean === null || rowForYear?.mean === undefined ? "N/A" : rowForYear.mean}
                                  </td>
                                  <td className="border border-slate-200 px-2 py-1">
                                    {rowForYear?.min === null || rowForYear?.min === undefined ? "N/A" : rowForYear.min}
                                  </td>
                                  <td className="border border-slate-200 px-2 py-1">
                                    {rowForYear?.max === null || rowForYear?.max === undefined ? "N/A" : rowForYear.max}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {wantsGroundwater ? (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                    <p className="mb-2 text-sm font-bold text-slate-900">Groundwater Recharge Output (Selected Zones)</p>
                    {outputLoading ? <p className="text-sm text-blue-700">Running analysis...</p> : null}
                    {groundwaterError ? <p className="text-sm text-red-700">{groundwaterError}</p> : null}
                    {!outputLoading && !groundwaterError && analysisResult?.groundwater?.by_zone ? (
                      <div className="max-h-56 overflow-auto text-xs text-slate-700">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-slate-50">
                              <th className="border border-slate-200 px-2 py-1 text-left">Zone</th>
                              <th className="border border-slate-200 px-2 py-1 text-left">Mean Recharge</th>
                              <th className="border border-slate-200 px-2 py-1 text-left">Min Recharge</th>
                              <th className="border border-slate-200 px-2 py-1 text-left">Max Recharge</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(analysisResult.groundwater.by_zone).map(([zone, row]: [string, any]) => (
                              <tr key={`gw-${zone}`}>
                                <td className="border border-slate-200 px-2 py-1 font-semibold">{zone}</td>
                                <td className="border border-slate-200 px-2 py-1">
                                  {row?.mean === null || row?.mean === undefined ? "N/A" : row.mean}
                                </td>
                                <td className="border border-slate-200 px-2 py-1">
                                  {row?.min === null || row?.min === undefined ? "N/A" : row.min}
                                </td>
                                <td className="border border-slate-200 px-2 py-1">
                                  {row?.max === null || row?.max === undefined ? "N/A" : row.max}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {wantsTributaryDrain ? (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                    <p className="mb-2 text-sm font-bold text-slate-900">Tributary & Drain Flow Output (Selected Zones)</p>
                    {outputLoading ? <p className="text-sm text-blue-700">Running analysis...</p> : null}
                    {tributaryDrainError ? <p className="text-sm text-red-700">{tributaryDrainError}</p> : null}
                    {!outputLoading && !tributaryDrainError && analysisResult?.tributary_drain?.layers?.length ? (
                      <div className="max-h-72 overflow-auto text-xs text-slate-700">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-slate-50">
                              <th className="border border-slate-200 px-2 py-1 text-left">Layer</th>
                              <th className="border border-slate-200 px-2 py-1 text-left">Intersecting Features</th>
                              {selectedZones.map((zone: string) => (
                                <th key={`hdr-${zone}`} className="border border-slate-200 px-2 py-1 text-left">{zone}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {analysisResult.tributary_drain.layers.map((row: any) => (
                              <tr key={`td-${row.layer}`}>
                                <td className="border border-slate-200 px-2 py-1 font-semibold">{row.label || row.layer}</td>
                                <td className="border border-slate-200 px-2 py-1">{row.error ? "N/A" : row.intersecting_features}</td>
                                {selectedZones.map((zone: string) => (
                                  <td key={`${row.layer}-${zone}`} className="border border-slate-200 px-2 py-1">
                                    {row.error ? "-" : (row.by_zone?.[zone] ?? 0)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {wantsDemSlope ? (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                    <p className="mb-2 text-sm font-bold text-slate-900">DEM & Slope Output (Selected Zones)</p>
                    {outputLoading ? <p className="text-sm text-blue-700">Running analysis...</p> : null}
                    {demSlopeError ? <p className="text-sm text-red-700">{demSlopeError}</p> : null}

                    {!outputLoading && !demSlopeError && analysisResult?.dem_slope?.slope?.by_zone ? (
                      <div className="mb-3">
                        <p className="mb-1 text-xs font-semibold text-slate-700">
                          Slope ({analysisResult?.dem_slope?.slope?.coverage || "N/A"})
                        </p>
                        <div className="max-h-44 overflow-auto text-xs text-slate-700">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-slate-50">
                                <th className="border border-slate-200 px-2 py-1 text-left">Zone</th>
                                <th className="border border-slate-200 px-2 py-1 text-left">Mean</th>
                                <th className="border border-slate-200 px-2 py-1 text-left">Min</th>
                                <th className="border border-slate-200 px-2 py-1 text-left">Max</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(analysisResult.dem_slope.slope.by_zone).map(([zone, row]: [string, any]) => (
                                <tr key={`slope-${zone}`}>
                                  <td className="border border-slate-200 px-2 py-1 font-semibold">{zone}</td>
                                  <td className="border border-slate-200 px-2 py-1">{row?.mean ?? "N/A"}</td>
                                  <td className="border border-slate-200 px-2 py-1">{row?.min ?? "N/A"}</td>
                                  <td className="border border-slate-200 px-2 py-1">{row?.max ?? "N/A"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : null}

                    {!outputLoading && !demSlopeError && analysisResult?.dem_slope?.dem?.by_zone ? (
                      <div>
                        <p className="mb-1 text-xs font-semibold text-slate-700">
                          DEM ({analysisResult?.dem_slope?.dem?.coverage || "N/A"})
                        </p>
                        <div className="max-h-44 overflow-auto text-xs text-slate-700">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-slate-50">
                                <th className="border border-slate-200 px-2 py-1 text-left">Zone</th>
                                <th className="border border-slate-200 px-2 py-1 text-left">Mean</th>
                                <th className="border border-slate-200 px-2 py-1 text-left">Min</th>
                                <th className="border border-slate-200 px-2 py-1 text-left">Max</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(analysisResult.dem_slope.dem.by_zone).map(([zone, row]: [string, any]) => (
                                <tr key={`dem-${zone}`}>
                                  <td className="border border-slate-200 px-2 py-1 font-semibold">{zone}</td>
                                  <td className="border border-slate-200 px-2 py-1">{row?.mean ?? "N/A"}</td>
                                  <td className="border border-slate-200 px-2 py-1">{row?.min ?? "N/A"}</td>
                                  <td className="border border-slate-200 px-2 py-1">{row?.max ?? "N/A"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}

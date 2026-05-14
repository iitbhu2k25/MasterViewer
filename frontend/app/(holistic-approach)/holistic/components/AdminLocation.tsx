import { ZoneOption } from "../types/location";
import { useEffect, useMemo, useRef, useState } from "react";
import { STAGE_CONFIGS, STAGE_RASTER_CRITERIA } from "../../../shared/criteria-configs";
import { WeightSliderCard } from "../../../split/components/CriteriaDataPanel";

// Re-export so HolisticModule can import from here
export { STAGE_CONFIGS };
export type { StageConfig } from "../../../shared/criteria-configs";

type Props = {
  error: string;
  loading?: boolean;
  onToggleLocation?: () => void;
  stageIndex: number;
  selectedDataUsed: string[];
  onToggleDataUsed: (item: string) => void;
  onProceed: () => void;
  proceedDisabled?: boolean;
  proceededOnce?: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onGeneratePdf?: () => void;
  selectedZones: string[];
  zoneOptions: ZoneOption[];
  displayedZones: number;
  onZoneChange: (values: string[]) => Promise<void>;
  // Aviral suitability
  criteriaWeights?: Record<string, number>;
  onWeightChange?: (criterion: string, value: number) => void;
  onGenerateSuitability?: () => void;
  suitabilityLoading?: boolean;
  suitabilityError?: string;
  suitabilityReady?: boolean;
  showSuitabilityOnMap?: boolean;
  onToggleSuitabilityOnMap?: () => void;
  showAviralPanel?: boolean;
  onToggleAviralPanel?: () => void;
};

export default function AdminLocation({
  error,
  loading,
  onToggleLocation,
  stageIndex,
  selectedDataUsed,
  onToggleDataUsed,
  onProceed,
  proceedDisabled,
  proceededOnce,
  onNext,
  onPrevious,
  onGeneratePdf,
  selectedZones,
  zoneOptions,
  displayedZones,
  onZoneChange,
  criteriaWeights = {},
  onWeightChange,
  onGenerateSuitability,
  suitabilityLoading = false,
  suitabilityError = "",
  suitabilityReady = false,
  showSuitabilityOnMap = false,
  onToggleSuitabilityOnMap,
  showAviralPanel = false,
  onToggleAviralPanel,
}: Props) {
  const [zoneOpen, setZoneOpen] = useState(false);
  const zoneRef = useRef<HTMLDivElement | null>(null);
  const [lockedWeights, setLockedWeights] = useState<Record<string, boolean>>({});
  const toggleWeightLock = (c: string) => setLockedWeights((p) => ({ ...p, [c]: !p[c] }));

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!zoneRef.current) return;
      if (!zoneRef.current.contains(event.target as Node)) {
        setZoneOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const zoneLabel = useMemo(() => {
    if (!selectedZones.length) return "Select zone...";
    if (selectedZones.length === 1) return selectedZones[0];
    return `${selectedZones.length} zones selected`;
  }, [selectedZones]);

  const areAllZonesSelected = zoneOptions.length > 0 && selectedZones.length === zoneOptions.length;

  const isFirstStage = stageIndex === 0;
  const isLastStage = stageIndex === STAGE_CONFIGS.length - 1;
  const stageConfig = STAGE_CONFIGS[stageIndex] ?? {
    title: `Stage ${stageIndex + 1}`,
    criteria: [],
  };
  // For stages beyond the defined configs, generate placeholder criteria
  const criteriaOptions = stageConfig.criteria;

  // Always show exactly the defined stages — never more
  const displayCount = STAGE_CONFIGS.length;

  return (
    <section className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* Header */}
      <div className="mb-3 flex items-center rounded-lg bg-slate-100 px-3 py-2">
        <div className="flex flex-1 justify-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-blue-600">◎</span>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">{stageConfig.title}</h2>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggleLocation}
          className="rounded-md bg-white px-2 py-1 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50"
          title="Hide Location Panel"
        >
          {"<"}
        </button>
      </div>

      {/* Stage progress dots */}
      <div className="mb-3 flex items-center gap-1.5 px-1">
        {Array.from({ length: displayCount }).map((_, i) => (
          <div key={i} className="flex items-center gap-1.5" style={{ flex: i < displayCount - 1 ? "1" : "none" }}>
            <div
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                i === stageIndex
                  ? "bg-blue-600 text-white"
                  : i < stageIndex
                  ? "bg-blue-200 text-blue-700"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              {i + 1}
            </div>
            {i < displayCount - 1 && (
              <div className={`h-0.5 flex-1 ${i < stageIndex ? "bg-blue-400" : "bg-slate-200"}`} />
            )}
          </div>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {error ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        ) : null}

        {/* Zone selector — locked on stages beyond the first */}
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Zone</label>
            {!isFirstStage ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <div className="flex flex-wrap gap-1">
                  {selectedZones.length ? selectedZones.map((z) => (
                    <span key={z} className="rounded-md border border-blue-300 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                      ✓ {z}
                    </span>
                  )) : <span className="text-xs text-slate-400">No zones selected</span>}
                </div>
                <p className="mt-1 text-xs text-slate-400">Locked from Stage 1</p>
              </div>
            ) : (
              <div ref={zoneRef} className="relative">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setZoneOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-sm text-slate-800 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <span>{zoneLabel}</span>
                  <span className="text-xs text-slate-500">▾</span>
                </button>

                {zoneOpen ? (
                  <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-[1000] rounded-lg border border-slate-300 bg-white p-2 shadow-lg">
                    {zoneOptions.length === 0 ? (
                      <p className="px-2 py-1 text-xs text-slate-500">No zones found</p>
                    ) : (
                      <>
                        <label className="mb-2 flex cursor-pointer items-center gap-2 rounded border-b border-slate-200 pb-2 px-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                          <input
                            type="checkbox"
                            checked={areAllZonesSelected}
                            onChange={() => {
                              if (areAllZonesSelected) {
                                void onZoneChange([]);
                              } else {
                                void onZoneChange(zoneOptions.map((z) => z.value));
                              }
                            }}
                          />
                          <span>Select all</span>
                        </label>
                        <div className="flex flex-wrap gap-1">
                          {zoneOptions.map((option) => {
                            const checked = selectedZones.includes(option.value);
                            return (
                              <label
                                key={option.value}
                                className={`flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
                                  checked
                                    ? "border-blue-400 bg-blue-50 text-blue-700"
                                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => {
                                    const next = checked
                                      ? selectedZones.filter((v) => v !== option.value)
                                      : [...selectedZones, option.value];
                                    void onZoneChange(next);
                                  }}
                                  className="hidden"
                                />
                                {checked && <span className="text-blue-500">✓</span>}
                                <span>{option.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                ) : null}
              </div>
            )}
            {isFirstStage && <p className="mt-1 text-xs text-slate-500">Select one or more zones using checkboxes.</p>}
          </div>
        </div>

        {isFirstStage && (
          <p className="mt-4 text-xs text-slate-600">Displayed zones: {displayedZones}</p>
        )}
        {loading ? <p className="mt-1 text-xs text-blue-600">Loading layers...</p> : null}

        {/* Criteria */}
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
          <p className="mb-2 text-sm font-bold text-slate-900">Select criteria to proceed</p>
          {criteriaOptions.length === 0 ? (
            <p className="text-xs text-slate-400">No criteria defined for this stage.</p>
          ) : (
            <div className="space-y-2">
              {criteriaOptions.map((item) => {
                const checked = selectedDataUsed.includes(item);
                return (
                  <label key={item} className="flex cursor-pointer items-start gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleDataUsed(item)}
                      className="mt-1"
                    />
                    <span>{item}</span>
                  </label>
                );
              })}
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-4 flex gap-2">
            {stageIndex > 0 && (
              <button
                type="button"
                onClick={onPrevious}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                ← Prev
              </button>
            )}

            <button
              type="button"
              onClick={onProceed}
              disabled={proceedDisabled}
              className="flex-1 rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isLastStage ? "Finish" : "Proceed"}
            </button>

            {!isLastStage && (
              <button
                type="button"
                onClick={onNext}
                disabled={!proceededOnce}
                title={!proceededOnce ? "Click Proceed first" : "Next stage"}
                className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Next →
              </button>
            )}
          </div>

          {isLastStage && proceededOnce && (
            <button
              type="button"
              onClick={onGeneratePdf}
              className="mt-3 w-full rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
            >
              ⬇ Generate Report
            </button>
          )}

          {/* Output button — visible on all stages once criteria selected */}
          {selectedDataUsed.length > 0 && (
            <button
              type="button"
              onClick={onToggleAviralPanel}
              className={`mt-3 w-full rounded-lg px-3 py-2 text-sm font-semibold transition ${
                showAviralPanel
                  ? "bg-sky-700 text-white hover:bg-sky-800"
                  : "border border-sky-500 bg-white text-sky-700 hover:bg-sky-50"
              }`}
            >
              {showAviralPanel ? "▲ Hide Output" : "▼ Output"}
            </button>
          )}

          {/* ── Phase weight panel ── */}
          {showAviralPanel && selectedDataUsed.length > 0 && (
            <div className="mt-4" style={{ borderRadius: 12, border: "1.5px solid #e2e8f0", background: "#f8fafc", overflow: "hidden" }}>
              {/* Header */}
              <div style={{ padding: "8px 12px", background: "#fff", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#0f172a" }}>Selected Categories</span>
                  <span style={{ fontSize: 11, fontWeight: 700, background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 20, padding: "1px 8px", color: "#475569" }}>
                    {selectedDataUsed.length}/{selectedDataUsed.length}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                  {/* Lock all toggle */}
                  {(() => {
                    const allLocked = selectedDataUsed.length > 0 && selectedDataUsed.every((c) => lockedWeights[c]);
                    return (
                      <button
                        type="button"
                        onClick={() => {
                          const next = !allLocked;
                          const m: Record<string, boolean> = {};
                          selectedDataUsed.forEach((c) => { m[c] = next; });
                          setLockedWeights(m);
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
                    );
                  })()}
                  <button type="button" onClick={() => setLockedWeights({})} style={{ padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 600, cursor: "pointer", border: "1.5px solid #e2e8f0", background: "#fff", color: "#475569" }}>Reset</button>
                </div>
              </div>

              {/* Slider cards */}
              <div style={{ padding: "10px", display: "flex", flexDirection: "column", gap: 8 }}>
                {(() => {
                  const totalW = selectedDataUsed.reduce((s, c) => s + (criteriaWeights[c] ?? 5), 0) || 1;
                  return selectedDataUsed.map((criterion) => {
                    const val = criteriaWeights[criterion] ?? 5;
                    return (
                      <WeightSliderCard
                        key={criterion}
                        criterion={criterion}
                        value={val}
                        normalizedWeight={val / totalW}
                        locked={!!lockedWeights[criterion]}
                        checked={true}
                        onToggleCheck={() => {}}
                        onToggleLock={() => toggleWeightLock(criterion)}
                        onChange={(v) => !lockedWeights[criterion] && onWeightChange?.(criterion, v)}
                      />
                    );
                  });
                })()}

                {/* Generate */}
                {(() => {
                  const rasterCriteria = STAGE_RASTER_CRITERIA[stageIndex] ?? [];
                  const hasRasterMatch = selectedDataUsed.some((c) => rasterCriteria.includes(c));
                  if (!hasRasterMatch) {
                    return (
                      <p style={{ fontSize: 11, color: "#64748b", background: "#f1f5f9", borderRadius: 6, padding: "8px 10px", textAlign: "center" }}>
                        Raster analysis not yet available for the selected criteria.
                      </p>
                    );
                  }
                  return (
                    <>
                      {suitabilityError && (
                        <p style={{ fontSize: 11, color: "#dc2626", background: "#fef2f2", borderRadius: 6, padding: "6px 8px" }}>{suitabilityError}</p>
                      )}
                      <button
                        type="button"
                        onClick={onGenerateSuitability}
                        disabled={suitabilityLoading || selectedZones.length === 0}
                        style={{
                          width: "100%", padding: "9px 0", fontSize: 13, fontWeight: 700, borderRadius: 8,
                          background: suitabilityLoading || !selectedZones.length ? "#cbd5e1" : "#0369a1",
                          color: "#fff", border: "none", cursor: suitabilityLoading ? "wait" : "pointer",
                          boxShadow: suitabilityLoading || !selectedZones.length ? "none" : "0 2px 8px rgba(3,105,161,0.25)",
                        }}
                      >
                        {suitabilityLoading ? "Generating…" : "Generate"}
                      </button>
                      {suitabilityReady && (
                        <button
                          type="button"
                          onClick={onToggleSuitabilityOnMap}
                          style={{
                            width: "100%", padding: "9px 0", fontSize: 13, fontWeight: 700, borderRadius: 8,
                            background: showSuitabilityOnMap ? "#059669" : "#fff",
                            color: showSuitabilityOnMap ? "#fff" : "#059669",
                            border: "1.5px solid #10b981",
                            cursor: "pointer",
                          }}
                        >
                          {showSuitabilityOnMap ? "✓ Shown on Map" : "Show on Map"}
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

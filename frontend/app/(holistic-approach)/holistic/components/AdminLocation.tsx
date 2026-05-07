import { ZoneOption } from "../types/location";
import { useEffect, useMemo, useRef, useState } from "react";
import { STAGE_CONFIGS, STAGE_RASTER_CRITERIA } from "../../../shared/criteria-configs";

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
            <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50 p-3">
              <p className="mb-1 text-sm font-bold text-sky-900">Adjust Criteria Weights</p>
              <p className="mb-3 text-xs text-slate-500">Move a slider to set influence. The % shown is each criterion's share of the total.</p>
              <div className="space-y-1.5">
                {(() => {
                  const totalW = selectedDataUsed.reduce((s, c) => s + (criteriaWeights[c] ?? 5), 0);
                  return selectedDataUsed.map((criterion) => {
                    const val = criteriaWeights[criterion] ?? 5;
                    const pct = totalW > 0 ? Math.round((val / totalW) * 100) : 0;
                    return (
                      <div key={criterion}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-medium text-slate-700 leading-tight truncate">{criterion}</span>
                          <div className="flex shrink-0 items-center gap-1">
                            <span className="rounded bg-sky-100 px-1 py-0 text-[10px] font-semibold text-sky-700">{val}</span>
                            <span className="rounded bg-sky-600 px-1 py-0 text-[10px] font-bold text-white">{pct}%</span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={10}
                          step={1}
                          value={val}
                          onChange={(e) => onWeightChange?.(criterion, Number(e.target.value))}
                          className="w-full h-1 accent-sky-600"
                        />
                      </div>
                    );
                  });
                })()}
              </div>

              {(() => {
                const rasterCriteria = STAGE_RASTER_CRITERIA[stageIndex] ?? [];
                const hasRasterMatch = selectedDataUsed.some((c) => rasterCriteria.includes(c));
                if (!hasRasterMatch) {
                  return (
                    <p className="mt-3 rounded bg-slate-100 px-2 py-2 text-xs text-slate-500 text-center">
                      Raster analysis not yet available for the selected criteria.
                    </p>
                  );
                }
                return (
                  <>
                    {suitabilityError && (
                      <p className="mt-2 rounded bg-red-50 px-2 py-1 text-xs text-red-700">{suitabilityError}</p>
                    )}
                    <button
                      type="button"
                      onClick={onGenerateSuitability}
                      disabled={suitabilityLoading || selectedZones.length === 0}
                      className="mt-3 w-full rounded-lg bg-sky-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {suitabilityLoading ? "Generating…" : "Generate"}
                    </button>
                    {suitabilityReady && (
                      <button
                        type="button"
                        onClick={onToggleSuitabilityOnMap}
                        className={`mt-2 w-full rounded-lg px-3 py-2 text-sm font-semibold transition ${
                          showSuitabilityOnMap
                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                            : "border border-emerald-500 bg-white text-emerald-700 hover:bg-emerald-50"
                        }`}
                      >
                        {showSuitabilityOnMap ? "✓ Shown on Map" : "Show on Map"}
                      </button>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

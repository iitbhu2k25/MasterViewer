import { ZoneOption } from "../types/location";
import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  error: string;
  loading?: boolean;
  onToggleLocation?: () => void;
  selectedDataUsed: string[];
  onToggleDataUsed: (item: string) => void;
  onProceed: () => void;
  proceedDisabled?: boolean;
  selectedZones: string[];
  zoneOptions: ZoneOption[];
  displayedZones: number;
  onZoneChange: (values: string[]) => Promise<void>;
};

export default function AdminLocation({
  error,
  loading,
  onToggleLocation,
  selectedDataUsed,
  onToggleDataUsed,
  onProceed,
  proceedDisabled,
  selectedZones,
  zoneOptions,
  displayedZones,
  onZoneChange,
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

  const dataUsedOptions = [
    "River flow (monthly)",
    "Tributary & drain flow",
    "Rainfall & runoff",
    "Groundwater recharge",
    "Channel geometry (width, depth)",
    "DEM, slope maps",
    "Surface flow direction & accumulation maps",
  ];

  return (
    <section className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between rounded-lg bg-slate-100 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-blue-600">◎</span>
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">Aviral Ganga</h2>
          {/* <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-800">Zone</span> */}
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

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {error ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        ) : null}

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Zone</label>
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
                <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-[1000] max-h-56 overflow-y-auto rounded-lg border border-slate-300 bg-white p-2 shadow-lg">
                  {zoneOptions.length === 0 ? (
                    <p className="px-2 py-1 text-xs text-slate-500">No zones found</p>
                  ) : (
                    <>
                      <label className="mb-1 flex cursor-pointer items-center gap-2 rounded border-b border-slate-200 px-2 py-1 text-sm font-semibold text-slate-800 hover:bg-slate-50">
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
                        <span>Select all zones</span>
                      </label>
                      {zoneOptions.map((option) => {
                        const checked = selectedZones.includes(option.value);
                        return (
                          <label
                            key={option.value}
                            className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm text-slate-700 hover:bg-slate-50"
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
                            />
                            <span>{option.label}</span>
                          </label>
                        );
                      })}
                    </>
                  )}
                </div>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-slate-500">Select one or more zones using checkboxes.</p>
          </div>
        </div>

        
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
          <p className="mb-2 text-sm font-bold text-slate-900">select criteria to proceed</p>
          <div className="space-y-2">
            {dataUsedOptions.map((item) => {
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
        </div>

        <p className="mt-4 text-xs text-slate-600">Displayed zones: {displayedZones}</p>
        {loading ? <p className="mt-1 text-xs text-blue-600">Loading layers...</p> : null}
      </div>

      <button
        type="button"
        onClick={onProceed}
        disabled={proceedDisabled}
        className="mt-3 w-full rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        Proceed
      </button>
    </section>
  );
}

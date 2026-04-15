import { create } from "zustand";
import { DistrictOption, FeatureCollection, StateOption } from "../types/location";

type HolisticLocationState = {
  loading: boolean;
  error: string;
  isLocationLoaded: boolean;
  stateOptions: StateOption[];
  districtOptions: DistrictOption[];
  filteredDistrictOptions: DistrictOption[];
  selectedStateCode: string;
  selectedStateName: string;
  selectedDistrict: string;
  selectedDistrictCode: string;
  selectedStateGeojson: FeatureCollection | null;
  selectedDistrictGeojson: FeatureCollection | null;
  baseStateCql: string;
  districtCount: number;
  setLoading: (value: boolean) => void;
  setError: (value: string) => void;
  setInitialOptions: (states: StateOption[]) => void;
  setDistrictOptions: (districts: DistrictOption[]) => void;
  setSelectedState: (stateCode: string, stateName: string) => void;
  setSelectedDistrict: (districtName: string, districtCode: string) => void;
  setFilteredDistrictOptions: (districts: DistrictOption[]) => void;
  setMapSelection: (args: {
    baseStateCql: string;
    selectedStateGeojson: FeatureCollection | null;
    selectedDistrictGeojson: FeatureCollection | null;
    districtCount: number;
  }) => void;
  resetSelection: () => void;
};

export const useHolisticLocationStore = create<HolisticLocationState>((set) => ({
  loading: false,
  error: "",
  isLocationLoaded: false,
  stateOptions: [],
  districtOptions: [],
  filteredDistrictOptions: [],
  selectedStateCode: "",
  selectedStateName: "",
  selectedDistrict: "",
  selectedDistrictCode: "",
  selectedStateGeojson: null,
  selectedDistrictGeojson: null,
  baseStateCql: "",
  districtCount: 0,
  setLoading: (value) => set({ loading: value }),
  setError: (value) => set({ error: value }),
  setInitialOptions: (states) =>
    set({
      stateOptions: states,
      districtOptions: [],
      filteredDistrictOptions: [],
      isLocationLoaded: true,
      districtCount: 0,
    }),
  setDistrictOptions: (districts) => set({ districtOptions: districts, filteredDistrictOptions: districts }),
  setSelectedState: (stateCode, stateName) => set({ selectedStateCode: stateCode, selectedStateName: stateName }),
  setSelectedDistrict: (districtName, districtCode) =>
    set({ selectedDistrict: districtName, selectedDistrictCode: districtCode }),
  setFilteredDistrictOptions: (districts) => set({ filteredDistrictOptions: districts }),
  setMapSelection: ({ baseStateCql, selectedStateGeojson, selectedDistrictGeojson, districtCount }) =>
    set({ baseStateCql, selectedStateGeojson, selectedDistrictGeojson, districtCount }),
  resetSelection: () =>
    set({
      selectedStateCode: "",
      selectedStateName: "",
      selectedDistrict: "",
      selectedDistrictCode: "",
      selectedStateGeojson: null,
      selectedDistrictGeojson: null,
      baseStateCql: "",
      districtCount: 0,
    }),
}));

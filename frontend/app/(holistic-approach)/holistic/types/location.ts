export type StateOption = {
  label: string;
  value: string;
  stateCode: string;
};

export type DistrictOption = {
  label: string;
  value: string;
  districtCode: string;
  stateCode: string;
  stateName: string;
};

export type FeatureCollection = {
  type: "FeatureCollection";
  features: any[];
};

export type StateResponse = {
  state_options: StateOption[];
};

export type DistrictResponse = {
  district_options: DistrictOption[];
};

export type ZoneOption = {
  label: string;
  value: string;
};

// All stage criteria definitions — shared between /holistic and /split

export type StageConfig = {
  title: string;
  criteria: string[];
};

export const STAGE_CONFIGS: StageConfig[] = [
  {
    title: "Aviral Ganga",
    criteria: [
      "River flow (monthly)",
      "Tributary & drain flow",
      "Rainfall & runoff",
      "Groundwater recharge",
      "Channel geometry (width, depth)",
      "DEM, slope maps",
      "Surface flow direction & accumulation maps",
    ],
  },
  {
    title: "Nirmal Ganga",
    criteria: [
      "River water quality (BOD, DO, COD, pH, Turbidity)",
      "Groundwater quality",
      "STP details",
      "Drains & discharge points",
      "Industrial discharge",
      "Septage density",
      "Solid waste hotspots",
    ],
  },
  {
    title: "Jan Ganga",
    criteria: [
      "Population (urban/rural)",
      "Gram Panchayat data",
      "Fishing communities",
      "Public participation plans",
    ],
  },
  {
    title: "Arth Ganga",
    criteria: [
      "Agriculture (crop area, water demand)",
      "Irrigation dependency",
      "Tourism & cultural nodes",
      "Ghats & heritage sites",
      "Economic activity zones",
    ],
  },
  {
    title: "Gyan Ganga",
    criteria: [
      "All baseline datasets",
      "Remote sensing + GIS maps",
      "SWAT model outputs",
      "Hydrogeology (aquifer, MAR, paleo-channels)",
      "Monitoring stations & sensors",
    ],
  },
  {
    title: "Jeevant Ganga",
    criteria: [
      "Wetlands, ponds, lakes",
      "Riparian vegetation",
      "Biodiversity (fish, birds, invasive species)",
      "Floodplain & habitat data",
    ],
  },
];

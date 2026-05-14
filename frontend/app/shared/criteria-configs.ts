// All stage criteria definitions — shared between /holistic and /split
// Criteria that have real raster files on disk (per stage index).
// Only stages/criteria listed here will show the Generate button.
// Keep in sync with backend/holistic/views.py _build_phase_raster_map().
export const STAGE_RASTER_CRITERIA: Record<number, string[]> = {
  0: [
    "River flow (monthly)",
    "Tributary & drain flow",
    "Channel geometry (width, depth)",
    "Rainfall & runoff",
    "Groundwater recharge",
    "DEM, slope maps",
    "Surface flow direction & accumulation maps",
  ],
  1: [
    "River water quality (BOD, DO, COD, pH, Turbidity)",
    "Groundwater quality",
  ],
  3: [
    "Agriculture (crop area, water demand)",
    "Irrigation dependency",
    "Tourism & cultural nodes",
    "Ghats & heritage sites",
    "Economic activity zones",
  ],
  4: [
    "All baseline datasets",
    "Remote sensing + GIS maps",
    "SWAT model outputs",
    "Hydrogeology (aquifer, MAR, paleo-channels)",
    "Monitoring stations & sensors",
  ],
  5: [
    "Wetlands, ponds, lakes",
    "Riparian vegetation",
    "Biodiversity (fish, birds, invasive species)",
    "Floodplain & habitat data",
  ],
  // Stage 2: add criteria here once raster files are placed on the server
};

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

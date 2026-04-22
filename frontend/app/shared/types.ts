// ── Geography ────────────────────────────────────────────────────────────────

export type FeatureCollection = {
  type: "FeatureCollection";
  features: any[];
};

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

// ── Map basemap ───────────────────────────────────────────────────────────────

export type BasemapType = "terrain" | "satellite" | "streets" | "dark";

export const BASEMAP_TILES: Record<BasemapType, { url: string; attribution: string }> = {
  terrain: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
  },
  streets: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
  },
};

// ── Split screen shared types ─────────────────────────────────────────────────

export type StickyNote = {
  id: string;
  author: string;
  /** Side that created this note — used for permanent ownership lock */
  ownerSide: string;
  text: string;
  color: string;
  lat: number;
  lng: number;
  shape?: "sticky" | "rect" | "oval" | "rhombus" | "triangle" | "text";
};

export type ViewerMessage = {
  id: string;
  text: string;
  fromSide: string;
  fromTitle: string;
  /** "all" = sent by main screen → everyone sees it; "main" = sent by other screen → only main sees it */
  to: "all" | "main";
  timestamp: number;
  /** Present when the message is a note-placement notification — enables the Reveal button */
  noteId?: string;
};

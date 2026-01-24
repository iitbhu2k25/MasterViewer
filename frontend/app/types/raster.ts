// Define types for raster data
export interface RasterMetadata {
  id: string;
  name: string;
  description?: string;
  source: string;
  bounds: [number, number, number, number]; // [minX, minY, maxX, maxY]
  resolution: [number, number]; // [xRes, yRes]
  width: number;
  height: number;
  projection?: string;
  bands?: number;
  dataType?: string;
  noDataValue?: number;
  timestamp?: Date;
}

export interface RasterLayerProps {
  id: string;
  name: string;
  visible: boolean;
  url?: string; // We'll fetch this separately
}

export type MapLibrary = 'openlayers' | 'leaflet';

export interface MapViewProps {
  selectedRasters: RasterLayerProps[];
  library: MapLibrary;
  center?: [number, number];
  zoom?: number;
  onMapClick?: (coords: [number, number]) => void;
}
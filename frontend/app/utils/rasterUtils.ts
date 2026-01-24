import { RasterMetadata } from '@/app/types/raster';

// Sample raster data for demo purposes
export const sampleRasters: RasterMetadata[] = [
  {
    id: 'dem-1',
    name: 'Digital Elevation Model - Region 1',
    description: 'SRTM 30m resolution DEM',
    source: '/sample-data/dem_region1.tif',
    bounds: [-122.5, 37.5, -122.0, 38.0],
    resolution: [30, 30],
    width: 1667,
    height: 1667,
    projection: 'EPSG:4326',
    bands: 1,
    dataType: 'Float32',
    noDataValue: -9999,
    timestamp: new Date('2021-01-01')
  },
  {
    id: 'landcover-1',
    name: 'Land Cover Classification - 2023',
    description: 'Machine learning-based land cover classification',
    source: '/sample-data/landcover_2023.tif',
    bounds: [-122.5, 37.5, -122.0, 38.0],
    resolution: [10, 10],
    width: 5000,
    height: 5000,
    projection: 'EPSG:4326',
    bands: 1,
    dataType: 'Uint8',
    timestamp: new Date('2023-06-15')
  },
  {
    id: 'ndvi-1',
    name: 'NDVI - Summer 2023',
    description: 'Normalized Difference Vegetation Index',
    source: '/sample-data/ndvi_summer2023.tif',
    bounds: [-122.5, 37.5, -122.0, 38.0],
    resolution: [10, 10],
    width: 5000,
    height: 5000,
    projection: 'EPSG:4326',
    bands: 1,
    dataType: 'Float32',
    timestamp: new Date('2023-07-01')
  }
];

// Function to fetch available rasters
export const fetchAvailableRasters = async (): Promise<RasterMetadata[]> => {

  // In a real app, this would fetch from an API
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(sampleRasters);
    }, 500);
  });
};

// Function to load raster data
export const loadRasterData = async (rasterId: string): Promise<ArrayBuffer | null> => {
  try {
    // In a real app, this would fetch the actual raster data file
    const raster = sampleRasters.find(r => r.id === rasterId);
    if (!raster) return null;
    
    // Simulate loading the data
    return new Promise((resolve) => {
      setTimeout(() => {
        // This would be actual raster data in a real app
        // For now, return a mock ArrayBuffer
        const mockData = new ArrayBuffer(100);
        resolve(mockData);
      }, 1000);
    });
  } catch (error) {
    console.error('Error loading raster data:', error);
    return null;
  }
};

// Calculate statistics for a raster band
export const calculateRasterStats = (data: Float32Array | Int16Array | Uint8Array) => {
  if (data.length === 0) return null;
  
  let min = data[0];
  let max = data[0];
  let sum = 0;
  let validCount = 0;
  
  for (let i = 0; i < data.length; i++) {
    const val = data[i];
    // Skip no data values
    if (val === -9999) continue;
    
    min = Math.min(min, val);
    max = Math.max(max, val);
    sum += val;
    validCount++;
  }
  
  return {
    min,
    max,
    mean: sum / validCount,
    count: validCount
  };
};
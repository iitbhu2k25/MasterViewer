import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMapEvents, Popup, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { LatLng, Icon, Map as LeafletMap } from 'leaflet';

// Fix Leaflet default icon path issues - handle both string and StaticImageData
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// Helper function to extract URL string from imports
const getImageUrl = (image: any): string => {
  return typeof image === 'string' ? image : image.src || image.default || image;
};

// Define types for API responses
type WatershedFeature = {
  type: string;
  geometry: {
    type: string;
    coordinates: number[][][];
  };
  properties: {
    area_km2?: string;
    outlet_lat?: number;
    outlet_lng?: number;
    [key: string]: any;
  };
};

type RiverFeature = {
  type: string;
  geometry: {
    type: string;
    coordinates: number[][];
  };
  properties: {
    comid?: number;
    sorder?: number;
    [key: string]: any;
  };
};

type FlowpathFeature = {
  type: string;
  geometry: {
    type: string;
    coordinates: number[][];
  };
  properties: {
    comid?: number;
    sorder?: number;
    [key: string]: any;
  };
};

type GeoJSONResponse = {
  type: string;
  features: (WatershedFeature | RiverFeature | FlowpathFeature)[];
};

type FlowpathAPIResponse = {
  message: string;
  outlet: GeoJSONResponse;
  rivers: GeoJSONResponse;
};

// API endpoint types
type APIEndpoint = 'watershed_api' | 'upstream_rivers_api' | 'flowpath_api';

// Analysis mode type
type AnalysisMode = 'upstream' | 'downstream';

// Set up default Leaflet marker icon
const defaultIcon = new Icon({
  iconUrl: getImageUrl(iconUrl),
  iconRetinaUrl: getImageUrl(iconRetinaUrl),
  shadowUrl: getImageUrl(shadowUrl),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component for map click events
function MapClickHandler({ onClick }: { onClick: (latlng: LatLng) => void }) {
  useMapEvents({
    click: (e) => {
      onClick(e.latlng);
    },
  });
  return null;
}

// Custom loading button component
const LoadingButton = ({ isLoading, onClick, text }: { isLoading: boolean; onClick: () => void; text: string }) => {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`relative overflow-hidden flex items-center justify-center px-3 py-1 rounded-md text-sm text-white font-medium transition-all duration-300 ${isLoading
          ? 'bg-blue-400 cursor-not-allowed'
          : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
        }`}
    >
      {isLoading ? (
        <>
          <span className="absolute inset-0 flex items-center justify-center">
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </span>
          <span className="opacity-0">Processing</span>
        </>
      ) : (
        text
      )}
    </button>
  );
};

// Information panel component
const InfoPanel = ({
  watershedData,
  clickedPoint,
  onClear,
  mode,
  flowpathMessage
}: {
  watershedData: GeoJSONResponse | null;
  clickedPoint: [number, number] | null;
  onClear: () => void;
  mode: AnalysisMode;
  flowpathMessage?: string;
}) => {
  if (!watershedData && mode !== 'downstream') return null;

  return (
    <div className="absolute top-4 right-4 p-3 bg-white rounded-lg shadow-lg z-[500] w-64">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-blue-800 text-sm">{mode === 'upstream' ? 'Watershed Info' : 'Flowpath Info'}</h3>
        <button
          onClick={onClear}
          className="text-gray-400 hover:text-gray-600"
          title="Clear data"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-1 text-sm">
        {mode === 'upstream' && watershedData && watershedData.features && watershedData.features[0] && (
          <div className="flex justify-between">
            <span className="text-gray-600">Area:</span>
            <span className="font-medium">
              {(watershedData.features[0] as WatershedFeature)?.properties?.area_km2 || 'N/A'} km²
            </span>
          </div>
        )}
        {mode === 'downstream' && flowpathMessage && (
          <div className="flex justify-between">
            <span className="text-gray-600">Total Length:</span>
            <span className="font-medium">{flowpathMessage.match(/Total length: (\d+ km)/)?.[1] || 'N/A'}</span>
          </div>
        )}
        {clickedPoint && (
          <div className="flex justify-between">
            <span className="text-gray-600">Point:</span>
            <span className="font-medium">{clickedPoint[0].toFixed(4)}, {clickedPoint[1].toFixed(4)}</span>
          </div>
        )}
      </div>

      <div className="mt-2 pt-2 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          Data source: MERIT-Hydro
        </div>
      </div>
    </div>
  );
};

// Loading overlay component for the map
const LoadingOverlay = ({ show }: { show: boolean }) => {
  if (!show) return null;

  return (
    <div className="absolute inset-0  bg-opacity-30 backdrop-blur-sm z-[1000] flex items-center justify-center">
      <div className="bg-white p-4 rounded-lg shadow-lg flex flex-col items-center">
        <svg className="animate-spin h-8 w-8 text-blue-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <div className="text-sm font-medium text-gray-700">Processing Analysis</div>
        <div className="text-xs text-gray-500 mt-1">This may take a few moments...</div>
      </div>
    </div>
  );
};

// Custom CSS for the popup
const customPopupStyle = `
  .custom-popup .leaflet-popup-content-wrapper {
    background-color: white;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
  .custom-popup .leaflet-popup-content {
    margin: 0;
    padding: 8px;
    min-width: 140px;
  }
  .custom-popup .leaflet-popup-tip {
    background-color: white;
  }
  
  /* Make the marker bounce on add */
  @keyframes markerBounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }
  
  .leaflet-marker-icon {
    animation: markerBounce 0.5s ease;
  }
`;

const WatershedMap: React.FC = () => {
  const [clickedPoint, setClickedPoint] = useState<[number, number] | null>(null);
  const [watershedData, setWatershedData] = useState<GeoJSONResponse | null>(null);
  const [riversData, setRiversData] = useState<GeoJSONResponse | null>(null);
  const [flowpathData, setFlowpathData] = useState<GeoJSONResponse | null>(null);
  const [flowpathMessage, setFlowpathMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<AnalysisMode>('upstream');

  const mapRef = useRef<LeafletMap | null>(null);
  const watershedRef = useRef<L.GeoJSON | null>(null);
  const riversRef = useRef<L.GeoJSON | null>(null);
  const flowpathRef = useRef<L.GeoJSON | null>(null);

  // Function to validate GeoJSON
  const isValidGeoJSON = (data: any): data is GeoJSONResponse => {
    return (
      data &&
      typeof data === 'object' &&
      data.type === 'FeatureCollection' &&
      Array.isArray(data.features) &&
      data.features.every(
        (feature: any) =>
          feature.type === 'Feature' &&
          feature.geometry &&
          ['Point', 'LineString', 'Polygon', 'MultiLineString', 'MultiPolygon'].includes(feature.geometry.type)
      )
    );
  };

  // Function to transform data into GeoJSON
  const transformToGeoJSON = (data: any, endpoint: APIEndpoint): GeoJSONResponse | null => {
    if (endpoint === 'flowpath_api') {
      if (data && data.rivers && isValidGeoJSON(data.rivers)) {
        return data.rivers;
      }
      return null;
    }
    if (isValidGeoJSON(data)) {
      return data;
    }
    // Handle single Feature
    if (data && data.type === 'Feature' && data.geometry) {
      return {
        type: 'FeatureCollection',
        features: [data]
      };
    }
    // Handle raw geometry
    if (data && data.type && ['LineString', 'MultiLineString', 'Polygon', 'MultiPolygon'].includes(data.type)) {
      return {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: data,
            properties: {} as any // Type assertion to handle empty properties
          }
        ]
      };
    }
    return null;
  };

  // Function to fetch data from an API endpoint via our proxy
  const fetchData = async (endpoint: APIEndpoint, lat: number, lng: number) => {
    const url = `/api/watershed?endpoint=${endpoint}&lat=${lat}&lng=${lng}&precision=high`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error('Bad request: Check your latitude and longitude values.');
        } else if (response.status === 404) {
          throw new Error('Could not process: The point may be over ocean or invalid terrain.');
        } else if (response.status === 500) {
          throw new Error('Server error: Please try again later.');
        } else {
          throw new Error(`Error: ${response.status}`);
        }
      }

      const data = await response.json();
      console.log(`API response for ${endpoint}:`, data);

      // Validate or transform the data
      const validData = transformToGeoJSON(data, endpoint);
      if (!validData) {
        throw new Error('Invalid GeoJSON response from API');
      }

      // For flowpath_api, store the message
      if (endpoint === 'flowpath_api') {
        setFlowpathMessage(data.message || 'No message provided');
      }

      return validData;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('An unknown error occurred');
    }
  };

  // Handle map click event - set the clicked point and show popup
  const handleMapClick = (latlng: LatLng) => {
    const { lat, lng } = latlng;
    setClickedPoint([lat, lng]);

    // Clear any existing error
    if (error) {
      setError(null);
    }
  };

  // Handle delineate button click - fetch the data based on mode
  const handleDelineate = async () => {
    if (!clickedPoint) return;

    setLoading(true);
    setError(null);
    setFlowpathMessage(null);

    try {
      const [lat, lng] = clickedPoint;

      // Clear previous data
      setWatershedData(null);
      setRiversData(null);
      setFlowpathData(null);

      if (mode === 'upstream') {
        // Fetch watershed data
        const watershedData = await fetchData('watershed_api', lat, lng);
        setWatershedData(watershedData);

        // Fetch river network data
        const riversData = await fetchData('upstream_rivers_api', lat, lng);
        setRiversData(riversData);

        // Fit map to watershed bounds
        if (watershedData?.features?.length > 0 && mapRef.current) {
          try {
            const layer = L.geoJSON(watershedData as any);
            const bounds = layer.getBounds();
            if (bounds.isValid()) {
              mapRef.current.fitBounds(bounds, {
                padding: [50, 50],
                maxZoom: 13
              });
            }
          } catch (e) {
            console.error("Error fitting to bounds:", e);
          }
        }
      } else {
        // Fetch flowpath data
        const flowpathData = await fetchData('flowpath_api', lat, lng);
        setFlowpathData(flowpathData);

        // Fit map to flowpath bounds
        if (flowpathData?.features?.length > 0 && mapRef.current) {
          try {
            const layer = L.geoJSON(flowpathData as any);
            const bounds = layer.getBounds();
            if (bounds.isValid()) {
              mapRef.current.fitBounds(bounds, {
                padding: [50, 50],
                maxZoom: 13
              });
            }
          } catch (e) {
            console.error("Error fitting to bounds:", e);
          }
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle clearing the data
  const handleClearWatershed = () => {
    setWatershedData(null);
    setRiversData(null);
    setFlowpathData(null);
    setFlowpathMessage(null);
    setClickedPoint(null);
    setError(null);
  };

  // Handle mode change
  const handleModeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setMode(event.target.value as AnalysisMode);
    // Clear existing data when mode changes
    handleClearWatershed();
  };

  useEffect(() => {
    // Add custom styles for the popup
    const style = document.createElement('style');
    style.textContent = customPopupStyle;
    document.head.appendChild(style);

    // Set up Leaflet default icon
    const DefaultIcon = L.Icon.Default as any;
    delete DefaultIcon.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: getImageUrl(iconRetinaUrl),
      iconUrl: getImageUrl(iconUrl),
      shadowUrl: getImageUrl(shadowUrl)
    });

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  // Style functions for GeoJSON layers
  const watershedStyle = {
    color: 'red',
    weight: 4,
    opacity: 0.7,
    fillColor: 'white',
    fillOpacity: 0.1,
  };

  const riverStyle = (feature?: any) => {
    const order = feature?.properties?.sorder || 1;
    const width = Math.max(1, order);
    return {
      color: 'blue',
      weight: width,
      opacity: 0.9,
    };
  };

  const flowpathStyle = (feature?: any) => {
    const order = feature?.properties?.sorder || 1;
    const width = Math.max(1, order);
    return {
      color: 'blue',
      weight: width,
      opacity: 0.9,
    };
  };

  const handleZoomIn = (e: React.MouseEvent) => {
    e.preventDefault();
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.preventDefault();
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-row bg-white">
      {/* Left Panel (25%) */}
      <div className="w-1/4 p-4 bg-gray-100 border-r border-gray-300 overflow-y-auto">
        <h1 className="text-xl font-bold text-blue-800 mb-4">Watershed Tool</h1>
        <div className="mb-4">
          <label htmlFor="mode-select" className="block text-gray-700 font-medium mb-2">
            Analysis Mode:
          </label>
          <select
            id="mode-select"
            value={mode}
            onChange={handleModeChange}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="upstream">Upstream</option>
            <option value="downstream">Downstream</option>
          </select>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Feature Info Panel */}
        <div className="text-sm space-y-3">
          {mode === 'upstream' && watershedData && (
            <div>
              <h2 className="font-semibold text-gray-700">Watershed Features</h2>
              <p className="text-gray-600">Count: {watershedData.features?.length}</p>
            </div>
          )}

          {mode === 'upstream' && riversData && (
            <div>
              <h2 className="font-semibold text-gray-700">River Network</h2>
              <p className="text-gray-600">Count: {riversData.features?.length}</p>
            </div>
          )}

          {mode === 'downstream' && flowpathData && (
            <div>
              <h2 className="font-semibold text-gray-700">Flowpath Data</h2>
              <p className="text-gray-600">Count: {flowpathData.features?.length}</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Map (75%) */}
      <div className="w-3/4 relative m-4 border border-gray-300 rounded-2xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl">
        <LoadingOverlay show={loading} />

        {(watershedData || flowpathData) && (
          <InfoPanel
            watershedData={mode === 'upstream' ? watershedData : flowpathData}
            clickedPoint={clickedPoint}
            onClear={handleClearWatershed}
            mode={mode}
            flowpathMessage={flowpathMessage || undefined}
          />
        )}

        <MapContainer
          center={[22.9734, 78.6569]}
          zoom={6}
          style={{ height: 'calc(100vh - 2rem)', width: '100%' }}
          ref={(map) => {
            mapRef.current = map;
          }}
          zoomControl={false}
        >
          {/* Custom Zoom Controls */}
          <div
            className="leaflet-control-zoom leaflet-bar leaflet-control"
            style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 1000 }}
          >
            <a 
              className="leaflet-control-zoom-in" 
              href="#" 
              title="Zoom in" 
              role="button" 
              aria-label="Zoom in"
              onClick={handleZoomIn}
            >
              +
            </a>
            <a 
              className="leaflet-control-zoom-out" 
              href="#" 
              title="Zoom out" 
              role="button" 
              aria-label="Zoom out"
              onClick={handleZoomOut}
            >
              −
            </a>
          </div>

          <TileLayer
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapClickHandler onClick={handleMapClick} />

          {clickedPoint && (
            <Marker position={[clickedPoint[0], clickedPoint[1]]} icon={defaultIcon}>
              <Popup autoPan={true} closeOnClick={false} autoClose={false}>
                <div className="flex flex-col gap-2 text-sm">
                  <div className="font-medium text-gray-700">Selected Point</div>
                  <div className="text-gray-600">
                    Lat: {clickedPoint[0].toFixed(5)}<br />
                    Lng: {clickedPoint[1].toFixed(5)}
                  </div>
                  <LoadingButton isLoading={loading} onClick={handleDelineate} text="Delineate" />
                </div>
              </Popup>
            </Marker>
          )}

          {mode === 'upstream' && watershedData && (
            <GeoJSON 
              data={watershedData as any} 
              style={watershedStyle} 
              ref={watershedRef} 
            />
          )}

          {mode === 'upstream' && riversData && (
            <GeoJSON 
              data={riversData as any} 
              style={riverStyle} 
              ref={riversRef} 
            />
          )}

          {mode === 'downstream' && flowpathData && (
            <GeoJSON 
              data={flowpathData as any} 
              style={flowpathStyle} 
              ref={flowpathRef} 
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default WatershedMap;
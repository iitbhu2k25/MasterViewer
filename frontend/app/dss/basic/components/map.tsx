'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FeatureCollection, Feature } from 'geojson';

// Define props interface
interface MapProps {
  selectedState?: string;
  selectedDistricts?: string[];
  selectedSubDistricts?: string[];
  selectedVillages?: string[];
  subDistrictData?: any[];
  className?: string;
  onLocationSelect?: (locations: {
    state: string;
    districts: string[];
    subDistricts: string[];
    villages: string[];
    allVillages?: any[];
    totalPopulation?: number;
  }) => void;
}

// Create a separate component to handle map updates
function MapLayers({
  selectedState,
  selectedDistricts,
  selectedSubDistricts,
  selectedVillages,
  subDistrictData,
  onLocationSelect,
}: {
  selectedState?: string;
  selectedDistricts?: string[];
  selectedSubDistricts?: string[];
  selectedVillages?: string[];
  subDistrictData?: any[];
  onLocationSelect?: (locations: {
    state: string;
    districts: string[];
    subDistricts: string[];
    villages: string[];
    allVillages?: any[];
    totalPopulation?: number;
  }) => void;
}) {
  const map = useMap();

  // Refs for layer objects
  const stateLayerRef = useRef<L.GeoJSON | null>(null);
  const districtLayersRef = useRef<L.GeoJSON | null>(null);
  const subDistrictLayersRef = useRef<L.GeoJSON | null>(null);
  const villageLayersRef = useRef<L.GeoJSON | null>(null);
  const baseMapLayerRef = useRef<L.GeoJSON | null>(null);

  // Loading states
  const [isLoadingBase, setIsLoadingBase] = useState(true);
  const [isLoadingState, setIsLoadingState] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingSubDistricts, setIsLoadingSubDistricts] = useState(false);
  const [isLoadingVillages, setIsLoadingVillages] = useState(false);

  // Track previous selections
  const prevStateRef = useRef<string | undefined>(undefined);
  const prevDistrictsRef = useRef<string[] | undefined>([]);
  const prevSubDistrictsRef = useRef<string[] | undefined>([]);
  const prevVillagesRef = useRef<string[] | undefined>([]);

  // Combined loading state
  const isLoading =
    isLoadingBase ||
    isLoadingState ||
    isLoadingDistricts ||
    isLoadingSubDistricts ||
    isLoadingVillages;

  // GeoJSON styles
  const stateGeoJsonStyle = {
    fillColor: '#3388ff',
    weight: 2,
    opacity: 1,
    color: 'red',
    dashArray: '1',
    fillOpacity: 0,
  };

  const districtGeoJsonStyle = {
    fillColor: '#33ff88',
    weight: 3,
    opacity: 1,
    color: 'green',
    dashArray: '3',
    fillOpacity: 0.3,
  };

  const subDistrictGeoJsonStyle = {
    fillColor: '#ff6b6b',
    weight: 4,
    opacity: 1,
    color: 'blue',
    dashArray: '5',
    fillOpacity: 0.4,
  };

  const villageGeoJsonStyle = {
    fillColor: '#ffff00',
    weight: 1,
    opacity: 1,
    color: 'purple',
    dashArray: '2',
    fillOpacity: 0.5,
  };

  const baseMapGeoJsonStyle = {
    fillColor: '#blue',
    weight: 2,
    opacity: 1,
    color: 'blue',
    fillOpacity: 0,
  };

  // Cleanup functions
  const cleanupDistrictLayers = () => {
    if (districtLayersRef.current) {
      console.log('FORCE REMOVING district layers');
      try {
        map.removeLayer(districtLayersRef.current);
        districtLayersRef.current = null;
      } catch (error) {
        console.error('Error removing district layers:', error);
      }
    }
  };

  const cleanupSubDistrictLayers = () => {
    if (subDistrictLayersRef.current) {
      console.log('FORCE REMOVING sub-district layers');
      try {
        map.removeLayer(subDistrictLayersRef.current);
        subDistrictLayersRef.current = null;
      } catch (error) {
        console.error('Error removing sub-district layers:', error);
      }
    }
  };

  const cleanupVillageLayers = () => {
    if (villageLayersRef.current) {
      console.log('FORCE REMOVING village layers');
      try {
        map.removeLayer(villageLayersRef.current);
        villageLayersRef.current = null;
      } catch (error) {
        console.error('Error removing village layers:', error);
      }
    }
  };

  const cleanupStateLayer = () => {
    if (stateLayerRef.current) {
      console.log('FORCE REMOVING state layer');
      try {
        map.removeLayer(stateLayerRef.current);
        stateLayerRef.current = null;
      } catch (error) {
        console.error('Error removing state layer:', error);
      }
    }
  };

  // Update global window object and call onLocationSelect
  const updateLocationData = useCallback(() => {
    const locationData = {
      state: selectedState || '',
      districts: selectedDistricts || [],
      subDistricts: selectedSubDistricts || [],
      villages: selectedVillages || [],
      allVillages: subDistrictData || [],
      totalPopulation: subDistrictData?.reduce(
        (sum, item) => sum + (item.population || 0),
        0
      ),
    };

    // Check if window is defined before accessing it
    if (typeof window !== 'undefined') {
      (window as any).selectedLocations = locationData;
    }

    onLocationSelect?.(locationData);
  }, [
    selectedState,
    selectedDistricts,
    selectedSubDistricts,
    selectedVillages,
    subDistrictData,
    onLocationSelect,
  ]);

  // Handle state changes
  useEffect(() => {
    if (selectedState !== prevStateRef.current) {
      console.log(
        '*** STATE CHANGED: Forcing cleanup of district, subdistrict, and village layers ***'
      );
      cleanupDistrictLayers();
      cleanupSubDistrictLayers();
      cleanupVillageLayers();
      setIsLoadingDistricts(false);
      setIsLoadingSubDistricts(false);
      setIsLoadingVillages(false);
      prevStateRef.current = selectedState;
      updateLocationData();
    }
  }, [selectedState, map, updateLocationData]);

  // Handle district changes
  useEffect(() => {
    const prevDistrictsJSON = JSON.stringify(prevDistrictsRef.current || []);
    const currentDistrictsJSON = JSON.stringify(selectedDistricts || []);
    if (prevDistrictsJSON !== currentDistrictsJSON) {
      console.log(
        '*** DISTRICTS CHANGED: Forcing cleanup of subdistrict and village layers ***'
      );
      cleanupSubDistrictLayers();
      cleanupVillageLayers();
      setIsLoadingSubDistricts(false);
      setIsLoadingVillages(false);
      prevDistrictsRef.current = selectedDistricts;
      updateLocationData();
    }
  }, [selectedDistricts, map, updateLocationData]);

  // Handle sub-district changes
  useEffect(() => {
    const prevSubDistrictsJSON = JSON.stringify(prevSubDistrictsRef.current || []);
    const currentSubDistrictsJSON = JSON.stringify(selectedSubDistricts || []);
    if (prevSubDistrictsJSON !== currentSubDistrictsJSON) {
      console.log('*** SUBDISTRICTS CHANGED: Forcing cleanup of village layers ***');
      cleanupVillageLayers();
      setIsLoadingVillages(false);
      prevSubDistrictsRef.current = selectedSubDistricts;
      updateLocationData();
    }
  }, [selectedSubDistricts, map, updateLocationData]);

  // Handle village changes
  useEffect(() => {
    const prevVillagesJSON = JSON.stringify(prevVillagesRef.current || []);
    const currentVillagesJSON = JSON.stringify(selectedVillages || []);
    if (prevVillagesJSON !== currentVillagesJSON) {
      console.log('*** VILLAGES CHANGED ***');
      cleanupVillageLayers();
      prevVillagesRef.current = selectedVillages;
      updateLocationData();
    }
  }, [selectedVillages, map, updateLocationData]);

  // Fetch base map
  useEffect(() => {
    let isMounted = true;
    const fetchBaseMap = async () => {
      try {
        setIsLoadingBase(true);
        console.log('Fetching base map for India');
        const response = await fetch('http://localhost:9000/api/basic/basemap/', {
          method: 'GET',
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Base map data received');

        if (
          !data ||
          !data.type ||
          data.type !== 'FeatureCollection' ||
          !Array.isArray(data.features)
        ) {
          throw new Error('Invalid GeoJSON: Expected a FeatureCollection with features');
        }

        const validFeatures = data.features.filter((feature: any) => {
          return (
            feature &&
            feature.type === 'Feature' &&
            feature.geometry &&
            feature.geometry.coordinates &&
            feature.geometry.coordinates.length > 0
          );
        });

        if (validFeatures.length === 0) {
          throw new Error('No valid features found in GeoJSON');
        }

        const newBaseLayer = L.geoJSON(
          { type: 'FeatureCollection', features: validFeatures } as GeoJSON.FeatureCollection,
          {
            style: baseMapGeoJsonStyle,
            onEachFeature: (feature, layer) => {
              if (feature.properties && feature.properties.name) {
                layer.bindPopup(feature.properties.name);
              }
            },
          }
        );

        map.whenReady(() => {
          if (isMounted) {
            if (baseMapLayerRef.current) {
              map.removeLayer(baseMapLayerRef.current);
            }
            newBaseLayer.addTo(map);
            baseMapLayerRef.current = newBaseLayer;
            try {
              const bounds = newBaseLayer.getBounds();
              if (bounds.isValid()) {
                map.fitBounds(bounds);
              } else {
                console.warn('Invalid bounds for base map layer');
              }
            } catch (error) {
              console.error('Error fitting map to base map bounds:', error);
            }
            setIsLoadingBase(false);
          }
        });
      } catch (error) {
        console.error('Error fetching or rendering base map:', error);
        if (isMounted) {
          setIsLoadingBase(false);
        }
      }
    };

    fetchBaseMap();
    return () => {
      isMounted = false;
      if (baseMapLayerRef.current) {
        map.removeLayer(baseMapLayerRef.current);
        baseMapLayerRef.current = null;
      }
    };
  }, [map]);

  // Fetch state shapefile
  useEffect(() => {
    if (!selectedState) {
      cleanupStateLayer();
      setIsLoadingState(false);
      return;
    }

    setIsLoadingState(true);
    const fetchStateShapefile = async () => {
      try {
        console.log('Fetching shapefile for state:', selectedState);
        const response = await fetch('http://localhost:9000/api/basic/state-shapefile/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state_code: selectedState }),
        });

        if (!response.ok) {
          alert(
            'Due to unavailability of the JSON data, the map will not be displayed for the selected state. Please select another state.'
          );
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('State shapefile data received');

        if (
          !data ||
          !data.type ||
          data.type !== 'FeatureCollection' ||
          !Array.isArray(data.features)
        ) {
          throw new Error('Invalid GeoJSON: Expected a FeatureCollection with features');
        }

        const validFeatures = data.features.filter((feature: any) => {
          return (
            feature &&
            feature.type === 'Feature' &&
            feature.geometry &&
            feature.geometry.coordinates &&
            feature.geometry.coordinates.length > 0
          );
        });

        if (validFeatures.length === 0) {
          throw new Error('No valid features found in state GeoJSON');
        }

        const newStateLayer = L.geoJSON(
          { type: 'FeatureCollection', features: validFeatures } as GeoJSON.FeatureCollection,
          {
            style: stateGeoJsonStyle,
            onEachFeature: (feature, layer) => {
              if (feature.properties && feature.properties.name) {
                layer.bindPopup(feature.properties.name);
              }
            },
          }
        );

        map.whenReady(() => {
          cleanupStateLayer();
          newStateLayer.addTo(map);
          stateLayerRef.current = newStateLayer;
          try {
            const bounds = newStateLayer.getBounds();
            if (bounds.isValid()) {
              map.fitBounds(bounds);
            } else {
              console.warn('Invalid bounds for state layer');
            }
          } catch (error) {
            console.error('Error fitting map to state layer bounds:', error);
          }
          setIsLoadingState(false);
        });
      } catch (error) {
        console.error('Error fetching or rendering state shapefile:', error);
        setIsLoadingState(false);
      }
    };

    fetchStateShapefile();
    return () => {
      cleanupStateLayer();
    };
  }, [selectedState, map]);

  // Fetch district shapefiles
  useEffect(() => {
    if (!selectedDistricts || selectedDistricts.length === 0 || !selectedState) {
      cleanupDistrictLayers();
      setIsLoadingDistricts(false);
      return;
    }

    setIsLoadingDistricts(true);
    const fetchDistrictShapefiles = async () => {
      try {
        const districtPayload = {
          districts: selectedDistricts.map((districtCode) => ({
            state_code: selectedState,
            district_c: districtCode,
          })),
        };

        console.log('District API request payload:', districtPayload);
        const response = await fetch('http://localhost:9000/api/basic/multiple-districts/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(districtPayload),
        });

        if (!response.ok) {
          alert('We have data only for Uttar Pradesh.');
          console.error('Failed to fetch district data:', response.status);
          setIsLoadingDistricts(false);
          return;
        }

        const data = await response.json();
        console.log('District shapefile data received');

        if (
          !data ||
          !data.type ||
          data.type !== 'FeatureCollection' ||
          !Array.isArray(data.features)
        ) {
          throw new Error('Invalid GeoJSON: Expected a FeatureCollection with features');
        }

        const validFeatures = data.features.filter((feature: any) => {
          return (
            feature &&
            feature.type === 'Feature' &&
            feature.geometry &&
            feature.geometry.coordinates &&
            feature.geometry.coordinates.length > 0
          );
        });

        if (validFeatures.length === 0) {
          throw new Error('No valid features found in district GeoJSON');
        }

        const newDistrictLayers = L.geoJSON(
          { type: 'FeatureCollection', features: validFeatures } as GeoJSON.FeatureCollection,
          {
            style: districtGeoJsonStyle,
            onEachFeature: (feature, layer) => {
              if (feature.properties && feature.properties.name) {
                layer.bindPopup(feature.properties.name);
              }
            },
          }
        );

        map.whenReady(() => {
          cleanupDistrictLayers();
          newDistrictLayers.addTo(map);
          districtLayersRef.current = newDistrictLayers;
          try {
            const bounds = newDistrictLayers.getBounds();
            if (bounds.isValid()) {
              map.fitBounds(bounds, { padding: [50, 50] });
            }
          } catch (error) {
            console.error('Error fitting map to district layer bounds:', error);
          }
          setIsLoadingDistricts(false);
        });
      } catch (error) {
        console.error('Error fetching or rendering district shapefiles:', error);
        setIsLoadingDistricts(false);
      }
    };

    fetchDistrictShapefiles();
    return () => {
      cleanupDistrictLayers();
    };
  }, [selectedDistricts, selectedState, map]);

  // Fetch sub-district shapefiles
  useEffect(() => {
    if (!selectedSubDistricts || selectedSubDistricts.length === 0) {
      cleanupSubDistrictLayers();
      setIsLoadingSubDistricts(false);
      return;
    }

    setIsLoadingSubDistricts(true);
    const fetchSubDistrictShapefiles = async () => {
      try {
        const subDistrictPayload = {
          subdistricts: selectedSubDistricts.map((subDistrictCode) => ({
            subdis_cod: subDistrictCode,
          })),
        };

        console.log('SubDistrict API request payload:', subDistrictPayload);
        const response = await fetch('http://localhost:9000/api/basic/multiple-subdistricts/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subDistrictPayload),
        });

        if (!response.ok) {
          console.error('Failed to fetch subdistrict data:', response.status);
          setIsLoadingSubDistricts(false);
          return;
        }

        const data = await response.json();
        console.log('SubDistrict shapefile data received');

        if (!data || !data.features || data.features.length === 0) {
          console.warn('No valid subdistrict data received');
          setIsLoadingSubDistricts(false);
          return;
        }

        const newSubDistrictLayers = L.geoJSON(data, {
          style: subDistrictGeoJsonStyle,
          onEachFeature: (feature, layer) => {
            if (feature.properties && feature.properties.name) {
              layer.bindPopup(feature.properties.name);
            }
          },
        });

        map.whenReady(() => {
          cleanupSubDistrictLayers();
          newSubDistrictLayers.addTo(map);
          subDistrictLayersRef.current = newSubDistrictLayers;
          try {
            const bounds = newSubDistrictLayers.getBounds();
            if (bounds.isValid()) {
              map.fitBounds(bounds, { padding: [30, 30] });
            }
          } catch (error) {
            console.error('Error fitting map to sub-district layer bounds:', error);
          }
          setIsLoadingSubDistricts(false);
        });
      } catch (error) {
        console.error('Error fetching or rendering sub-district shapefiles:', error);
        setIsLoadingSubDistricts(false);
      }
    };

    fetchSubDistrictShapefiles();
    return () => {
      cleanupSubDistrictLayers();
    };
  }, [selectedSubDistricts, map]);

  // Fetch village shapefiles
  useEffect(() => {
    if (!selectedVillages || selectedVillages.length === 0) {
      cleanupVillageLayers();
      setIsLoadingVillages(false);
      return;
    }

    setIsLoadingVillages(true);
    const fetchVillageShapefiles = async () => {
      try {
        const villagePayload = {
          villages: selectedVillages.map((villageCode) => ({
            shape_id: villageCode,
          })),
        };

        console.log('Village API request payload:', villagePayload);
        const response = await fetch('http://localhost:9000/api/basic/multiple-villages/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(villagePayload),
        });

        if (!response.ok) {
          // alert(
          //   'Due to unavailability of the JSON data, the map will not be displayed for the selected village. Please continue.'
          // );
          console.error('Failed to fetch village data:', response.status);
          setIsLoadingVillages(false);
          return;
        }

        const data = await response.json();
        console.log('Village shapefile data received');

        if (!data || !data.features || data.features.length === 0) {
          console.warn('No valid village data received');
          setIsLoadingVillages(false);
          return;
        }

        const newVillageLayers = L.geoJSON(data, {
          style: villageGeoJsonStyle,
          onEachFeature: (feature, layer) => {
            if (feature.properties && (feature.properties.shapeName || feature.properties.name)) {
              const name = feature.properties.shapeName || feature.properties.name;
              layer.bindPopup(name);
            }
          },
        });

        map.whenReady(() => {
          cleanupVillageLayers();
          newVillageLayers.addTo(map);
          villageLayersRef.current = newVillageLayers;
          try {
            const bounds = newVillageLayers.getBounds();
            if (bounds.isValid()) {
              map.fitBounds(bounds, { padding: [20, 20] });
            }
          } catch (error) {
            console.error('Error fitting map to village layer bounds:', error);
          }
          setIsLoadingVillages(false);
        });
      } catch (error) {
        console.error('Error fetching or rendering village shapefiles:', error);
        setIsLoadingVillages(false);
      }
    };

    fetchVillageShapefiles();
    return () => {
      cleanupVillageLayers();
    };
  }, [selectedVillages, map]);

  return (
    <>
      {isLoading && (
        <div className="absolute top-1/2 left-1/2  transform -translate-x-1/2 -translate-y-1/2 z-[10]">
          <button className="flex items-center bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse">
            <svg
              className="animate-spin h-5 w-5 mr-2 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Loading...
          </button>
        </div>
      )}
    </>
  );
}

export default function Map({
  selectedState,
  selectedDistricts,
  selectedSubDistricts,
  selectedVillages,
  subDistrictData,
  className,
  onLocationSelect,
}: MapProps) {
  console.log('Map component rendering with selectedState:', selectedState);
  console.log('Map component rendering with selectedDistricts:', selectedDistricts);
  console.log('Map component rendering with selectedSubDistricts:', selectedSubDistricts);
  console.log('Map component rendering with selectedVillages:', selectedVillages);

  // State to track if component is mounted (client-side)
  const [isMounted, setIsMounted] = useState(false);

  // Fix Leaflet icon issues
  useEffect(() => {
    // Only run on client side
    setIsMounted(true);

    if (typeof window !== 'undefined' && L && L.Icon) {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      });
    }
  }, []);

  // Don't render map until component is mounted (client-side)
  if (!isMounted) {
    return (
      <div className="flex items-center justify-center h-[48vh] border-4 border-blue-500 rounded-xl shadow-lg p-4">
        <div className="text-gray-500">Loading map...</div>
      </div>
    );
  }

  return (

<div className={`map-container ${className || ''}`} style={{ background: '#ffffff' }}>

    <div className="relative">
      <MapContainer
        center={[22.9734, 78.6569]} // India center coordinates
        zoom={4}
        className="map-container border-4 border-blue-500  rounded-xl shadow-lg p-4 hover:border-green-500 hover:shadow-2xl transition-all duration-300 w-[30vw] h-[48vh] mx-auto"
        worldCopyJump={true}
        maxBoundsViscosity={1.0}
        minZoom={2}
        scrollWheelZoom={true}
        doubleClickZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          noWrap={false}
          bounds={[[-90, -180], [90, 180]]}
        />
        <MapLayers
          selectedState={selectedState}
          selectedDistricts={selectedDistricts}
          selectedSubDistricts={selectedSubDistricts}
          selectedVillages={selectedVillages}
          subDistrictData={subDistrictData}
          onLocationSelect={onLocationSelect}
        />

        <div className="absolute bottom-2 left-2 bg-white px-3 py-2 text-xs rounded shadow z-[1000] space-y-1">
          <div className="flex items-center space-x-2">
            <span className="w-4 h-2 bg-blue-500 inline-block"></span>
            <span>India Boundary</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-4 h-2 bg-red-500 inline-block"></span>
            <span>State Boundary</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-4 h-2 bg-green-500 inline-block"></span>
            <span>District</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-4 h-2 bg-blue-500 inline-block"></span>
            <span>Sub-District</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-4 h-2 bg-yellow-500 inline-block"></span>
            <span>Village</span>
          </div>
        </div>
      </MapContainer>
    </div>
   </div>
  );
}
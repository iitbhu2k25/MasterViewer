// app/dss/varuna/dashboard/varunamap.tsx
'use client';
import React, { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import GeoJSON from 'ol/format/GeoJSON';
import { Style, Fill, Stroke, Circle as CircleStyle, Text } from 'ol/style';
import { Point } from 'ol/geom';
import { Feature } from 'ol';
import { fromLonLat, toLonLat } from 'ol/proj';
import { defaults as defaultControls, ScaleLine } from 'ol/control';
import { Select } from 'ol/interaction';
import { click } from 'ol/events/condition';
import Overlay from 'ol/Overlay';

interface DrainStation {
  id: number;
  location: string;
  stream?: string;
  lat: number;
  lon: number;
  ph: number;
  temp: number;
  ec_us_cm: number;
  tds_ppm: number;
  do_mg_l: number;
  turbidity: number;
  tss_mg_l: number;
  bod_mg_l: number;
  cod: number;
}

interface VarunaMapProps {
  sidebarCollapsed: boolean;
  showNotification: (title: string, message: string, type?: 'success' | 'error' | 'info') => void;
  selectedFilter?: string | null;
}

interface RiverInfo {
  id: string;
  display_name: string;
  folder_path: string;
  shapefile_path: string;
  color?: string;
}

const VarunaMap: React.FC<VarunaMapProps> = ({ sidebarCollapsed, showNotification, selectedFilter }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const [currentParameter, setCurrentParameter] = useState<'bod' | 'cod' | 'do' | 'ph'>('do');
  const [drainStations, setDrainStations] = useState<DrainStation[]>([]);
  const [loading, setLoading] = useState(false);
  const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0 });
  const [availableRivers, setAvailableRivers] = useState<RiverInfo[]>([]);
  const [currentBasemap, setCurrentBasemap] = useState<'osm' | 'satellite'>('osm');
  
  // Layer references
  const riverLayersRef = useRef<{ [key: string]: VectorLayer<VectorSource> }>({});
  const stationLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const baseMapsRef = useRef<{ [key: string]: TileLayer<OSM | XYZ> }>({});
  const popupRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<Overlay | null>(null);
  const selectInteractionRef = useRef<Select | null>(null);

  // API base URL
  const API_BASE = 'http://localhost:9000';

  // River Color Scheme
  const RIVER_COLORS = {
    varuna: '#0066CC',      // Main Varuna - Blue
    basuhi: '#00AA44',      // Basuhi - Green  
    morwa: '#FF6600',       // Morwa - Orange
    basin: '#8B4513',       // Basin - Brown
    default: '#0ea5e9'      // Default - Light Blue
  };

  // Get river color
  const getRiverColor = (riverId: string): string => {
    const lowerRiverId = riverId.toLowerCase();
    if (lowerRiverId.includes('varuna')) return RIVER_COLORS.varuna;
    if (lowerRiverId.includes('basuhi')) return RIVER_COLORS.basuhi;
    if (lowerRiverId.includes('morwa')) return RIVER_COLORS.morwa;
    if (lowerRiverId.includes('basin')) return RIVER_COLORS.basin;
    return RIVER_COLORS.default;
  };

  // Get river width
  const getRiverWidth = (riverId: string): number => {
    const lowerRiverId = riverId.toLowerCase();
    if (lowerRiverId.includes('varuna')) return 4;  // Main river - thicker
    if (lowerRiverId.includes('basin')) return 2;   // Basin boundary - thinner
    return 3; // Other rivers - medium
  };

  // Get parameter value
  const getParameterValue = (station: DrainStation, parameter: string): number => {
    switch (parameter) {
      case 'bod': return station.bod_mg_l || 0;
      case 'cod': return station.cod || 0;
      case 'do': return station.do_mg_l || 0;
      case 'ph': return station.ph || 7;
      default: return 0;
    }
  };

  // Get parameter display name
  const getParameterName = (param: string): string => {
    switch (param) {
      case 'bod': return 'BOD (mg/L)';
      case 'cod': return 'COD (mg/L)';
      case 'do': return 'DO (mg/L)';
      case 'ph': return 'pH';
      default: return param.toUpperCase();
    }
  };

  // Color schemes based on Drain Water Quality thresholds
  const getParameterColor = (parameter: string, value: number): string => {
    switch (parameter) {
      case 'bod':
        if (value <= 3) return '#22c55e'; // Good
        if (value <= 6) return '#eab308'; // Moderate
        return '#ef4444'; // Poor
      case 'cod':
        if (value <= 10) return '#22c55e'; // Good
        if (value <= 50) return '#eab308'; // Moderate
        return '#ef4444'; // Poor
      case 'do':
        if (value >= 6) return '#22c55e'; // Good
        if (value >= 4) return '#eab308'; // Moderate
        return '#ef4444'; // Poor
      case 'ph':
        if (value >= 6.5 && value <= 8.5) return '#22c55e'; // Good
        if ((value >= 6 && value < 6.5) || (value > 8.5 && value <= 9)) return '#eab308'; // Moderate
        return '#ef4444'; // Poor
      default:
        return '#6b7280';
    }
  };

  // Get quality status
  const getQualityStatus = (parameter: string, value: number): string => {
    const color = getParameterColor(parameter, value);
    if (color === '#22c55e') return 'Good';
    if (color === '#eab308') return 'Moderate';
    return 'Poor';
  };

  // Create station style
  const createStationStyle = (station: DrainStation, parameter: string) => {
    const value = getParameterValue(station, parameter);
    const color = getParameterColor(parameter, value);
    
    return new Style({
      image: new CircleStyle({
        radius: 8,
        fill: new Fill({ color }),
        stroke: new Stroke({ color: '#ffffff', width: 2 })
      }),
      text: new Text({
        text: value.toFixed(1),
        font: '11px sans-serif',
        fill: new Fill({ color: '#000' }),
        backgroundFill: new Fill({ color: 'rgba(255,255,255,0.8)' }),
        padding: [2, 2, 2, 2],
        offsetY: -25
      })
    });
  };

  // Create popup content
  const createPopupContent = (station: DrainStation, parameter: string): string => {
    const value = getParameterValue(station, parameter);
    const paramName = getParameterName(parameter);
    const qualityStatus = getQualityStatus(parameter, value);
    
    return `
      <div style="min-width: 120px; max-width: 140px; font-family: sans-serif; position: relative; padding: 8px;">
        <div style="font-weight: bold; margin-bottom: 6px; color: #1f2937; font-size: 11px; padding-right: 20px;">
          📍 ${station.location.length > 45 ? station.location.substring(0, 45)+ '...' : station.location+(" - ("+station.stream+")")}
        </div>
        <div style="margin-bottom: 3px; padding: 2px 4px; background: #f3f4f6; border-radius: 3px; font-size: 10px;">
          <strong>${paramName}:</strong> 
          <span style="color: ${getParameterColor(parameter, value)}; font-weight: bold;">
            ${value.toFixed(1)}
          </span>
        </div>
        <div style="margin-bottom: 3px; font-size: 9px;">
          <strong>Status:</strong> 
          <span style="color: ${getParameterColor(parameter, value)}; font-weight: bold;">
            ${qualityStatus}
          </span>
        </div>
        <div style="font-size: 8px; color: #6b7280; margin-top: 4px;">
          Temprature: ${station.temp+" °C"}
        </div>
      </div>
    `;
  };

  // Scan for available rivers
  const scanAvailableRivers = async (): Promise<RiverInfo[]> => {
    try {
      const response = await fetch(`${API_BASE}/api/rivers/scan/`);
      const data = await response.json();
      
      if (data.status === 'success') {
        const rivers = Object.values(data.rivers) as RiverInfo[];
        setAvailableRivers(rivers);
        const riverNames = rivers.map(r => r.display_name).join(', ');
        console.log(`Found ${rivers.length} rivers: ${riverNames}`);
        return rivers;
      }
      return [];
    } catch (error) {
      console.error('Error scanning rivers:', error);
      showNotification('Error', 'Could not scan for available rivers', 'error');
      return [];
    }
  };

  // Load river shapefiles
  const loadRiverShapefiles = async () => {
    if (!mapInstanceRef.current) return;

    try {
      setLoading(true);
      const rivers = await scanAvailableRivers();
      
      if (rivers.length === 0) {
        showNotification('Info', 'No rivers found. Please upload shapefiles to your Django backend.', 'info');
        return;
      }

      let loadedCount = 0;
      const loadedRivers: string[] = [];
      
      for (const river of rivers) {
        try {
          const response = await fetch(`${API_BASE}/api/rivers/geojson/${river.id}/`);
          if (!response.ok) {
            console.log(`${river.display_name} data not available`);
            continue;
          }
          const geoJsonData = await response.json();
          
          if (riverLayersRef.current[river.id]) {
            mapInstanceRef.current.removeLayer(riverLayersRef.current[river.id]);
          }

          const riverColor = getRiverColor(river.id);
          const riverWidth = getRiverWidth(river.id);
          
          const style = new Style({
            stroke: new Stroke({ color: riverColor, width: riverWidth, lineCap: 'round', lineJoin: 'round' }),
            fill: river.id.toLowerCase().includes('basin') ? new Fill({ color: `${riverColor}15` }) : undefined
          });

          const riverLayer = new VectorLayer({
            source: new VectorSource({
              features: new GeoJSON().readFeatures(geoJsonData, { featureProjection: 'EPSG:3857' })
            }),
            style: style,
            properties: { name: river.id, displayName: river.display_name, riverType: river.id.toLowerCase().includes('basin') ? 'basin' : 'river' }
          });

          riverLayersRef.current[river.id] = riverLayer;
          mapInstanceRef.current.addLayer(riverLayer);
          
          loadedCount++;
          loadedRivers.push(river.display_name);
          console.log(`✅ ${river.display_name} river loaded successfully`);
        } catch (error) {
          console.error(`❌ Error loading ${river.display_name}:`, error);
        }
      }
      
      if (loadedCount > 0) {
        const hasVaruna = loadedRivers.some(name => name.toLowerCase().includes('varuna'));
        const hasBasin = loadedRivers.some(name => name.toLowerCase().includes('basin'));
        showNotification('Success', `Loaded ${loadedCount} rivers: ${loadedRivers.join(', ')}${hasVaruna ? ' 🌊' : ''}${hasBasin ? ' 🗺️' : ''}`, 'success');
        setTimeout(() => {
          if (mapInstanceRef.current && Object.keys(riverLayersRef.current).length > 0) {
            const allFeatures = Object.values(riverLayersRef.current).flatMap(layer => layer.getSource()?.getFeatures() || []);
            if (allFeatures.length > 0) {
              const extent = allFeatures[0].getGeometry()?.getExtent();
              if (extent) {
                allFeatures.forEach(feature => {
                  const geom = feature.getGeometry();
                  if (geom) {
                    const featureExtent = geom.getExtent();
                    extent[0] = Math.min(extent[0], featureExtent[0]);
                    extent[1] = Math.min(extent[1], featureExtent[1]);
                    extent[2] = Math.max(extent[2], featureExtent[2]);
                    extent[3] = Math.max(extent[3], featureExtent[3]);
                  }
                });
                mapInstanceRef.current.getView().fit(extent, { padding: [50, 50, 50, 50] });
              }
            }
          }
        }, 500);
      } else {
        showNotification('Warning', 'No rivers could be loaded. Check your shapefile data.', 'error');
      }
    } catch (error) {
      console.error('Error in loadRiverShapefiles:', error);
      showNotification('Error', 'Failed to load rivers. Check your Django backend.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Refresh rivers
  const refreshRivers = async () => {
    try {
      setLoading(true);
      showNotification('Info', 'Refreshing river data...', 'info');
      
      const response = await fetch(`${API_BASE}/api/rivers/refresh/`, { method: 'POST' });
      const result = await response.json();
      
      console.log('Refresh result:', result);
      Object.values(riverLayersRef.current).forEach(layer => mapInstanceRef.current?.removeLayer(layer));
      riverLayersRef.current = {};
      await loadRiverShapefiles();
    } catch (error) {
      console.error('Error refreshing rivers:', error);
      showNotification('Error', 'Could not refresh rivers', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Update station layer
  const updateStationLayer = (stations: DrainStation[], parameter: string) => {
    if (!mapInstanceRef.current) return;

    // Clear any existing selections before updating
    if (selectInteractionRef.current) {
      selectInteractionRef.current.getFeatures().clear();
    }

    // Hide popup
    if (popupRef.current) {
      popupRef.current.style.display = 'none';
    }
    if (overlayRef.current) {
      overlayRef.current.setPosition(undefined);
    }

    if (stationLayerRef.current) {
      mapInstanceRef.current.removeLayer(stationLayerRef.current);
    }

    const features = stations
      .filter(station => station.lat && station.lon)
      .map(station => {
        const feature = new Feature({
          geometry: new Point(fromLonLat([station.lon, station.lat])),
          ...station,
          parameterValue: getParameterValue(station, parameter),
          parameterName: getParameterName(parameter)
        });
        feature.setStyle(createStationStyle(station, parameter));
        return feature;
      });

    const stationLayer = new VectorLayer({
      source: new VectorSource({ features }),
      properties: { name: 'stations' },
      zIndex: 1000
    });

    stationLayerRef.current = stationLayer;
    mapInstanceRef.current.addLayer(stationLayer);
    
    console.log(`✅ Updated station layer with ${features.length} stations for ${getParameterName(parameter)}`);
  };

  // Change basemap
  const changeBasemap = (basemapType: 'osm' | 'satellite') => {
    if (!mapInstanceRef.current) return;

    Object.values(baseMapsRef.current).forEach(layer => layer.setVisible(false));
    if (baseMapsRef.current[basemapType]) {
      baseMapsRef.current[basemapType].setVisible(true);
      setCurrentBasemap(basemapType);
    }
    showNotification('Basemap Changed', `Switched to ${basemapType.toUpperCase()}`, 'info');
  };

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const osmLayer = new TileLayer({ source: new OSM(), properties: { name: 'osm' } });
    const satelliteLayer = new TileLayer({
      source: new XYZ({ url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attributions: 'Tiles © Esri' }),
      properties: { name: 'satellite' },
      visible: false
    });

    baseMapsRef.current = { osm: osmLayer, satellite: satelliteLayer };

    const map = new Map({
      target: mapRef.current,
      layers: [osmLayer, satelliteLayer],
      view: new View({ center: fromLonLat([82.9739, 25.3176]), zoom: 11, maxZoom: 18, minZoom: 8 }),
      controls: defaultControls({ zoom: false }).extend([new ScaleLine({ units: 'metric', bar: true, steps: 4, text: true, minWidth: 140 })])
    });

    mapInstanceRef.current = map;

    map.on('pointermove', (evt) => {
      const coordinate = toLonLat(evt.coordinate);
      setCoordinates({ lat: parseFloat(coordinate[1].toFixed(5)), lng: parseFloat(coordinate[0].toFixed(5)) });
    });

    // Create popup overlay
    const overlay = new Overlay({
      element: popupRef.current!,
      positioning: 'bottom-center',
      offset: [0, -10],
      stopEvent: false, // Allow map interactions
      // Removed autoPan to prevent unwanted map movement
    });
    overlayRef.current = overlay;
    map.addOverlay(overlay);

    // Add global close popup function
    (window as any).varunaMapClosePopup = () => {
      if (selectInteractionRef.current) {
        selectInteractionRef.current.getFeatures().clear();
      }
      if (popupRef.current) {
        popupRef.current.style.display = 'none';
      }
      if (overlayRef.current) {
        overlayRef.current.setPosition(undefined);
      }
    };

    // Create select interaction
    const selectInteraction = new Select({
      condition: click,
      multi: false, // Fixed: prevents multiple selections causing disappearing points
      style: (feature) => {
        // Get the station from feature properties
        const station = feature.getProperties() as DrainStation;
        
        // Get current parameter dynamically
        const getCurrentParameter = () => {
          const checkedRadio = document.querySelector('input[type="radio"]:checked') as HTMLInputElement;
          return checkedRadio ? checkedRadio.value as 'bod' | 'cod' | 'do' | 'ph' : 'do';
        };
        
        const activeParameter = getCurrentParameter();
        const value = getParameterValue(station, activeParameter);
        const color = getParameterColor(activeParameter, value);
        
        return new Style({
          image: new CircleStyle({
            radius: 12, // Larger radius for selected state
            fill: new Fill({ color }),
            stroke: new Stroke({ color: '#ffffff', width: 3 })
          }),
          text: new Text({
            text: value.toFixed(1),
            font: 'bold 12px sans-serif',
            fill: new Fill({ color: '#000' }),
            backgroundFill: new Fill({ color: 'rgba(255,255,255,0.9)' }),
            padding: [3, 3, 3, 3],
            offsetY: -30
          })
        });
      }
    });

    selectInteractionRef.current = selectInteraction;

    selectInteraction.on('select', (e) => {
      if (e.selected.length > 0) {
        const selectedFeature = e.selected[0];
        const station = selectedFeature.getProperties() as DrainStation;
        
        // Check if this is a station feature (has location property)
        if (station.location && overlayRef.current) {
          const geometry = selectedFeature.getGeometry();
          if (geometry instanceof Point) {
            const coordinate = geometry.getCoordinates();
            if (coordinate) {
              // Set popup position without auto-panning
              overlayRef.current.setPosition(coordinate);
              
              // Get the current parameter from state at the time of click
              const getCurrentParameter = () => {
                // Get the checked radio button value
                const checkedRadio = document.querySelector('input[type="radio"]:checked') as HTMLInputElement;
                return checkedRadio ? checkedRadio.value as 'bod' | 'cod' | 'do' | 'ph' : 'do';
              };
              
              const activeParameter = getCurrentParameter();
              const content = createPopupContent(station, activeParameter);
              
              if (popupRef.current) {
                const contentDiv = popupRef.current.querySelector('#popup-content');
                if (contentDiv) {
                  contentDiv.innerHTML = content;
                }
                popupRef.current.style.display = 'block';
              }
            }
          }
        }
      } else {
        // Hide popup when nothing is selected
        if (popupRef.current) {
          popupRef.current.style.display = 'none';
        }
        if (overlayRef.current) {
          overlayRef.current.setPosition(undefined);
        }
      }
    });

    map.addInteraction(selectInteraction);

    // Click to select stations only
    map.on('click', (evt) => {
      const feature = map.forEachFeatureAtPixel(evt.pixel, (feature) => {
        // Only select station features (those with location property)
        const props = feature.getProperties();
        return props.location ? feature : null;
      });
      
      if (!feature) {
        selectInteraction.getFeatures().clear();
      }
    });

    return () => {
      // Cleanup global function
      delete (window as any).varunaMapClosePopup;
      
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setTarget(undefined);
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Load drain stations
  useEffect(() => {
    const loadDrainStations = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/api/drain-water-quality/`);
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        const data: DrainStation[] = await response.json();
        setDrainStations(data);
        if (mapInstanceRef.current) {
          updateStationLayer(data, currentParameter);
        }
        console.log(`✅ Loaded ${data.length} drain stations`);
      } catch (error) {
        console.error('Error loading drain stations:', error);
        showNotification('Warning', 'Could not load station data', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadDrainStations();
  }, []);

  // Update station layer when parameter or stations change
  useEffect(() => {
    if (drainStations.length > 0 && mapInstanceRef.current) {
      updateStationLayer(drainStations, currentParameter);
    }
  }, [currentParameter, drainStations]);

  // Fixed: Update popup content when parameter changes (if a feature is selected)
  useEffect(() => {
    if (selectInteractionRef.current && popupRef.current) {
      const selectedFeatures = selectInteractionRef.current.getFeatures();
      if (selectedFeatures.getLength() > 0) {
        const feature = selectedFeatures.item(0);
        const station = feature.getProperties() as DrainStation;
        const content = createPopupContent(station, currentParameter);
        
        const contentDiv = popupRef.current.querySelector('#popup-content');
        if (contentDiv) {
          contentDiv.innerHTML = content;
        }
        
        // Also update the selected feature's style to reflect new parameter
        const newStyle = new Style({
          image: new CircleStyle({
            radius: 12,
            fill: new Fill({ color: getParameterColor(currentParameter, getParameterValue(station, currentParameter)) }),
            stroke: new Stroke({ color: '#ffffff', width: 3 })
          }),
          text: new Text({
            text: getParameterValue(station, currentParameter).toFixed(1),
            font: 'bold 12px sans-serif',
            fill: new Fill({ color: '#000' }),
            backgroundFill: new Fill({ color: 'rgba(255,255,255,0.9)' }),
            padding: [3, 3, 3, 3],
            offsetY: -30
          })
        });
        feature.setStyle(newStyle);
      }
    }
  }, [currentParameter]);

  // Load rivers automatically
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => loadRiverShapefiles(), 1000);
    }
  }, [mapInstanceRef.current]);

  // Handle map resize
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => mapInstanceRef.current?.updateSize(), 300);
    }
  }, [sidebarCollapsed]);

  return (
    <div className="relative w-full h-screen">
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full" style={{ background: '#f8fafc' }} />

      {/* Basemap Selector (Top Middle) */}
      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-white/95 rounded-lg shadow-lg p-2 z-10 border border-gray-200">
        <div className="flex space-x-1">
          <button
            onClick={() => changeBasemap('osm')}
            className={`px-3 py-2 text-sm rounded transition-all duration-200 ${
              currentBasemap === 'osm' ? 'bg-blue-500 text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
            }`}
          >
            🗺️ Streets
          </button>
          <button
            onClick={() => changeBasemap('satellite')}
            className={`px-3 py-2 text-sm rounded transition-all duration-200 ${
              currentBasemap === 'satellite' ? 'bg-blue-500 text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
            }`}
          >
            🛰️ Satellite
          </button>
        </div>
      </div>

      {/* Refresh Button (Top Left) */}
      <div className="absolute top-2 left-2 z-10 flex flex-col space-y-2">
        <div className="flex space-x-2">
          <button
            onClick={refreshRivers}
            disabled={loading}
            className="bg-white hover:bg-gray-50 disabled:bg-gray-100 rounded-lg py-2 px-3 shadow-md text-sm font-medium text-gray-700 transition-colors flex items-center border border-gray-200"
          >
            <span className="mr-2">♻️</span>
            Refresh
          </button>
        </div>
      </div>

      {/* Water Quality Parameters (Top Right) */}
      <div className="absolute top-2 right-2 bg-white/95 rounded-lg shadow-lg p-3 z-10 border border-gray-200">
        <h3 className="text-sm font-semibold mb-2 text-gray-800">Water Quality Parameters</h3>
        <div className="space-y-1">
          {(['do', 'ph', 'bod', 'cod'] as const).map((param) => (
            <label key={param} className="flex items-center space-x-2">
              <input
                type="radio"
                value={param}
                checked={currentParameter === param}
                onChange={() => setCurrentParameter(param)}
                className="form-radio text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{getParameterName(param)}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Statistics Panel (Bottom Right) */}
      {drainStations.length > 0 && (
        <div className="absolute bottom-2 right-2 bg-white/95 rounded-lg shadow-lg p-3 z-10 border border-gray-200">
          <h4 className="text-sm font-semibold mb-2 text-gray-800">Water Quality Summary</h4>
          <div className="text-xs space-y-1">
            {(() => {
              const values = drainStations.map(station => getParameterValue(station, currentParameter));
              const goodCount = values.filter(v => getQualityStatus(currentParameter, v) === 'Good').length;
              const moderateCount = values.filter(v => getQualityStatus(currentParameter, v) === 'Moderate').length;
              const poorCount = values.filter(v => getQualityStatus(currentParameter, v) === 'Poor').length;
              
              return (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Stations:</span>
                    <span className="font-semibold text-gray-800">{drainStations.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600">✅ Good:</span>
                    <span className="font-semibold text-green-600">{goodCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-yellow-600">⚠️ Moderate:</span>
                    <span className="font-semibold text-yellow-600">{moderateCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-600">❌ Poor:</span>
                    <span className="font-semibold text-red-600">{poorCount}</span>
                  </div>
                  <div className="mt-2 pt-1 border-t border-gray-200">
                    <div className="text-center text-gray-600">
                      Parameter: <span className="font-semibold">{getParameterName(currentParameter)}</span>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/98 py-4 px-6 rounded-xl shadow-2xl z-30 border border-gray-200">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-3"></div>
            <span className="text-gray-700 font-medium">Loading map data...</span>
          </div>
          <div className="mt-2 text-xs text-gray-500 text-center">
            Rivers • Stations • Quality Parameters
          </div>
        </div>
      )}

      {/* Connection Status Indicator */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-white/95 rounded-full px-3 py-1 shadow-md border border-gray-200">
          <div className="flex items-center text-xs">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
            <span className="text-gray-600">Backend: {API_BASE}</span>
          </div>
        </div>
      </div>

      {/* Popup Overlay */}
      <div
        ref={popupRef}
        className="absolute bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 pointer-events-auto z-20"
        style={{
          display: 'none',
          maxWidth: '150px',
          fontSize: '11px'
        }}
      >
        <button
          onClick={() => {
            if (selectInteractionRef.current) {
              selectInteractionRef.current.getFeatures().clear();
            }
            if (popupRef.current) {
              popupRef.current.style.display = 'none';
            }
            if (overlayRef.current) {
              overlayRef.current.setPosition(undefined);
            }
          }}
          className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white border-none rounded-full w-4 h-4 text-xs font-bold cursor-pointer flex items-center justify-center z-30 transition-colors"
          title="Close popup"
          style={{ fontSize: '10px', lineHeight: '1' }}
        >
          ×
        </button>
        <div id="popup-content"></div>
      </div>
    </div>
  );
};

export default VarunaMap;
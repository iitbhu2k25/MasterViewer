"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Upload, Save, ChevronRight, Download, Trash2, FileText, Map, Search, Plus, Minus } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { useMap, useMapEvents } from 'react-leaflet';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const GeoJSON = dynamic(() => import('react-leaflet').then(mod => mod.GeoJSON), { ssr: false });

interface LocationPoint {
  id: string;
  locationNo: string;
  latitude: number;
  longitude: number;
  source: 'map' | 'csv';
  merit?: number;
  rank?: number;
}

interface Village {
  name: string;
  population: number;
  merit?: number;
  rank?: number;
}

const conditionCategories = [
  'Water Demand',
  'Groundwater',
  'Impact on River',
  'Impact on MAR',
  'Potentiality'
];

const constraintCategories = [
  'ASI Sites',
  'Builtup',
  'Flood Plain',
  'Groundwater Depth',
  'Highway',
  'Railway',
  'STP',
  'Water Body'
];

const PumpingLocationIdentification: React.FC = () => {
  const [step, setStep] = useState(1);
  const [siteAvailability, setSiteAvailability] = useState<boolean | null>(null);
  const [locations, setLocations] = useState<LocationPoint[]>([]);
  const [activeTab, setActiveTab] = useState<'map' | 'upload'>('map');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Location selection state
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedSubDistrict, setSelectedSubDistrict] = useState('');
  const [selectedVillages, setSelectedVillages] = useState<string[]>([]);
  const [villageSearch, setVillageSearch] = useState('');
  const [showVillageDropdown, setShowVillageDropdown] = useState(false);
  
  // GeoJSON states
  const [countryGeoJson, setCountryGeoJson] = useState<any>(null);
  const [statesGeoJson, setStatesGeoJson] = useState<any>(null);
  const [districtsGeoJson, setDistrictsGeoJson] = useState<any>(null);
  
  // Mock data for dropdowns
  const states = ['UTTAR PRADESH', 'MAHARASHTRA', 'RAJASTHAN', 'GUJARAT', 'MADHYA PRADESH'];
  const districts = selectedState === 'UTTAR PRADESH' ? ['Varanasi', 'Lucknow', 'Kanpur', 'Agra'] : [];
  const subDistricts = selectedDistrict === 'Varanasi' ? ['Varanasi', 'Pindra', 'Chiraigaon'] : [];
  const villages: Village[] = [
    { name: 'Dafaipur', population: 890 },
    { name: 'Dafi', population: 5672 },
    { name: 'Daghariya', population: 1733 },
    { name: 'Dalpattipur', population: 2156 },
    { name: 'Dampur', population: 1234 },
    { name: 'Dandiya', population: 987 }
  ];

  const filteredVillages = villages.filter(village => 
    village.name.toLowerCase().includes(villageSearch.toLowerCase())
  );

  const totalPopulation = selectedVillages.reduce((total, villageName) => {
    const village = villages.find(v => v.name === villageName);
    return total + (village?.population || 0);
  }, 0);

  // Step 2 states
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
  const [selectedConstraintsStep2, setSelectedConstraintsStep2] = useState<string[]>([]);
  const [weights, setWeights] = useState<{ [key: string]: number }>({});

  // Step 3 states
  const [numSites, setNumSites] = useState<number>(1);
  const [rankedLocations, setRankedLocations] = useState<LocationPoint[]>([]);
  const [rankedVillages, setRankedVillages] = useState<Village[]>([]);

  useEffect(() => {
    // Update weights for current selected factors
    setWeights(prev => {
      const newWeights: { [key: string]: number } = {};
      selectedFactors.forEach(f => {
        newWeights[f] = prev[f] || 3; // default medium
      });
      return newWeights;
    });
  }, [selectedFactors]);

  // Fetch GeoJSON data
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/datameet/maps/master/Country/india-soi.geojson')
      .then(res => res.json())
      .then(data => setCountryGeoJson(data))
      .catch(() => {});
    
    fetch('https://raw.githubusercontent.com/Subhash9325/GeoJson-Data-of-Indian-States/master/Indian_States.geojson')
      .then(res => res.json())
      .then(data => setStatesGeoJson(data))
      .catch(() => {});
    
    fetch('https://gist.githubusercontent.com/maneetgoyal/c64e9a177a993a8081d8943d0948fa16/raw/d19f0b75813aafcb77fb7bd0571aeffd80d89bcf/indian-districts-simplified.json')
      .then(res => res.json())
      .then(data => setDistrictsGeoJson(data))
      .catch(() => {});
  }, []);

  // Map click handler for when site is available
  const handleMapClick = useCallback((lat: number, lng: number) => {
    const newLocation: LocationPoint = {
      id: Date.now().toString(),
      locationNo: `LOC-${String(locations.length + 1).padStart(3, '0')}`,
      latitude: lat,
      longitude: lng,
      source: 'map'
    };
    setLocations(prev => [...prev, newLocation]);
  }, [locations.length]);

  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        const latIndex = headers.findIndex(h => h.includes('lat'));
        const lonIndex = headers.findIndex(h => h.includes('lon'));
        const locIndex = headers.findIndex(h => h.includes('location') || h.includes('no'));
        
        if (latIndex === -1 || lonIndex === -1) {
          alert('CSV must contain latitude and longitude columns');
          return;
        }

        const csvLocations: LocationPoint[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          if (values.length >= Math.max(latIndex, lonIndex) + 1) {
            const lat = parseFloat(values[latIndex]);
            const lon = parseFloat(values[lonIndex]);
            
            if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
              csvLocations.push({
                id: `csv-${Date.now()}-${i}`,
                locationNo: locIndex >= 0 ? values[locIndex] : `CSV-${String(i).padStart(3, '0')}`,
                latitude: lat,
                longitude: lon,
                source: 'csv'
              });
            }
          }
        }
        
        setLocations(prev => [...prev, ...csvLocations]);
      } catch (error) {
        alert('Error parsing CSV file');
      }
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(file => file.name.toLowerCase().endsWith('.csv'));
    if (csvFile) {
      handleFileUpload(csvFile);
    } else {
      alert('Please upload a CSV file');
    }
  }, [handleFileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.toLowerCase().endsWith('.csv')) {
      handleFileUpload(file);
    } else {
      alert('Please select a CSV file');
    }
  }, [handleFileUpload]);

  const removeLocation = (id: string) => {
    setLocations(prev => prev.filter(loc => loc.id !== id));
  };

  const exportCSV = () => {
    if (locations.length === 0) return;
    
    const csvContent = [
      'Location No,Latitude,Longitude,Source',
      ...locations.map(loc => `${loc.locationNo},${loc.latitude},${loc.longitude},${loc.source}`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pumping_locations.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleVillage = (villageName: string) => {
    setSelectedVillages(prev => 
      prev.includes(villageName) 
        ? prev.filter(v => v !== villageName)
        : [...prev, villageName]
    );
  };

  const handleConfirm = () => {
    if (siteAvailability === false) {
      if (!selectedState || !selectedDistrict || !selectedSubDistrict || selectedVillages.length === 0) {
        alert('Please select all required fields');
        return;
      }
    }
    alert('Location confirmed! Proceeding to next step...');
  };

  const handleReset = () => {
    setSelectedState('');
    setSelectedDistrict('');
    setSelectedSubDistrict('');
    setSelectedVillages([]);
    setVillageSearch('');
    setLocations([]);
  };

  const handleSave = () => {
    if (siteAvailability === true && locations.length === 0) {
      alert('Please add at least one location before saving');
      return;
    }
    if (siteAvailability === false && selectedVillages.length === 0) {
      alert('Please select at least one village before saving');
      return;
    }
    alert(`Successfully saved ${siteAvailability ? locations.length + ' pumping locations' : selectedVillages.length + ' villages'}!`);
  };

  const handleNext = () => {
    if (siteAvailability === true && locations.length === 0) {
      alert('Please add at least one location before proceeding');
      return;
    }
    if (siteAvailability === false && selectedVillages.length === 0) {
      alert('Please select at least one village before proceeding');
      return;
    }
    setStep(2);
  };

  // Component for handling map clicks
  const MapClickHandler = ({ onClick }: { onClick: (lat: number, lng: number) => void }) => {
    useMapEvents({
      click: (e) => onClick(e.latlng.lat, e.latlng.lng),
    });
    return null;
  };

  // Component for zooming to selected boundaries
  const BoundaryZoom = () => {
    const map = useMap();

    useEffect(() => {
      if (typeof window === 'undefined') return;

      import('leaflet').then((leafletModule) => {
        const L = leafletModule.default;

        if (siteAvailability === false && statesGeoJson && selectedState) {
          const stateFeature = statesGeoJson.features.find((f: any) => f.properties.st_nm.toUpperCase() === selectedState);
          if (stateFeature) {
            const bounds = L.geoJSON(stateFeature).getBounds();
            map.fitBounds(bounds);
            return;
          }
        }
        if (siteAvailability === false && districtsGeoJson && selectedDistrict) {
          const districtFeature = districtsGeoJson.features.find((f: any) => f.properties.district?.toUpperCase() === selectedDistrict.toUpperCase() || f.properties.dt_cen_nm?.toUpperCase() === selectedDistrict.toUpperCase());
          if (districtFeature) {
            const bounds = L.geoJSON(districtFeature).getBounds();
            map.fitBounds(bounds);
          }
        }
      });
    }, [selectedState, selectedDistrict, statesGeoJson, districtsGeoJson, siteAvailability, map]);

    return null;
  };

  // Step 2 handlers
  const handleFactorChange = (factor: string, checked: boolean) => {
    setSelectedFactors(prev => checked ? [...prev, factor] : prev.filter(f => f !== factor));
  };

  const handleConstraintChange = (constraint: string, checked: boolean) => {
    setSelectedConstraintsStep2(prev => checked ? [...prev, constraint] : prev.filter(c => c !== constraint));
  };

  const handleSelectAllFactors = () => {
    setSelectedFactors(conditionCategories);
  };

  const handleClearAllFactors = () => {
    setSelectedFactors([]);
  };

  const handleSelectAllConstraints = () => {
    setSelectedConstraintsStep2(constraintCategories);
  };

  const handleClearAllConstraints = () => {
    setSelectedConstraintsStep2([]);
  };

  const handleWeightChange = (factor: string, value: number) => {
    setWeights(prev => ({ ...prev, [factor]: value }));
  };

  const totalImportance = Object.values(weights).reduce((sum, v) => sum + v, 0);

  const getWeight = (v: number) => totalImportance ? (v / totalImportance).toFixed(3) : '0.000';

  const handleSubmitAnalysis = () => {
    if (selectedFactors.length === 0) {
      alert('At least one condition category must be selected');
      return;
    }
    setStep(3);
    // Mock ranking
    if (siteAvailability === true) {
      const ranked = [...locations].map(loc => ({
        ...loc,
        merit: Math.random() * 10
      })).sort((a, b) => b.merit! - a.merit!).map((loc, index) => ({
        ...loc,
        rank: index + 1
      }));
      setRankedLocations(ranked);
    } else {
      const ranked = villages.filter(v => selectedVillages.includes(v.name)).map(v => ({
        ...v,
        merit: Math.random() * 10
      })).sort((a, b) => b.merit! - a.merit!).map((v, index) => ({
        ...v,
        rank: index + 1
      }));
      setRankedVillages(ranked);
    }
  };

  const handleGenerateVillageRanks = () => {
    const ranked = villages.filter(v => selectedVillages.includes(v.name)).map(v => ({
      ...v,
      merit: Math.random() * 10
    })).sort((a, b) => b.merit! - a.merit!).slice(0, numSites).map((v, index) => ({
      ...v,
      rank: index + 1
    }));
    setRankedVillages(ranked);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Pumping Location Identification</h1>
              <p className="text-gray-600">Identify and manage pumping locations for groundwater management</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                Step {step} of 4
              </div>
            </div>
          </div>
        </div>

        {/* Step 1 */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Step 1: Pumping Location Identification</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Panel */}
            <div className="space-y-6">
              {/* Site Availability Selection */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Site Availability Assessment</h3>
                <p className="text-gray-600 mb-6">Is the site available for pumping location installation?</p>
                
                <div className="flex space-x-4">
                  <button
                    onClick={() => setSiteAvailability(true)}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                      siteAvailability === true
                        ? 'bg-green-100 text-green-800 border-2 border-green-300'
                        : 'bg-gray-50 text-gray-700 border-2 border-gray-200 hover:bg-gray-100'
                    }` + (step > 1 ? ' pointer-events-none' : '')}
                  >
                    Yes, Site is Available
                  </button>
                  <button
                    onClick={() => setSiteAvailability(false)}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                      siteAvailability === false
                        ? 'bg-red-100 text-red-800 border-2 border-red-300'
                        : 'bg-gray-50 text-gray-700 border-2 border-gray-200 hover:bg-gray-100'
                    }` + (step > 1 ? ' pointer-events-none' : '')}
                  >
                    No, Site is Not Available
                  </button>
                </div>
              </div>

              {/* Location Selection Form - Show when site is NOT available */}
              {siteAvailability === false && (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Location Selection</h3>
                  
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    {/* State Dropdown */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">State:</label>
                      <select
                        value={selectedState}
                        onChange={(e) => {
                          setSelectedState(e.target.value);
                          setSelectedDistrict('');
                          setSelectedSubDistrict('');
                          setSelectedVillages([]);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={step > 1}
                      >
                        <option value="">--Choose a State--</option>
                        {states.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>

                    {/* District Dropdown */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">District:</label>
                      <select
                        value={selectedDistrict}
                        onChange={(e) => {
                          setSelectedDistrict(e.target.value);
                          setSelectedSubDistrict('');
                          setSelectedVillages([]);
                        }}
                        disabled={!selectedState || step > 1}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      >
                        <option value="">--Choose District--</option>
                        {districts.map(district => (
                          <option key={district} value={district}>{district}</option>
                        ))}
                      </select>
                    </div>

                    {/* Sub-District Dropdown */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sub-District:</label>
                      <select
                        value={selectedSubDistrict}
                        onChange={(e) => {
                          setSelectedSubDistrict(e.target.value);
                          setSelectedVillages([]);
                        }}
                        disabled={!selectedDistrict || step > 1}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      >
                        <option value="">--Choose Sub-District--</option>
                        {subDistricts.map(subDistrict => (
                          <option key={subDistrict} value={subDistrict}>{subDistrict}</option>
                        ))}
                      </select>
                    </div>

                    {/* Village Dropdown */}
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Village/Town (Population 2011):</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search..."
                          value={villageSearch}
                          onChange={(e) => setVillageSearch(e.target.value)}
                          onFocus={() => setShowVillageDropdown(true)}
                          disabled={!selectedSubDistrict || step > 1}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        />
                        <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
                      </div>
                      
                      {/* Village Dropdown */}
                      {showVillageDropdown && selectedSubDistrict && step === 1 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                          {filteredVillages.map(village => (
                            <div
                              key={village.name}
                              className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                              onClick={() => toggleVillage(village.name)}
                            >
                              <input
                                type="checkbox"
                                checked={selectedVillages.includes(village.name)}
                                onChange={() => toggleVillage(village.name)}
                                className="mr-3"
                              />
                              <span className="flex-1">{village.name} (Pop: {village.population.toLocaleString()})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Selected Locations Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-gray-900 mb-3">Selected Locations</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">State:</span> {selectedState || 'None'}</div>
                      <div><span className="font-medium">District:</span> {selectedDistrict || 'None'}</div>
                      <div><span className="font-medium">Sub-District:</span> {selectedSubDistrict || 'None'}</div>
                      <div>
                        <span className="font-medium">Villages:</span>
                        <div className="mt-1">
                          {selectedVillages.length > 0 ? (
                            <div className="space-y-1">
                              {selectedVillages.map(village => {
                                const villageData = villages.find(v => v.name === village);
                                return (
                                  <div key={village} className="flex justify-between">
                                    <span>{village}</span>
                                    <span className="text-gray-600">Pop: {villageData?.population.toLocaleString()}</span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            'None'
                          )}
                        </div>
                      </div>
                      <div className="pt-2 border-t">
                        <span className="font-medium">Total Population:</span> {totalPopulation.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {step === 1 && (
                    <div className="flex space-x-3">
                      <button
                        onClick={handleConfirm}
                        className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={handleReset}
                        className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Reset
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Location Input Section - Only show if site is available */}
              {siteAvailability === true && (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Add Pumping Locations</h3>
                  
                  {/* Tab Navigation */}
                  <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
                    <button
                      onClick={() => setActiveTab('map')}
                      className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center space-x-2 ${
                        activeTab === 'map'
                          ? 'bg-white text-blue-700 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }` + (step > 1 ? ' pointer-events-none' : '')}
                    >
                      <Map className="w-4 h-4" />
                      <span>Mark on Map</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('upload')}
                      className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center space-x-2 ${
                        activeTab === 'upload'
                          ? 'bg-white text-blue-700 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }` + (step > 1 ? ' pointer-events-none' : '')}
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload CSV</span>
                    </button>
                  </div>

                  {/* Map Tab */}
                  {activeTab === 'map' && (
                    <div className="space-y-4">
                      <p className="text-gray-600">Use the map on the right to mark locations by clicking.</p>
                    </div>
                  )}

                  {/* Upload Tab */}
                  {activeTab === 'upload' && (
                    <div className="space-y-4">
                      <div
                        className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
                          dragOver
                            ? 'border-blue-400 bg-blue-100'
                            : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                        }` + (step > 1 ? ' pointer-events-none' : '')}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOver(true);
                        }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                      >
                        <div className="text-center">
                          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h4 className="text-lg font-medium text-gray-900 mb-2">Upload CSV File</h4>
                          <p className="text-gray-600 mb-4">
                            Drag and drop your CSV file here, or click to select
                          </p>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            disabled={step > 1}
                          >
                            Choose File
                          </button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={handleFileSelect}
                          />
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
                        <p className="font-medium mb-2">CSV Format Requirements:</p>
                        <ul className="space-y-1">
                          <li>• Must contain columns for latitude and longitude</li>
                          <li>• Optional: location number/name column</li>
                          <li>• Example headers: "Location No", "Latitude", "Longitude"</li>
                          <li>• Coordinates should be in decimal degrees</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Locations List - Only show if site is available */}
              {siteAvailability === true && locations.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">Added Locations ({locations.length})</h3>
                    <button
                      onClick={exportCSV}
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export CSV</span>
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Location No</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Latitude</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Longitude</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Source</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {locations.map((location) => (
                          <tr key={location.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium text-gray-900">{location.locationNo}</td>
                            <td className="py-3 px-4 text-gray-700">{location.latitude.toFixed(6)}</td>
                            <td className="py-3 px-4 text-gray-700">{location.longitude.toFixed(6)}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                location.source === 'map' 
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {location.source === 'map' ? 'Map' : 'CSV'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => removeLocation(location.id)}
                                className="text-red-600 hover:text-red-800 transition-colors"
                                disabled={step > 1}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Right Panel - Map */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Interactive Map</h3>
                <div className="flex space-x-2">
                  <button className="p-2 border border-gray-300 rounded hover:bg-gray-50">
                    <Plus className="w-4 h-4" />
                  </button>
                  <button className="p-2 border border-gray-300 rounded hover:bg-gray-50">
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Real Leaflet Map */}
              <MapContainer 
                center={[20, 78]} 
                zoom={5} 
                style={{ height: '400px', width: '100%' }} 
                className="rounded-lg"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
                />
                {countryGeoJson && (
                  <GeoJSON 
                    data={countryGeoJson} 
                    style={{ color: 'blue', weight: 2, fillOpacity: 0 }} 
                  />
                )}
                {statesGeoJson && (
                  <GeoJSON 
                    data={statesGeoJson} 
                    style={(feature) => ({
                      color: siteAvailability === false && selectedState && feature?.properties.st_nm?.toUpperCase() === selectedState ? 'red' : 'transparent',
                      weight: 2,
                      fillOpacity: 0,
                    })}
                  />
                )}
                {districtsGeoJson && (
                  <GeoJSON 
                    data={districtsGeoJson} 
                    style={(feature) => ({
                      color: siteAvailability === false && selectedDistrict && feature?.properties.district?.toUpperCase() === selectedDistrict.toUpperCase() ? 'green' : 'transparent',
                      weight: 2,
                      fillOpacity: 0,
                    })}
                  />
                )}
                {siteAvailability === true && locations.map(loc => (
                  <Marker key={loc.id} position={[loc.latitude, loc.longitude]} />
                ))}
                {siteAvailability === true && activeTab === 'map' && step === 1 && (
                  <MapClickHandler onClick={handleMapClick} />
                )}
                {siteAvailability === false && (
                  <BoundaryZoom />
                )}
              </MapContainer>

              {/* Map Legend */}
              <div className="mt-4 bg-white p-3 rounded-lg shadow-sm border text-xs inline-block">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-600 rounded"></div>
                    <span>India Boundary</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span>State Boundary</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span>District</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-purple-500 rounded"></div>
                    <span>Sub-District</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                    <span>Village</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons for Step 1 */}
          {step === 1 && (
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-500">
                {siteAvailability === true && locations.length > 0 && `${locations.length} location${locations.length !== 1 ? 's' : ''} added`}
                {siteAvailability === false && selectedVillages.length > 0 && `${selectedVillages.length} village${selectedVillages.length !== 1 ? 's' : ''} selected`}
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleSave}
                  disabled={
                    (siteAvailability === true && locations.length === 0) ||
                    (siteAvailability === false && selectedVillages.length === 0) ||
                    siteAvailability === null
                  }
                  className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </button>
                
                <button
                  onClick={handleNext}
                  disabled={
                    (siteAvailability === true && locations.length === 0) ||
                    (siteAvailability === false && selectedVillages.length === 0) ||
                    siteAvailability === null
                  }
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <span>Next Step</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Step 2 */}
        {step >= 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Step 2: Factor and Constraint Selection</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm border p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Condition Categories */}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Condition Categories</h3>
                    <div className="flex justify-end mb-2 space-x-2">
                      <button onClick={handleSelectAllFactors} className="text-blue-600 hover:underline" disabled={step > 2}>Select All</button>
                      <button onClick={handleClearAllFactors} className="text-red-600 hover:underline" disabled={step > 2}>Clear All</button>
                    </div>
                    <div className="space-y-2">
                      {conditionCategories.map(cat => (
                        <div key={cat} className="flex items-center">
                          <input 
                            type="checkbox" 
                            id={`condition-${cat}`} 
                            checked={selectedFactors.includes(cat)} 
                            onChange={(e) => handleFactorChange(cat, e.target.checked)} 
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            disabled={step > 2}
                          />
                          <label htmlFor={`condition-${cat}`} className="ml-2 text-sm text-gray-900">{cat}</label>
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 text-sm text-gray-600">{selectedFactors.length} of {conditionCategories.length} selected</p>
                  </div>

                  {/* Constraint Categories */}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Constraint Categories</h3>
                    <div className="flex justify-end mb-2 space-x-2">
                      <button onClick={handleSelectAllConstraints} className="text-blue-600 hover:underline" disabled={step > 2}>Select All</button>
                      <button onClick={handleClearAllConstraints} className="text-red-600 hover:underline" disabled={step > 2}>Clear All</button>
                    </div>
                    <div className="space-y-2">
                      {constraintCategories.map(cat => (
                        <div key={cat} className="flex items-center">
                          <input 
                            type="checkbox" 
                            id={`constraint-${cat}`} 
                            checked={selectedConstraintsStep2.includes(cat)} 
                            onChange={(e) => handleConstraintChange(cat, e.target.checked)} 
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            disabled={step > 2}
                          />
                          <label htmlFor={`constraint-${cat}`} className="ml-2 text-sm text-gray-900">{cat}</label>
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 text-sm text-gray-600">{selectedConstraintsStep2.length} of {constraintCategories.length} selected</p>
                  </div>
                </div>

                {step === 2 && (
                  <div className="flex flex-col">
                    {selectedFactors.length === 0 && <p className="text-red-600 mb-2">At least one condition category must be selected</p>}
                    <button
                      onClick={handleSubmitAnalysis}
                      disabled={selectedFactors.length === 0}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors self-start"
                    >
                      Submit Analysis
                    </button>
                  </div>
                )}
              </div>

              {/* Right Panel - Step 2 */}
              <div className="space-y-6">
                {/* Selected Constraints */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Selected Constraints</h3>
                  <ul className="space-y-2">
                    {selectedConstraintsStep2.map(item => (
                      <li key={item} className="p-2 bg-gray-50 rounded text-sm text-gray-900">{item}</li>
                    ))}
                    {selectedConstraintsStep2.length === 0 && <p className="text-gray-600">None selected</p>}
                  </ul>
                </div>

                {/* Weight Selection */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Weight Selection</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                          <th className="px-6 py-3">Category</th>
                          <th className="px-6 py-3">Influences</th>
                          <th className="px-6 py-3">Weight</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedFactors.map(factor => (
                          <tr key={factor} className="bg-white border-b hover:bg-gray-50">
                            <td className="px-6 py-4">{factor}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs">Low</span>
                                <input
                                  type="range"
                                  min={1}
                                  max={5}
                                  step={1}
                                  value={weights[factor] ?? 3}
                                  onChange={(e) => handleWeightChange(factor, parseInt(e.target.value))}
                                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                  disabled={step > 2}
                                />
                                <span className="text-xs">High</span>
                              </div>
                              <p className="text-center text-xs mt-1">{weights[factor] ?? 3}</p>
                            </td>
                            <td className="px-6 py-4">{getWeight(weights[factor] ?? 3)}</td>
                          </tr>
                        ))}
                        {selectedFactors.length === 0 && (
                          <tr>
                            <td colSpan={3} className="px-6 py-4 text-center text-gray-600">No factors selected for weighting</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step >= 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Step 3: Analysis Output</h2>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              {siteAvailability === true ? (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Ranked Locations</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Rank</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Location No</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Latitude</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Longitude</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Merit Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rankedLocations.map((loc) => (
                          <tr key={loc.id} className="border-b border-gray-100">
                            <td className="py-3 px-4">{loc.rank}</td>
                            <td className="py-3 px-4">{loc.locationNo}</td>
                            <td className="py-3 px-4">{loc.latitude.toFixed(6)}</td>
                            <td className="py-3 px-4">{loc.longitude.toFixed(6)}</td>
                            <td className="py-3 px-4">{loc.merit?.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Ranked Villages</h3>
                  <div className="flex space-x-4 mb-4">
                    <input
                      type="number"
                      value={numSites}
                      onChange={(e) => setNumSites(parseInt(e.target.value))}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg"
                      min={1}
                      max={selectedVillages.length}
                    />
                    <button
                      onClick={handleGenerateVillageRanks}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Generate Ranks
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Rank</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Village</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Population</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Merit Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rankedVillages.map((v) => (
                          <tr key={v.name} className="border-b border-gray-100">
                            <td className="py-3 px-4">{v.rank}</td>
                            <td className="py-3 px-4">{v.name}</td>
                            <td className="py-3 px-4">{v.population.toLocaleString()}</td>
                            <td className="py-3 px-4">{v.merit?.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PumpingLocationIdentification;
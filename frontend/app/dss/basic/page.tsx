'use client'
import React, { useEffect, useState, useRef, useMemo } from "react"
import isEqual from 'lodash/isEqual';
import dynamic from "next/dynamic";
import StatusBar from "./components/statusbar"
import LocationSelector from "./components/locations"
import DrainLocationSelector from "./components/drainlocations"
import Population from "./populations/population"
import Water_Demand from "./water_demand/page"
import Water_Supply from "./water_supply/page"
import Sewage from "./seawage/page"
// New import for DrainMap
import SewageCalculationForm from "./seawage/components/SewageCalculationForm";
import WaterSupplyForm from "./water_supply/components/WaterSupplyForm";
import WaterDemandForm from "./water_demand/components/WaterDemandForm";


const Map = dynamic(() => import("./components/map"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[48vh] border-4 border-gray-300  rounded-xl">
      <div className="text-gray-500">Loading map...</div>
    </div>
  )
});


const DrainMap = dynamic(() => import("./components/drainmap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[48vh] border border-gray-900">
      <div className="text-gray-500">Loading drain map...</div>
    </div>
  )
});


interface SelectedLocationData {
  villages: {
    id: number;
    name: string;
    subDistrictId: number;
    population: number;
  }[];
  subDistricts: {
    id: number;
    name: string;
    districtId: number;
  }[];
  totalPopulation: number;
}

interface SewageProps {
  villages_props?: any[];
  totalPopulation_props?: number;
  sourceMode?: 'admin' | 'drain';
  selectedRiverData?: SelectedRiverData | null; // Add this
}


interface IntersectedVillage {
  shapeID: string;
  shapeName: string;
  drainNo: number;
  selected?: boolean;
}

interface VillagePopulation {
  village_code: string;
  subdistrict_code: string;
  district_code: string;
  state_code: string;
  total_population: number;
}




interface SelectedRiverData {
  drains: {
    id: string; // Change from number to string to match Drain_No
    name: string;
    stretchId: number;


  }[];

  allDrains?: { // Add this property
    id: string;
    name: string;
    stretch: string;
    drainNo?: string;
  }[];
}

const Basic: React.FC = () => {
  const [selectedLocationData, setSelectedLocationData] = useState<SelectedLocationData | null>(null);
  const [selectedRiverData, setSelectedRiverData] = useState<SelectedRiverData | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [transitionDirection, setTransitionDirection] = useState<'forward' | 'backward'>('forward');
  const [skippedSteps, setSkippedSteps] = useState<number[]>([]);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'admin' | 'drain'>('admin'); // State for view toggle

  // Separate completed steps for admin and drain views
  const [adminCompletedSteps, setAdminCompletedSteps] = useState<number[]>([]);
  const [drainCompletedSteps, setDrainCompletedSteps] = useState<number[]>([]);

  // Separate skipped steps for admin and drain views
  const [adminSkippedSteps, setAdminSkippedSteps] = useState<number[]>([]);
  const [drainSkippedSteps, setDrainSkippedSteps] = useState<number[]>([]);

  // Separate current step for admin and drain views
  const [adminCurrentStep, setAdminCurrentStep] = useState<number>(0);
  const [drainCurrentStep, setDrainCurrentStep] = useState<number>(0);

  // State for LocationSelector
  const [selectedStateCode, setSelectedStateCode] = useState<string>('');
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [selectedSubDistricts, setSelectedSubDistricts] = useState<string[]>([]);
  const [selectedVillages, setSelectedVillages] = useState<string[]>([]); // Add this line

  // State for RiverSelector
  const [selectedRiver, setSelectedRiver] = useState<string>('');
  const [selectedStretch, setSelectedStretch] = useState<string>('');
  const [selectedDrainIds, setSelectedDrainIds] = useState<string[]>([]);
  const [selectedDrains, setSelectedDrains] = useState<string[]>([]);
  const [intersectedVillages, setIntersectedVillages] = useState<IntersectedVillage[]>([]);
  const [villageChangeSource, setVillageChangeSource] = useState<'map' | 'dropdown' | null>(null);
  const [drainVillagePopulations, setDrainVillagePopulations] = useState<VillagePopulation[]>([]);
  const [drainSelectionsLocked, setDrainSelectionsLocked] = useState<boolean>(false);

  // Refs for LocationSelector
  const stateRef = useRef<string>('');
  const districtsRef = useRef<string[]>([]);
  const subDistrictsRef = useRef<string[]>([]);
  const villagesRef = useRef<string[]>([]); // Add this line
  // Refs for RiverSelector
  const riverRef = useRef<string>('');
  const stretchRef = useRef<string[]>([]);
  const drainsRef = useRef<string[]>([]);

  // Sync refs with state for LocationSelector
  useEffect(() => {
    stateRef.current = selectedStateCode;
  }, [selectedStateCode]);

  useEffect(() => {
    districtsRef.current = [...selectedDistricts];
  }, [selectedDistricts]);

  useEffect(() => {
    subDistrictsRef.current = [...selectedSubDistricts];
  }, [selectedSubDistricts]);

  useEffect(() => {
    villagesRef.current = [...selectedVillages];
  }, [selectedVillages]);

  // Sync refs with state for RiverSelector
  useEffect(() => {
    riverRef.current = selectedRiver;
  }, [selectedRiver]);

  useEffect(() => {
    stretchRef.current = [selectedStretch];
  }, [selectedStretch]);

  useEffect(() => {
    drainsRef.current = [...selectedDrains];
  }, [selectedDrains]);


  useEffect(() => {
    if (villageChangeSource) {
      const timer = setTimeout(() => {
        console.log('Clearing villageChangeSource in page.tsx:', villageChangeSource);
        setVillageChangeSource(null);

        // Also clear global flag if it matches
        if (window.villageChangeSource === villageChangeSource) {
          window.villageChangeSource = null;
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [villageChangeSource]);

  // Update current step based on view mode
  useEffect(() => {
    if (viewMode === 'admin') {
      setCurrentStep(adminCurrentStep);
      setCompletedSteps(adminCompletedSteps);
      setSkippedSteps(adminSkippedSteps);
    } else {
      setCurrentStep(drainCurrentStep);
      setCompletedSteps(drainCompletedSteps);
      setSkippedSteps(drainSkippedSteps);
    }
  }, [viewMode, adminCurrentStep, drainCurrentStep, adminCompletedSteps, drainCompletedSteps, adminSkippedSteps, drainSkippedSteps]);

  // Handle confirm for LocationSelector
  const handleLocationConfirm = (data: SelectedLocationData): void => {
    console.log('Received confirmed location data:', data);
    setSelectedLocationData(data);
    setSelectedRiverData(null); // Clear RiverSelector data
  };

  const memoizedIntersectedVillages = useMemo(() => intersectedVillages, [intersectedVillages]);


  // Handler for villages change from the map
  const handleVillagesChange = (villages: IntersectedVillage[], source: 'map' | 'dropdown' | null = null) => {
    // Determine the actual source with priority:
    // 1. Explicit source parameter
    // 2. Global window flag
    // 3. Default to 'unknown'
    let actualSource: 'map' | 'dropdown' | null = source;

    if (!actualSource && window.villageChangeSource) {
      actualSource = window.villageChangeSource;
    }

    console.log(`Villages selection changed in page.tsx (source: ${actualSource || 'unknown'}):`,
      villages.filter(v => v.selected !== false).length, 'selected out of', villages.length);
    console.log(`Source determination: param=${source}, global=${window.villageChangeSource}, final=${actualSource}`);

    // Always update if villages are different
    if (!isEqual(villages, intersectedVillages)) {
      console.log('Villages have changed, updating state with source:', actualSource);
      setIntersectedVillages([...villages]);

      // Set the village change source
      setVillageChangeSource(actualSource);

      // Update global data
      if (window.selectedRiverData) {
        window.selectedRiverData = {
          ...window.selectedRiverData,
          selectedVillages: villages.filter(v => v.selected !== false),
        };
        console.log('Updated window.selectedRiverData');
      }
    } else {
      console.log('Villages unchanged, skipping update');
    }
  };

  const handleDistrictsChange = (districts: string[]): void => {
    console.log('Districts changed to:', districts);
    if (JSON.stringify(districts) !== JSON.stringify(districtsRef.current)) {
      console.log('Resetting subdistrict selections');
      setSelectedSubDistricts([]);
      if (window.resetSubDistrictSelectionsInLocationSelector) {
        window.resetSubDistrictSelectionsInLocationSelector();
      }
    }
    setSelectedDistricts([...districts]);
  };

  const villageProps = drainVillagePopulations?.map(vp => {
    const mappedVillage = {
      id: parseInt(vp.village_code) || 0,
      name: intersectedVillages.find(v => v.shapeID === vp.village_code)?.shapeName || 'Unknown Village',
      subDistrictId: parseInt(vp.subdistrict_code) || 0,
      population: vp.total_population || 0
    };
    console.log(`Mapped village ${mappedVillage.name} (${mappedVillage.id}) population: ${mappedVillage.population}`);
    return mappedVillage;
  }) || [];


  const drainTotalPopulation = useMemo(() => {
    return drainVillagePopulations.reduce((sum, village) => sum + village.total_population, 0);
  }, [drainVillagePopulations]);



  // Handle subdistrict selection for LocationSelector
  const handleSubDistrictsChange = (subdistricts: string[]): void => {
    console.log('Sub-districts changed to:', subdistricts);
    setSelectedSubDistricts([...subdistricts]);
    setDrainSelectionsLocked(true);
  };


  const handleRiverConfirm = (data: SelectedRiverData): void => {
    console.log('Received confirmed river data:', data);
    setSelectedRiverData(data);
    setSelectedLocationData(null); // Clear LocationSelector data
  };
  // Handle state selection for LocationSelector
  const handleStateChange = (stateCode: string): void => {
    console.log('State changed to:', stateCode);
    if (stateCode !== stateRef.current) {
      console.log('Resetting district and subdistrict selections');
      setSelectedDistricts([]);
      setSelectedSubDistricts([]);
      if (window.resetDistrictSelectionsInLocationSelector) {
        window.resetDistrictSelectionsInLocationSelector();
      }
      if (window.resetSubDistrictSelectionsInLocationSelector) {
        window.resetSubDistrictSelectionsInLocationSelector();
      }
    }
    setSelectedStateCode(stateCode);
  };

  const handleVillagesChangeAdmin = (villages: string[]): void => {
    console.log('Villages changed to:', villages);
    setSelectedVillages([...villages]);
  };

  // Handle river selection for RiverSelector
  const handleRiverChange = (riverId: string): void => {
    console.log('River changed to:', riverId);
    if (riverId !== riverRef.current) {
      console.log('Resetting stretch and drain selections');
      setSelectedStretch('');
      setSelectedDrains([]);
      if (window.resetStretchSelectionsInDrainLocationsSelector) {
        window.resetStretchSelectionsInDrainLocationsSelector();
      }
      if (window.resetStretchSelectionsInDrainLocationsSelector) {
        window.resetStretchSelectionsInDrainLocationsSelector();
      }
    }
    setSelectedRiver(riverId);
  };

  // Handle stretch selection for RiverSelector
  const handleStretchChange = (stretchId: string): void => {
    console.log('Stretch changed to:', stretchId);
    if (!stretchRef.current.includes(stretchId)) {
      console.log('Resetting drain selections');
      setSelectedDrains([]);
      if (window.resetDrainSelectionsInDrainLocationsSelector) {
        window.resetDrainSelectionsInDrainLocationsSelector();
      }
    }
    setSelectedStretch(stretchId);
  };

  // Handle drains selection for RiverSelector
  const handleDrainsChange = (drainIds: string[]) => {
    setSelectedDrainIds(drainIds);
    console.log("Selected drain IDs updated:", drainIds);
  };


  const handleVillagePopulationUpdate = (populations: VillagePopulation[]) => {
    console.log('Village populations updated:', populations);
    setDrainVillagePopulations(populations);
  };


  const handleConfirm = (data: { drains: any[] }) => {
    const riverData: SelectedRiverData = {
      drains: data.drains.map(d => ({
        id: d.id.toString(), // Ensure ID is string (Drain_No)
        name: d.name,
        stretchId: d.stretchId,

      })),

      // FIXED: Ensure allDrains includes all necessary data
      allDrains: data.drains.map(d => ({
        id: d.id.toString(), // This is the Drain_No as string
        name: d.name,
        stretch: d.stretchName || 'Unknown Stretch',
        drainNo: d.id.toString(), // Explicitly set drainNo
      })),
    };

    console.log('page.tsx: Setting selectedRiverData with complete drain data:', riverData);
    setSelectedRiverData(riverData);

    // FIXED: Ensure window.selectedRiverData includes selectedVillages
    window.selectedRiverData = {
      ...riverData,
      selectedVillages: intersectedVillages.filter(v => v.selected !== false),
    };

    console.log('page.tsx: Updated window.selectedRiverData:', window.selectedRiverData);
  };





  // Navigation handlers with view mode awareness
  const handleNext = () => {
    if (currentStep < 3) {
      if (viewMode === 'admin') {
        setAdminCompletedSteps(prev => [...prev.filter(step => step !== currentStep), currentStep]);
        setAdminSkippedSteps(prev => prev.filter(step => step !== currentStep));
        setAdminCurrentStep(prev => prev + 1);
      } else {
        setDrainCompletedSteps(prev => [...prev.filter(step => step !== currentStep), currentStep]);
        setDrainSkippedSteps(prev => prev.filter(step => step !== currentStep));
        setDrainCurrentStep(prev => prev + 1);
      }
      setTransitionDirection('forward');
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      if (viewMode === 'admin') {
        setAdminCurrentStep(prev => prev - 1);
      } else {
        setDrainCurrentStep(prev => prev - 1);
      }
      setTransitionDirection('backward');
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    if (currentStep > 0 && currentStep < 3) {
      if (viewMode === 'admin') {
        setAdminSkippedSteps(prev => [...prev.filter(step => step !== currentStep), currentStep]);
        setAdminCompletedSteps(prev => prev.filter(step => step !== currentStep));
        setAdminCurrentStep(prev => prev + 1);
      } else {
        setDrainSkippedSteps(prev => [...prev.filter(step => step !== currentStep), currentStep]);
        setDrainCompletedSteps(prev => prev.filter(step => step !== currentStep));
        setDrainCurrentStep(prev => prev + 1);
      }
      setTransitionDirection('forward');
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleStepChange = (newStep: number) => {
    if (newStep < currentStep) {
      if (viewMode === 'admin') {
        setAdminCurrentStep(newStep);
      } else {
        setDrainCurrentStep(newStep);
      }
      setTransitionDirection('backward');
      setCurrentStep(newStep);
    }
  };

  // Complete reset handler
  const handleReset = (): void => {
    console.log('FULL RESET triggered');
    setCurrentStep(0);
    setAdminCurrentStep(0);
    setDrainCurrentStep(0);
    setSkippedSteps([]);
    setAdminSkippedSteps([]);
    setDrainSkippedSteps([]);
    setCompletedSteps([]);
    setAdminCompletedSteps([]);
    setDrainCompletedSteps([]);

    // Reset LocationSelector data
    setSelectedLocationData(null);
    setSelectedStateCode('');
    setSelectedDistricts([]);
    setSelectedSubDistricts([]);
    setSelectedVillages([]); // Add this line
    stateRef.current = '';
    districtsRef.current = [];
    subDistrictsRef.current = [];
    villagesRef.current = []; // Add this line

    // Reset RiverSelector data
    setSelectedRiverData(null);
    setSelectedRiver('');
    setSelectedStretch('');
    setSelectedDrains([]);
    setIntersectedVillages([]);
    setDrainSelectionsLocked(false);
    riverRef.current = '';
    stretchRef.current = [];
    drainsRef.current = [];

    // Clear global variables
    (window as any).totalWaterSupply = undefined;
    (window as any).previousTotalWaterSupply = undefined;
    (window as any).selectedLocations = undefined;
    (window as any).selectedRiverData = undefined;

    // Reset view mode to admin
    setViewMode('admin');

    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleFinish = () => {
    if (viewMode === 'admin') {
      setAdminCompletedSteps(prev => [...prev.filter(step => step !== 3), 3]);
    } else {
      setDrainCompletedSteps(prev => [...prev.filter(step => step !== 3), 3]);
    }
    setCompletedSteps(prev => [...prev.filter(step => step !== 3), 3]);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 2000);
  };

  // Toggle view mode handler
  const handleViewModeChange = (mode: 'admin' | 'drain') => {
    setViewMode(mode);
    if (mode === 'drain') {
      setDrainSelectionsLocked(false); // Reset lock when switching to drain mode
    }
  };

  // Reset steps when new data is confirmed
  useEffect(() => {
    if (selectedLocationData || selectedRiverData) {
      setCurrentStep(0);
      setAdminCurrentStep(0);
      setDrainCurrentStep(0);
      setSkippedSteps([]);
      setAdminSkippedSteps([]);
      setDrainSkippedSteps([]);
      setCompletedSteps([]);
      setAdminCompletedSteps([]);
      setDrainCompletedSteps([]);
      setShowSuccess(false);
    }
  }, [selectedLocationData, selectedRiverData]);

  return (
    <div className="flex flex-col md:flex-row w-full min-h-0">
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-gray-200">
        <StatusBar
          currentStep={currentStep}
          onStepChange={handleStepChange}
          skippedSteps={skippedSteps}
          completedSteps={completedSteps}
          viewMode={viewMode}
        />
      </div>

      <div className="w-full relative flex flex-col">
        {/* Toggle Buttons - Moved Above Location Selectors */}
        <div className="flex justify-center mt-4 mb-6 px-4 z-10">
          <div className="inline-flex rounded-full bg-gray-100 p-1 shadow-md">
            <button
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out flex items-center space-x-2 ${viewMode === 'admin'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              onClick={() => handleViewModeChange('admin')}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 14l9-5-9-5-9 5 9 5z"
                />
              </svg>
              <span>Admin</span>
            </button>
            <button
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out flex items-center space-x-2 ${viewMode === 'drain'
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              onClick={() => handleViewModeChange('drain')}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 16l-4-4m0 0l4-4m-4 4h18"
                />
              </svg>
              <span>Drain</span>
            </button>
          </div>
        </div>

        {/* Selector and Map Layout */}
        <div className="flex w-full px-4">
          <div className="w-2/3 mt-3">
            {viewMode === 'admin' ? (
              <LocationSelector
                onConfirm={handleLocationConfirm}
                onReset={handleReset}
                onStateChange={handleStateChange}
                onDistrictsChange={handleDistrictsChange}
                onSubDistrictsChange={handleSubDistrictsChange}
                onVillagesChange={handleVillagesChangeAdmin} // Add this line
              />
            ) : (
              <DrainLocationSelector
                onConfirm={handleRiverConfirm}
                onReset={handleReset}
                onRiverChange={handleRiverChange}
                onStretchChange={handleStretchChange}
                onDrainsChange={handleDrainsChange}
                onVillagesChange={(villages) => handleVillagesChange(villages, 'dropdown')}
                villages={intersectedVillages}
                villageChangeSource={villageChangeSource}
                onVillagePopulationUpdate={handleVillagePopulationUpdate}
                selectionsLocked={drainSelectionsLocked}
                onLockChange={setDrainSelectionsLocked}
              />
            )}
          </div>
          <div className="w-1/2 mt-3 mr-6 ml-4 mb-6 z-10">
            {viewMode === 'admin' ? (
              <Map
                selectedState={selectedStateCode}
                selectedDistricts={selectedDistricts}
                selectedSubDistricts={selectedSubDistricts}
                selectedVillages={selectedVillages}
                className="admin-map"
              />
            ) : (
              <div className="  mr-6 ml-4 mb-5 border border-gray-900 ">
                <DrainMap
                  selectedRiver={selectedRiver}
                  selectedStretch={selectedStretch}
                  selectedDrains={selectedDrainIds}
                  onVillagesChange={(villages) => handleVillagesChange(villages)}
                  villageChangeSource={villageChangeSource}
                  selectionsLocked={drainSelectionsLocked}
                  className="drain-map"
                />
              </div>
            )}
          </div>
        </div>

        {showSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30 animate-fade-in-out">
            <div className="bg-green-100 text-green-800 px-6 py-4 rounded-2xl shadow-xl border border-green-300 flex items-center space-x-3 max-w-sm w-full mx-4">
              <svg
                className="w-6 h-6 text-green-600 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-medium">
                All Calculation has been completed now you can download the report
              </span>
            </div>
          </div>
        )}

        {/* Step Content with view mode awareness */}
        <div className="transition-all duration-300 transform px-4">
          <div className={currentStep === 0 ? 'block' : 'hidden'}>
            {selectedLocationData && viewMode === 'admin' && (
              <Population
                villages_props={selectedLocationData.villages}
                subDistricts_props={selectedLocationData.subDistricts}
                totalPopulation_props={selectedLocationData.totalPopulation}
                sourceMode="admin"
              />
            )}
            {viewMode === 'drain' && selectedRiverData && drainVillagePopulations.length > 0 && (
              <>
                {/* Debug info for drain mode */}
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 mb-2">Total Population:</h4>
                  <div className="text-sm text-yellow-700 space-y-1">

                    <div>Total Population: {drainTotalPopulation.toLocaleString()}</div>
                    <div>Valid Villages: {villageProps.filter(v => v.population > 0).length}</div>

                  </div>
                </div>

                <Population
                  villages_props={villageProps}
                  subDistricts_props={
                    Array.from(
                      new Set(
                        drainVillagePopulations
                          ?.filter(vp => vp.subdistrict_code)
                          .map(vp => vp.subdistrict_code)
                      ) || []
                    ).map(subId => ({
                      id: parseInt(subId) || 0,
                      name: `Sub-district ${subId}`,
                      districtId: 0
                    })) || []
                  }
                  totalPopulation_props={drainTotalPopulation || 0}
                  sourceMode="drain"
                  state_props={
                    drainVillagePopulations.length > 0 ? {
                      id: drainVillagePopulations[0].state_code,
                      name: `State ${drainVillagePopulations[0].state_code}`
                    } : undefined
                  }
                  district_props={
                    drainVillagePopulations.length > 0 ? {
                      id: drainVillagePopulations[0].district_code,
                      name: `District ${drainVillagePopulations[0].district_code}`
                    } : undefined
                  }
                />
              </>
            )}

            {viewMode === 'drain' && selectedRiverData && drainVillagePopulations.length === 0 && (
              <div className="p-6 bg-orange-50 border border-orange-200 rounded-lg text-center">
                <div className="text-orange-800 mb-2">
                  <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 18.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <h3 className="text-lg font-semibold">No Village Data Available</h3>
                  <p className="text-sm mt-1">
                    Please ensure villages are properly selected in the drain location selector.
                    Population calculations require village data to proceed.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className={currentStep === 1 ? 'block' : 'hidden'}>
            {viewMode === 'admin' && <Water_Demand />}
            {viewMode === 'drain' && (
              <Water_Demand
              // villages_props={drainVillagePopulations.map(vp => ({
              //   id: vp.village_code,
              //   name: intersectedVillages.find(v => v.shapeID === vp.village_code)?.shapeName || 'Unknown',
              //   subDistrictId: vp.subdistrict_code,
              //   population: vp.total_population
              // }))}
              // totalPopulation_props={drainTotalPopulation}
              />
            )}
          </div>

          <div className={currentStep === 2 ? 'block' : 'hidden'}>
            {viewMode === 'admin' && <Water_Supply />}
            {viewMode === 'drain' && (
              <Water_Supply
              // villages_props={drainVillagePopulations.map(vp => ({
              //   id: vp.village_code,
              //   name: intersectedVillages.find(v => v.shapeID === vp.village_code)?.shapeName || 'Unknown',
              //   subDistrictId: vp.subdistrict_code,
              //   population: vp.total_population
              // }))}
              // totalPopulation_props={drainTotalPopulation}
              />
            )}
          </div>

          <div className={currentStep === 3 ? 'block' : 'hidden'}>
            {selectedLocationData && viewMode === 'admin' && (
              <SewageCalculationForm
                sourceMode="admin"
                villages_props={selectedLocationData.villages}

                totalPopulation_props={selectedLocationData.totalPopulation}

              />
            )}
            {viewMode === 'drain' && (
              <SewageCalculationForm
                villages_props={drainVillagePopulations.map(vp => ({
                  id: vp.village_code,
                  name: intersectedVillages.find(v => v.shapeID === vp.village_code)?.shapeName || 'Unknown',
                  subDistrictId: vp.subdistrict_code,
                  population: vp.total_population
                }))}
                totalPopulation_props={drainTotalPopulation}
                sourceMode="drain" // FIXED: Explicitly set sourceMode to "drain"
                selectedRiverData={selectedRiverData} // Pass the selectedRiverData prop
              />
            )}
          </div>
        </div>

        {/* Navigation buttons */}
        {((selectedLocationData && viewMode === 'admin') || (selectedRiverData && viewMode === 'drain')) && (
          <div className="mt-6 mb-6 mx-4 border border-gray-300 rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow duration-300">
            <div className="flex justify-between items-center">
              <div className="flex space-x-4">
                <button
                  className={`${currentStep === 0 || currentStep === 3
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                    } text-white font-medium py-2 px-4 rounded-md transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                  disabled={currentStep === 0 || currentStep === 3}
                  onClick={handleSkip}
                >
                  Skip
                </button>

                {currentStep > 0 && (
                  <button
                    className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
                    onClick={handlePrevious}
                  >
                    Previous
                  </button>
                )}
              </div>

              <button
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                onClick={currentStep === 3 ? handleFinish : handleNext}
                disabled={currentStep === 3 && completedSteps.includes(3)}
              >
                {currentStep === 3 ? 'Finish' : 'Save and Next'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Basic
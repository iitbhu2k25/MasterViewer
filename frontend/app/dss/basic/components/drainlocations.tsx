'use client'
import React, { useState, useEffect, useRef } from 'react';
import { MultiSelect } from './Multiselect';
import isEqual from 'lodash/isEqual';

// Define global interface for window
declare global {
  interface Window {
    resetStretchSelectionsInDrainLocationsSelector?: () => void;
    resetDrainSelectionsInDrainLocationsSelector?: () => void;
    selectedRiverData?: any;
    villageChangeSource?: 'map' | 'dropdown' | null;
    dropdownLockUntil?: number;
    finalDropdownSelection?: { // Add this
      villages: IntersectedVillage[];
      selectedIds: string[];
      timestamp: number;
    };
  }
}


interface VillagePopulation {
  village_code: string;
  subdistrict_code: string;
  district_code: string;
  state_code: string;
  total_population: number;
}

// Interfaces for API responses
interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: Array<{
    id?: string;
    type: 'Feature';
    properties: Record<string, any>;
    geometry: any;
  }>;
}

interface LocationItem {
  id: string;
  name: string;
}

interface Stretch extends LocationItem {
  riverId: number;
}

interface Drain extends LocationItem {
  id: string; // This is Drain_No from the shapefile/database
  stretchId: number;
  stretchName?: string;
}

interface IntersectedVillage {
  shapeID: string;
  shapeName: string;
  drainNo: number;
  selected?: boolean;
}

// New interface for village items in MultiSelect
interface VillageItem {
  shapeID: string;
  name: string;
  drainNo: number;
}

interface TruncatedListProps {
  content: string;
  maxLength?: number;
}

const TruncatedList: React.FC<TruncatedListProps> = ({ content, maxLength = 100 }) => {
  const [expanded, setExpanded] = useState<boolean>(false);

  if (!content || content === 'None') return <span>None</span>;
  if (content.length <= maxLength) return <span>{content}</span>;

  return (
    <span>
      {expanded ? (
        <>
          {content}
          <button
            onClick={() => setExpanded(false)}
            className="ml-2 text-blue-500 hover:text-blue-700 text-xs font-medium"
          >
            Show less
          </button>
        </>
      ) : (
        <>
          {content.substring(0, maxLength)}...
          <button
            onClick={() => setExpanded(true)}
            className="ml-2 text-blue-500 hover:text-blue-700 text-xs font-medium"
          >
            Show more
          </button>
        </>
      )}
    </span>
  );
};

interface DrainLocationsSelectorProps {
  onConfirm?: (selectedData: { drains: Drain[] }) => void;
  onReset?: () => void;
  onRiverChange?: (riverId: string) => void;
  onStretchChange?: (stretchId: string) => void;
  onDrainsChange?: (drains: string[]) => void;
  onVillagesChange?: (villages: IntersectedVillage[]) => void;
  villages?: IntersectedVillage[];
  villageChangeSource?: 'map' | 'dropdown' | null;
  onVillagePopulationUpdate?: (populations: VillagePopulation[]) => void;
  selectionsLocked?: boolean; // ADD THIS LINE
  onLockChange?: (locked: boolean) => void; // ADD THIS LINE
}

const DrainLocationsSelector: React.FC<DrainLocationsSelectorProps> = ({
  onConfirm,
  onReset,
  onRiverChange,
  onStretchChange,
  onDrainsChange,
  onVillagesChange,
  onVillagePopulationUpdate = () => { },
  villages = [],
  villageChangeSource,
  selectionsLocked: propSelectionsLocked, // ADD THIS LINE
  onLockChange, // ADD THIS LINE
}) => {
  // Main state
  const [rivers, setRivers] = useState<LocationItem[]>([]);
  const [stretches, setStretches] = useState<Stretch[]>([]);
  const [drains, setDrains] = useState<Drain[]>([]);
  const [selectedRiver, setSelectedRiver] = useState<string>('');
  const [selectedStretch, setSelectedStretch] = useState<string>('');
  const [selectedDrains, setSelectedDrains] = useState<string[]>([]);
  const [selectionsLocked, setSelectionsLocked] = useState<boolean>(false);

  // State for intersected villages
  const [intersectedVillages, setIntersectedVillages] = useState<IntersectedVillage[]>([]);
  const [selectedVillages, setSelectedVillages] = useState<string[]>([]);
  const [loadingVillages, setLoadingVillages] = useState<boolean>(false);
  const [villageError, setVillageError] = useState<string | null>(null);
  const [villagePopulations, setVillagePopulations] = useState<VillagePopulation[]>([]);
  // Control flags for preventing infinite loops
  const isDropdownUpdatingRef = useRef<boolean>(false);
  const [pendingVillages, setPendingVillages] = useState<string[] | null>(null);
  const [isDropdownUpdating, setIsDropdownUpdating] = useState<boolean>(false);

  // Loading states
  const [loadingRivers, setLoadingRivers] = useState<boolean>(false);
  const [loadingStretches, setLoadingStretches] = useState<boolean>(false);
  const [loadingDrains, setLoadingDrains] = useState<boolean>(false);

  // Error states
  const [error, setError] = useState<string | null>(null);
  const [riverError, setRiverError] = useState<string | null>(null);
  const [stretchError, setStretchError] = useState<string | null>(null);
  const [drainError, setDrainError] = useState<string | null>(null);

  // Sync dropdown updating flag with ref
  useEffect(() => {
    isDropdownUpdatingRef.current = isDropdownUpdating;
  }, [isDropdownUpdating]);

  useEffect(() => {
    if (propSelectionsLocked !== undefined) {
      updateSelectionsLocked(propSelectionsLocked);
    }
  }, [propSelectionsLocked]);


  useEffect(() => {
    if (villageChangeSource) {
      const timer = setTimeout(() => {
        console.log('Clearing villageChangeSource in DrainLocationsSelector');
        // Don't clear if we're still updating
        if (!isDropdownUpdatingRef.current) {
          // This will be cleared by the parent component
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [villageChangeSource]);

  // Handle pending villages state
  useEffect(() => {
    if (pendingVillages && villages.length > 0) {
      const selectedFromProps = villages
        .filter(village => village.selected !== false)
        .map(village => village.shapeID);

      // Only clear pending if the parent state matches our intended change
      const pendingSorted = [...pendingVillages].sort();
      const propsSorted = [...selectedFromProps].sort();

      if (JSON.stringify(pendingSorted) === JSON.stringify(propsSorted)) {
        console.log('Pending villages matched props, clearing pendingVillages');
        setPendingVillages(null);
      } else {
        console.log('Pending villages do not match props yet:', {
          pending: pendingSorted.length,
          props: propsSorted.length
        });
      }
    }
  }, [villages, pendingVillages]);

  // Register reset functions to window
  useEffect(() => {
    window.resetStretchSelectionsInDrainLocationsSelector = () => {
      if (!selectionsLocked) {
        console.log('DrainLocationsSelector resetting stretch selections');
        setSelectedStretch('');
        setSelectedDrains([]);
      }
    };

    window.resetDrainSelectionsInDrainLocationsSelector = () => {
      if (!selectionsLocked) {
        console.log('DrainLocationsSelector resetting drain selections');
        setSelectedDrains([]);
      }
    };

    return () => {
      window.resetStretchSelectionsInDrainLocationsSelector = undefined;
      window.resetDrainSelectionsInDrainLocationsSelector = undefined;
    };
  }, [selectionsLocked]);

  // FIXED: Single useEffect to handle villages prop changes
  useEffect(() => {
    console.log('Villages useEffect triggered:', {
      villageChangeSource,
      globalVillageChangeSource: window.villageChangeSource,
      isDropdownUpdating: isDropdownUpdatingRef.current,
      dropdownLockUntil: window.dropdownLockUntil,
      finalDropdownSelection: window.finalDropdownSelection,
      villagesLength: villages.length
    });

    // Check for dropdown lock or final selection
    if (window.dropdownLockUntil && Date.now() < window.dropdownLockUntil) {
      console.log('Skipping useEffect - dropdown lock is active');
      return;
    }

    // If there's a final dropdown selection, use that instead
    if (window.finalDropdownSelection && Date.now() - window.finalDropdownSelection.timestamp < 3000) {
      console.log('Using final dropdown selection instead of props');
      const finalVillages = window.finalDropdownSelection.villages;
      const finalSelectedIds = window.finalDropdownSelection.selectedIds;

      if (!isEqual(finalVillages, intersectedVillages)) {
        setIntersectedVillages([...finalVillages]);
        setSelectedVillages([...finalSelectedIds]);
      }
      return;
    }

    // Skip if any dropdown update is in progress
    if (isDropdownUpdatingRef.current || window.villageChangeSource === 'dropdown') {
      console.log('Skipping useEffect - dropdown is updating');
      return;
    }

    // Skip if the change source was dropdown
    if (villageChangeSource === 'dropdown') {
      console.log('Skipping useEffect - source was dropdown');
      return;
    }

    if (villages && villages.length > 0) {
      console.log('Processing villages prop from map source');

      // Only update if we don't have pending changes
      if (!pendingVillages) {
        // Check if villages array has actually changed
        const villagesChanged = villages.length !== intersectedVillages.length ||
          villages.some((v, i) => {
            const existing = intersectedVillages[i];
            return !existing || v.shapeID !== existing.shapeID || v.selected !== existing.selected;
          });

        if (villagesChanged) {
          console.log('Villages have changed from map, updating intersectedVillages');
          setIntersectedVillages([...villages]);

          // Update selected villages
          const selectedFromProps = villages
            .filter(village => village.selected !== false)
            .map(village => village.shapeID);

          console.log('Updating selectedVillages from map:', selectedFromProps.length);
          setSelectedVillages([...selectedFromProps]);
        } else {
          console.log('Villages unchanged, skipping update');
        }
      } else {
        console.log('Pending dropdown changes exist, skipping update');
      }
    } else if (villages && villages.length === 0) {
      console.log('Clearing villages due to empty prop');
      setIntersectedVillages([]);
      setSelectedVillages([]);
      setPendingVillages(null);
    }
  }, [villages, villageChangeSource]); // Removed intersectedVillages and selectedVillages from deps

  // Fetch rivers
  useEffect(() => {
    const fetchRivers = async (): Promise<void> => {
      try {
        setLoadingRivers(true);
        setRiverError(null);
        setError(null);

        const response = await fetch('http://localhost:9000/api/basic/rivers/');
        if (!response.ok) {
          throw new Error(`Failed to fetch rivers (Status: ${response.status})`);
        }

        const data: GeoJSONFeatureCollection = await response.json();
        if (data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
          throw new Error('Invalid river data format received');
        }

        const riverData: LocationItem[] = data.features.map(feature => ({
          id: feature.properties.River_Code,
          name: feature.properties.River_Name,
        }));

        setRivers(riverData);
      } catch (error: any) {
        console.error('Error fetching rivers:', error);
        setRiverError(error.message);
        setError('Unable to load rivers. Please try refreshing the page.');
        setRivers([]);
      } finally {
        setLoadingRivers(false);
      }
    };

    fetchRivers();
  }, []);

  // Fetch stretches when river is selected
  useEffect(() => {
    if (selectedRiver) {
      const fetchStretches = async (): Promise<void> => {
        try {
          setLoadingStretches(true);
          setStretchError(null);
          setError(null);

          const response = await fetch('http://localhost:9000/api/basic/river-stretched/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ River_Code: parseInt(selectedRiver) }),
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch stretches (Status: ${response.status})`);
          }

          const data: GeoJSONFeatureCollection = await response.json();

          if (data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
            throw new Error('Invalid stretch data format received');
          }

          const stretchData: Stretch[] = data.features.map(feature => ({
            id: feature.properties.Stretch_ID,
            name: feature.properties.River_Name,
            riverId: parseInt(selectedRiver),
          }));

          const sortedStretches = [...stretchData].sort((a, b) => {
            const aName = a.name || '';
            const bName = b.name || '';
            return aName.localeCompare(bName);
          });
          setStretches(sortedStretches);
          setSelectedStretch('');
        } catch (error: any) {
          console.error('Error fetching stretches:', error);
          setStretchError(error.message);
          setError('Unable to load stretches for the selected river.');
          setStretches([]);
        } finally {
          setLoadingStretches(false);
        }
      };

      fetchStretches();
    } else {
      setStretches([]);
      setSelectedStretch('');
      setDrains([]);
      setSelectedDrains([]);
    }
  }, [selectedRiver]);

  // Fetch drains when stretch is selected
  useEffect(() => {
    if (selectedStretch) {
      const fetchDrains = async (): Promise<void> => {
        try {
          setLoadingDrains(true);
          setDrainError(null);
          setError(null);

          const response = await fetch('http://localhost:9000/api/basic/drain/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Stretch_ID: parseInt(selectedStretch) }),
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch drains (Status: ${response.status})`);
          }

          const data: GeoJSONFeatureCollection = await response.json();

          if (data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
            throw new Error('Invalid drain data format received');
          }

          const stretchMap = new Map(stretches.map(stretch => [stretch.id.toString(), stretch.name]));
          const drainData: Drain[] = data.features.map(feature => ({
            id: feature.properties.Drain_No.toString(), // Use Drain_No directly as number
            name: `Drain ${feature.properties.Drain_No}`,
            stretchId: feature.properties.Stretch_ID,
            stretchName: stretchMap.get(feature.properties.Stretch_ID.toString()) || 'Unknown Stretch',
          }));

          const sortedDrains = [...drainData].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
          setDrains(sortedDrains);
          setSelectedDrains([]);

          console.log('Fetched drains with Drain_No:', drainData);
        } catch (error: any) {
          console.error('Error fetching drains:', error);
          setDrainError(error.message);
          setError('Unable to load drains for the selected stretch.');
          setDrains([]);
        } finally {
          setLoadingDrains(false);
        }
      };

      fetchDrains();
    } else {
      setDrains([]);
      setSelectedDrains([]);
    }
  }, [selectedStretch, stretches]);

  // Fetch intersected villages when drains are selected
  useEffect(() => {
    if (selectedDrains.length > 0) {
      const fetchIntersectedVillages = async (): Promise<void> => {
        try {
          setLoadingVillages(true);
          setVillageError(null);
          setError(null);

          const response = await fetch('http://localhost:9000/api/basic/catchment_village/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              Drain_No: selectedDrains.map(id => parseInt(id))
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch intersected villages (Status: ${response.status})`);
          }

          const data = await response.json();
          const villagesWithSelection = (data.intersected_villages || []).map((village: any) => ({
            ...village,
            selected: true
          }));

          setIntersectedVillages(villagesWithSelection);
          const initialSelectedVillages = villagesWithSelection.map((village: { shapeID: any; }) => village.shapeID);
          setSelectedVillages(initialSelectedVillages);

          console.log('Intersected villages with selection:', villagesWithSelection);
        } catch (error: any) {
          console.error('Error fetching intersected villages:', error);
          setVillageError(error.message);
          setIntersectedVillages([]);
          setSelectedVillages([]);
        } finally {
          setLoadingVillages(false);
        }
      };

      fetchIntersectedVillages();
    } else {
      setIntersectedVillages([]);
      setSelectedVillages([]);
    }
  }, [selectedDrains]);

  useEffect(() => {
    if (selectedVillages.length > 0) {
      fetchVillagePopulations(selectedVillages);
    } else {
      setVillagePopulations([]);
      if (onVillagePopulationUpdate) {
        onVillagePopulationUpdate([]);
      }
    }
  }, [selectedVillages]);

  const updateSelectionsLocked = (locked: boolean) => {
    setSelectionsLocked(locked);
    if (onLockChange) {
      onLockChange(locked);
    }
  };



  // Event handlers
  const handleRiverChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    if (!selectionsLocked) {
      const riverId = e.target.value;
      setSelectedRiver(riverId);

      if (onRiverChange) {
        onRiverChange(riverId);
      }
    }
  };

  const handleStretchChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    if (!selectionsLocked) {
      const stretchId = e.target.value;
      setSelectedStretch(stretchId);

      if (onStretchChange) {
        onStretchChange(stretchId);
      }
    }
  };

  const handleDrainsChange = (newSelectedDrains: string[]) => {
    if (!selectionsLocked) {
      const formattedDrainIds = newSelectedDrains.map(id => id.toString());
      setSelectedDrains(formattedDrainIds);

      if (onDrainsChange) {
        onDrainsChange(formattedDrainIds);
      }
    }
  };

  // FIXED: Village selection handler
  const handleVillagesChange = (newSelectedVillages: string[]) => {
    if (selectionsLocked) {
      console.log('Village selection is locked, ignoring change');
      return;
    }

    console.log('=== DROPDOWN CHANGE START ===');
    console.log('Villages selection changed in dropdown:', newSelectedVillages.length, 'selected');

    // Rest of the existing function remains the same...
    // IMMEDIATELY block any external updates
    window.villageChangeSource = 'dropdown';
    setIsDropdownUpdating(true);
    isDropdownUpdatingRef.current = true;

    // Create a lock that prevents any other updates
    const lockTimeout = Date.now() + 2000; // Increased to 2 seconds
    window.dropdownLockUntil = lockTimeout;

    // Update local state FIRST
    setSelectedVillages([...newSelectedVillages]);
    setPendingVillages([...newSelectedVillages]);

    // Create updated villages array
    const updatedVillages = intersectedVillages.map(village => ({
      ...village,
      selected: newSelectedVillages.includes(village.shapeID)
    }));

    console.log('Created updated villages from dropdown:', updatedVillages.filter(v => v.selected !== false).length, 'selected');

    // Update local intersectedVillages IMMEDIATELY
    setIntersectedVillages([...updatedVillages]);

    // Update global data BEFORE notifying parent
    if (window.selectedRiverData) {
      window.selectedRiverData = {
        ...window.selectedRiverData,
        selectedVillages: updatedVillages.filter(v => v.selected !== false)
      };
    }

    // Store the final state in a persistent location
    window.finalDropdownSelection = {
      villages: [...updatedVillages],
      selectedIds: [...newSelectedVillages],
      timestamp: Date.now()
    };

    // Delay parent notification to ensure our state is stable
    setTimeout(() => {
      if (onVillagesChange) {
        console.log('Notifying parent of dropdown changes (after delay)');
        onVillagesChange([...updatedVillages]);
      }

      // Force update parent state after notification
      setTimeout(() => {
        if (window.finalDropdownSelection && onVillagesChange) {
          console.log('Force updating parent with final dropdown selection');
          onVillagesChange([...window.finalDropdownSelection.villages]);
        }
      }, 50);
    }, 10);

    // Clear flags after a longer delay
    setTimeout(() => {
      setIsDropdownUpdating(false);
      isDropdownUpdatingRef.current = false;

      setTimeout(() => {
        window.villageChangeSource = null;
        window.dropdownLockUntil = undefined;
        setPendingVillages(null);

        // Clear the final selection after ensuring it's been applied
        setTimeout(() => {
          window.finalDropdownSelection = undefined;
          console.log('=== DROPDOWN CHANGE COMPLETE ===');
        }, 500);
      }, 100);
    }, 200);
  };


  const fetchVillagePopulations = async (selectedVillageIds: string[]) => {
    if (selectedVillageIds.length === 0) {
      setVillagePopulations([]);
      if (typeof onVillagePopulationUpdate === 'function') {
        onVillagePopulationUpdate([]);
      }
      return;
    }

    try {
      console.log("Fetching populations for villages:", selectedVillageIds.length, "villages");

      // Try the API first
      let response = await fetch('http://localhost:9000/api/basic/village-population/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shapeID: selectedVillageIds }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch village populations (Status: ${response.status})`);
      }

      const data: VillagePopulation[] = await response.json();
      console.log('Population data received:', data.length, 'records');

      // If the API returned any data, use it
      if (data && data.length > 0) {
        setVillagePopulations(data);
        if (typeof onVillagePopulationUpdate === 'function') {
          onVillagePopulationUpdate(data);
        }
        return;
      }

      // If we got here, the API returned an empty array
      console.warn("API returned an empty array, generating fallback data");
      throw new Error("API returned empty results");

    } catch (error: any) {
      console.error('Error with API or empty results, using fallback data generation:', error);

      // Generate fallback data




    }
  };

  // Add this helper function to generate fallback data


  const handleReset = (): void => {
    setSelectedRiver('');
    setSelectedStretch('');
    setSelectedDrains([]);
    setSelectedVillages([]);
    updateSelectionsLocked(false);
    setError(null);
    setRiverError(null);
    setStretchError(null);
    setDrainError(null);
    setVillageError(null);
    setIntersectedVillages([]);

    if (onReset) {
      onReset();
    }
  };

  // Helper functions
  const formatSelectedDrains = (items: Drain[], selectedIds: string[]): string => {
    if (selectedIds.length === 0) return 'None';
    if (selectedIds.length === items.length) return 'All Drains';

    const selectedItems = items.filter(item => selectedIds.includes(item.id.toString()));
    if (selectedItems.length === 0) return 'None';

    const groupedByStretch: { [key: string]: Drain[] } = {};
    selectedItems.forEach(item => {
      const stretchName = item.stretchName || 'Unknown';
      if (!groupedByStretch[stretchName]) groupedByStretch[stretchName] = [];
      groupedByStretch[stretchName].push(item);
    });

    const stretchDrainCount = drains.reduce((acc: { [key: string]: number }, drain) => {
      const stretchName = drain.stretchName || 'Unknown';
      acc[stretchName] = (acc[stretchName] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(groupedByStretch)
      .map(([stretch, drains]) => {
        if (drains.length === (stretchDrainCount[stretch] || 0)) {
          return `All Drains of ${stretch}`;
        }
        return `${stretch}: ${drains.map(d => d.name).join(', ')}`;
      })
      .join('; ');
  };

  const formatIntersectedVillages = (): string => {
    const selectedVillageObjects = intersectedVillages.filter(v => v.selected !== false);

    if (selectedVillageObjects.length === 0) return 'None';

    const groupedByDrain: { [key: string]: string[] } = {};
    selectedVillageObjects.forEach(v => {
      const drainKey = v.drainNo ? `Drain ${v.drainNo}` : 'Unknown Drain';
      if (!groupedByDrain[drainKey]) groupedByDrain[drainKey] = [];
      groupedByDrain[drainKey].push(v.shapeName);
    });

    const formatted = Object.entries(groupedByDrain)
      .map(([drain, villages]) => {
        const uniqueVillages = [...new Set(villages)];
        return `${drain}: ${uniqueVillages.join(', ')}`;
      })
      .join('; ');

    return formatted || 'None';
  };

  const formatDrainDisplay = (drain: Drain): string => {
    return `${drain.name} (ID: ${drain.id})`;
  };

  const formatVillageDisplay = (village: VillageItem): string => {
    return `${village.name} (Drain ${village.drainNo})`;
  };

  const groupDrainsByStretch = (drains: Drain[]): { [key: string]: Drain[] } => {
    return drains.reduce((groups: { [key: string]: Drain[] }, item) => {
      const stretchName = item.stretchName || 'Unknown';
      if (!groups[stretchName]) groups[stretchName] = [];
      groups[stretchName].push(item);
      return groups;
    }, {});
  };

  const groupVillagesByDrain = (villages: VillageItem[]): { [key: string]: VillageItem[] } => {
    return villages.reduce((groups: { [key: string]: VillageItem[] }, item) => {
      const drainKey = `Drain ${item.drainNo}`;
      if (!groups[drainKey]) groups[drainKey] = [];
      groups[drainKey].push(item);
      return groups;
    }, {});
  };

  const handleConfirm = (): void => {
    if (selectedDrains.length > 0) {
      updateSelectionsLocked(true);

      const selectedDrainObjects = drains.filter(drain =>
        selectedDrains.includes(drain.id)
      );

      console.log('handleConfirm: Selected drain objects with Drain_No:', selectedDrainObjects);

      const selectedVillageObjects = intersectedVillages.filter(v => v.selected !== false);

      // FIXED: Ensure riverData has all necessary properties for sewage form
      const riverData = {
        river: rivers.find(r => r.id.toString() === selectedRiver)?.name || '',
        stretch: stretches.find(s => s.id.toString() === selectedStretch)?.name || '',
        drains: selectedDrainObjects.map(d => ({
          id: d.id, // Convert Drain_No to string
          name: d.name,
          stretchId: d.stretchId,
          flowRate: 0,
        })),
        // FIXED: Ensure allDrains has complete data structure
        allDrains: selectedDrainObjects.map(d => ({
          id: d.id, // Drain_No as string - this is the key field
          name: d.name,
          stretch: d.stretchName || 'Unknown Stretch',
          drainNo: d.id.toString(), // Explicitly include drainNo for clarity
          stretchId: d.stretchId, // Include stretchId as well
        })),
        selectedVillages: selectedVillageObjects,
        totalFlowRate: 0,
      };

      console.log('handleConfirm: Setting selectedRiverData with complete structure:', riverData);

      // FIXED: Set window data immediately and consistently
      window.selectedRiverData = { ...riverData };

      // FIXED: Trigger a custom event to notify other components
      window.dispatchEvent(new CustomEvent('drainDataUpdated', {
        detail: riverData
      }));

      if (onConfirm) {
        onConfirm({
          drains: selectedDrainObjects,
        });
      }
    } else {
      console.log('handleConfirm: No drains selected');
    }
  };
  // Convert intersected villages to format expected by MultiSelect
  const villageItems: VillageItem[] = intersectedVillages.map(village => ({
    shapeID: village.shapeID,
    name: village.shapeName,
    drainNo: village.drainNo
  }));

  return (
    <div className="p-4 border-2 bg-gray-100 rounded-lg shadow-md">
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm border border-red-300">
          <div className="font-semibold mb-1">Error</div>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        {/* River Dropdown */}
        <div>
          <label htmlFor="river-dropdown" className="block text-sm font-semibold text-gray-700 mb-2">
            River:
          </label>
          <div className="relative">
            <select
              id="river-dropdown"
              className={`w-full p-2 text-sm border ${riverError ? 'border-red-500' : 'border-blue-500'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${loadingRivers ? 'bg-gray-100' : ''}`}
              value={selectedRiver}
              onChange={handleRiverChange}
              disabled={selectionsLocked || loadingRivers}
            >
              <option value="">--Choose a River--</option>
              {rivers.map(river => (
                <option key={river.id} value={river.id}>
                  {river.name}
                </option>
              ))}
            </select>
            {loadingRivers && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <div className="w-4 h-4 border-2 border-t-blue-500 border-r-blue-500 border-b-blue-500 border-l-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          {riverError && <p className="mt-1 text-xs text-red-500">{riverError}</p>}
        </div>

        {/* Stretch Dropdown */}
        <div>
          <label htmlFor="stretch-dropdown" className="block text-sm font-semibold text-gray-700 mb-2">
            Stretch:
          </label>
          <div className="relative">
            <select
              id="stretch-dropdown"
              className={`w-full p-2 text-sm border ${stretchError ? 'border-red-500' : 'border-blue-500'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${loadingStretches ? 'bg-gray-100' : ''}`}
              value={selectedStretch}
              onChange={handleStretchChange}
              disabled={!selectedRiver || selectionsLocked || loadingStretches}
            >
              <option value="">--Choose a Stretch--</option>
              {stretches.map(stretch => (
                <option key={stretch.id} value={stretch.id}>
                  {stretch.id}
                </option>
              ))}
            </select>
            {loadingStretches && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <div className="w-4 h-4 border-2 border-t-blue-500 border-r-blue-500 border-b-blue-500 border-l-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          {stretchError && <p className="mt-1 text-xs text-red-500">{stretchError}</p>}
        </div>

        {/* Drain MultiSelect */}
        <div>
          <MultiSelect
            items={drains}
            selectedItems={selectedDrains}
            onSelectionChange={selectionsLocked ? () => { } : handleDrainsChange}
            label="Drain"
            placeholder="--Choose Drains--"
            disabled={!selectedStretch || selectionsLocked || loadingDrains}
            displayPattern={formatDrainDisplay}
            groupBy={groupDrainsByStretch}
            showGroupHeaders={true}
            groupHeaderFormat="Stretch: {groupName}"
          />
          {drainError && <p className="mt-1 text-xs text-red-500">{drainError}</p>}
        </div>

        {/* Villages MultiSelect - FIXED with key prop */}
        <div>
          <MultiSelect
            key={`villages-${selectedVillages.length}-${intersectedVillages.length}`}
            items={villageItems}
            selectedItems={selectedVillages}
            onSelectionChange={selectionsLocked ? () => { } : handleVillagesChange}
            label="Catchment Villages"
            placeholder="--Select Villages--"
            disabled={!selectedDrains.length || loadingVillages || selectionsLocked}
            displayPattern={formatVillageDisplay}
            groupBy={groupVillagesByDrain}
            showGroupHeaders={true}
            groupHeaderFormat="Villages in {groupName}"
            itemKey="shapeID"
          />
          {villageError && <p className="mt-1 text-xs text-red-500">{villageError}</p>}
        </div>


        {/* {process.env.NODE_ENV === 'development' && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
            <div className="font-semibold">Debug Info:</div>
            <div>isDropdownUpdating: {isDropdownUpdating.toString()}</div>
            <div>villageChangeSource (prop): {villageChangeSource || 'null'}</div>
            <div>window.villageChangeSource: {window.villageChangeSource || 'null'}</div>
            <div>pendingVillages: {pendingVillages ? pendingVillages.length : 'null'}</div>
            <div>selectedVillages: {selectedVillages.length}</div>
            <div>intersectedVillages: {intersectedVillages.length}</div>
            <div>intersectedVillages selected: {intersectedVillages.filter(v => v.selected !== false).length}</div>
            <button
              className="mt-1 px-2 py-1 bg-blue-500 text-white text-xs rounded"
              onClick={() => {
                console.log('=== MANUAL DEBUG ===');
                console.log('intersectedVillages:', intersectedVillages);
                console.log('selectedVillages:', selectedVillages);
                console.log('villageChangeSource:', villageChangeSource);
                console.log('window.villageChangeSource:', window.villageChangeSource);
                console.log('isDropdownUpdating:', isDropdownUpdating);
                console.log('pendingVillages:', pendingVillages);
              }}
            >
              Log Debug Info
            </button>
          </div>
        )} */}
      </div>

      {/* Selected Data Summary */}
      <div className="mt-6 p-4 px-5 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-md font-medium text-gray-800 mb-2">Selected River Data</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            <span className="font-medium">River:</span>{' '}
            {rivers.find(r => r.id.toString() === selectedRiver)?.name || 'None'}
          </p>
          <p>
            <span className="font-medium">Stretch:</span>{' '}
            {stretches.find(s => s.id.toString() === selectedStretch)?.id || 'None'}
          </p>
          <p>
            <span className="font-medium">Drains:</span>{' '}
            <TruncatedList content={formatSelectedDrains(drains, selectedDrains)} maxLength={80} />
          </p>
          <p>
            <span className="font-medium">Catchment Villages:</span>{' '}
            {loadingVillages ? (
              <span className="italic text-gray-500">Loading villages...</span>
            ) : (
              <TruncatedList content={formatIntersectedVillages()} maxLength={80} />
            )}
          </p>

          {villageError && <p className="text-xs text-red-500 mt-1">{villageError}</p>}

          {intersectedVillages.length > 0 && !loadingVillages && (
            <div className="mt-2 text-xs text-blue-600">
              <p>Click on village polygons in the map to toggle selection</p>
              <p className="mt-1">Selected: {selectedVillages.length} of {intersectedVillages.length} villages</p>
            </div>
          )}

          {selectionsLocked && (
            <p className="mt-2 text-green-600 font-medium">Selections confirmed and locked</p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4 mt-4">
        <button
          className={`${selectedDrains.length > 0 &&
            intersectedVillages.length > 0 &&
            !loadingVillages &&
            !selectionsLocked
            ? 'bg-blue-500 hover:bg-blue-700'
            : 'bg-gray-400 cursor-not-allowed'
            } text-white py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200`}
          onClick={handleConfirm}
          disabled={selectedDrains.length === 0 || intersectedVillages.length === 0 || loadingVillages || selectionsLocked}
        >
          Confirm
        </button>
        <button
          className="bg-red-500 hover:bg-red-700 text-white py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition duration-200"
          onClick={handleReset}
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default DrainLocationsSelector;
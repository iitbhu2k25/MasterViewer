'use client'
import React, { useState, useEffect } from 'react';
import { MultiSelect } from './Multiselect'; // Import the enhanced component

// Define the global interface for window to add our reset functions
declare global {
  interface Window {
    resetDistrictSelectionsInLocationSelector?: () => void;
    resetSubDistrictSelectionsInLocationSelector?: () => void;
    selectedLocations?: any;
  }
}

interface TruncatedListProps {
  content: string;
  maxLength?: number;
}
const TruncatedList: React.FC<TruncatedListProps> = ({ content, maxLength = 100 }) => {
  const [expanded, setExpanded] = useState<boolean>(false);

  if (!content || content === 'None') return <span>None</span>;

  // If content fits, just display it
  if (content.length <= maxLength) return <span>{content}</span>;

  // Otherwise truncate and add "Show more" button
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

// TypeScript interfaces
interface LocationItem {
  id: number;
  name: string;
}

interface District extends LocationItem {
  stateId: number;
}

interface SubDistrict extends LocationItem {
  districtId: number;
  districtName: string;// Added for sorting/grouping
}

interface Village extends LocationItem {
  subDistrictId: number;
  subDistrictName: string; // Added for sorting/grouping
  districtName: string; // Added for sorting/grouping
  population: number;
}

interface LocationSelectorProps {
  onConfirm?: (selectedData: {
    villages: Village[];
    subDistricts: SubDistrict[];
    totalPopulation: number;
  }) => void;
  onReset?: () => void;
  onStateChange?: (stateCode: string) => void;
  onDistrictsChange?: (districts: string[]) => void;
  onSubDistrictsChange?: (subDistricts: string[]) => void;
  onVillagesChange?: (villages: string[]) => void; // Add this line
}
const LocationSelector: React.FC<LocationSelectorProps> = ({ onConfirm, onReset, onStateChange, onDistrictsChange, onSubDistrictsChange, onVillagesChange }) => {

  // States for dropdown data
  const [states, setStates] = useState<LocationItem[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [subDistricts, setSubDistricts] = useState<SubDistrict[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [totalPopulation, setTotalPopulation] = useState<number>(0);

  // Selected values
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [selectedSubDistricts, setSelectedSubDistricts] = useState<string[]>([]);
  const [selectedVillages, setSelectedVillages] = useState<string[]>([]);

  // New state to track if selections are locked after confirmation
  const [selectionsLocked, setSelectionsLocked] = useState<boolean>(false);

  // Register the reset functions in the global window object
  useEffect(() => {
    // Function to reset district selections
    window.resetDistrictSelectionsInLocationSelector = () => {
      if (!selectionsLocked) {
        console.log('Location selector resetting district selections');
        setSelectedDistricts([]);
        setSelectedSubDistricts([]);
        setSelectedVillages([]);
        setTotalPopulation(0);
      }
    };

    // Function to reset subdistrict selections
    window.resetSubDistrictSelectionsInLocationSelector = () => {
      if (!selectionsLocked) {
        console.log('Location selector resetting subdistrict selections');
        setSelectedSubDistricts([]);
        setSelectedVillages([]);
        setTotalPopulation(0);
      }
    };

    // Cleanup function to remove the handlers when component unmounts
    return () => {
      window.resetDistrictSelectionsInLocationSelector = undefined;
      window.resetSubDistrictSelectionsInLocationSelector = undefined;
    };
  }, [selectionsLocked]);

  // Fetch states on component mount
  useEffect(() => {
    const fetchStates = async (): Promise<void> => {
      try {
        const response = await fetch('http://localhost:9000/api/basic/');
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('API response data:', data);
        const stateData: LocationItem[] = data.map((state: any) => ({
          id: state.state_code,
          name: state.state_name
        }));

        setStates(stateData);
      } catch (error) {
        console.error('Error fetching states:', error);
      }
    };
    fetchStates();
  }, []);

  // Fetch districts when state changes
  useEffect(() => {
    if (selectedState) {
      const fetchDistricts = async (): Promise<void> => {
        console.log('Fetching districts for state:', selectedState);
        try {
          const response = await fetch('http://localhost:9000/api/basic/district/',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ state_code: selectedState }),
            }
          );
          const data = await response.json();
          console.log('API response data:', data);
          const districtData: LocationItem[] = data.map((district: any) => ({
            id: district.district_code,
            name: district.district_name
          }));
          const mappedDistricts: District[] = districtData.map(district => ({
            ...district,
            stateId: parseInt(selectedState)
          }));

          // Sort districts alphabetically
          const sortedDistricts = [...mappedDistricts].sort((a, b) =>
            a.name.localeCompare(b.name)
          );

          setDistricts(sortedDistricts);
          setSelectedDistricts([]);
        } catch (error) {
          console.error('Error fetching districts:', error);
        }
      };
      fetchDistricts();
    } else {
      setDistricts([]);
      setSelectedDistricts([]);
    }
    // Reset dependent dropdowns
    setSubDistricts([]);
    setSelectedSubDistricts([]);
    setVillages([]);
    setSelectedVillages([]);
    // Reset total population when state changes
    setTotalPopulation(0);
  }, [selectedState]);

  // Fetch sub-districts when districts change
  // Fetch sub-districts when districts change
  useEffect(() => {
    if (selectedDistricts.length > 0) {
      const fetchSubDistricts = async (): Promise<void> => {
        try {
          const response = await fetch('http://localhost:9000/api/basic/subdistrict/',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ district_code: selectedDistricts }),
            }
          );
          const data = await response.json();
          console.log('API response data:', data);

          // Create a map of district IDs to names for reference
          const districtMap = new Map(
            districts.map(district => [district.id.toString(), district.name])
          );

          const subDistrictData: SubDistrict[] = data.map((subDistrict: any) => {
            const districtId = subDistrict.district_code.toString();
            return {
              id: subDistrict.subdistrict_code,
              name: subDistrict.subdistrict_name,
              districtId: parseInt(districtId),
              districtName: districtMap.get(districtId) || 'Unknown District'
            };
          });

          // Sort sub-districts first by district name, then by sub-district name
          const sortedSubDistricts = [...subDistrictData].sort((a, b) => {
            const districtComparison = a.districtName.localeCompare(b.districtName);
            if (districtComparison !== 0) {
              return districtComparison;
            }
            return a.name.localeCompare(b.name);
          });

          setSubDistricts(sortedSubDistricts);
          setSelectedSubDistricts([]);
        } catch (error) {
          console.error('Error fetching sub-districts:', error);
        }
      };
      fetchSubDistricts();
    } else {
      setSubDistricts([]);
      setSelectedSubDistricts([]);
    }
    // Reset dependent dropdowns
    setVillages([]);
    setSelectedVillages([]);
    // Reset total population when districts change
    setTotalPopulation(0);
  }, [selectedDistricts, districts]);

  // Fetch villages when sub-districts change
  // Fetch villages when sub-districts change
  useEffect(() => {
    if (selectedSubDistricts.length > 0) {
      const fetchVillages = async (): Promise<void> => {
        try {
          const response = await fetch('http://localhost:9000/api/basic/village/',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ subdistrict_code: selectedSubDistricts }),
            }
          );
          const data = await response.json();
          console.log('API response data:', data);

          // Create maps for reference
          const subDistrictMap = new Map(
            subDistricts.map(sd => [sd.id.toString(), {
              name: sd.name,
              districtName: sd.districtName
            }])
          );

          const villageData: Village[] = data.map((village: any) => {
            const subDistrictId = village.subdistrict_code.toString();
            const subDistrictInfo = subDistrictMap.get(subDistrictId);

            return {
              id: village.village_code,
              name: village.village_name,
              subDistrictId: parseInt(subDistrictId),
              subDistrictName: subDistrictInfo?.name || 'Unknown SubDistrict',
              districtName: subDistrictInfo?.districtName || 'Unknown District',
              population: village.population_2011 || 0
            };
          });

          // Sort villages first by district, then by sub-district, then by village name
          const sortedVillages = [...villageData].sort((a, b) => {
            const districtComparison = a.districtName.localeCompare(b.districtName);
            if (districtComparison !== 0) {
              return districtComparison;
            }

            const subDistrictComparison = a.subDistrictName.localeCompare(b.subDistrictName);
            if (subDistrictComparison !== 0) {
              return subDistrictComparison;
            }

            return a.name.localeCompare(b.name);
          });

          setVillages(sortedVillages);
          setSelectedVillages([]);
        } catch (error) {
          console.error('Error fetching villages:', error);
          setVillages([]);
        }
      };
      fetchVillages();
    } else {
      setVillages([]);
      setSelectedVillages([]);
    }
    // Reset total population when sub-districts change
    setTotalPopulation(0);
  }, [selectedSubDistricts, subDistricts]);

  // Calculate total population when selected villages change
  useEffect(() => {
    if (selectedVillages.length > 0) {
      // Filter to get only selected villages
      const selectedVillageObjects = villages.filter(village =>
        selectedVillages.includes(village.id.toString())
      );

      // Calculate total population
      const total = selectedVillageObjects.reduce(
        (sum, village) => sum + village.population,
        0
      );

      setTotalPopulation(total);
    } else {
      setTotalPopulation(0);
    }
  }, [selectedVillages, villages]);

  // Handle state selection
  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    if (!selectionsLocked) {
      const stateCode = e.target.value;
      setSelectedState(stateCode);

      // Notify parent component about the state change
      if (onStateChange) {
        onStateChange(stateCode);
      }
    }
  };


  // Handle villages selection change
  const handleVillagesChangeInternal = (newSelectedVillages: string[]) => {
    setSelectedVillages(newSelectedVillages);

    // Call the callback to notify parent component
    if (onVillagesChange) {
      onVillagesChange(newSelectedVillages);
    }
  };

  // In the handleDistrictsChange function (you'll need to create this)
  const handleDistrictsChange = (newSelectedDistricts: string[]) => {
    setSelectedDistricts(newSelectedDistricts);

    // Call the callback to notify parent component
    if (onDistrictsChange) {
      onDistrictsChange(newSelectedDistricts);
    }
  };

  const handleSubDistrictsChange = (newSelectedSubDistricts: string[]) => {
    setSelectedSubDistricts(newSelectedSubDistricts);

    // Call the callback to notify parent component
    if (onSubDistrictsChange) {
      onSubDistrictsChange(newSelectedSubDistricts);
    }
  };

  // Handle form reset
  const handleReset = (): void => {
    setSelectedState('');
    setSelectedDistricts([]);
    setSelectedSubDistricts([]);
    setSelectedVillages([]);
    setTotalPopulation(0);
    setSelectionsLocked(false);

    // Call the onReset prop to notify parent component
    if (onReset) {
      onReset();
    }

    // Add a slight delay before refreshing the page
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  // Selected items display - optimized to show "All" for complete selections
  const formatSelectedItems = (items: (SubDistrict | Village)[], selectedIds: string[]): string => {
    if (selectedIds.length === 0) {
      return 'None';
    }

    if (selectedIds.length === items.length) {
      return `All ${items.length > 0 && 'districtName' in items[0] ? 'Sub-Districts' : 'Villages'}`;
    }

    const selectedItems = items.filter(item => selectedIds.includes(item.id.toString()));
    if (selectedItems.length === 0) {
      return 'None';
    }

    if ('districtName' in selectedItems[0] && 'districtId' in selectedItems[0]) {
      // Handle Sub-Districts (group by district)
      const groupedByDistrict: { [key: string]: SubDistrict[] } = {};
      selectedItems.forEach(item => {
        const districtName = (item as SubDistrict).districtName || 'Unknown';
        if (!groupedByDistrict[districtName]) {
          groupedByDistrict[districtName] = [];
        }
        groupedByDistrict[districtName].push(item as SubDistrict);
      });

      const districtSubDistrictCount = subDistricts.reduce((acc: { [key: string]: number }, sd) => {
        const districtName = sd.districtName || 'Unknown';
        acc[districtName] = (acc[districtName] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(groupedByDistrict)
        .map(([district, subDistricts]) => {
          if (subDistricts.length === (districtSubDistrictCount[district] || 0)) {
            return `All Sub-Districts of ${district}`;
          }
          return `${district}: ${subDistricts.map(sd => sd.name).join(', ')}`;
        })
        .join('; ');
    } else {
      // Handle Villages (group by sub-district ID)

      // First, create a map to count villages per sub-district ID
      const subDistrictVillageCounts: { [subDistrictId: string]: number } = {};
      villages.forEach(village => {
        const subDistrictId = village.subDistrictId.toString();
        subDistrictVillageCounts[subDistrictId] = (subDistrictVillageCounts[subDistrictId] || 0) + 1;
      });

      // Now count selected villages per sub-district ID
      const selectedVillagesPerSubDistrict: { [subDistrictId: string]: Village[] } = {};
      selectedItems.forEach(village => {
        const v = village as Village;
        const subDistrictId = v.subDistrictId.toString();
        if (!selectedVillagesPerSubDistrict[subDistrictId]) {
          selectedVillagesPerSubDistrict[subDistrictId] = [];
        }
        selectedVillagesPerSubDistrict[subDistrictId].push(v);
      });

      // Map from sub-district ID to sub-district name
      const subDistrictIdToName: { [subDistrictId: string]: string } = {};
      villages.forEach(village => {
        subDistrictIdToName[village.subDistrictId.toString()] = village.subDistrictName || 'Unknown';
      });

      // Build the display string
      return Object.entries(selectedVillagesPerSubDistrict)
        .map(([subDistrictId, selectedVillagesInSubDistrict]) => {
          const subDistrictName = subDistrictIdToName[subDistrictId];
          const totalVillagesInSubDistrict = subDistrictVillageCounts[subDistrictId] || 0;

          // If all villages in this subdistrict are selected
          if (selectedVillagesInSubDistrict.length === totalVillagesInSubDistrict) {
            return `All Villages of ${subDistrictName}`;
          }

          // Otherwise list the villages
          return `${subDistrictName}: ${selectedVillagesInSubDistrict.map(v => v.name).join(', ')}`;
        })
        .join('; ');
    }
  };

  // Handle confirm - lock the selections and pass data to parent
  const handleConfirm = (): void => {
    if (selectedVillages.length > 0) {
      setSelectionsLocked(true);

      // Get the full objects for selected villages and subdistricts
      const selectedVillageObjects = villages.filter(village =>
        selectedVillages.includes(village.id.toString())
      );

      const selectedSubDistrictObjects = subDistricts.filter(subDistrict =>
        selectedSubDistricts.includes(subDistrict.id.toString())
      );

      const selectedDistrictObjects = districts.filter(district =>
        selectedDistricts.includes(district.id.toString())
      );

      // Get the selected state object
      const selectedStateObject = states.find(state =>
        state.id.toString() === selectedState
      );

      // Create location data object to store in window
      const locationData = {
        state: selectedStateObject?.name || '',
        districts: selectedDistrictObjects.map(d => d.name),
        subDistricts: selectedSubDistrictObjects.map(sd => sd.name),
        villages: selectedVillageObjects.map(v => v.name),
        allVillages: selectedVillageObjects.map(v => ({
          name: v.name,
          population: v.population,
          subDistrict: v.subDistrictName,
          district: v.districtName
        })),
        totalPopulation: totalPopulation
      };

      // Store in window object for access by PDF generator
      window.selectedLocations = locationData;
      console.log('Location data stored in window object:', locationData);

      // Pass the data to parent component if callback exists
      if (onConfirm) {
        onConfirm({
          villages: selectedVillageObjects,
          subDistricts: selectedSubDistrictObjects,
          totalPopulation: totalPopulation
        });
      }
    }
  };

  // Village dropdown display - just show name and population (no district prefix)
  const formatVillageDisplay = (village: Village): string => {
    return `${village.name} (Pop: ${village.population.toLocaleString()})`;
  };

  // Sub-district dropdown display - just show name (no district prefix)
  const formatSubDistrictDisplay = (subDistrict: SubDistrict): string => {
    return subDistrict.name;
  };

  // Group sub-districts by district for display in the MultiSelect component
  const groupSubDistrictsByDistrict = (subDistricts: SubDistrict[]): { [key: string]: SubDistrict[] } => {
    return subDistricts.reduce((groups: { [key: string]: SubDistrict[] }, item) => {
      const districtName = item.districtName || 'Unknown';
      if (!groups[districtName]) {
        groups[districtName] = [];
      }
      groups[districtName].push(item);
      return groups;
    }, {});
  };

  // Enhanced grouping for villages that includes sub-district information
  const groupVillagesByDistrictAndSubDistrict = (villages: Village[]): { [key: string]: { [key: string]: Village[] } } => {
    // First group by district
    const byDistrict: { [key: string]: Village[] } = villages.reduce((groups: { [key: string]: Village[] }, item) => {
      const districtName = item.districtName || 'Unknown';
      if (!groups[districtName]) {
        groups[districtName] = [];
      }
      groups[districtName].push(item);
      return groups;
    }, {});

    // Then further group by sub-district within each district
    const result: { [key: string]: { [key: string]: Village[] } } = {};

    Object.entries(byDistrict).forEach(([districtName, districtVillages]) => {
      result[districtName] = {};

      // Group villages by sub-district within this district
      districtVillages.forEach(village => {
        const subDistrictName = village.subDistrictName || 'Unknown';
        if (!result[districtName][subDistrictName]) {
          result[districtName][subDistrictName] = [];
        }
        result[districtName][subDistrictName].push(village);
      });
    });

    return result;
  };

  return (
    <div className="p-4 border-2  bg-gray-100 rounded-lg shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        {/* State Dropdown */}
        <div>
          <label htmlFor="state-dropdown" className="block text-sm font-semibold text-gray-700 mb-2">
            State:
          </label>
          <select
            id="state-dropdown"
            className="w-full p-2 text-sm border border-blue-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={selectedState}
            onChange={handleStateChange}
            disabled={selectionsLocked}
          >
            <option value="">--Choose a State--</option>
            {states.map(state => (
              <option key={state.id} value={state.id}>
                {state.name}
              </option>
            ))}
          </select>
        </div>

        {/* District Multiselect */}
        <MultiSelect
          items={districts}
          selectedItems={selectedDistricts}
          onSelectionChange={selectionsLocked ? () => { } : (newValue) => {
            setSelectedDistricts(newValue);
            handleDistrictsChange(newValue);
          }}
          label="District"
          placeholder="--Choose Districts--"
          disabled={!selectedState || selectionsLocked}
        />

        {/* Sub-District Multiselect with district grouping */}
        <MultiSelect
          items={subDistricts}
          selectedItems={selectedSubDistricts}
          onSelectionChange={selectionsLocked ? () => { } : (newValue) => {
            setSelectedSubDistricts(newValue);
            handleSubDistrictsChange(newValue);
          }}
          label="Sub-District"
          placeholder="--Choose Sub-Districts--"
          disabled={selectedDistricts.length === 0 || selectionsLocked}
          displayPattern={formatSubDistrictDisplay}
          groupBy={groupSubDistrictsByDistrict}
          showGroupHeaders={true}
          groupHeaderFormat="District: {groupName}"
        />

        {/* Village Multiselect with district and sub-district grouping */}
        {/* Village Multiselect with district and sub-district grouping */}
        {/* Village Multiselect with district and sub-district grouping */}
        <MultiSelect
          items={villages}
          selectedItems={selectedVillages}
          onSelectionChange={selectionsLocked ? () => { } : handleVillagesChangeInternal} // Updated function name here
          label="Village/Town (Population 2011)"
          placeholder="--Choose Villages--"
          disabled={selectedSubDistricts.length === 0 || selectionsLocked}
          displayPattern={formatVillageDisplay}
          useNestedGroups={true}
          nestedGroupBy={groupVillagesByDistrictAndSubDistrict}
          districtHeaderFormat="District: {districtName}"
          subDistrictHeaderFormat="Sub-District: {subDistrictName}"
        />
      </div>



      {/* Display selected values for demonstration */}
      <div className="mt-6 p-10 px-5 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-md font-medium text-gray-800 mb-2">Selected Locations</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            <span className="font-medium">State:</span> {states.find(s => s.id.toString() === selectedState)?.name || 'None'}
          </p>
          <p>
            <span className="font-medium">Districts:</span> {
              selectedDistricts.length > 0
                ? (selectedDistricts.length === districts.length
                  ? 'All Districts'
                  : <TruncatedList
                    content={districts.filter(d => selectedDistricts.includes(d.id.toString())).map(d => d.name).join(', ')}
                    maxLength={60}
                  />)
                : 'None'
            }
          </p>
          <p>
            <span className="font-medium">Sub-Districts:</span> {
              <TruncatedList
                content={formatSelectedItems(subDistricts, selectedSubDistricts)}
                maxLength={80}
              />
            }
          </p>
          <div className="text-base leading-relaxed">
            <span className="font-medium">Villages:</span>
            <div className="max-h-32 overflow-y-auto border border-gray-200 rounded p-2 mt-2">
              <TruncatedList
                content={formatSelectedItems(villages, selectedVillages)}
                maxLength={80}
              />
            </div>
          </div>
          <p>
            <span className="font-medium">Total Population:</span> {totalPopulation.toLocaleString()}
          </p>
          {selectionsLocked && (
            <p className="mt-2 text-green-600 font-medium">Selections confirmed and locked</p>
          )}
        </div>
      </div>
      <div className="flex space-x-4 mt-4">
        <button
          className={`${selectedVillages.length > 0 && !selectionsLocked
            ? 'bg-blue-500 hover:bg-blue-700'
            : 'bg-gray-400 cursor-not-allowed'
            } text-white py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
          onClick={handleConfirm}
          disabled={selectedVillages.length === 0 || selectionsLocked}
        >
          Confirm
        </button>
        <button
          className="bg-red-500 hover:bg-red-700 text-white py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
          onClick={handleReset}
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default LocationSelector;
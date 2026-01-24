'use client';
import React, { useState, useMemo, useEffect, JSX } from 'react';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import isEqual from 'lodash/isEqual';
import html2canvas from 'html2canvas';
import domToImage from 'dom-to-image';

type DomesticLoadMethod = 'manual' | 'modeled' | '';
type PeakFlowSewageSource = 'population_based' | 'drain_based' | 'water_based' | '';

export interface PollutionItem {
  name: string;
  perCapita: number;
  designCharacteristic?: number;
}

export interface DrainItem {
  id: string;
  name: string;
  discharge: number | '';
}


interface SelectedRiverData {
  drains: {
    id: string; // Change from number to string
    name: string;
    stretchId: number;

  }[];

  allDrains?: {
    id: string; // This should be Drain_No as string
    name: string;
    stretch: string;
    drainNo?: string;
  }[];

  river?: string;
  stretch?: string;
  selectedVillages?: any[];
}

interface Village {
  id: number;
  name: string;
  subDistrictId: number;
  population: number;
}



// Add props interface for SewageCalculationForm
interface SewageCalculationFormProps {
  villages_props?: any[];
  totalPopulation_props?: number;
  sourceMode?: 'admin' | 'drain';
  selectedRiverData?: SelectedRiverData | null; // Add this
}

interface SubDistrict {
  id: number;
  name: string;
  districtId: number;
}



interface PopulationProps {
  villages_props: Village[];
  subDistricts_props: SubDistrict[];
  totalPopulation_props: number;

  state_props?: { id: string; name: string };
  district_props?: { id: string; name: string };
  sourceMode?: 'admin' | 'drain';
}

const defaultPollutionItems: PollutionItem[] = [
  { name: "BOD", perCapita: 27.0 },
  { name: "COD", perCapita: 45.9 },
  { name: "TSS", perCapita: 40.5 },
  { name: "VSS", perCapita: 28.4 },
  { name: "Total Nitrogen", perCapita: 5.4 },
  { name: "Organic Nitrogen", perCapita: 1.4 },
  { name: "Ammonia Nitrogen", perCapita: 3.5 },
  { name: "Nitrate Nitrogen", perCapita: 0.5 },
  { name: "Total Phosphorus", perCapita: 0.8 },
  { name: "Ortho Phosphorous", perCapita: 0.5 },
];


// ----------------------------------








const SewageCalculationForm: React.FC<SewageCalculationFormProps> = ({
  villages_props = [],
  totalPopulation_props = 0,
  sourceMode, // FIXED: Remove default value since it's now required
  selectedRiverData = null
}) => {
  // --- States for Water Supply Method ---
  const [totalSupplyInput, setTotalSupplyInput] = useState<number | ''>('');///---
  const [waterSupplyResult, setWaterSupplyResult] = useState<any>(null);

  // --- States for Domestic Sewage Method ---
  const [domesticLoadMethod, setDomesticLoadMethod] = useState<DomesticLoadMethod>('');
  const [domesticSupplyInput, setDomesticSupplyInput] = useState<number | ''>('');
  const [unmeteredSupplyInput, setUnmeteredSupplyInput] = useState<number | ''>(0);
  const [domesticSewageResult, setDomesticSewageResult] = useState<any>(null);

  // --- Common States ---
  const [error, setError] = useState<string | null>(null);
  const [showPeakFlow, setShowPeakFlow] = useState(false);
  const [showRawSewage, setShowRawSewage] = useState(false);
  const [peakFlowSewageSource, setPeakFlowSewageSource] = useState<PeakFlowSewageSource>('population_based');
  const [drainCount, setDrainCount] = useState<number | ''>(1);
  const [drainItems, setDrainItems] = useState<DrainItem[]>([]);
  const [totalDrainDischarge, setTotalDrainDischarge] = useState<number>(0);
  const [previousTotalWaterSupply, setpreviousTotalWaterSupply] = useState<number>(0);

  const [checkboxes, setCheckboxes] = useState({
    populationForecasting: false,
    waterDemand: false,
    waterSupply: false,
    sewageCalculation: false,
    rawSewageCharacteristics: false,
  });

  const computedPopulation = typeof window !== 'undefined' ? (window as any).selectedPopulationForecast || {} : {};
  const [pollutionItemsState, setPollutionItemsState] = useState<PollutionItem[]>(defaultPollutionItems);
  const [rawSewageTable, setRawSewageTable] = useState<JSX.Element | null>(null);
  const [peakFlowTable, setPeakFlowTable] = useState<JSX.Element | null>(null);
  const [peakFlowMethods, setPeakFlowMethods] = useState({
    cpheeo: false,
    harmon: false,
    babbitt: false,
  });

  const areAllCheckboxesChecked = Object.values(checkboxes).every(checked => checked);




  // --- Initialize and Update Total Water Supply ---
useEffect(() => {
  // Check if we're in the browser
  if (typeof window !== 'undefined' && (window as any).totalWaterSupply !== undefined) {
    if (totalSupplyInput === '' || totalSupplyInput === (window as any).previousTotalWaterSupply) {
      const newSupply = Number((window as any).totalWaterSupply);
      setTotalSupplyInput(newSupply);
      (window as any).previousTotalWaterSupply = newSupply;
    }
  }
}); // ✅ Remove dependency array for now

  // --- NEW: Initialize drain items from selected drains in drain mode ---
  useEffect(() => {
    console.log('SewageCalculationForm useEffect triggered:', {
      sourceMode,
      selectedRiverData: selectedRiverData ? 'present' : 'null',
      windowSelectedRiverData: window.selectedRiverData ? 'present' : 'null',
      windowAllDrains: window.selectedRiverData?.allDrains?.length || 0
    });

    // FIXED: Only proceed if sourceMode is actually 'drain'
    if (sourceMode === 'drain') {
      console.log('Processing drain mode initialization...');

      // FIXED: Since window.selectedRiverData has the data, use it primarily
      let drainData = null;

      // Priority 1: window.selectedRiverData.allDrains (this has your data)
      if (window.selectedRiverData?.allDrains && window.selectedRiverData.allDrains.length > 0) {
        drainData = window.selectedRiverData.allDrains;
        console.log('Using window.selectedRiverData.allDrains:', drainData);
      }
      // Priority 2: selectedRiverData prop
      else if (selectedRiverData?.allDrains && selectedRiverData.allDrains.length > 0) {
        drainData = selectedRiverData.allDrains;
        console.log('Using selectedRiverData prop:', drainData);
      }
      // Priority 3: window.selectedRiverData.drains as fallback
      else if (window.selectedRiverData?.drains && window.selectedRiverData.drains.length > 0) {
        drainData = window.selectedRiverData.drains.map((d: { id: { toString: () => any; }; name: any; }) => ({
          id: d.id.toString(),
          name: d.name,
          stretch: 'Unknown Stretch',
          drainNo: d.id.toString()
        }));
        console.log('Using window.selectedRiverData.drains as fallback:', drainData);
      }

      if (drainData && drainData.length > 0) {
        console.log('Creating drain items from data:', drainData);

        const newDrainItems: DrainItem[] = drainData.map((drain: any) => ({
          id: drain.id.toString(), // This should be "33" from your debug
          name: drain.name || `Drain ${drain.id}`, // This should be "Drain 33"
          discharge: '', // Start with empty discharge
        }));

        console.log('New drain items created:', newDrainItems);

        // Always update in drain mode to ensure correct data
        setDrainCount(drainData.length);
        setDrainItems(newDrainItems);

        console.log('Updated drainCount and drainItems');
      } else {
        console.log('No drain data found for initialization');
      }
    } else {
      console.log('Not in drain mode, sourceMode is:', sourceMode);
    }
  }, [sourceMode, selectedRiverData]);

  // --- Update Drain Items (only when not in drain mode or when manually changed) ---
  useEffect(() => {
    // Only auto-generate drain items if not in drain mode
    if (sourceMode !== 'drain') {
      if (typeof drainCount === 'number' && drainCount > 0) {
        const newDrainItems: DrainItem[] = Array.from({ length: drainCount }, (_, index) => ({
          id: `D${index + 1}`,
          name: `Drain ${index + 1}`,
          discharge: '',
        }));
        setDrainItems(newDrainItems);
      } else {
        setDrainItems([]);
      }
    }
    // ✅ Remove the drain mode handling from this useEffect to prevent interference
  }, [drainCount, sourceMode]);

  // Also add this additional useEffect to sync with window.selectedRiverData changes:

  // useEffect(() => {
  //   const handleDrainDataUpdate = (event: CustomEvent) => {
  //     console.log('Received drain data update event:', event.detail);
  //     if (sourceMode === 'drain' && event.detail?.allDrains) {
  //       // Force update drain items
  //       const newDrainItems = event.detail.allDrains.map((drain: any) => ({
  //         id: drain.id.toString(),
  //         name: drain.name,
  //         discharge: '',
  //       }));
  //       setDrainCount(newDrainItems.length);
  //       setDrainItems(newDrainItems);
  //     }
  //   };

  //   window.addEventListener('drainDataUpdated', handleDrainDataUpdate);
  //   return () => window.removeEventListener('drainDataUpdated', handleDrainDataUpdate);
  // }, [sourceMode]);


  useEffect(() => {
    if (sourceMode === 'drain') {
      const handleWindowDataChange = () => {
        if (window.selectedRiverData?.allDrains && window.selectedRiverData.allDrains.length > 0) {
          const windowDrains = window.selectedRiverData.allDrains;

          const currentIds = drainItems.map(d => d.id).sort();
          const windowIds = windowDrains.map((d: any) => d.id.toString()).sort();

          if (!isEqual(currentIds, windowIds)) {
            console.log('Updating drain structure while preserving discharge values');

            const newDrainItems: DrainItem[] = windowDrains.map((drain: any) => {
              const existingItem = drainItems.find(existing => existing.id === drain.id.toString());
              return {
                id: drain.id.toString(),
                name: drain.name || `Drain ${drain.id}`,
                discharge: existingItem?.discharge || '',
              };
            });

            setDrainCount(windowDrains.length);
            setDrainItems(newDrainItems);
          }
        }
      };


      handleWindowDataChange();


    }
  }, [sourceMode]);

  // --- Calculate Total Drain Discharge ---
  useEffect(() => {
    const total = drainItems.reduce((sum, item) => {
      return sum + (typeof item.discharge === 'number' ? item.discharge : 0);
    }, 0);
    setTotalDrainDischarge(total);
  }, [drainItems]);

  // --- Handlers ---
  const handleDomesticLoadMethodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDomesticLoadMethod(e.target.value as DomesticLoadMethod);
    setDomesticSewageResult(null);
    setShowPeakFlow(false);
    setShowRawSewage(false);
  };

  const handleDrainCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? '' : Number(e.target.value);
    setDrainCount(value);
  };

  const handleDrainItemChange = (index: number, field: keyof DrainItem, value: string | number) => {
    console.log(`🔧 Drain item change - Index: ${index}, Field: ${field}, Value: ${value}, Type: ${typeof value}`);

    const newDrainItems = [...drainItems];

    if (field === 'discharge') {
      // Handle discharge field specifically
      if (value === '' || value === null || value === 'helvetica') {
        newDrainItems[index].discharge = '';
        console.log(`✅ Set discharge to empty for drain ${index}`);
      } else {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (!isNaN(numValue)) {
          newDrainItems[index].discharge = numValue;
          console.log(`✅ Set discharge to ${numValue} for drain ${index}`);
        } else {
          console.warn(`⚠️ Invalid discharge value: ${value}`);
          newDrainItems[index].discharge = '';
        }
      }
    } else {
      // Handle other fields (id, name)
      newDrainItems[index][field] = value as string;
      console.log(`✅ Set ${field} to ${value} for drain ${index}`);
    }

    console.log('Updated drain items:', newDrainItems);
    setDrainItems(newDrainItems);
  };

  // Rest of your existing handlers and functions remain the same...
  const handleCalculateSewage = async () => {
    setError(null);
    setWaterSupplyResult(null);
    setDomesticSewageResult(null);
    setShowPeakFlow(true);
    setShowRawSewage(false);

    let hasError = false;
    const payloads: any[] = [];

    // --- Water Supply Payload ---
    if (totalSupplyInput === '' || Number(totalSupplyInput) <= 0) {
      setError(prev => prev ? `${prev} Invalid total water supply. ` : 'Invalid total water supply. ');
      hasError = true;
    } else {
      payloads.push({
        method: 'water_supply',
        total_supply: Number(totalSupplyInput),
        drain_items: drainItems.map(item => ({
          id: item.id,
          name: item.name,
          discharge: typeof item.discharge === 'number' ? item.discharge : 0
        })),
        total_drain_discharge: totalDrainDischarge
      });
    }

    // --- Domestic Sewage Payload ---
    if (!domesticLoadMethod) {
      setError(prev => prev ? `${prev} Please select a domestic sewage sector method. ` : 'Please select a domestic sewage sector method. ');
      hasError = true;
    } else {
      const payload: any = {
        method: 'domestic_sewage',
        load_method: domesticLoadMethod,
        drain_items: drainItems.map(item => ({
          id: item.id,
          name: item.name,
          discharge: typeof item.discharge === 'number' ? item.discharge : 0
        })),
        total_drain_discharge: totalDrainDischarge
      };
      if (domesticLoadMethod === 'manual') {
        if (domesticSupplyInput === '' || Number(domesticSupplyInput) <= 0) {
          setError(prev => prev ? `${prev} Invalid domestic supply. ` : 'Invalid domestic supply. ');
          hasError = true;
        } else {
          payload.domestic_supply = Number(domesticSupplyInput);
          payloads.push(payload);
        }
      } else if (domesticLoadMethod === 'modeled') {
        payload.unmetered_supply = Number(unmeteredSupplyInput);
        payload.computed_population = computedPopulation;
        payloads.push(payload);
      }
    }

    if (hasError) return;

    try {
      const responses = await Promise.all(payloads.map(payload =>
        fetch('http://localhost:9000/api/basic/sewage_calculation/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      ));

      for (let i = 0; i < responses.length; i++) {
        const response = responses[i];
        if (!response.ok) {
          const err = await response.json();
          setError(prev => prev ? `${prev} ${err.error || 'Error calculating sewage.'} ` : err.error || 'Error calculating sewage.');
          continue;
        }
        const data = await response.json();
        if (payloads[i].method === 'water_supply') {
          setWaterSupplyResult(data.sewage_demand);
        } else if (payloads[i].method === 'domestic_sewage') {
          if (payloads[i].load_method === 'manual') {
            setDomesticSewageResult(data.sewage_demand);
          } else {
            setDomesticSewageResult(data.sewage_result);
          }
        }
      }

      if (waterSupplyResult || domesticSewageResult) {
        setShowPeakFlow(true);
      }
    } catch (error) {
      console.error(error);
      setError('Error connecting to backend.');
    }
  };

  const handlePeakFlowMethodToggle = (method: keyof typeof peakFlowMethods) => {
    setPeakFlowMethods({
      ...peakFlowMethods,
      [method]: !peakFlowMethods[method],
    });
  };

  const handlePeakFlowSewageSourceChange = (source: PeakFlowSewageSource) => {
    setPeakFlowSewageSource(source);
  };

  const getCPHEEOFactor = (pop: number) => {
    if (pop < 20000) return 3.0;
    if (pop <= 50000) return 2.5;
    if (pop <= 75000) return 2.25;
    return 2.0;
  };

  const getHarmonFactor = (pop: number) => 1 + 14 / (4 + Math.sqrt(pop / 1000));
  const getBabbittFactor = (pop: number) => 5 / (pop / 1000) ** 0.2;

  const calculateDrainBasedSewFlow = (popVal: number) => {
    if (totalDrainDischarge <= 0) return 0;
    const referencePopulation = (window as any).population2025;
    if (referencePopulation && referencePopulation > 0) {
      return (popVal / referencePopulation) * totalDrainDischarge;
    }
    return totalDrainDischarge;
  };

  const calculatewaterBasedSewFlow = (popVal: number) => {
    if (totalSupplyInput == 0) return 0;
    const referencePopulation = (window as any).population2025;
    if (referencePopulation && referencePopulation > 0) {
      return ((popVal / referencePopulation) * Number(totalSupplyInput));
    }
    return totalSupplyInput;
  };

  const handleCalculatePeakFlow = () => {
    if (!computedPopulation || (!waterSupplyResult && !domesticSewageResult)) {
      alert('Population or sewage data not available.');
      return;
    }
    const selectedMethods = Object.entries(peakFlowMethods)
      .filter(([_, selected]) => selected)
      .map(([method]) => method);
    if (selectedMethods.length === 0) {
      alert('Please select at least one Peak Flow method.');
      return;
    }

    const sewageResult = domesticLoadMethod === 'modeled' ? domesticSewageResult : (waterSupplyResult || domesticSewageResult);

    const rows = Object.keys(sewageResult || {}).map((year) => {
      const popVal = computedPopulation[year] || 0;
      const popBasedSewFlow = sewageResult[year] || 0;
      const drainBasedSewFlow = calculateDrainBasedSewFlow(popVal);
      const waterBasedSewFlow = calculatewaterBasedSewFlow(popVal);

      let avgSewFlow;
      if (peakFlowSewageSource === 'drain_based' && domesticLoadMethod === 'modeled' && totalDrainDischarge > 0) {
        avgSewFlow = drainBasedSewFlow;
      } else if (peakFlowSewageSource === 'water_based' && (window as any).totalWaterSupply > 0) {
        avgSewFlow = waterBasedSewFlow;
      } else {
        avgSewFlow = popBasedSewFlow;
      }

      const row: any = {
        year,
        population: popVal,
        avgSewFlow: avgSewFlow.toFixed(2)
      };

      if (selectedMethods.includes('cpheeo')) {
        row.cpheeo = (avgSewFlow * getCPHEEOFactor(popVal)).toFixed(2);
      }
      if (selectedMethods.includes('harmon')) {
        row.harmon = (avgSewFlow * getHarmonFactor(popVal)).toFixed(2);
      }
      if (selectedMethods.includes('babbitt')) {
        row.babbitt = (avgSewFlow * getBabbittFactor(popVal)).toFixed(2);
      }
      return row;
    });

    const tableJSX = (
      <table className="min-w-full border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border px-2 py-1">Year</th>
            <th className="border px-2 py-1">Population</th>
            <th className="border px-2 py-1">Avg Sewage Flow (MLD)</th>
            {selectedMethods.includes('cpheeo') && (
              <th className="border px-2 py-1">CPHEEO Peak (MLD)</th>
            )}
            {selectedMethods.includes('harmon') && (
              <th className="border px-2 py-1">Harmon's Peak (MLD)</th>
            )}
            {selectedMethods.includes('babbitt') && (
              <th className="border px-2 py-1">Babbit's Peak (MLD)</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              <td className="border px-2 py-1">{row.year}</td>
              <td className="border px-2 py-1">{row.population.toLocaleString()}</td>
              <td className="border px-2 py-1">{row.avgSewFlow}</td>
              {selectedMethods.includes('cpheeo') && (
                <td className="border px-2 py-1">{row.cpheeo}</td>
              )}
              {selectedMethods.includes('harmon') && (
                <td className="border px-2 py-1">{row.harmon}</td>
              )}
              {selectedMethods.includes('babbitt') && (
                <td className="border px-2 py-1">{row.babbitt}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    );
    setPeakFlowTable(tableJSX);
  };

  const handleCalculateRawSewage = () => {
    const basePop = computedPopulation["2011"] || 0;
    const baseCoefficient = basePop >= 1000000 ? 150 : 135;
    const unmetered = Number(unmeteredSupplyInput) || 0;
    const totalCoefficient = (baseCoefficient + unmetered) * 0.80;

    const tableRows = pollutionItemsState.map((item, index) => {
      const concentration = (item.perCapita / totalCoefficient) * 1000;
      return (
        <tr key={index}>
          <td className="border px-2 py-1">{item.name}</td>
          <td className="border px-2 py-1">
            <input
              type="number"
              value={item.perCapita}
              onChange={(e) => {
                const newVal = Number(e.target.value);
                setPollutionItemsState(prev => {
                  const newItems = [...prev];
                  newItems[index] = { ...newItems[index], perCapita: newVal };
                  return newItems;
                });
              }}
              className="w-20 border rounded px-1 py-0.5"
            />
          </td>
          <td className="border px-2 py-1">{concentration.toFixed(1)}</td>
          <td className="border px-2 py-1">
            <input
              type="number"
              value={item.designCharacteristic || concentration.toFixed(1)}
              onChange={(e) => {
                const newVal = Number(e.target.value);
                setPollutionItemsState(prev => {
                  const newItems = [...prev];
                  newItems[index] = {
                    ...newItems[index],
                    designCharacteristic: newVal
                  };
                  return newItems;
                });
              }}
              className="w-20 border rounded px-1 py-0.5"
            />
          </td>
        </tr>
      );
    });

    const tableJSX = (
      <table className="min-w-full border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border px-2 py-1">Item</th>
            <th className="border px-2 py-1">Per Capita Contribution (g/c/d)</th>
            <th className="border px-2 py-1">Concentration (mg/l)</th>
            <th className="border px-2 py-1">Design Characteristic (mg/l)</th>
          </tr>
        </thead>
        <tbody>{tableRows}</tbody>
      </table>
    );
    setRawSewageTable(tableJSX);
    setShowRawSewage(true);
  };

  const rawSewageJSX = useMemo(() => {
    const basePop = computedPopulation["2011"] || 0;
    const baseCoefficient = basePop >= 1000000 ? 150 : 135;
    const unmetered = Number(unmeteredSupplyInput) || 0;
    const totalCoefficient = (baseCoefficient + unmetered) * 0.80;

    return (
      <table className="min-w-full border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border px-2 py-1">Item</th>
            <th className="border px-2 py-1">Per Capita Contribution (g/c/d)</th>
            <th className="border px-2 py-1">Raw Sewage Characteristics (mg/l)</th>
            <th className="border px-2 py-1">Design Characteristics (mg/l)</th>
          </tr>
        </thead>
        <tbody>
          {pollutionItemsState.map((item, index) => {
            const concentration = (item.perCapita / totalCoefficient) * 1000;
            return (
              <tr key={index}>
                <td className="border px-2 py-1">{item.name}</td>
                <td className="border px-2 py-1">
                  <input
                    type="number"
                    value={item.perCapita}
                    onChange={(e) => {
                      const newVal = Number(e.target.value);
                      setPollutionItemsState(prev => {
                        const newItems = [...prev];
                        newItems[index] = { ...newItems[index], perCapita: newVal };
                        return newItems;
                      });
                    }}
                    className="w-20 border rounded px-1 py-0.5"
                  />
                </td>
                <td className="border px-2 py-1">{concentration.toFixed(1)}</td>
                <td className="border px-2 py-1">
                  <input
                    type="number"
                    value={item.designCharacteristic || concentration.toFixed(1)}
                    onChange={(e) => {
                      const newVal = Number(e.target.value);
                      setPollutionItemsState(prev => {
                        const newItems = [...prev];
                        newItems[index] = {
                          ...newItems[index],
                          designCharacteristic: newVal
                        };
                        return newItems;
                      });
                    }}
                    className="w-20 border rounded px-1 py-0.5"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }, [pollutionItemsState, unmeteredSupplyInput, computedPopulation]);

  const drainItemsTableJSX = (
    <div className="mt-4">
      <table className="min-w-full border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border px-2 py-1">Drain ID</th>
            <th className="border px-2 py-1">Drain Name</th>
            <th className="border px-2 py-1">Measured Discharge (MLD)</th>
          </tr>
        </thead>
        <tbody>
          {drainItems.map((item, index) => (
            <tr key={`drain-${item.id}-${index}`}>
              <td className="border px-2 py-1">
                <input
                  type="text"
                  value={item.id}
                  onChange={(e) => handleDrainItemChange(index, 'id', e.target.value)}
                  className={`w-20 border rounded px-1 py-0.5 ${sourceMode === 'drain' ? 'bg-gray-100' : ''}`}
                  readOnly={sourceMode === 'drain'}
                  title={sourceMode === 'drain' ? 'Drain ID is automatically set from drain selection' : ''}
                />
              </td>
              <td className="border px-2 py-1">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => handleDrainItemChange(index, 'name', e.target.value)}
                  className={`w-full border rounded px-1 py-0.5 ${sourceMode === 'drain' ? 'bg-gray-100' : ''}`}
                  readOnly={sourceMode === 'drain'}
                  title={sourceMode === 'drain' ? 'Drain name is automatically set from drain selection' : ''}
                />
              </td>
              <td className="border px-2 py-1">
                <input
                  type="number"
                  value={item.discharge === '' ? '' : item.discharge}
                  onChange={(e) => {
                    console.log(`🎯 Discharge input change for drain ${index}:`, e.target.value);
                    handleDrainItemChange(index, 'discharge', e.target.value);
                  }}
                  className="w-20 border rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  onFocus={(e) => {
                    console.log(`🎯 Discharge input focused for drain ${index}`);
                    e.target.select(); // Select all text when focused
                  }}
                  onBlur={(e) => {
                    console.log(`🎯 Discharge input blurred for drain ${index}:`, e.target.value);
                  }}
                />
              </td>
            </tr>
          ))}
          <tr>
            <td colSpan={2} className="border px-2 py-1 font-bold text-right">
              Total Discharge:
            </td>
            <td className="border px-2 py-1 font-bold">
              {totalDrainDischarge.toFixed(2)} MLD
            </td>
          </tr>
        </tbody>
      </table>
      {sourceMode === 'drain' && (
        <div className="mt-2 text-sm text-blue-600 bg-blue-50 p-2 rounded">
          <strong>Note:</strong> Drain IDs and names are automatically populated from your drain selection.

        </div>
      )}
    </div>
  );
  const captureMap = async () => {
    try {
      const mapContainer = sourceMode === 'admin'
        ? document.querySelector('.admin-map .leaflet-container')
        : document.querySelector('.drain-map .leaflet-container');

      if (!mapContainer) {
        console.warn(`Map container for ${sourceMode} mode not found`);
        return null;
      }

      const imgData = await domToImage.toPng(mapContainer as HTMLElement, {
        bgcolor: '#ffffff',
      });
      return imgData;
    } catch (err) {
      console.error('Failed to capture map:', err);
      return null;
    }
  };



  const handle1pdfDownload = async () => {
    const doc = new jsPDF();

    const addLogos = async () => {
      try {
        const iitLogo = new Image();
        iitLogo.crossOrigin = "Anonymous";
        const leftLogoPromise = new Promise((resolve, reject) => {
          iitLogo.onload = () => resolve(true);
          iitLogo.onerror = () => reject(false);
          iitLogo.src = "/images/export/logo_iitbhu.png";
        });

        const rightLogo = new Image();
        rightLogo.crossOrigin = "Anonymous";
        const rightLogoPromise = new Promise((resolve, reject) => {
          rightLogo.onload = () => resolve(true);
          rightLogo.onerror = () => reject(false);
          rightLogo.src = "/images/export/right1_slcr.png";
        });

        await Promise.all([leftLogoPromise, rightLogoPromise]);
        doc.addImage(iitLogo, 'PNG', 14, 5, 25, 25);
        const pageWidth = doc.internal.pageSize.width;
        doc.addImage(rightLogo, 'PNG', pageWidth - 39, 5, 25, 25);
      } catch (err) {
        console.error("Failed to load logos:", err);
      }
    };

    const continueWithReport = async () => {
      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.text("Comprehensive Report of Sewage Generation", doc.internal.pageSize.width / 2, 20, { align: 'center' });
      const today = new Date().toLocaleDateString();
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      let yPos = 40;

      // 1. Population Section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("1. Population Analysis", 14, yPos);
      yPos += 8;

      // Add Map Section
      const mapImage = await captureMap();
      if (mapImage) {
        if (yPos > 230) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`1.1 ${sourceMode === 'admin' ? 'Administrative' : 'Drain'} Map`, 14, yPos);
        yPos += 8;
        doc.addImage(mapImage, 'PNG', 14, yPos, 180, 100); // Adjust width/height as needed
        yPos += 110; // Adjust based on map height
      } else {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text("Map not available", 14, yPos);
        yPos += 10;
      }

      // 1.2 Geographic Location (shifted down)
      try {
        const locationData = window.selectedLocations || {
          state: '',
          districts: [],
          subDistricts: [],
          villages: [],
          totalPopulation: 0
        };

        if (locationData && (locationData.state || locationData.districts.length > 0)) {
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text("1.2 Geographic Location", 14, yPos);
          yPos += 8;
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');

          if (locationData.state) {
            doc.text(`State: ${locationData.state}`, 14, yPos);
            yPos += 5;
          }

          if (locationData.districts && locationData.districts.length > 0) {
            const districtsText = Array.isArray(locationData.districts)
              ? `Districts: ${locationData.districts.join(', ')}`
              : `Districts: ${locationData.districts.toString()}`;
            const districtLines = doc.splitTextToSize(districtsText, 180);
            doc.text(districtLines, 14, yPos);
            yPos += (districtLines.length * 5);
          }

          if (locationData.subDistricts && locationData.subDistricts.length > 0) {
            const subDistrictsText = Array.isArray(locationData.subDistricts)
              ? `Sub-Districts: ${locationData.subDistricts.join(', ')}`
              : `Sub-Districts: ${locationData.subDistricts.toString()}`;
            const subDistrictLines = doc.splitTextToSize(subDistrictsText, 180);
            doc.text(subDistrictLines, 14, yPos);
            yPos += (subDistrictLines.length * 5);
          }

          if (locationData.totalPopulation) {
            doc.setFont('helvetica', 'bold');
            doc.text(`Total Population (2011): ${locationData.totalPopulation.toLocaleString()}`, 14, yPos);
            yPos += 8;
          }

          // Handle villages data
          const villagesData = villages_props && villages_props.length > 0 ? villages_props : locationData.villages;

          if (villagesData && villagesData.length > 0) {
            const villagesText = Array.isArray(villagesData)
              ? `Villages: ${villagesData.map(v => v.name || v).join(', ')}`
              : `Villages: ${villagesData.toString()}`;
            const villageLines = doc.splitTextToSize(villagesText, 180);
            doc.text(villageLines, 14, yPos);
            yPos += (villageLines.length * 5);

            if (yPos > 230 && villagesData.length > 0) {
              doc.addPage();
              yPos = 20;
            }

            // Add village details table if available
            if (villagesData[0] && typeof villagesData[0] === 'object') {
              doc.setFont('helvetica', 'bold');
              doc.text("1.3 Selected Villages with Population:", 14, yPos);
              yPos += 8;
              const villageRows = villagesData.map((village: { name: any; subDistrict: any; sub_district: any; district: any; population: { toLocaleString: () => any; }; }) => [
                village.name || 'N/A',
                village.subDistrict || village.sub_district || 'N/A',
                village.district || 'N/A',
                village.population ? village.population.toLocaleString() : 'N/A'
              ]);
              autoTable(doc, {
                head: [['Village Name', 'Sub-District', 'District', 'Population (2011)']],
                body: villageRows,
                startY: yPos,
                styles: { fontSize: 9 },
                headStyles: { fillColor: [66, 139, 202] },
              });
              yPos = (doc as any).lastAutoTable?.finalY + 10 || yPos + 10;
            }
          }

          // Population forecast data
          if (Object.keys(computedPopulation).length > 0) {
            if (yPos > 230) {
              doc.addPage();
              yPos = 20;
            }
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text("1.4 Population Forecast", 14, yPos);
            yPos += 8;
            const popYears = Object.keys(computedPopulation).sort();
            if (popYears.length > 0) {
              const popRows = popYears.map(year => [
                year,
                Math.round(computedPopulation[year] || 0).toLocaleString()
              ]);
              autoTable(doc, {
                head: [['Year', 'Projected Population']],
                body: popRows,
                startY: yPos,
                styles: { fontSize: 10 },
                headStyles: { fillColor: [66, 139, 202] },
              });
              yPos = (doc as any).lastAutoTable?.finalY + 10 || yPos + 10;
            }
          }
        }
      } catch (error) {
        console.error("Error adding location data:", error);
        yPos += 5;
      }

      // 2. Water Demand Section
      if (yPos > 230) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("2. Water Demand Analysis", 14, yPos);
      yPos += 8;

      try {
        const waterDemandData = (window as any).totalWaterDemand || {};

        if (Object.keys(waterDemandData).length > 0) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text("Water demand is estimated based on various contributing factors including domestic,", 14, yPos);
          yPos += 5;
          doc.text("floating, commercial, institutional, and firefighting demands as per CPHEEO guidelines.", 14, yPos);
          yPos += 10;

          const waterDemandYears = Object.keys(waterDemandData).sort();
          if (waterDemandYears.length > 0) {
            const waterDemandRows = waterDemandYears.map(year => [
              year,
              Math.round(computedPopulation[year] || 0).toLocaleString(),
              waterDemandData[year].toFixed(2)
            ]);
            autoTable(doc, {
              head: [['Year', 'Population', 'Water Demand (MLD)']],
              body: waterDemandRows,
              startY: yPos,
              styles: { fontSize: 10 },
              headStyles: { fillColor: [66, 139, 202] },
            });
            yPos = (doc as any).lastAutoTable?.finalY + 10 || yPos + 10;
          }
        } else {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'italic');
          doc.text("Water demand data not available", 14, yPos);
          yPos += 10;
        }
      } catch (error) {
        console.error("Error adding water demand data:", error);
        yPos += 5;
      }

      // 3. Water Supply Section
      if (yPos > 230) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("3. Water Supply Analysis", 14, yPos);
      yPos += 8;

      try {
        const waterSupply = Number(totalSupplyInput) || 0;
        const waterDemandData = (window as any).totalWaterDemand || {};

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text("Water supply plays a critical role in determining sewage generation within a region.", 14, yPos);
        yPos += 5;

        if (waterSupply > 0) {
          doc.text(`The estimated total water supply is: ${waterSupply.toFixed(2)} MLD`, 14, yPos);
          yPos += 10;
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text("3.1 Water Supply Details", 14, yPos);
          yPos += 8;
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text("Total Water Supply:", 14, yPos);
          doc.text(`${totalSupplyInput} MLD`, 80, yPos);
          yPos += 5;

          if (unmeteredSupplyInput && Number(unmeteredSupplyInput) > 0) {
            doc.text("Unmetered Water Supply:", 14, yPos);
            doc.text(`${unmeteredSupplyInput} MLD`, 80, yPos);
            yPos += 5;
          }

          yPos += 5;
          const waterDemandYears = Object.keys(waterDemandData).sort();
          if (waterDemandYears.length > 0) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text("3.2 Water Gap Analysis", 14, yPos);
            yPos += 8;
            const waterGapRows = waterDemandYears.map(year => {
              const demand = waterDemandData[year];
              const gap = waterSupply - demand;
              const status = gap >= 0 ? 'Sufficient' : 'Deficit';
              return [
                year,
                waterSupply.toFixed(2),
                demand.toFixed(2),
                gap.toFixed(2),
                status
              ];
            });
            autoTable(doc, {
              head: [['Year', 'Supply (MLD)', 'Demand (MLD)', 'Gap (MLD)', 'Status']],
              body: waterGapRows,
              startY: yPos,
              styles: { fontSize: 9 },
              headStyles: { fillColor: [66, 139, 202] },
            });
            yPos = (doc as any).lastAutoTable?.finalY + 10 || yPos + 10;
          }
        } else {
          doc.setFont('helvetica', 'italic');
          doc.text("Water supply data not available", 14, yPos);
          yPos += 10;
        }
      } catch (error) {
        console.error("Error adding water supply data:", error);
        yPos += 5;
      }

      // 4. Sewage Generation Section
      if (yPos > 200) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("4. Sewage Generation Analysis", 14, yPos);
      yPos += 8;

      // Add source mode information
      if (sourceMode) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Analysis Mode: ${sourceMode === 'drain' ? 'Drain-based Analysis' : 'Administrative Area Analysis'}`, 14, yPos);
        yPos += 8;
      }

      // 4.1 Water Supply Method
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text("4.1 Water Supply Method", 14, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text("Sewage Calculation Method: Water Supply", 14, yPos);
      yPos += 5;
      doc.text("Total Water Supply:", 14, yPos);
      doc.text(`${totalSupplyInput || 0} MLD`, 80, yPos);
      yPos += 10;

      if (waterSupplyResult) {
        if (typeof waterSupplyResult === 'number') {
          const sewageRows = [["Sewage Generation", `${waterSupplyResult.toFixed(2)} MLD`]];
          autoTable(doc, {
            body: sewageRows,
            startY: yPos,
            styles: { fontSize: 10 },
          });
          yPos = (doc as any).lastAutoTable?.finalY + 10 || yPos + 10;
        } else {
          const sewageRows = Object.entries(waterSupplyResult).map(([year, value]) => [
            year,
            computedPopulation[year] ? computedPopulation[year].toLocaleString() : '0',
            `${Number(value).toFixed(2)} MLD`
          ]);
          autoTable(doc, {
            head: [["Year", "Population", "Sewage Generation (MLD)"]],
            body: sewageRows,
            startY: yPos,
            styles: { fontSize: 10 },
            headStyles: { fillColor: [66, 139, 202] },
          });
          yPos = (doc as any).lastAutoTable?.finalY + 10 || yPos + 10;
        }
      } else {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text("Water supply method results not available", 14, yPos);
        yPos += 10;
      }

      // 4.2 Domestic Sewage Load Estimation
      if (yPos > 200) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text("4.2 Domestic Sewage Load Estimation", 14, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text("Domestic Load Method:", 14, yPos);
      doc.text(domesticLoadMethod === 'manual' ? "Manual Input" :
        domesticLoadMethod === 'modeled' ? "Population-based Modeling" : "Not Selected", 80, yPos);
      yPos += 5;

      if (domesticLoadMethod === 'manual' && domesticSupplyInput) {
        doc.text("Domestic Water Supply:", 14, yPos);
        doc.text(`${domesticSupplyInput} MLD`, 80, yPos);
        yPos += 5;
      }

      if (domesticLoadMethod === 'modeled' && unmeteredSupplyInput) {
        doc.text("Unmetered Water Supply:", 14, yPos);
        doc.text(`${unmeteredSupplyInput} MLD`, 80, yPos);
        yPos += 5;
      }

      yPos += 5;

      if (domesticSewageResult) {
        if (typeof domesticSewageResult === 'number') {
          const sewageRows = [["Sewage Generation", `${domesticSewageResult.toFixed(2)} MLD`]];
          autoTable(doc, {
            body: sewageRows,
            startY: yPos,
            styles: { fontSize: 10 },
          });
          yPos = (doc as any).lastAutoTable?.finalY + 10 || yPos + 10;
        } else {
          let headers = ["Year", "Population", "Population-Based Sewage (MLD)"];

          // Add conditional headers based on available data
          if ((window as any).totalWaterSupply > 0) {
            headers.push("Water-Based Sewage (MLD)");
          }
          if (domesticLoadMethod === 'modeled' && totalDrainDischarge > 0) {
            headers.push("Drain-Based Sewage (MLD)");
          }

          const sewageRows = Object.entries(domesticSewageResult).map(([year, value]) => {
            const popValue = computedPopulation[year] || 0;
            const row = [
              year,
              popValue.toLocaleString(),
              `${Number(value).toFixed(2)} MLD`
            ];

            if ((window as any).totalWaterSupply > 0) {
              const result = calculatewaterBasedSewFlow(popValue);
              const waterSewage = typeof result === 'number' ? result : 0;
              row.push(`${waterSewage.toFixed(2)} MLD`);
            }

            if (domesticLoadMethod === 'modeled' && totalDrainDischarge > 0) {
              const drainSewage = calculateDrainBasedSewFlow(popValue);
              row.push(`${drainSewage.toFixed(2)} MLD`);
            }

            return row;
          });

          autoTable(doc, {
            head: [headers],
            body: sewageRows,
            startY: yPos,
            styles: { fontSize: 9 },
            headStyles: { fillColor: [66, 139, 202] },
          });
          yPos = (doc as any).lastAutoTable?.finalY + 10 || yPos + 10;
        }
      } else {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text("Domestic sewage method results not available", 14, yPos);
        yPos += 10;
      }

      // 4.3 Drain Information
      if (yPos > 200) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text("4.3 Drain Information", 14, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      // Add source mode specific information
      if (sourceMode === 'drain') {
        doc.text("Analysis Mode: Drain-based (drains selected from river system)", 14, yPos);
        yPos += 5;
        if (selectedRiverData && selectedRiverData.river) {
          doc.text(`River: ${selectedRiverData.river}`, 14, yPos);
          yPos += 5;
        }
        if (selectedRiverData && selectedRiverData.stretch) {
          doc.text(`Stretch: ${selectedRiverData.stretch}`, 14, yPos);
          yPos += 5;
        }
      }

      doc.text("Number of Drains to be Tapped:", 14, yPos);
      doc.text(`${drainCount || drainItems.length}`, 120, yPos);
      yPos += 5;
      doc.text("Total Drain Discharge:", 14, yPos);
      doc.text(`${totalDrainDischarge.toFixed(2)} MLD`, 120, yPos);
      yPos += 10;

      if (drainItems.length > 0) {
        const drainRows = drainItems.map((item) => [
          item.id,
          item.name,
          typeof item.discharge === 'number' ? `${item.discharge.toFixed(2)} MLD` : '0.00 MLD'
        ]);
        autoTable(doc, {
          head: [["Drain ID", "Drain Name", "Discharge (MLD)"]],
          body: drainRows,
          startY: yPos,
          styles: { fontSize: 10 },
          headStyles: { fillColor: [66, 139, 202] },
        });
        yPos = (doc as any).lastAutoTable?.finalY + 10 || yPos + 10;
      }

      // 4.4 Peak Flow Calculation
      if (peakFlowTable && yPos > 200) {
        doc.addPage();
        yPos = 20;
      }
      if (peakFlowTable) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text("4.4 Peak Flow Calculation Results", 14, yPos);
        yPos += 8;

        // Add information about selected methods and source
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Peak Flow Source: ${peakFlowSewageSource.replace('_', ' ').toUpperCase()}`, 14, yPos);
        yPos += 5;

        const selectedMethods = Object.entries(peakFlowMethods)
          .filter(([_, selected]) => selected)
          .map(([method]) => method.toUpperCase());
        doc.text(`Selected Methods: ${selectedMethods.join(', ')}`, 14, yPos);
        yPos += 8;

        const headers = ["Year", "Population", "Avg Sewage Flow (MLD)"];
        if (selectedMethods.includes('CPHEEO')) headers.push("CPHEEO Peak (MLD)");
        if (selectedMethods.includes('HARMON')) headers.push("Harmon's Peak (MLD)");
        if (selectedMethods.includes('BABBITT')) headers.push("Babbit's Peak (MLD)");

        const sewageResult = domesticLoadMethod === 'modeled' ? domesticSewageResult : (waterSupplyResult || domesticSewageResult);
        const peakRows = Object.keys(sewageResult || {}).map((year) => {
          const popVal = computedPopulation[year] || 0;
          const popBasedSewFlow = sewageResult[year] || 0;
          const drainBasedSewFlow = calculateDrainBasedSewFlow(popVal);
          const waterBasedSewFlow = calculatewaterBasedSewFlow(popVal);

          const avgSewFlow = peakFlowSewageSource === 'drain_based' && domesticLoadMethod === 'modeled' && totalDrainDischarge > 0
            ? drainBasedSewFlow
            : peakFlowSewageSource === 'water_based' && (window as any).totalWaterSupply > 0
              ? waterBasedSewFlow
              : popBasedSewFlow;

          const row = [
            year,
            popVal.toLocaleString(),
            avgSewFlow.toFixed(2)
          ];

          if (selectedMethods.includes('CPHEEO')) {
            row.push((avgSewFlow * getCPHEEOFactor(popVal)).toFixed(2));
          }
          if (selectedMethods.includes('HARMON')) {
            row.push((avgSewFlow * getHarmonFactor(popVal)).toFixed(2));
          }
          if (selectedMethods.includes('BABBITT')) {
            row.push((avgSewFlow * getBabbittFactor(popVal)).toFixed(2));
          }
          return row;
        });

        autoTable(doc, {
          head: [headers],
          body: peakRows,
          startY: yPos,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [66, 139, 202] },
        });
        yPos = (doc as any).lastAutoTable?.finalY + 10 || yPos + 10;
      }

      // 4.5 Raw Sewage Characteristics
      if (showRawSewage && yPos > 200) {
        doc.addPage();
        yPos = 20;
      }
      if (showRawSewage) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text("4.5 Raw Sewage Characteristics", 14, yPos);
        yPos += 8;

        const basePop = computedPopulation["2011"] || 0;
        const baseCoefficient = basePop >= 1000000 ? 150 : 135;
        const unmetered = Number(unmeteredSupplyInput) || 0;
        const totalCoefficient = (baseCoefficient + unmetered) * 0.80;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Base Population (2011): ${basePop.toLocaleString()}`, 14, yPos);
        yPos += 5;
        doc.text(`Base Coefficient: ${baseCoefficient} LPCD`, 14, yPos);
        yPos += 5;
        doc.text(`Unmetered Supply: ${unmetered} LPCD`, 14, yPos);
        yPos += 5;
        doc.text(`Total Coefficient: ${totalCoefficient.toFixed(2)} LPCD`, 14, yPos);
        yPos += 8;

        const rawRows = pollutionItemsState.map((item) => {
          const concentration = (item.perCapita / totalCoefficient) * 1000;
          return [
            item.name,
            item.perCapita.toFixed(1),
            concentration.toFixed(1),
            (item.designCharacteristic || concentration).toFixed(1)
          ];
        });

        autoTable(doc, {
          head: [["Parameter", "Per Capita (g/c/d)", "Raw Sewage (mg/l)", "Design Value (mg/l)"]],
          body: rawRows,
          startY: yPos,
          styles: { fontSize: 10 },
          headStyles: { fillColor: [66, 139, 202] },
        });
        yPos = (doc as any).lastAutoTable?.finalY + 10 || yPos + 10;
      }

      // 5. Summary and Conclusions
      if (yPos > 230) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("5. Summary and Conclusions", 14, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text("This comprehensive report presents the sewage generation analysis based on:", 14, yPos);
      yPos += 8;

      const summaryPoints = [
        `• Population-based analysis using ${Object.keys(computedPopulation).length} forecast years`,
        `• Water supply method with ${totalSupplyInput || 0} MLD total supply`,
        `• Domestic load estimation using ${domesticLoadMethod || 'selected'} method`,
        `• Drain-based analysis with ${drainItems.length} drains (${totalDrainDischarge.toFixed(2)} MLD total discharge)`,
        `• Analysis mode: ${sourceMode === 'drain' ? 'Drain-based system analysis' : 'Administrative area analysis'}`
      ];

      summaryPoints.forEach(point => {
        const lines = doc.splitTextToSize(point, 180);
        doc.text(lines, 14, yPos);
        yPos += (lines.length * 5) + 2;
      });

      // 6. References
      doc.addPage();
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("6. References", 14, 20);
      yPos = 30;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      const references = [
        "1. CPHEEO Manual on Water Supply and Treatment, Ministry of Urban Development, Government of India",
        "2. CPHEEO Manual on Sewerage and Sewage Treatment Systems, Ministry of Urban Development, Government of India",
        "3. Census of India, 2011",
        "4. Guidelines for Decentralized Wastewater Management, Ministry of Environment, Forest and Climate Change",
        "5. IS 1172:1993 - Code of Basic Requirements for Water Supply, Drainage and Sanitation",
        "6. Metcalf & Eddy, Wastewater Engineering: Treatment and Reuse, 4th Edition",
        "7. Central Pollution Control Board Guidelines for Sewage Treatment",
        "8. Manual on Storm Water Drainage Systems, CPHEEO",
        "9. Uniform Drinking Water Quality Monitoring Protocol, Ministry of Jal Shakti",
        "10. National Water Policy 2012, Government of India"
      ];

      references.forEach(ref => {
        const lines = doc.splitTextToSize(ref, 180);
        doc.text(lines, 14, yPos);
        yPos += (lines.length * 5) + 3;
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
      });

      // Add page numbers and footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
        doc.text("Comprehensive Sewage Generation Report", 14, doc.internal.pageSize.height - 10);
        doc.text(today, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
      }

      doc.save("Comprehensive_Sewage_Generation_Report.pdf");
    }

    await addLogos();
    await continueWithReport();
  };

  const handleCheckboxChange = (key: keyof typeof checkboxes) => {
    setCheckboxes(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="p-6 border rounded-lg bg-gradient-to-br from-white to-gray-50 shadow-lg">
      <div className="flex items-center mb-4">
        <h3 className="text-2xl font-bold text-gray-800">Sewage Calculation</h3>
        {sourceMode === 'drain' && (
          <span className="ml-2 text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
            Drain Mode
          </span>
        )}
        <div className="relative ml-2 group">
          <span className="flex items-center justify-center h-5 w-5 text-sm bg-blue-600 text-white rounded-full cursor-help transition-transform hover:scale-110">i</span>
          <div className="absolute z-10 hidden group-hover:block w-72 text-gray-700 text-xs rounded-lg p-3 bg-white shadow-xl -mt-8 left-6 border border-gray-200">
            Sewage calculation determines wastewater generation based on water supply, population, and drainage infrastructure to support effective sewage treatment planning.
          </div>
        </div>
      </div>

      {/* Water Supply Method Container */}
      <div className="mb-6 p-4 border rounded-lg bg-blue-50/50 shadow-sm">
        <h4 className="font-semibold text-lg text-blue-700">Water Supply Method</h4>
        <div className="mt-3">
          <label htmlFor="total_supply_input" className="block text-sm font-medium text-gray-700">
            Total Water Supply (MLD):
          </label>
          <input
            type="number"
            id="total_supply_input"
            value={totalSupplyInput}
            onChange={(e) =>
              setTotalSupplyInput(e.target.value === '' ? '' : Number(e.target.value))
            }
            className="mt-2 block w-1/3 border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Enter total supply"
            min="0"
          />
        </div>
        {waterSupplyResult && (
          <div className="mt-4 p-4 border rounded-lg bg-green-50/50 shadow-sm">
            <h4 className="font-semibold text-lg text-green-700">Sewage Generation (Water Supply):</h4>
            {typeof waterSupplyResult === 'number' ? (
              <p className="text-xl font-medium text-gray-800">{waterSupplyResult.toFixed(2)} MLD</p>
            ) : (
              <div className="mt-4">
                <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-100">
                  <table className="table-auto w-full min-w-[600px] bg-white border border-gray-300 rounded-lg shadow-md">
                    <thead className="bg-gradient-to-r from-blue-100 to-blue-200 sticky top-0 z-10">
                      <tr>
                        <th className="border-b border-gray-300 px-6 py-3 text-left text-sm font-semibold text-gray-800">Year</th>
                        <th className="border-b border-gray-300 px-6 py-3 text-left text-sm font-semibold text-gray-800">Forecasted Population</th>
                        <th className="border-b border-gray-300 px-6 py-3 text-left text-sm font-semibold text-gray-800">Sewage Generation (MLD)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(waterSupplyResult).map(([year, value], index) => (
                        <tr
                          key={year}
                          className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                        >
                          <td className="border-b border-gray-200 px-6 py-3 text-gray-700">{year}</td>
                          <td className="border-b border-gray-200 px-6 py-3 text-gray-700">{computedPopulation[year]?.toLocaleString() || '0'}</td>
                          <td className="border-b border-gray-200 px-6 py-3 text-gray-700">{Number(value).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Drain Tapping Input */}
      <div className="mb-6 p-4 border rounded-lg bg-blue-50/50 shadow-sm">
        <h4 className="font-semibold text-lg text-blue-700 mb-3">Drain Tapping Information</h4>
        {sourceMode !== 'drain' && (
          <>
            <label className="block text-sm font-medium text-gray-700 flex items-center">
              Number Of Drains to be Tapped
              <div className="relative ml-1 group">
                <span className="flex items-center justify-center h-5 w-5 text-sm bg-blue-600 text-white rounded-full cursor-help transition-transform hover:scale-110">i</span>
                <div className="absolute z-10 hidden group-hover:block w-64 text-gray-700 text-xs rounded-lg p-3 bg-white shadow-xl -mt-12 ml-6 border border-gray-200">
                  Enter the number of drains that will be connected to the sewage system for wastewater collection.
                </div>
              </div>
            </label>
            <input
              type="number"
              id="drain_count"
              value={drainCount}
              onChange={handleDrainCountChange}
              className="mt-2 block w-1/3 border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter number of drains"
              min="0"
            />
          </>
        )}

        {sourceMode === 'drain' && (
          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center mb-2">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium text-blue-800">Drain Mode Active</span>
            </div>
            <p className="text-sm text-blue-700">
              Drain information is automatically populated from your drain selection.
              Number of drains: <strong>{drainItems.length}</strong>
            </p>
          </div>
        )}

        {drainCount && drainCount > 0 && drainItemsTableJSX}
      </div>

      {/* Domestic Sewage Load Estimation Container */}
      <div className="mb-6 p-4 border rounded-lg bg-blue-50/50 shadow-sm">
        <h4 className="font-semibold text-lg text-blue-700 mb-3">Domestic Sewage Load Estimation</h4>
        <div className="mb-4">
          <label htmlFor="domestic_load_method" className="block text-sm font-medium text-gray-700">
            Select Sector:
          </label>
          <select
            id="domestic_load_method"
            value={domesticLoadMethod}
            onChange={handleDomesticLoadMethodChange}
            className="mt-2 block w-1/3 border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="">-- Choose Option --</option>
            <option value="manual">Manual</option>
            <option value="modeled">Modeled</option>
          </select>
          {domesticLoadMethod === 'manual' && (
            <div className="mt-4">
              <label htmlFor="domestic_supply_input" className="block text-sm font-medium text-gray-700">
                Domestic Water Supply (MLD):
              </label>
              <input
                type="number"
                id="domestic_supply_input"
                value={domesticSupplyInput}
                onChange={(e) =>
                  setDomesticSupplyInput(e.target.value === '' ? '' : Number(e.target.value))
                }
                className="mt-2 block w-1/3 border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter domestic supply"
                min="0"
              />
            </div>
          )}
          {domesticLoadMethod === 'modeled' && (
            <div className="mt-4">
              <label htmlFor="unmetered_supply_input" className="block text-sm font-medium text-gray-700">
                Unmetered Water Supply (optional):
              </label>
              <input
                type="number"
                id="unmetered_supply_input"
                value={unmeteredSupplyInput}
                onChange={(e) =>
                  setUnmeteredSupplyInput(e.target.value === '' ? '' : Number(e.target.value))
                }
                className="mt-2 block w-1/3 border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter unmetered supply"
                min="0"
              />
            </div>
          )}
        </div>
      </div>

      {/* Error display */}
      {error && <div className="mb-6 text-red-600 font-medium">{error}</div>}

      <div className="flex space-x-4 mb-6">
        <button
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          onClick={handleCalculateSewage}
        >
          Calculate Sewage
        </button>
      </div>

      {domesticSewageResult && (
        <div className="mt-6 p-4 border rounded-lg bg-green-50/50 shadow-sm">
          <h4 className="font-semibold text-lg text-green-700 mb-4">Sewage Generation (Domestic):</h4>
          {typeof domesticSewageResult === 'number' ? (
            <p className="text-xl font-medium text-gray-800">{domesticSewageResult.toFixed(2)} MLD</p>
          ) : (
            <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-100">
              <table className="table-auto w-full min-w-[800px] bg-white border border-gray-300 rounded-lg shadow-md">
                <thead className="bg-gradient-to-r from-blue-100 to-blue-200 sticky top-0 z-10">
                  <tr>
                    <th className="border-b border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-800">Year</th>
                    <th className="border-b border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-800">Forecasted Population</th>
                    {(window as any).totalWaterSupply > 0 && (
                      <th className="border-b border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-800">Water Based Sewage Generation (MLD)</th>
                    )}
                    <th className="border-b border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-800">Population Based Sewage Generation (MLD)</th>
                    {domesticLoadMethod === 'modeled' && totalDrainDischarge > 0 && (
                      <th className="border-b border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-800">Drains Based Sewage Generation (MLD)</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(domesticSewageResult).map(([year, value], index) => {
                    const forecastData = (window as any).selectedPopulationForecast;
                    const domesticPop = forecastData[year] ?? "";
                    const drainsSewage = calculateDrainBasedSewFlow(domesticPop);
                    const waterSewage = calculatewaterBasedSewFlow(domesticPop);
                    return (
                      <tr
                        key={year}
                        className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                      >
                        <td className="border-b border-gray-200 px-4 py-3 text-gray-700">{year}</td>
                        <td className="border-b border-gray-200 px-4 py-3 text-gray-700">{domesticPop.toLocaleString()}</td>
                        {(window as any).totalWaterSupply > 0 && (
                          <td className="border-b border-gray-200 px-4 py-3 text-gray-700">{Number(waterSewage) > 0 ? Number(waterSewage).toFixed(6) : "0.000000"}</td>
                        )}
                        <td className="border-b border-gray-200 px-4 py-3 text-gray-700">{Number(value).toFixed(2)}</td>
                        {domesticLoadMethod === 'modeled' && totalDrainDischarge > 0 && (
                          <td className="border-b border-gray-200 px-4 py-3 text-gray-700">{drainsSewage > 0 ? drainsSewage.toFixed(6) : "0.000000"}</td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showPeakFlow && (
        <div className="mt-6 p-4 border rounded-lg bg-blue-50/50 shadow-sm">
          <h5 className="font-semibold text-lg text-blue-700 mb-3">Peak Sewage Flow Calculation</h5>
          {(domesticLoadMethod === 'modeled' && totalDrainDischarge > 0) || (window as any).totalWaterSupply > 0 ? (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Sewage Generation Source for Peak Flow Calculation:
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="peakFlowSewageSource"
                    checked={peakFlowSewageSource === 'population_based'}
                    onChange={() => handlePeakFlowSewageSourceChange('population_based')}
                    className="mr-2"
                  />
                  Population Based Sewage Generation
                </label>
                {domesticLoadMethod === 'modeled' && totalDrainDischarge > 0 && (
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="peakFlowSewageSource"
                      checked={peakFlowSewageSource === 'drain_based'}
                      onChange={() => handlePeakFlowSewageSourceChange('drain_based')}
                      className="mr-2"
                    />
                    Drain Based Sewage Generation
                  </label>
                )}
                {(window as any).totalWaterSupply > 0 && (
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="peakFlowSewageSource"
                      checked={peakFlowSewageSource === 'water_based'}
                      onChange={() => handlePeakFlowSewageSourceChange('water_based')}
                      className="mr-2"
                    />
                    Water Based Sewage Generation
                  </label>
                )}
              </div>
            </div>
          ) : null}

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Select Peak Sewage Flow Methods:
            </label>
            <div className="flex flex-wrap gap-4 mt-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={peakFlowMethods.cpheeo}
                  onChange={() => handlePeakFlowMethodToggle('cpheeo')}
                  className="mr-2"
                />
                CPHEEO Method
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={peakFlowMethods.harmon}
                  onChange={() => handlePeakFlowMethodToggle('harmon')}
                  className="mr-2"
                />
                Harmon's Method
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={peakFlowMethods.babbitt}
                  onChange={() => handlePeakFlowMethodToggle('babbitt')}
                  className="mr-2"
                />
                Babbit's Method
              </label>
            </div>
          </div>
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            onClick={handleCalculatePeakFlow}
          >
            Calculate Peak Sewage Flow
          </button>
          {peakFlowTable && (
            <div className="mt-6 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-100">
              {peakFlowTable}
            </div>
          )}
        </div>
      )}

      <div className="mt-6 p-4 border rounded-lg bg-blue-50/50 shadow-sm">
        <h5 className="font-semibold text-lg text-blue-700 mb-3">Raw Sewage Characteristics</h5>
        <button
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          onClick={handleCalculateRawSewage}
        >
          Calculate Raw Sewage Characteristics
        </button>
        {showRawSewage && (
          <div className="mt-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-100">
            {rawSewageJSX}
          </div>
        )}
      </div>

      <div className="mt-6 p-4 border rounded-lg bg-gray-50/50 shadow-sm">
        <h5 className="font-semibold text-lg text-gray-700 mb-3">Report Checklist</h5>
        <p className="text-sm text-gray-600 mb-4">
          Please confirm completion of the following sections to enable the comprehensive report download.
        </p>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={checkboxes.populationForecasting}
              onChange={() => handleCheckboxChange('populationForecasting')}
              className="mr-2"
            />
            Population Forecasting
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={checkboxes.waterDemand}
              onChange={() => handleCheckboxChange('waterDemand')}
              className="mr-2"
            />
            Water Demand
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={checkboxes.waterSupply}
              onChange={() => handleCheckboxChange('waterSupply')}
              className="mr-2"
            />
            Water Supply
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={checkboxes.sewageCalculation}
              onChange={() => handleCheckboxChange('sewageCalculation')}
              className="mr-2"
            />
            Sewage Calculation
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={checkboxes.rawSewageCharacteristics}
              onChange={() => handleCheckboxChange('rawSewageCharacteristics')}
              className="mr-2"
            />
            Raw Sewage Characteristics
          </label>
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <button
          className={`text-white font-medium py-3 px-6 rounded-lg transition duration-300 ease-in-out shadow-md w-full sm:w-auto ${areAllCheckboxesChecked
            ? 'bg-purple-600 hover:bg-purple-700'
            : 'bg-gray-400 cursor-not-allowed'
            }`}
          onClick={handle1pdfDownload}
          disabled={!areAllCheckboxesChecked}
        >
          Download Comprehensive Report
        </button>
      </div>
    </div>
  );
};

export default SewageCalculationForm;
'use client';
import React, { useState, useEffect } from 'react';

interface WaterDemandData {
  [year: string]: number;
}

const WaterSupplyForm: React.FC = () => {
  // Surface Water Supply
  const [surfaceWater, setSurfaceWater] = useState<number | ''>('');

  // Groundwater Supply inputs
  const [directGroundwater, setDirectGroundwater] = useState<number | ''>('');
  const [numTubewells, setNumTubewells] = useState<number | ''>('');
  const [dischargeRate, setDischargeRate] = useState<number | ''>('');
  const [operatingHours, setOperatingHours] = useState<number | ''>('');

  // Alternate Water Supply inputs
  const [directAlternate, setDirectAlternate] = useState<number | ''>('');
  const [rooftopTank, setRooftopTank] = useState<number | ''>('');
  const [aquiferRecharge, setAquiferRecharge] = useState<number | ''>('');
  const [surfaceRunoff, setSurfaceRunoff] = useState<number | ''>('');
  const [reuseWater, setReuseWater] = useState<number | ''>('');

  // Result and error states
  const [waterSupplyResult, setWaterSupplyResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Add state for water gap calculation
  const [waterGapData, setWaterGapData] = useState<{[year: string]: number} | null>(null);
  
  // Add state to track if initial calculation has been done
  const [hasCalculated, setHasCalculated] = useState(false);

  // Determine if conflicting groundwater inputs are provided - FIXED LOGIC
  const isDirectGroundwaterProvided = directGroundwater !== '';
  const areTubeWellInputsProvided =
    // (numTubewells !== '' && Number(numTubewells) > 0) || 
    numTubewells !== '' ||
    dischargeRate !== '' || 
    operatingHours !== ''; // FIXED: Add operatingHours check
    // (dischargeRate !== '' && Number(dischargeRate) > 0) || 
    // (operatingHours !== '' && Number(operatingHours) > 0);

  // Similarly, for alternate supply - FIXED LOGIC
  const isDirectAlternateProvided = directAlternate !== '';
  const areAlternateInputsProvided =
    // (rooftopTank !== '' && Number(rooftopTank) > 0) || 
    // (aquiferRecharge !== '' && Number(aquiferRecharge) > 0) || 
    // (surfaceRunoff !== '' && Number(surfaceRunoff) > 0) || 
    // (reuseWater !== '' && Number(reuseWater) > 0);
    rooftopTank !== '' || 
    aquiferRecharge !== '' || 
    surfaceRunoff !== '' || 
    reuseWater !== '';

  // Auto-update when inputs change (after initial calculation)
  useEffect(() => {
    if (hasCalculated) {
      calculateWaterSupply();
    }
  }, [
    surfaceWater, 
    directGroundwater, 
    numTubewells, 
    dischargeRate, 
    operatingHours, 
    directAlternate, 
    rooftopTank, 
    aquiferRecharge, 
    surfaceRunoff, 
    reuseWater
  ]);

  // Update water gap when water supply result changes
useEffect(() => {
  if (typeof window !== "undefined") {
    const totalDemand = (window as any).totalWaterDemand;
    if (waterSupplyResult !== null && totalDemand !== undefined) {
      calculateWaterGap();
    }
  }
}, [waterSupplyResult]);

  // Function to calculate water gap
  const calculateWaterGap = () => {
    // Get water demand data from the window object
    const forecastData = (window as any).selectedPopulationForecast;
    const totalWaterDemand = (window as any).totalWaterDemand || {};
    
    if (!forecastData) {
      console.error("Forecast data not available. Water gap cannot be calculated.");
      setWaterGapData(null);
      return;
    }

    if (waterSupplyResult === null) {
      setError("Please calculate water supply first.");
      return;
    }

    const waterGap: {[year: string]: number} = {};
    
    // For each year in the forecast data, calculate the gap
    Object.keys(forecastData).sort().forEach(year => {
      const totalDemand = totalWaterDemand[year] || 0;
      waterGap[year] = waterSupplyResult - totalDemand;
    });
    
    setWaterGapData(waterGap);
  };

  // Function to call the backend API to perform the calculation
  const calculateWaterSupply = async () => {
    setError(null);
    // Check for input conflicts
    if (isDirectGroundwaterProvided && areTubeWellInputsProvided) {
      setError('Error: Provide either direct Groundwater supply or tube well inputs, not both.');
      return;
    }
    if (isDirectAlternateProvided && areAlternateInputsProvided) {
      setError('Error: Provide either direct alternate supply or alternate component inputs, not both.');
      return;
    }

    // Build payload from input values
    const payload = {
      surface_water: surfaceWater === '' ? 0 : Number(surfaceWater),
      direct_groundwater: directGroundwater === '' ? 0 : Number(directGroundwater),
      num_tubewells: numTubewells === '' ? 0 : Number(numTubewells),
      discharge_rate: dischargeRate === '' ? 0 : Number(dischargeRate),
      operating_hours: operatingHours === '' ? 0 : Number(operatingHours),
      direct_alternate: directAlternate === '' ? 0 : Number(directAlternate),
      rooftop_tank: rooftopTank === '' ? 0 : Number(rooftopTank),
      aquifer_recharge: aquiferRecharge === '' ? 0 : Number(aquiferRecharge),
      surface_runoff: surfaceRunoff === '' ? 0 : Number(surfaceRunoff),
      reuse_water: reuseWater === '' ? 0 : Number(reuseWater),
    };

    try {
      const response = await fetch('http://localhost:9000/api/basic/water_supply/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const err = await response.json();
        setError(err.error || 'Error calculating water supply.');
        return;
      }
      const data = await response.json();
      setWaterSupplyResult(data.total_supply);
      // Save globally so that sewage stage can use it
      (window as any).totalWaterSupply = data.total_supply;
      
      // Mark that initial calculation has been done
      setHasCalculated(true);
    } catch (err) {
      console.error(err);
      setError('Error connecting to backend.');
    }
  };

  // Handle initial calculation button click
  const handleCalculateWaterSupply = () => {
        calculateWaterSupply();
  };

  return (
  <div className="p-6 border rounded-lg bg-gradient-to-br from-white to-gray-50 shadow-lg">
    <div className="flex items-center mb-4">
      <h3 className="text-2xl font-bold text-gray-800">Water Supply Calculation</h3>
      <div className="relative ml-2 group">
        <span className="flex items-center justify-center h-5 w-5 text-sm bg-blue-600 text-white rounded-full cursor-help transition-transform hover:scale-110">i</span>
        <div className="absolute z-10 hidden group-hover:block w-72 text-gray-700 text-xs rounded-lg p-3 bg-white shadow-xl -mt-8 left-6 border border-gray-200">
          Water supply plays a critical role in determining sewage generation within a region. The total water supplied directly influences wastewater production, which must be effectively managed through sewage treatment systems.
        </div>
      </div>
    </div>

    {/* Surface Water Supply Section */}
    <div className="mb-6 p-4 border rounded-lg bg-blue-50/50 shadow-sm">
      <h4 className="font-semibold text-lg text-blue-700">Surface Water Supply (SWS)</h4>
      <div className="mt-3">
        <label className="block text-sm font-medium text-gray-700">
          Surface Water Supply (in MLD):
        </label>
        <input
          type="number"
          value={surfaceWater}
          onChange={(e) =>
            setSurfaceWater(e.target.value === '' ? '' : Number(e.target.value))
          }
          className="mt-2 block w-1/3 border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          placeholder="Enter MLD"
          min="0"
        />
      </div>
    </div>

    {/* Groundwater Supply Section */}
    <div className="mb-6 p-4 border rounded-lg bg-blue-50/50 shadow-sm">
      <h4 className="font-semibold text-lg text-blue-700">Groundwater Supply (GWS)</h4>
      <div className="mt-3">
        <label className="block text-sm font-medium text-gray-700">
          Direct Groundwater Supply (in MLD):
        </label>
        <input
          type="number"
          value={directGroundwater}
          onChange={(e) =>
            setDirectGroundwater(e.target.value === '' ? '' : Number(e.target.value))
          }
          className={`mt-2 block w-1/3 border border-gray-300 rounded-lg px-3 py-2 ${
            areTubeWellInputsProvided ? 'bg-gray-200 cursor-not-allowed' : 'bg-white'
          } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
          placeholder="Enter MLD"
          min="0"
          disabled={areTubeWellInputsProvided}
        />
      </div>
      <div className="mt-3 text-center text-sm font-medium text-gray-600">OR</div>
      <div className="mt-3 grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 flex items-center">
            Number of Tube-wells:
            <div className="relative ml-1 group">
              <span className="flex items-center justify-center h-5 w-5 text-sm bg-blue-600 text-white rounded-full cursor-help transition-transform hover:scale-110">i</span>
              <div className="absolute z-10 hidden group-hover:block w-64 text-gray-700 text-xs rounded-lg p-3 bg-white shadow-xl -mt-12 ml-6 border border-gray-200">
                All three tube-well fields (Number, Discharge Rate, and Operating Hours) must be filled for the calculation to work properly.
              </div>
            </div>
          </label>
          <input
            type="number"
            value={numTubewells}
            onChange={(e) =>
              setNumTubewells(e.target.value === '' ? '' : Number(e.target.value))
            }
            className={`mt-2 block w-full border border-gray-300 rounded-lg px-3 py-2 ${
              isDirectGroundwaterProvided ? 'bg-gray-200 cursor-not-allowed' : 'bg-white'
            } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
            placeholder="Enter number"
            min="0"
            disabled={isDirectGroundwaterProvided}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Avg Discharge Rate (lt/hrs):
          </label>
          <input
            type="number"
            value={dischargeRate}
            onChange={(e) =>
              setDischargeRate(e.target.value === '' ? '' : Number(e.target.value))
            }
            className={`mt-2 block w-full border border-gray-300 rounded-lg px-3 py-2 ${
              isDirectGroundwaterProvided ? 'bg-gray-200 cursor-not-allowed' : 'bg-white'
            } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
            placeholder="Enter rate"
            min="0"
            disabled={isDirectGroundwaterProvided}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Operating Hours:
          </label>
          <input
            type="number"
            value={operatingHours}
            onChange={(e) =>
              setOperatingHours(e.target.value === '' ? '' : Number(e.target.value))
            }
            className={`mt-2 block w-full border border-gray-300 rounded-lg px-3 py-2 ${
              isDirectGroundwaterProvided ? 'bg-gray-200 cursor-not-allowed' : 'bg-white'
            } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
            placeholder="Enter hours"
            min="0"
            disabled={isDirectGroundwaterProvided}
          />
        </div>
      </div>
    </div>

    {/* Alternate Water Supply Section */}
    <div className="mb-6 p-4 border rounded-lg bg-blue-50/50 shadow-sm">
      <h4 className="font-semibold text-lg text-blue-700">Alternate Water Supply (AWS)</h4>
      <div className="mt-3">
        <label className="block text-sm font-medium text-gray-700">
          Direct Alternate Water Supply (in MLD):
        </label>
        <input
          type="number"
          value={directAlternate}
          onChange={(e) =>
            setDirectAlternate(e.target.value === '' ? '' : Number(e.target.value))
          }
          className={`mt-2 block w-1/3 border border-gray-300 rounded-lg px-3 py-2 ${
            areAlternateInputsProvided ? 'bg-gray-200 cursor-not-allowed' : 'bg-white'
          } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
          placeholder="Enter MLD"
          min="0"
          disabled={areAlternateInputsProvided}
        />
      </div>
      <div className="mt-3 text-center text-sm font-medium text-gray-600">OR</div>
      <div className="mt-3 grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 flex items-center">
            Roof-top Harvesting (Rain-tank Storage) (MLD):
            <div className="relative ml-1 group">
              <span className="flex items-center justify-center h-5 w-5 text-sm bg-blue-600 text-white rounded-full cursor-help transition-transform hover:scale-110">i</span>
              <div className="absolute z-10 hidden group-hover:block w-64 text-gray-700 text-xs rounded-lg p-3 bg-white shadow-xl -mt-12 ml-6 border border-gray-200">
                At least one of the four alternate water supply component fields must be filled for the calculation to reflect in the table.
              </div>
            </div>
          </label>
          <input
            type="number"
            value={rooftopTank}
            onChange={(e) =>
              setRooftopTank(e.target.value === '' ? '' : Number(e.target.value))
            }
            className={`mt-2 block w-full border border-gray-300 rounded-lg px-3 py-2 ${
              isDirectAlternateProvided ? 'bg-gray-200 cursor-not-allowed' : 'bg-white'
            } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
            placeholder="Enter MLD"
            min="0"
            disabled={isDirectAlternateProvided}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Aquifer Recharge (MLD):
          </label>
          <input
            type="number"
            value={aquiferRecharge}
            onChange={(e) =>
              setAquiferRecharge(e.target.value === '' ? '' : Number(e.target.value))
            }
            className={`mt-2 block w-full border border-gray-300 rounded-lg px-3 py-2 ${
              isDirectAlternateProvided ? 'bg-gray-200 cursor-not-allowed' : 'bg-white'
            } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
            placeholder="Enter MLD"
            min="0"
            disabled={isDirectAlternateProvided}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Surface Runoff Storage (MLD):
          </label>
          <input
            type="number"
            value={surfaceRunoff}
            onChange={(e) =>
              setSurfaceRunoff(e.target.value === '' ? '' : Number(e.target.value))
            }
            className={`mt-2 block w-full border border-gray-300 rounded-lg px-3 py-2 ${
              isDirectAlternateProvided ? 'bg-gray-200 cursor-not-allowed' : 'bg-white'
            } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
            placeholder="Enter MLD"
            min="0"
            disabled={isDirectAlternateProvided}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Reuse Potential of Treated Wastewater (MLD):
          </label>
          <input
            type="number"
            value={reuseWater}
            onChange={(e) =>
              setReuseWater(e.target.value === '' ? '' : Number(e.target.value))
            }
            className={`mt-2 block w-full border border-gray-300 rounded-lg px-3 py-2 ${
              isDirectAlternateProvided ? 'bg-gray-200 cursor-not-allowed' : 'bg-white'
            } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
            placeholder="Enter MLD"
            min="0"
            disabled={isDirectAlternateProvided}
          />
        </div>
      </div>
    </div>

    {/* Error display */}
    {error && <div className="mb-6 text-red-600 font-medium">{error}</div>}

    <div className="flex space-x-4">
      {!hasCalculated ? (
        <button
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          onClick={handleCalculateWaterSupply}
        >
          Calculate Water Supply
        </button>
      ) : (
        <div className="flex space-x-4 items-center">
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            onClick={handleCalculateWaterSupply}
          >
            Recalculate Water Supply
          </button>
          <div className="relative group">
            <span className="flex items-center justify-center h-5 w-5 text-sm bg-blue-600 text-white rounded-full cursor-help transition-transform hover:scale-110">i</span>
            <div className="absolute z-10 hidden group-hover:block w-64 text-gray-700 text-xs rounded-lg p-3 bg-white shadow-xl -mt-12 ml-6 border border-gray-200">
              Auto Update when input change
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Result display */}
    {waterSupplyResult !== null && (
      <div className="mt-6 p-4 border rounded-lg bg-green-50/50 shadow-sm">
        <h4 className="font-semibold text-lg text-green-700">Total Water Supply for Selected Region:</h4>
        <p className="text-xl font-medium text-gray-800">{waterSupplyResult.toFixed(2)} MLD</p>
      </div>
    )}

    {/* Water Gap Table */}
    {waterGapData && waterSupplyResult !== null && (
      <div className="mt-8">
        <h4 className="text-xl font-semibold text-gray-800 mb-4">Water Gap Analysis</h4>
        <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-100">
          <table className="table-auto w-full min-w-[600px] bg-white border border-gray-300 rounded-lg shadow-md">
            <thead className="bg-gradient-to-r from-blue-100 to-blue-200 sticky top-0 z-10">
              <tr>
                <th className="border-b border-gray-300 px-6 py-3 text-left text-sm font-semibold text-gray-800">Year</th>
                <th className="border-b border-gray-300 px-6 py-3 text-left text-sm font-semibold text-gray-800">Water Supply (MLD)</th>
                <th className="border-b border-gray-300 px-6 py-3 text-left text-sm font-semibold text-gray-800">Water Demand (MLD)</th>
                <th className="border-b border-gray-300 px-6 py-3 text-left text-sm font-semibold text-gray-800">Water Gap (MLD)</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(waterGapData).sort().map((year, index) => {
                const totalDemand = (window as any).totalWaterDemand?.[year] || 0;
                const gap = waterGapData[year];

                return (
                  <tr
                    key={year}
                    className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                  >
                    <td className="border-b border-gray-200 px-6 py-3 text-gray-700">{year}</td>
                    <td className="border-b border-gray-200 px-6 py-3 text-gray-700">{waterSupplyResult.toFixed(2)}</td>
                    <td className="border-b border-gray-200 px-6 py-3 text-gray-700">{totalDemand.toFixed(2)}</td>
                    <td
                      className={`border-b border-gray-200 px-6 py-3 font-medium ${
                        gap >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {gap.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Add a message below the table */}
        <div className="mt-4 p-4 border rounded-lg bg-blue-50/50 shadow-sm">
          <h5 className="font-semibold text-lg text-blue-700 mb-2">Water Gap Summary:</h5>
          <p className="text-sm text-gray-600">
            The water gap represents the difference between available water supply and calculated water demand.
            A positive gap indicates sufficient water resources, while a negative gap suggests that additional water
            supply or demand management measures may be needed.
          </p>
        </div>
      </div>
    )}
  </div>
);
};

export default WaterSupplyForm;


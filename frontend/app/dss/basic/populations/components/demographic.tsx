'use client';

import React, { useState, useEffect, useRef } from "react";

// Define an interface for the demographic data
export interface DemographicData {
  annualBirthRate: number | "";
  annualDeathRate: number | "";
  annualEmigrationRate: number | "";
  annualImmigrationRate: number | "";
}

interface DemographicProps {
  onDataChange: (data: DemographicData) => void;
  initialData?: DemographicData;
}

const DemographicPopulation: React.FC<DemographicProps> = ({ onDataChange, initialData }) => {
  const [annualBirthRate, setAnnualBirthRate] = useState<number | "">(initialData?.annualBirthRate ?? "");
  const [annualDeathRate, setAnnualDeathRate] = useState<number | "">(initialData?.annualDeathRate ?? "");
  const [annualEmigrationRate, setAnnualEmigrationRate] = useState<number | "">(initialData?.annualEmigrationRate ?? "");
  const [annualImmigrationRate, setAnnualImmigrationRate] = useState<number | "">(initialData?.annualImmigrationRate ?? "");
  
  // Add a ref to track if this is the initial render
  const isInitialRender = useRef(true);
  
  // Track if the data has changed from the initial values
  const [dataChanged, setDataChanged] = useState(false);

  // Update state when initialData changes
  useEffect(() => {
    if (initialData) {
      setAnnualBirthRate(initialData.annualBirthRate);
      setAnnualDeathRate(initialData.annualDeathRate);
      setAnnualEmigrationRate(initialData.annualEmigrationRate);
      setAnnualImmigrationRate(initialData.annualImmigrationRate);
    }
  }, [initialData]);

  // Only notify parent when values actually change, not on initial render
  useEffect(() => {
    // Skip the first render
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    
    // Skip if no changes have been made yet
    if (!dataChanged) return;
    
    // Debounce the callback to reduce unnecessary updates
    const timeoutId = setTimeout(() => {
      onDataChange({
        annualBirthRate,
        annualDeathRate,
        annualEmigrationRate,
        annualImmigrationRate
      });
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [annualBirthRate, annualDeathRate, annualEmigrationRate, annualImmigrationRate, onDataChange, dataChanged]);

  // Handlers with change tracking
  const handleBirthRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDataChanged(true);
    setAnnualBirthRate(e.target.value ? Number(e.target.value) : "");
  };

  const handleDeathRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDataChanged(true);
    setAnnualDeathRate(e.target.value ? Number(e.target.value) : "");
  };

  const handleEmigrationRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDataChanged(true);
    setAnnualEmigrationRate(e.target.value ? Number(e.target.value) : "");
  };

  const handleImmigrationRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDataChanged(true);
    setAnnualImmigrationRate(e.target.value ? Number(e.target.value) : "");
  };

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex flex-col">
          <label htmlFor="birth-rate" className="font-medium">Annual Birth Rate:</label>
          <input
            type="number"
            id="birth-rate"
            name="birth_rate"
            className="border p-2 rounded-md"
            placeholder="Enter births/1000 people"
            value={annualBirthRate}
            onChange={handleBirthRateChange}
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="death-rate" className="font-medium">Annual Death Rate:</label>
          <input
            type="number"
            id="death-rate"
            name="death_rate"
            className="border p-2 rounded-md"
            placeholder="Enter deaths/1000 people"
            value={annualDeathRate}
            onChange={handleDeathRateChange}
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="emigration-rate" className="font-medium">Annual Emigration Rate:</label>
          <input
            type="number"
            id="emigration-rate"
            name="emigration_rate"
            className="border p-2 rounded-md"
            placeholder="Enter emigrations/1000 people"
            value={annualEmigrationRate}
            onChange={handleEmigrationRateChange}
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="immigration-rate" className="font-medium">Annual Immigration Rate:</label>
          <input
            type="number"
            id="immigration-rate"
            name="immigration_rate"
            className="border p-2 rounded-md"
            placeholder="Enter immigrations/1000 people"
            value={annualImmigrationRate}
            onChange={handleImmigrationRateChange}
          />
        </div>
      </div>
    </div>
  );
};

export default DemographicPopulation;
// pages/dss/basic/waterdemand/page.tsx
'use client';
import React, { useState } from 'react';
import WaterDemandForm from './components/WaterDemandForm';
// Import other components similarly

const WaterDemandPage = () => {
  const [currentStage, setCurrentStage] = useState<'population' | 'water_demand' | 'water_supply' | 'sewage'>('water_demand');

  return (
    <div className="container p-4 mt-5 bg-white rounded-lg shadow-md">

      {currentStage === 'water_demand' && <WaterDemandForm />}
    </div>
  );
};

export default WaterDemandPage;

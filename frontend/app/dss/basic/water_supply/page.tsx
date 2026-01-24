// app/dss/basic/waterdemand/page.tsx (or a separate page for water supply)
import React from 'react';
import WaterSupplyForm from './components/WaterSupplyForm';

const WaterSupplyPage = () => {
  return (
    <div className="container p-4 mt-5 bg-white rounded-lg shadow-md">
      <WaterSupplyForm />
    </div>
  );
};

export default WaterSupplyPage;

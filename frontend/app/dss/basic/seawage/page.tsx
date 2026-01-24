// app/dss/basic/sewage/page.tsx
import React from 'react';
import SewageCalculationForm from './components/SewageCalculationForm';

const SewagePage: React.FC = () => {
  return (
    <div className="container p-4 mt-5 bg-white rounded-lg shadow-md">
      <SewageCalculationForm />
    </div>
  );
};

export default SewagePage;

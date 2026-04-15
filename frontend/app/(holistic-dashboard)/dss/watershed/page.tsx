'use client';
import React from 'react';
import dynamic from 'next/dynamic';

// Dynamic import for the WatershedMap component with no SSR
// This is necessary because Leaflet requires browser APIs and won't work with server-side rendering
const WatershedMap = dynamic(
  () => import('./components/WatershedMap'),
  { ssr: false }
);

export default function WatershedPage() {
  return (
    <div className="min-h-screen">
      <WatershedMap />
    </div>
  );
}
"use client";

import React from "react";
import { AlertTriangle, Link2, ShieldAlert } from "lucide-react";

const HabitatFragmentationInvasiveSpeciesPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h1 className="text-5xl font-bold text-blue-900 mb-4">
              Habitat Fragmentation and Invasive Species
            </h1>
            <p className="text-xl text-gray-700">
              Understanding ecological stressors that reduce habitat quality and biodiversity
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="flex items-center mb-6">
              <AlertTriangle className="w-12 h-12 text-orange-600 mr-4" />
              <h2 className="text-3xl font-bold text-blue-900">Ecological Stress Assessment</h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              Jeevant Ganga tracks habitat fragmentation and invasive species distribution to identify pressure zones
              across river stretches and associated wetland systems.
            </p>
            <p className="text-gray-700 leading-relaxed">
              The section supports data-driven prioritization by highlighting where habitat continuity is broken and
              where invasive spread threatens native ecological balance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-6">
              <Link2 className="w-10 h-10 mb-4" />
              <h3 className="text-xl font-bold mb-2">Habitat Fragmentation</h3>
              <ul className="text-orange-100 text-sm space-y-2">
                <li>Disruption of ecological corridors and migration pathways</li>
                <li>Patch-level habitat isolation along riparian and wetland zones</li>
                <li>Decline in habitat suitability for native species</li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-lg p-6">
              <ShieldAlert className="w-10 h-10 mb-4" />
              <h3 className="text-xl font-bold mb-2">Invasive Species Pressure</h3>
              <ul className="text-emerald-100 text-sm space-y-2">
                <li>Location-wise mapping of invasive species occurrence</li>
                <li>Spread-risk hotspots based on hydrology and disturbance</li>
                <li>Native habitat and biodiversity impact characterization</li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-3xl font-bold text-blue-900 mb-6">Response Framework</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-orange-50 p-4 rounded-lg">
                <h4 className="font-semibold text-orange-900 mb-2">Detect</h4>
                <p className="text-sm text-gray-700">Early warning through hotspot monitoring and ecological screening.</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Prioritize</h4>
                <p className="text-sm text-gray-700">Rank fragmented stretches and invasive zones for intervention.</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Restore</h4>
                <p className="text-sm text-gray-700">Reconnect habitats and reduce invasive pressure through phased actions.</p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
            <p className="text-orange-900">
              <strong>Risk to Action:</strong> Habitat fragmentation and invasive distribution insights help shape
              restoration priorities and support measurable ecological recovery.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HabitatFragmentationInvasiveSpeciesPage;

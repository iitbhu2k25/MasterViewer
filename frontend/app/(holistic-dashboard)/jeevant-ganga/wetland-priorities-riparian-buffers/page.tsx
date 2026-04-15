"use client";

import React from "react";
import { MapPin, Trees, Droplets, Target } from "lucide-react";

const WetlandPrioritiesRiparianBuffersPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h1 className="text-5xl font-bold text-blue-900 mb-4">
              Wetland Priorities and Riparian Buffers
            </h1>
            <p className="text-xl text-gray-700">
              Identifying restoration priorities through island mapping and buffer-quality assessment
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="flex items-center mb-6">
              <Target className="w-12 h-12 text-green-700 mr-4" />
              <h2 className="text-3xl font-bold text-blue-900">Restoration Priority Planning</h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              This module captures wetland restoration priorities, biodiversity island locations, and riparian buffer
              quality to support ecological restoration of the river system.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Data layers combine sensitivity, habitat value, and intervention readiness to guide sequencing of
              restoration investments and on-ground actions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6">
              <Droplets className="w-10 h-10 mb-4" />
              <h3 className="text-xl font-bold mb-2">Wetland Priority Zones</h3>
              <p className="text-blue-100 text-sm">
                Priority ranking based on degradation level, ecological function, and restoration potential
              </p>
            </div>
            <div className="bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-lg p-6">
              <MapPin className="w-10 h-10 mb-4" />
              <h3 className="text-xl font-bold mb-2">Biodiversity Islands</h3>
              <p className="text-teal-100 text-sm">
                Spatial identification of high-value conservation patches for ecosystem continuity
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6">
              <Trees className="w-10 h-10 mb-4" />
              <h3 className="text-xl font-bold mb-2">Riparian Buffer Quality</h3>
              <p className="text-green-100 text-sm">
                Monitoring bank-side vegetation and buffering capacity to improve resilience
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-3xl font-bold text-blue-900 mb-6">Implementation Sequence</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">1. Baseline Mapping</h3>
                <p className="text-gray-700">Map ecological sensitivity, habitat condition, and intervention feasibility.</p>
              </div>
              <div className="border-l-4 border-teal-500 pl-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">2. Priority Identification</h3>
                <p className="text-gray-700">Select top wetland and riparian sites for phased restoration programs.</p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">3. Outcome Monitoring</h3>
                <p className="text-gray-700">Track biodiversity recovery and buffer quality improvements over time.</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <p className="text-green-900">
              <strong>Priority Dashboard:</strong> Restoration priorities and riparian buffer indicators support
              transparent planning, targeted implementation, and measurable ecosystem recovery.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WetlandPrioritiesRiparianBuffersPage;

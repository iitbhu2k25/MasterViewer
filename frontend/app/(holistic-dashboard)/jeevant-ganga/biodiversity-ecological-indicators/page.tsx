"use client";

import React from "react";
import { Fish, Leaf, Waves } from "lucide-react";

const BiodiversityEcologicalIndicatorsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h1 className="text-5xl font-bold text-blue-900 mb-4">
              Biodiversity and Ecological Indicators
            </h1>
            <p className="text-xl text-gray-700">
              Tracking ecosystem health through species, habitat, and resilience indicators
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="flex items-center mb-6">
              <Fish className="w-12 h-12 text-cyan-700 mr-4" />
              <h2 className="text-3xl font-bold text-blue-900">Jeevant Ganga Overview</h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              The Jeevant Ganga dashboard captures biodiversity and ecological indicators across the river
              system, including fish habitat zones, riparian vegetation, wetlands, and ponds.
            </p>
            <p className="text-gray-700 leading-relaxed">
              These indicators help identify ecological stress, support restoration planning, and improve
              long-term environmental outcomes through evidence-based management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-lg p-6">
              <Fish className="w-10 h-10 mb-4" />
              <h3 className="text-xl font-bold mb-2">Fish Habitat Zones</h3>
              <p className="text-cyan-100 text-sm">
                Mapping habitat quality and breeding-support stretches for aquatic biodiversity
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6">
              <Leaf className="w-10 h-10 mb-4" />
              <h3 className="text-xl font-bold mb-2">Riparian Vegetation</h3>
              <p className="text-green-100 text-sm">
                Assessing riverbank vegetation as a key stabilizer of ecosystems and water quality
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6">
              <Waves className="w-10 h-10 mb-4" />
              <h3 className="text-xl font-bold mb-2">Wetlands and Ponds</h3>
              <p className="text-blue-100 text-sm">
                Monitoring critical ecological assets that sustain biodiversity and hydrological balance
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-3xl font-bold text-blue-900 mb-6">Key Indicator Categories</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-cyan-500 pl-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Biological Indicators</h3>
                <p className="text-gray-700">Species richness, aquatic habitat condition, and ecological connectivity.</p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Landscape Indicators</h3>
                <p className="text-gray-700">Riparian cover continuity, wetland extent, and vegetation health.</p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Functional Indicators</h3>
                <p className="text-gray-700">Buffer performance, habitat support capacity, and ecosystem resilience.</p>
              </div>
            </div>
          </div>

          <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-6">
            <p className="text-cyan-900">
              <strong>Ecosystem Intelligence:</strong> Detailed ecological indicators from Jeevant Ganga support
              targeted interventions and better restoration decisions in the dashboard workflow.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BiodiversityEcologicalIndicatorsPage;

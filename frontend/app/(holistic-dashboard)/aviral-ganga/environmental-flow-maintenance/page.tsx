"use client";

import React from 'react';
import { Activity, Waves, TrendingUp, ShieldCheck } from 'lucide-react';

const EFlowPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-12">
                        <h1 className="text-5xl font-bold text-blue-900 mb-4">Environmental Flow Maintenance</h1>
                        <p className="text-xl text-gray-700">Ensuring ecological integrity through sustainable flow regimes</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                        <div className="flex items-center mb-6">
                            <Waves className="w-12 h-12 text-blue-500 mr-4" />
                            <h2 className="text-3xl font-bold text-blue-900">Overview</h2>
                        </div>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            Environmental Flow (e-flow) refers to the quantity, timing, and quality of freshwater flows and levels
                            necessary to sustain aquatic ecosystems which, in turn, support human cultures, economies,
                            sustainable livelihoods, and well-being.
                        </p>
                        <p className="text-gray-700 leading-relaxed">
                            Maintaining e-flows is critical for the survival of aquatic species, maintenance of river
                            morphology, and ensuring the river's self-purification capacity. Our system monitors
                            cross-sectional requirements and highlights dredging or morphological interventions.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6">
                            <Activity className="w-10 h-10 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Flow Requirements</h3>
                            <p className="text-blue-100 text-sm">Identifying cross-sections needed for ecological flows</p>
                        </div>
                        <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-lg p-6">
                            <TrendingUp className="w-10 h-10 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Morphological Interventions</h3>
                            <p className="text-cyan-100 text-sm">Targeted dredging and channel improvements</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6">
                            <ShieldCheck className="w-10 h-10 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Ecological Integrity</h3>
                            <p className="text-green-100 text-sm">Sustaining biodiversity and river health</p>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <p className="text-blue-800">
                            <strong>Data Analysis:</strong> Detailed monitoring of e-flow compliance and morphological
                            status is available in the Dashboard. Interactive maps show identified priority zones for
                            intervention.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EFlowPage;

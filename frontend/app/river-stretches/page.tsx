"use client";

import React from 'react';
import { Waves, MapPin, TrendingDown } from 'lucide-react';

const RiverStretchesPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-6">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-12">
                        <h1 className="text-5xl font-bold text-blue-900 mb-4">River Stretches</h1>
                        <p className="text-xl text-gray-700">
                            Detailed information about river stretches and their characteristics
                        </p>
                    </div>

                    {/* Introduction */}
                    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                        <div className="flex items-center mb-6">
                            <Waves className="w-12 h-12 text-blue-600 mr-4" />
                            <h2 className="text-3xl font-bold text-blue-900">Overview</h2>
                        </div>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            River stretches are defined segments of a river used for systematic monitoring, assessment,
                            and management. Each stretch is characterized by specific geographical, hydrological, and
                            environmental parameters that guide targeted interventions.
                        </p>
                        <p className="text-gray-700 leading-relaxed">
                            Our holistic approach includes detailed mapping and continuous monitoring of river stretches
                            across the Varuna, Assi, and other tributaries, enabling precise identification of problem
                            areas and effective resource allocation.
                        </p>
                    </div>

                    {/* Key Features */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6">
                            <MapPin className="w-10 h-10 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Geographic Mapping</h3>
                            <p className="text-blue-100 text-sm">
                                Precise GPS coordinates and spatial data for each river stretch
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-lg p-6">
                            <Waves className="w-10 h-10 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Flow Characteristics</h3>
                            <p className="text-cyan-100 text-sm">
                                Analysis of flow patterns, velocity, and discharge volumes
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6">
                            <TrendingDown className="w-10 h-10 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Pollution Load</h3>
                            <p className="text-green-100 text-sm">
                                Assessment of point and non-point pollution sources
                            </p>
                        </div>
                    </div>

                    {/* Sample Data Section */}
                    <div className="bg-white rounded-lg shadow-lg p-8">
                        <h2 className="text-3xl font-bold text-blue-900 mb-6">Monitored Parameters</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="border-l-4 border-blue-500 pl-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Physical Parameters</h3>
                                <ul className="text-gray-700 space-y-1 text-sm">
                                    <li>• Length and width of stretch</li>
                                    <li>• Depth profile and bathymetry</li>
                                    <li>• Flow velocity and discharge</li>
                                    <li>• Sediment characteristics</li>
                                </ul>
                            </div>
                            <div className="border-l-4 border-green-500 pl-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Environmental Parameters</h3>
                                <ul className="text-gray-700 space-y-1 text-sm">
                                    <li>• Water quality indicators</li>
                                    <li>• Aquatic biodiversity</li>
                                    <li>• Riparian vegetation</li>
                                    <li>• Land use patterns</li>
                                </ul>
                            </div>
                            <div className="border-l-4 border-purple-500 pl-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Pollution Sources</h3>
                                <ul className="text-gray-700 space-y-1 text-sm">
                                    <li>• Sewage discharge points</li>
                                    <li>• Industrial effluent outlets</li>
                                    <li>• Agricultural runoff areas</li>
                                    <li>• Urban drainage systems</li>
                                </ul>
                            </div>
                            <div className="border-l-4 border-orange-500 pl-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Infrastructure</h3>
                                <ul className="text-gray-700 space-y-1 text-sm">
                                    <li>• Monitoring stations</li>
                                    <li>• Treatment facilities (STPs)</li>
                                    <li>• Ghats and access points</li>
                                    <li>• Flood protection structures</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Note */}
                    <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <p className="text-blue-800">
                            <strong>Note:</strong> Detailed stretch-wise data, maps, and analytical reports are available
                            through the dashboard. Please navigate to the Dashboard section to access comprehensive data
                            and visualization tools.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RiverStretchesPage;

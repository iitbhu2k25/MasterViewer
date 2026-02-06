"use client";

import React from 'react';
import { Droplets, Activity, CheckCircle, XCircle } from 'lucide-react';

const STPPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-12">
                        <h1 className="text-5xl font-bold text-blue-900 mb-4">Sewage Treatment Plants</h1>
                        <p className="text-xl text-gray-700">Monitoring treatment infrastructure and operational efficiency</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                        <div className="flex items-center mb-6">
                            <Droplets className="w-12 h-12 text-blue-600 mr-4" />
                            <h2 className="text-3xl font-bold text-blue-900">Overview</h2>
                        </div>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            Sewage Treatment Plants (STPs) are critical infrastructure for treating domestic and commercial
                            wastewater before discharge into rivers. Effective STP operation is essential for maintaining
                            water quality and protecting aquatic ecosystems.
                        </p>
                        <p className="text-gray-700 leading-relaxed">
                            Our comprehensive STP monitoring system tracks facility locations, treatment capacity, operational
                            status, and effluent quality to identify gaps and guide infrastructure development planning.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6">
                            <Activity className="w-10 h-10 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Treatment Capacity</h3>
                            <p className="text-blue-100 text-sm">Total installed capacity across all facilities (MLD)</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6">
                            <CheckCircle className="w-10 h-10 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Operational STPs</h3>
                            <p className="text-green-100 text-sm">Currently functional treatment facilities</p>
                        </div>
                        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg p-6">
                            <XCircle className="w-10 h-10 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Treatment Gap</h3>
                            <p className="text-red-100 text-sm">Difference between generation and treatment capacity</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                        <h2 className="text-3xl font-bold text-blue-900 mb-6">Treatment Technologies</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="border-l-4 border-blue-500 pl-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Conventional Treatment</h3>
                                <ul className="text-gray-700 space-y-1 text-sm">
                                    <li>• Activated Sludge Process (ASP)</li>
                                    <li>• Sequential Batch Reactor (SBR)</li>
                                    <li>• Upflow Anaerobic Sludge Blanket (UASB)</li>
                                    <li>• Extended Aeration Process</li>
                                </ul>
                            </div>
                            <div className="border-l-4 border-green-500 pl-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced Treatment</h3>
                                <ul className="text-gray-700 space-y-1 text-sm">
                                    <li>• Membrane Bioreactor (MBR)</li>
                                    <li>• Moving Bed Biofilm Reactor (MBBR)</li>
                                    <li>• Tertiary treatment for reuse</li>
                                    <li>• Disinfection systems (UV, Chlorination)</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                        <h2 className="text-3xl font-bold text-blue-900 mb-6">Monitoring Parameters</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Operational</h3>
                                <ul className="space-y-2 text-gray-700 text-sm">
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></span>
                                        <span>Daily flow rate and volume</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></span>
                                        <span>Treatment efficiency</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></span>
                                        <span>Equipment availability</span>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Effluent Quality</h3>
                                <ul className="space-y-2 text-gray-700 text-sm">
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3"></span>
                                        <span>BOD, COD removal rates</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3"></span>
                                        <span>Suspended solids content</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3"></span>
                                        <span>Compliance with standards</span>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Maintenance</h3>
                                <ul className="space-y-2 text-gray-700 text-sm">
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3"></span>
                                        <span>Scheduled maintenance logs</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3"></span>
                                        <span>Breakdown incidents</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3"></span>
                                        <span>Operational costs</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <p className="text-blue-800">
                            <strong>STP Database:</strong> Access detailed information about all STPs including location maps,
                            capacity details, operational status, and effluent quality data through the Dashboard section.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default STPPage;

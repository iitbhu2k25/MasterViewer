"use client";

import React from 'react';
import { Droplet, AlertTriangle, Building2, Users } from 'lucide-react';

const SewageLoadPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-12">
                        <h1 className="text-5xl font-bold text-blue-900 mb-4">Sewage Load</h1>
                        <p className="text-xl text-gray-700">Assessment and management of sewage discharge into river systems</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                        <div className="flex items-center mb-6">
                            <Droplet className="w-12 h-12 text-orange-600 mr-4" />
                            <h2 className="text-3xl font-bold text-blue-900">Overview</h2>
                        </div>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            Sewage load refers to the quantity and characteristics of wastewater discharged into rivers from
                            domestic, commercial, and institutional sources. Understanding sewage loads is critical for designing
                            treatment infrastructure and managing water quality.
                        </p>
                        <p className="text-gray-700 leading-relaxed">
                            Our comprehensive assessment includes mapping of sewage discharge points, estimation of pollutant
                            loads, and tracking of treatment efficiency to guide infrastructure development and policy decisions.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-6">
                            <Building2 className="w-10 h-10 mb-4" />
                            <h3 className="text-lg font-bold mb-2">Urban Areas</h3>
                            <p className="text-orange-100 text-sm">High-density sewage generation zones</p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6">
                            <Users className="w-10 h-10 mb-4" />
                            <h3 className="text-lg font-bold mb-2">Population Load</h3>
                            <p className="text-blue-100 text-sm">Per capita sewage generation estimates</p>
                        </div>
                        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg p-6">
                            <AlertTriangle className="w-10 h-10 mb-4" />
                            <h3 className="text-lg font-bold mb-2">Untreated Discharge</h3>
                            <p className="text-red-100 text-sm">Direct sewage outfalls without treatment</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6">
                            <Droplet className="w-10 h-10 mb-4" />
                            <h3 className="text-lg font-bold mb-2">Treatment Capacity</h3>
                            <p className="text-green-100 text-sm">Existing STP infrastructure capability</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                        <h2 className="text-3xl font-bold text-blue-900 mb-6">Assessment Parameters</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Load Estimation</h3>
                                <ul className="space-y-2 text-gray-700">
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></span>
                                        <span>Population-based sewage generation rates</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></span>
                                        <span>Commercial and institutional contributions</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></span>
                                        <span>Seasonal variation in sewage volume</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></span>
                                        <span>Pollutant concentration measurements</span>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Treatment Gap Analysis</h3>
                                <ul className="space-y-2 text-gray-700">
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3"></span>
                                        <span>Comparison of generation vs treatment capacity</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3"></span>
                                        <span>Identification of untreated discharge points</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3"></span>
                                        <span>STP operational efficiency assessment</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3"></span>
                                        <span>Infrastructure development priorities</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                        <h2 className="text-3xl font-bold text-blue-900 mb-6">Key Pollutants in Sewage</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-gray-900 mb-2">Organic Matter</h4>
                                <p className="text-sm text-gray-600">BOD, COD - depletes dissolved oxygen</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-gray-900 mb-2">Nutrients</h4>
                                <p className="text-sm text-gray-600">Nitrogen, Phosphorus - causes eutrophication</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-gray-900 mb-2">Pathogens</h4>
                                <p className="text-sm text-gray-600">Bacteria, viruses - health hazards</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                        <p className="text-orange-800">
                            <strong>Detailed Analysis:</strong> Access comprehensive sewage load data, treatment gap analysis,
                            and infrastructure planning tools through the Dashboard. Maps showing discharge points and STP
                            locations are available for strategic intervention planning.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SewageLoadPage;

"use client";

import React from 'react';
import { Factory, Droplets, Shield, TrendingUp } from 'lucide-react';

const IndustriesPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-12">
                        <h1 className="text-5xl font-bold text-blue-900 mb-4">Industries</h1>
                        <p className="text-xl text-gray-700">Monitoring industrial facilities and their environmental impact</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                        <div className="flex items-center mb-6">
                            <Factory className="w-12 h-12 text-gray-700 mr-4" />
                            <h2 className="text-3xl font-bold text-blue-900">Overview</h2>
                        </div>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            Industrial activities along river corridors can significantly impact water quality through direct
                            effluent discharge, groundwater contamination, and atmospheric deposition. Systematic monitoring
                            and regulation of industrial facilities is essential for river health.
                        </p>
                        <p className="text-gray-700 leading-relaxed">
                            Our comprehensive industry database tracks facilities by type, pollution potential, compliance
                            status, and treatment measures, enabling targeted enforcement and collaborative pollution prevention.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-gray-600 to-gray-700 text-white rounded-lg p-6">
                            <Factory className="w-10 h-10 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Facility Inventory</h3>
                            <p className="text-gray-200 text-sm">Complete database of industries along river stretches</p>
                        </div>
                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-6">
                            <Droplets className="w-10 h-10 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Effluent Monitoring</h3>
                            <p className="text-orange-100 text-sm">Tracking industrial wastewater discharge quality</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6">
                            <Shield className="w-10 h-10 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Compliance Status</h3>
                            <p className="text-green-100 text-sm">Monitoring adherence to environmental standards</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                        <h2 className="text-3xl font-bold text-blue-900 mb-6">Industry Categories</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="border-l-4 border-red-500 pl-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Red Category (High Pollution)</h3>
                                <ul className="text-gray-700 space-y-1 text-sm">
                                    <li>• Pulp and paper mills</li>
                                    <li>• Tanneries and leather processing</li>
                                    <li>• Textile dyeing and printing</li>
                                    <li>• Chemical manufacturing</li>
                                </ul>
                            </div>
                            <div className="border-l-4 border-orange-500 pl-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Orange Category (Medium Pollution)</h3>
                                <ul className="text-gray-700 space-y-1 text-sm">
                                    <li>• Food processing units</li>
                                    <li>• Distilleries and breweries</li>
                                    <li>• Pharmaceutical manufacturing</li>
                                    <li>• Metal surface treatment</li>
                                </ul>
                            </div>
                            <div className="border-l-4 border-green-500 pl-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Green Category (Low Pollution)</h3>
                                <ul className="text-gray-700 space-y-1 text-sm">
                                    <li>• Small-scale manufacturing</li>
                                    <li>• Assembly operations</li>
                                    <li>• Packaging units</li>
                                    <li>• Trading establishments</li>
                                </ul>
                            </div>
                            <div className="border-l-4 border-blue-500 pl-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Special Focus</h3>
                                <ul className="text-gray-700 space-y-1 text-sm">
                                    <li>• Common Effluent Treatment Plants (CETPs)</li>
                                    <li>• Industrial clusters</li>
                                    <li>• Zero Liquid Discharge (ZLD) systems</li>
                                    <li>• Recycling and reuse initiatives</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                        <h2 className="text-3xl font-bold text-blue-900 mb-6">Monitoring & Compliance</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Regulatory Framework</h3>
                                <ul className="space-y-2 text-gray-700">
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></span>
                                        <span>Consent to Establish (CTE) requirements</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></span>
                                        <span>Consent to Operate (CTO) conditions</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></span>
                                        <span>Effluent discharge standards</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></span>
                                        <span>Environmental impact assessments</span>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Enforcement Actions</h3>
                                <ul className="space-y-2 text-gray-700">
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3"></span>
                                        <span>Regular inspection and sampling</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3"></span>
                                        <span>Compliance tracking and reporting</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3"></span>
                                        <span>Penalties for non-compliance</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3"></span>
                                        <span>Closure orders for serious violations</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                        <p className="text-gray-800">
                            <strong>Industry Database:</strong> Access the complete inventory of industrial facilities,
                            compliance records, and effluent quality data through the Dashboard. Interactive maps show
                            facility locations and their pollution potential categories.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IndustriesPage;

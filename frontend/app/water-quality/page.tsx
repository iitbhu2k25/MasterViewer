"use client";

import React from 'react';
import { Droplets, Activity, AlertTriangle, TrendingUp } from 'lucide-react';

const WaterQualityPage = () => {
    const qualityParameters = [
        { name: 'pH', description: 'Measure of acidity or alkalinity', target: '6.5 - 8.5' },
        { name: 'Dissolved Oxygen (DO)', description: 'Oxygen available to aquatic life', target: '> 5 mg/L' },
        { name: 'Biochemical Oxygen Demand (BOD)', description: 'Organic pollution indicator', target: '< 3 mg/L' },
        { name: 'Chemical Oxygen Demand (COD)', description: 'Total organic pollution', target: '< 10 mg/L' },
        { name: 'Total Dissolved Solids (TDS)', description: 'Dissolved minerals and salts', target: '< 500 mg/L' },
        { name: 'Fecal Coliform', description: 'Bacterial contamination', target: '< 2500 MPN/100ml' }
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-6">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-12">
                        <h1 className="text-5xl font-bold text-blue-900 mb-4">Water Quality</h1>
                        <p className="text-xl text-gray-700">
                            Real-time monitoring and analysis of water quality parameters
                        </p>
                    </div>

                    {/* Introduction */}
                    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                        <div className="flex items-center mb-6">
                            <Droplets className="w-12 h-12 text-cyan-600 mr-4" />
                            <h2 className="text-3xl font-bold text-blue-900">Overview</h2>
                        </div>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            Water quality monitoring is a critical component of our holistic river management system.
                            We continuously monitor multiple physical, chemical, and biological parameters to assess
                            the health of river ecosystems and identify pollution sources.
                        </p>
                        <p className="text-gray-700 leading-relaxed">
                            Our monitoring network includes automated sensors, periodic sampling, and laboratory analysis
                            to ensure comprehensive and accurate assessment of water quality across all river stretches.
                        </p>
                    </div>

                    {/* Key Indicators */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6">
                            <Activity className="w-10 h-10 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Real-Time Monitoring</h3>
                            <p className="text-green-100 text-sm">
                                Continuous data from automated sensors at key locations
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6">
                            <TrendingUp className="w-10 h-10 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Trend Analysis</h3>
                            <p className="text-blue-100 text-sm">
                                Historical data analysis to identify patterns and changes
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-6">
                            <AlertTriangle className="w-10 h-10 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Alert System</h3>
                            <p className="text-orange-100 text-sm">
                                Automated alerts when parameters exceed safe limits
                            </p>
                        </div>
                    </div>

                    {/* Water Quality Parameters */}
                    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                        <h2 className="text-3xl font-bold text-blue-900 mb-6">Key Quality Parameters</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-blue-100">
                                        <th className="px-4 py-3 text-left text-blue-900 font-semibold">Parameter</th>
                                        <th className="px-4 py-3 text-left text-blue-900 font-semibold">Description</th>
                                        <th className="px-4 py-3 text-left text-blue-900 font-semibold">Target Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {qualityParameters.map((param, index) => (
                                        <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                            <td className="px-4 py-3 font-semibold text-gray-900">{param.name}</td>
                                            <td className="px-4 py-3 text-gray-700">{param.description}</td>
                                            <td className="px-4 py-3 text-blue-700 font-medium">{param.target}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Monitoring Approach */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h3 className="text-2xl font-bold text-blue-900 mb-4">Automated Monitoring</h3>
                            <ul className="space-y-3 text-gray-700">
                                <li className="flex items-start">
                                    <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                    <span>Real-time sensors at strategic locations</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                    <span>Continuous data transmission to central server</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                    <span>Automated alert generation for threshold exceedance</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                    <span>Data visualization and dashboard integration</span>
                                </li>
                            </ul>
                        </div>
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h3 className="text-2xl font-bold text-green-900 mb-4">Manual Sampling</h3>
                            <ul className="space-y-3 text-gray-700">
                                <li className="flex items-start">
                                    <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                    <span>Periodic field sampling at designated points</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                    <span>Laboratory analysis for comprehensive parameters</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                    <span>Quality assurance and calibration verification</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                    <span>Biological and microbiological testing</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Data Access Note */}
                    <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-6">
                        <p className="text-cyan-800">
                            <strong>Access Real-Time Data:</strong> For live water quality data, interactive charts,
                            and detailed analysis reports, please visit the Dashboard section. The dashboard provides
                            comprehensive visualization tools and historical trend analysis.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WaterQualityPage;

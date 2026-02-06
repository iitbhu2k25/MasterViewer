"use client";

import React from 'react';
import { Activity, BarChart3, TrendingDown, Calendar } from 'lucide-react';

const DischargePage = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-12">
                        <h1 className="text-5xl font-bold text-blue-900 mb-4">River Discharge</h1>
                        <p className="text-xl text-gray-700">Monitoring and analysis of river flow and discharge patterns</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                        <div className="flex items-center mb-6">
                            <Activity className="w-12 h-12 text-blue-600 mr-4" />
                            <h2 className="text-3xl font-bold text-blue-900">Overview</h2>
                        </div>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            River discharge, also known as streamflow, is the volume of water flowing through a river cross-section
                            per unit time. Continuous monitoring of discharge is essential for understanding river dynamics,
                            predicting floods, managing water resources, and assessing the dilution capacity for pollutants.
                        </p>
                        <p className="text-gray-700 leading-relaxed">
                            Our monitoring network includes automated gauging stations that provide real-time discharge data,
                            enabling timely decision-making and effective water resource management.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6">
                            <BarChart3 className="w-10 h-10 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Flow Measurement</h3>
                            <p className="text-blue-100 text-sm">Continuous monitoring of water flow rates at key locations</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6">
                            <TrendingDown className="w-10 h-10 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Trend Analysis</h3>
                            <p className="text-green-100 text-sm">Historical data analysis for seasonal patterns and changes</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6">
                            <Calendar className="w-10 h-10 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Seasonal Variation</h3>
                            <p className="text-purple-100 text-sm">Tracking monsoon and dry season discharge patterns</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                        <h2 className="text-3xl font-bold text-blue-900 mb-6">Key Measurements</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="border-l-4 border-blue-500 pl-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Discharge Volume</h3>
                                <p className="text-gray-700 text-sm">Total water flow measured in cubic meters per second (m³/s)</p>
                            </div>
                            <div className="border-l-4 border-green-500 pl-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Flow Velocity</h3>
                                <p className="text-gray-700 text-sm">Speed of water movement across river sections</p>
                            </div>
                            <div className="border-l-4 border-purple-500 pl-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Water Level</h3>
                                <p className="text-gray-700 text-sm">River stage height for flood prediction and management</p>
                            </div>
                            <div className="border-l-4 border-orange-500 pl-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Cross-sectional Area</h3>
                                <p className="text-gray-700 text-sm">River channel geometry for accurate discharge calculation</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <p className="text-blue-800">
                            <strong>Real-Time Data:</strong> Access live discharge data, flow trends, and seasonal analysis
                            through the Dashboard section. Historical records and predictive models are available for water
                            resource planning and flood management.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DischargePage;

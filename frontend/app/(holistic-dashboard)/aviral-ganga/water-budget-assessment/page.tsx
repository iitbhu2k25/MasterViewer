"use client";

import React from 'react';
import { Database, TrendingUp, Droplets, Landmark } from 'lucide-react';

const WaterBudgetPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-12">
                        <h1 className="text-5xl font-bold text-blue-900 mb-4">Water Budget Assessment</h1>
                        <p className="text-xl text-gray-700">Evaluating basin-level water availability and demand</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                        <div className="flex items-center mb-6">
                            <Landmark className="w-12 h-12 text-blue-600 mr-4" />
                            <h2 className="text-3xl font-bold text-blue-900">Overview</h2>
                        </div>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            A water budget provides a comprehensive account of all water entering and leaving a river basin.
                            It is an essential tool for sustainable water management, helping to balance competing demands
                            from agriculture, industry, domestic use, and the environment.
                        </p>
                        <p className="text-gray-700 leading-relaxed">
                            Our assessment evaluates long-term flow sustainability and seasonal stress conditions,
                            enabling policy makers to align development goals with actual water availability.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-lg p-6">
                            <Database className="w-10 h-10 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Availability</h3>
                            <p className="text-indigo-100 text-sm">Quantifying surface and groundwater resources</p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6">
                            <TrendingUp className="w-10 h-10 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Demand Analysis</h3>
                            <p className="text-blue-100 text-sm">Tracking sector-wise water consumption</p>
                        </div>
                        <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-lg p-6">
                            <Droplets className="w-10 h-10 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Sustainability</h3>
                            <p className="text-cyan-100 text-sm">Ensuring balance and drought resilience</p>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <p className="text-blue-800">
                            <strong>Analytics:</strong> Sector-wise demand forecasts and availability models are integrated
                            into the Dashboard. Explore seasonal stress maps to identify vulnerable zones.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WaterBudgetPage;

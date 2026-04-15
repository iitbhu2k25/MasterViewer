"use client";

import React from 'react';
import { TrendingUp, ShoppingBag, Landmark, Users } from 'lucide-react';

const EconomicLinkagesPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-12">
                        <h1 className="text-5xl font-bold text-blue-900 mb-4">River-Based Economic Linkages</h1>
                        <p className="text-xl text-gray-700">Exploring the economic and livelihood dimensions of river systems</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                        <div className="flex items-center mb-6">
                            <ShoppingBag className="w-12 h-12 text-blue-600 mr-4" />
                            <h2 className="text-3xl font-bold text-blue-900">Arth Ganga Overview</h2>
                        </div>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            The Arth Ganga concept highlights the river as a cornerstone of the regional economy. Rivers
                            support agriculture, fisheries, tourism, and various allied economic activities that provide
                            livelihoods to millions of people.
                        </p>
                        <p className="text-gray-700 leading-relaxed">
                            This section identifies how river health directly supports these sectors and explores opportunities
                            for sustainable economic growth that reinforces the river-economy connection.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6">
                            <TrendingUp className="w-10 h-10 mb-4" />
                            <h3 className="text-lg font-bold mb-2">Agriculture</h3>
                            <p className="text-green-100 text-sm">River-fed irrigation and fertile floodplains</p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6">
                            <Users className="w-10 h-10 mb-4" />
                            <h3 className="text-lg font-bold mb-2">Fisheries</h3>
                            <p className="text-blue-100 text-sm">Sustainable aquaculture and riverine catch</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6">
                            <Landmark className="w-10 h-10 mb-4" />
                            <h3 className="text-lg font-bold mb-2">Tourism</h3>
                            <p className="text-purple-100 text-sm">Ghat economy and cultural heritage tourism</p>
                        </div>
                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-6">
                            <ShoppingBag className="w-10 h-10 mb-4" />
                            <h3 className="text-lg font-bold mb-2">Allied Sectors</h3>
                            <p className="text-orange-100 text-sm">Local crafts, transport, and trade</p>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <p className="text-blue-800">
                            <strong>Livelihood Tracking:</strong> Access reports on economic impact and livelihood
                            assessments through the Dashboard. Maps show the spatial distribution of river-dependent
                            economic clusters.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EconomicLinkagesPage;

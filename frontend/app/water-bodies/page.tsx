"use client";

import React from 'react';
import { Waves, MapPin, TrendingUp, Heart } from 'lucide-react';

const WaterBodiesPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-12">
                        <h1 className="text-5xl font-bold text-blue-900 mb-4">Water Bodies</h1>
                        <p className="text-xl text-gray-700">Comprehensive inventory and conservation of ponds, lakes, and wetlands</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                        <div className="flex items-center mb-6">
                            <Waves className="w-12 h-12 text-cyan-600 mr-4" />
                            <h2 className="text-3xl font-bold text-blue-900">Overview</h2>
                        </div>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            Water bodies including ponds, lakes, wetlands, and reservoirs are vital components of the river
                            ecosystem, providing ecological services, groundwater recharge, flood mitigation, and supporting
                            biodiversity. Many traditional water bodies have been encroached upon or degraded over time.
                        </p>
                        <p className="text-gray-700 leading-relaxed">
                            Our holistic approach includes comprehensive mapping, health assessment, and rejuvenation of water
                            bodies to restore their ecological and socio-economic functions within the river basin.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6">
                            <MapPin className="w-10 h-10 mb-4" />
                            <h3 className="text-lg font-bold mb-2">Inventory</h3>
                            <p className="text-blue-100 text-sm">Complete database of water bodies</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6">
                            <Heart className="w-10 h-10 mb-4" />
                            <h3 className="text-lg font-bold mb-2">Health Status</h3>
                            <p className="text-green-100 text-sm">Assessment of current condition</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6">
                            <TrendingUp className="w-10 h-10 mb-4" />
                            <h3 className="text-lg font-bold mb-2">Rejuvenation</h3>
                            <p className="text-purple-100 text-sm">Conservation and restoration efforts</p>
                        </div>
                        <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-lg p-6">
                            <Waves className="w-10 h-10 mb-4" />
                            <h3 className="text-lg font-bold mb-2">Connectivity</h3>
                            <p className="text-cyan-100 text-sm">Links with river systems</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                        <h2 className="text-3xl font-bold text-blue-900 mb-6">Types of Water Bodies</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="border-l-4 border-blue-500 pl-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Natural Water Bodies</h3>
                                <ul className="text-gray-700 space-y-1 text-sm">
                                    <li>• Natural ponds and lakes</li>
                                    <li>• Wetlands and marshes</li>
                                    <li>• Oxbow lakes (cutoff meanders)</li>
                                    <li>• Seasonal water bodies</li>
                                </ul>
                            </div>
                            <div className="border-l-4 border-green-500 pl-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Man-Made Water Bodies</h3>
                                <ul className="text-gray-700 space-y-1 text-sm">
                                    <li>• Temple and community ponds</li>
                                    <li>• Reservoirs and tanks</li>
                                    <li>• Step wells (baoris)</li>
                                    <li>• Storage ponds</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                        <h2 className="text-3xl font-bold text-blue-900 mb-6">Assessment Parameters</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Physical</h3>
                                <ul className="space-y-2 text-gray-700 text-sm">
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></span>
                                        <span>Surface area and depth</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></span>
                                        <span>Water storage capacity</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></span>
                                        <span>Catchment characteristics</span>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Water Quality</h3>
                                <ul className="space-y-2 text-gray-700 text-sm">
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3"></span>
                                        <span>Physico-chemical parameters</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3"></span>
                                        <span>Biological indicators</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3"></span>
                                        <span>Pollution sources</span>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Ecological</h3>
                                <ul className="space-y-2 text-gray-700 text-sm">
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3"></span>
                                        <span>Aquatic vegetation</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3"></span>
                                        <span>Faunal diversity</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3"></span>
                                        <span>Ecosystem services</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                        <h2 className="text-3xl font-bold text-blue-900 mb-6">Conservation Strategies</h2>
                        <div className="space-y-3">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-blue-900 mb-2">Desilting and Deepening</h4>
                                <p className="text-sm text-gray-700">Removal of accumulated sediments to restore storage capacity</p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-green-900 mb-2">Pollution Control</h4>
                                <p className="text-sm text-gray-700">Prevention of sewage and solid waste dumping</p>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-purple-900 mb-2">Biodiversity Enhancement</h4>
                                <p className="text-sm text-gray-700">Plantation and habitat restoration for aquatic species</p>
                            </div>
                            <div className="bg-orange-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-orange-900 mb-2">Community Engagement</h4>
                                <p className="text-sm text-gray-700">Involvement of local communities in maintenance and protection</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-6">
                        <p className="text-cyan-800">
                            <strong>Water Body Database:</strong> Access the complete inventory with location maps, health
                            assessments, and rejuvenation plans through the Dashboard. Ongoing conservation activities under
                            Amrit Sarovar and other schemes are tracked separately.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WaterBodiesPage;

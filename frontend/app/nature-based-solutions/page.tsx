"use client";

import React from 'react';
import { Leaf, Droplets, Target, ShieldCheck } from 'lucide-react';

const NatureBasedPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-12">
                        <h1 className="text-5xl font-bold text-blue-900 mb-4">Nature-Based and Decentralized Solutions</h1>
                        <p className="text-xl text-gray-700">Innovative approaches for sustainable river restoration</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                        <div className="flex items-center mb-6">
                            <Leaf className="w-12 h-12 text-green-600 mr-4" />
                            <h2 className="text-3xl font-bold text-blue-900">Overview</h2>
                        </div>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            Nature-Based Solutions (NBS) leverage natural processes to address environmental challenges like pollution,
                            flooding, and habitat loss. Complementary decentralized solutions provides localized wastewater treatment
                            and resource recovery.
                        </p>
                        <p className="text-gray-700 leading-relaxed">
                            Our strategy emphasizes solutions like constructed wetlands, phyto-remediation, and Decentralized Wastewater
                            Treatment Systems (DEWATS) that are sustainable, cost-effective, and ecologically beneficial.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6">
                            <Leaf className="w-10 h-10 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Constructed Wetlands</h3>
                            <p className="text-green-100 text-sm">Natural filtration systems for wastewater treatment</p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6">
                            <Droplets className="w-10 h-10 mb-4" />
                            <h3 className="text-xl font-bold mb-2">In-situ Treatment</h3>
                            <p className="text-blue-100 text-sm">Treating water directly within drains and river stretches</p>
                        </div>
                        <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-lg p-6">
                            <Target className="w-10 h-10 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Localized Impact</h3>
                            <p className="text-cyan-100 text-sm">Decentralized systems minimizing transport costs</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                        <h2 className="text-3xl font-bold text-blue-900 mb-6">Key Technologies</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">Biological Processes</h3>
                                <ul className="space-y-3">
                                    <li className="flex items-start">
                                        <ShieldCheck className="w-5 h-5 text-green-600 mr-2 mt-1" />
                                        <span className="text-gray-700 font-semibold">Phyto-remediation:</span>
                                        <span className="text-gray-600 ml-1">Using plants to absorb pollutants.</span>
                                    </li>
                                    <li className="flex items-start">
                                        <ShieldCheck className="w-5 h-5 text-green-600 mr-2 mt-1" />
                                        <span className="text-gray-700 font-semibold">Bio-filters:</span>
                                        <span className="text-gray-600 ml-1">Microbial films for organic matter breakdown.</span>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">Planning & Design</h3>
                                <ul className="space-y-3">
                                    <li className="flex items-start">
                                        <ShieldCheck className="w-5 h-5 text-blue-600 mr-2 mt-1" />
                                        <span className="text-gray-700 font-semibold">Watershed Approach:</span>
                                        <span className="text-gray-600 ml-1">Managing water at the local catchment level.</span>
                                    </li>
                                    <li className="flex items-start">
                                        <ShieldCheck className="w-5 h-5 text-blue-600 mr-2 mt-1" />
                                        <span className="text-gray-700 font-semibold">Adaptive Management:</span>
                                        <span className="text-gray-600 ml-1">Iterative refinement based on natural performance.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                        <p className="text-green-800">
                            <strong>NBS Dashboard:</strong> Explore location-wise NBS and DEWATS implementations.
                            The dashboard tracks performance metrics and ecological recovery indicators across projects.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NatureBasedPage;

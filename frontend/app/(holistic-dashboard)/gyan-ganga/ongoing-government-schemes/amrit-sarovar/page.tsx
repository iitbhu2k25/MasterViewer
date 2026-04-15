"use client";

import React from 'react';
import { Droplets, MapPin, CheckCircle, Clock, Target } from 'lucide-react';

const AmritSarovarPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-12">
                        <h1 className="text-5xl font-bold text-blue-900 mb-4">Amrit Sarovar Mission</h1>
                        <p className="text-xl text-gray-700">
                            Developing and rejuvenating water bodies across the district
                        </p>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                        <div className="flex items-center mb-6">
                            <Droplets className="w-12 h-12 text-blue-600 mr-4" />
                            <h2 className="text-3xl font-bold text-blue-900">Mission Overview</h2>
                        </div>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            Amrit Sarovar is a flagship scheme launched as part of Azadi Ka Amrit Mahotsav, aimed at developing
                            and rejuvenating 75 water bodies in each district of the country. The mission focuses on conservation
                            of traditional water bodies, which play a crucial role in groundwater recharge, biodiversity
                            conservation, and community water security.
                        </p>
                        <p className="text-gray-700 leading-relaxed">
                            In our district, the mission targets identification, desilting, beautification, and sustainable
                            management of ponds, lakes, and other water bodies through community participation and government
                            support.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6">
                            <Target className="w-10 h-10 mb-4" />
                            <div className="text-3xl font-bold mb-1">75</div>
                            <p className="text-blue-100 text-sm">Target Water Bodies</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6">
                            <CheckCircle className="w-10 h-10 mb-4" />
                            <div className="text-3xl font-bold mb-1">28</div>
                            <p className="text-green-100 text-sm">Completed Projects</p>
                        </div>
                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-6">
                            <Clock className="w-10 h-10 mb-4" />
                            <div className="text-3xl font-bold mb-1">32</div>
                            <p className="text-orange-100 text-sm">Ongoing Works</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6">
                            <MapPin className="w-10 h-10 mb-4" />
                            <div className="text-3xl font-bold mb-1">15</div>
                            <p className="text-purple-100 text-sm">Under Planning</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                        <h2 className="text-3xl font-bold text-blue-900 mb-6">Key Objectives</h2>
                        <div className="space-y-4">
                            <div className="border-l-4 border-blue-500 pl-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Water Conservation</h3>
                                <p className="text-gray-700">
                                    Increase water storage capacity through desilting and deepening of traditional water bodies
                                    to enhance groundwater recharge and surface water availability
                                </p>
                            </div>
                            <div className="border-l-4 border-green-500 pl-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Biodiversity Enhancement</h3>
                                <p className="text-gray-700">
                                    Restore aquatic ecosystems through plantation, wetland conservation, and protection of habitats
                                    for birds, fish, and other wildlife
                                </p>
                            </div>
                            <div className="border-l-4 border-purple-500 pl-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Community Engagement</h3>
                                <p className="text-gray-700">
                                    Involve local communities in planning, implementation, and long-term maintenance through
                                    participatory approaches and capacity building
                                </p>
                            </div>
                            <div className="border-l-4 border-orange-500 pl-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Economic Benefits</h3>
                                <p className="text-gray-700">
                                    Create opportunities for livelihood enhancement through fisheries, aquaculture, tourism,
                                    and other water body-based economic activities
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                        <h2 className="text-3xl font-bold text-blue-900 mb-6">Implementation Activities</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Physical Works</h3>
                                <ul className="space-y-2 text-gray-700">
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></span>
                                        <span>Desilting and excavation to restore water storage capacity</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></span>
                                        <span>Bund strengthening and fencing for protection</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></span>
                                        <span>Inlet and outlet improvement for water flow management</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></span>
                                        <span>Ghat construction and beautification</span>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Environmental Measures</h3>
                                <ul className="space-y-2 text-gray-700">
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3"></span>
                                        <span>Plantation of native species around water bodies</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3"></span>
                                        <span>Prevention of pollution through source control</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3"></span>
                                        <span>Aquatic biodiversity conservation initiatives</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3"></span>
                                        <span>Community awareness and education programs</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <p className="text-blue-800">
                            <strong>Track Progress:</strong> For detailed information about specific water bodies under the
                            Amrit Sarovar Mission, including location maps, before-after photos, and implementation timelines,
                            please visit the Dashboard or Water Bodies section.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AmritSarovarPage;

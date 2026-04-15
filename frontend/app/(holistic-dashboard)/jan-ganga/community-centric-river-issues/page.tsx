"use client";

import React from 'react';
import { AlertTriangle, Users, MessageSquare, Target } from 'lucide-react';

const CommunityIssuesPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-12">
                        <h1 className="text-5xl font-bold text-blue-900 mb-4">Community-Centric River Issues</h1>
                        <p className="text-xl text-gray-700">Addressing social vulnerabilities through participatory interventions</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                        <div className="flex items-center mb-6">
                            <MessageSquare className="w-12 h-12 text-orange-600 mr-4" />
                            <h2 className="text-3xl font-bold text-blue-900">Overview</h2>
                        </div>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            Identifying and addressing river-related issues through the lens of local communities is essential for equitable
                            management. This section highlights river stretches where social vulnerability is high and where
                            community-led interventions can make a significant difference.
                        </p>
                        <p className="text-gray-700 leading-relaxed">
                            Our approach involves identifying localized problems such as poor access to clean water, lack of
                            sanitation facilities, and environmental health risks, and designing participatory solutions.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-6">
                            <AlertTriangle className="w-10 h-10 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Vulnerability Zones</h3>
                            <p className="text-orange-100 text-sm">Mapping areas with high social and environmental risk</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6">
                            <Users className="w-10 h-10 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Participatory Action</h3>
                            <p className="text-green-100 text-sm">Community-led monitoring and conservation efforts</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                        <h2 className="text-3xl font-bold text-blue-900 mb-6">Key Focus Areas</h2>
                        <ul className="space-y-4">
                            <li className="flex items-start">
                                <Target className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                                <div>
                                    <h4 className="font-bold text-gray-900">Access and Equity</h4>
                                    <p className="text-gray-600">Ensuring all community segments have safe and equitable access to river resources.</p>
                                </div>
                            </li>
                            <li className="flex items-start">
                                <Target className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                                <div>
                                    <h4 className="font-bold text-gray-900">Environmental Justice</h4>
                                    <p className="text-gray-600">Addressing the disproportionate impact of pollution on marginalized communities.</p>
                                </div>
                            </li>
                            <li className="flex items-start">
                                <Target className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                                <div>
                                    <h4 className="font-bold text-gray-900">Local Knowledge Integration</h4>
                                    <p className="text-gray-600">Incorporating traditional wisdom and local observations into river management plans.</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                        <p className="text-orange-800">
                            <strong>Active Intervention Mapping:</strong> View localized issues and community-centric
                            planning dashboards. See how participatory interventions are tracked and measured for impact.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommunityIssuesPage;

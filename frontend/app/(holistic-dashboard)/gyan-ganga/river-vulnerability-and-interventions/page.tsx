"use client";

import React from 'react';
import { AlertTriangle, Target, MapPin, CheckCircle } from 'lucide-react';

const RiverVulnerabilitiesPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-12">
                        <h1 className="text-5xl font-bold text-blue-900 mb-4">River Vulnerabilities & Intervention</h1>
                        <p className="text-xl text-gray-700">Identifying threats and implementing targeted conservation measures</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                        <div className="flex items-center mb-6">
                            <AlertTriangle className="w-12 h-12 text-red-600 mr-4" />
                            <h2 className="text-3xl font-bold text-blue-900">Vulnerability Assessment</h2>
                        </div>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            River vulnerability assessment identifies critical threats to ecosystem health, water quality, and
                            sustainable water resources. Our comprehensive evaluation considers physical, chemical, biological,
                            and socio-economic factors affecting river systems.
                        </p>
                        <p className="text-gray-700 leading-relaxed">
                            Based on vulnerability assessments, we design and implement targeted interventions to restore
                            ecosystem functions, improve water quality, and build resilience against environmental stressors.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg p-6">
                            <AlertTriangle className="w-10 h-10 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Key Vulnerabilities</h3>
                            <ul className="text-red-100 text-sm space-y-2">
                                <li>• Pollution from sewage and industrial sources</li>
                                <li>• Habitat degradation and loss of biodiversity</li>
                                <li>• Encroachment on floodplains and riparian zones</li>
                                <li>• Climate change impacts on flow patterns</li>
                            </ul>
                        </div>
                        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6">
                            <CheckCircle className="w-10 h-10 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Intervention Strategies</h3>
                            <ul className="text-green-100 text-sm space-y-2">
                                <li>• Pollution control and treatment infrastructure</li>
                                <li>• Ecosystem restoration and afforestation</li>
                                <li>• Sustainable land use planning</li>
                                <li>• Community engagement and awareness</li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                        <h2 className="text-3xl font-bold text-blue-900 mb-6">Intervention Framework</h2>
                        <div className="space-y-4">
                            <div className="border-l-4 border-blue-500 pl-4">
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Assessment & Planning</h3>
                                <p className="text-gray-700">Comprehensive vulnerability analysis, stakeholder consultation, and intervention design</p>
                            </div>
                            <div className="border-l-4 border-purple-500 pl-4">
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Implementation</h3>
                                <p className="text-gray-700">Project execution through multiple phases: Technical Reports, DPR preparation, Work Award, and Completion</p>
                            </div>
                            <div className="border-l-4 border-green-500 pl-4">
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Monitoring & Evaluation</h3>
                                <p className="text-gray-700">Continuous tracking of intervention effectiveness and adaptive management based on outcomes</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                        <h2 className="text-3xl font-bold text-blue-900 mb-6">Types of Interventions</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-blue-900 mb-2">Infrastructure</h4>
                                <p className="text-sm text-gray-700">STPs, CETPs, drainage systems, ghat development</p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-green-900 mb-2">Ecological</h4>
                                <p className="text-sm text-gray-700">Wetland restoration, afforestation, biodiversity conservation</p>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-purple-900 mb-2">Social</h4>
                                <p className="text-sm text-gray-700">Community mobilization, awareness campaigns, capacity building</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <p className="text-red-800">
                            <strong>Track Interventions:</strong> Access the Dashboard to view detailed information on ongoing
                            interventions, their implementation status, location-wise progress, and effectiveness assessments.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RiverVulnerabilitiesPage;

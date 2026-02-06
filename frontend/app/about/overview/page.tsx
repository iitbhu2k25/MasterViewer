"use client";

import React from 'react';
import { Target, Users, Zap } from 'lucide-react';

const OverviewPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-12">
                        <h1 className="text-5xl font-bold text-blue-900 mb-4">Overview</h1>
                        <p className="text-xl text-gray-700">
                            Understanding the Holistic River Management System
                        </p>
                    </div>

                    {/* Introduction */}
                    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                        <h2 className="text-3xl font-bold text-blue-900 mb-4">
                            About the System
                        </h2>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            The Holistic River Management System is a comprehensive platform designed to facilitate
                            integrated water resources management through data-driven decision making, collaborative
                            intervention planning, and systematic monitoring of river ecosystems.
                        </p>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            Developed under the Smart Laboratory on Clean River (SLCR) initiative at IIT BHU, this
                            system brings together multiple stakeholders, departments, and data sources to enable
                            coordinated action for river conservation and sustainable development.
                        </p>
                        <p className="text-gray-700 leading-relaxed">
                            Our approach integrates water quality monitoring, discharge management, sewage load assessment,
                            industrial impact analysis, and ecosystem vulnerability evaluation to provide a complete
                            picture of river health and guide effective interventions.
                        </p>
                    </div>

                    {/* Key Features */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6">
                            <Target className="w-12 h-12 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Comprehensive Monitoring</h3>
                            <p className="text-blue-100">
                                Real-time data collection across multiple parameters including water quality, discharge,
                                and pollutant loads
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6">
                            <Users className="w-12 h-12 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Multi-Stakeholder Coordination</h3>
                            <p className="text-green-100">
                                Collaborative platform connecting government departments, academic institutions,
                                and community organizations
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6">
                            <Zap className="w-12 h-12 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Action-Oriented Approach</h3>
                            <p className="text-purple-100">
                                Direct implementation tracking from intervention planning through execution to completion
                            </p>
                        </div>
                    </div>

                    {/* Objectives */}
                    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                        <h2 className="text-3xl font-bold text-blue-900 mb-6">Key Objectives</h2>
                        <ul className="space-y-4">
                            <li className="flex items-start">
                                <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2 mr-4"></span>
                                <p className="text-gray-700">
                                    <strong className="text-blue-900">Data Integration:</strong> Consolidate data from
                                    multiple sources including water quality sensors, discharge gauges, satellite imagery,
                                    and field surveys
                                </p>
                            </li>
                            <li className="flex items-start">
                                <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2 mr-4"></span>
                                <p className="text-gray-700">
                                    <strong className="text-blue-900">Intervention Planning:</strong> Support systematic
                                    planning and prioritization of conservation and restoration interventions
                                </p>
                            </li>
                            <li className="flex items-start">
                                <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2 mr-4"></span>
                                <p className="text-gray-700">
                                    <strong className="text-blue-900">Progress Tracking:</strong> Monitor implementation
                                    status of interventions across different phases from technical reports to project completion
                                </p>
                            </li>
                            <li className="flex items-start">
                                <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2 mr-4"></span>
                                <p className="text-gray-700">
                                    <strong className="text-blue-900">Knowledge Sharing:</strong> Facilitate exchange of
                                    best practices, lessons learned, and technical expertise among stakeholders
                                </p>
                            </li>
                            <li className="flex items-start">
                                <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2 mr-4"></span>
                                <p className="text-gray-700">
                                    <strong className="text-blue-900">Policy Support:</strong> Provide evidence-based
                                    insights to inform policy decisions and resource allocation
                                </p>
                            </li>
                        </ul>
                    </div>

                    {/* Scope */}
                    <div className="bg-white rounded-lg shadow-lg p-8">
                        <h2 className="text-3xl font-bold text-blue-900 mb-6">System Scope</h2>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            The system currently focuses on small and medium rivers in the Varanasi region, including
                            the Varuna, Assi, and other tributaries of the Ganga. The platform is designed to be
                            scalable and adaptable for implementation in other river basins across India.
                        </p>
                        <p className="text-gray-700 leading-relaxed">
                            Coverage includes comprehensive assessment of river stretches, monitoring of water bodies,
                            tracking of sewage treatment plants, evaluation of industrial impacts, and coordination
                            of ongoing government schemes including Amrit Sarovar and Jal Jeevan Mission.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OverviewPage;

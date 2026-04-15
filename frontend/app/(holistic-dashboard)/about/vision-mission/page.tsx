"use client";

import React from 'react';
import { Eye, Target, Heart } from 'lucide-react';

const VisionMissionPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-12">
                        <h1 className="text-5xl font-bold text-blue-900 mb-4">Vision & Mission</h1>
                        <p className="text-xl text-gray-700">
                            Our guiding principles for holistic river management
                        </p>
                    </div>

                    {/* Vision */}
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-lg shadow-xl p-10 mb-8">
                        <div className="flex items-center mb-6">
                            <Eye className="w-16 h-16 mr-4" />
                            <h2 className="text-4xl font-bold">Our Vision</h2>
                        </div>
                        <p className="text-xl leading-relaxed text-blue-50">
                            To establish a sustainable, data-driven ecosystem for holistic river management that
                            ensures clean, healthy rivers while balancing environmental conservation with socio-economic
                            development, serving as a model for integrated water resources management in India and beyond.
                        </p>
                    </div>

                    {/* Mission */}
                    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                        <div className="flex items-center mb-6">
                            <Target className="w-12 h-12 text-green-600 mr-4" />
                            <h2 className="text-3xl font-bold text-blue-900">Our Mission</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="border-l-4 border-green-500 pl-4">
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    Comprehensive Data Collection & Analysis
                                </h3>
                                <p className="text-gray-700">
                                    Establish robust monitoring systems for continuous assessment of water quality, discharge,
                                    pollution sources, and ecosystem health across all river stretches and water bodies.
                                </p>
                            </div>
                            <div className="border-l-4 border-blue-500 pl-4">
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    Evidence-Based Intervention Planning
                                </h3>
                                <p className="text-gray-700">
                                    Utilize scientific data and analysis to design, prioritize, and implement effective
                                    interventions for pollution control, ecosystem restoration, and sustainable water management.
                                </p>
                            </div>
                            <div className="border-l-4 border-purple-500 pl-4">
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    Multi-Stakeholder Collaboration
                                </h3>
                                <p className="text-gray-700">
                                    Foster coordination among government departments, academic institutions, industries,
                                    and local communities to ensure integrated and effective river management.
                                </p>
                            </div>
                            <div className="border-l-4 border-orange-500 pl-4">
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    Transparent Monitoring & Accountability
                                </h3>
                                <p className="text-gray-700">
                                    Provide transparent tracking of intervention progress, fund utilization, and outcomes
                                    to ensure accountability and continuous improvement.
                                </p>
                            </div>
                            <div className="border-l-4 border-cyan-500 pl-4">
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    Capacity Building & Knowledge Sharing
                                </h3>
                                <p className="text-gray-700">
                                    Develop institutional capabilities and share best practices to strengthen the ecosystem
                                    for sustainable river management across different regions and stakeholders.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Goals */}
                    <div className="bg-white rounded-lg shadow-lg p-8">
                        <div className="flex items-center mb-6">
                            <Heart className="w-12 h-12 text-red-500 mr-4" />
                            <h2 className="text-3xl font-bold text-blue-900">Strategic Goals</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-blue-50 p-6 rounded-lg">
                                <h3 className="text-lg font-bold text-blue-900 mb-2">Environmental Sustainability</h3>
                                <p className="text-gray-700 text-sm">
                                    Restore and maintain ecological balance in river ecosystems through targeted conservation efforts
                                </p>
                            </div>
                            <div className="bg-green-50 p-6 rounded-lg">
                                <h3 className="text-lg font-bold text-green-900 mb-2">Water Quality Improvement</h3>
                                <p className="text-gray-700 text-sm">
                                    Achieve significant improvements in water quality to meet environmental and public health standards
                                </p>
                            </div>
                            <div className="bg-purple-50 p-6 rounded-lg">
                                <h3 className="text-lg font-bold text-purple-900 mb-2">Community Engagement</h3>
                                <p className="text-gray-700 text-sm">
                                    Involve local communities in conservation efforts and raise awareness about river health
                                </p>
                            </div>
                            <div className="bg-orange-50 p-6 rounded-lg">
                                <h3 className="text-lg font-bold text-orange-900 mb-2">Innovation & Technology</h3>
                                <p className="text-gray-700 text-sm">
                                    Leverage cutting-edge technologies for monitoring, analysis, and decision support
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VisionMissionPage;

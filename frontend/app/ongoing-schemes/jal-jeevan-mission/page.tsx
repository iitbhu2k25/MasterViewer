"use client";

import React from 'react';
import { Droplet, Home, TrendingUp, Users, CheckCircle } from 'lucide-react';

const JalJeevanMissionPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-12">
                        <h1 className="text-5xl font-bold text-blue-900 mb-4">Jal Jeevan Mission</h1>
                        <p className="text-xl text-gray-700">
                            Ensuring functional household tap water connections to every rural household
                        </p>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                        <div className="flex items-center mb-6">
                            <Droplet className="w-12 h-12 text-blue-600 mr-4" />
                            <h2 className="text-3xl font-bold text-blue-900">Mission Overview</h2>
                        </div>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            Jal Jeevan Mission (JJM) is a flagship programme of the Government of India aimed at providing
                            functional household tap connections (FHTC) to every rural household by 2024. The mission ensures
                            not just water availability, but also water quality, adequate quantity, and regular supply.
                        </p>
                        <p className="text-gray-700 leading-relaxed">
                            In our region, JJM implementation focuses on sustainable water source development, water supply
                            infrastructure creation, and ensuring long-term operation and maintenance through community
                            participation and institutional reforms.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6">
                            <Home className="w-10 h-10 mb-4" />
                            <div className="text-3xl font-bold mb-1">1200</div>
                            <p className="text-blue-100 text-sm">Total Households</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6">
                            <CheckCircle className="w-10 h-10 mb-4" />
                            <div className="text-3xl font-bold mb-1">450</div>
                            <p className="text-green-100 text-sm">Connections Completed</p>
                        </div>
                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-6">
                            <TrendingUp className="w-10 h-10 mb-4" />
                            <div className="text-3xl font-bold mb-1">580</div>
                            <p className="text-orange-100 text-sm">Work in Progress</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6">
                            <Users className="w-10 h-10 mb-4" />
                            <div className="text-3xl font-bold mb-1">38%</div>
                            <p className="text-purple-100 text-sm">Coverage Achieved</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                        <h2 className="text-3xl font-bold text-blue-900 mb-6">Mission Goals</h2>
                        <div className="space-y-4">
                            <div className="border-l-4 border-blue-500 pl-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Universal Coverage</h3>
                                <p className="text-gray-700">
                                    Provide functional household tap connections to 100% of rural households ensuring reliable
                                    water supply at adequate pressure
                                </p>
                            </div>
                            <div className="border-l-4 border-green-500 pl-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Water Quality Assurance</h3>
                                <p className="text-gray-700">
                                    Ensure safe drinking water meeting BIS 10500:2012 standards through regular water quality
                                    testing and treatment where required
                                </p>
                            </div>
                            <div className="border-l-4 border-purple-500 pl-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Adequate Quantity</h3>
                                <p className="text-gray-700">
                                    Provide minimum 55 liters per capita per day (LPCD) water supply to meet household needs
                                    for drinking, cooking, and sanitation
                                </p>
                            </div>
                            <div className="border-l-4 border-orange-500 pl-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Regular & Long-term Supply</h3>
                                <p className="text-gray-700">
                                    Ensure sustainable water supply infrastructure with regular maintenance and community-based
                                    operation models for long-term service delivery
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                        <h2 className="text-3xl font-bold text-blue-900 mb-6">Implementation Components</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Source Development</h3>
                                <ul className="space-y-2 text-gray-700">
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></span>
                                        <span>Groundwater source identification and development</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></span>
                                        <span>Surface water source augmentation</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></span>
                                        <span>Water treatment plants for quality improvement</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></span>
                                        <span>Recharge structures for sustainability</span>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Distribution Network</h3>
                                <ul className="space-y-2 text-gray-700">
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3"></span>
                                        <span>Overhead storage tanks and distribution mains</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3"></span>
                                        <span>House-to-house piped connections</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3"></span>
                                        <span>Metering and monitoring systems</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3"></span>
                                        <span>Leak detection and repair mechanisms</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                        <h2 className="text-3xl font-bold text-blue-900 mb-6">Institutional Mechanisms</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-blue-900 mb-2">Village Water & Sanitation Committees</h4>
                                <p className="text-sm text-gray-700">Community-based organizations for planning and management</p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-green-900 mb-2">Water Quality Testing</h4>
                                <p className="text-sm text-gray-700">Regular laboratory and field test kit-based monitoring</p>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-purple-900 mb-2">O&M Framework</h4>
                                <p className="text-sm text-gray-700">Sustainable operation and maintenance through user charges</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-600 to-green-700 text-white rounded-lg shadow-xl p-8">
                        <h2 className="text-3xl font-bold mb-4">Impact & Benefits</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h3 className="text-xl font-semibold mb-2">Health Improvements</h3>
                                <p className="text-green-100 text-sm">
                                    Reduced waterborne diseases and improved health outcomes, especially for women and children
                                </p>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-2">Time Savings</h3>
                                <p className="text-green-100 text-sm">
                                    Women freed from water collection drudgery, more time for education and economic activities
                                </p>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-2">Economic Benefits</h3>
                                <p className="text-green-100 text-sm">
                                    Reduced healthcare costs and improved productivity leading to economic advancement
                                </p>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-2">Social Equity</h3>
                                <p className="text-green-100 text-sm">
                                    Elimination of social discrimination in water access, dignified living for all
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
                        <p className="text-green-800">
                            <strong>Village-wise Progress:</strong> For detailed information about JJM implementation in
                            specific villages, connection status, water quality reports, and grievance redressal, please
                            visit the Dashboard section.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JalJeevanMissionPage;

"use client";

import React from 'react';
import Link from 'next/link';
import { Target, Droplets, TrendingUp, Users } from 'lucide-react';

const OngoingSchemesPage = () => {
    const schemes = [
        {
            title: 'Amrit Sarovar',
            description: 'Mission to develop and rejuvenate 75 water bodies in each district as part of Azadi Ka Amrit Mahotsav',
            icon: Droplets,
            color: 'from-blue-500 to-blue-600',
            href: '/ongoing-schemes/amrit-sarovar',
            stats: { total: 75, completed: 28, ongoing: 32, planned: 15 }
        },
        {
            title: 'Jal Jeevan Mission',
            description: 'Providing functional household tap connections to every rural household ensuring water quality and regular supply',
            icon: Target,
            color: 'from-green-500 to-green-600',
            href: '/ongoing-schemes/jal-jeevan-mission',
            stats: { total: 1200, completed: 450, ongoing: 580, planned: 170 }
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-6">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-12">
                        <h1 className="text-5xl font-bold text-blue-900 mb-4">Ongoing Scheme Status</h1>
                        <p className="text-xl text-gray-700">
                            Track implementation progress of major government schemes for water resources management
                        </p>
                    </div>

                    {/* Introduction */}
                    <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
                        <div className="flex items-center mb-6">
                            <TrendingUp className="w-12 h-12 text-blue-600 mr-4" />
                            <h2 className="text-3xl font-bold text-blue-900">Overview</h2>
                        </div>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            The holistic river management system integrates tracking of major government schemes aimed at
                            water resource conservation, infrastructure development, and community welfare. These schemes
                            play a vital role in achieving our water management objectives.
                        </p>
                        <p className="text-gray-700 leading-relaxed">
                            Our platform provides comprehensive monitoring of scheme implementation, from planning through
                            execution to completion, ensuring transparency and effective resource utilization.
                        </p>
                    </div>

                    {/* Scheme Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                        {schemes.map((scheme, index) => {
                            const Icon = scheme.icon;
                            return (
                                <Link
                                    key={index}
                                    href={scheme.href}
                                    className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
                                >
                                    <div className={`h-3 bg-gradient-to-r ${scheme.color}`} />
                                    <div className="p-8">
                                        {/* Icon and Title */}
                                        <div className="flex items-center mb-4">
                                            <div className={`w-16 h-16 rounded-lg bg-gradient-to-r ${scheme.color} text-white flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300`}>
                                                <Icon className="w-8 h-8" />
                                            </div>
                                            <h3 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                {scheme.title}
                                            </h3>
                                        </div>

                                        {/* Description */}
                                        <p className="text-gray-600 leading-relaxed mb-6">
                                            {scheme.description}
                                        </p>

                                        {/* Statistics */}
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                <div className="text-2xl font-bold text-gray-900">{scheme.stats.total}</div>
                                                <div className="text-xs text-gray-600">Total Projects</div>
                                            </div>
                                            <div className="bg-green-50 p-3 rounded-lg">
                                                <div className="text-2xl font-bold text-green-700">{scheme.stats.completed}</div>
                                                <div className="text-xs text-green-600">Completed</div>
                                            </div>
                                            <div className="bg-blue-50 p-3 rounded-lg">
                                                <div className="text-2xl font-bold text-blue-700">{scheme.stats.ongoing}</div>
                                                <div className="text-xs text-blue-600">Ongoing</div>
                                            </div>
                                            <div className="bg-orange-50 p-3 rounded-lg">
                                                <div className="text-2xl font-bold text-orange-700">{scheme.stats.planned}</div>
                                                <div className="text-xs text-orange-600">Planned</div>
                                            </div>
                                        </div>

                                        {/* View Details Link */}
                                        <div className="flex items-center text-blue-600 font-semibold group-hover:translate-x-2 transition-transform duration-300">
                                            View Details
                                            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Additional Info */}
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-lg shadow-xl p-8">
                        <div className="flex items-center mb-6">
                            <Users className="w-12 h-12 mr-4" />
                            <h2 className="text-3xl font-bold">Integrated Approach</h2>
                        </div>
                        <p className="text-blue-100 leading-relaxed mb-4">
                            These schemes are implemented through coordinated efforts of multiple government departments,
                            local bodies, and community organizations. Our monitoring system ensures:
                        </p>
                        <ul className="space-y-2 text-blue-100">
                            <li className="flex items-start">
                                <span className="w-2 h-2 bg-white rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                <span>Real-time tracking of project milestones and timelines</span>
                            </li>
                            <li className="flex items-start">
                                <span className="w-2 h-2 bg-white rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                <span>Transparent fund allocation and utilization monitoring</span>
                            </li>
                            <li className="flex items-start">
                                <span className="w-2 h-2 bg-white rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                <span>Quality assurance and compliance verification</span>
                            </li>
                            <li className="flex items-start">
                                <span className="w-2 h-2 bg-white rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                <span>Community feedback and grievance redressal</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OngoingSchemesPage;

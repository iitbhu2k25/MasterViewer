"use client";

import React from 'react';
import { Users, Heart, MessageCircle, Activity } from 'lucide-react';

const SocialImpactPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-12">
                        <h1 className="text-5xl font-bold text-blue-900 mb-4">Social Attachment and Impact</h1>
                        <p className="text-xl text-gray-700">Capturing the human dimension of river management</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                        <div className="flex items-center mb-6">
                            <Heart className="w-12 h-12 text-pink-600 mr-4" />
                            <h2 className="text-3xl font-bold text-blue-900">Jan Ganga Overview</h2>
                        </div>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            Jan Ganga emphasizes the deep-rooted cultural, religious, and emotional connection between people
                            and rivers. Rivers are not just water bodies; they are the lifelines of communities, shaping
                            their identities and social structures.
                        </p>
                        <p className="text-gray-700 leading-relaxed">
                            This section identifies how communities interact with and are affected by the river, including
                            cultural, domestic, occupational, and health-related dependencies.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-lg p-6">
                            <Heart className="w-10 h-10 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Cultural Connection</h3>
                            <p className="text-pink-100 text-sm">Religious rituals, festivals, and traditional heritage</p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6">
                            <Users className="w-10 h-10 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Social Dependency</h3>
                            <p className="text-blue-100 text-sm">Domestic water use and riverside leisure</p>
                        </div>
                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-6">
                            <Activity className="w-10 h-10 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Health & Impact</h3>
                            <p className="text-orange-100 text-sm">River health influence on community well-being</p>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <p className="text-blue-800">
                            <strong>Community Engagement:</strong> Social impact assessments and community feedback
                            data are integrated into the Dashboard. Learn more about local participatory initiatives and
                            their outcomes.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SocialImpactPage;

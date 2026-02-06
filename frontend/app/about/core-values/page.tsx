"use client";

import React from 'react';
import { Shield, Users, Lightbulb, Heart, Target, Award } from 'lucide-react';

const CoreValuesPage = () => {
    const coreValues = [
        {
            title: 'Integrity & Transparency',
            icon: Shield,
            color: 'blue',
            description: 'We maintain the highest standards of honesty and transparency in all our operations, ensuring data accuracy, open communication, and accountable decision-making.'
        },
        {
            title: 'Collaboration & Partnership',
            icon: Users,
            color: 'green',
            description: 'We believe in the power of collective action, fostering partnerships across government, academia, industry, and communities for holistic river management.'
        },
        {
            title: 'Scientific Excellence',
            icon: Lightbulb,
            color: 'purple',
            description: 'We are committed to rigorous scientific methods, evidence-based approaches, and continuous innovation in water resources management and environmental conservation.'
        },
        {
            title: 'Environmental Stewardship',
            icon: Heart,
            color: 'red',
            description: 'We prioritize the health and sustainability of river ecosystems, recognizing our responsibility to protect natural resources for current and future generations.'
        },
        {
            title: 'Community Empowerment',
            icon: Target,
            color: 'orange',
            description: 'We value community participation and local knowledge, empowering stakeholders through capacity building, awareness, and inclusive decision-making processes.'
        },
        {
            title: 'Excellence & Impact',
            icon: Award,
            color: 'cyan',
            description: 'We strive for excellence in all our endeavors, focusing on measurable outcomes and tangible positive impacts on water quality and ecosystem health.'
        }
    ];

    const getColorClasses = (color: string) => {
        const colorMap: any = {
            blue: { bg: 'bg-blue-100', text: 'text-blue-600', gradient: 'from-blue-500 to-blue-600' },
            green: { bg: 'bg-green-100', text: 'text-green-600', gradient: 'from-green-500 to-green-600' },
            purple: { bg: 'bg-purple-100', text: 'text-purple-600', gradient: 'from-purple-500 to-purple-600' },
            red: { bg: 'bg-red-100', text: 'text-red-600', gradient: 'from-red-500 to-red-600' },
            orange: { bg: 'bg-orange-100', text: 'text-orange-600', gradient: 'from-orange-500 to-orange-600' },
            cyan: { bg: 'bg-cyan-100', text: 'text-cyan-600', gradient: 'from-cyan-500 to-cyan-600' }
        };
        return colorMap[color] || colorMap.blue;
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-6">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-16">
                        <h1 className="text-5xl font-bold text-blue-900 mb-4">Core Values</h1>
                        <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                            The principles that guide our approach to holistic river management and sustainable development
                        </p>
                    </div>

                    {/* Introduction */}
                    <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
                        <p className="text-lg text-gray-700 leading-relaxed text-center">
                            Our core values form the foundation of everything we do. They guide our decisions, shape our
                            interactions with stakeholders, and define our commitment to protecting and restoring river
                            ecosystems through integrated, science-based management approaches.
                        </p>
                    </div>

                    {/* Core Values Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                        {coreValues.map((value, index) => {
                            const Icon = value.icon;
                            const colors = getColorClasses(value.color);
                            return (
                                <div
                                    key={index}
                                    className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group"
                                >
                                    <div className={`h-2 bg-gradient-to-r ${colors.gradient}`} />
                                    <div className="p-6">
                                        <div className={`w-16 h-16 ${colors.bg} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                            <Icon className={`w-8 h-8 ${colors.text}`} />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                                        <p className="text-gray-600 leading-relaxed">{value.description}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Ethical Framework */}
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-lg shadow-xl p-10">
                        <h2 className="text-3xl font-bold mb-6 text-center">Our Ethical Framework</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-xl font-semibold mb-3">Accountability</h3>
                                <p className="text-blue-100 leading-relaxed">
                                    We hold ourselves accountable to the communities we serve, ensuring transparent reporting
                                    of progress, challenges, and outcomes in all our interventions.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-3">Inclusivity</h3>
                                <p className="text-blue-100 leading-relaxed">
                                    We embrace diversity and ensure all stakeholders, particularly marginalized communities,
                                    have a voice in river management decisions.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-3">Long-term Perspective</h3>
                                <p className="text-blue-100 leading-relaxed">
                                    We balance immediate needs with long-term sustainability, considering the impact of our
                                    actions on future generations and ecosystem resilience.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-3">Continuous Learning</h3>
                                <p className="text-blue-100 leading-relaxed">
                                    We foster a culture of learning and adaptation, regularly evaluating our approaches and
                                    incorporating new knowledge and technologies.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CoreValuesPage;

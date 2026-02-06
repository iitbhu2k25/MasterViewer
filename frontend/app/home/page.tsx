"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Droplets, TrendingUp, Activity, Database, MapPin, Factory, Waves } from 'lucide-react';

const HomePage = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // River images for hero carousel
  const heroImages = [
    { src: '/varuna1.png', alt: 'Varuna River', title: 'Varuna River' },
    { src: '/river1.png', alt: 'Assi River', title: 'Assi River' },
    { src: '/river2.png', alt: 'Ganga River', title: 'Ganga River' },
  ];

  // Auto-rotate hero images
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Data access cards
  const dataAccessSections = [
    {
      title: 'River Stretches',
      description: 'Explore detailed information about river stretches and their characteristics',
      icon: Waves,
      href: '/river-stretches',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Water Quality',
      description: 'Access real-time water quality monitoring data and analysis',
      icon: Droplets,
      href: '/water-quality',
      color: 'from-cyan-500 to-cyan-600'
    },
    {
      title: 'Discharge Data',
      description: 'View river discharge measurements and flow trends',
      icon: Activity,
      href: '/discharge',
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Water Bodies',
      description: 'Comprehensive inventory and health status of water bodies',
      icon: MapPin,
      href: '/water-bodies',
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Industries',
      description: 'Monitor industrial facilities and their environmental impact',
      icon: Factory,
      href: '/industries',
      color: 'from-orange-500 to-orange-600'
    },
    {
      title: 'Dashboard',
      description: 'Access comprehensive analytics and intervention tracking',
      icon: Database,
      href: '/',
      color: 'from-indigo-500 to-indigo-600'
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative h-[800px] overflow-hidden">
        {/* Background Image Carousel */}
        {heroImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'
              }`}
          >
            <img
              src={image.src}
              alt={image.alt}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40" />
          </div>
        ))}

        {/* Hero Content */}
        <div className="relative z-10 h-full flex items-center">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl text-white">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Holistic River Management
              </h1>
              <p className="text-xl md:text-2xl mb-8 leading-relaxed">
                A comprehensive approach to managing and protecting our river ecosystems through
                integrated water resources management, sustainable development, and data-driven interventions.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/about/overview"
                  className="px-8 py-4 bg-white text-blue-900 font-semibold rounded-lg hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Explore Overview
                </Link>
                <Link
                  href="/data-access"
                  className="px-8 py-4 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Access Data from App
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Image Indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3 z-20">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentImageIndex
                ? 'bg-white w-8'
                : 'bg-white/50 hover:bg-white/75'
                }`}
              aria-label={`View image ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-blue-900 mb-6">
              Our Mission
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-8">
              The Holistic River Management System integrates multiple aspects of river conservation,
              including water quality monitoring, discharge management, sewage treatment, industrial
              impact assessment, and ecosystem restoration. Our data-driven approach ensures sustainable
              development while protecting our vital water resources for future generations.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div className="p-6 bg-blue-50 rounded-lg">
                <div className="text-blue-600 mb-4">
                  <TrendingUp className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-blue-900 mb-2">Data-Driven</h3>
                <p className="text-gray-600">
                  Evidence-based decision making through comprehensive data collection and analysis
                </p>
              </div>
              <div className="p-6 bg-green-50 rounded-lg">
                <div className="text-green-600 mb-4">
                  <Droplets className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-green-900 mb-2">Sustainable</h3>
                <p className="text-gray-600">
                  Balancing development needs with environmental conservation and ecosystem health
                </p>
              </div>
              <div className="p-6 bg-purple-50 rounded-lg">
                <div className="text-purple-600 mb-4">
                  <Activity className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-purple-900 mb-2">Integrated</h3>
                <p className="text-gray-600">
                  Coordinated approach across departments, stakeholders, and intervention strategies
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Data Access Section */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-blue-900 mb-4">
              Access River Management Data
            </h2>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Explore comprehensive data and insights from our holistic river management system
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {dataAccessSections.map((section, index) => {
              const Icon = section.icon;
              return (
                <Link
                  key={index}
                  href={section.href}
                  className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
                >
                  <div className={`h-2 bg-gradient-to-r ${section.color}`} />
                  <div className="p-6">
                    <div className={`inline-flex items-center justify-center w-14 h-14 rounded-lg bg-gradient-to-r ${section.color} text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {section.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {section.description}
                    </p>
                    <div className="mt-4 flex items-center text-blue-600 font-semibold text-sm group-hover:translate-x-2 transition-transform duration-300">
                      Access Data
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
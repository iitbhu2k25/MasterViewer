"use client"

import { useState, useEffect } from 'react';

// Define the type for color classes
type ColorKey = 'blue' | 'teal' | 'purple' | 'green' | 'amber' | 'cyan' | 'red' | 'indigo' | 'emerald' | 'sky' | 'orange';

// Define type for application
interface Application {
  title: string;
  subtitle?: string;
  points: string[];
  color: ColorKey;
}

// Define type for module
interface Module {
  id: number;
  title: string;
  description: string;
  icon: string;
  applications: Application[];
}

export default function GWMPage() {
  const [activeModule, setActiveModule] = useState(1);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
  }, []);
  
  const modules: Module[] = [
    {
      id: 1,
      title: "Groundwater Potential Assessment",
      description: "Identifying and mapping groundwater potential is essential for effective water resource planning. This module offers cutting-edge techniques to assess groundwater availability and suitable extraction locations.",
      icon: "/Images/icons/potential.svg", // Replace with actual path
      applications: [
        {
          title: "Suitable Pumping Location",
          subtitle: "Point-Scale Analysis",
          points: [
            "Identifies optimal well locations using hydrogeological, geospatial, and geophysical methods.",
            "Reduces over-extraction and ensures efficient groundwater utilization."
          ],
          color: "blue"
        },
        {
          title: "Groundwater Potential Zones",
          points: [
            "Uses remote sensing and GIS-based multi-criteria analysis to delineate high-potential zones.",
            "Supports sustainable water management, especially in arid and semi-arid regions."
          ],
          color: "teal"
        }
      ]
    },
    {
      id: 2,
      title: "Resource Estimation",
      description: "Accurate quantification of groundwater reserves is crucial for sustainable use. This module integrates hydrological modeling, field data, and climate projections to estimate groundwater resources.",
      icon: "/Images/icons/resource.svg", // Replace with actual path
      applications: [
        {
          title: "Regional Scale Quantification",
          points: [
            "Determines total groundwater availability across regions using recharge-discharge balance models.",
            "Supports long-term water resource planning and policy formulation."
          ],
          color: "purple"
        },
        {
          title: "Water Quality Assessment",
          points: [
            "Evaluates groundwater contamination risks from industrial, agricultural, and urban sources.",
            "Provides real-time monitoring solutions for drinking water safety."
          ],
          color: "green"
        },
        {
          title: "Vulnerable Zones",
          points: [
            "Identifies areas prone to over-extraction, saline intrusion, and contamination.",
            "Helps in groundwater conservation and regulatory measures."
          ],
          color: "amber"
        }
      ]
    },
    {
      id: 3,
      title: "Managed Aquifer Recharge (MAR)",
      description: "Enhancing natural recharge through engineered solutions is critical for groundwater sustainability. This module explores advanced MAR strategies for replenishing aquifers.",
      icon: "/Images/icons/recharge.svg", // Replace with actual path
      applications: [
        {
          title: "Regional to Local Scale Water Estimates",
          points: [
            "Assesses groundwater recharge rates at different spatial scales.",
            "Supports policymakers in developing water conservation strategies."
          ],
          color: "cyan"
        },
        {
          title: "Effect of Climate Change on Natural Recharge",
          points: [
            "Models climate change impacts on aquifer recharge and baseflow.",
            "Develops mitigation strategies for drought-prone areas."
          ],
          color: "red"
        },
        {
          title: "Site Suitability for MAR Applications",
          points: [
            "Uses GIS-based suitability mapping for artificial recharge projects.",
            "Identifies ideal locations for percolation tanks, check dams, and injection wells."
          ],
          color: "indigo"
        },
        {
          title: "Optimized Solutions",
          points: [
            "Integrates AI and machine learning for data-driven groundwater recharge solutions.",
            "Ensures cost-effective and environmentally sustainable MAR interventions."
          ],
          color: "emerald"
        }
      ]
    },
    {
      id: 4,
      title: "River-Aquifer Interaction",
      description: "Understanding the dynamic relationship between surface water and groundwater is crucial for integrated water resource management.",
      icon: "/Images/icons/river.svg", // Replace with actual path
      applications: [
        {
          title: "Baseflow Estimation",
          points: [
            "Quantifies groundwater contribution to river flow using hydrograph separation and isotopic analysis.",
            "Helps in assessing river ecosystem health and water availability during dry periods."
          ],
          color: "sky"
        },
        {
          title: "Effect of Climate Change on Lean Flow",
          subtitle: "and Mitigation Planning",
          points: [
            "Analyzes the impact of climate change on river baseflow and seasonal variations.",
            "Develops adaptive strategies such as controlled groundwater pumping and artificial recharge to maintain ecological balance."
          ],
          color: "orange"
        }
      ]
    }
  ];

  // Color mapping for different modules
  const colorClasses: Record<ColorKey, {
    bg: string;
    light: string;
    text: string;
    border: string;
    hover: string;
  }> = {
    blue: {
      bg: "bg-blue-500",
      light: "bg-blue-100",
      text: "text-blue-700",
      border: "border-blue-200",
      hover: "hover:bg-blue-600"
    },
    teal: {
      bg: "bg-teal-500",
      light: "bg-teal-100",
      text: "text-teal-700",
      border: "border-teal-200",
      hover: "hover:bg-teal-600"
    },
    purple: {
      bg: "bg-purple-500",
      light: "bg-purple-100", 
      text: "text-purple-700",
      border: "border-purple-200",
      hover: "hover:bg-purple-600"
    },
    green: {
      bg: "bg-green-500",
      light: "bg-green-100",
      text: "text-green-700", 
      border: "border-green-200",
      hover: "hover:bg-green-600"
    },
    amber: {
      bg: "bg-amber-500",
      light: "bg-amber-100",
      text: "text-amber-700",
      border: "border-amber-200",
      hover: "hover:bg-amber-600"
    },
    cyan: {
      bg: "bg-cyan-500",
      light: "bg-cyan-100",
      text: "text-cyan-700",
      border: "border-cyan-200", 
      hover: "hover:bg-cyan-600"
    },
    red: {
      bg: "bg-red-500",
      light: "bg-red-100",
      text: "text-red-700",
      border: "border-red-200",
      hover: "hover:bg-red-600"
    },
    indigo: {
      bg: "bg-indigo-500",
      light: "bg-indigo-100",
      text: "text-indigo-700",
      border: "border-indigo-200",
      hover: "hover:bg-indigo-600"
    },
    emerald: {
      bg: "bg-emerald-500",
      light: "bg-emerald-100",
      text: "text-emerald-700",
      border: "border-emerald-200",
      hover: "hover:bg-emerald-600"
    },
    sky: {
      bg: "bg-sky-500", 
      light: "bg-sky-100",
      text: "text-sky-700",
      border: "border-sky-200",
      hover: "hover:bg-sky-600"
    },
    orange: {
      bg: "bg-orange-500",
      light: "bg-orange-100",
      text: "text-orange-700",
      border: "border-orange-200",
      hover: "hover:bg-orange-600"
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Hero Section with Water Animation Background */}
      
      
      {/* Main Content Section */}
      <div className="container mx-auto px-6 py-20">
        {/* Introduction */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-6">
            Ground Water Resource Management
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Water is a critical resource that requires effective management for sustainable utilization while mitigating depletion risks.
          </p>
          <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full"></div>
        </div>
        
        {/* Module Navigation */}
        <div className="flex overflow-x-auto hide-scrollbar space-x-4 mb-12 pb-4">
          {modules.map(module => (
            <button
              key={module.id}
              onClick={() => setActiveModule(module.id)}
              className={`flex-shrink-0 px-6 py-4 rounded-full font-medium transition-all duration-300 ${
                activeModule === module.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-blue-50'
              }`}
            >
              {module.title}
            </button>
          ))}
        </div>
        
        {/* Active Module Content */}
        {modules.map(module => (
          activeModule === module.id && (
            <div key={module.id} className="animate-fadeIn">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 mb-16">
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-8 text-white">
                  <div className="flex items-center mb-4">
                    {/* This would be an actual icon in production */}
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold">{module.title}</h3>
                  </div>
                  <p className="text-blue-100 max-w-3xl">
                    {module.description}
                  </p>
                </div>
                
                <div className="p-8">
                  <h4 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                    <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </span>
                    Applications
                  </h4>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {module.applications.map((app, index) => {
                      const colorSet = colorClasses[app.color];
                      return (
                        <div 
                          key={index}
                          className={`rounded-xl overflow-hidden shadow-md border ${colorSet.border} transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}
                        >
                          <div className={`${colorSet.bg} p-4 text-white`}>
                            <h5 className="font-bold text-lg">{app.title}</h5>
                            {app.subtitle && (
                              <p className="text-sm opacity-90">{app.subtitle}</p>
                            )}
                          </div>
                          
                          <div className={`${colorSet.light} p-4`}>
                            <ul className="space-y-3">
                              {app.points.map((point, pointIndex) => (
                                <li key={pointIndex} className="flex">
                                  <svg className={`w-5 h-5 ${colorSet.text} mt-1 mr-2 flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span className="text-gray-700">{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )
        ))}
        
        {/* Why This Matters Section */}
        <div className="bg-gradient-to-br from-blue-900 to-blue-700 rounded-2xl shadow-xl p-8 text-white mb-16">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold">Why This Matters?</h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">Sustainable Management</h4>
              <p className="text-blue-100">
                Ensures sustainable water resource management in urban and rural landscapes.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">Climate Resilience</h4>
              <p className="text-blue-100">
                Supports climate resilience and disaster mitigation in water-stressed regions.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">Data-Driven Decisions</h4>
              <p className="text-blue-100">
                Helps in data-driven decision-making for water resource planners, engineers, and policymakers.
              </p>
            </div>
          </div>
        </div>
        
        {/* CTA Section */}
        <div className="text-center">
          
          
          <div className="mt-8 flex justify-center items-center">
            <div className="text-blue-600">🌍💧</div>
            <span className="text-gray-500 mx-2">Sustainable water management for a better future</span>
            <div className="text-blue-600">💧🌍</div>
          </div>
        </div>
      </div>
      
      
      
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
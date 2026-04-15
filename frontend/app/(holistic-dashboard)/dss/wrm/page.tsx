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

export default function WRMPage() {
  const [activeModule, setActiveModule] = useState(1);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
  }, []);
  
  const modules: Module[] = [
    {
      id: 1,
      title: "Demand and Forecasting",
      description: "Accurate demand assessment is crucial for ensuring water availability while preventing overuse and scarcity. This module provides real-time monitoring and predictive analytics to estimate current and future water demands.",
      icon: "/Images/icons/demand.svg", // Replace with actual path
      applications: [
        {
          title: "Current Consumption Patterns and Peak Demand Assessment",
          subtitle: "Based on Monitoring Data",
          points: [
            "Uses IoT-enabled smart meters, SCADA systems, and satellite data for real-time monitoring.",
            "Identifies peak consumption hours and seasonal variations to optimize supply.",
            "Helps prevent overloading of distribution systems and reduces non-revenue water (NRW)."
          ],
          color: "blue"
        },
        {
          title: "Future Demand Projections",
          subtitle: "Based on Demographic Trends and Consumption Patterns",
          points: [
            "Uses machine learning models to predict water demand based on population growth, urbanization, and industrial expansion.",
            "Assesses per capita consumption trends and infrastructure requirements.",
            "Supports long-term planning for municipalities, rural areas, and industrial zones."
          ],
          color: "teal"
        }
      ]
    },
    {
      id: 2,
      title: "Resource Allocation",
      description: "Optimal resource allocation ensures that water supply remains equitable, sustainable, and resilient under changing environmental and socio-economic conditions.",
      icon: "/Images/icons/allocation.svg", // Replace with actual path
      applications: [
        {
          title: "Source Sustainability",
          subtitle: "Including Social and Economic Aspects of Water Supply",
          points: [
            "Evaluates the long-term sustainability of water sources (rivers, lakes, groundwater).",
            "Integrates economic factors like water tariffs, cost recovery models, and affordability to ensure financial sustainability.",
            "Assesses social impacts, including equitable access and gender-inclusive water management."
          ],
          color: "green"
        },
        {
          title: "Source Demarcation for Different Villages and Towns",
          subtitle: "Including Future Availability",
          points: [
            "Uses GIS-based mapping to allocate water resources based on population density and future projections.",
            "Ensures fair distribution by identifying alternative water sources for high-demand areas.",
            "Supports inter-basin water transfers and integrated water supply planning."
          ],
          color: "purple"
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      {/* Main Content Section */}
      <div className="container mx-auto px-6 py-20">
        {/* Introduction */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-6">
            Water Resource Management
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Effective Water Resource Management (WRM) ensures sustainable water supply, efficient demand forecasting, and equitable resource allocation. This module integrates data-driven approaches to optimize water availability, quality, and long-term planning.
          </p>
          <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full"></div>
        </div>
        
        {/* Module Navigation */}
        <div className="relative">
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
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-blue-50 to-transparent pointer-events-none"></div>
        </div>
        
        {/* Active Module Content */}
        {modules.map(module => (
          activeModule === module.id && (
            <div key={module.id} className="animate-fadeIn">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 mb-16">
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-8 text-white">
                  <div className="flex items-center mb-4">
                    {/* Unique icon for each module */}
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mr-4">
                      {module.id === 1 && (
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      )}
                      {module.id === 2 && (
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                        </svg>
                      )}
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
                  
                  <div className="grid md:grid-cols-2 gap-6">
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
            <h3 className="text-2xl font-bold">Why This Matters? 🌍</h3>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">Water Security</h4>
              <p className="text-blue-100">
                Ensures water security by accurately forecasting future demand and optimizing supply.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">Enhanced Resilience</h4>
              <p className="text-blue-100">
                Enhances resilience to climate change by preparing for extreme weather events.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">Improved Efficiency</h4>
              <p className="text-blue-100">
                Improves efficiency in water distribution, reducing wastage and leakage.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">Equitable Access</h4>
              <p className="text-blue-100">
                Supports equitable access to clean water for both urban and rural communities.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">Strengthened Policy-Making</h4>
              <p className="text-blue-100">
                Strengthens policy-making with data-driven insights for long-term sustainability.
              </p>
            </div>
          </div>
        </div>
        
        {/* CTA Section */}
        <div className="text-center">
          <div className="mt-8 flex justify-center items-center">
            <div className="text-blue-600">💧</div>
            <span className="text-gray-500 mx-2">
              With real-time monitoring, predictive analytics, and data-driven planning, this module empowers decision-makers to build sustainable, resilient, and future-ready water supply systems.
            </span>
            <div className="text-blue-600">🌱</div>
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
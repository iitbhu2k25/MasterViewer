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

export default function BasicModulesPage() {
  const [activeModule, setActiveModule] = useState(1);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
  }, []);
  
  const modules: Module[] = [
    {
      id: 1,
      title: "Population Prediction",
      description: "Accurate population forecasting is fundamental for predicting future sewage generation. This module provides multiple analytical approaches for estimating population growth.",
      icon: "/Images/icons/population.svg", // Replace with actual path
      applications: [
        {
          title: "Time Series-Based Analysis",
          points: [
            "Uses historical demographic data to project population trends.",
            "Allows analysis at different levels (district, sub-district, ward, village)."
          ],
          color: "blue"
        },
        {
          title: "Machine Learning-Based Methods",
          points: [
            "Employs artificial neural networks (ANNs) for predictive modeling.",
            "Uses 70:30 training-to-testing data split for high-accuracy forecasts."
          ],
          color: "teal"
        },
        {
          title: "Cohort Component Method",
          points: [
            "Estimates future population using age-specific fertility, mortality, and migration rates.",
            "Provides gender-segregated projections for improved planning."
          ],
          color: "green"
        },
        {
          title: "Logistic & Exponential Growth Models",
          points: [
            "Simulates constrained and unrestricted population growth scenarios.",
            "Essential for long-term urban sewage management planning."
          ],
          color: "cyan"
        }
      ]
    },
    {
      id: 2,
      title: "Water Demand Estimation and Prediction",
      description: "Sewage generation is directly linked to water consumption. This module estimates current and future water demand across different sectors, ensuring a reliable basis for wastewater calculations.",
      icon: "/Images/icons/water-demand.svg", // Replace with actual path
      applications: [
        {
          title: "Domestic Water Demand",
          points: [
            "Calculated using CPHEEO guidelines (135 LPCD for <1M population, 150 LPCD for >1M).",
            "Provides automated estimates based on region-specific population data."
          ],
          color: "blue"
        },
        {
          title: "Floating Population Water Demand",
          points: [
            "Adjusts estimates based on bathing facilities (45 LPCD with, 25 LPCD without).",
            "Incorporates real-time crowd data for festival/event planning."
          ],
          color: "purple"
        },
        {
          title: "Institutional Demand",
          points: [
            "Computes water requirements for hospitals, hotels, hostels, industries, schools, and public facilities.",
            "Uses sector-specific multipliers (e.g., 450 LPCD for hospitals, 135 LPCD for hostels)."
          ],
          color: "indigo"
        },
        {
          title: "Fire Fighting Water Demand",
          points: [
            "Estimates emergency water requirements based on regional population growth rates.",
            "Supports reservoir allocation and contingency planning."
          ],
          color: "red"
        },
        {
          title: "Total Water Demand",
          points: [
            "Aggregates all sector-based demands to determine gross regional water requirements.",
            "Enables real-time tracking for municipal planning and infrastructure upgrades."
          ],
          color: "green"
        }
      ]
    },
    {
      id: 3,
      title: "Sewage Load Estimation",
      description: "The Sewage Load Estimation module provides an integrated framework to predict wastewater generation based on water supply, sector-based consumption, and infiltration factors.",
      icon: "/Images/icons/sewage-load.svg", // Replace with actual path
      applications: [
        {
          title: "Sector-Based Estimation Method",
          points: [
            "Estimates sewage load from domestic, institutional, industrial, and public water use.",
            "Accounts for floating population and fire-fighting requirements."
          ],
          color: "amber"
        },
        {
          title: "Water Supply-Based Method",
          points: [
            "Computes total sewage load as 80% of water consumption (per CPHEEO standards).",
            "Adjusts for stormwater infiltration in combined sewer networks."
          ],
          color: "sky"
        },
        {
          title: "Real-Time Wastewater Monitoring",
          points: [
            "Uses sensor-based tracking to measure inflow to STPs (Sewage Treatment Plants).",
            "Enables predictive maintenance and operational efficiency improvements."
          ],
          color: "emerald"
        }
      ]
    },
    {
      id: 4,
      title: "STP Site Priority and Suitability",
      description: "Optimal sewage treatment plant (STP) site selection ensures efficient wastewater management while minimizing environmental and social impacts. This module prioritizes sites based on multi-criteria decision analysis (MCDA).",
      icon: "/Images/icons/stp-site.svg", // Replace with actual path
      applications: [
        {
          title: "STP Site Prioritization",
          points: [
            "Uses Analytic Hierarchy Process (AHP) and TOPSIS to rank potential STP locations.",
            "Factors in sewage gap, rainfall, temperature, tourist population, and water quality index."
          ],
          color: "orange"
        },
        {
          title: "STP Site Suitability Analysis",
          points: [
            "Evaluates lithology, geomorphology, soil type, elevation, land use (LULC), and population density.",
            "Avoids conflict zones like ASI heritage sites, defense areas, flood zones, and seismic zones.",
            "Utilizes GIS-based spatial analysis for precision mapping."
          ],
          color: "cyan"
        },
        {
          title: "Advanced Suitability Models",
          points: [
            "Integrates AHP, Fuzzy-AHP, DEMATLE-ANP, and Grey Relational Analysis (GRA) for optimized decision-making.",
            "Supports adaptive site planning based on hydrological and demographic shifts."
          ],
          color: "blue"
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
      {/* Main Content Section */}
      <div className="container mx-auto px-6 py-20">
        {/* Introduction */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-6">
            Basic Modules
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Basic Modules include efficient sewage load estimation and prediction. This module integrates population forecasting, water demand estimation, sewage load assessment, and STP site suitability analysis to ensure efficient wastewater treatment, optimized resource allocation, and long-term urban sustainability.
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      )}
                      {module.id === 2 && (
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      {module.id === 3 && (
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                        </svg>
                      )}
                      {module.id === 4 && (
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
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
            <h3 className="text-2xl font-bold">Why This Matters? 🌏</h3>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">Enhanced Infrastructure Planning</h4>
              <p className="text-blue-100">
                Enhances wastewater infrastructure planning with data-driven forecasting.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">Reduced Pollution Risks</h4>
              <p className="text-blue-100">
                Reduces water pollution risks through optimized STP site selection.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">Improved Public Health</h4>
              <p className="text-blue-100">
                Improves public health & sanitation with accurate sewage load assessments.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">Sustainable Urban Development</h4>
              <p className="text-blue-100">
                Supports sustainable urban development by integrating machine learning, GIS, and predictive analytics.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">Optimized Treatment Efficiency</h4>
              <p className="text-blue-100">
                Optimizes wastewater treatment efficiency, reducing operational costs and environmental impact.
              </p>
            </div>
          </div>
        </div>
        
        {/* CTA Section */}
        <div className="text-center">
          <div className="mt-8 flex justify-center items-center">
            <div className="text-blue-600">💧</div>
            <span className="text-gray-500 mx-2">
              With real-time monitoring, advanced forecasting models, and GIS-based planning, this module ensures sustainable, resilient, and future-ready wastewater management solutions.
            </span>
            <div className="text-blue-600">💧</div>
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
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

export default function RWMPage() {
  const [activeModule, setActiveModule] = useState(1);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
  }, []);
  
  const modules: Module[] = [
    {
      id: 1,
      title: "Resource Estimation",
      description: "Understanding river water availability, storage, and quality is fundamental for sustainable planning. This module integrates hydrological modeling, remote sensing, and real-time monitoring for comprehensive resource estimation.",
      icon: "/Images/icons/resource.svg", // Replace with actual path
      applications: [
        {
          title: "Water Availability",
          points: [
            "Estimates river discharge and seasonal variations using hydrological models.",
            "Assists in water allocation planning for domestic, agricultural, and industrial needs."
          ],
          color: "blue"
        },
        {
          title: "Volumetric Flux and Storage Estimation",
          points: [
            "Quantifies river flow rates and storage dynamics using GIS and remote sensing.",
            "Supports reservoir management and inter-basin water transfer planning."
          ],
          color: "teal"
        },
        {
          title: "Water Quality Assessment",
          points: [
            "Monitors physical, chemical, and biological water quality parameters.",
            "Identifies pollution sources from urban, industrial, and agricultural activities."
          ],
          color: "green"
        },
        {
          title: "Vulnerable Reaches and Water Bodies",
          points: [
            "Detects pollution hotspots, erosion-prone areas, and ecologically sensitive zones.",
            "Supports conservation strategies for riverine ecosystems."
          ],
          color: "amber"
        },
        {
          title: "Short-Term Peak Contamination Assessment",
          subtitle: "During Festivals",
          points: [
            "Predicts contamination spikes due to mass gatherings, idol immersion, and other cultural activities.",
            "Develops rapid-response strategies to prevent long-term ecological damage."
          ],
          color: "red"
        }
      ]
    },
    {
      id: 2,
      title: "Flood Forecasting and Management",
      description: "Flooding poses severe risks to life, infrastructure, and ecosystems. This module provides real-time flood forecasting and risk assessment tools to enhance preparedness and mitigation efforts.",
      icon: "/Images/icons/flood.svg", // Replace with actual path
      applications: [
        {
          title: "Flood Simulations",
          points: [
            "Uses hydrodynamic models (e.g., HEC-RAS, MIKE 11) to predict flood scenarios.",
            "Supports emergency response planning and evacuation strategies."
          ],
          color: "purple"
        },
        {
          title: "River Routing",
          points: [
            "Models how floodwaters travel through river systems.",
            "Helps optimize dam releases and downstream flood mitigation measures."
          ],
          color: "indigo"
        },
        {
          title: "Contaminant Transport & Estimation",
          subtitle: "for Ecological Management",
          points: [
            "Tracks the movement of pollutants (agricultural runoff, industrial waste, sewage).",
            "Supports policies for reducing contamination impact on aquatic life and water quality."
          ],
          color: "cyan"
        }
      ]
    },
    {
      id: 3,
      title: "Water Bodies Management",
      description: "Effective water body management ensures sustainable reservoir operations, aquatic ecosystem health, and efficient water allocation.",
      icon: "/Images/icons/waterbody.svg", // Replace with actual path
      applications: [
        {
          title: "Dynamic Estimation of Storage with Forecasting",
          points: [
            "Monitors real-time storage variations in reservoirs, lakes, and wetlands.",
            "Uses AI-driven forecasting models for optimal water allocation."
          ],
          color: "emerald"
        },
        {
          title: "Reservoir Operations",
          subtitle: "Based on Dynamic Agricultural Requirements",
          points: [
            "Integrates climate data and crop water demand for reservoir release planning.",
            "Ensures water availability for irrigation while minimizing wastage."
          ],
          color: "green"
        },
        {
          title: "Water Quality Monitoring",
          points: [
            "Tracks variations in water quality parameters such as dissolved oxygen, turbidity, and nutrient levels.",
            "Detects algal blooms, eutrophication risks, and pollution sources."
          ],
          color: "sky"
        }
      ]
    },
    {
      id: 4,
      title: "Wastewater Treatment",
      description: "Proper wastewater treatment safeguards river ecosystems and ensures sustainable water resource management. This module enables pollution assessment, treatment technology selection, and site suitability analysis for wastewater treatment plants.",
      icon: "/Images/icons/wastewater.svg", // Replace with actual path
      applications: [
        {
          title: "Water Pollution Inventory",
          subtitle: "and Corresponding Solutions",
          points: [
            "Maps pollution sources along the entire river stretch.",
            "Proposes treatment solutions (decentralized vs. centralized) based on pollution load and local conditions."
          ],
          color: "orange"
        },
        {
          title: "Suitable Location and Technology",
          subtitle: "for Wastewater Treatment",
          points: [
            "Uses GIS and hydrological modeling to identify optimal STP locations.",
            "Recommends appropriate treatment technologies (e.g., constructed wetlands, activated sludge, biofiltration) for effective pollution control."
          ],
          color: "amber"
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
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-blue-50">
      {/* Main Content Section */}
      <div className="container mx-auto px-6 py-20">
        {/* Introduction */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-6">
            River Water Management
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Efficient River Water Management (RWM) is essential for sustainable water resource utilization, flood control, pollution management, and ecosystem preservation.
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
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-cyan-50 to-transparent pointer-events-none"></div>
        </div>
        
        {/* Active Module Content */}
        {modules.map(module => (
          activeModule === module.id && (
            <div key={module.id} className="animate-fadeIn">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 mb-16">
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-8 text-white">
                  <div className="flex items-center mb-4">
                    {/* This would be a unique icon for each module in production */}
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mr-4">
                      {module.id === 1 && (
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      )}
                      {module.id === 2 && (
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      {module.id === 3 && (
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      )}
                      {module.id === 4 && (
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
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
            <h3 className="text-2xl font-bold">Why This Matters? 🌍</h3>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">Enhanced Water Security</h4>
              <p className="text-blue-100">
                Enhances water security through accurate resource estimation and quality monitoring.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">Reduced Flood Risks</h4>
              <p className="text-blue-100">
                Reduces flood risks by integrating real-time forecasting and mitigation strategies.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h.5A2.5 2.5 0 0020 5.5v-1.65" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">Ecosystem Health</h4>
              <p className="text-blue-100">
                Improves ecosystem health by managing contaminant transport and wastewater treatment.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">Sustainable Agriculture</h4>
              <p className="text-blue-100">
                Supports sustainable agriculture with optimized reservoir operations.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">Data-Driven Decision Making</h4>
              <p className="text-blue-100">
                Empowers decision-makers with AI-driven analytics for river water management.
              </p>
            </div>
          </div>
        </div>
        
        {/* CTA Section */}
        <div className="text-center">
          <div className="mt-8 flex justify-center items-center">
            <div className="text-blue-600">💧</div>
            <span className="text-gray-500 mx-2">
              With advanced data-driven insights, this module provides a holistic approach to river water sustainability, disaster resilience, and pollution control.
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
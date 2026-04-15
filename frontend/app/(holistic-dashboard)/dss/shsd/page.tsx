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

export default function SHSDPage() {
  const [activeModule, setActiveModule] = useState(1);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
  }, []);
  
  const modules: Module[] = [
    {
      id: 1,
      title: "Resource Management",
      description: "Sustainable water management requires balancing ecological needs, socio-economic demands, and hydrological constraints. This module enables data-driven planning by integrating environmental, economic, and social perspectives.",
      icon: "/Images/icons/resource-management.svg", // Replace with actual path
      applications: [
        {
          title: "Optimum and Sustainable Management of Water",
          subtitle: "for All Stakeholders",
          points: [
            "Ensures equitable water distribution among agriculture, industry, domestic use, and ecosystems.",
            "Supports participatory water governance by integrating community insights and local knowledge.",
            "Develops adaptive strategies for water conservation and efficient usage."
          ],
          color: "blue"
        },
        {
          title: "Identification of Sensitive Socio-Economic Factors",
          subtitle: "and Leverage Points Through Extensive Field Study",
          points: [
            "Conducts on-ground socio-economic assessments to identify water-related challenges.",
            "Pinpoints leverage points where policy or infrastructure improvements can yield maximum benefits.",
            "Incorporates social factors like livelihood dependency, cultural significance, and economic impact into water resource planning."
          ],
          color: "green"
        },
        {
          title: "Modeling the Key Parameters",
          subtitle: "and Their System Dynamics (SD)",
          points: [
            "Uses System Dynamics (SD) modeling to understand the interplay between hydrology, economy, and society.",
            "Simulates the effects of population growth, climate change, and policy decisions on water availability.",
            "Develops strategies for long-term sustainability by analyzing cause-effect relationships."
          ],
          color: "teal"
        }
      ]
    },
    {
      id: 2,
      title: "Impact Assessment",
      description: "Impact assessment helps evaluate the effectiveness of proposed interventions, ensuring that solutions contribute to both hydrological and socio-economic resilience.",
      icon: "/Images/icons/impact-assessment.svg", // Replace with actual path
      applications: [
        {
          title: "Impact Assessment of Various Planned Solutions",
          subtitle: "Across the System for River Rejuvenation",
          points: [
            "Evaluates the success of interventions such as wastewater treatment, afforestation, flood control, and water conservation projects.",
            "Measures improvements in water quality, ecological health, and socio-economic well-being.",
            "Provides scientific validation for large-scale river rejuvenation programs."
          ],
          color: "cyan"
        },
        {
          title: "Returns Feedback/Interventions",
          subtitle: "to the Hydrological and Optimization Framework",
          points: [
            "Integrates field study insights into hydrological and optimization models for better decision-making.",
            "Facilitates an adaptive management approach, where policies and actions evolve based on real-time data and observed impacts.",
            "Ensures that implemented solutions remain effective under changing climatic and socio-economic conditions."
          ],
          color: "sky"
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
            Socio-Hydrological System Dynamics
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            The Socio-Hydrological System Dynamics (SHSD) module integrates water management with socio-economic factors to ensure sustainable and inclusive decision-making. By combining hydrological modeling, system dynamics, and stakeholder engagement, this module provides a holistic approach to water governance and river rejuvenation.
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h.5A2.5 2.5 0 0020 5.5v-1.65" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">Sustainable Water Governance</h4>
              <p className="text-blue-100">
                Promotes sustainable water governance by considering socio-economic and hydrological factors together.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">Enhanced Decision-Making</h4>
              <p className="text-blue-100">
                Enhances decision-making through data-driven system dynamics modeling.
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
                Ensures equitable access to water for agriculture, industry, and communities.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">Improved Resilience</h4>
              <p className="text-blue-100">
                Improves resilience by incorporating local knowledge and real-world impact assessments.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">River Rejuvenation</h4>
              <p className="text-blue-100">
                Supports river rejuvenation efforts with scientifically backed solutions.
              </p>
            </div>
          </div>
        </div>
        
        {/* CTA Section */}
        <div className="text-center">
          <div className="mt-8 flex justify-center items-center">
            <div className="text-blue-600">🌊</div>
            <span className="text-gray-500 mx-2">
              With integrated modeling, impact assessment, and community-driven insights, this module helps create sustainable, adaptive, and socially inclusive water management strategies.
            </span>
            <div className="text-blue-600">🌊</div>
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
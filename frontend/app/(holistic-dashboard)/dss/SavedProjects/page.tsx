'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// Define interfaces for project data
interface Project {
  id: number;
  name: string;
  createdDate: string;
  lastModified: string;
  status: 'completed' | 'in-progress' | 'draft';
  description: string;
}

interface ModuleData {
  [key: string]: Project[];
}

// Props interface for the component (Next.js 15+ uses Promises)
interface SavedProjectsProps {
  params?: Promise<Record<string, string>>;
  searchParams?: Promise<Record<string, string>>;
}

// Sample data for each module with enhanced details
const moduleProjects: ModuleData = {
  'Basic Module': [
    { 
      id: 1, 
      name: 'Groundwater Assessment Project 1', 
      createdDate: '2024-01-15', 
      lastModified: '2024-01-20', 
      status: 'completed',
      description: 'Comprehensive groundwater analysis for agricultural zone'
    },
    { 
      id: 2, 
      name: 'Water Quality Analysis Project', 
      createdDate: '2024-01-18', 
      lastModified: '2024-01-25', 
      status: 'in-progress',
      description: 'Multi-parameter water quality assessment study'
    },
    { 
      id: 3, 
      name: 'Regional Water Study', 
      createdDate: '2024-02-01', 
      lastModified: '2024-02-05', 
      status: 'draft',
      description: 'Large-scale regional water resource mapping'
    },
    { 
      id: 4, 
      name: 'Aquifer Mapping Project', 
      createdDate: '2024-02-10', 
      lastModified: '2024-02-15', 
      status: 'completed',
      description: 'Advanced aquifer characterization and modeling'
    },
  ],
  'STP Priority': [
    { 
      id: 1, 
      name: 'Urban STP Priority Analysis', 
      createdDate: '2024-01-10', 
      lastModified: '2024-01-22', 
      status: 'completed',
      description: 'Priority assessment for urban sewage treatment facilities'
    },
    { 
      id: 2, 
      name: 'Industrial Area STP Planning', 
      createdDate: '2024-01-25', 
      lastModified: '2024-02-01', 
      status: 'in-progress',
      description: 'Strategic planning for industrial wastewater treatment'
    },
    { 
      id: 3, 
      name: 'Rural STP Assessment', 
      createdDate: '2024-02-05', 
      lastModified: '2024-02-12', 
      status: 'draft',
      description: 'Feasibility study for rural sewage treatment systems'
    },
  ],
  'STP Suitability': [
    { 
      id: 1, 
      name: 'Site Suitability Analysis - Zone A', 
      createdDate: '2024-01-12', 
      lastModified: '2024-01-28', 
      status: 'completed',
      description: 'Comprehensive site analysis for optimal STP placement'
    },
    { 
      id: 2, 
      name: 'Environmental Impact Assessment', 
      createdDate: '2024-01-20', 
      lastModified: '2024-02-03', 
      status: 'in-progress',
      description: 'Environmental impact evaluation for proposed STP sites'
    },
    { 
      id: 3, 
      name: 'Geological Suitability Study', 
      createdDate: '2024-02-08', 
      lastModified: '2024-02-14', 
      status: 'completed',
      description: 'Geological assessment for STP foundation planning'
    },
    { 
      id: 4, 
      name: 'Multi-criteria Suitability Analysis', 
      createdDate: '2024-02-15', 
      lastModified: '2024-02-18', 
      status: 'in-progress',
      description: 'Advanced multi-criteria decision analysis for site selection'
    },
    { 
      id: 5, 
      name: 'Cost-Benefit Suitability Study', 
      createdDate: '2024-02-20', 
      lastModified: '2024-02-22', 
      status: 'draft',
      description: 'Economic feasibility analysis for STP implementation'
    },
  ],
};

const moduleIcons: Record<string, React.ReactElement> = {
  'Basic Module': (
    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center">
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    </div>
  ),
  'STP Priority': (
    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    </div>
  ),
  'STP Suitability': (
    <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center">
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </div>
  ),
};

export default function SavedProjects({ params, searchParams }: SavedProjectsProps) {
  const [activeModule, setActiveModule] = useState<string>('Basic Module');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showModules, setShowModules] = useState<boolean>(false);
  const [isClient, setIsClient] = useState<boolean>(false);
  const [resolvedParams, setResolvedParams] = useState<Record<string, string>>({});
  const [resolvedSearchParams, setResolvedSearchParams] = useState<Record<string, string>>({});

  const modules = ['Basic Module', 'STP Priority', 'STP Suitability'];

  // Fix hydration mismatch and resolve Promise props
  useEffect(() => {
    setIsClient(true);
    
    // Resolve params and searchParams if they are Promises
    const resolveProps = async () => {
      if (params) {
        try {
          const resolvedP = await params;
          setResolvedParams(resolvedP);
        } catch (error) {
          console.error('Error resolving params:', error);
        }
      }
      
      if (searchParams) {
        try {
          const resolvedSP = await searchParams;
          setResolvedSearchParams(resolvedSP);
        } catch (error) {
          console.error('Error resolving searchParams:', error);
        }
      }
    };
    
    resolveProps();
  }, [params, searchParams]);

  const handleViewProject = (projectId: number, projectName: string): void => {
    console.log(`Viewing project: ${projectName} (ID: ${projectId})`);
  };

  const handleDeleteProject = (projectId: number, projectName: string): void => {
    console.log(`Deleting project: ${projectName} (ID: ${projectId})`);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredProjects = moduleProjects[activeModule]?.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  // Don't render animations until client-side
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Static version for SSR */}
        <div className="bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-600 text-white py-2 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <div className="text-center">
              <div className="mb-4">
                <h1 className="text-5xl font-bold text-white mb-1 tracking-tight relative">
                  <span className="inline-block bg-gradient-to-r from-white via-cyan-100 via-white via-cyan-200 to-white bg-clip-text text-transparent drop-shadow-lg">
                    Saved Projects
                  </span>
                </h1>
                <div className="w-32 h-1 bg-gradient-to-r from-transparent via-white to-transparent mx-auto rounded-full opacity-60"></div>
              </div>
              <p className="text-cyan-100 text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                Manage and access your comprehensive water management projects 
              </p>
              <div className="flex justify-center items-center mt-8 space-x-4">
                <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                <div className="w-16 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                <div className="w-3 h-3 bg-white/40 rounded-full"></div>
                <div className="w-16 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                <div className="w-2 h-2 bg-white/60 rounded-full"></div>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-cyan-300 to-teal-400"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading projects...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* CSS Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes glow {
            0%, 100% { width: 0%; opacity: 0; }
            50% { width: 100%; opacity: 1; }
          }
          @keyframes sparkle {
            0%, 100% { opacity: 0; transform: scale(0); }
            50% { opacity: 1; transform: scale(1); }
          }
          @keyframes expand {
            0%, 100% { width: 8rem; opacity: 0.6; }
            50% { width: 12rem; opacity: 0.9; }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `
      }} />

      {/* Enhanced Main Header Box */}
      <div className="bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-600 text-white py-2 relative overflow-hidden">
        {/* Background Pattern/Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 via-transparent to-teal-600/30"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute top-20 right-20 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
          <div className="absolute bottom-10 left-1/3 w-24 h-24 bg-cyan-300/20 rounded-full blur-lg"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center">
            {/* Main Title with Enhanced Effects */}
            <div className="mb-4">
              <h1 className="text-5xl font-bold text-white mb-1 tracking-tight relative" style={{
                animation: 'float 6s ease-in-out infinite'
              }}>
                <span className="inline-block bg-gradient-to-r from-white via-cyan-100 via-white via-cyan-200 to-white bg-clip-text text-transparent drop-shadow-lg" style={{
                  backgroundSize: '400% 100%',
                  animation: 'shimmer 3s ease-in-out infinite'
                }}>
                  Saved Projects
                </span>
                {/* Glowing underline animation */}
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-cyan-300 to-white" style={{
                  animation: 'glow 3s ease-in-out infinite'
                }}></div>
                {/* Floating sparkles */}
                <div className="absolute -top-2 left-1/4 w-1 h-1 bg-white rounded-full" style={{
                  animation: 'sparkle 2s ease-in-out infinite'
                }}></div>
                <div className="absolute -top-1 right-1/4 w-1.5 h-1.5 bg-cyan-200 rounded-full" style={{
                  animation: 'sparkle 2.5s ease-in-out infinite 0.5s'
                }}></div>
                <div className="absolute bottom-0 right-1/3 w-1 h-1 bg-white rounded-full" style={{
                  animation: 'sparkle 2.2s ease-in-out infinite 1s'
                }}></div>
              </h1>
              <div className="w-32 h-1 bg-gradient-to-r from-transparent via-white to-transparent mx-auto rounded-full opacity-60" style={{
                animation: 'expand 4s ease-in-out infinite'
              }}></div>
            </div>
            
            {/* Subtitle */}
            <p className="text-cyan-100 text-xl font-medium max-w-2xl mx-auto leading-relaxed">
              Manage and access your comprehensive water management projects 
            </p>
            
            {/* Decorative Elements */}
            <div className="flex justify-center items-center mt-8 space-x-4">
              <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
              <div className="w-3 h-3 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
              <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0.7s' }}></div>
            </div>
          </div>
        </div>
        
        {/* Bottom Border Effect */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-cyan-300 to-teal-400"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Module Selection Toggle Button */}
        <div className="mb-8 flex items-center justify-between">
          {/* Create New Project Button - Left */}
          <button className="flex items-center space-x-2 bg-gradient-to-r from-cyan-300 to-cyan-800 text-white px-6 py-3 rounded-xl font-semibold hover:from-cyan-600 hover:to-cyan-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Create New Project</span>
          </button>

          {/* Modules Button - Center */}
          <button
            onClick={() => setShowModules(!showModules)}
            className="flex items-center justify-between bg-white rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 min-w-80"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="text-left">
                <h2 className="text-xl font-bold text-gray-900">Modules</h2>
                <p className="text-sm text-gray-600">Select a module to view projects</p>
              </div>
            </div>
            <div className={`transform transition-transform duration-300 ${showModules ? 'rotate-180' : ''}`}>
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {/* Export Data Button - Right */}
          <button className="flex items-center space-x-2 bg-gradient-to-r from-cyan-800 to-cyan-300 text-white px-6 py-3 rounded-xl font-semibold hover:from-cyan-600 hover:to-cyan-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <span>Export Data</span>
          </button>
        </div>

        {/* Simple Module Selection List - Show/Hide */}
        <div className={`transition-all duration-300 ease-in-out mb-8 ${
          showModules 
            ? 'opacity-100 max-h-20 translate-y-0' 
            : 'opacity-0 max-h-0 -translate-y-2 overflow-hidden'
        }`}>
          <div className="flex justify-center">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
              <div className="flex items-center space-x-6">
                {modules.map((module) => {
                  const isActive = activeModule === module;
                  
                  return (
                    <button
                      key={module}
                      className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-cyan-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-cyan-50 hover:text-cyan-600'
                      }`}
                      onClick={() => {
                        setActiveModule(module);
                        setShowModules(false); // Hide modules after selection
                      }}
                    >
                      {module}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Current Selected Module Header - Large Card Format */}
        <div className="bg-white shadow-2xl shadow-cyan-500/20 border-2 border-cyan-200 ring-4 ring-cyan-100 rounded-2xl p-8 mb-12 relative">
          {/* Gradient Border Effect */}
          <div className="absolute inset-0 rounded-2xl opacity-100 bg-gradient-to-r from-cyan-500/10 via-teal-500/10 to-cyan-500/10"></div>
          
          <div className="relative">
            <div className="flex items-start justify-between mb-6">
              {moduleIcons[activeModule as keyof typeof moduleIcons]}
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500 scale-110">
                <div className="w-3 h-3 rounded-full bg-white"></div>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold mb-3 text-cyan-900">{activeModule}</h2>
            
            <p className="text-gray-600 text-base leading-relaxed mb-6">
              {activeModule === 'Basic Module' && 'Essential tools for comprehensive water resource analysis, monitoring, and sustainable management solutions'}
              {activeModule === 'STP Priority' && 'Advanced sewage treatment plant priority assessment, strategic planning, and optimization frameworks'}
              {activeModule === 'STP Suitability' && 'Intelligent site suitability analysis for sewage treatment facilities with multi-criteria evaluation'}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-4xl font-bold text-cyan-600">
                  {moduleProjects[activeModule]?.length || 0}
                </span>
                <div className="text-sm">
                  <div className="text-gray-500 font-medium">projects</div>
                  <div className="text-xs text-gray-400">saved</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-cyan-100 text-cyan-700">
                  Active
                </div>
                <button
                  onClick={() => setShowModules(!showModules)}
                  className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  Change Module
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Filters and Search */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 w-80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 bg-white/70"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white/70 transition-all duration-200"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="in-progress">In Progress</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Showing</span>
              <span className="font-semibold text-cyan-600">{filteredProjects.length}</span>
              <span>of</span>
              <span className="font-semibold">{moduleProjects[activeModule]?.length || 0}</span>
              <span>projects</span>
            </div>
          </div>
        </div>

        {/* Enhanced Projects Table */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-600 text-white px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{activeModule}</h2>
                <p className="text-cyan-100 mt-1">Manage your saved projects and track progress</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                  <span className="text-sm font-medium">{filteredProjects.length} Projects</span>
                </div>
              </div>
            </div>
          </div>

          {filteredProjects.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80 backdrop-blur-sm">
                  <tr>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Project Details
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Timeline
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProjects.map((project, index) => (
                    <tr key={project.id} className="hover:bg-cyan-50/50 transition-all duration-200 group">
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center justify-center w-8 h-8 bg-gray-100 group-hover:bg-cyan-100 rounded-full transition-colors duration-200">
                          <span className="text-sm font-bold text-gray-600 group-hover:text-cyan-600">
                            {index + 1}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="max-w-md">
                          <div className="text-lg font-bold text-gray-900 mb-1 group-hover:text-cyan-700 transition-colors duration-200">
                            {project.name}
                          </div>
                          <div className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                            {project.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(project.status)}`}>
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            project.status === 'completed' ? 'bg-green-500' :
                            project.status === 'in-progress' ? 'bg-yellow-500' : 'bg-gray-500'
                          }`}></div>
                          {project.status.charAt(0).toUpperCase() + project.status.slice(1).replace('-', ' ')}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-sm">
                          <div className="text-gray-900 font-medium">
                            Created: {new Date(project.createdDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                          <div className="text-gray-500 mt-1">
                            Modified: {new Date(project.lastModified).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleViewProject(project.id, project.name)}
                            className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-cyan-600 text-white hover:from-cyan-600 hover:to-cyan-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </button>
                          <button
                            onClick={() => handleDeleteProject(project.id, project.name)}
                            className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-8 py-20 text-center">
              <div className="max-w-md mx-auto">
                <div className="mx-auto h-24 w-24 text-gray-300 mb-6">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No projects found</h3>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'No projects match your current filters. Try adjusting your search criteria.'
                    : `You haven't saved any projects in the ${activeModule} module yet. Start by creating your first project.`
                  }
                </p>
                <Link
                  href="/dss/basic"
                  className="inline-flex items-center px-6 py-3 border border-transparent shadow-lg text-base font-semibold rounded-xl text-white bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transform hover:scale-105 transition-all duration-200"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create New Project
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
                    
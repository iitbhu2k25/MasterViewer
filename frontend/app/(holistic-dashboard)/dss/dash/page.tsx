"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, RadialBarChart, RadialBar, AreaChart, Area } from 'recharts';
import { MapPin, Droplets, CheckCircle, Clock, AlertCircle, FileText, TrendingUp, Activity, Calendar, Target, Eye, Edit3, Save, X, ChevronDown, ChevronUp, Filter, Download, Search, Zap, CalendarDays, Timer, AlertTriangle, Lock, Unlock, Building, CreditCard, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

// Type definitions
interface River {
  id: number;
  name: string;
  description: string;
}

interface Workflow {
  id: number;
  phase: string;
  status: 'pending' | 'in-progress' | 'completed';
  commenced?: string;
  deadline?: string;
  completed?: string;
  is_locked: boolean;
}

interface FundDepartment {
  department_name?: string;
  fund_scheme_name?: string;
}

interface Intervention {
  id: number;
  name: string;
  workflows?: Workflow[];
  fund_department?: FundDepartment;
}

interface Action {
  id: number;
  name: string;
  icon: string;
  color: string;
  interventions?: Intervention[];
}

interface Location {
  id: number;
  name: string;
  actions?: Action[];
}

interface RiverData {
  name: string;
  description: string;
  locations?: Location[];
}

interface DelayedIntervention {
  id: number;
  interventionName: string;
  location: string;
  action: string;
  department: string;
  fundScheme: string;
  river: string;
  delayedPhases?: Array<{
    phase: string;
    daysDelayed: number;
    deadline: string;
    completedAt?: string;
  }>;
}

interface ChartFilters {
  completed: boolean;
  inProgress: boolean;
  pending: boolean;
}

interface ExpandedActions {
  [key: string]: boolean;
}

interface InterventionScrollPositions {
  [key: number]: number;
}

interface InterventionScrollStates {
  [key: number]: {
    canScrollUp: boolean;
    canScrollDown: boolean;
  };
}

interface CurrentImageIndex {
  [key: number]: number;
}

interface ModalData {
  phase: string;
  status: string;
  interventions: any[];
}

interface StatusCounts {
  completed: number;
  'in-progress': number;
  pending: number;
}

interface AllStatusCounts {
  techReport: StatusCounts;
  dpr: StatusCounts;
  workAwarded: StatusCounts;
  finished: StatusCounts;
}

const EnhancedRiverDashboard = () => {
  // ⚙️ CHANGE THIS TO MATCH YOUR DJANGO SERVER PORT
  const API_BASE_URL = 'http://localhost:9000/api';

  // State management
  const [rivers, setRivers] = useState<River[]>([]);
  const [selectedRiver, setSelectedRiver] = useState<River | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [riverData, setRiverData] = useState<RiverData | null>(null);
  const [delayedInterventions, setDelayedInterventions] = useState<DelayedIntervention[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);
  const [selectedChartData, setSelectedChartData] = useState<any>(null);
  const [chartFilters, setChartFilters] = useState<ChartFilters>({
    completed: true,
    inProgress: true,
    pending: true
  });
  const [expandedActions, setExpandedActions] = useState<ExpandedActions>({});
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [editingDepartment, setEditingDepartment] = useState<number | null>(null);
  const [modalData, setModalData] = useState<ModalData | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Intervention slider state
  const [interventionScrollPositions, setInterventionScrollPositions] = useState<InterventionScrollPositions>({});
  const [interventionScrollStates, setInterventionScrollStates] = useState<InterventionScrollStates>({});
  
  // Auto-sliding river images state - ISOLATED TO PREVENT RE-RENDERS
  const [currentImageIndex, setCurrentImageIndex] = useState<CurrentImageIndex>({});
  
  // DEADLINE FORM STATE - MOVED TO PARENT LEVEL TO PREVENT RESET
  const [showDeadlineForm, setShowDeadlineForm] = useState<string | null>(null); // intervention-phase key
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  
  // Options for dropdowns
  const [departments, setDepartments] = useState<string[]>([]);
  const [fundSchemes, setFundSchemes] = useState<string[]>([]);

  // FIXED Auto-slide functionality - Properly cycles through all 4 images
  useEffect(() => {
    if (rivers.length === 0) return;
    
    // Initialize indices when rivers are loaded
    setCurrentImageIndex(prev => {
      if (Object.keys(prev).length === 0) {
        const initialIndices: CurrentImageIndex = {};
        rivers.forEach(river => {
          initialIndices[river.id] = 0;
        });
        return initialIndices;
      }
      return prev;
    });
    
    const timer = setInterval(() => {
      setCurrentImageIndex(prev => {
        const newIndices: CurrentImageIndex = { ...prev };
        rivers.forEach(river => {
          newIndices[river.id] = ((prev[river.id] || 0) + 1) % 4;
        });
        return newIndices;
      });
    }, 5000); // Auto-slide every 5 seconds

    return () => clearInterval(timer);
  }, [rivers.length]);

  // API helper functions
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        // Load rivers
        const riversData: River[] = await apiCall('/rivers/');
        setRivers(riversData);
        
        // Load department and fund scheme options
        // const options = await apiCall('/river_interventions/get_options/');
        // setDepartments(options.departments);
        // setFundSchemes(options.fund_schemes);
        
        // Select first river by default
        if (riversData.length > 0) {
          setSelectedRiver(riversData[0]);
          await loadRiverData(riversData[0].id);
        }
        
      } catch (err) {
        setError('Failed to load initial data: ' + (err as Error).message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Load river-specific data
  const loadRiverData = async (riverId: number) => {
    try {
      const data: RiverData = await apiCall(`/river_workflows/dashboard_data/?river_id=${riverId}`);
      setRiverData(data);
      
      // Set first location as selected
      if (data.locations && data.locations.length > 0) {
        setSelectedLocation(data.locations[0]);
      }
      
      // Load delayed interventions
      const delayed: DelayedIntervention[] = await apiCall('/river_workflows/delayed/');
      setDelayedInterventions(delayed.filter(d => d.river === data.name));
      
    } catch (err) {
      setError('Failed to load river data: ' + (err as Error).message);
      console.error(err);
    }
  };

  // Handle river selection
  const handleRiverSelect = async (river: River) => {
    setSelectedRiver(river);
    setLoading(true);
    await loadRiverData(river.id);
    setLoading(false);
  };

  // Intervention slider functions - Vertical
  const scrollInterventions = (actionId: number, direction: 'up' | 'down') => {
    const container = document.getElementById(`intervention-slider-${actionId}`);
    if (container) {
      const scrollAmount = 200; // Height to scroll per click
      const newPosition = direction === 'up' 
        ? container.scrollTop - scrollAmount 
        : container.scrollTop + scrollAmount;
      
      container.scrollTo({ top: newPosition, behavior: 'smooth' });
      
      // Update scroll position state
      setTimeout(() => {
        const scrollTop = container.scrollTop;
        const maxScroll = container.scrollHeight - container.clientHeight;
        
        setInterventionScrollPositions(prev => ({
          ...prev,
          [actionId]: scrollTop
        }));
        
        setInterventionScrollStates(prev => ({
          ...prev,
          [actionId]: {
            canScrollUp: scrollTop > 0,
            canScrollDown: scrollTop < maxScroll - 1
          }
        }));
      }, 300);
    }
  };

  const updateInterventionScrollState = (actionId: number) => {
    const container = document.getElementById(`intervention-slider-${actionId}`);
    if (container) {
      setTimeout(() => {
        const scrollTop = container.scrollTop;
        const maxScroll = container.scrollHeight - container.clientHeight;
        
        setInterventionScrollStates(prev => ({
          ...prev,
          [actionId]: {
            canScrollUp: scrollTop > 0,
            canScrollDown: maxScroll > 0 && scrollTop < maxScroll - 1
          }
        }));
      }, 100);
    }
  };

  // Enhanced Department/Fund Scheme Selector with Edit/Save Toggle
  const DepartmentFundSelector = React.memo<{ intervention: Intervention; onUpdate?: () => void }>(({ intervention, onUpdate }) => {
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [selectedDepartment, setSelectedDepartment] = useState<string>(intervention.fund_department?.department_name || '');
    const [selectedFundScheme, setSelectedFundScheme] = useState<string>(intervention.fund_department?.fund_scheme_name || '');
    const [saving, setSaving] = useState<boolean>(false);

    // Check if intervention has saved department and fund scheme
    const hasSavedData = intervention.fund_department?.department_name && intervention.fund_department?.fund_scheme_name;

    // Initialize editing state based on saved data
    useEffect(() => {
      setIsEditing(!hasSavedData);
    }, [hasSavedData]);

    // Static options - replace with your API call if needed
    const DEPARTMENTS = [
      "Water Resources Department",
      "Urban Development Department", 
      "Environment Department",
      "Public Health Engineering",
      "Municipal Corporation",
      "Pollution Control Board",
      "Forest Department",
      "Agriculture Department",
      "Rural Development",
      "Tourism Department"
    ];

    const FUND_SCHEMES = [
      "Namami Gange Programme",
      "Smart Cities Mission", 
      "AMRUT Scheme",
      "National River Conservation Plan",
      "Swachh Bharat Mission",
      "Jal Jeevan Mission",
      "MGNREGA",
      "State Environment Fund",
      "Central Pollution Control",
      "World Bank Loan"
    ];

    const handleSave = async () => {
      if (!selectedDepartment || !selectedFundScheme) {
        alert('Please select both department and fund scheme');
        return;
      }

      setSaving(true);
      try {
        await apiCall(`/river_interventions/${intervention.id}/assign/`, {
          method: 'POST',
          body: JSON.stringify({
            department_name: selectedDepartment,
            fund_scheme_name: selectedFundScheme
          }),
        });
        
        // Reload data
        if (selectedRiver) {
          await loadRiverData(selectedRiver.id);
        }
        setIsEditing(false);
        if (onUpdate) onUpdate();
        
      } catch (err) {
        alert('Failed to save: ' + (err as Error).message);
      } finally {
        setSaving(false);
      }
    };

    const handleEdit = () => {
      setIsEditing(true);
    };

    const handleCancel = () => {
      // Reset to saved values
      setSelectedDepartment(intervention.fund_department?.department_name || '');
      setSelectedFundScheme(intervention.fund_department?.fund_scheme_name || '');
      setIsEditing(false);
    };

    if (!isEditing && hasSavedData) {
      // View mode - show saved data with edit button
      return (
        <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-green-800">Completed</h4>
            <button
              onClick={handleEdit}
              className="p-1 text-green-600 hover:text-green-800 transition-colors rounded"
              title="Edit Assignment"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center space-x-2">
              <Building className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-xs font-medium text-green-700">Department</p>
                <p className="text-sm text-green-800">{selectedDepartment}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-xs font-medium text-green-700">Fund Scheme</p>
                <p className="text-sm text-green-800">{selectedFundScheme}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Edit mode - show form with save/cancel buttons
    return (
      <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-700">
            {hasSavedData ? 'Edit Assignment' : 'Assign Department & Fund'}
          </h4>
          {hasSavedData && (
            <button
              onClick={handleCancel}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded"
              title="Cancel Edit"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Department Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Department
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Department</option>
              {DEPARTMENTS.map((dept, index) => (
                <option key={index} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Fund Scheme Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Fund Scheme
            </label>
            <select
              value={selectedFundScheme}
              onChange={(e) => setSelectedFundScheme(e.target.value)}
              className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Fund Scheme</option>
              {FUND_SCHEMES.map((scheme, index) => (
                <option key={index} value={scheme}>{scheme}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-3 flex space-x-2 justify-center">
          {hasSavedData && (
            <button
              onClick={handleCancel}
              className="px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded font-medium hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !selectedDepartment || !selectedFundScheme}
            className={`px-4 py-1 text-xs rounded font-medium transition-colors ${
              saving || !selectedDepartment || !selectedFundScheme
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {saving ? 'Saving...' : 'Save Assignment'}
          </button>
        </div>
      </div>
    );
  });

  // Reset entire intervention functionality
  const resetIntervention = async (interventionId: number) => {
    if (window.confirm('Are you sure you want to reset this entire intervention? This will reset all workflow phases (Tech Report, DPR, Work Awarded, Finished) back to pending status.')) {
      try {
        await apiCall(`/river_interventions/${interventionId}/reset/`, {
          method: 'POST',
        });
        
        // Reload data
        if (selectedRiver) {
          await loadRiverData(selectedRiver.id);
        }
        
      } catch (err) {
        alert('Failed to reset intervention: ' + (err as Error).message);
      }
    }
  };

  // FIXED: Handle status update with proper state management
  const updateWorkflowStatus = async (workflowId: number, newStatus: string, deadline: string | null = null) => {
    try {
      const payload: any = { status: newStatus };
      if (deadline) {
        payload.deadline = deadline;
      }
      
      await apiCall(`/river_workflows/${workflowId}/update_status/`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      
      // Reload data
      if (selectedRiver) {
        await loadRiverData(selectedRiver.id);
      }
      
      // Reset form states
      setEditingStatus(null);
      setShowDeadlineForm(null);
      setSelectedDate('');
      setSelectedTime('');
      
    } catch (err) {
      alert('Failed to update status: ' + (err as Error).message);
    }
  };

  // Handle department/fund scheme update
  const updateDepartmentFund = async (interventionId: number, department_id: number | null = null, fund_scheme_id: number | null = null) => {
    try {
      const payload: any = {};
      if (department_id !== null) payload.department_id = department_id;
      if (fund_scheme_id !== null) payload.fund_scheme_id = fund_scheme_id;
      
      await apiCall(`/river_interventions/${interventionId}/update_department_fund/`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      
      // Reload data
      if (selectedRiver) {
        await loadRiverData(selectedRiver.id);
      }
      setEditingDepartment(null);
      
    } catch (err) {
      alert('Failed to update department/fund scheme: ' + (err as Error).message);
    }
  };

  // Utility functions
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return '#22c55e';
      case 'in-progress': return '#f59e0b';
      case 'pending': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string): React.ReactElement => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'in-progress': return <Clock className="w-4 h-4" />;
      case 'pending': return <AlertCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const formatDateTime = (dateTime?: string): string | null => {
    if (!dateTime) return null;
    return new Date(dateTime).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    });
  };

  const calculateDaysRemaining = (deadline?: string): number | null => {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isOverdue = (deadline?: string, completedDate?: string): boolean => {
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    const comparisonDate = completedDate ? new Date(completedDate) : new Date();
    return comparisonDate > deadlineDate;
  };

  const getValidStatusOptions = (currentStatus: string): string[] => {
    switch (currentStatus) {
      case 'pending':
        return ['pending', 'in-progress'];
      case 'in-progress':
        return ['in-progress', 'completed'];
      case 'completed':
        return ['completed'];
      default:
        return ['pending'];
    }
  };

  const getActionColorClass = (color: string): string => {
    const colorMap: { [key: string]: string } = {
      blue: 'from-blue-500 to-blue-600',
      cyan: 'from-cyan-500 to-cyan-600',
      green: 'from-green-500 to-green-600',
      orange: 'from-orange-500 to-orange-600',
      purple: 'from-purple-500 to-purple-600',
      indigo: 'from-indigo-500 to-indigo-600',
      teal: 'from-teal-500 to-teal-600',
    };
    return colorMap[color] || 'from-gray-500 to-gray-600';
  };

  const calculateOverallProgress = () => {
    if (!riverData) return { completed: 0, inProgress: 0, pending: 0, total: 0 };
    
    let totalItems = 0;
    let completed = 0;
    let inProgress = 0;
    let pending = 0;
    
    riverData.locations?.forEach(location => {
      location.actions?.forEach(action => {
        action.interventions?.forEach(intervention => {
          intervention.workflows?.forEach(workflow => {
            totalItems++;
            if (workflow.status === 'completed') completed++;
            else if (workflow.status === 'in-progress') inProgress++;
            else pending++;
          });
        });
      });
    });
    
    return {
      completed: totalItems > 0 ? Math.round((completed / totalItems) * 100) : 0,
      inProgress: totalItems > 0 ? Math.round((inProgress / totalItems) * 100) : 0,
      pending: totalItems > 0 ? Math.round((pending / totalItems) * 100) : 0,
      total: totalItems
    };
  };

  const getLocationProgress = () => {
    if (!riverData) return [];
    
    return riverData.locations?.map((location) => {
      let totalItems = 0;
      let completedItems = 0;
      let inProgressItems = 0;
      let pendingItems = 0;
      
      location.actions?.forEach(action => {
        action.interventions?.forEach(intervention => {
          intervention.workflows?.forEach(workflow => {
            totalItems++;
            if (workflow.status === 'completed') completedItems++;
            else if (workflow.status === 'in-progress') inProgressItems++;
            else pendingItems++;
          });
        });
      });
      
      return {
        name: location.name.length > 15 ? location.name.substring(0, 15) + '...' : location.name,
        progress: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
        completed: completedItems,
        inProgress: inProgressItems,
        pending: pendingItems,
        total: totalItems
      };
    }) || [];
  };

  const getActionComparison = () => {
    if (!riverData) return [];
    
    const actionStats: { [key: string]: { completed: number; inProgress: number; pending: number } } = {};
    
    riverData.locations?.forEach(location => {
      location.actions?.forEach(action => {
        if (!actionStats[action.name]) {
          actionStats[action.name] = { completed: 0, inProgress: 0, pending: 0 };
        }
        
        action.interventions?.forEach(intervention => {
          intervention.workflows?.forEach(workflow => {
            if (workflow.status === 'completed') actionStats[action.name].completed++;
            else if (workflow.status === 'in-progress') actionStats[action.name].inProgress++;
            else actionStats[action.name].pending++;
          });
        });
      });
    });
    
    return Object.entries(actionStats).map(([name, stats]) => ({
      name: name.length > 20 ? name.substring(0, 20) + '...' : name,
      completed: stats.completed,
      inProgress: stats.inProgress,
      pending: stats.pending
    }));
  };

  const getStatusCounts = (): AllStatusCounts => {
    if (!riverData) {
      return {
        techReport: { completed: 0, 'in-progress': 0, pending: 0 },
        dpr: { completed: 0, 'in-progress': 0, pending: 0 },
        workAwarded: { completed: 0, 'in-progress': 0, pending: 0 },
        finished: { completed: 0, 'in-progress': 0, pending: 0 }
      };
    }
    
    const counts: AllStatusCounts = {
      techReport: { completed: 0, 'in-progress': 0, pending: 0 },
      dpr: { completed: 0, 'in-progress': 0, pending: 0 },
      workAwarded: { completed: 0, 'in-progress': 0, pending: 0 },
      finished: { completed: 0, 'in-progress': 0, pending: 0 }
    };
    
    riverData.locations?.forEach(location => {
      location.actions?.forEach(action => {
        action.interventions?.forEach(intervention => {
          intervention.workflows?.forEach(workflow => {
            if (counts[workflow.phase as keyof AllStatusCounts]) {
              (counts[workflow.phase as keyof AllStatusCounts] as StatusCounts)[workflow.status]++;
            }
          });
        });
      });
    });
    
    return counts;
  };

  const getInterventionsByStatus = (phase: string, status: string) => {
    if (!riverData) return [];
    
    const interventions: any[] = [];
    riverData.locations?.forEach(location => {
      location.actions?.forEach(action => {
        action.interventions?.forEach(intervention => {
          const workflow = intervention.workflows?.find(w => w.phase === phase);
          if (workflow && workflow.status === status) {
            interventions.push({
              ...intervention,
              locationName: location.name,
              actionName: action.name,
              actionId: action.id
            });
          }
        });
      });
    });
    
    return interventions;
  };

  const toggleFilter = (filterKey: keyof ChartFilters) => {
    setChartFilters(prev => ({
      ...prev,
      [filterKey]: !prev[filterKey]
    }));
  };

  const toggleActionExpansion = (locationId: number, actionKey: string) => {
    const key = `${locationId}-${actionKey}`;
    setExpandedActions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const filteredActions = () => {
    if (!selectedLocation) return [];
    
    return selectedLocation.actions?.filter(action => {
      const matchesSearch = action.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           action.interventions?.some(int => int.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (filterStatus === 'all') return matchesSearch;
      
      const hasStatus = action.interventions?.some(intervention =>
        intervention.workflows?.some(workflow => workflow.status === filterStatus)
      );
      
      return matchesSearch && hasStatus;
    }) || [];
  };

  // FIXED: Enhanced Status Phase Component with better state management
  const EnhancedStatusPhase = React.memo<{ intervention: Intervention; workflow: Workflow }>(({ intervention, workflow }) => {
    const validOptions = getValidStatusOptions(workflow.status);
    const daysRemaining = calculateDaysRemaining(workflow.deadline);
    const isCurrentlyOverdue = isOverdue(workflow.deadline, workflow.completed);
    const isLocked = workflow.is_locked;
    
    // Use the parent state instead of local state
    const deadlineFormKey = `${intervention.id}-${workflow.phase}`;
    const isShowingDeadlineForm = showDeadlineForm === deadlineFormKey;

    const handleStatusChange = (newStatus: string) => {
      if (newStatus === 'in-progress') {
        setShowDeadlineForm(deadlineFormKey);
        setEditingStatus(deadlineFormKey);
      } else {
        updateWorkflowStatus(workflow.id, newStatus);
      }
    };

    const handleDeadlineSubmit = () => {
      if (selectedDate && selectedTime) {
        const deadline = new Date(`${selectedDate}T${selectedTime}`).toISOString();
        updateWorkflowStatus(workflow.id, 'in-progress', deadline);
      }
    };

    const handleDeadlineCancel = () => {
      setShowDeadlineForm(null);
      setSelectedDate('');
      setSelectedTime('');
      setEditingStatus(null);
    };

    return (
      <div className={`bg-white rounded-lg p-4 border transition-all ${
        isLocked ? 'border-gray-300 opacity-60' : 'border-gray-200 hover:shadow-sm'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div style={{ color: getStatusColor(workflow.status) }}>
              {getStatusIcon(workflow.status)}
            </div>
            <p className="text-xs text-gray-600 capitalize font-medium">
              {workflow.phase.replace(/([A-Z])/g, ' $1').trim()}
            </p>
            {isLocked && <Lock className="w-3 h-3 text-gray-400" />}
            {!isLocked && <Unlock className="w-3 h-3 text-green-500" />}
            {isCurrentlyOverdue && <AlertTriangle className="w-3 h-3 text-red-500" />}
          </div>
        </div>
        
        {editingStatus === deadlineFormKey && !isLocked ? (
          isShowingDeadlineForm ? (
            // Inline deadline form
            <div className="space-y-3 bg-blue-50 p-3 rounded-lg border border-blue-200">
              <h4 className="text-xs font-semibold text-blue-800">Set Deadline for In Progress</h4>
              
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Time</label>
                  <input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleDeadlineCancel}
                  className="flex-1 px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeadlineSubmit}
                  disabled={!selectedDate || !selectedTime}
                  className="flex-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Set Deadline
                </button>
              </div>
            </div>
          ) : (
            // Status selection
            <div className="space-y-2">
              <select
                value={workflow.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="text-xs border border-gray-300 rounded px-2 py-1 bg-white w-full"
              >
                {validOptions.map(option => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1).replace('-', ' ')}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  setEditingStatus(null);
                  setShowDeadlineForm(null);
                }}
                className="p-1 text-green-600 hover:text-green-800 w-full"
              >
                <Save className="w-3 h-3 mx-auto" />
              </button>
            </div>
          )
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className={`text-xs px-3 py-2 rounded-full capitalize font-medium text-center ${
                workflow.status === 'completed' ? 'bg-green-100 text-green-800' :
                workflow.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {workflow.status.replace('-', ' ')}
              </span>
              {!isLocked && (
                <button
                  onClick={() => setEditingStatus(deadlineFormKey)}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Workflow Details */}
            <div className="space-y-1 text-xs text-gray-600">
              {workflow.commenced && (
                <div className="flex items-center space-x-1">
                  <Timer className="w-3 h-3 text-blue-500" />
                  <span>Started: {formatDateTime(workflow.commenced)}</span>
                </div>
              )}
              
              {workflow.deadline && (
                <div className="flex items-center space-x-1">
                  <CalendarDays className="w-3 h-3 text-orange-500" />
                  <span>Deadline: {formatDateTime(workflow.deadline)}</span>
                  {daysRemaining !== null && (
                    <span className={`ml-1 ${daysRemaining < 0 ? 'text-red-600' : daysRemaining < 7 ? 'text-orange-600' : 'text-green-600'}`}>
                      ({daysRemaining < 0 ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days left`})
                    </span>
                  )}
                </div>
              )}
              
              {workflow.completed && (
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span>Completed: {formatDateTime(workflow.completed)}</span>
                  {isCurrentlyOverdue && (
                    <span className="text-red-600 font-medium">(DELAYED)</span>
                  )}
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
              <div 
                className={`h-1 rounded-full transition-all duration-500 ${
                  workflow.status === 'completed' ? 'bg-green-500 w-full' :
                  workflow.status === 'in-progress' ? 'bg-yellow-500 w-1/2' :
                  'bg-red-500 w-1/4'
                }`}
              ></div>
            </div>
          </div>
        )}
      </div>
    );
  });

  // Enhanced Status Card Component
  const StatusCard = ({ phase, title, icon }: { phase: string; title: string; icon: React.ReactElement }) => {
    const counts = getStatusCounts()[phase as keyof AllStatusCounts] || { completed: 0, 'in-progress': 0, pending: 0 };
    const total = counts.completed + counts['in-progress'] + counts.pending;
    const completedPercentage = total > 0 ? Math.round((counts.completed / total) * 100) : 0;
    
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden transform hover:scale-105 transition-all duration-300">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                {icon}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{title}</h3>
                <p className="text-blue-100 text-sm">{total} Total Tasks</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{completedPercentage}%</div>
              <div className="text-blue-100 text-sm">Completed</div>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <button
              onClick={() => setModalData({ phase, status: 'completed', interventions: getInterventionsByStatus(phase, 'completed') })}
              className="p-3 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-all cursor-pointer text-center group"
            >
              <div className="flex items-center justify-center space-x-2 mb-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="font-bold text-green-600 text-lg">{counts.completed}</span>
              </div>
              <div className="text-green-700 text-xs font-medium">Completed</div>
            </button>

            <button
              onClick={() => setModalData({ phase, status: 'in-progress', interventions: getInterventionsByStatus(phase, 'in-progress') })}
              className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 hover:bg-yellow-100 transition-all cursor-pointer text-center group"
            >
              <div className="flex items-center justify-center space-x-2 mb-1">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span className="font-bold text-yellow-600 text-lg">{counts['in-progress']}</span>
              </div>
              <div className="text-yellow-700 text-xs font-medium">In Progress</div>
            </button>

            <button
              onClick={() => setModalData({ phase, status: 'pending', interventions: getInterventionsByStatus(phase, 'pending') })}
              className="p-3 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 transition-all cursor-pointer text-center group"
            >
              <div className="flex items-center justify-center space-x-2 mb-1">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="font-bold text-red-600 text-lg">{counts.pending}</span>
              </div>
              <div className="text-red-700 text-xs font-medium">Pending</div>
            </button>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${completedPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>0%</span>
            <span className="font-medium">{completedPercentage}% Complete</span>
            <span>100%</span>
          </div>
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const progress = calculateOverallProgress();
  const locationProgress = getLocationProgress();
  const actionComparison = getActionComparison();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 relative overflow-hidden">
      {/* Enhanced Header with River Image */}
      <div className="bg-white shadow-lg border-b border-gray-200 relative z-10 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img 
            src={selectedRiver ? (() => {
              const isVaruna = selectedRiver.name.toLowerCase().includes('varuna');
              const images = isVaruna 
                ? ['/river1.png', '/river3.png', '/river5.png', '/river7.png']
                : ['/river2.png', '/river4.png', '/river6.png', '/river8.png'];
              const currentIndex = currentImageIndex[selectedRiver.id] || 0;
              return images[currentIndex];
            })() : '/river1.png'} 
            alt={`${selectedRiver?.name || 'River'} River`}
            className="w-full h-full object-cover transition-all duration-1000 ease-in-out"
          />
        </div>
        <div className="max-w-7xl mx-auto px-6 py-6 relative z-10">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-2">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl">
                <Droplets className="w-8 h-8 text-white" />
              </div>
              
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Varuna & Assi Comprehensive River Monitoring Dashboard
              </h1>
            </div>
            
            <p className="text-xl text-gray-600 font-medium">
              {riverData?.description || 'Comprehensive river monitoring and intervention tracking'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-6 py-6 relative z-10">
        <div className="flex space-x-1 bg-white/70 backdrop-blur-sm p-1 rounded-lg mb-6 shadow-lg border border-blue-100">
          {['overview', 'progress', 'comparison', 'delays'].map((tab, index) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 rounded-md font-medium transition-all duration-300 transform hover:scale-105 ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                {index === 0 && <Eye className="w-4 h-4" />}
                {index === 1 && <TrendingUp className="w-4 h-4" />}
                {index === 2 && <Activity className="w-4 h-4" />}
                {index === 3 && <Calendar className="w-4 h-4" />}
                <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Enhanced River Selection with Auto-sliding Images */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-6 border border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Select River</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rivers.map((river) => {
              const isVaruna = river.name.toLowerCase().includes('varuna');
              const images = isVaruna 
                ? ['/river1.png', '/river3.png', '/river5.png', '/river7.png']
                : ['/river2.png', '/river4.png', '/river6.png', '/river8.png'];
              const currentIndex = currentImageIndex[river.id] || 0;
              const currentImage = images[currentIndex];
              
              return (
                <button
                  key={river.id}
                  onClick={() => handleRiverSelect(river)}
                  className={`relative overflow-hidden rounded-xl border-2 transition-all transform hover:scale-105 duration-300 ${
                    selectedRiver?.id === river.id
                      ? 'border-blue-500 shadow-lg'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="aspect-video relative">
                    <img 
                      src={currentImage}
                      alt={`${river.name} River`}
                      className="w-full h-full object-cover transition-all duration-1000 ease-in-out"
                      key={`${river.id}-${currentIndex}`}
                      onError={(e) => { (e.target as HTMLImageElement).src = '/river1.png'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <div className="flex items-center space-x-2">
                        <Droplets className="w-5 h-5" />
                        <h3 className="text-xl font-bold">{river.name} River</h3>
                        {selectedRiver?.id === river.id && (
                          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-200 mt-1">{river.description}</p>
                    </div>
                    
                    {/* Image indicator dots */}
                    <div className="absolute top-4 right-4 flex space-x-1">
                      {images.map((_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            index === currentIndex ? 'bg-white' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {activeTab === 'overview' && (
          <>
            {/* Enhanced Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatusCard 
                phase="techReport" 
                title="Tech Report" 
                icon={<FileText className="w-6 h-6" />}
              />
              <StatusCard 
                phase="dpr" 
                title="DPR" 
                icon={<FileText className="w-6 h-6" />}
              />
              <StatusCard 
                phase="workAwarded" 
                title="Work Awarded" 
                icon={<Target className="w-6 h-6" />}
              />
              <StatusCard 
                phase="finished" 
                title="Finished" 
                icon={<CheckCircle className="w-6 h-6" />}
              />
            </div>

            {/* Inline Report Section */}
            {modalData && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8 overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {modalData.phase.replace(/([A-Z])/g, ' $1').trim()} - {modalData.status.replace('-', ' ')} Tasks
                    </h3>
                    <p className="text-blue-100">
                      {modalData.interventions.length} intervention(s) found
                    </p>
                  </div>
                  <button
                    onClick={() => setModalData(null)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="p-6 max-h-96 overflow-y-auto">
                  {modalData.interventions.length > 0 ? (
                    <div className="space-y-4">
                      {modalData.interventions.map((intervention: any, index: number) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-1">
                                {intervention.name}
                              </h4>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Location:</span> {intervention.locationName}
                              </p>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Action:</span> {intervention.actionName}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-medium text-gray-500">{intervention.id}</span>
                              <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium mt-1 ${
                                modalData.status === 'completed' ? 'bg-green-100 text-green-800' :
                                modalData.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {getStatusIcon(modalData.status)}
                                <span className="capitalize">{modalData.status.replace('-', ' ')}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-4 gap-3 mt-3">
                            {intervention.workflows?.map((workflow: Workflow) => (
                              <div key={workflow.id} className="text-center">
                                <div className="text-xs text-gray-500 mb-1 capitalize">
                                  {workflow.phase.replace(/([A-Z])/g, ' $1').trim()}
                                </div>
                                <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs ${
                                  workflow.status === 'completed' ? 'bg-green-100 text-green-700' :
                                  workflow.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {getStatusIcon(workflow.status)}
                                  <span className="capitalize">{workflow.status.replace('-', ' ')}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-4">
                        <FileText className="w-16 h-16 mx-auto" />
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No interventions found</h4>
                      <p className="text-gray-600">
                        There are no interventions with {modalData.status.replace('-', ' ')} status for this phase.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Enhanced Location Selection with Grid Layout */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-6 border border-blue-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Select Location</h3>
                  <div className="text-2xl">🏞️</div>
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="in-progress">In Progress</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
              
              {/* Location Grid Container */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-4">
                {riverData?.locations?.map((location, index) => (
                  <button
                    key={location.id}
                    onClick={() => setSelectedLocation(location)}
                    className={`p-4 rounded-lg font-medium transition-all text-left transform hover:scale-105 duration-300 relative overflow-hidden ${
                      selectedLocation?.id === location.id
                        ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-500 text-blue-700'
                        : 'bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-700 hover:from-blue-25 hover:to-blue-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="text-lg flex-shrink-0">
                        {index % 4 === 0 && '🌊'}
                        {index % 4 === 1 && '🏔️'}
                        {index % 4 === 2 && '🌿'}
                        {index % 4 === 3 && '🏙️'}
                      </div>
                      <span className="flex-1 truncate text-sm" title={location.name}>{location.name}</span>
                      {selectedLocation?.id === location.id && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse flex-shrink-0"></div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search actions or interventions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Actions and Interventions with Vertical Slider */}
            <div className="space-y-6">
              {filteredActions().map((action, actionIndex) => {
                const expandKey = `${selectedLocation?.id}-${action.id}-${actionIndex}`;
                const scrollState = interventionScrollStates[action.id] || { canScrollUp: false, canScrollDown: false };
                
                return (
                  <div key={`${selectedLocation?.id}-${action.id}-${actionIndex}`} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className={`bg-gradient-to-r ${getActionColorClass(action.color)} p-6 text-white`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 bg-gradient-to-r ${getActionColorClass(action.color)} rounded-full flex items-center justify-center text-white font-bold border-4 border-white/30 shadow-lg`}>
                            {action.id}
                          </div>
                          <div>
                            <h4 className="text-2xl font-bold flex items-center space-x-2">
                              <span>{action.icon}</span>
                              <span>{action.name}</span>
                            </h4>
                            <p className="text-white/80">{action.interventions?.length || 0} intervention(s)</p>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleActionExpansion(selectedLocation?.id || 0, `${action.id}-${actionIndex}`)}
                          className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                        >
                          {expandedActions[expandKey] ? 
                            <ChevronUp className="w-5 h-5" /> : 
                            <ChevronDown className="w-5 h-5" />
                          }
                        </button>
                      </div>
                    </div>
                    
                    <div className={`transition-all duration-300 overflow-hidden ${
                      expandedActions[expandKey] ? 'max-h-screen' : 'max-h-0'
                    }`}>
                      <div className="p-6">
                        {/* Intervention Header */}
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                            <span>Interventions</span>
                            <div className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full">
                              {action.interventions?.length || 0}
                            </div>
                          </h5>
                          
                          {/* Vertical Navigation Controls */}
                          {(action.interventions?.length || 0) > 2 && (
                            <div className="flex flex-col space-y-1">
                              <button
                                onClick={() => scrollInterventions(action.id, 'up')}
                                disabled={!scrollState.canScrollUp}
                                className={`p-1 rounded border transition-all ${
                                  scrollState.canScrollUp
                                    ? 'bg-white text-gray-600 hover:bg-gray-50 border-gray-300'
                                    : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                }`}
                                title="Scroll up"
                              >
                                <ChevronUp className="w-3 h-3" />
                              </button>
                              
                              <button
                                onClick={() => scrollInterventions(action.id, 'down')}
                                disabled={!scrollState.canScrollDown}
                                className={`p-1 rounded border transition-all ${
                                  scrollState.canScrollDown
                                    ? 'bg-white text-gray-600 hover:bg-gray-50 border-gray-300'
                                    : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                }`}
                                title="Scroll down"
                              >
                                <ChevronDown className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Scrollable Interventions Container - Vertical */}
                        <div className="relative">
                          <div 
                            id={`intervention-slider-${action.id}`}
                            className="space-y-4 max-h-96 overflow-y-auto scrollbar-hide"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                            onScroll={() => updateInterventionScrollState(action.id)}
                          >
                            {action.interventions?.map(intervention => (
                              <div key={intervention.id} className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-all">
                                <div className="flex items-center justify-between mb-4">
                                  <h6 className="text-lg font-semibold text-gray-900">{intervention.name}</h6>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border">
                                      ID: {intervention.id}
                                    </span>
                                    {/* Reset button for entire intervention */}
                                    <button
                                      onClick={() => resetIntervention(intervention.id)}
                                      className="p-1 text-orange-500 hover:text-orange-700 hover:bg-orange-50 rounded transition-colors"
                                      title="Reset entire intervention (all phases)"
                                    >
                                      <RotateCcw className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                                
                                {/* Department/Fund Scheme Selector */}
                                <DepartmentFundSelector intervention={intervention} />
                                
                                {/* Status Grid with Workflow Details */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                  {[...intervention.workflows || []]
                                    .sort((a, b) => {
                                      const phaseOrder = ['techReport', 'dpr', 'workAwarded', 'finished'];
                                      return phaseOrder.indexOf(a.phase) - phaseOrder.indexOf(b.phase);
                                    })
                                    .map(workflow => (
                                      <EnhancedStatusPhase
                                        key={workflow.id}
                                        intervention={intervention}
                                        workflow={workflow}
                                      />
                                    ))}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Gradient Overlays for Vertical Scroll */}
                          {scrollState.canScrollUp && (
                            <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-white to-transparent pointer-events-none z-10"></div>
                          )}
                          {scrollState.canScrollDown && (
                            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white to-transparent pointer-events-none z-10"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeTab === 'progress' && (
          <div className="space-y-6">
            {/* Progress Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Completed Tasks</h3>
                </div>
                <div className="text-3xl font-bold text-green-600 mb-2">{progress.completed}%</div>
                <div className="text-sm text-gray-600">{Math.round((progress.completed * progress.total) / 100)} of {progress.total} tasks</div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">In Progress</h3>
                </div>
                <div className="text-3xl font-bold text-yellow-600 mb-2">{progress.inProgress}%</div>
                <div className="text-sm text-gray-600">{Math.round((progress.inProgress * progress.total) / 100)} of {progress.total} tasks</div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Pending Tasks</h3>
                </div>
                <div className="text-3xl font-bold text-red-600 mb-2">{progress.pending}%</div>
                <div className="text-sm text-gray-600">{Math.round((progress.pending * progress.total) / 100)} of {progress.total} tasks</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Location Progress Chart */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                  Progress by Location
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={locationProgress} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80}
                      fontSize={12}
                      stroke="#6b7280"
                    />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar dataKey="completed" stackId="a" fill="#22c55e" name="Completed" />
                    <Bar dataKey="inProgress" stackId="a" fill="#f59e0b" name="In Progress" />
                    <Bar dataKey="pending" stackId="a" fill="#ef4444" name="Pending" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Overall Progress Radial Chart */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-blue-600" />
                  Overall Progress Distribution
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Completed', value: progress.completed, fill: '#22c55e' },
                        { name: 'In Progress', value: progress.inProgress, fill: '#f59e0b' },
                        { name: 'Pending', value: progress.pending, fill: '#ef4444' }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {[
                        { name: 'Completed', value: progress.completed, fill: '#22c55e' },
                        { name: 'In Progress', value: progress.inProgress, fill: '#f59e0b' },
                        { name: 'Pending', value: progress.pending, fill: '#ef4444' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} stroke="#fff" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value) => [`${value}%`, 'Percentage']}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'comparison' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-blue-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-blue-600" />
                Action Comparison
              </h3>
              
              {/* Interactive Filter Buttons */}
              <div className="flex space-x-2">
                {Object.entries(chartFilters).map(([key, isActive]) => (
                  <button
                    key={key}
                    onClick={() => toggleFilter(key as keyof ChartFilters)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all transform hover:scale-105 ${
                      isActive 
                        ? key === 'completed' ? 'bg-green-500 text-white shadow-lg hover:bg-green-600'
                        : key === 'inProgress' ? 'bg-yellow-500 text-white shadow-lg hover:bg-yellow-600'
                        : 'bg-red-500 text-white shadow-lg hover:bg-red-600'
                        : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        isActive 
                          ? 'bg-white'
                          : 'bg-gray-500'
                      }`}></div>
                      <span className="capitalize">{key === 'inProgress' ? 'In Progress' : key}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <ResponsiveContainer width="100%" height={500}>
              <BarChart data={actionComparison} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={80}
                  fontSize={12}
                  stroke="#6b7280"
                />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                {chartFilters.completed && <Bar dataKey="completed" fill="#22c55e" name="Completed" radius={[0, 0, 0, 0]} />}
                {chartFilters.inProgress && <Bar dataKey="inProgress" fill="#f59e0b" name="In Progress" radius={[0, 0, 0, 0]} />}
                {chartFilters.pending && <Bar dataKey="pending" fill="#ef4444" name="Pending" radius={[4, 4, 0, 0]} />}
              </BarChart>
            </ResponsiveContainer>

            {/* Interactive Legend with Status Indicators */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <button
                onClick={() => toggleFilter('completed')}
                className={`flex items-center space-x-3 p-4 rounded-lg border transition-all transform hover:scale-105 ${
                  chartFilters.completed 
                    ? 'bg-green-50 border-green-200 hover:bg-green-100 shadow-lg' 
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  chartFilters.completed ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gray-400'
                }`}>
                  {chartFilters.completed && <span className="text-white text-xs">✓</span>}
                </div>
                <div>
                  <p className={`font-medium ${chartFilters.completed ? 'text-green-800' : 'text-gray-600'}`}>
                    Completed
                  </p>
                  <p className={`text-sm ${chartFilters.completed ? 'text-green-600' : 'text-gray-500'}`}>
                    {actionComparison.reduce((sum, action) => sum + action.completed, 0)} tasks
                  </p>
                </div>
              </button>
              <button
                onClick={() => toggleFilter('inProgress')}
                className={`flex items-center space-x-3 p-4 rounded-lg border transition-all transform hover:scale-105 ${
                  chartFilters.inProgress 
                    ? 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100 shadow-lg' 
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  chartFilters.inProgress ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 'bg-gray-400'
                }`}>
                  {chartFilters.inProgress && <span className="text-white text-xs">◐</span>}
                </div>
                <div>
                  <p className={`font-medium ${chartFilters.inProgress ? 'text-yellow-800' : 'text-gray-600'}`}>
                    In Progress
                  </p>
                  <p className={`text-sm ${chartFilters.inProgress ? 'text-yellow-600' : 'text-gray-500'}`}>
                    {actionComparison.reduce((sum, action) => sum + action.inProgress, 0)} tasks
                  </p>
                </div>
              </button>
              <button
                onClick={() => toggleFilter('pending')}
                className={`flex items-center space-x-3 p-4 rounded-lg border transition-all transform hover:scale-105 ${
                  chartFilters.pending 
                    ? 'bg-red-50 border-red-200 hover:bg-red-100 shadow-lg' 
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  chartFilters.pending ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gray-400'
                }`}>
                  {chartFilters.pending && <span className="text-white text-xs">⏸</span>}
                </div>
                <div>
                  <p className={`font-medium ${chartFilters.pending ? 'text-red-800' : 'text-gray-600'}`}>
                    Pending
                  </p>
                  <p className={`text-sm ${chartFilters.pending ? 'text-red-600' : 'text-gray-500'}`}>
                    {actionComparison.reduce((sum, action) => sum + action.pending, 0)} tasks
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Enhanced Delays Tab with Automatic Delay Detection */}
        {activeTab === 'delays' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-blue-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-red-600" />
              Delayed Activities ({delayedInterventions.length})
            </h3>
            {delayedInterventions.length > 0 ? (
              <div className="space-y-4">
                {delayedInterventions.map((delay) => (
                  <div key={delay.id} className="border border-red-200 rounded-lg p-4 bg-red-50/80 backdrop-blur-sm">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-medium text-red-900">{delay.interventionName}</h4>
                        <p className="text-sm text-red-700 mt-1">
                          <span className="font-medium">Location:</span> {delay.location}
                        </p>
                        <p className="text-sm text-red-700">
                          <span className="font-medium">Action:</span> {delay.action}
                        </p>
                        <p className="text-sm text-red-700">
                          <span className="font-medium">Department:</span> {delay.department}
                        </p>
                        <p className="text-sm text-red-700">
                          <span className="font-medium">Fund Scheme:</span> {delay.fundScheme}
                        </p>
                        
                        <div className="mt-3">
                          <h5 className="text-sm font-medium text-red-800 mb-2">Delayed Phases:</h5>
                          <div className="space-y-1">
                            {delay.delayedPhases?.map((phase, index) => (
                              <div key={index} className="text-xs text-red-600 bg-red-100 rounded p-2">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">{phase.phase.replace(/([A-Z])/g, ' $1').trim()}</span>
                                  <span className="font-bold">{phase.daysDelayed} days delayed</span>
                                </div>
                                <div className="mt-1">
                                  Deadline: {formatDateTime(phase.deadline)}
                                  {phase.completedAt && (
                                    <span className="ml-2">| Completed: {formatDateTime(phase.completedAt)}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Delayed Activities</h4>
                <p className="text-gray-600">All activities are progressing as planned!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hide scrollbar for webkit browsers */}
      <style jsx>{`
        .scrollbar-hide {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* Internet Explorer 10+ */
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none; /* WebKit */
        }
      `}</style>
    </div>
  );
};

export default EnhancedRiverDashboard;
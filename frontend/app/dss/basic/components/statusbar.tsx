'use client'

import { useState, useEffect, useMemo } from 'react'
import { CheckCircle, CircleDot, Circle, ChevronDown, ChevronRight, ArrowLeft } from 'lucide-react'

interface Step {
  id: string
  name: string
  status: 'completed' | 'current' | 'upcoming' | 'skipped'
}

interface StatusBarProps {
  currentStep: number
  onStepChange?: (stepIndex: number) => void
  skippedSteps?: number[]
  completedSteps?: number[]
  viewMode: 'admin' | 'drain';
}

export default function StatusBar({ currentStep, onStepChange, skippedSteps = [], completedSteps = [], viewMode }: StatusBarProps) {
  // Define base steps outside of render
  const baseSteps: Step[] = useMemo(() => [
    { id: 'population', name: 'Population Forecasting', status: 'upcoming' },
    { id: 'demand', name: 'Water Demand', status: 'upcoming' },
    { id: 'supply', name: 'Water Supply', status: 'upcoming' },
    { id: 'quality', name: 'Sewage', status: 'upcoming' }
  ], []);

  // Calculate steps with status only when dependencies change
  const steps = useMemo(() => {
    return baseSteps.map((step, i) => ({
      ...step,
      status: completedSteps.includes(i)
        ? 'completed'
        : skippedSteps.includes(i)
          ? 'skipped'
          : i === currentStep
            ? 'current'
            : 'upcoming'
    }));
  }, [currentStep, skippedSteps, completedSteps, baseSteps]);

  const handleStepClick = (index: number) => {
    if (index < currentStep && onStepChange) {
      onStepChange(index);
    }
  };

  return (
    <div className="w-full md:w-full bg-white border-b md:border-b-0 md:border-r border-gray-200 shadow-sm h-auto md:h-full">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800">Basic Module</h2>
      </div>

      <nav aria-label="Progress" className="p-6">
        <ol className="flex flex-col md:space-y-10 md:flex-col flex-row justify-center space-x-6 md:space-x-0 relative">
          {steps.map((step, idx) => (
            <li
              key={step.id}
              className={`relative flex-shrink-0 md:flex-shrink md:w-auto ${idx < currentStep ? 'cursor-pointer group' : ''}`}
              onClick={() => handleStepClick(idx)}
            >
              <div className={`flex md:flex-row flex-col items-center justify-center md:items-start space-x-0 md:space-x-3 space-y-2 md:space-y-0 transition-all duration-300 ${idx < currentStep ? 'group-hover:translate-x-1' : ''}`}>
                <div className="flex flex-col items-center w-full md:w-auto">
                  {step.status === 'completed' ? (
                    <div className="relative">
                      <CheckCircle className="h-6 w-6 text-green-600 transition-all duration-300 group-hover:scale-110" />
                      <ArrowLeft className="absolute -left-5 opacity-0 group-hover:opacity-100 text-green-600 transition-all duration-300" size={14} />
                    </div>
                  ) : step.status === 'skipped' ? (
                    <div className="relative">
                      <CheckCircle className="h-6 w-6 text-yellow-500 transition-all duration-300 group-hover:scale-110" />
                      <ArrowLeft className="absolute -left-5 opacity-0 group-hover:opacity-100 text-yellow-600 transition-all duration-300" size={14} />
                    </div>
                  ) : step.status === 'current' ? (
                    <CircleDot className="h-6 w-6 text-blue-600 animate-pulse" />
                  ) : (
                    <Circle className="h-6 w-6 text-gray-300" />
                  )}

                  {idx < steps.length - 1 && (
                    <div className="relative h-10 md:h-10 md:w-1 w-10 flex items-center justify-center">
                      {/* Line - vertical on desktop, horizontal on mobile */}
                      <div className={`md:h-10 md:w-1 h-1 w-10 rounded-full transition-all duration-500 ${step.status === 'completed' ? 'bg-green-400' :
                          step.status === 'skipped' ? 'bg-yellow-400' :
                            step.status === 'current' ? 'bg-blue-300' :
                              'bg-gray-200'
                        }`} />

                      {(step.status === 'completed' || step.status === 'skipped') && (
                        <>
                          {/* Vertical chevron for desktop */}
                          <ChevronDown
                            className={`hidden md:block absolute animate-bounce opacity-70 ${step.status === 'completed' ? 'text-green-500' : 'text-yellow-500'
                              }`}
                            size={30}
                            style={{ top: '80%' }}
                          />
                          {/* Horizontal chevron for mobile */}
                          <ChevronRight
                            className={`block md:hidden absolute  opacity-70 ${step.status === 'completed' ? 'text-green-500' : 'text-yellow-500'
                              }`}
                            size={30}
                            style={{ left: '80%' }}
                          />
                        </>
                      )}

                      {step.status === 'current' && (
                        <div className="absolute w-3 h-3 bg-blue-400 rounded-full opacity-0 animate-ping"
                          style={{
                            top: 'calc(50% - 6px)',
                            left: 'calc(50% - 6px)'
                          }} />
                      )}
                    </div>
                  )}
                </div>

                <div className="flex-1 text-center md:text-left">
                  <div
                    className={`text-sm font-semibold transition-colors duration-300 ${step.status === 'completed' ? 'text-green-600' :
                        step.status === 'skipped' ? 'text-yellow-600' :
                          step.status === 'current' ? 'text-blue-600' :
                            'text-gray-500'
                      }`}
                  >
                    {step.name}
                  </div>
                  {idx < currentStep && (
                    <div className="text-xs text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      Click to return
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-auto p-4 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          Step <span className="font-medium">{currentStep + 1}</span> of {steps.length}
        </div>
      </div>
    </div>
  );
}
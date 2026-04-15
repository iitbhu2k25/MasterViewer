// components/StepCardsGrid.jsx
'use client';
import React from 'react';
import Link from "next/link";

const stepItems = [
  {
    href: '/step1',
    number: '01',
    icon: 'globe',
    title: 'Data Management and Analysis',
    color: '#F15A29', // Orange
    description: [
      'Data collection and organization',
      'Statistical analysis of datasets',
      'Visualization of key metrics'
    ]
  },
  {
    href: '/step2',
    number: '02',
    icon: 'location',
    title: 'Decision Support System Interface',
    color: '#29ABE2', // Blue
    description: [
      'Interactive dashboard controls',
      'Scenario comparison tools',
      'Real-time data integration'
    ]
  },
  {
    href: '/step3',
    number: '03',
    icon: 'settings',
    title: 'Intervention Strategies',
    color: '#2E75B6', // Dark Blue
    description: [
      'Strategy development frameworks',
      'Implementation planning tools',
      'Resource allocation optimization'
    ]
  },
  {
    href: '/step4',
    number: '04',
    icon: 'chart',
    title: 'Monitoring and Documentation',
    color: '#7030A0', // Purple
    description: [
      'Progress tracking systems',
      'Automated reporting tools',
      'Performance metric analysis'
    ]
  }
];

const renderIcon = (icon:string, color:string) => {
  switch (icon) {
    case 'globe':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
      );
    case 'location':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      );
    case 'settings':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      );
    case 'chart':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"></line>
          <line x1="12" y1="20" x2="12" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="14"></line>
          <line x1="2" y1="20" x2="22" y2="20"></line>
        </svg>
      );
    default:
      return null;
  }
};

export default function StepCardsGrid() {
  return (
    <section className="py-5 flex justify-center items-center max-w-[80%] mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-5 w-full">
        {stepItems.map((item, index) => (
          <Link href={item.href} key={index} passHref>
            <div
              className="grid-item bg-white rounded-xl shadow-lg text-center overflow-hidden relative
                transform transition-all duration-300 ease-in-out hover:scale-[1.1] hover:shadow-2xl 
                hover:z-10"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Top curved header with icon */}
              <div 
                className="h-16 px-4 flex items-center justify-center text-white font-bold relative" 
                style={{ 
                  background: item.color,
                  borderRadius: '0 0 100% 100% / 0 0 20px 20px',
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="mr-2">
                    {renderIcon(item.icon, 'white')}
                  </div>
                  <div className="text-sm font-medium">{item.title}</div>
                </div>
              </div>
              
              {/* Card content */}
              <div className="p-6 flex flex-col items-center">
                {/* Step number */}
                <h3 className="text-gray-600 font-bold mb-4">Step {item.number}</h3>
                
                {/* Description as bullet points */}
                <ul className="text-left w-full mb-8">
                  {item.description.map((point, i) => (
                    <li key={i} className="text-gray-500 text-sm mb-2 flex items-start">
                      <div className="min-w-4 min-h-4 w-4 h-4 mr-2 mt-1 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                
                {/* Title circle
                <div 
                  className="absolute -bottom-6 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ 
                    background: item.color,
                    boxShadow: `0 4px 8px rgba(0, 0, 0, 0.2)`,
                  }}> 
                </div> */}
              </div>
              
              {/* Bottom shadow effect */}
              <div
                className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-3/4 h-8 opacity-20 rounded-full"
                style={{ 
                  background: item.color,
                  filter: 'blur(8px)',
                }}
              ></div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
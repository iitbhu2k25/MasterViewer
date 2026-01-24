"use client";

import { useState, useEffect } from 'react';
import GridSection from './component/home_grid/GridSection';
import GalleryCarousel from './component/project_images/GalleryCarousel';
import StepCardsGrid from './component/cards/StepCards.Grid';
import SocialGridSection from './component/social/social';
// Import the Varuna Dashboard
import VarunaRiverDashboard from '../varuna/dashboard/page';

export default function Home() {
  const [showVarunaDashboard, setShowVarunaDashboard] = useState(false); // Dashboard state

  useEffect(() => {
    setupBackButtonControl();
  }, []);

  // Simple back button control
  const setupBackButtonControl = () => {
    console.log('🔧 Setting up back button control');
    
    const handlePopstate = () => {
      console.log('🔙 Back button pressed');
      
      // If dashboard is open, close it
      if (showVarunaDashboard) {
        console.log('🔙 Closing dashboard');
        setShowVarunaDashboard(false);
      } else {
        // Stay on current page - no exit from app
        console.log('🔙 Staying on home page');
        window.location.href = '/dss/home';
      }
    };

    window.addEventListener('popstate', handlePopstate);
    
    return () => {
      window.removeEventListener('popstate', handlePopstate);
    };
  };

  // Show Varuna Dashboard INSTANTLY when button clicked
  if (showVarunaDashboard) {
    return (
      <div>
        {/* Hide the main navbar using CSS and remove gaps */}
       {/* Hide navbar and header sections */}
<style jsx global>{`
  nav, .navbar, [class*="nav"], [class*="Nav"] {
    display: none !important;
  }
  /* Hide the top header with logos and Decision Support System text */
  header, .header, [class*="header"], [class*="Header"] {
    display: none !important;
  }
  /* Hide any top banner/logo sections */
  .top-banner, .logo-section, .government-header {
    display: none !important;
  }
  /* Remove any margins/padding that might create gaps */
  body {
    margin: 0 !important;
    padding: 0 !important;
  }
  /* Ensure content flows from top-left */
  #__next {
    margin: 0 !important;
    padding: 0 !important;
  }
  /* Remove any container margins */
  .container, [class*="container"] {
    margin-left: 0 !important;
    padding-left: 0 !important;
  }
  /* Remove blue background that creates gap */
  .min-h-screen.bg-gray-50 {
    background: white !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  /* Hide the very top section completely */
  body > div:first-child > div:first-child {
    display: none !important;
  }
`}</style>
        {/* Small Back button positioned on left - NO gaps */}
        <div className="bg-white border-b px-4 py-2" style={{ margin: 0, padding: '8px 16px' }}>
          <button
            onClick={() => setShowVarunaDashboard(false)} // INSTANT back
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors flex items-center"
          >
            ← Back to Home
          </button>
        </div>
        
        {/* Varuna Dashboard component - ensure it starts immediately below */}
        <div style={{ margin: 0, padding: 0, backgroundColor: 'white' }}>
          <VarunaRiverDashboard />
        </div>
      </div>
    );
  }

  // Show main home page with dashboard button - WITH REDUCED SPACING
  return (
    <div className="-mt-8"> {/* Reduce space above grid section */}
      {/* Your home page components - UNCHANGED */}
      <GridSection/>

      {/* Dashboard Button - positioned after GridSection with reduced spacing */}
      <div className="flex justify-center py-0 bg-gray-50 -mt-10"> {/* Reduced spacing above button */}
        <button
          onClick={() => setShowVarunaDashboard(true)} // INSTANT - no router.push()
        //   className="group relative bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-700 hover:from-blue-700 hover:via-cyan-600 hover:to-blue-800 text-white px-8 py-3 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-3 border-2 border-white/20"
        // >
                  className="group relative bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-600 hover:via-orange-600 hover:to-red-600 text-white px-8 py-3 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-3 border-2 border-white/20"        >

          {/* Logo */}
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <img src="/varuna_logo.png" alt="Varuna Logo" className="w-6 h-6 object-contain" />
            {/* Fallback emoji if logo doesn't load */}
            {/* <span className="text-xl">🌊</span> */}
          </div>
          
          <div className="flex flex-col items-start">
            <span className="font-bold text-lg">Varuna River Dashboard</span>
            <span className="text-xs text-blue-100 opacity-90">Real-time River Status Monitoring</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium">Live</span>
          </div>
          
          {/* Animated border effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
        </button>
      </div>

      {/* Rest of your home page components - UNCHANGED */}
      <StepCardsGrid/>
      <SocialGridSection/>
      <GalleryCarousel/>
    </div>
  );
}
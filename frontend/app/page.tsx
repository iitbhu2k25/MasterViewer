"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Login from './dss/auth/components/login';
// Import your actual home page components
import GridSection from './dss/home/component/home_grid/GridSection'; 
import GalleryCarousel from './dss/home/component/project_images/GalleryCarousel'; 
import StepCardsGrid from './dss/home/component/cards/StepCards.Grid'; 
import SocialGridSection from './dss/home/component/social/social';
// Import your navbar if you want it
// import ResponsiveNavbar from './components/Navbar';
// Import the Varuna Dashboard from correct path
import VarunaRiverDashboard from './dss/varuna/dashboard/page';

// Helper functions for cookie management
const setCookie = (name: string, value: string, days: number = 1) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
};

const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      return c.substring(nameEQ.length, c.length);
    }
  }
  return null;
};

const clearAllAuthData = () => {
  console.log('🧹 CLEARING ALL AUTHENTICATION DATA');
  
  // Clear localStorage
  localStorage.removeItem('access_token');
  localStorage.removeItem('isAuthenticated');
  
  // Clear all auth-related keys from localStorage
  Object.keys(localStorage).forEach(key => {
    if (key.includes('access') || key.includes('auth') || key.includes('token')) {
      localStorage.removeItem(key);
    }
  });
  
  // Clear cookies with multiple path attempts
  const expiredDate = new Date();
  expiredDate.setTime(expiredDate.getTime() - (24 * 60 * 60 * 1000));
  const expiredString = expiredDate.toUTCString();
  
  const cookiesToClear = ['access_token', 'isAuthenticated'];
  const pathVariations = ['/', '/dss', '/dss/', '/dss/home', '/dss/basic'];
  
  cookiesToClear.forEach(cookieName => {
    pathVariations.forEach(path => {
      document.cookie = `${cookieName}=; expires=${expiredString}; path=${path}; SameSite=Lax`;
    });
  });
  
  // Nuclear option - clear ALL cookies
  document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + expiredString + ";path=/"); 
  });
  
  console.log('✅ All authentication data cleared');
};

export default function HomePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showVarunaDashboard, setShowVarunaDashboard] = useState(false); // NEW: Dashboard state

  useEffect(() => {
    checkAuthenticationStatus();
    setupBackButtonControl();
  }, []);

  // Simple back button control - KEEPING YOUR EXACT CODE
  const setupBackButtonControl = () => {
    const backButtonOverride = () => {
      const token = localStorage.getItem('access_token') || getCookie('access_token');
      const authStatus = localStorage.getItem('isAuthenticated') || getCookie('isAuthenticated');
      const isCurrentlyAuthenticated = token && authStatus === 'true';
      
      if (isCurrentlyAuthenticated) {
        console.log('🔙 Back button: redirecting to home');
        // If dashboard is open, close it instead of redirecting
        if (showVarunaDashboard) {
          setShowVarunaDashboard(false);
        } else {
          window.location.replace('http://localhost:3000/');
        }
      }
    };

    const handlePopstate = (event: PopStateEvent) => {
      backButtonOverride();
    };

    window.addEventListener('popstate', handlePopstate);
    (window as any).dssBackButtonOverride = backButtonOverride;
    
    return () => {
      window.removeEventListener('popstate', handlePopstate);
    };
  };

  const checkAuthenticationStatus = () => {
    console.log('🔐 CHECKING AUTHENTICATION STATUS');
    
    try {
      // Check both localStorage and cookies
      const localToken = localStorage.getItem('access_token');
      const cookieToken = getCookie('access_token');
      const localAuth = localStorage.getItem('isAuthenticated');
      const cookieAuth = getCookie('isAuthenticated');
      
      const token = localToken || cookieToken;
      const authStatus = localAuth || cookieAuth;
      
      console.log('📊 AUTH STATUS CHECK:', {
        localToken: localToken ? `${localToken.substring(0, 10)}...` : 'none',
        cookieToken: cookieToken ? `${cookieToken.substring(0, 10)}...` : 'none',
        localAuth,
        cookieAuth,
        finalToken: token ? `${token.substring(0, 10)}...` : 'none',
        finalAuthStatus: authStatus
      });
      
      // Strict validation
      const isValidToken = token && 
                          token.length > 10 && 
                          token !== 'undefined' && 
                          token !== 'null' && 
                          token !== '';
      
      const isValidAuth = authStatus === 'true';
      
      if (isValidToken && isValidAuth) {
        console.log('✅ USER IS AUTHENTICATED');
        
        // Sync both storage methods
        if (token) {
          localStorage.setItem('access_token', token);
          setCookie('access_token', token, 1);
        }
        localStorage.setItem('isAuthenticated', 'true');
        setCookie('isAuthenticated', 'true', 1);
        
        setIsAuthenticated(true);
      } else {
        console.log('❌ USER IS NOT AUTHENTICATED OR INVALID DATA');
        
        // Clear any partial/invalid auth data
        if ((token && !isValidToken) || (authStatus && !isValidAuth)) {
          console.log('🧹 CLEARING INVALID AUTH DATA');
          clearAllAuthData();
        }
        
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('❌ AUTH CHECK ERROR:', error);
      clearAllAuthData();
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = () => {
    console.log('🎉 LOGIN SUCCESS HANDLER CALLED');
    
    setTimeout(() => {
      console.log('🔄 RECHECKING AUTH STATUS AFTER LOGIN');
      checkAuthenticationStatus();
      // No redirect - just stay on the same page and show home components
    }, 100);
  };

  // Show loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-4 h-4 bg-indigo-600 rounded-full animate-pulse"></div>
            <div className="w-4 h-4 bg-indigo-600 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
            <div className="w-4 h-4 bg-indigo-600 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
          </div>
          <p className="text-gray-600">प्रमाणीकरण जांच रहे हैं... | Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // NEW: Show Varuna Dashboard when button clicked
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
            onClick={() => setShowVarunaDashboard(false)}
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

  // Show main application if authenticated - WITH REDUCED SPACING
  return (
    <div className="-mt-8"> {/* Reduce space above grid section */}
      {/* Include navbar if you want it */}
      {/* <ResponsiveNavbar /> */}
      
      {/* Your actual home page components */}
      <GridSection/>

      {/* NEW: Dashboard Button - positioned after GridSection with reduced spacing */}
<div className="flex justify-center py-0 bg-gray-50 -mt-10"> {/* Reduced spacing above button */}
        <button
          onClick={() => setShowVarunaDashboard(true)}
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
      
      <StepCardsGrid/>       
      <SocialGridSection/>       
      <GalleryCarousel/>     
    </div>
  );
}
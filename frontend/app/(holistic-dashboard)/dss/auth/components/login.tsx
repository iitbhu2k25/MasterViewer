"use client";

import { useState } from 'react';

interface LoginFormData {
  username: string;
  password: string;
}

interface LoginResponse {
  access_token?: string;
  message?: string;
  error?: string;
}

interface LoginProps {
  onLoginSuccess?: () => void;
}

// Helper function to set cookies
const setCookie = (name: string, value: string, days: number = 1) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  const cookieString = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  document.cookie = cookieString;
  console.log(`🍪 COOKIE SET: ${name}=${value}`);
};

// Helper function to get cookie value
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

export default function Login({ onLoginSuccess }: LoginProps) {
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    console.log('🚀 STARTING LOGIN PROCESS');

    try {
      const response = await fetch('http://localhost:9000/api/auth/login/', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        }),
      });

      const data = await response.json();
      console.log('📦 LOGIN RESPONSE:', { 
        status: response.status, 
        ok: response.ok,
        data: data 
      });

      if (response.ok) {
        console.log('🎉 LOGIN SUCCESSFUL');
        
        // Use provided token or create fallback
        const token = data.access_token || `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        console.log('💾 STORING AUTH DATA IN BOTH STORAGE TYPES');
        
        // Store in BOTH localStorage AND cookies for complete compatibility
        localStorage.setItem('access_token', token);
        localStorage.setItem('isAuthenticated', 'true');
        setCookie('access_token', token, 1);
        setCookie('isAuthenticated', 'true', 1);
        
        console.log('✅ AUTH DATA STORED SUCCESSFULLY');
        
        // Call parent success handler
        if (onLoginSuccess) {
          console.log('📞 CALLING PARENT SUCCESS HANDLER');
          onLoginSuccess();
        }
        
        console.log('🏠 LOGIN COMPONENT COMPLETE');
        
      } else {
        console.log('❌ LOGIN FAILED:', data.error);
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      console.error('❌ LOGIN ERROR:', err);
      setError('Network error - Please check your connection');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      {/* Beautiful Ganga-themed background */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(135deg, 
              rgba(135, 206, 235, 0.8) 0%, 
              rgba(70, 130, 180, 0.9) 25%, 
              rgba(30, 144, 255, 0.85) 50%, 
              rgba(65, 105, 225, 0.9) 75%, 
              rgba(25, 25, 112, 0.8) 100%
            ),
            radial-gradient(ellipse at 30% 60%, rgba(176, 224, 230, 0.6) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 40%, rgba(135, 206, 250, 0.5) 0%, transparent 60%)
          `
        }}
      >
        
        {/* Natural River Water Body */}
        <div 
          className="absolute inset-0 transform -rotate-12 scale-150"
          style={{
            background: `
              radial-gradient(ellipse 800px 300px at 50% 60%, 
                rgba(30, 144, 255, 0.9) 0%,
                rgba(65, 105, 225, 0.8) 30%,
                rgba(25, 25, 112, 0.7) 70%,
                transparent 100%
              )
            `,
            filter: 'blur(1px)',
            clipPath: 'polygon(0% 40%, 100% 45%, 100% 65%, 0% 60%)'
          }}
        >
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              background: `
                repeating-linear-gradient(
                  90deg,
                  transparent 0px,
                  rgba(255, 255, 255, 0.1) 2px,
                  transparent 4px,
                  rgba(255, 255, 255, 0.05) 8px,
                  transparent 12px
                ),
                repeating-linear-gradient(
                  45deg,
                  transparent 0px,
                  rgba(255, 255, 255, 0.05) 1px,
                  transparent 3px
                )
              `,
              animation: 'waterFlow 20s linear infinite'
            }}
          />
        </div>

        <div 
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(
                180deg,
                transparent 0%,
                transparent 45%,
                rgba(255, 255, 255, 0.1) 50%,
                rgba(255, 255, 255, 0.05) 55%,
                transparent 65%,
                transparent 100%
              )
            `,
            animation: 'reflection 8s ease-in-out infinite'
          }}
        />

        <div className="absolute bottom-0 left-0 w-full h-32 opacity-20">
          <div 
            className="absolute bottom-0 left-8 w-40 h-24"
            style={{
              background: 'linear-gradient(to top, rgba(101, 67, 33, 0.8), rgba(139, 69, 19, 0.6), transparent)',
              clipPath: 'polygon(0% 100%, 20% 80%, 25% 70%, 30% 65%, 40% 60%, 50% 55%, 65% 45%, 75% 40%, 85% 30%, 90% 20%, 95% 10%, 100% 0%, 100% 100%)'
            }}
          >
            <div className="absolute top-2 left-12 w-3 h-8 bg-amber-900 opacity-60 rounded-t-full"></div>
            <div className="absolute top-0 left-20 w-4 h-10 bg-amber-800 opacity-70 rounded-t-full"></div>
            <div className="absolute top-4 left-28 w-2 h-6 bg-amber-900 opacity-60 rounded-t-full"></div>
          </div>

          <div 
            className="absolute bottom-0 right-12 w-36 h-20"
            style={{
              background: 'linear-gradient(to top, rgba(160, 82, 45, 0.7), rgba(210, 180, 140, 0.5), transparent)',
              clipPath: 'polygon(0% 100%, 15% 85%, 25% 75%, 35% 65%, 45% 55%, 60% 45%, 70% 35%, 80% 25%, 90% 15%, 100% 0%, 100% 100%)'
            }}
          >
            <div className="absolute top-1 left-8 w-5 h-7 bg-orange-900 opacity-50 rounded-t-lg"></div>
            <div className="absolute top-3 left-16 w-3 h-5 bg-orange-800 opacity-60 rounded-t-md"></div>
            <div className="absolute top-0 left-24 w-4 h-8 bg-orange-900 opacity-55 rounded-t-lg"></div>
          </div>
        </div>

        <div className="absolute inset-0 opacity-40">
          <div 
            className="absolute w-2 h-2 bg-orange-300 rounded-full shadow-lg"
            style={{
              top: '58%',
              left: '25%',
              animation: 'float 12s ease-in-out infinite',
              filter: 'blur(0.5px)'
            }}
          />
          <div 
            className="absolute w-1.5 h-1.5 bg-yellow-300 rounded-full shadow-md"
            style={{
              top: '52%',
              left: '45%',
              animation: 'float 15s ease-in-out infinite reverse',
              filter: 'blur(0.3px)'
            }}
          />
          <div 
            className="absolute w-3 h-3 bg-pink-200 rounded-full shadow-lg"
            style={{
              top: '60%',
              left: '70%',
              animation: 'float 18s ease-in-out infinite',
              filter: 'blur(0.4px)'
            }}
          />
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes waterFlow {
          0% { transform: translateX(-100px) translateY(0px); }
          50% { transform: translateX(50px) translateY(-10px); }
          100% { transform: translateX(-100px) translateY(0px); }
        }
        
        @keyframes reflection {
          0%, 100% { opacity: 0.6; transform: scaleY(1); }
          50% { opacity: 0.9; transform: scaleY(1.05); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-8px) translateX(10px); }
          50% { transform: translateY(-5px) translateX(20px); }
          75% { transform: translateY(-12px) translateX(15px); }
        }
      `}</style>

      {/* Login Form */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-2 sm:p-4">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-4 sm:p-6 w-full max-w-md border border-white/30 relative overflow-hidden max-h-[95vh] flex flex-col justify-center">
          
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 rounded-t-3xl">
            <div 
              className="h-full bg-gradient-to-r from-transparent via-white/40 to-transparent"
              style={{ animation: 'reflection 3s ease-in-out infinite' }}
            />
          </div>

          {/* Government Header - ADDED Ashok logo as first logo */}
          <div className="text-center mb-3 sm:mb-4">
            {/* Four logos: Ashok, IIT BHU, SLCR, and Namami Gange */}
            <div className="flex justify-center items-center mb-3 sm:mb-4 bg-white/40 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/30">
              <div className="flex justify-center items-center space-x-4 sm:space-x-6">
                <div className="flex flex-col items-center">
                  <img
                    src="/Images/header/left1_ashok.png"
                    alt="Ashok Emblem"
                    title="Government of India Emblem"
                    className="w-22 sm:w-26 h-auto transition-transform duration-300 hover:scale-110 filter drop-shadow-md"
                  />
                </div>
                
                <div className="flex flex-col items-center">
                  <img
                    src="/Images/header/left2_IIt_logo.png"
                    alt="IIT BHU Logo"
                    title="Indian Institute of Technology (BHU) Varanasi"
                    className="w-40 sm:w-44 h-auto transition-transform duration-300 hover:scale-110 filter drop-shadow-md"
                  />
                </div>
                
                <div className="flex flex-col items-center">
                  <img
                    src="/Images/header/right1_slcr.png"
                    alt="SLCR Logo"
                    title="Smart Laboratory on Clean River"
                    className="w-40 sm:w-44 h-auto transition-transform duration-300 hover:scale-110 filter drop-shadow-md"
                  />
                </div>
                
                <div className="flex flex-col items-center">
                  <img
                    src="/Images/header/right2_namami_ganga.gif"
                    alt="Namami Gange Logo"
                    title="National Mission for Clean Ganga"
                    className="w-24 sm:w-32 h-auto transition-transform duration-300 hover:scale-110 filter drop-shadow-md"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-0.5 sm:space-y-1">
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
                जल शक्ति मंत्रालय
              </h1>
              <h2 className="text-sm sm:text-base font-semibold text-blue-700">
                Ministry of Jal Shakti
              </h2>
              <p className="text-xs text-gray-600 font-medium">
                भारत सरकार | Government of India
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-2 sm:p-3 my-2 sm:my-3 border border-cyan-100 relative">
              <h3 className="text-sm sm:text-base font-bold text-cyan-700 mb-0.5">नमामि गंगे</h3>
              <p className="text-xs text-cyan-600 font-medium mb-0.5">National Mission for Clean Ganga</p>
              <p className="text-xs text-blue-600 font-medium">Small Rivers Management Tool (SRMT)</p>
            </div>
            
            <p className="text-gray-700 text-xs sm:text-sm font-medium">
              कृपया अपनी साख प्रविष्ट करें | Please enter your credentials
            </p>
          </div>
          
          <form className="space-y-3 sm:space-y-4" onSubmit={handleSubmit}>
            <div className="relative">
              <label htmlFor="username" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                उपयोगकर्ता नाम | Username
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/80 text-sm"
                  placeholder="अपना उपयोगकर्ता नाम दर्ज करें"
                  value={formData.username}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="relative">
              <label htmlFor="password" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                पासवर्ड | Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/80 text-sm"
                  placeholder="अपना पासवर्ड दर्ज करें"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border-2 border-red-200 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 py-2.5 sm:py-3 px-4 sm:px-6 text-white font-semibold shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 text-sm sm:text-base"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  प्रवेश हो रहा है... | Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  प्रवेश करें | Sign In
                </span>
              )}
            </button>
          </form>

          <div className="mt-3 sm:mt-4 text-center space-y-1 sm:space-y-2">
            <p className="text-xs text-gray-600 font-medium">
              सुरक्षित प्रमाणीकरण आवश्यक | Secure authentication required
            </p>
            <div className="flex justify-center items-center space-x-2 sm:space-x-3 text-xs text-gray-500">
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
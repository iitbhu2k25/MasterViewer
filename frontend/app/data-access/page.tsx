'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Lock, User, Eye, EyeOff, CheckCircle, ArrowLeft, Activity } from 'lucide-react';

export default function DataAccessPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [fetchedData, setFetchedData] = useState<any>(null);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Simulate API call delay
        setTimeout(() => {
            if (loginData.email === 'admin@gmail.com' && loginData.password === 'admin@gmail.com') {
                setIsAuthenticated(true);
                setError('');
            } else {
                setError('Invalid credentials. Please use admin@gmail.com for both email and password.');
            }
            setIsLoading(false);
        }, 800);
    };

    const fetchData = () => {
        setIsLoading(true);
        setTimeout(() => {
            setFetchedData({
                timestamp: new Date().toLocaleString(),
                location: 'Varanasi, Uttar Pradesh',
                surveyPoints: '156 Active',
                measurements: [
                    { parameter: 'Groundwater Depth', value: '12.5 m', status: 'Normal' },
                    { parameter: 'Water Quality Index', value: '72.3', status: 'Good' },
                    { parameter: 'TDS Level', value: '450 ppm', status: 'Acceptable' },
                    { parameter: 'pH Level', value: '7.2', status: 'Optimal' },
                    { parameter: 'Temperature', value: '22.5°C', status: 'Normal' },
                    { parameter: 'Dissolved Oxygen', value: '6.8 mg/L', status: 'Good' }
                ]
            });
            setIsLoading(false);
        }, 1500);
    };

    return (
        <div className="min-h-screen relative">
            {/* Background Image */}
            <div className="fixed inset-0 z-0">
                <img
                    src="/image_9.jpeg"
                    alt="River Management"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-blue-900/40" />
            </div>

            <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-4xl">
                    <AnimatePresence mode="wait">
                        {!isAuthenticated ? (
                            // LOGIN FORM
                            <motion.div
                                key="login"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="max-w-md mx-auto"
                            >
                                {/* Back Button */}
                                <Link
                                    href="/"
                                    className="inline-flex items-center gap-2 text-white hover:text-blue-200 transition-colors mb-6"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                    <span className="font-medium">Back to Homepage</span>
                                </Link>

                                <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-blue-200">
                                    {/* Login Header */}
                                    <div className="text-center mb-8">
                                        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <Lock className="w-8 h-8 text-white" />
                                        </div>
                                        <h2 className="text-2xl font-black text-slate-800 mb-2">Access Data from App</h2>
                                        <p className="text-gray-600 text-sm">Enter your credentials to access river management data</p>
                                    </div>

                                    {/* Login Form */}
                                    <form onSubmit={handleLogin} className="space-y-5">
                                        {/* Email Field */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Email Address
                                            </label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="email"
                                                    value={loginData.email}
                                                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                                                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                                                    placeholder="admin@gmail.com"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Password Field */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Password
                                            </label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={loginData.password}
                                                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                                    className="w-full pl-11 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                                                    placeholder="••••••••"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                >
                                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Error Message */}
                                        {error && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm"
                                            >
                                                {error}
                                            </motion.div>
                                        )}

                                        {/* Submit Button */}
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold rounded-xl transition-all hover:shadow-lg disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Authenticating...
                                                </>
                                            ) : (
                                                'Login to Access Data'
                                            )}
                                        </button>
                                    </form>

                                    {/* Hint */}
                                    <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                        <p className="text-xs text-blue-800 font-medium text-center">
                                            <strong>Demo Credentials:</strong> admin@gmail.com / admin@gmail.com
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            // LOGGED IN STATE
                            <motion.div
                                key="dashboard"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-6"
                            >
                                {/* Access Granted Header */}
                                <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-blue-200 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                                            <CheckCircle className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-800">Access Granted</h3>
                                            <p className="text-gray-600 text-sm">Welcome, Admin</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsAuthenticated(false)}
                                        className="text-red-500 font-bold hover:underline"
                                    >
                                        Logout
                                    </button>
                                </div>

                                {!fetchedData ? (
                                    // READY TO FETCH DATA
                                    <div className="bg-white/95 backdrop-blur-md rounded-3xl p-12 shadow-xl border border-blue-200 text-center">
                                        <Database className="w-20 h-20 text-blue-600 mx-auto mb-6" />
                                        <h3 className="text-3xl font-black text-slate-800 mb-4">Ready to Fetch Data</h3>
                                        <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
                                            Click below to retrieve the latest data from Holistic River Management App
                                        </p>
                                        <button
                                            onClick={fetchData}
                                            disabled={isLoading}
                                            className="px-10 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold rounded-xl transition-all hover:shadow-lg disabled:cursor-not-allowed flex items-center justify-center gap-3 mx-auto"
                                        >
                                            {isLoading ? 'Fetching Data...' : 'Fetch Latest Data from App'}
                                        </button>
                                    </div>
                                ) : (
                                    // DATA DISPLAY
                                    <div className="space-y-6">
                                        {/* Summary Banner */}
                                        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-blue-200">
                                            <h3 className="text-2xl font-black text-slate-800 mb-6 border-b pb-4 flex items-center gap-3">
                                                <Activity className="w-8 h-8 text-blue-600" />
                                                Data Retrieved Successfully
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                                                    <p className="text-xs font-bold text-blue-600 uppercase mb-1">Timestamp</p>
                                                    <p className="font-bold text-slate-800">{fetchedData.timestamp}</p>
                                                </div>
                                                <div className="p-4 rounded-2xl bg-cyan-50 border border-cyan-100">
                                                    <p className="text-xs font-bold text-cyan-600 uppercase mb-1">Location</p>
                                                    <p className="font-bold text-slate-800">{fetchedData.location}</p>
                                                </div>
                                                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                                                    <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Survey Points</p>
                                                    <p className="font-bold text-slate-800">{fetchedData.surveyPoints}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Grid Data */}
                                        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-blue-200">
                                            <h3 className="text-2xl font-black text-slate-800 mb-6">Measurement Data</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {fetchedData.measurements.map((m: any, i: number) => (
                                                    <div key={i} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition-shadow">
                                                        <p className="text-sm font-medium text-gray-500 mb-1">{m.parameter}</p>
                                                        <p className="text-3xl font-black text-slate-800 mb-3">{m.value}</p>
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${m.status === 'Good' || m.status === 'Optimal' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                                            }`}>
                                                            {m.status}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-8 text-center">
                                                <button
                                                    onClick={fetchData}
                                                    className="px-8 py-3 bg-blue-100 text-blue-700 font-bold rounded-xl hover:bg-blue-200 transition-colors"
                                                >
                                                    Refresh Data
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

export default function TopBar() {
    const [fontSize, setFontSize] = useState(100);

    // Font size controls
    const increaseFontSize = () => {
        if (fontSize < 120) {
            setFontSize(prev => prev + 10);
            document.documentElement.style.fontSize = `${fontSize + 10}%`;
        }
    };

    const decreaseFontSize = () => {
        if (fontSize > 80) {
            setFontSize(prev => prev - 10);
            document.documentElement.style.fontSize = `${fontSize - 10}%`;
        }
    };

    const resetFontSize = () => {
        setFontSize(100);
        document.documentElement.style.fontSize = '100%';
    };

    return (
        <div className="bg-[#0a2e4d] text-white text-xs border-b border-white/10">
            <div className="max-w-[2800px] mx-auto px-3 sm:px-4 py-1">
                <div className="flex items-center justify-between">
                    {/* Left: Government Links - simplified on mobile */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        <a
                            href="https://www.india.gov.in/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-white/80 transition-colors"
                        >
                            <div className="flex flex-col leading-tight">
                                <span className="font-medium text-[10px] sm:text-xs">भारत सरकार</span>
                                <span className="text-[8px] sm:text-[10px] opacity-90">Government of India</span>
                            </div>
                        </a>
                        <span className="text-white/50 hidden sm:inline">|</span>
                        <a
                            href="https://jalshakti-dowr.gov.in/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-white/80 transition-colors hidden sm:block"
                        >
                            <div className="flex flex-col leading-tight">
                                <span className="font-medium">जल शक्ति मंत्रालय</span>
                                <span className="text-[10px] opacity-90">Ministry of Jal Shakti</span>
                            </div>
                        </a>
                        <span className="text-white/50 hidden md:inline">|</span>
                        <a
                            href="https://nmcg.nic.in/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-white/80 transition-colors hidden md:block"
                        >
                            <div className="flex flex-col leading-tight">
                                <span className="font-medium">राष्ट्रीय स्वच्छ गंगा मिशन</span>
                                <span className="text-[10px] opacity-90">National Mission for Clean Ganga</span>
                            </div>
                        </a>
                        <span className="text-white/50 hidden md:inline">|</span>
                        <a
                            href="https://www.slcrvaranasi.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-white/80 transition-colors hidden md:block"
                        >
                            <div className="flex flex-col leading-tight">
                                {/* <span className="font-medium">राष्ट्रीय स्वच्छ गंगा मिशन</span> */}
                                <span className="text-[15px] opacity-90">Smart Laboratory on Clean Rivers</span>
                            </div>
                        </a>
                    </div>

                    {/* Right: Accessibility Controls - simplified on mobile */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Skip to content - hidden on mobile */}
                        <a
                            href="#main-content"
                            className="hover:text-white/80 transition-colors uppercase tracking-wide text-[10px] font-medium hidden md:inline"
                        >
                            Skip to Main Content
                        </a>

                        <span className="text-white/50 hidden md:inline">|</span>

                        {/* Font Size Controls */}
                        <div className="flex items-center gap-0.5">
                            <button
                                onClick={increaseFontSize}
                                className="px-1 sm:px-1.5 py-0.5 hover:bg-white/20 rounded transition-colors font-bold text-[10px] sm:text-xs"
                                aria-label="Increase font size"
                                title="Increase font size"
                            >
                                A+
                            </button>
                            <button
                                onClick={resetFontSize}
                                className="px-1 sm:px-1.5 py-0.5 hover:bg-white/20 rounded transition-colors font-bold text-[10px] sm:text-xs hidden sm:block"
                                aria-label="Reset font size"
                                title="Reset font size"
                            >
                                T+
                            </button>
                            <button
                                onClick={decreaseFontSize}
                                className="px-1 sm:px-1.5 py-0.5 hover:bg-white/20 rounded transition-colors font-bold text-[10px] sm:text-xs"
                                aria-label="Decrease font size"
                                title="Decrease font size"
                            >
                                A-
                            </button>
                        </div>

                        <span className="text-white/50 hidden sm:inline">|</span>

                        {/* Search Button */}
                        <button
                            className="p-1 hover:bg-white/20 rounded transition-colors"
                            aria-label="Search"
                            title="Search"
                        >
                            <Search size={12} className="sm:w-3.5 sm:h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
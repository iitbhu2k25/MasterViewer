'use client';
import React, { useState, CSSProperties, useEffect } from 'react';
import { FaArrowRight, FaUser, FaSitemap } from 'react-icons/fa';
import { FiSearch, FiMoon, FiSun } from 'react-icons/fi';
import { MdTextIncrease, MdTextDecrease, MdTextFields, MdTranslate } from 'react-icons/md';

const TopHeader: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);

  const dataList = [
    'National Water Policy',
    'River Basin Maps',
    'Water Quality Reports',
    'Hydrological Data',
    'Project Guidelines',
    'Annual Reports',
  ];

  useEffect(() => {
    const addGoogleTranslateScript = () => {
      const script = document.createElement('script');
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    };

    (window as any).googleTranslateElementInit = () => {
      new (window as any).google.translate.TranslateElement(
        {
          pageLanguage: 'en',
          includedLanguages: 'en,hi,ta,bn,gu,kn,ml,mr,pa,te,ur',
          layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
        },
        'google_translate_element'
      );
    };

    addGoogleTranslateScript();

    const interval = setInterval(() => {
      const iframe = document.querySelector('iframe.goog-te-banner-frame') as HTMLElement | null;
      const body = document.querySelector('body');
      if (iframe) {
        iframe.style.display = 'none';
        if (body) body.style.top = '0px';
        clearInterval(interval);
      }
    }, 500);
  }, []);

  useEffect(() => {
    const filtered = dataList.filter(item => item.toLowerCase().includes(query.toLowerCase()));
    setResults(query ? filtered : []);
  }, [query]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);

    // Only toggle body background and text colors — header remains unchanged
    document.body.style.backgroundColor = newTheme === 'dark' ? '#222' : '#fff';
    document.body.style.color = newTheme === 'dark' ? '#fff' : '#000';

    // Optionally, set a data-theme attribute on html for global CSS if needed
    document.documentElement.setAttribute('data-theme', newTheme);
  };

 const changeFontSize = (action: 'increase' | 'decrease' | 'reset') => {
  const root = document.documentElement;
  const currentSize = parseFloat(getComputedStyle(root).fontSize);
  let newSize = currentSize;

  if (action === 'increase') newSize += 2;
  else if (action === 'decrease') newSize -= 2;
  else newSize = 16;

  root.style.fontSize = `${newSize}px`; // Use backticks for template literal
};

  const scrollToMainContent = () => {
    window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
  };

  // HEADER styles - Fixed blue header with white text, no dynamic theme changes here
  const headerStyle: CSSProperties = {
    backgroundColor: 'blue',
    color: 'white',
    padding: '2px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    fontSize: '15px',
    fontFamily: '"Noto Sans", "Arial", sans-serif',
    fontWeight: 600,
    flexWrap: 'nowrap',
    height: '48px',
  };

  const leftStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '35px',
    height: '100%',
  };

  const textBlockStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'center',
    lineHeight: '1.2',
    fontWeight: 600,
    fontSize: '15px',
    cursor: 'pointer',
    textDecoration: 'none',
    color: 'white',
  };

  const verticalSeparator: CSSProperties = {
    width: '1.5px',
    height: '100%',
    backgroundColor: '#ffffff99',
    margin: '0 6px',
  };

  const rightStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'nowrap',
    fontWeight: 600,
    fontSize: '15px',
    position: 'relative',
  };

  const linkStyle: CSSProperties = {
    color: 'white',
    textDecoration: 'none',
    fontWeight: 600,
  };

  const iconStyle: CSSProperties = {
    color: 'white',
    fontSize: '18px',
    cursor: 'pointer',
  };

  return (
    <>
      <style>{`
        .goog-te-banner-frame.skiptranslate {
          display: none !important;
        }
        body {
          top: 0px !important;
          position: static !important;
          transition: background-color 0.3s ease, color 0.3s ease;
        }
        .goog-te-gadget-icon {
          display: none !important;
        }
        .goog-te-gadget-simple {
          background-color: transparent !important;
          border: none !important;
          font-size: 0 !important;
          padding: 0 !important;
          width: 30px !important;
          height: 30px !important;
          cursor: pointer;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .goog-te-combo {
          opacity: 0;
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          cursor: pointer;
        }
      `}</style>

      <div style={headerStyle}>
        {/* Left Section */}
        <div style={leftStyle}>
          <a href="http://india.gov.in" target="_blank" rel="noopener noreferrer" style={textBlockStyle} title="Government of India">
            <span>भारत सरकार</span>
            <span>Government of India</span>
          </a>
          <div style={verticalSeparator}></div>
          <a href="http://jalshakti-dowr.gov.in/" target="_blank" rel="noopener noreferrer" style={textBlockStyle} title="Ministry of Jal Shakti">
            <span>जल शक्ति मंत्रालय</span>
            <span>Ministry of Jal Shakti</span>
          </a>
        </div>

        {/* Right Section */}
        <div style={rightStyle}>
          <div style={verticalSeparator}></div>
          <a href="javascript:void(0);" style={linkStyle} title="Skip to main content" onClick={scrollToMainContent}>
            SKIP TO MAIN CONTENT
          </a>
          <div style={verticalSeparator}></div>

          <div title="Font Size Controls" style={{ display: 'flex', gap: '5px' }}>
            <MdTextIncrease style={iconStyle} onClick={() => changeFontSize('increase')} />
            <MdTextFields style={iconStyle} onClick={() => changeFontSize('reset')} />
            <MdTextDecrease style={iconStyle} onClick={() => changeFontSize('decrease')} />
          </div>
          <div style={verticalSeparator}></div>

          <div onClick={toggleTheme} title="Toggle dark/light mode">
            {theme === 'light' ? <FiMoon style={iconStyle} /> : <FiSun style={iconStyle} />}
          </div>
          <div style={verticalSeparator}></div>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <FiSearch style={iconStyle} onClick={() => setShowSearch(prev => !prev)} title="Search" />
            {showSearch && (
              <div
                style={{
                  position: 'absolute',
                  top: '35px',
                  right: 0,
                  backgroundColor: '#fff',
                  color: '#000',
                  padding: '10px',
                  borderRadius: '4px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  zIndex: 1000,
                }}
              >
                <input
                  type="text"
                  placeholder="Search..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  style={{ padding: '5px', width: '200px', marginBottom: '5px' }}
                />
                <ul style={{ maxHeight: '150px', overflowY: 'auto', padding: 0, margin: 0, listStyle: 'none' }}>
                  {results.length > 0 ? (
                    results.map((item, index) => (
                      <li key={index} style={{ padding: '5px 0', borderBottom: '1px solid #ccc' }}>
                        {item}
                      </li>
                    ))
                  ) : (
                    <li style={{ padding: '5px 0' }}>No results found</li>
                  )}
                </ul>
              </div>
            )}
          </div>
          <div style={verticalSeparator}></div>

          

          {/* Translate icon and element
          <div
            style={{
              position: 'relative',
              width: '30px',
              height: '30px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Select Language"
          >
            <MdTranslate style={{ color: 'white', fontSize: '22px' }} />
            <div
              id="google_translate_element"
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            ></div>
          </div>
          <div style={verticalSeparator}></div>

          <a href="/home/employee_login" title="Employee Login">
            <FaUser style={iconStyle} />
          </a> */}
        </div>
      </div>
    </>
  );
};

export default TopHeader;
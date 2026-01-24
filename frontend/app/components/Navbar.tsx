'use client';

import Textfit from '@namhong2001/react-textfit';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

// ============================================================================
// TYPES
// ============================================================================

interface NavItem {
  label: string;
  href: string;
  external?: boolean;
  submenu?: { label: string; href: string }[];
}

// ============================================================================
// NAV DATA
// ============================================================================

const navItems: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'SLCR', href: 'https://www.slcrvaranasi.com/' ,external: true},
  { label: 'DSS', href: 'https://slcrdss.in', external: true },
  

];

// ============================================================================
// COMPONENT
// ============================================================================

export default function ResponsiveNavbar() {
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => setIsClient(true), []);

  // ============================================================================
  // NAV ITEM RENDER
  // ============================================================================

  const renderNavItem = (item: NavItem, idx: number) => {
    const isActive = !item.external && pathname === item.href;

    const commonClasses =
      'flex-1 flex justify-center px-6 py-4 rounded-xl hover:bg-blue-800 transition-all duration-200';

    return (
      <div key={idx} className={commonClasses}>
        <Textfit
          mode="single"
          max={22}
          min={16}
          className={`font-semibold text-lg tracking-wide ${
            isActive ? 'text-yellow-300' : 'text-white'
          }`}
        >
          {item.external ? (
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="whitespace-nowrap"
            >
              {item.label}
            </a>
          ) : (
            <Link href={item.href} className="whitespace-nowrap">
              {item.label}
            </Link>
          )}
        </Textfit>
      </div>
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <nav className="bg-blue-900 text-white shadow-lg w-full z-50">
      <div className="max-w-screen-xl mx-auto px-6 py-5">

        {/* Mobile Header */}
        <div className="flex justify-between items-center lg:hidden">
          <button onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Menu */}
        <div className={`${menuOpen ? 'block' : 'hidden'} lg:flex lg:items-center`}>

          {/* Mobile Menu */}
          <div className="lg:hidden w-full mt-5">
            <div className="flex flex-col gap-3 border-t border-blue-700 pt-5">
              {navItems.map((item, idx) => (
                <div key={idx} className="px-5 py-4 rounded-lg hover:bg-blue-800">
                  {item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg font-medium block"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className="text-lg font-medium block"
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex lg:items-center lg:justify-between w-full">
            {navItems.map((item, idx) => renderNavItem(item, idx))}
          </div>

        </div>
      </div>
    </nav>
  );
}

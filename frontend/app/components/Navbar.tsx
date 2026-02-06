'use client';

import Textfit from '@namhong2001/react-textfit';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface SubMenuItem {
  label: string;
  href: string;
}

interface NavItem {
  label: string;
  href?: string;
  external?: boolean;
  submenu?: SubMenuItem[];
}

// ============================================================================
// NAV DATA
// ============================================================================

const navItems: NavItem[] = [
  { label: 'Home', href: '/home' },
  {
    label: 'About',
    submenu: [
      { label: 'Overview', href: '/about/overview' },
      { label: 'Vision & Mission', href: '/about/vision-mission' },
      { label: 'Core Values', href: '/about/core-values' }
    ]
  },
  { label: 'River Stretches', href: '/river-stretches' },
  { label: 'Water Quality', href: '/water-quality' },
  { label: 'Discharge', href: '/discharge' },
  { label: 'Sewage Load', href: '/sewage-load' },
  { label: 'Industries', href: '/industries' },
  { label: 'River Vulnerabilities & Intervention', href: '/river-vulnerabilities-intervention' },
  { label: 'STP', href: '/stp' },
  { label: 'Water Bodies', href: '/water-bodies' },
  {
    label: 'Ongoing Scheme Status',
    submenu: [
      { label: 'Amrit Sarovar', href: '/ongoing-schemes/amrit-sarovar' },
      { label: 'Jal Jeevan Mission', href: '/ongoing-schemes/jal-jeevan-mission' }
    ]
  },
  { label: 'Dashboard', href: '/' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function ResponsiveNavbar() {
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => setIsClient(true), []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    if (openDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdown]);

  // ============================================================================
  // NAV ITEM RENDER
  // ============================================================================

  const isActiveLink = (href?: string, submenu?: SubMenuItem[]) => {
    if (href) return pathname === href;
    if (submenu) return submenu.some(item => pathname === item.href);
    return false;
  };

  const renderDesktopNavItem = (item: NavItem, idx: number) => {
    const isActive = isActiveLink(item.href, item.submenu);
    const hasSubmenu = item.submenu && item.submenu.length > 0;

    const commonClasses =
      'relative group flex items-center justify-center px-2 py-3 hover:bg-white/10 transition-all duration-200';

    if (hasSubmenu) {
      return (
        <div
          key={idx}
          className={commonClasses}
        >
          <span
            className={`font-semibold text-sm whitespace-nowrap flex items-center gap-1 cursor-pointer ${isActive ? 'text-yellow-300' : 'text-white'
              }`}
          >
            {item.label}
            <ChevronDown className="w-3 h-3 transition-transform group-hover:rotate-180" />
          </span>

          {/* Dropdown Menu - Shows on Hover */}
          <div className="absolute top-full left-0 mt-1 bg-white shadow-xl rounded-lg py-2 min-w-[220px] z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
            {item.submenu!.map((subItem, subIdx) => (
              <Link
                key={subIdx}
                href={subItem.href}
                className={`block px-4 py-2 text-sm hover:bg-blue-50 transition-colors ${pathname === subItem.href ? 'bg-blue-100 text-blue-900 font-semibold' : 'text-gray-700'
                  }`}
              >
                {subItem.label}
              </Link>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div key={idx} className={commonClasses}>
        <span
          className={`font-semibold text-sm whitespace-nowrap ${isActive ? 'text-yellow-300' : 'text-white'
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
            <Link href={item.href!} className="whitespace-nowrap">
              {item.label}
            </Link>
          )}
        </span>
      </div>
    );
  };

  const renderMobileNavItem = (item: NavItem, idx: number) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isExpanded = openDropdown === item.label;

    if (hasSubmenu) {
      return (
        <div key={idx} className="border-b border-blue-700 last:border-b-0">
          <button
            onClick={() => setOpenDropdown(isExpanded ? null : item.label)}
            className="w-full px-5 py-4 text-lg font-medium text-white flex items-center justify-between hover:bg-blue-800 transition-colors"
          >
            <span>{item.label}</span>
            <ChevronDown className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>

          {isExpanded && (
            <div className="bg-blue-800 py-2">
              {item.submenu!.map((subItem, subIdx) => (
                <Link
                  key={subIdx}
                  href={subItem.href}
                  onClick={() => {
                    setMenuOpen(false);
                    setOpenDropdown(null);
                  }}
                  className={`block px-8 py-3 text-base hover:bg-blue-700 transition-colors ${pathname === subItem.href ? 'text-yellow-300 font-semibold' : 'text-white'
                    }`}
                >
                  {subItem.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={idx} className="border-b border-blue-700 last:border-b-0">
        {item.external ? (
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-5 py-4 text-lg font-medium text-white hover:bg-blue-800 transition-colors"
          >
            {item.label}
          </a>
        ) : (
          <Link
            href={item.href!}
            onClick={() => setMenuOpen(false)}
            className={`block px-5 py-4 text-lg font-medium hover:bg-blue-800 transition-colors ${pathname === item.href ? 'text-yellow-300 font-semibold' : 'text-white'
              }`}
          >
            {item.label}
          </Link>
        )}
      </div>
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <nav className="bg-[#0a3d62] text-white shadow-lg w-full z-50">
      <div className="max-w-screen-2xl mx-auto px-4 py-2">

        {/* Mobile Header */}
        <div className="flex justify-between items-center lg:hidden">
          <span className="text-xl font-semibold">Menu</span>
          <button onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>

        {/* Menu */}
        <div className={`${menuOpen ? 'block' : 'hidden'} lg:flex lg:items-center`}>

          {/* Mobile Menu */}
          <div className="lg:hidden w-full mt-3">
            <div className="flex flex-col border-t border-blue-700 pt-3">
              {navItems.map((item, idx) => renderMobileNavItem(item, idx))}
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex lg:items-center lg:justify-between lg:flex-wrap w-full gap-1">
            {navItems.map((item, idx) => renderDesktopNavItem(item, idx))}
          </div>

        </div>
      </div>
    </nav>
  );
}

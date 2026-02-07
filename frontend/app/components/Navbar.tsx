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
  { label: 'Home', href: '/' },
  {
    label: 'About',
    submenu: [
      { label: 'Overview', href: '/about/overview' },
      { label: 'Vision & Mission', href: '/about/vision-mission' },
      { label: 'Core Values', href: '/about/core-values' }
    ]
  },
  {
    label: 'Nirmal Ganga ',
    submenu: [
      { label: 'River Stretches Information', href: '/river-stretches' },
      { label: 'River Water Quality', href: '/water-quality' },
      { label: 'Sewage Load Estimation', href: '/sewage-load' },
      { label: 'STP Status and Sewage Gap', href: '/stp' },
      { label: 'Industrial Hotspots', href: '/industries' }
    ]
  },
  {
    label: 'Aviral Ganga',
    submenu: [
      { label: 'River Discharge Assessment', href: '/discharge' },
      { label: 'Environmental Flow Maintenance', href: '/eflow' },
      { label: 'Water Budget Assessment', href: '/water-budget' }
    ]
  },
  {
    label: 'Arth Ganga  ',
    submenu: [
      { label: 'Water Bodies Information', href: '/water-bodies' },
      { label: 'River-Based Economic Linkages', href: '/economic-linkages' }
    ]
  },
  {
    label: 'Jan Ganga',
    submenu: [
      { label: 'Social Attachment and Impact', href: '/social-impact' },
      { label: 'Community-Centric River Issues', href: '/community-issues' }
    ]
  },
  {
    label: 'Gyan Ganga ',
    submenu: [
      { label: 'River Vulnerability and Interventions', href: '/river-vulnerabilities-intervention' },
      { label: 'Nature-Based and Decentralized Solutions', href: '/nature-based-solutions' },
      { label: 'Ongoing Government Schemes', href: '/ongoing-schemes' }
    ]
  },

  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Contact us', href: '/contact' },
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

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    if (openDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdown]);

  // Updated Active Color for Light Theme (Burnt Orange)
  const isActiveLink = (href?: string, submenu?: SubMenuItem[]) => {
    if (href) return pathname === href;
    if (submenu) return submenu.some(item => pathname === item.href);
    return false;
  };

  const renderDesktopNavItem = (item: NavItem, idx: number) => {
    const isActive = isActiveLink(item.href, item.submenu);
    const hasSubmenu = item.submenu && item.submenu.length > 0;

    // Hover effect changed to a darker orange tint
    const commonClasses =
      'relative group flex items-center justify-center px-2 py-3 hover:bg-orange-200/50 transition-all duration-200';

    if (hasSubmenu) {
      return (
        <div key={idx} className={commonClasses}>
          <span
            className={`font-semibold text-sm whitespace-nowrap flex items-center gap-1 cursor-pointer ${isActive ? 'text-orange-700 underline underline-offset-4' : 'text-slate-800'
              }`}
          >
            {item.label}
            <ChevronDown className="w-3 h-3 transition-transform group-hover:rotate-180" />
          </span>

          <div className="absolute top-full left-0 mt-1 bg-white shadow-xl rounded-lg py-2 min-w-[220px] z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-orange-100">
            {item.submenu!.map((subItem, subIdx) => (
              <Link
                key={subIdx}
                href={subItem.href}
                className={`block px-4 py-2 text-sm hover:bg-orange-50 transition-colors ${pathname === subItem.href ? 'bg-orange-100 text-orange-900 font-semibold' : 'text-gray-700'
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
          className={`font-semibold text-sm whitespace-nowrap ${isActive ? 'text-orange-700 underline underline-offset-4' : 'text-slate-800'
            }`}
        >
          {item.external ? (
            <a href={item.href} target="_blank" rel="noopener noreferrer" className="whitespace-nowrap">
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
        <div key={idx} className="border-b border-orange-200 last:border-b-0">
          <button
            onClick={() => setOpenDropdown(isExpanded ? null : item.label)}
            className="w-full px-5 py-4 text-lg font-medium text-slate-800 flex items-center justify-between hover:bg-orange-200 transition-colors"
          >
            <span>{item.label}</span>
            <ChevronDown className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>

          {isExpanded && (
            <div className="bg-orange-100/50 py-2">
              {item.submenu!.map((subItem, subIdx) => (
                <Link
                  key={subIdx}
                  href={subItem.href}
                  onClick={() => {
                    setMenuOpen(false);
                    setOpenDropdown(null);
                  }}
                  className={`block px-8 py-3 text-base hover:bg-orange-200 transition-colors ${pathname === subItem.href ? 'text-orange-700 font-bold' : 'text-slate-700'
                    }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={idx} className="border-b border-orange-200 last:border-b-0">
        {item.external ? (
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-5 py-4 text-lg font-medium text-slate-800 hover:bg-orange-200 transition-colors"
          >
            {item.label}
          </a>
        ) : (
          <Link
            href={item.href!}
            onClick={() => setMenuOpen(false)}
            className={`block px-5 py-4 text-lg font-medium hover:bg-orange-200 transition-colors ${pathname === item.href ? 'text-orange-700 font-bold' : 'text-slate-800'
              }`}
          >
            {item.label}
          </Link>
        )}
      </div>
    );
  };

  return (
    // MAIN NAVBAR BACKGROUND COLOR: Light Orange / Peach
    <nav className="bg-[#fafaf9] text-slate-800 shadow-md w-full z-50 border-b border-orange-100">
      <div className="max-w-screen-2xl mx-auto px-4 py-2">

        {/* Mobile Header */}
        <div className="flex justify-between items-center lg:hidden">
          <span className="text-xl font-semibold text-orange-900">Menu</span>
          <button onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu" className="text-orange-900">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>

        <div className={`${menuOpen ? 'block' : 'hidden'} lg:flex lg:items-center`}>

          {/* Mobile Menu */}
          <div className="lg:hidden w-full mt-3">
            <div className="flex flex-col border-t border-orange-200 pt-3">
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
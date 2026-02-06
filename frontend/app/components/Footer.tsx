import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin, ChevronRight, MapPin, Mail, Phone, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full mt-auto bg-[#0a3d62] text-white">
      {/* Main Footer Content */}
      <div className="max-w-[90%] mx-auto py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* About Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-[2px] bg-orange-400"></div>
              <h3 className="text-lg font-bold uppercase tracking-wider">About Holistic</h3>
            </div>
            <p className="text-sm leading-relaxed text-blue-100/80">
              Integrated Model for Holistic River Basin Management is a comprehensive initiative for sustainable water resource management, aquifer recharge, and ecosystem restoration in the Ganga tributaries.
            </p>
            <div className="flex gap-4">
              <a href="#" className="p-2 bg-white/10 rounded hover:bg-white/20 transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 bg-white/10 rounded hover:bg-white/20 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 bg-white/10 rounded hover:bg-white/20 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 bg-white/10 rounded hover:bg-white/20 transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-[2px] bg-orange-400"></div>
              <h3 className="text-lg font-bold uppercase tracking-wider">Quick Links</h3>
            </div>
            <ul className="space-y-3">
              {[
                { label: 'About Holistic', href: '/about/overview' },
                { label: 'Groundwater', href: '/water-quality' },
                { label: 'MAR Zones', href: '/river-stretches' },
                { label: 'TEM Data', href: '/discharge' }
              ].map((link, i) => (
                <li key={i}>
                  <Link href={link.href} className="flex items-center gap-2 text-sm text-blue-100/80 hover:text-white group transition-colors">
                    <ChevronRight className="w-3 h-3 text-orange-400 group-hover:translate-x-1 transition-transform" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Important Links */}
          <div className="lg:col-span-1 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-[2px] bg-orange-400"></div>
              <h3 className="text-lg font-bold uppercase tracking-wider">Important Links</h3>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {[
                { label: 'Govt. of India', href: 'https://india.gov.in' },
                { label: 'Ministry of Jal Shakti', href: 'https://jalshakti-dowr.gov.in' },
                { label: 'NMCG', href: 'https://nmcg.nic.in' },
                { label: 'CPCB', href: 'https://cpcb.nic.in' },
                { label: 'CGWB', href: 'http://cgwb.gov.in' },
                { label: 'NIH', href: 'https://nihroorkee.gov.in' },
                { label: 'India-WRIS', href: 'https://indiawris.gov.in' },
                { label: 'NWDA', href: 'https://nwda.gov.in' },
                { label: 'IMD', href: 'https://mausam.imd.gov.in' },
                { label: 'IIT-BHU, Varanasi', href: 'https://iitbhu.ac.in' },
                { label: 'Govt. of UP', href: 'https://up.gov.in' },
                { label: 'SLCR', href: '/about/overview' }
              ].map((link, i) => (
                <a key={i} href={link.href} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-[11px] text-blue-100/80 hover:text-white transition-colors">
                  {link.label}
                  <ExternalLink className="w-2 h-2" />
                </a>
              ))}
            </div>
          </div>

          {/* Contact Us */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-[2px] bg-orange-400"></div>
              <h3 className="text-lg font-bold uppercase tracking-wider">Contact Us</h3>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                <MapPin className="w-5 h-5 text-orange-400 shrink-0" />
                <p className="text-sm text-blue-100/80">
                  SLCR Lab, Department of Civil Engineering, IIT (BHU), Varanasi - 221005, India
                </p>
              </div>
              <div className="flex gap-3">
                <Mail className="w-5 h-5 text-orange-400 shrink-0" />
                <a href="mailto:slcr@iitbhu.ac.in" className="text-sm text-blue-100/80 hover:text-white">
                  slcr@iitbhu.ac.in
                </a>
              </div>
              <div className="flex gap-3">
                <Phone className="w-5 h-5 text-orange-400 shrink-0" />
                <p className="text-sm text-blue-100/80">
                  +91-542-2361016
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Copyright Bar */}
      <div className="bg-[#051d2f] border-t border-white/5 py-4">
        <div className="max-w-[90%] mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-[12px] text-blue-100/60 font-medium text-center md:text-left gap-4">
          <p>Copyright © {new Date().getFullYear()} <span className="text-white">Holistic</span> | All Rights Reserved</p>
          <p>Integrated Model for Holistic River Basin Management, IIT (BHU), Varanasi</p>
        </div>
      </div>
    </footer>
  );
}

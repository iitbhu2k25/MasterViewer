'use client'
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full mt-auto">
      {/* Partner logos section */}
      <div className="bg-gray-100 text-gray-800 py-8">
        <div className="container mx-auto px-4">
          {/* Logo Section */}
          <div className="flex justify-center items-center flex-wrap gap-5 mb-6">
            <div className="relative w-32 h-12">
              <Image
                src="/Images/footer/logo1.png"
                alt="Partner Logo"
                fill
                sizes="100%"
                style={{ objectFit: "contain" }}
                className="scale-135"
              />
            </div>

            <div className="relative w-32 h-16">
              <Image
                src="/Images/footer/logo2.svg"
                alt="Trusted Brand"
                fill
                sizes="100%"
                style={{ objectFit: "contain" }}
              />
            </div>
            
            <div className="relative w-32 h-16">
              <Image
                src="/Images/footer/logo3.gif"
                alt="Company Seal"
                fill
                sizes="100%"
                style={{ objectFit: "contain" }}
                unoptimized={true}
              />
            </div>

            <div className="relative w-32 h-16">
              <Image
                src="/Images/footer/iitbhu.png"
                alt="Certified Mark"
                fill
                sizes="100%"
                style={{ objectFit: "contain" }}
              />
            </div>

            <div className="relative w-32 h-16">
              <Image
                src="/Images/footer/iitbombay.png"
                alt="Award Logo"
                fill
                sizes="100%"
                style={{ objectFit: "contain" }}
              />
            </div>

            <div className="relative w-32 h-16">
              <Image
                src="/Images/footer/download.png"
                alt="Company Seal"
                fill
                sizes="100%"
                style={{ objectFit: "contain" }}
              />
            </div>

            <div className="relative w-32 h-16">
              <Image
                src="/Images/footer/IIT_Madras_Logo.svg.png"
                alt="Company Seal"
                fill
                sizes="100%"
                style={{ objectFit: "contain" }}
              />
            </div>

            <div className="relative w-32 h-16">
              <Image
                src="/Images/footer/50.png"
                alt="Company Seal"
                fill
                sizes="100%"
                style={{ objectFit: "contain" }}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Information section */}
      <div className="bg-[blue] text-white font-bold p-5 text-sm">
        <div className="max-w-[1140px] mx-auto flex flex-wrap justify-between">
          <div className="flex-1 min-w-[200px] mr-5 mb-5">
            <h4 className="text-base mt-0 mb-4 pb-1.5 border-b border-white/20">
              About Us
            </h4>
            <ul className="list-none p-0 m-0">
              <li className="mb-2">
                <Link href="#" className="text-white/80 no-underline hover:text-white hover:underline">
                  About the Project
                </Link>
              </li>
              <li className="mb-2">
                <Link href="#" className="text-white/80 no-underline hover:text-white hover:underline">
                  Team
                </Link>
              </li>
              <li className="mb-2">
                <Link href="#" className="text-white/80 no-underline hover:text-white hover:underline">
                  Research
                </Link>
              </li>
              <li className="mb-2">
                <Link href="#" className="text-white/80 no-underline hover:text-white hover:underline">
                  Publications
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="flex-1 min-w-[200px] mr-5 mb-5">
            <h4 className="text-base mt-0 mb-4 pb-1.5 border-b border-white/20">
              Resources
            </h4>
            <ul className="list-none p-0 m-0">
              <li className="mb-2">
                <Link href="/confident" className="text-white/80 no-underline hover:text-white hover:underline">
                  Documents
                </Link>
              </li>
              <li className="mb-2">
                <Link href="#" className="text-white/80 no-underline hover:text-white hover:underline">
                  Reports
                </Link>
              </li>
              <li className="mb-2">
                <Link href="#" className="text-white/80 no-underline hover:text-white hover:underline">
                  Guidelines
                </Link>
              </li>
              <li className="mb-2">
                <Link href="#" className="text-white/80 no-underline hover:text-white hover:underline">
                  Data
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="flex-1 min-w-[200px] mr-5 mb-5">
            <h4 className="text-base mt-0 mb-4 pb-1.5 border-b border-white/20">
              Policies
            </h4>
            <ul className="list-none p-0 m-0">
              <li className="mb-2">
                <Link href="#" className="text-white/80 no-underline hover:text-white hover:underline">
                  Terms of Use
                </Link>
              </li>
              <li className="mb-2">
                <Link href="#" className="text-white/80 no-underline hover:text-white hover:underline">
                  Privacy Policy
                </Link>
              </li>
              <li className="mb-2">
                <Link href="#" className="text-white/80 no-underline hover:text-white hover:underline">
                  Copyright Policy
                </Link>
              </li>
              <li className="mb-2">
                <Link href="#" className="text-white/80 no-underline hover:text-white hover:underline">
                  Accessibility
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div> 
      
     {/* Copyright bar */}
      <div className="bg-[lightblue] text-black/100 font-bold text-center py-2.5 text-sm">
        © {new Date().getFullYear()} Decision Support System for Water Governance. All Rights Reserved.
      </div>
    </footer>
  );
}
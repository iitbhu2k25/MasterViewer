"use client"

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const gridItems = [
  {
    href: "./gwm/",
    imgSrc: "/Images/GridSection/gwm.webp",
    alt: "Ground Water Management",
    title: "Ground Water Management",
    acronym: "GWM",
    description: "Advanced tools for sustainable groundwater resource management",
    color: "from-blue-400/30 to-blue-600/40"
  },
  {
    href: "./rwm/",
    imgSrc: "/Images/GridSection/rwm.jpeg",
    alt: "River Water Management",
    title: "River Water Management",
    acronym: "RWM",
    description: "Integrated solutions for river ecosystems and flood control",
    color: "from-blue-400/30 to-blue-600/40"
  },
  {
    href: "./wrm/",
    imgSrc: "/Images/GridSection/wrm.jpg",
    alt: "Water Resource Management",
    title: "Water Resource Management",
    acronym: "WRM",
    description: "Optimizing water supply and demand forecasting",
    color: "from-blue-400/30 to-blue-600/40"
  },
  {
    href: "./shsd/",
    imgSrc: "/Images/GridSection/shs.jpeg",
    alt: "Socio-Hydrological System",
    title: "Socio-Hydrological System",
    acronym: "SHSD",
    description: "Integrating water management with socio-economic factors",
    color: "from-blue-400/30 to-blue-600/40"
  },
  {
    href: "./basic_module/",
    imgSrc: "/Images/GridSection/basicmodule.jpg",
    alt: "Basic Module",
    title: "Basic Module",
    acronym: "BM",
    description: "Essential tools for sewage load estimation and predictions",
    color: "from-blue-400/30 to-blue-600/40"
  }
];

export default function GridSection() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section className="py-8 sm:py-12 md:py-16 px-4 sm:px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 md:gap-8">
          {gridItems.map((item, i) => (
            <Link key={i} href={item.href} className="block">
              <div
                className="group relative bg-white rounded-xl shadow-lg overflow-hidden h-[250px] sm:h-[280px] md:h-[300px] transform transition-all duration-300 hover:shadow-2xl"
                style={{ 
                  transform: hoveredIndex === i ? "translateY(-8px)" : "translateY(0)",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease"
                }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Image Container with Overlay */}
                <div className="relative h-32 sm:h-36 md:h-40 overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-b ${item.color} z-10`}></div>
                  <Image
                    src={item.imgSrc}
                    alt={item.alt}
                    width={400}
                    height={300}
                    className="w-full h-full object-cover transition-transform duration-500 scale-125 group-hover:scale-100"
                  />
                  {/* Acronym Badge and Title Container */}
                  <div className="absolute top-0 left-0 w-full p-3 sm:p-4 z-20 flex justify-between items-center">
                    <h3 className="text-white font-bold text-base sm:text-lg drop-shadow-lg line-clamp-2 pr-2">{item.title}</h3>
                    <div className="bg-white rounded-full h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 flex items-center justify-center shadow-lg">
                      <span className="text-xs sm:text-sm font-bold text-blue-700">
                        {item.acronym || "BM"}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-3 sm:p-4 md:p-5">
                  <p className="text-gray-600 text-xs sm:text-sm line-clamp-3 mb-2 sm:mb-4">
                    {item.description}
                  </p>
                  
                  {/* Explore Button */}
                  <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-5 right-3 sm:right-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-medium text-blue-600">Explore Module</span>
                      <div className="bg-blue-100 rounded-full h-6 w-6 sm:h-8 sm:w-8 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
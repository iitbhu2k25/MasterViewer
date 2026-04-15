'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function GalleryCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  // Using the correct image paths
  const images = [
    '/Images/gallery/main_background.jpg',
    '/Images/gallery/g1.jpg',
    '/Images/gallery/g2.webp',
    '/Images/gallery/g3.webp',
    '/Images/gallery/g4.webp',
    '/Images/gallery/g5.webp',
    '/Images/gallery/g6.webp',
    '/Images/gallery/g7.webp',
    '/Images/gallery/g8.webp',
    '/Images/gallery/g9.webp',
    '/Images/gallery/g10.webp'
  ];

  // Auto-slide functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((current) => (current === images.length - 1 ? 0 : current + 1));
    }, 3000);
    
    return () => clearInterval(interval);
  }, [images.length]);

  // Navigate to previous slide
  const prevSlide = () => {
    setActiveIndex((current) => (current === 0 ? images.length - 1 : current - 1));
  };

  // Navigate to next slide
  const nextSlide = () => {
    setActiveIndex((current) => (current === images.length - 1 ? 0 : current + 1));
  };

  return (
    <section className="w-full bg-200 py-5 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="relative">
          {/* Images */}
          <div className="relative h-[500px] overflow-hidden">
            {images.map((src, index) => (
              <div
                key={index}
                className={`absolute w-full h-full transition-transform duration-600 ease-in-out ${
                  index === activeIndex 
                    ? 'translate-x-0 opacity-100' 
                    : index < activeIndex 
                      ? '-translate-x-full opacity-0' 
                      : 'translate-x-full opacity-0'
                }`}
              >
                <div className="relative h-full w-full flex justify-center">
                  <Image
                    src={src}
                    alt={`Gallery Image ${index + 1}`}
                    width={800}
                    height={500}
                    className="h-[500px] w-auto object-contain"
                    priority={index === 0}
                    unoptimized={true}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Controls */}
          <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/60 p-2 rounded-full hover:bg-white/80 transition-colors"
            aria-label="Previous slide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-black">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/60 p-2 rounded-full hover:bg-white/80 transition-colors"
            aria-label="Next slide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-black">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
          
          {/* Indicators */}
          <div className="absolute -bottom-10 left-0 right-0 flex justify-center gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  activeIndex === index ? 'bg-gray-800' : 'bg-gray-400'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
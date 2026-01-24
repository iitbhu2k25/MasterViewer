'use client'
import Link from 'next/link';
import Textfit from '@namhong2001/react-textfit';
export default function Header() {
  return (
    <header
      className="w-full py-3 bg-gradient-to-r from-blue-50 to-blue-100 shadow-lg border-b border-blue-200"
      style={{
        backgroundImage: "url('/Images/header/header_bg.gif')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
          {/* Left Logos Container */}
          <div className="flex items-center justify-center md:justify-start space-x-4 w-full md:w-1/4">
            <Link href="https://www.india.gov.in/" className="transition-transform hover:scale-105">
              <img
                src="/Images/header/left1_ashok.png"
                alt="Logo 1"
                title="अशोक स्तंभ"
                className="w-16 sm:w-20 h-auto"
              />
            </Link>
            <Link href="https://iitbhu.ac.in/" className="transition-transform hover:scale-105">
              <img
                src="/Images/header/left2_IIt_logo.png"
                alt="Logo 2"
                title="IIT BHU"
                className="w-20 sm:w-28 md:w-32 h-auto transition-transform duration-300"
              />
            </Link>
          </div>

          {/* Middle Section */}
          <div className="text-center w-full md:w-1/2 px-3">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-blue-900 tracking-wide">
            <Textfit mode="single" min={30} max={32} className="font-bold text-blue-800">Decision Support System</Textfit>
            </h2>
            <div className="w-full overflow-hidden mt-1">
              <p className="text-xs sm:text-sm md:text-base text-blue-600 font-medium whitespace-nowrap overflow-hidden relative">
                <span
                  className="inline-block whitespace-nowrap"
                  style={{
                    animation: 'marquee 15s linear infinite',
                  }}
                >
                  Small Rivers Management Tool (SRMT) for Holistic Water Resources Management in India
                </span>
              </p>
            </div>
            {/* Marquee animation */}
            <style jsx>{`
              @keyframes marquee {
                0% {
                  transform: translateX(100%);
                }
                100% {
                  transform: translateX(-100%);
                }
              }
            `}</style>
          </div>

          {/* Right Logos Container */}
          <div className="flex items-center justify-center md:justify-end space-x-4 w-full md:w-1/4">
            <Link href="https://www.slcrvaranasi.com/" className="transition-transform hover:scale-105">
              <img
                src="/Images/header/right1_slcr.png"
                alt="SLCR Logo"
                title="Smart Laboratory on Clean River"
                className="w-28 sm:w-36 md:w-40 h-auto"
              />
            </Link>
            <Link href="https://nmcg.nic.in/" className="transition-transform hover:scale-105">
              <img
                src="/Images/header/right2_namami_ganga.gif"
                alt="Namami Gange Logo"
                title="Namami Gange"
                className="w-20 sm:w-24 h-auto"
              />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

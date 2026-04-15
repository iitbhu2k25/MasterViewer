'use client';

import Link from 'next/link';

export default function GovernmentStyleAboutPage() {
  return (
    <div className="font-['Roboto',_'Arial',_sans-serif] text-[#333] bg-[#f5f5f5] m-0 p-0 leading-relaxed">
      <div className="max-w-[1140px] mx-auto bg-white shadow-md">
        {/* Header with national colors */}
        {/*  */}

        {/* Breadcrumb navigation */}
        <div className="bg-[#f0f0f0] py-2.5 px-5 text-sm border-b border-[#ddd]">
          <Link href="/dss/home" className="text-[#0066CC] no-underline hover:underline">
            Home
          </Link>
          <span className="text-[#666] mx-1.5">&gt;</span>
          <span>About</span>
        </div>

        {/* Main content area with sidebar */}
        <div className="p-8">
          <div className="flex flex-wrap -mx-4">
            {/* Main content - 2/3 width */}
            <div className="w-full lg:w-2/3 px-4">
              {/* Introduction section */}
              <div className="bg-white border border-[#ddd] p-5 mb-6">
                <h2 className="font-['Times_New_Roman',_Times,_serif] text-[#00008B] text-2xl mt-0 mb-4 pb-2.5 border-b-2 border-[#ddd]">
                  Introduction
                </h2>
                <p className="text-[#333] text-base leading-relaxed mb-4 text-justify">
                  This project addresses the critical need for a comprehensive Decision Support System (DSS) to manage water resources effectively. The DSS integrates sophisticated models and simulations to support sustainable water governance, ultimately contributing to the achievement of Sustainable Development Goals (SDGs).
                </p>
                <p className="text-[#333] text-base leading-relaxed mb-4 text-justify">
                  Water governance is a complex, multi-dimensional challenge exacerbated by climate change, urban expansion, and socio-economic dynamics. The aim of this DSS is to provide holistic solutions to water management by combining hydrological, socio-economic, and ecological factors through an integrated modeling framework.
                </p>
                <div className="bg-[#f8f9fa] border-l-4 border-[#0066CC] p-4 my-5 text-[0.95em]">
                  <strong>Official Notice:</strong> This initiative is in accordance with the National Water Policy and adheres to guidelines set forth by the Ministry of Jal Shakti, Government of India.
                </div>
              </div>

              {/* Objectives section */}
              <div className="bg-white border border-[#ddd] p-5 mb-6">
                <h2 className="font-['Times_New_Roman',_Times,_serif] text-[#00008B] text-2xl mt-0 mb-4 pb-2.5 border-b-2 border-[#ddd]">
                  Project Objectives
                </h2>
                <ul className="my-4 pl-5">
                  <li className="mb-2.5 pl-1.5">Development of a Data Management Framework to handle large-scale, multi-source water data.</li>
                  <li className="mb-2.5 pl-1.5">Design of an Integrated Hydro-Computational Modeling Framework to simulate water behaviors.</li>
                  <li className="mb-2.5 pl-1.5">Creation of a Graphical User Interface (GUI) for simplified decision-making and visual data representation.</li>
                  <li className="mb-2.5 pl-1.5">Implementation of a stakeholder engagement platform to facilitate inclusive water governance.</li>
                  <li className="mb-2.5 pl-1.5">Development of policy recommendation modules adapted to changing environmental conditions.</li>
                </ul>
                <p className="text-[#333] text-base leading-relaxed mb-4 text-justify">
                  The above objectives are aligned with the National Water Mission and aim to enhance water resource management capabilities throughout India.
                </p>
              </div>

              {/* Applications section */}
              <div className="bg-white border border-[#ddd] p-5 mb-6">
                <h2 className="font-['Times_New_Roman',_Times,_serif] text-[#00008B] text-2xl mt-0 mb-4 pb-2.5 border-b-2 border-[#ddd]">
                  Potential Applications
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse my-5">
                    <thead>
                      <tr>
                        <th className="bg-[#00008B] text-white p-2.5 text-left font-normal">Application Area</th>
                        <th className="bg-[#00008B] text-white p-2.5 text-left font-normal">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-2 border-b border-[#ddd]">Drought Management</td>
                        <td className="p-2 border-b border-[#ddd]">Early warning systems and resource allocation optimization during water scarcity conditions.</td>
                      </tr>
                      <tr className="bg-[#f5f5f5]">
                        <td className="p-2 border-b border-[#ddd]">Flood Prevention</td>
                        <td className="p-2 border-b border-[#ddd]">Real-time monitoring and predictive modeling to mitigate flooding risks in vulnerable areas.</td>
                      </tr>
                      <tr>
                        <td className="p-2 border-b border-[#ddd]">Groundwater Management</td>
                        <td className="p-2 border-b border-[#ddd]">Sustainable utilization strategies based on recharge rates, extraction patterns, and contamination risks.</td>
                      </tr>
                      <tr className="bg-[#f5f5f5]">
                        <td className="p-2 border-b border-[#ddd]">Urban Water Supply</td>
                        <td className="p-2 border-b border-[#ddd]">Optimization of distribution networks, leakage detection, and demand forecasting for growing urban centers.</td>
                      </tr>
                      <tr>
                        <td className="p-2 border-b border-[#ddd]">Agricultural Water</td>
                        <td className="p-2 border-b border-[#ddd]">Precision irrigation scheduling and crop water requirement modeling to maximize agricultural productivity.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Collaborations section */}
              <div className="bg-white border border-[#ddd] p-5 mb-6">
                <h2 className="font-['Times_New_Roman',_Times,_serif] text-[#00008B] text-2xl mt-0 mb-4 pb-2.5 border-b-2 border-[#ddd]">
                  Key Collaborations
                </h2>
                <p className="text-[#333] text-base leading-relaxed mb-4 text-justify">
                  This DSS works in alignment with national water projects including:
                </p>
                <ul className="my-4 pl-5">
                  <li className="mb-2.5 pl-1.5"><strong>Jal Jeevan Mission:</strong> Supporting the aim of providing safe drinking water to all households.</li>
                  <li className="mb-2.5 pl-1.5"><strong>Atal Bhujal Yojana:</strong> Enhancing groundwater management through community participation.</li>
                  <li className="mb-2.5 pl-1.5"><strong>National Hydrological Project:</strong> Improving the accessibility of water resources information.</li>
                  <li className="mb-2.5 pl-1.5"><strong>National Groundwater Management Improvement Program-2:</strong> Supporting sustainable groundwater management.</li>
                </ul>
                <p className="text-[#333] text-base leading-relaxed mb-4 text-justify">
                  By integrating these missions' goals into our system, we aim to enhance India's water resource management capabilities.
                </p>
              </div>

              {/* Technology section */}
              <div className="bg-white border border-[#ddd] p-5 mb-6">
                <h2 className="font-['Times_New_Roman',_Times,_serif] text-[#00008B] text-2xl mt-0 mb-4 pb-2.5 border-b-2 border-[#ddd]">
                  Technological Framework
                </h2>
                <p className="text-[#333] text-base leading-relaxed mb-4 text-justify">
                  The DSS utilizes advanced data from sources such as:
                </p>
                <ul className="my-4 pl-5">
                  <li className="mb-2.5 pl-1.5">Central Water Commission (CWC) monitoring stations</li>
                  <li className="mb-2.5 pl-1.5">India Meteorological Department (IMD) weather forecasts</li>
                  <li className="mb-2.5 pl-1.5">Satellite imagery from NASA's MODIS and Sentinel satellites</li>
                  <li className="mb-2.5 pl-1.5">Ground-level monitoring through IoT sensor networks</li>
                </ul>
                <p className="text-[#333] text-base leading-relaxed mb-4 text-justify">
                  By combining these data sources and applying system thinking methodologies, the DSS facilitates informed, effective decision-making at multiple levels of water governance.
                </p>
              </div>
            </div>

            {/* Sidebar - 1/3 width */}
            <div className="w-full lg:w-1/3 px-4">
              <div className="bg-[#f0f0f0] p-5 border border-[#ddd]">
                <h3 className="font-['Times_New_Roman',_Times,_serif] text-[#00008B] text-xl mt-0 mb-4 pb-2 border-b border-[#ccc]">
                  Documents
                </h3>
                <div className="text-center mb-5">
                  <Link href="/confident" 
                    className="inline-block py-2 px-4 bg-[#0066CC] text-white no-underline rounded text-sm transition-colors duration-300 hover:bg-[#00478f]">
                    <span className="mr-1">&#128196;</span> View All Documents
                  </Link>
                </div>

                <h3 className="font-['Times_New_Roman',_Times,_serif] text-[#00008B] text-xl mt-0 mb-4 pb-2 border-b border-[#ccc]">
                  Related Schemes
                </h3>
                <ul className="list-none p-0">
                  <li className="py-2 border-b border-dotted border-[#ccc]">
                    <Link href="#" className="text-[#0066CC] no-underline hover:underline">
                      Jal Jeevan Mission
                    </Link>
                  </li>
                  <li className="py-2 border-b border-dotted border-[#ccc]">
                    <Link href="#" className="text-[#0066CC] no-underline hover:underline">
                      Atal Bhujal Yojana
                    </Link>
                  </li>
                  <li className="py-2 border-b border-dotted border-[#ccc]">
                    <Link href="#" className="text-[#0066CC] no-underline hover:underline">
                      Namami Gange Programme
                    </Link>
                  </li>
                  <li className="py-2 border-b border-dotted border-[#ccc]">
                    <Link href="#" className="text-[#0066CC] no-underline hover:underline">
                      National Rural Drinking Water Programme
                    </Link>
                  </li>
                </ul>

                <h3 className="font-['Times_New_Roman',_Times,_serif] text-[#00008B] text-xl mt-6 mb-4 pb-2 border-b border-[#ccc]">
                  Important Links
                </h3>
                <ul className="list-none p-0">
                  <li className="py-2 border-b border-dotted border-[#ccc]">
                    <Link href="#" className="text-[#0066CC] no-underline hover:underline">
                      Ministry of Jal Shakti
                    </Link>
                  </li>
                  <li className="py-2 border-b border-dotted border-[#ccc]">
                    <Link href="#" className="text-[#0066CC] no-underline hover:underline">
                      Central Water Commission
                    </Link>
                  </li>
                  <li className="py-2 border-b border-dotted border-[#ccc]">
                    <Link href="#" className="text-[#0066CC] no-underline hover:underline">
                      Central Ground Water Board
                    </Link>
                  </li>
                  <li className="py-2 border-b border-dotted border-[#ccc]">
                    <Link href="#" className="text-[#0066CC] no-underline hover:underline">
                      National Water Mission
                    </Link>
                  </li>
                  <li className="py-2 border-b border-dotted border-[#ccc]">
                    <Link href="#" className="text-[#0066CC] no-underline hover:underline">
                      India Meteorological Department
                    </Link>
                  </li>
                </ul>

                <h3 className="font-['Times_New_Roman',_Times,_serif] text-[#00008B] text-xl mt-6 mb-4 pb-2 border-b border-[#ccc]">
                  Contact Information
                </h3>
                <div className="not-italic leading-relaxed">
                  <strong>Smart Laboratory for Clean Rivers (SLCR)</strong><br />
                  Department of Civil Engineering,<br />
                  Indian Institute of Technology (BHU)<br />
                  Varanasi 221005<br />
                  <br />
                  Email: dssiitbhu@gmail.com<br />
                  Phone: +91-11-XXXXXXXX
                </div>
              </div>
            </div>
          </div>
        </div>

        
      </div>
    </div>
  );
}
'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePathname } from 'next/navigation'; // ✅ Ensure this is available with App Router
import VarunaMap from './varunamap'; // ✅ Import VarunaMap
// Interfaces
interface Alert {
  type: string;
  severity: 'High' | 'Critical';
  message: string;
  location: string;
  value?: number;
  threshold?: number;
}
interface TabButtonProps {
  id: string;
  label: string;
  isActive: boolean;
  onClick: (id: string) => void;
}
interface DrainRecord {
  id: number;
  location: string;
  stream?: string;
  ph: number;
  temp: number;
  ec_us_cm: number;
  tds_ppm: number;
  do_mg_l: number;
  turbidity: number;
  tss_mg_l: number;
  cod: number;
  bod_mg_l: number;
  ts_mg_l: number;
  chloride: number;
  nitrate: number;
  faecal_col: string | null;
  total_col: string | null;
  lat: number | null;
  lon: number | null;
}
// Sample Data
const temporalData = [
  { month: 'Jul-09', temp: 34.1, pH: 8.0, DO: 1.8, BOD: 88, COD: 150, alkalinity: 300 },
  { month: 'Aug-09', temp: 33.0, pH: 7.6, DO: 2.0, BOD: 80, COD: 112, alkalinity: 220 },
  { month: 'Sep-09', temp: 30.2, pH: 7.1, DO: 2.2, BOD: 35, COD: 98, alkalinity: 205 },
  { month: 'Oct-09', temp: 28.2, pH: 7.0, DO: 2.5, BOD: 48, COD: 100, alkalinity: 200 },
  { month: 'Nov-09', temp: 22.2, pH: 7.0, DO: 2.5, BOD: 55, COD: 89, alkalinity: 230 },
  { month: 'Dec-09', temp: 21.3, pH: 6.9, DO: 2.8, BOD: 52, COD: 78, alkalinity: 296 },
  { month: 'Jan-10', temp: 19.5, pH: 7.0, DO: 3.0, BOD: 40, COD: 75, alkalinity: 288 },
  { month: 'Feb-10', temp: 20.8, pH: 7.1, DO: 3.2, BOD: 42, COD: 78, alkalinity: 281 },
  { month: 'Mar-10', temp: 21.2, pH: 7.3, DO: 3.5, BOD: 40, COD: 79, alkalinity: 295 },
  { month: 'Apr-10', temp: 26.8, pH: 7.3, DO: 2.4, BOD: 48, COD: 82, alkalinity: 325 },
  { month: 'May-10', temp: 34.8, pH: 8.1, DO: 1.8, BOD: 70, COD: 101, alkalinity: 379 },
  { month: 'Jun-10', temp: 35.5, pH: 8.5, DO: 1.0, BOD: 78, COD: 135, alkalinity: 395 }
];
const spatialData = [
  { station: 'Mahadev Mandir, Prayagraj', district: 'Prayagraj', DO: 2.8, BOD: 5.16, COD: 31.1, status: 'Moderate' },
  { station: 'Mobi Deenpur Bridge, Bhadohi', district: 'Bhadohi', DO: 5.8, BOD: 5.6, COD: 18.7, status: 'Good' },
  { station: 'Kusha ghat-Godma Bridge', district: 'Bhadohi', DO: 5.6, BOD: 2.87, COD: 19.1, status: 'Good' },
  { station: 'Varuna U/s of Dhaurahra Drain', district: 'Bhadohi', DO: 2.6, BOD: 1.05, COD: 16.58, status: 'Excellent' },
  { station: 'Varuna D/s of Nai Bazar Drain', district: 'Bhadohi', DO: 2.6, BOD: 3.84, COD: 22.14, status: 'Moderate' },
  { station: 'Varuna at Rameswaram Mandir', district: 'Varanasi', DO: 6.0, BOD: 1.23, COD: 14.22, status: 'Good' },
  { station: 'Varuna at Koirajpur Bridge', district: 'Varanasi', DO: 6.2, BOD: 3.62, COD: 13.47, status: 'Good' },
  { station: 'Varuna at Pishaura Bridge', district: 'Varanasi', DO: 7.2, BOD: 1.23, COD: 17.14, status: 'Good' },
  { station: 'Varuna at Kutchehari Bridge', district: 'Varanasi', DO: 4.1, BOD: 6.62, COD: 30.24, status: 'Poor' }
];
const industrialData = [
  { type: 'Textile/Yarn', count: 54, location: 'Bhadohi (50)', status: 'High Impact' },
  { type: 'Saree Printing', count: 33, location: 'Varanasi (33)', status: 'High Impact' },
  { type: 'Metal Surface Treatment', count: 23, location: 'Varanasi (23)', status: 'Medium Impact' },
  { type: 'Small-scale Industries', count: 867, location: 'Varanasi', status: 'Critical Impact', discharge: '9.13 MLD' },
  { type: 'Slaughterhouses', count: 3, location: 'Various', status: 'Low Impact' },
  { type: 'Food & Beverage', count: 3, location: 'Various', status: 'Low Impact' }
];
const drainDataSample = [
  { name: 'Kutchehari Bridge Drain', status: 'Untapped', pollution: 'Critical', BOD_contribution: 22, priority: 1 },
  { name: 'Daniyalpur Drain', status: 'Untapped', pollution: 'High', BOD_contribution: 12, priority: 2 },
  { name: 'Nai Bazar Drain', status: 'Untapped', pollution: 'Medium', BOD_contribution: 8, priority: 3 },
  { name: 'Koirajpur Bridge Drain', status: 'Untapped', pollution: 'Medium', BOD_contribution: 6, priority: 4 },
  { name: 'Connected Drains (7)', status: 'Tapped', pollution: 'Controlled', BOD_contribution: 15, priority: 'N/A' }
];
const predictionData = [
  { timeframe: 'Next 7 days', BOD_forecast: 65, confidence: 85, trend: 'Increasing' },
  { timeframe: 'Next 30 days', BOD_forecast: 72, confidence: 75, trend: 'Increasing' },
  { timeframe: 'Next 90 days', BOD_forecast: 58, confidence: 65, trend: 'Monsoon Dilution' },
  { timeframe: 'Next 180 days', BOD_forecast: 45, confidence: 55, trend: 'Seasonal Variation' }
];
const interventionData = [
  { intervention: 'Connect Kutchehari Drain', cost: 8, impact: 22, timeline: 60, roi: 2.75 },
  { intervention: 'Shutdown 15 Worst Industries', cost: 2, impact: 28, timeline: 30, roi: 14.0 },
  { intervention: 'Connect Daniyalpur Drain', cost: 5, impact: 12, timeline: 45, roi: 2.4 },
  { intervention: 'Install Emergency Oxygenation', cost: 1.5, impact: 8, timeline: 15, roi: 5.33 },
  { intervention: 'Build CETP for Bhadohi', cost: 45, impact: 15, timeline: 365, roi: 0.33 }
];
const statisticsDetailData = {
  riverLength: {
    title: '🌊 River Length Details',
    subtitle: 'Comprehensive river network analysis',
    data: [
      { segment: 'Main River Channel', length: '105 km', condition: 'Moderate', tributaries: 3 },
      { segment: 'Major Tributaries', length: '65 km', condition: 'Variable', tributaries: 8 },
      { segment: 'Minor Tributaries', length: '30 km', condition: 'Poor', tributaries: 15 },
      { segment: 'Seasonal Streams', length: '20 km', condition: 'Intermittent', tributaries: 12 }
    ],
    summary: {
      total: '220 km total network',
      monitored: '200 km actively monitored',
      critical: '45 km critically polluted'
    }
  },
  districts: {
    title: '📍 District Coverage Details',
    subtitle: 'Administrative and jurisdictional information',
    data: [
      { district: 'Prayagraj', population: '6.1 million', riverLength: '25 km', stations: 1, industries: 15, status: 'Moderate Impact', keyIssues: 'Urban runoff, religious activities' },
      { district: 'Bhadohi', population: '1.7 million', riverLength: '85 km', stations: 4, industries: 54, status: 'High Impact', keyIssues: 'Textile industries, carpet weaving' },
      { district: 'Varanasi', population: '4.2 million', riverLength: '90 km', stations: 7, industries: 923, status: 'Critical Impact', keyIssues: 'Dense industrial zones, urban sewage' }
    ],
    summary: {
      totalPopulation: '12 million people',
      totalIndustries: '992 industries',
      adminComplexity: '3-tier governance system'
    }
  },
  monitoringStations: {
    title: '🔬 Monitoring Stations Network',
    subtitle: 'Real-time water quality monitoring infrastructure',
    data: [
      { id: 'VS-01', name: 'Mahadev Mandir', district: 'Prayagraj', status: 'Active', parameters: 8, condition: 'Moderate' },
      { id: 'VS-02', name: 'Mobi Deenpur Bridge', district: 'Bhadohi', status: 'Active', parameters: 8, condition: 'Good' },
      { id: 'VS-03', name: 'Kusha Ghat-Godma Bridge', district: 'Bhadohi', status: 'Active', parameters: 8, condition: 'Good' },
      { id: 'VS-04', name: 'Varuna U/s Dhaurahra', district: 'Bhadohi', status: 'Active', parameters: 8, condition: 'Excellent' },
      { id: 'VS-05', name: 'Varuna D/s Nai Bazar', district: 'Bhadohi', status: 'Active', parameters: 8, condition: 'Moderate' },
      { id: 'VS-06', name: 'Rameswaram Mandir', district: 'Varanasi', status: 'Active', parameters: 8, condition: 'Good' },
      { id: 'VS-07', name: 'Koirajpur Bridge', district: 'Varanasi', status: 'Active', parameters: 8, condition: 'Good' },
      { id: 'VS-08', name: 'Pishaura Bridge', district: 'Varanasi', status: 'Active', parameters: 8, condition: 'Good' },
      { id: 'VS-09', name: 'Kutchehari Bridge', district: 'Varanasi', status: 'Alert', parameters: 8, condition: 'Poor' },
      { id: 'VS-10', name: 'Downstream Confluence', district: 'Varanasi', status: 'Active', parameters: 6, condition: 'Moderate' },
      { id: 'VS-11', name: 'Midstream Monitoring', district: 'Bhadohi', status: 'Maintenance', parameters: 8, condition: 'Unknown' },
      { id: 'VS-12', name: 'Upstream Source', district: 'Prayagraj', status: 'Active', parameters: 8, condition: 'Good' }
    ],
    summary: {
      operational: '11 stations operational',
      maintenance: '1 station under maintenance',
      coverage: '95% network coverage'
    }
  },
  basinArea: {
    title: '🏞️ Basin Area Analysis',
    subtitle: 'Comprehensive watershed characteristics',
    data: [
      { category: 'Urban Area', area: '425 km²', percentage: '13.5%', impact: 'High pollution load', population: '8.2 million' },
      { category: 'Agricultural Land', area: '1,890 km²', percentage: '60.2%', impact: 'Fertilizer runoff', population: '2.8 million' },
      { category: 'Industrial Zones', area: '185 km²', percentage: '5.9%', impact: 'Toxic discharge', population: '0.3 million' },
      { category: 'Forest Cover', area: '315 km²', percentage: '10.0%', impact: 'Natural filtration', population: '0.1 million' },
      { category: 'Water Bodies', area: '95 km²', percentage: '3.0%', impact: 'Flood regulation', population: '-' },
      { category: 'Barren/Others', area: '231 km²', percentage: '7.4%', impact: 'Erosion source', population: '0.6 million' }
    ],
    summary: {
      totalArea: '3,141 km² watershed',
      rainfallPattern: '850-1200mm annual',
      landUseChange: '2.5% urban expansion annually'
    }
  }
};
const WATER_QUALITY_STANDARDS = {
  BOD: { excellent: 3, good: 6, poor: 10 },
  DO: { excellent: 6, good: 4, poor: 2 },
  pH: { min: 6.5, max: 8.5 }
};
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
// Animated Counter Component
const AnimatedCounter = ({ value, duration = 2000 }: { value: number; duration?: number }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTime = 0;
    const animate = (currentTime: number) => {
      if (startTime === 0) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, duration]);
  return <span>{count}</span>;
};
// Image Carousel Component
const ImageCarousel = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = [
    '/varuna1.png', '/varuna2.png', '/varuna3.png', '/varuna4.png',
    '/varuna5.png', '/varuna6.png', '/varuna7.png', '/varuna8.png'
  ];
  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  useEffect(() => {
    const interval = setInterval(nextImage, 3000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="relative w-full h-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4 flex justify-between items-center">
        <div><h2 className="text-xl font-bold">🌊 Varuna River Gallery</h2></div>
      </div>
      <div className="relative h-[638px] overflow-hidden">
        <img src={images[currentImageIndex]} alt={`Varuna River ${currentImageIndex + 1}`} className="w-full h-full object-cover transition-all duration-500 ease-in-out" />
        <button onClick={prevImage} className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200">
          <ChevronLeft size={20} />
        </button>
        <button onClick={nextImage} className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200">
          <ChevronRight size={20} />
        </button>
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {images.map((_, index) => (
            <button key={index} onClick={() => setCurrentImageIndex(index)} className={`w-2 h-2 rounded-full transition-all duration-200 ${index === currentImageIndex ? 'bg-white' : 'bg-white/50'}`} />
          ))}
        </div>
        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
          {currentImageIndex + 1} / {images.length}
        </div>
      </div>
    </div>
  );
};
// Main Dashboard Component
export default function VarunaRiverDashboard() {
  const [worstNitrate, setWorstNitrate] = useState({ location: '—', value: '—' });
  const [worstBOD, setWorstBOD] = useState({ location: '—', value: '—' });
  const [worstFaecalColiform, setWorstFaecalColiform] = useState({ location: '—', value: '—' });
  const [worstAlgaeRisk, setWorstAlgaeRisk] = useState({ location: '—', nitrate: '—', bod: '—' });
  const [worstChemicalRisk, setWorstChemicalRisk] = useState({ location: '—', cod: '—', tss: '—' });
  const [worstTurbidity, setWorstTurbidity] = useState({ location: '—', value: '—' });
  const [worstSalinity, setWorstSalinity] = useState({ location: '—', tds: '—', ec: '—' });
  const [worstIndustrial, setWorstIndustrial] = useState({ location: '—', cod: '—', tds: '—' });
  const [worstLandDumping, setWorstLandDumping] = useState({ location: '—', tss: '—', turbidity: '—', ts: '—' });
  const [worstDetergentRisk, setWorstDetergentRisk] = useState({ location: '—', bod: '—', cod: '—' });
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedParameter, setSelectedParameter] = useState('BOD');
  const [alertsCount, setAlertsCount] = useState(0);
  const [alertDetails, setAlertDetails] = useState<Alert[]>([]);
  const [showAlertDetails, setShowAlertDetails] = useState(false);
  const [showStatDetails, setShowStatDetails] = useState(false);
  const [selectedStat, setSelectedStat] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // ✅ Added for VarunaMap
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [drainData, setDrainData] = useState<DrainRecord[]>([]);
  const [showMarkers, setShowMarkers] = useState(false);
  const alertRef = useRef<HTMLDivElement>(null);
  const statRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname(); // ✅ Using App Router hook
  // ✅ NEW: Map notification handler
  const showNotification = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    console.log(`${type.toUpperCase()}: ${title} - ${message}`);
  };
  // Calculate Pollution Load Index
  const calculatePollutionLoadIndex = (data: DrainRecord): { score: number; level: string; location: string } => {
    const oxygenDeficit = Math.max(0, 8 - data.do_mg_l);
    const pollutionScore = (data.bod_mg_l * 0.4) + (data.cod * 0.003) + (oxygenDeficit * 10);
    let level: string;
    if (pollutionScore > 50) level = 'EXTREME';
    else if (pollutionScore > 30) level = 'HIGH';
    else if (pollutionScore > 15) level = 'MODERATE';
    else if (pollutionScore > 5) level = 'LOW';
    else level = 'MINIMAL';
    return { score: Math.round(pollutionScore * 10) / 10, level, location: data.location };
  };
  // Calculate Eutrophication Risk
  const calculateEutrophicationRisk = (data: DrainRecord): { score: number; level: string; location: string } => {
    const nitrateScore = typeof data.nitrate === 'number' ? Math.min(data.nitrate * 2, 10) : 0;
    const turbidityScore = Math.min(data.turbidity / 10, 10);
    const oxygenScore = data.do_mg_l < 4 ? 10 : data.do_mg_l < 6 ? 5 : 0;
    const eutrophicationScore = nitrateScore + turbidityScore + oxygenScore;
    let level: string;
    if (eutrophicationScore > 20) level = 'EXTREME';
    else if (eutrophicationScore > 15) level = 'HIGH';
    else if (eutrophicationScore > 10) level = 'MODERATE';
    else if (eutrophicationScore > 5) level = 'LOW';
    else level = 'MINIMAL';
    return { score: Math.round(eutrophicationScore * 10) / 10, level, location: data.location };
  };
  // Calculate Bacterial Contamination
  const calculateBacterialContamination = (data: DrainRecord): { score: number; level: string; location: string } => {
    let bacterialScore = 0;
    let level = 'UNKNOWN';
    if (data.faecal_col && data.faecal_col !== 'N/A' && data.faecal_col.trim() !== '') {
      const numbers = data.faecal_col.match(/[\d,]+/g);
      if (numbers) {
        const maxValue = Math.max(...numbers.map(n => parseInt(n.replace(/,/g, ''))));
        bacterialScore = Math.log10(maxValue + 1);
        if (maxValue > 100000) level = 'EXTREME';
        else if (maxValue > 50000) level = 'HIGH';
        else if (maxValue > 10000) level = 'MODERATE';
        else if (maxValue > 1000) level = 'LOW';
        else level = 'MINIMAL';
      }
    } else {
      if (data.bod_mg_l > 30) { bacterialScore = 5; level = 'HIGH (BOD-based)'; }
      else if (data.bod_mg_l > 15) { bacterialScore = 3; level = 'MODERATE (BOD-based)'; }
      else { bacterialScore = 1; level = 'LOW (BOD-based)'; }
    }
    return { score: Math.round(bacterialScore * 10) / 10, level, location: data.location };
  };
  // Find worst sites
  const getWorstSites = () => {
    if (drainData.length === 0) return null;
    const pollutionResults = drainData.map(calculatePollutionLoadIndex);
    const eutrophicationResults = drainData.map(calculateEutrophicationRisk);
    const bacterialResults = drainData.map(calculateBacterialContamination);
    const worstPollution = pollutionResults.sort((a, b) => b.score - a.score)[0];
    const worstEutrophication = eutrophicationResults.sort((a, b) => b.score - a.score)[0];
    const worstBacterial = bacterialResults.sort((a, b) => b.score - a.score)[0];
    return { pollution: worstPollution, eutrophication: worstEutrophication, bacterial: worstBacterial };
  };
  // Fetch drain data
  useEffect(() => {
    fetch('http://localhost:9000/api/drain-water-quality/')
      .then(async res => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then(data => {
        setDrainData(data);
        const alerts: Alert[] = [];
        data.forEach((site: DrainRecord) => {
          const exceed = [];
          if (site.bod_mg_l > 30) exceed.push(`BOD = ${site.bod_mg_l}`);
          if (site.do_mg_l < 3) exceed.push(`DO = ${site.do_mg_l}`);
          if (site.cod > 200) exceed.push(`COD = ${site.cod}`);
          if (exceed.length > 0) {
            alerts.push({
              type: 'Drain Critical Alert',
              severity: 'Critical',
              location: site.location,
              message: exceed.length === 1 ? `High level detected: ${exceed[0]}` : `Multiple high levels detected: ${exceed.join(', ')}`,
            });
          }
        });
        setAlertDetails(alerts);
        setAlertsCount(alerts.length);
        const nitrateSorted = [...data].filter(site => site.nitrate !== null && site.nitrate !== undefined).sort((a, b) => b.nitrate - a.nitrate);
        if (nitrateSorted.length > 0) setWorstNitrate({ location: nitrateSorted[0].location, value: nitrateSorted[0].nitrate.toFixed(2) });
        const bodSorted = [...data].filter(site => site.bod_mg_l !== null && site.bod_mg_l !== undefined).sort((a, b) => b.bod_mg_l - a.bod_mg_l);
        if (bodSorted.length > 0) setWorstBOD({ location: bodSorted[0].location, value: bodSorted[0].bod_mg_l.toFixed(2) });
        const faecalSites = data.filter((d: DrainRecord) => {
          const val = d.faecal_col;
          if (!val || val === 'N/A') return false;
          const parsed = extractFaecalValue(val);
          return !isNaN(parsed) && parsed > 0;
        });
        const worstFaecal = faecalSites.sort((a: DrainRecord, b: DrainRecord) => extractFaecalValue(b.faecal_col) - extractFaecalValue(a.faecal_col))[0];
        if (worstFaecal) setWorstFaecalColiform({ location: worstFaecal.location, value: extractFaecalValue(worstFaecal.faecal_col).toFixed(0) });
        const algaeRiskCandidates = data.filter((d: DrainRecord) => d.nitrate !== null && d.bod_mg_l !== null);
        const highestAlgaeSite = algaeRiskCandidates.sort((a: DrainRecord, b: DrainRecord) => (b.nitrate + b.bod_mg_l) - (a.nitrate + a.bod_mg_l))[0];
        if (highestAlgaeSite) setWorstAlgaeRisk({ location: highestAlgaeSite.location, nitrate: highestAlgaeSite.nitrate.toFixed(2), bod: highestAlgaeSite.bod_mg_l.toFixed(2) });
        const chemicalRiskCandidates = data.filter((d: DrainRecord) => d.cod !== null && d.tss_mg_l !== null);
        const highestChemicalSite = chemicalRiskCandidates.sort((a: DrainRecord, b: DrainRecord) => (b.cod + b.tss_mg_l) - (a.cod + a.tss_mg_l))[0];
        if (highestChemicalSite) setWorstChemicalRisk({ location: highestChemicalSite.location, cod: highestChemicalSite.cod.toFixed(2), tss: highestChemicalSite.tss_mg_l.toFixed(2) });
        const highTurbiditySite = data.filter((d: DrainRecord) => typeof d.turbidity === 'number').sort((a: DrainRecord, b: DrainRecord) => b.turbidity - a.turbidity)[0];
        if (highTurbiditySite) setWorstTurbidity({ location: highTurbiditySite.location, value: highTurbiditySite.turbidity.toFixed(2) });
        const salinityCandidates = data.filter((d: DrainRecord) => d.tds_ppm > 500 || d.ec_us_cm > 1000);
        const highestSalinitySite = salinityCandidates.sort((a: DrainRecord, b: DrainRecord) => (b.tds_ppm + b.ec_us_cm) - (a.tds_ppm + a.ec_us_cm))[0];
        if (highestSalinitySite) setWorstSalinity({ location: highestSalinitySite.location, tds: highestSalinitySite.tds_ppm.toFixed(2), ec: highestSalinitySite.ec_us_cm.toFixed(2) });
        const industrialCandidates = data.filter((d: DrainRecord) => d.cod && d.tds_ppm);
        const highestIndustrial = industrialCandidates.sort((a: DrainRecord, b: DrainRecord) => (b.cod + b.tds_ppm) - (a.cod + a.tds_ppm))[0];
        if (highestIndustrial) setWorstIndustrial({ location: highestIndustrial.location, cod: highestIndustrial.cod.toFixed(2), tds: highestIndustrial.tds_ppm.toFixed(2) });
        const landDumpingCandidates = data.filter((d: DrainRecord) => d.tss_mg_l > 100 || d.turbidity > 25 || d.ts_mg_l > 500);
        const worstDumpingSite = landDumpingCandidates.sort((a: DrainRecord, b: DrainRecord) => (b.tss_mg_l + b.turbidity + b.ts_mg_l) - (a.tss_mg_l + a.turbidity + a.ts_mg_l))[0];
        if (worstDumpingSite) setWorstLandDumping({ location: worstDumpingSite.location, tss: worstDumpingSite.tss_mg_l.toFixed(1), turbidity: worstDumpingSite.turbidity.toFixed(1), ts: worstDumpingSite.ts_mg_l.toFixed(1) });
        const detergentRiskCandidates = data.filter((d: DrainRecord) => d.bod_mg_l !== null && d.cod !== null);
        const worstDetergentSite = detergentRiskCandidates.sort((a: DrainRecord, b: DrainRecord) => (b.bod_mg_l + b.cod) - (a.bod_mg_l + a.cod))[0];
        if (worstDetergentSite) setWorstDetergentRisk({ location: worstDetergentSite.location, bod: worstDetergentSite.bod_mg_l.toFixed(2), cod: worstDetergentSite.cod.toFixed(2) });
      })
      .catch(error => console.error('Error fetching drain data:', error));
  }, []);
  const extractFaecalValue = (val: string | null): number => {
    if (!val || val === 'N/A') return 0;
    const parts = val.replace(/,/g, '').split(/–|-/).map(Number);
    return parts.length === 2 ? (parts[0] + parts[1]) / 2 : Number(parts[0]);
  };
  const { acidicCount, lowDOCount, highBODCount, highCODCount, coliformCount } = useMemo(() => ({
    acidicCount: drainData.filter(d => d.ph < 6.5).length,
    lowDOCount: drainData.filter(d => d.do_mg_l < 4).length,
    highBODCount: drainData.filter(d => d.bod_mg_l > 10).length,
    highCODCount: drainData.filter(d => d.cod > 100).length,
    coliformCount: drainData.filter(d => (d.faecal_col && d.faecal_col !== 'N/A') || (d.total_col && d.total_col !== 'N/A')).length,
  }), [drainData]);
  const filteredDrainData = useMemo(() => {
    switch (selectedFilter) {
      case 'acidic': return drainData.filter(d => d.ph < 6.5);
      case 'lowDO': return drainData.filter(d => d.do_mg_l < 4);
      case 'highBOD': return drainData.filter(d => d.bod_mg_l > 10);
      case 'highCOD': return drainData.filter(d => d.cod > 100);
      case 'coliform': return drainData.filter(d => (d.faecal_col && d.faecal_col !== 'N/A') || (d.total_col && d.total_col !== 'N/A'));
      default: return drainData;
    }
  }, [drainData, selectedFilter]);
  const processedData = drainData.map((entry, index) => ({
    label: entry.location || `Point-${index + 1}`,
    pH: entry.ph,
    DO: entry.do_mg_l,
    BOD: entry.bod_mg_l,
    COD: entry.cod,
    temp: entry.temp,
  }));
  const calculateRealAlerts = () => {
    const alerts: Alert[] = [];
    spatialData.forEach(station => {
      if (station.BOD > WATER_QUALITY_STANDARDS.BOD.poor) {
        alerts.push({
          type: 'BOD Critical',
          severity: 'Critical',
          message: `BOD level critically high - Immediate action required`,
          location: station.station,
          value: station.BOD,
          threshold: WATER_QUALITY_STANDARDS.BOD.poor
        });
      } else if (station.BOD > WATER_QUALITY_STANDARDS.BOD.good) {
        alerts.push({
          type: 'BOD High',
          severity: 'High',
          message: `BOD level above acceptable limit - Action needed`,
          location: station.station,
          value: station.BOD,
          threshold: WATER_QUALITY_STANDARDS.BOD.good
        });
      }
      if (station.DO < WATER_QUALITY_STANDARDS.DO.poor) {
        alerts.push({
          type: 'DO Critical',
          severity: 'Critical',
          message: `Dissolved Oxygen critically low - Emergency intervention needed`,
          location: station.station,
          value: station.DO,
          threshold: WATER_QUALITY_STANDARDS.DO.poor
        });
      } else if (station.DO < WATER_QUALITY_STANDARDS.DO.good) {
        alerts.push({
          type: 'DO Low',
          severity: 'High',
          message: `Dissolved Oxygen below acceptable level - Urgent attention required`,
          location: station.station,
          value: station.DO,
          threshold: WATER_QUALITY_STANDARDS.DO.good
        });
      }
    });
    const criticalIndustries = industrialData.filter(industry => industry.status.includes('Critical') || industry.count > 500);
    if (criticalIndustries.length > 0) {
      alerts.push({
        type: 'Industrial Pollution',
        severity: 'High',
        message: `${criticalIndustries[0]?.count || 0} small-scale industries without proper treatment - High pollution risk`,
        location: 'Varanasi District'
      });
    }
    return alerts.filter(alert => alert.severity === 'Critical' || alert.severity === 'High');
  };
  useEffect(() => {
    setTimeout(() => setIsLoading(false), 1000);
    const alerts = calculateRealAlerts();
    setAlertDetails(alerts);
    setAlertsCount(alerts.length);
  }, []);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (alertRef.current && !alertRef.current.contains(event.target as Node)) setShowAlertDetails(false);
      if (statRef.current && !statRef.current.contains(event.target as Node)) {
        setShowStatDetails(false);
        setSelectedStat(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  useEffect(() => {
    setSelectedFilter(null); // Reset filter on route change
  }, [pathname]);
  const handleStatClick = (statType: string) => {
    setSelectedStat(statType);
    setShowStatDetails(true);
    setShowAlertDetails(false);
  };
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'excellent': return 'text-emerald-700 bg-emerald-100 border-emerald-200';
      case 'good': return 'text-blue-700 bg-blue-100 border-blue-200';
      case 'moderate': return 'text-amber-700 bg-amber-100 border-amber-200';
      case 'poor': return 'text-red-700 bg-red-100 border-red-200';
      case 'critical': return 'text-red-800 bg-red-200 border-red-300';
      default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'text-red-800 bg-red-100 border-red-200';
      case 'high': return 'text-orange-800 bg-orange-100 border-orange-200';
      case 'medium': return 'text-yellow-800 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-blue-800 bg-blue-100 border-blue-200';
      default: return 'text-gray-800 bg-gray-100 border-gray-200';
    }
  };
  const TabButton = ({ id, label, isActive, onClick }: TabButtonProps) => (
    <button
      onClick={() => onClick(id)}
      className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 transform ${
        isActive
          ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg scale-105'
          : 'bg-white text-gray-700 hover:bg-gray-50 hover:scale-102 shadow-sm border border-gray-200'
      }`}
    >
      {label}
    </button>
  );
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50 p-6">
      <style jsx global>{`
        /* Ensure VarunaMap controls are visible, avoid hiding Leaflet-specific elements */
        .varuna-map-controls {
          display: flex !important;
          visibility: visible !important;
          opacity: 1 !important;
        }
        /* Remove any aggressive hiding of Leaflet controls that might interfere */
        .leaflet-control-zoom,
        .leaflet-control-attribution {
          display: none !important;
        }
      `}</style>
      <style jsx>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.3); }
          50% { box-shadow: 0 0 30px rgba(239, 68, 68, 0.6); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        .float { animation: float 3s ease-in-out infinite; }
        .shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
      {/* Header Section */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-800 text-white rounded-2xl p-8 shadow-2xl border border-blue-500/20">
          <div className="flex justify-between items-center">
            <button
              onClick={() => window.location.href = '/'}
              className="bg-orange-500 text-blue-700 font-bold px-4 py-2 rounded-lg shadow hover:bg-blue-100"
            >
              ⬅️ Back
            </button>
            <div>
              <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                🌊 Varuna River Management Dashboard
              </h1>
              <p className="text-blue-100 text-lg mb-4">Comprehensive Water Quality Monitoring & Decision Support System</p>
              <div className="flex flex-wrap gap-3 mt-4">
                <span
                  onClick={() => handleStatClick('riverLength')}
                  className="bg-blue-700/50 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium border border-blue-500/30 cursor-pointer hover:bg-blue-600/60 hover:scale-105 transition-all duration-300 hover:shadow-lg"
                  title="Click for detailed river network information"
                >
                  200km River Length
                </span>
                <span
                  onClick={() => handleStatClick('districts')}
                  className="bg-blue-700/50 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium border border-blue-500/30 cursor-pointer hover:bg-blue-600/60 hover:scale-105 transition-all duration-300 hover:shadow-lg"
                  title="Click for district-wise coverage details"
                >
                  3 Districts Covered
                </span>
                <span
                  onClick={() => handleStatClick('monitoringStations')}
                  className="bg-blue-700/50 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium border border-blue-500/30 cursor-pointer hover:bg-blue-600/60 hover:scale-105 transition-all duration-300 hover:shadow-lg"
                  title="Click for monitoring station network details"
                >
                  12 Monitoring Stations
                </span>
                <span
                  onClick={() => handleStatClick('basinArea')}
                  className="bg-blue-700/50 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium border border-blue-500/30 cursor-pointer hover:bg-blue-600/60 hover:scale-105 transition-all duration-300 hover:shadow-lg"
                  title="Click for watershed and basin area analysis"
                >
                  3141 km² Basin Area
                </span>
              </div>
            </div>
            <div className="text-right relative" ref={alertRef}>
              <div
                className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white px-4 py-3 rounded-xl cursor-pointer hover:from-red-600 hover:via-red-700 hover:to-red-800 transition-all duration-300 transform hover:scale-110 shadow-xl pulse-glow border border-red-400 mb-3"
                onClick={() => setShowAlertDetails(!showAlertDetails)}
                title="Click to view high priority alert details"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex flex-col">
                    <div className="text-2xl font-bold leading-none">{alertsCount}</div>
                    <div className="text-xs font-semibold opacity-90">CRITICAL ALERTS</div>
                  </div>
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              {showAlertDetails && (
                <div
                  className="fixed top-4 right-4 w-96 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 max-h-[80vh] overflow-y-auto flex flex-col"
                  style={{ zIndex: 99999 }}
                >
                  <div className="popup flex flex-col" style={{ maxHeight: '80vh' }}>
                    <div className="p-4 border-b bg-gradient-to-r from-red-50 via-pink-50 to-red-50 rounded-t-2xl">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-bold text-red-800">🚨 Critical Alerts ({alertsCount})</h3>
                          <p className="text-sm text-red-600">High priority water quality issues</p>
                        </div>
                        <button
                          onClick={() => setShowAlertDetails(false)}
                          className="text-red-500 hover:text-red-700 text-2xl font-bold transition-colors hover:bg-red-100 rounded-full w-8 h-8 flex items-center justify-center"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    <div className="p-4 space-y-3 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 150px)' }}>
                      {alertDetails.length > 0 ? (
                        alertDetails.map((alert, index) => (
                          <div key={index} className={`p-4 rounded-xl border-2 ${getSeverityColor(alert.severity)} hover:shadow-lg transition-all duration-300 transform hover:scale-102`}>
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-bold text-sm">{alert.type}</span>
                              <span className={`text-xs px-3 py-1 rounded-full font-bold shadow-sm ${
                                alert.severity === 'Critical' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' :
                                alert.severity === 'High' ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' :
                                'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white'
                              }`}>
                                {alert.severity}
                              </span>
                            </div>
                            <p className="text-sm mb-2 font-medium">{alert.message}</p>
                            {alert.location && <p className="text-xs text-gray-600 mb-1">📍 {alert.location}</p>}
                            {alert.value && alert.threshold && (
                              <div className="text-xs bg-gray-100 rounded-lg p-2 mt-2">
                                <span className="font-semibold">Current: {alert.value}</span> | <span className="font-semibold">Threshold: {alert.threshold}</span>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-gray-500 py-8 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                          <div className="text-4xl mb-2">✅</div>
                          <p className="font-semibold">No Critical Alerts</p>
                          <p className="text-sm">All parameters within acceptable limits</p>
                        </div>
                      )}
                    </div>
                    <div className="p-3 border-t bg-gradient-to-r from-gray-50 to-blue-50 text-center rounded-b-2xl">
                      <p className="text-xs text-gray-600 font-medium">
                        Last updated: {new Date().toLocaleTimeString()} | Based on CPCB standards
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="text-blue-100 text-sm">Last Updated: {new Date().toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>
      {/* Statistics Details Popup */}
      {showStatDetails && selectedStat && (
        <div
          ref={statRef}
          className="fixed top-4 left-4 right-4 max-w-4xl mx-auto bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 max-h-[85vh] overflow-hidden"
          style={{ zIndex: 99998 }}
        >
          <div className="p-6 border-b bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-50 rounded-t-2xl">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-blue-800">
                  {statisticsDetailData[selectedStat as keyof typeof statisticsDetailData]?.title}
                </h3>
                <p className="text-blue-600 mt-1">
                  {statisticsDetailData[selectedStat as keyof typeof statisticsDetailData]?.subtitle}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowStatDetails(false);
                  setSelectedStat(null);
                }}
                className="text-blue-500 hover:text-blue-700 text-3xl font-bold transition-colors hover:bg-blue-100 rounded-full w-10 h-10 flex items-center justify-center"
              >
                ×
              </button>
            </div>
          </div>
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {statisticsDetailData[selectedStat as keyof typeof statisticsDetailData]?.data.map((item: any, index: number) => (
                <div key={index} className="p-4 rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 transform hover:scale-102 bg-gradient-to-br from-white to-blue-50">
                  {selectedStat === 'riverLength' && (
                    <>
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-bold text-gray-800">{item.segment}</h4>
                        <span className="text-lg font-bold text-blue-600">{item.length}</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Condition:</span>
                          <span className={`font-semibold ${
                            item.condition === 'Good' ? 'text-green-600' :
                            item.condition === 'Moderate' ? 'text-yellow-600' :
                            item.condition === 'Poor' ? 'text-red-600' :
                            'text-gray-600'
                          }`}>{item.condition}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tributaries:</span>
                          <span className="font-semibold text-gray-700">{item.tributaries}</span>
                        </div>
                      </div>
                    </>
                  )}
                  {selectedStat === 'districts' && (
                    <>
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-bold text-gray-800">{item.district}</h4>
                        <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                          item.status.includes('Critical') ? 'bg-red-100 text-red-800' :
                          item.status.includes('High') ? 'bg-orange-100 text-orange-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>{item.status}</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Population:</span>
                          <span className="font-semibold text-gray-700">{item.population}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>River Length:</span>
                          <span className="font-semibold text-blue-600">{item.riverLength}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Monitoring Stations:</span>
                          <span className="font-semibold text-green-600">{item.stations}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Industries:</span>
                          <span className="font-semibold text-red-600">{item.industries}</span>
                        </div>
                        <div className="mt-3 p-2 bg-gray-100 rounded text-xs">
                          <strong>Key Issues:</strong> {item.keyIssues}
                        </div>
                      </div>
                    </>
                  )}
                  {selectedStat === 'monitoringStations' && (
                    <>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-gray-800 text-sm">{item.name}</h4>
                          <p className="text-xs text-gray-600">{item.id} • {item.district}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                          item.status === 'Active' ? 'bg-green-100 text-green-800' :
                          item.status === 'Alert' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>{item.status}</span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span>Parameters:</span>
                          <span className="font-semibold text-blue-600">{item.parameters}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Water Quality:</span>
                          <span className={`font-semibold ${
                            item.condition === 'Excellent' ? 'text-emerald-600' :
                            item.condition === 'Good' ? 'text-green-600' :
                            item.condition === 'Moderate' ? 'text-yellow-600' :
                            item.condition === 'Poor' ? 'text-red-600' :
                            'text-gray-600'
                          }`}>{item.condition}</span>
                        </div>
                      </div>
                    </>
                  )}
                  {selectedStat === 'basinArea' && (
                    <>
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-bold text-gray-800">{item.category}</h4>
                        <span className="text-lg font-bold text-blue-600">{item.percentage}</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Area:</span>
                          <span className="font-semibold text-gray-700">{item.area}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Population:</span>
                          <span className="font-semibold text-gray-700">{item.population}</span>
                        </div>
                        <div className="mt-3 p-2 bg-gray-100 rounded text-xs">
                          <strong>Impact:</strong> {item.impact}
                        </div>
                      </div>
                      <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-1000"
                          style={{ width: item.percentage }}
                        ></div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 border-t bg-gradient-to-r from-gray-50 to-blue-50 rounded-b-2xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {Object.entries(statisticsDetailData[selectedStat as keyof typeof statisticsDetailData]?.summary || {}).map(([key, value]) => (
                <div key={key} className="text-center p-3 bg-white/70 rounded-lg">
                  <div className="font-bold text-gray-800 capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                  <div className="text-blue-600 font-semibold">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Map and Carousel Section */}
      {showMap && (
        <div className="space-y-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-6 items-stretch">
            {/* Left Side - Image Carousel */}
            <div className="w-full lg:w-1/2 animate-fadeIn">
              <ImageCarousel />
            </div>
            {/* Right Side - Map Section */}
            <div ref={mapRef} className="w-full lg:w-1/2 animate-fadeIn" id="map-container">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4 flex justify-between items-center varuna-map-controls">
                  <div>
                    <h2 className="text-xl font-bold">🌊 Varuna River Network Map</h2>
                  </div>
                </div>
                <div className="h-[600px] relative overflow-hidden">
                  <VarunaMap
                    sidebarCollapsed={sidebarCollapsed}
                    showNotification={showNotification}
                    selectedFilter={selectedFilter} // Sync with dashboard filters
                  />
                </div>
                <div className="p-3 bg-gray-50 border-t text-center">
                  <p className="text-xs text-gray-600">
                    🗺️ Use controls to explore rivers and water quality data
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white/20">
            <div className="flex flex-wrap justify-center gap-4">
              <TabButton id="overview" label="📊 Overview" isActive={activeTab === 'overview'} onClick={setActiveTab} />
              <TabButton id="water-quality" label="💧 Water Quality" isActive={activeTab === 'water-quality'} onClick={setActiveTab} />
              <TabButton id="pollution-sources" label="🏭 Pollution Sources" isActive={activeTab === 'pollution-sources'} onClick={setActiveTab} />
              <TabButton id="predictions" label="🔮 Predictions" isActive={activeTab === 'predictions'} onClick={setActiveTab} />
              <TabButton id="interventions" label="⚡ Interventions" isActive={activeTab === 'interventions'} onClick={setActiveTab} />
              <TabButton id="system-dynamics" label="🔄 System Dynamics" isActive={activeTab === 'system-dynamics'} onClick={setActiveTab} />
              <TabButton
                id="change-detection"
                label="🛰️ Change Detection"
                isActive={activeTab === 'change-detection'}
                onClick={(id: string) => {
                  if (id === 'change-detection') {
                    window.open('https://dssiitbhu.users.earthengine.app/view/changedetection', '_blank');
                    setActiveTab(id);
                  } else {
                    setActiveTab(id);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {/* Key Metrics */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 col-span-full border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                🎯 Key Performance Indicators
              </h2>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                <span className="text-sm font-medium text-gray-600">Live Data</span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              <div className="group p-6 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl border border-red-200 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="text-3xl font-bold text-red-600 mb-2"><AnimatedCounter value={acidicCount} /></div>
                <div className="text-sm font-semibold text-red-800 mb-1">Acidic pH Sites</div>
                <div className="text-xs text-gray-600">pH &lt; 6.5 • {drainData.find(d => d.ph < 6.5)?.location || '—'}</div>
                <div className="mt-3 w-full bg-red-200 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(acidicCount / drainData.length) * 100 || 0}%` }}></div>
                </div>
              </div>
              <div className="group p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="text-3xl font-bold text-blue-600 mb-2"><AnimatedCounter value={lowDOCount} /></div>
                <div className="text-sm font-semibold text-orange-800 mb-1">Low DO Sites</div>
                <div className="text-xs text-gray-600">DO &lt; 4 mg/L • {drainData.find(d => d.do_mg_l < 4)?.location || '—'}</div>
                <div className="mt-3 w-full bg-blue-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(lowDOCount / drainData.length) * 100 || 0}%` }}></div>
                </div>
              </div>
              <div className="group p-6 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-200 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="text-3xl font-bold text-emerald-600 mb-2"><AnimatedCounter value={highBODCount} /></div>
                <div className="text-sm font-semibold text-rose-800 mb-1">High BOD Sites</div>
                <div className="text-xs text-gray-600">BOD &gt; 10 mg/L • {drainData.find(d => d.bod_mg_l > 10)?.location || '—'}</div>
                <div className="mt-3 w-full bg-emerald-200 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${(highBODCount / drainData.length) * 100 || 0}%` }}></div>
                </div>
              </div>
              <div className="group p-6 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-200 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="text-3xl font-bold text-purple-600 mb-2"><AnimatedCounter value={highCODCount} /></div>
                <div className="text-sm font-semibold text-purple-800 mb-1">High COD Sites</div>
                <div className="text-xs text-gray-600">COD &gt; 100 mg/L • {drainData.find(d => d.cod > 100)?.location || '—'}</div>
                <div className="mt-3 w-full bg-purple-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${(highCODCount / drainData.length) * 100 || 0}%` }}></div>
                </div>
              </div>
              <div className="group p-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-200 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="text-3xl font-bold text-orange-600 mb-2"><AnimatedCounter value={867} /></div>
                <div className="text-sm font-semibold text-orange-800 mb-1">Small Industries</div>
                <div className="text-xs text-gray-600">Varanasi District</div>
                <div className="mt-3 w-full bg-orange-200 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
              <div className="group p-6 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl border border-yellow-200 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="text-3xl font-bold text-yellow-600 mb-2"><AnimatedCounter value={11} /></div>
                <div className="text-sm font-semibold text-yellow-800 mb-1">Untapped Drains</div>
                <div className="text-xs text-gray-600">Need Connection</div>
                <div className="mt-3 w-full bg-yellow-200 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '66.67%' }}></div>
                </div>
              </div>
            </div>
          </div>
          {/* Enhanced Quick Status */}
             {/* Real-time Calculated Indices */}
<div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20">
  <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
    🚨 Critical Status - Calculated Indices
  </h3>
  <div className="space-y-4">
    {(() => {
      const worstSites = getWorstSites();
     
      if (!worstSites) {
        return (
          <div className="text-center text-gray-500 py-8">
            <p>Loading data...</p>
          </div>
        );
      }
      return (
        <>
          {/* Pollution Load Index */}
          <div className="flex justify-between items-center p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-200 hover:shadow-lg transition-all duration-300">
            <div className="flex-1">
              <span className="font-semibold text-gray-800 block">{worstSites.pollution.location}</span>
              <span className="text-sm text-red-600 font-medium">
                Pollution Load Index: {worstSites.pollution.score}
              </span>
            </div>
            <span className={`text-white px-3 py-1 rounded-full text-sm font-bold ${
              worstSites.pollution.level === 'EXTREME' ? 'bg-gradient-to-r from-red-600 to-red-700 pulse-glow' :
              worstSites.pollution.level === 'HIGH' ? 'bg-gradient-to-r from-red-500 to-red-600 pulse-glow' :
              worstSites.pollution.level === 'MODERATE' ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
              'bg-gradient-to-r from-yellow-500 to-yellow-600'
            }`}>
              {worstSites.pollution.level} POLLUTION
            </span>
          </div>
          {/* Eutrophication Risk */}
          <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 hover:shadow-lg transition-all duration-300">
            <div className="flex-1">
              <span className="font-semibold text-gray-800 block">{worstSites.eutrophication.location}</span>
              <span className="text-sm text-green-600 font-medium">
                Eutrophication Risk: {worstSites.eutrophication.score}
              </span>
            </div>
            <span className={`text-white px-3 py-1 rounded-full text-sm font-bold ${
              worstSites.eutrophication.level === 'EXTREME' ? 'bg-gradient-to-r from-red-600 to-red-700 pulse-glow' :
              worstSites.eutrophication.level === 'HIGH' ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
              worstSites.eutrophication.level === 'MODERATE' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
              'bg-gradient-to-r from-green-500 to-green-600'
            }`}>
              {worstSites.eutrophication.level} EUTROPHICATION
            </span>
          </div>
          {/* Bacterial Contamination Level */}
          <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border border-purple-200 hover:shadow-lg transition-all duration-300">
            <div className="flex-1">
              <span className="font-semibold text-gray-800 block">{worstSites.bacterial.location}</span>
              <span className="text-sm text-purple-600 font-medium">
                Bacterial Level: {worstSites.bacterial.score}
                {worstSites.bacterial.level.includes('BOD-based') ? ' (estimated)' : ''}
              </span>
            </div>
            <span className={`text-white px-3 py-1 rounded-full text-sm font-bold ${
              worstSites.bacterial.level.includes('EXTREME') ? 'bg-gradient-to-r from-red-600 to-red-700 pulse-glow' :
              worstSites.bacterial.level.includes('HIGH') ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
              worstSites.bacterial.level.includes('MODERATE') ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
              'bg-gradient-to-r from-blue-500 to-blue-600'
            }`}>
              {worstSites.bacterial.level.split(' ')[0]} BACTERIAL
            </span>
          </div>
        </>
      );
    })()}
  </div>
  {/* Summary Statistics */}
  <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
    <div className="grid grid-cols-3 gap-4 text-center">
      <div>
        <div className="text-xl font-bold text-red-600">
          {(() => {
            const pollutionResults = drainData.map(calculatePollutionLoadIndex);
            return pollutionResults.filter(r => r.level === 'HIGH' || r.level === 'EXTREME').length;
          })()}
        </div>
        <div className="text-xs text-gray-600">High Pollution Sites</div>
      </div>
      <div>
        <div className="text-xl font-bold text-green-600">
          {(() => {
            const eutrophicationResults = drainData.map(calculateEutrophicationRisk);
            return eutrophicationResults.filter(r => r.level === 'HIGH' || r.level === 'EXTREME').length;
          })()}
        </div>
        <div className="text-xs text-gray-600">Eutrophication Risk</div>
      </div>
      <div>
        <div className="text-xl font-bold text-purple-600">
          {(() => {
            const bacterialResults = drainData.map(calculateBacterialContamination);
            return bacterialResults.filter(r => r.level.includes('HIGH') || r.level.includes('EXTREME')).length;
          })()}
        </div>
        <div className="text-xs text-gray-600">Bacterial Contamination</div>
      </div>
    </div>
  </div>
</div>
          {/* Enhanced District Comparison */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20">
            <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              📍 District-wise Impact
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={[
                { district: 'Prayagraj', pollution: 25, industries: 5 },
                { district: 'Bhadohi', pollution: 40, industries: 52 },
                { district: 'Varanasi', pollution: 85, industries: 923 }
              ]}>
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="district" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="pollution" fill="url(#colorGradient)" name="Pollution Level" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Enhanced Temporal Trend */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20">
            <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              📈 RAMESHWARA GHAT
            </h3>
              <p className="text-xs text-gray-600 -mt-3 mb-6">
                Based on quarterly progress report
              </p>
           
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={temporalData}>
                <defs>
                  <linearGradient id="bodGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area type="monotone" dataKey="BOD" stroke="#ef4444" strokeWidth={3} fill="url(#bodGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      {activeTab === 'water-quality' && (
        <div className="space-y-8">
          {/* Enhanced Parameter Selection */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                💧 Water Quality Analysis
              </h2>
              <div className="flex gap-4">
                <select
                  value={selectedParameter}
                  onChange={(e) => setSelectedParameter(e.target.value)}
                  className="border-2 border-gray-200 rounded-xl px-4 py-2 bg-white focus:ring-2 focus:ring-2 focus:blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="BOD">BOD (mg/l)</option>
                  <option value="COD">COD (mg/l)</option>
                  <option value="DO">DO (mg/l)</option>
                  <option value="pH">pH</option>
                  <option value="temp">Temperature (°C)</option>
                </select>
              </div>
            </div>
            {/* Enhanced Temporal Chart */}
           
         
            <div className="mb-8">
              <h3 className="font-semibold mb-4 text-lg">Temporal Variation - {selectedParameter}</h3>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={processedData}>
                  <defs>
                    <linearGradient id="parameterGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="label"
                     tick={false}
                  />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey={selectedParameter}
                    stroke="#2563eb"
                    strokeWidth={3}
                    fill="url(#parameterGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Enhanced Station-wise Comparison */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20">
            <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              📍 Station-wise Water Quality Status
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left p-4 font-semibold">Station</th>
                    <th className="text-left p-4 font-semibold">District</th>
                    <th className="text-left p-4 font-semibold">DO (mg/l)</th>
                    <th className="text-left p-4 font-semibold">BOD (mg/l)</th>
                    <th className="text-left p-4 font-semibold">COD (mg/l)</th>
                    <th className="text-left p-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {spatialData.map((station, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 transition-all duration-300">
                      <td className="p-4 font-medium">{station.station}</td>
                      <td className="p-4">{station.district}</td>
                      <td className="p-4 font-semibold">{station.DO}</td>
                      <td className="p-4 font-semibold">{station.BOD}</td>
                      <td className="p-4 font-semibold">{station.COD}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(station.status)}`}>
                          {station.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* NEW: Drain Water Quality Stations */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
            <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              🚰 DRAIN WATER QUALITY STATIONS
            </h3>
             {/* Dropdown Filter */}
            <div className="text-sm">
             
              <select
                value={selectedFilter || ''}
                onChange={(e) =>
                  setSelectedFilter(e.target.value !== '' ? e.target.value : null)
                }
                className="appearance-none border border-blue-300 rounded-md px-3 py-2 bg-white hover:shadow-md hover:border-blue-400 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400 pr-8 transition-all duration-200"
              >
                <option value="">All Sites</option>
                <option value="acidic"> Acidic pH Sites</option>
                <option value="lowDO"> Low DO Sites</option>
                <option value="highBOD"> High BOD Sites</option>
                <option value="highCOD"> High COD Sites</option>
                <option value="coliform"> Coliform Positive</option>
              </select>
               {/* ✅ Show Map Button */}
              <button
                onClick={() => {
                setShowMarkers(true); // ✅ Show markers on map
                setTimeout(() => {
                  const mapElement = document.getElementById("leaflet-map");
                  if (mapElement) {
                    const offset = -120; // ⬅️ scroll 120px above
                    const top = mapElement.getBoundingClientRect().top + window.scrollY + offset;
                    window.scrollTo({ top, behavior: "smooth" });
                  }
                }, 100); // wait slightly to ensure map renders
              }}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg shadow transition duration-200"
              >
                Show Map
              </button>
               <button
                  onClick={() => {
                  setShowMarkers(false); // ✅ trigger hiding
                 }}
                 className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg shadow transition duration-200"
                >
                  Hide
               </button>
            </div>
          </div>
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700 font-medium">
                📊 Showing {filteredDrainData.length} drain monitoring locations
                <span className="ml-2 text-xs bg-blue-100 px-2 py-1 rounded-full">
                  Temp Range: 24.4°C - 35.8°C
                </span>
              </p>
            </div>
           
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
                    <th className="text-left p-3 font-semibold min-w-[200px]">Location</th>
                    <th className="text-left p-3 font-semibold">Stream</th>
                    <th className="text-left p-3 font-semibold">pH</th>
                    <th className="text-left p-3 font-semibold">Temp</th>
                    <th className="text-left p-3 font-semibold">EC (μS/cm)</th>
                    <th className="text-left p-3 font-semibold">TDS (ppm)</th>
                    <th className="text-left p-3 font-semibold">DO (mg/L)</th>
                    <th className="text-left p-3 font-semibold">Turbidity</th>
                    <th className="text-left p-3 font-semibold">TSS (mg/L)</th>
                    <th className="text-left p-3 font-semibold">COD</th>
                    <th className="text-left p-3 font-semibold">BOD (mg/L)</th>
                    <th className="text-left p-3 font-semibold">TS (mg/L)</th>
                    <th className="text-left p-3 font-semibold">Chloride</th>
                    <th className="text-left p-3 font-semibold">Nitrate</th>
                    <th className="text-left p-3 font-semibold">Faecal Col</th>
                    <th className="text-left p-3 font-semibold">Total Col</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDrainData.map((drain, index) => (
  <tr
    key={index}
    className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-300"
  >
    {/* 1 ─ Location */}
    <td className="p-3 font-medium text-gray-800">{drain.location}</td>
    <td className="p-3 font-medium text-gray-800">{drain.stream}</td>
    {/* 2 ─ pH */}
    <td className="p-3">
      <span
        className={`font-semibold ${
          drain.ph < 6.5 ? 'text-red-600'
          : drain.ph > 8.5 ? 'text-red-600'
          : 'text-green-600'
        }`}
      >
        {drain.ph}
      </span>
    </td>
    {/* 3 ─ Temperature */}
    <td className="p-3 font-semibold text-blue-600">
      {drain.temp}°C
    </td>
    {/* 4 ─ EC, TDS */}
    <td className="p-3">{drain.ec_us_cm}</td>
    <td className="p-3">{drain.tds_ppm}</td>
    {/* 5 ─ DO */}
    <td className="p-3">
      <span
        className={`font-semibold ${
          drain.do_mg_l < 4 ? 'text-red-600'
          : drain.do_mg_l < 6 ? 'text-yellow-600'
          : 'text-green-600'
        }`}
      >
        {drain.do_mg_l}
      </span>
    </td>
    {/* 6 ─ Turbidity, TSS */}
    <td className="p-3">{drain.turbidity}</td>
    <td className="p-3">{drain.tss_mg_l}</td>
    {/* 7 ─ COD */}
    <td className="p-3">
      <span
        className={`font-semibold ${
          drain.cod > 100 ? 'text-red-600'
          : drain.cod > 50 ? 'text-yellow-600'
          : 'text-green-600'
        }`}
      >
        {drain.cod}
      </span>
    </td>
    {/* 8 ─ BOD */}
    <td className="p-3">
      <span
        className={`font-semibold ${
          drain.bod_mg_l > 10 ? 'text-red-600'
          : drain.bod_mg_l > 6 ? 'text-yellow-600'
          : 'text-green-600'
        }`}
      >
        {drain.bod_mg_l}
      </span>
    </td>
    {/* 9 ─ TS, Chloride, Nitrate */}
    <td className="p-3">{drain.ts_mg_l}</td>
    <td className="p-3">{drain.chloride}</td>
    <td className="p-3">
      {typeof drain.nitrate === 'number' ? drain.nitrate : 'N/A'}
    </td>
    {/* 10 ─ Faecal / Total Coliform */}
    <td className="p-3">
      <span
        className={`text-xs ${
          drain.faecal_col && drain.faecal_col !== 'N/A'
            ? 'text-red-600 font-semibold bg-red-50 px-2 py-1 rounded'
            : 'text-gray-500'
        }`}
      >
        {drain.faecal_col ?? 'N/A'}
      </span>
    </td>
    <td className="p-3">
      <span
        className={`text-xs ${
          drain.total_col && drain.total_col !== 'N/A'
            ? 'text-red-600 font-semibold bg-red-50 px-2 py-1 rounded'
            : 'text-gray-500'
        }`}
      >
        {drain.total_col ?? 'N/A'}
      </span>
    </td>
  </tr>
))}
                </tbody>
              </table>
            </div>
           
            {/* Water Quality summary for Drains */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-lg p-4 hover:shadow-lg transition-all duration-300">
                <div className="text-2xl font-bold text-red-600">
                  {drainData.filter(d => d.ph < 6.5).length}
                </div>
                <div className="text-sm font-semibold text-red-800">Acidic pH Sites</div>
                <div className="text-xs text-red-600">pH &lt; 6.5</div>
              </div>
             
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4 hover:shadow-lg transition-all duration-300">
                <div className="text-2xl font-bold text-orange-600">
                  {drainData.filter(d => d.do_mg_l < 4).length}
                </div>
                <div className="text-sm font-semibold text-orange-800">Low DO Sites</div>
                <div className="text-xs text-orange-600">DO &lt; 4 mg/L</div>
              </div>
             
              <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-lg p-4 hover:shadow-lg transition-all duration-300">
                <div className="text-2xl font-bold text-red-600">
                  {drainData.filter(d => d.bod_mg_l > 10).length}
                </div>
                <div className="text-sm font-semibold text-red-800">High BOD Sites</div>
                <div className="text-xs text-red-600">BOD &gt; 10 mg/L</div>
              </div>
             
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-lg p-4 hover:shadow-lg transition-all duration-300">
                <div className="text-2xl font-bold text-purple-600">
                  {drainData.filter(d => d.cod > 100).length}
                </div>
                <div className="text-sm font-semibold text-purple-800">High COD Sites</div>
                <div className="text-xs text-purple-600">COD &gt; 100 mg/L</div>
              </div>
             
              <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-lg p-4 hover:shadow-lg transition-all duration-300">
                <div className="text-2xl font-bold text-red-600">
                  {drainData.filter(d => d.faecal_col && d.faecal_col !== 'N/A' && d.faecal_col.trim() !== '').length}
                </div>
                <div className="text-sm font-semibold text-red-800">Coliform Positive</div>
                <div className="text-xs text-red-600">Bacterial Contamination</div>
              </div>
            </div>
          </div>
        </div>
      )}
       
     
      {activeTab === 'pollution-sources' && (
        <div className="space-y-8">
          {/* Enhanced Industrial Sources */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              🏭 Industrial Pollution Sources
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Enhanced Industry Breakdown */}
              <div>
                <h3 className="font-semibold mb-4 text-lg">Industry Distribution</h3>
                <div className="space-y-4">
                  {industrialData.map((industry, index) => (
                    <div key={index} className="group flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 transform hover:scale-102">
                      <div>
                        <div className="font-semibold text-gray-800">{industry.type}</div>
                        <div className="text-sm text-gray-600">{industry.location}</div>
                        {industry.discharge && (
                          <div className="text-sm text-red-600 font-medium">Discharge: {industry.discharge}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">{industry.count}</div>
                        <div className={`text-xs px-3 py-1 rounded-full font-bold ${
                          industry.status.includes('Critical') ? 'bg-red-100 text-red-800' :
                          industry.status.includes('High') ? 'bg-orange-100 text-orange-800' :
                          industry.status.includes('Medium') ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {industry.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
             
              {/* Enhanced Pie Chart */}
              <div>
                <h3 className="font-semibold mb-4 text-lg">Industry Type Distribution</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={industrialData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {industrialData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={50}
                       content={({payload}) => {
                      
                       return (
                       <ul style={{ fontSize: '12px', listStyleType: 'none', padding: 0 }}>
                       {payload?.map((entry, index) => {
                       const item = entry.payload as any; // ✅ Now 'item' is your original data object
                       return (
                       <li key={`item-${index}`} style={{ color: entry.color }}>
                       {`${item.type}: ${item.count}`}
                       </li>
                      );
                    })}
                  </ul>
                      );
                    }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        
          {/* Enhanced Drain Management */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 pb-12 border border-white/20">
            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              🚰 Potential Pollution Sources
            </h2>
           
               {/* ✅ Pollution Cards Section */}
               <div>
                 
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                      {[
             {
            title: "Organic Pollution",
            image: "https://dialogue.earth/content/uploads/2015/12/India-Ganga-pollution-scaled.jpg",
            icon: "🧪",
            value: (
             <>
             Safe Limit: BOD ≤ 3.00 mg/L<br />
             (Highest Observed: {worstBOD.value} mg/L at {worstBOD.location})
             </>
            ),
            description: "High organic load, likely from untreated sewage discharge. It promotes microbial growth, reduces dissolved oxygen, harms aquatic organisms, and contributes to water eutrophication.",
            bgColor: "from-green-100 to-white",
          },
          {
            title: "Pathogen Risk",
            icon: "🦠",
            image:"https://t4.ftcdn.net/jpg/08/42/76/07/360_F_842760775_8ccQDE8g6eKeuVy2jHffnZxU13MZrpEG.jpg",
           value: (
           <>
             Safe Limit: Faecal Coliform ≤ 500 MPN/100mL <br />
            (Highest Observed: {worstFaecalColiform.value} MPN at {worstFaecalColiform.location})
           </>
          ),
            description: "High levels of faecal contamination from untreated sewage pose serious health hazards and risk of waterborne diseases.",
            bgColor: "from-red-100 to-white",
          },
          {
            title: "Chemical Pollution",
            icon: "⚗️",
            image:"https://static.vecteezy.com/system/resources/thumbnails/057/512/892/small_2x/close-up-of-a-barrel-with-green-leaking-toxic-waste-standing-in-nature-photo.jpg",
            value: (
            <>
              Safe Limit: COD ≤ 30 mg/L, TSS ≤ 100 mg/L <br />
              (Highest Observed: COD = {worstChemicalRisk.cod} mg/L, TSS = {worstChemicalRisk.tss} mg/L at {worstChemicalRisk.location})
            </>
           ),
            description: "Chemical substances and solids — Presence of chemical residues like fertilizers, oils, or solvents alters water chemistry, harms aquatic life, and degrades water usability.",
            bgColor: "from-yellow-100 to-white",
          },
          {
            title: "Turbidity",
            image:"https://ecoreportcard.org/site/assets/files/2218/chesterville_branch_turbidity.700x0.jpg",
            icon: "🌫️",
            value: (
            <>
              Safe Limit: Turbidity ≤ 25 NTU<br />
              (Highest Observed: {worstTurbidity.value} NTU at {worstTurbidity.location})
            </>
           ),
            description: "High turbidity indicates the presence of suspended solids such as silt, clay, organic matter, and microorganisms. It reduces light penetration, disrupts photosynthesis in aquatic plants.",
            bgColor: "from-gray-100 to-white",
          },
          {
            title: "Salinity / Conductivity",
            image:"https://www.waterquality.gov.au/sites/default/files/images/salt.jpg",
            icon: "🧂",
            value: (
            <>
              Safe Limit: TDS = 500–1000 ppm, EC ≤ 1000 µS/cm<br />
              (Highest Observed: TDS = {worstSalinity.tds} ppm, EC = {worstSalinity.ec} µS/cm at {worstSalinity.location})
            </>
           ),
            description: "High TDS and EC suggest excess salts and ions, often from sewage or runoff, affecting water quality and aquatic life.",
            bgColor: "from-blue-100 to-white",
          },
           {
          title: "Nitrates from Agriculture & Sewage",
          icon: "🌾",
          image: "https://nexteel.in/wp-content/uploads/2025/04/Nitrate-Pollution-in-water-1024x576.jpg",
          value: (
          <>
            Safe Limit: Nitrate ≤ 2.00 mg/L<br />
            (Highest Observed: {worstNitrate.value} mg/L at {worstNitrate.location})
          </>
          ),
          description: "Presence of nitrates from fertilizers and waste promotes excessive algae growth and harms aquatic ecosystems.",
          bgColor: "from-lime-100 to-white",
        },
        {
          title: "Algae Growth",
          icon: "🌿",
          image: " https://assets.telegraphindia.com/telegraph/5jamriver2.jpg",
          value: (
          <>
            Safe Limit: Nitrate ≤ 2.00 mg/L & BOD ≤ 5.00 mg/L<br />
            (Highest Observed: Nitrate = {worstAlgaeRisk.nitrate} mg/L, BOD = {worstAlgaeRisk.bod} mg/L at {worstAlgaeRisk.location})
          </>
          ),
          description: "Triggered by excess nutrients like nitrates and phosphates — leads to oxygen depletion and aquatic death.",
          bgColor: "from-emerald-100 to-white",
        },
        {
          title: "Industrial Contaminants",
          icon: "🧪",
          image:"https://images.assettype.com/english-sentinelassam/import/wp-content/uploads/2019/01/industrial-wastewater.jpg",
          value: (
           <>
            Safe Limit: COD ≤ 30 mg/L, TDS ≤ 1000 ppm<br />
            (Highest Observed: COD = {worstIndustrial.cod} mg/L, TDS = {worstIndustrial.tds} ppm at {worstIndustrial.location})
          </>
          ),
          description: "Toxic discharge from industries — bioaccumulates in fish and poses long-term health risks.",
          bgColor: "from-indigo-100 to-white",
        },
        {
          title: "Phosphates & Detergents",
          icon: "🧼",
          image:"https://asset.library.wisc.edu/1711.dl/ER5CSR223WOWA8F/M/h1380-2ce93.jpg",
          value: (
          <>
            Safe Limit: BOD ≤ 5 mg/L, COD ≤ 30 mg/L<br />
            (Highest Observed: BOD = {worstDetergentRisk.bod} mg/L, COD = {worstDetergentRisk.cod} mg/L at {worstDetergentRisk.location})
          </>
          ),
          description: "Elevated COD and BOD suggest greywater discharge with detergents and phosphates, promoting algal growth and eutrophication.",
          bgColor: "from-purple-100 to-white",
        },
        {
          title: "Land Use & Waste Dumping",
          icon: "🗑️",
          image:"https://dialogue.earth/content/uploads/2021/12/2CMW2JH-1-scaled.jpg",
          value: (
          <>
            Safe Limit: TSS ≤ 100 mg/L, Turbidity ≤ 25 NTU, TS ≤ 500 mg/L <br />
            (Highest Observed: TSS = {worstLandDumping.tss} mg/L, Turbidity = {worstLandDumping.turbidity} NTU, TS = {worstLandDumping.ts} mg/L at {worstLandDumping.location})
          </>
          ),
          description: "High turbidity and suspended solids suggest runoff and solid waste dumping, degrading river clarity and quality.",
          bgColor: "from-rose-100 to-white",
        },
            ].map((item, index) => (
            <div
              key={index}
              className={`w-[255px] h-[425px] flex flex-col justify-between rounded-2xl px-5 py-5 bg-gradient-to-br ${item.bgColor} shadow-md border border-gray-200 transform hover:scale-105 hover:shadow-2xl transition-transform duration-300 ease-in-out`}
            >
               {/* Top Half - Image or Icon */}
          {item.image ? (
            <div className="-mx-5 -mt-5">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-[140px] object-cover rounded-t-2xl"
               
              />
            </div>
          ) : (
            <div className="h-[120px] w-full flex justify-center items-center">
              <div className="text-4xl">{item.icon}</div>
            </div>
          )}
              <div className="px-5 py-4 flex flex-col justify-between h-full">
              <h4 className="text-lg font-bold text-gray-800">{item.title}</h4>
              <p className="text-sm text-red-600 font-semibold">{item.value}</p>
              <p className="text-xs text-gray-700 mt-2">{item.description}</p>
              </div>
            </div>
          ))}
                    </div>
                  </div>
               </div>
             </div>
         
       
      )}
      {activeTab === 'predictions' && (
        <div className="space-y-8">
          {/* Enhanced Prediction Dashboard */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              📊 Water Quality Trend Analysis
            </h2>
           
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Enhanced Forecast Chart */}
              <div>
                <h3 className="font-semibold mb-4 text-lg">BOD Forecast (Next 6 Months)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={[
                    ...temporalData.slice(-3),
                    { month: 'Jul-10', BOD: 65, forecast: true },
                    { month: 'Aug-10', BOD: 72, forecast: true },
                    { month: 'Sep-10', BOD: 58, forecast: true },
                    { month: 'Oct-10', BOD: 52, forecast: true },
                    { month: 'Nov-10', BOD: 45, forecast: true },
                    { month: 'Dec-10', BOD: 48, forecast: true }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="BOD"
                      stroke="#2563eb"
                      strokeWidth={3}
                      strokeDasharray="5 5"
                      dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
             
              {/* Enhanced Prediction Summary */}
              <div>
                <h3 className="font-semibold mb-4 text-lg">Prediction Summary</h3>
                <div className="space-y-4">
                  {predictionData.map((pred, index) => (
                    <div key={index} className="bg-gradient-to-r from-gray-50 to-blue-50 p-5 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-semibold text-gray-800">{pred.timeframe}</span>
                        <span className="text-2xl font-bold text-blue-600">{pred.BOD_forecast} mg/l</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Confidence: <span className="font-bold text-green-600">{pred.confidence}%</span></span>
                        <span>Trend: <span className="font-medium">{pred.trend}</span></span>
                      </div>
                      <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${pred.confidence}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Enhanced Scenario Analysis */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              📊 Scenario Analysis
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 rounded-xl p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <h3 className="font-bold text-red-800 mb-3 text-lg">Worst Case Scenario</h3>
                <p className="text-sm text-red-700 mb-4">No interventions implemented</p>
                <div className="text-4xl font-bold text-red-600 mb-2">
                  <AnimatedCounter value={95} /> mg/l
                </div>
                <div className="text-sm text-red-600 font-medium">BOD by Dec 2025</div>
              </div>
             
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-xl p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <h3 className="font-bold text-yellow-800 mb-3 text-lg">Current Trajectory</h3>
                <p className="text-sm text-yellow-700 mb-4">Limited interventions</p>
                <div className="text-4xl font-bold text-yellow-600 mb-2">
                  <AnimatedCounter value={72} /> mg/l
                </div>
                <div className="text-sm text-yellow-600 font-medium">BOD by Dec 2025</div>
              </div>
             
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <h3 className="font-bold text-green-800 mb-3 text-lg">Best Case Scenario</h3>
                <p className="text-sm text-green-700 mb-4">All interventions successful</p>
                <div className="text-4xl font-bold text-green-600 mb-2">
                  <AnimatedCounter value={35} /> mg/l
                </div>
                <div className="text-sm text-green-600 font-medium">BOD by Dec 2025</div>
              </div>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'interventions' && (
        <div className="space-y-8">
          {/* Enhanced Cost-Benefit Analysis */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              ⚡ Intervention Cost-Benefit Analysis
            </h2>
           
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Enhanced ROI Chart */}
              <div>
                <h3 className="font-semibold mb-4 text-lg">Return on Investment (ROI)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={interventionData}>
                    <defs>
                      <linearGradient id="roiGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.4}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="intervention" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar dataKey="roi" fill="url(#roiGradient)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Enhanced Impact vs Cost */}
              <div>
                <h3 className="font-semibold mb-4 text-lg">Impact vs Cost Analysis</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={interventionData}>
                    <defs>
                      <linearGradient id="impactGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      </linearGradient>
                      <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#f87171" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="intervention" hide />
                    <YAxis />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Area type="monotone" dataKey="impact" stackId="1" stroke="#2563eb" fill="url(#impactGradient)" />
                    <Area type="monotone" dataKey="cost" stackId="2" stroke="#ef4444" fill="url(#costGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          {/* Enhanced Priority Matrix */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              🎯 Intervention Priority Matrix
            </h2>
            <div className="space-y-6">
              {interventionData.map((intervention, index) => (
                <div key={index} className="border-2 border-gray-200 rounded-xl p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-102 bg-gradient-to-r from-white to-blue-50">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">{intervention.intervention}</h3>
                      <div className="flex space-x-6 text-sm text-gray-600 mt-2">
                        <span>Cost: <span className="font-bold text-red-600">₹{intervention.cost} Cr</span></span>
                        <span>Impact: <span className="font-bold text-green-600">{intervention.impact}% BOD reduction</span></span>
                        <span>Timeline: <span className="font-bold text-blue-600">{intervention.timeline} days</span></span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">ROI: {intervention.roi}x</div>
                      <div className={`text-xs px-3 py-1 rounded-full font-bold ${
                        intervention.roi > 5 ? 'bg-green-100 text-green-800' :
                        intervention.roi > 2 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {intervention.roi > 5 ? 'High Priority' : intervention.roi > 2 ? 'Medium Priority' : 'Low Priority'}
                      </div>
                    </div>
                  </div>
                 
                  {/* Enhanced progress bar for visual impact */}
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${(intervention.impact / 30) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {activeTab === 'system-dynamics' && (
        <div className="space-y-8">
          {/* Enhanced Mental Map Visualization */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              🔄 System Dynamics Models
            </h2>
           
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Enhanced Feedback Loops */}
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
                <h3 className="font-bold mb-4 text-lg">🔁 Key Feedback Loops Identified</h3>
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-lg p-4 hover:shadow-lg transition-all duration-300">
                    <h4 className="font-semibold text-red-800 mb-2">Reinforcing Loop: Encroachment ↔ Water Availability</h4>
                    <p className="text-sm text-red-700">
                      Reduced water availability → More encroachment → Further capacity reduction →
                      Even less water availability
                    </p>
                  </div>
                 
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-lg p-4 hover:shadow-lg transition-all duration-300">
                    <h4 className="font-semibold text-blue-800 mb-2">Balancing Loop: Water Quality ↔ Extraction</h4>
                    <p className="text-sm text-blue-700">
                      Poor quality → Limited extraction → Less pressure → Potential for improvement
                    </p>
                  </div>
                 
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4 hover:shadow-lg transition-all duration-300">
                    <h4 className="font-semibold text-green-800 mb-2">Tourism-Pollution Loop</h4>
                    <p className="text-sm text-green-700">
                      Tourism growth → Industrial demand → Pollution increase → Tourism impact
                    </p>
                  </div>
                </div>
              </div>
              {/* Enhanced System Components */}
              <div className="bg-gradient-to-br from-gray-50 to-green-50 rounded-xl p-6 border border-gray-200">
                <h3 className="font-bold mb-4 text-lg">🧩 System Components</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
                    <span className="text-sm font-medium">Surface Water</span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold">Stock</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
                    <span className="text-sm font-medium">Groundwater</span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold">Stock</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
                    <span className="text-sm font-medium">River Pollution</span>
                    <span className="text-xs bg-red-100 text-red-800 px-3 py-1 rounded-full font-bold">Stock</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
                    <span className="text-sm font-medium">Industrial Discharge</span>
                    <span className="text-xs bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-bold">Flow</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
                    <span className="text-sm font-medium">Agricultural Runoff</span>
                    <span className="text-xs bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-bold">Flow</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
                    <span className="text-sm font-medium">Treatment Capacity</span>
                    <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-bold">Flow</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Enhanced Policy Scenarios */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              🎛️ Policy Scenario Testing
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="border-2 border-gray-200 rounded-xl p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-white to-blue-50">
                <h3 className="font-bold mb-3 text-lg">Scenario A: Industrial Focus</h3>
                <p className="text-sm text-gray-600 mb-4">Prioritize industrial pollution control</p>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span>BOD Reduction:</span>
                    <span className="font-bold text-green-600 text-lg">40%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Timeline:</span>
                    <span className="font-semibold">2 years</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Investment:</span>
                    <span className="font-semibold">₹50 Cr</span>
                  </div>
                </div>
              </div>
             
              <div className="border-2 border-gray-200 rounded-xl p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-white to-green-50">
                <h3 className="font-bold mb-3 text-lg">Scenario B: Infrastructure Focus</h3>
                <p className="text-sm text-gray-600 mb-4">Prioritize sewage infrastructure</p>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span>BOD Reduction:</span>
                    <span className="font-bold text-green-600 text-lg">35%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Timeline:</span>
                    <span className="font-semibold">3 years</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Investment:</span>
                    <span className="font-semibold">₹80 Cr</span>
                  </div>
                </div>
              </div>
             
              <div className="border-2 border-gray-200 rounded-xl p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-white to-purple-50">
                <h3 className="font-bold mb-3 text-lg">Scenario C: Integrated Approach</h3>
                <p className="text-sm text-gray-600 mb-4">Balanced multi-sector intervention</p>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span>BOD Reduction:</span>
                    <span className="font-bold text-green-600 text-lg">60%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Timeline:</span>
                    <span className="font-semibold">4 years</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Investment:</span>
                    <span className="font-semibold">₹120 Cr</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Footer */}
      <div className="mt-12 text-center bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <p className="text-gray-600 font-medium">Varuna River Management System | IIT (BHU) Varanasi | Smart Laboratory on Clean River</p>
      </div>
    </div>
  );
}
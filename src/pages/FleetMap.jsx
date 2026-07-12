import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Truck, Shield, Filter, Search, RefreshCw, Navigation, 
  CloudRain, Wind, AlertTriangle, Layers, Maximize2, ZoomIn, ZoomOut,
  Map, Database, HelpCircle, Activity, Crosshair, MapIcon, X, Sun, Moon,
  Cpu, Thermometer, Battery, Signal, Eye, Bell, Wrench, CheckCircle,
  AlertOctagon, EyeOff, BarChart2, Info, ChevronRight, Play, FileText,
  Volume2, Compass, Heart, Share2, Compass as CompassIcon
} from 'lucide-react';
import { api } from '../api';

// Mock coordinates for major logistics hubs (Samsara Command Style)
const HUBS = [
  { id: 'LA', name: 'LA Logistics Hub', x: 100, y: 320, type: 'Distribution Center', capacity: 50, inside: 14, slots: 36, incoming: 4, outgoing: 2, delay: '12m' },
  { id: 'SF', name: 'Bay Area Terminal', x: 80, y: 200, type: 'Warehouse', capacity: 30, inside: 8, slots: 22, incoming: 2, outgoing: 1, delay: '5m' },
  { id: 'DA', name: 'Dallas Distribution', x: 420, y: 410, type: 'Distribution Center', capacity: 40, inside: 18, slots: 22, incoming: 6, outgoing: 3, delay: '24m' },
  { id: 'CH', name: 'Chicago Command Hub', x: 600, y: 160, type: 'Distribution Center', capacity: 60, inside: 25, slots: 35, incoming: 8, outgoing: 4, delay: '8m' },
  { id: 'NY', name: 'NY Gateway Depot', x: 820, y: 140, type: 'Customer Hub', capacity: 25, inside: 5, slots: 20, incoming: 3, outgoing: 1, delay: '4m' },
  { id: 'AT', name: 'Atlanta Gateway', x: 680, y: 340, type: 'Maintenance Shop', capacity: 15, inside: 6, slots: 9, incoming: 1, outgoing: 2, delay: '45m' },
  { id: 'MI', name: 'Miami Hub', x: 780, y: 480, type: 'Fuel Station', capacity: 20, inside: 4, slots: 16, incoming: 2, outgoing: 0, delay: '10m' }
];

// Highways / Interstate Road Network mapping
const HIGHWAY_LANES = [
  { id: 'I-5', name: 'I-5 Interstate North', path: 'M 100 320 Q 80 260 80 200' },
  { id: 'I-10', name: 'I-10 Corridor East', path: 'M 100 320 Q 260 370 420 410' },
  { id: 'I-20', name: 'I-20 Southern Transit', path: 'M 420 410 Q 550 380 680 340' },
  { id: 'I-80', name: 'I-80 Midwestern Corridor', path: 'M 600 160 Q 710 150 820 140' },
  { id: 'I-85', name: 'I-85 Atlantic Pipeline', path: 'M 680 340 Q 750 240 820 140' },
  { id: 'I-90', name: 'I-90 Great Lakes', path: 'M 80 200 Q 340 180 600 160' },
  { id: 'I-75', name: 'I-75 Florida Connector', path: 'M 680 340 Q 730 410 780 480' }
];

// Interactive Weather systems & radar zones
const WEATHER_RADARS = [
  { id: 'rad-1', name: 'Severe Storm Warning', x: 620, y: 220, r: 90, type: 'Storm', danger: 'Severe Rain & High Winds (65km/h)', suggestion: 'Route flatbeds away from Chicago bypass corridor.' },
  { id: 'rad-2', name: 'Fog Advisory', x: 260, y: 280, r: 70, type: 'Fog', danger: 'Visibility < 150m', suggestion: 'Enable active vehicle distance radar.' }
];

// Geofence border zones
const GEOFENCES = [
  { name: 'Terminal A restricted airfield', points: '90,180 140,160 160,220 110,240', color: 'rgba(239, 68, 68, 0.15)' },
  { name: 'LA Harbor industrial zone', points: '60,330 130,310 150,360 80,380', color: 'rgba(59, 130, 246, 0.15)' }
];

// Cubic Bezier interpolation logic for smooth curved roads
function getCurvedPoint(t, p0, p1, p2, p3) {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
    y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y
  };
}

// Curved coordinate definitions matching routes
const CURVE_CORRIDORS = {
  'LA-SF': { p0: { x: 100, y: 320 }, p1: { x: 90, y: 280 }, p2: { x: 80, y: 240 }, p3: { x: 80, y: 200 } },
  'LA-DA': { p0: { x: 100, y: 320 }, p1: { x: 200, y: 350 }, p2: { x: 310, y: 380 }, p3: { x: 420, y: 410 } },
  'DA-AT': { p0: { x: 420, y: 410 }, p1: { x: 500, y: 400 }, p2: { x: 590, y: 370 }, p3: { x: 680, y: 340 } },
  'CH-NY': { p0: { x: 600, y: 160 }, p1: { x: 670, y: 150 }, p2: { x: 740, y: 140 }, p3: { x: 820, y: 140 } },
  'AT-NY': { p0: { x: 680, y: 340 }, p1: { x: 730, y: 270 }, p2: { x: 780, y: 200 }, p3: { x: 820, y: 140 } },
  'SF-CH': { p0: { x: 80, y: 200 }, p1: { x: 250, y: 180 }, p2: { x: 420, y: 170 }, p3: { x: 600, y: 160 } },
  'AT-MI': { p0: { x: 680, y: 340 }, p1: { x: 710, y: 390 }, p2: { x: 740, y: 440 }, p3: { x: 780, y: 480 } }
};

export default function FleetMap({ user }) {
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Advanced Filter Settings
  const [filters, setFilters] = useState({
    type: 'ALL',
    status: 'ALL',
    region: 'ALL',
    weather: 'ALL',
    priority: 'ALL'
  });

  // Layer Visibility Toggles
  const [layers, setLayers] = useState({
    traffic: true,
    weather: true,
    hubs: true,
    routes: true,
    geofence: true,
    satellite: false,
    grid: true,
    clusters: false
  });

  // Interactive controls
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [hoveredMarker, setHoveredMarker] = useState(null);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState('AI'); // 'AI' | 'HUBS' | 'WEATHER' | 'GEOFENCES' | 'HEATMAP'
  
  // Geofence & Heatmap states
  const [drawnPoints, setDrawnPoints] = useState([]);
  const [newGeoName, setNewGeoName] = useState('');
  const [newGeoType, setNewGeoType] = useState('Restricted');
  const [customGeofences, setCustomGeofences] = useState([
    { id: 'geo-1', name: 'Terminal A restricted airfield', points: '90,180 140,160 160,220 110,240', color: 'rgba(239, 68, 68, 0.15)', active: true, type: 'Restricted' },
    { id: 'geo-2', name: 'LA Harbor industrial zone', points: '60,330 130,310 150,360 80,380', color: 'rgba(59, 130, 246, 0.15)', active: true, type: 'Terminal' }
  ]);
  const [heatmapMetric, setHeatmapMetric] = useState('TRAFFIC'); // 'TRAFFIC' | 'SPEED' | 'IDLE'
  const [mouseDownPos, setMouseDownPos] = useState({ x: 0, y: 0 });

  // Live status telemetry trackers
  const [syncTime, setSyncTime] = useState(new Date().toLocaleTimeString());
  const [apiLatency, setApiLatency] = useState(48);
  const [opsLog, setOpsLog] = useState([
    { id: 1, time: '15:42', type: 'Geofence Entry', msg: 'VAN-06 entered LA Harbor industrial zone.', level: 'info' },
    { id: 2, time: '15:40', type: 'Speed Alert', msg: 'TRK-12 exceeding limits (88 km/h) on I-10.', level: 'warning' },
    { id: 3, time: '15:35', type: 'Maintenance Started', msg: 'VAN-08 engine checkout started in Atlanta shop.', level: 'info' },
    { id: 4, time: '15:31', type: 'AI Recommendation', msg: 'Rerouting REE-03 via I-85 due to storm warning.', level: 'ai' }
  ]);

  // Real-time animation variables
  const [tick, setTick] = useState(0);
  const [toastAlerts, setToastAlerts] = useState([]);

  const mapRef = useRef(null);

  const fetchMapData = async () => {
    setLoading(true);
    try {
      const vRes = await api.getVehicles();
      const tRes = await api.getTrips();
      setVehicles(vRes);
      setTrips(tRes);
      setSyncTime(new Date().toLocaleTimeString());
      setApiLatency(Math.round(30 + Math.random() * 25));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Run periodic telemetry animation updates
  useEffect(() => {
    fetchMapData();
    const interval = setInterval(() => {
      setTick(prev => (prev + 0.005) % 1);
      setSyncTime(new Date().toLocaleTimeString());
      setApiLatency(Math.round(30 + Math.random() * 25));

      // Trigger random telemetry warnings occasionally
      if (Math.random() > 0.85) {
        triggerRandomAlert();
      }
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const triggerRandomAlert = () => {
    const alertTypes = [
      { type: 'Speed Alert', msg: 'TRK-12 exceeding limits on interstate highway.', level: 'warning' },
      { type: 'Geofence Entry', msg: 'VAN-06 arrived at distribution cargo bay.', level: 'info' },
      { type: 'AI Route Shift', msg: 'Rerouting target trailer around storm front.', level: 'ai' },
      { type: 'SOS Warning', msg: 'SOS: Low battery threshold on cargo transporter.', level: 'danger' }
    ];
    const picked = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    const time = new Date().toTimeString().slice(0, 5);
    const newLog = { id: Date.now(), time, ...picked };
    
    setOpsLog(prev => [newLog, ...prev.slice(0, 8)]);
    
    // Add floating toast
    setToastAlerts(prev => [...prev, { id: Date.now(), ...picked }]);
    setTimeout(() => {
      setToastAlerts(prev => prev.filter(t => t.id !== newLog.id));
    }, 4000);
  };

  // Autocomplete suggestions resolver
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const filtered = vehicles.filter(v => 
      v.registrationNumber.toLowerCase().includes(query.toLowerCase()) ||
      v.nameModel.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
    setSearchSuggestions(filtered);
    setShowSuggestions(true);
  };

  // Resolve dynamic live coordinates, heading angle, speed, and trailing coordinates
  const activeVehicles = vehicles.map((v, idx) => {
    let corridorKey = Object.keys(CURVE_CORRIDORS)[idx % Object.keys(CURVE_CORRIDORS).length];
    let corridor = CURVE_CORRIDORS[corridorKey];
    let progress = (tick + (idx * 0.18)) % 1;
    
    // Calculate live position on curved route
    let position = getCurvedPoint(progress, corridor.p0, corridor.p1, corridor.p2, corridor.p3);
    
    // Calculate heading angle based on differential progress step
    let nextPos = getCurvedPoint(Math.min(progress + 0.01, 1), corridor.p0, corridor.p1, corridor.p2, corridor.p3);
    let heading = Math.atan2(nextPos.y - position.y, nextPos.x - position.x) * (180 / Math.PI) + 90;

    let speed = v.status === 'On Trip' ? 68 + Math.round(Math.sin(tick * 10 + idx) * 12) : 0;
    let fuel = Math.max(10, 94 - Math.round((progress * 40) + (idx * 5)) % 80);
    let battery = Math.max(15, 88 - Math.round((progress * 30)) % 60);
    
    // Map status colors
    let status = v.status;
    if (v.status === 'On Trip') status = 'Moving';
    else if (idx === 3) status = 'Idle';
    else if (idx === 5) status = 'Emergency';

    return {
      ...v,
      status,
      speed,
      fuel,
      battery,
      heading,
      position,
      routeKey: corridorKey,
      cargo: idx % 2 === 0 ? 'Refrigerated Foodstuffs' : 'Industrial Components',
      weight: 1200 + (idx * 900) % 8000,
      riskScore: 12 + (idx * 14) % 60,
      signal: 95 - (idx * 10) % 40,
      lastSync: '1s ago'
    };
  });

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Moving': return { border: 'border-blue-500/30', bg: 'bg-blue-500/10', text: 'text-blue-400 animate-pulse', pulse: 'bg-blue-500' };
      case 'Idle': return { border: 'border-amber-500/30', bg: 'bg-amber-500/10', text: 'text-amber-400', pulse: 'bg-amber-500' };
      case 'Maintenance': return { border: 'border-orange-500/30', bg: 'bg-orange-500/10', text: 'text-orange-400', pulse: 'bg-orange-500' };
      case 'Emergency': return { border: 'border-red-500/50', bg: 'bg-red-500/20', text: 'text-red-400 animate-bounce', pulse: 'bg-red-500 animate-ping' };
      case 'Parked':
      default: return { border: 'border-slate-500/30', bg: 'bg-slate-500/10', text: 'text-slate-400', pulse: 'bg-slate-500' };
    }
  };

  // Filter application
  const filteredVehicles = activeVehicles.filter(v => {
    const matchesSearch = v.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.nameModel.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filters.type === 'ALL' || v.type === filters.type;
    const matchesStatus = filters.status === 'ALL' || v.status === filters.status;
    const matchesRegion = filters.region === 'ALL' || v.region === filters.region;
    return matchesSearch && matchesType && matchesStatus && matchesRegion;
  });

  // Map mouse drag and click geofence drawing controls
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    setMouseDownPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = (e) => {
    setIsDragging(false);
    if (rightPanelTab === 'GEOFENCES') {
      const dx = Math.abs(e.clientX - mouseDownPos.x);
      const dy = Math.abs(e.clientY - mouseDownPos.y);
      if (dx < 4 && dy < 4) {
        const rect = mapRef.current.getBoundingClientRect();
        const clickX = Math.round((e.clientX - rect.left - offset.x) / zoom);
        const clickY = Math.round((e.clientY - rect.top - offset.y) / zoom);
        if (drawnPoints.length < 8) {
          setDrawnPoints(prev => [...prev, { x: clickX, y: clickY }]);
        }
      }
    }
  };

  const handleSaveGeofence = () => {
    if (!newGeoName.trim() || drawnPoints.length < 3) return;
    const pointsStr = drawnPoints.map(p => `${p.x},${p.y}`).join(' ');
    const colors = {
      Restricted: 'rgba(239, 68, 68, 0.15)',
      Terminal: 'rgba(59, 130, 246, 0.15)',
      Warehouse: 'rgba(16, 185, 129, 0.15)',
      'Speed-Limit': 'rgba(245, 158, 11, 0.15)'
    };
    const newGeo = {
      id: `geo-${Date.now()}`,
      name: newGeoName,
      type: newGeoType,
      points: pointsStr,
      color: colors[newGeoType] || 'rgba(99, 102, 241, 0.15)',
      active: true
    };
    setCustomGeofences(prev => [...prev, newGeo]);
    setNewGeoName('');
    setDrawnPoints([]);
  };

  const handleDeleteGeofence = (id) => {
    setCustomGeofences(prev => prev.filter(g => g.id !== id));
  };

  const toggleGeofence = (id) => {
    setCustomGeofences(prev => prev.map(g => g.id === id ? { ...g, active: !g.active } : g));
  };

  const zoomIn = () => setZoom(z => Math.min(z + 0.25, 3));
  const zoomOut = () => setZoom(z => Math.max(z - 0.25, 0.5));
  const resetMap = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div className="space-y-6 text-slate-300 font-sans pb-12 overflow-hidden relative">
      
      {/* 1. TOP ENTERPRISE COMMAND HEADER STATUS BAR */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 p-4 rounded-2xl bg-[#0E1628]/85 border border-white/5 shadow-2xl backdrop-blur-xl z-20 relative">
        <div className="flex flex-col">
          <span className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Sync Status</span>
          <strong className="text-white text-xs flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Synchronized
          </strong>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] uppercase font-black text-slate-500 tracking-wider">GPS Signal Integrity</span>
          <strong className="text-emerald-400 text-xs mt-0.5">Nominal (99.8%)</strong>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] uppercase font-black text-slate-500 tracking-wider">API Latency Gateway</span>
          <strong className="text-blue-400 text-xs mt-0.5">{apiLatency} ms</strong>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Operational Health</span>
          <strong className="text-indigo-400 text-xs mt-0.5">98.4% Optimal</strong>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Weather Conditions</span>
          <strong className="text-amber-400 text-xs mt-0.5">Storm Warning (Midwest)</strong>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] uppercase font-black text-slate-500 tracking-wider">AI Route Optimization</span>
          <strong className="text-purple-400 text-xs mt-0.5">Active (3 Paths rerouted)</strong>
        </div>
        <div className="flex flex-col col-span-2 text-right justify-center">
          <span className="text-[9px] uppercase font-black text-slate-500 tracking-wider block">Terminal Local Time</span>
          <strong className="text-white text-xs block font-mono mt-0.5">{syncTime}</strong>
        </div>
      </div>

      {/* 2. SEARCH & SMART FILTER BAR */}
      <div className="p-4 bg-[#0E1628]/85 border border-white/5 rounded-2xl flex flex-col xl:flex-row gap-4 items-center justify-between z-10 relative">
        <div className="relative w-full xl:max-w-md">
          <div className="flex items-center gap-2 bg-[#070B1A] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white">
            <Search className="w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search registration, driver, VIN, hub..." 
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setShowSuggestions(true)}
              className="bg-transparent font-semibold text-white focus:outline-none w-full placeholder-slate-550"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setSearchSuggestions([]); }}>
                <X className="w-4.5 h-4.5 text-slate-500 hover:text-white" />
              </button>
            )}
          </div>

          {/* Suggestions Dropdown */}
          <AnimatePresence>
            {showSuggestions && searchSuggestions.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute left-0 right-0 mt-2 bg-[#0E1628] border border-white/10 rounded-xl shadow-2xl z-30 overflow-hidden"
              >
                {searchSuggestions.map(v => (
                  <button
                    key={v._id}
                    onClick={() => {
                      setSearchQuery(v.registrationNumber);
                      setShowSuggestions(false);
                      const telemetryItem = activeVehicles.find(x => x._id === v._id);
                      if (telemetryItem) setSelectedMarker(telemetryItem);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-white/5 text-xs font-bold text-white border-b border-white/5 last:border-0 flex justify-between items-center"
                  >
                    <span>{v.registrationNumber} ({v.nameModel})</span>
                    <span className="text-[10px] text-slate-500 uppercase">{v.type}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs font-extrabold text-slate-400">
          <select 
            value={filters.type} 
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            className="bg-[#070B1A] border border-white/5 px-3 py-2 rounded-xl focus:outline-none"
          >
            <option value="ALL">All Asset Types</option>
            <option value="EV">Electric Vehicles</option>
            <option value="Truck">Heavy Trucks</option>
            <option value="Van">Sprinter Vans</option>
            <option value="Reefer">Refrigerated Reefers</option>
          </select>

          <select 
            value={filters.status} 
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="bg-[#070B1A] border border-white/5 px-3 py-2 rounded-xl focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="Moving">Moving</option>
            <option value="Idle">Idle</option>
            <option value="Parked">Parked</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Emergency">Emergency</option>
          </select>

          <select 
            value={filters.region} 
            onChange={(e) => setFilters(prev => ({ ...prev, region: e.target.value }))}
            className="bg-[#070B1A] border border-white/5 px-3 py-2 rounded-xl focus:outline-none"
          >
            <option value="ALL">All Regions</option>
            <option value="North">North Region</option>
            <option value="South">South Region</option>
            <option value="East">East Region</option>
            <option value="West">West Region</option>
          </select>

          <button 
            onClick={fetchMapData}
            className="p-2 bg-[#070B1A] border border-white/5 rounded-xl hover:bg-white/5 text-slate-300 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. MAIN COMMAND PLATFORM GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 relative z-10">
        
        {/* Left Side: Live Vehicle sidebar */}
        <div className="xl:col-span-1 glass bg-[#0E1628]/80 border border-white/5 rounded-3xl p-5 h-[650px] flex flex-col justify-between shadow-2xl relative">
          <div className="space-y-4 flex-grow overflow-y-auto custom-scrollbar pr-1">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Live Fleet Directory</span>
              <span className="text-[9px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded font-black">{filteredVehicles.length} Online</span>
            </div>

            {filteredVehicles.map(v => {
              const statusStyles = getStatusStyle(v.status);
              return (
                <div 
                  key={v._id} 
                  onClick={() => { setSelectedMarker(v); setOffset({ x: -v.position.x + 400, y: -v.position.y + 250 }); }}
                  className={`p-3.5 bg-[#070B1A]/40 border rounded-2xl cursor-pointer hover:border-white/10 transition-all flex flex-col justify-between gap-3 ${
                    selectedMarker?._id === v._id ? 'border-indigo-500 bg-indigo-500/5' : 'border-white/5'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center text-slate-400">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <strong className="text-white text-xs block">{v.registrationNumber}</strong>
                        <span className="text-[9px] text-slate-500 font-bold block uppercase mt-0.5">{v.nameModel}</span>
                      </div>
                    </div>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${statusStyles.bg} ${statusStyles.text}`}>
                      {v.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-[9px] text-slate-500 border-t border-white/5 pt-2">
                    <div>Speed: <strong className="text-slate-300 font-mono">{v.speed} km/h</strong></div>
                    <div>Fuel: <strong className="text-slate-300 font-mono">{v.fuel}%</strong></div>
                    <div>Battery: <strong className="text-slate-300 font-mono">{v.battery}%</strong></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center: Live Interactive Logistics Map */}
        <div className="xl:col-span-2 glass bg-[#0E1628]/80 border border-white/5 rounded-3xl h-[650px] relative overflow-hidden flex flex-col justify-between shadow-2xl">
          
          {/* Map floating controls top bar */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
            <div className="flex items-center bg-[#070B1A] border border-white/10 p-1.5 rounded-xl text-xs gap-1">
              <button 
                onClick={() => setLayers(prev => ({ ...prev, satellite: !prev.satellite }))}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${layers.satellite ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}
              >
                Satellite
              </button>
              <button 
                onClick={() => setLayers(prev => ({ ...prev, traffic: !prev.traffic }))}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${layers.traffic ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}
              >
                Traffic
              </button>
              <button 
                onClick={() => setLayers(prev => ({ ...prev, weather: !prev.weather }))}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${layers.weather ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}
              >
                Weather
              </button>
            </div>
          </div>

          {/* Floating Zoom & Map adjustment controls right side */}
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
            <button onClick={zoomIn} className="w-9 h-9 bg-[#070B1A] hover:bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white transition-colors">
              <ZoomIn className="w-4.5 h-4.5" />
            </button>
            <button onClick={zoomOut} className="w-9 h-9 bg-[#070B1A] hover:bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white transition-colors">
              <ZoomOut className="w-4.5 h-4.5" />
            </button>
            <button onClick={resetMap} className="w-9 h-9 bg-[#070B1A] hover:bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white transition-colors" title="Locate Fleet">
              <Crosshair className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Vector Map Canvas viewport */}
          <div 
            ref={mapRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`w-full h-full bg-[#070B1A] cursor-grab ${isDragging ? 'cursor-grabbing' : ''} overflow-hidden relative`}
          >
            {/* Grid overlay pattern */}
            {layers.grid && (
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
            )}

            {/* Satellite topographic background layer mock */}
            {layers.satellite && (
              <div className="absolute inset-0 bg-[#0c1322] opacity-40 pointer-events-none">
                <svg className="w-full h-full opacity-20" viewBox="0 0 900 600">
                  <path d="M 0 100 Q 150 120 300 240 T 600 480 T 900 500" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                  <path d="M 120 0 Q 340 180 560 300 T 900 350" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                </svg>
              </div>
            )}

            <svg 
              className="w-full h-full min-w-[900px] min-h-[580px] origin-top-left transition-transform duration-75 select-none pointer-events-none"
              style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}
              viewBox="0 0 900 580"
            >
              
              {/* Geofence polygon overlays */}
              {layers.geofence && customGeofences.map((geo, i) => (
                geo.active && (
                  <polygon 
                    key={i} 
                    points={geo.points} 
                    fill={geo.color} 
                    stroke="rgba(239, 68, 68, 0.4)" 
                    strokeWidth="1.5" 
                    strokeDasharray="4,3" 
                  />
                )
              ))}

              {/* Draw custom geofence vector points in-progress */}
              {rightPanelTab === 'GEOFENCES' && drawnPoints.length > 0 && (
                <g>
                  {/* Lines between nodes */}
                  {drawnPoints.map((p, idx) => (
                    idx < drawnPoints.length - 1 && (
                      <line 
                        key={idx} 
                        x1={p.x} y1={p.y} x2={drawnPoints[idx + 1].x} y2={drawnPoints[idx + 1].y} 
                        stroke="#6366F1" strokeWidth="2" 
                      />
                    )
                  ))}
                  {/* Closing line if nodes > 2 */}
                  {drawnPoints.length >= 3 && (
                    <line 
                      x1={drawnPoints[drawnPoints.length - 1].x} y1={drawnPoints[drawnPoints.length - 1].y} 
                      x2={drawnPoints[0].x} y2={drawnPoints[0].y} 
                      stroke="#6366F1" strokeWidth="1.5" strokeDasharray="3,3" 
                    />
                  )}
                  {/* Node dots */}
                  {drawnPoints.map((p, idx) => (
                    <circle key={idx} cx={p.x} cy={p.y} r="5" fill="#6366F1" stroke="#ffffff" strokeWidth="1.5" />
                  ))}
                </g>
              )}

              {/* Heatmap density gradients */}
              {rightPanelTab === 'HEATMAP' && [
                { x: 420, y: 410, r: 80, weight: 12, label: 'Dallas Congestion Corridor' },
                { x: 600, y: 160, r: 100, weight: 18, label: 'Chicago Severe Speed Warnings' },
                { x: 100, y: 320, r: 70, weight: 9, label: 'LA Port Idle Bottleneck' }
              ].map((spot, i) => {
                const metricColors = {
                  TRAFFIC: { start: '#EF4444', end: 'rgba(239, 68, 68, 0)' },
                  SPEED: { start: '#F59E0B', end: 'rgba(245, 158, 11, 0)' },
                  IDLE: { start: '#06B6D4', end: 'rgba(6, 182, 212, 0)' }
                };
                const color = metricColors[heatmapMetric];
                return (
                  <g key={i}>
                    <defs>
                      <radialGradient id={`heatGrad-${i}`} cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor={color.start} stopOpacity="0.45" />
                        <stop offset="100%" stopColor={color.end} stopOpacity="0" />
                      </radialGradient>
                    </defs>
                    <circle cx={spot.x} cy={spot.y} r={spot.r + (spot.weight * 3)} fill={`url(#heatGrad-${i})`} />
                    <circle cx={spot.x} cy={spot.y} r="3" fill={color.start} />
                  </g>
                );
              })}

              {/* Road network highways */}
              {layers.routes && HIGHWAY_LANES.map(lane => (
                <g key={lane.id}>
                  <path 
                    d={lane.path} 
                    fill="none" 
                    stroke="rgba(255,255,255,0.03)" 
                    strokeWidth="8" 
                    strokeLinecap="round" 
                  />
                  <path 
                    d={lane.path} 
                    fill="none" 
                    stroke="rgba(99, 102, 241, 0.08)" 
                    strokeWidth="3.5" 
                    strokeLinecap="round" 
                  />
                </g>
              ))}

              {/* Traffic Flow indicators */}
              {layers.traffic && (
                <g>
                  {/* Heavy traffic segment (Red highlight) */}
                  <path d="M 420 410 Q 550 380 680 340" fill="none" stroke="#EF4444" strokeWidth="2" strokeDasharray="5,6" className="opacity-75" />
                  {/* Moderate traffic (Orange) */}
                  <path d="M 100 320 Q 260 370 420 410" fill="none" stroke="#F59E0B" strokeWidth="2" strokeDasharray="6,8" className="opacity-60" />
                </g>
              )}

              {/* Weather Systems Radar overlay */}
              {layers.weather && WEATHER_RADARS.map(rad => (
                <g key={rad.id}>
                  <circle 
                    cx={rad.x} cy={rad.y} r={rad.r} 
                    fill={rad.type === 'Storm' ? 'rgba(99,102,241,0.03)' : 'rgba(148,163,184,0.03)'} 
                    stroke={rad.type === 'Storm' ? 'rgba(99,102,241,0.1)' : 'rgba(148,163,184,0.1)'} 
                    strokeWidth="1" 
                    strokeDasharray="3,3" 
                  />
                  <circle 
                    cx={rad.x} cy={rad.y} r={rad.r - 20} 
                    fill="none" 
                    stroke={rad.type === 'Storm' ? 'rgba(99,102,241,0.05)' : 'rgba(148,163,184,0.05)'} 
                    strokeWidth="1.5" 
                  />
                </g>
              ))}

              {/* Logistics Hub Pinpoints */}
              {layers.hubs && HUBS.map(hub => (
                <g key={hub.id} className="pointer-events-auto cursor-pointer">
                  <circle cx={hub.x} cy={hub.y} r="8" fill="#0E1628" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                  <circle cx={hub.x} cy={hub.y} r="3.5" fill="#6366F1" />
                </g>
              ))}

              {/* Live Vehicle Positions & Fading trail markers */}
              {filteredVehicles.map(v => {
                const statusStyle = getStatusStyle(v.status);
                const isSelected = selectedMarker?._id === v._id;
                return (
                  <g 
                    key={v._id} 
                    className="pointer-events-auto cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); setSelectedMarker(v); }}
                    onMouseEnter={() => setHoveredMarker(v)}
                    onMouseLeave={() => setHoveredMarker(null)}
                  >
                    {/* Selected highlight ring */}
                    {isSelected && (
                      <circle 
                        cx={v.position.x} cy={v.position.y} r="24" 
                        fill="rgba(99, 102, 241, 0.1)" 
                        stroke="#6366F1" 
                        strokeWidth="1.5" 
                        strokeDasharray="3,2" 
                      />
                    )}

                    <circle 
                      cx={v.position.x} cy={v.position.y} r="13" 
                      fill="#070B1A" 
                      stroke={isSelected ? '#6366F1' : statusStyle.pulse.includes('bg-red') ? '#EF4444' : '#3B82F6'} 
                      strokeWidth="2" 
                    />

                    {/* Dynamic pulse ring */}
                    <circle 
                      cx={v.position.x} cy={v.position.y} r="20" 
                      fill="none" 
                      stroke={statusStyle.pulse.includes('bg-red') ? '#EF4444' : '#3B82F6'} 
                      strokeWidth="1" 
                      className="animate-ping opacity-35" 
                      style={{ animationDuration: '4s' }}
                    />

                    {/* SVG arrow pointer direction heading */}
                    <polygon 
                      points="0,-4 -3,3 3,3" 
                      fill={statusStyle.pulse.includes('bg-red') ? '#EF4444' : '#6366F1'} 
                      transform={`translate(${v.position.x}, ${v.position.y}) rotate(${v.heading})`}
                    />
                  </g>
                );
              })}

            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredMarker && (
              <div 
                className="absolute bg-[#0E1628]/95 border border-white/10 p-3 rounded-xl shadow-2xl pointer-events-none z-45 text-[10px] w-64 space-y-1.5"
                style={{ 
                  left: hoveredMarker.position.x * zoom + offset.x + 20, 
                  top: hoveredMarker.position.y * zoom + offset.y - 40
                }}
              >
                <div className="flex justify-between items-center border-b border-white/5 pb-1">
                  <strong className="text-white font-extrabold">{hoveredMarker.registrationNumber}</strong>
                  <span className="text-slate-500 font-bold uppercase">{hoveredMarker.nameModel}</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-slate-400">
                  <div>Driver: <strong className="text-white">{hoveredMarker.driver}</strong></div>
                  <div>Speed: <strong className="text-blue-400 font-mono">{hoveredMarker.speed} km/h</strong></div>
                  <div>Fuel Level: <strong className="text-white">{hoveredMarker.fuel}%</strong></div>
                  <div>Battery: <strong className="text-white">{hoveredMarker.battery}%</strong></div>
                  <div>ETA: <strong className="text-cyan-400 font-mono">{hoveredMarker.eta || 'N/A'}</strong></div>
                  <div>AI Risk Score: <strong className="text-indigo-400 font-mono">{hoveredMarker.riskScore}%</strong></div>
                </div>
              </div>
            )}

            {/* Floating alert toast notifications on bottom-right of map */}
            <div className="absolute bottom-4 right-4 z-20 space-y-2 pointer-events-none w-72">
              <AnimatePresence>
                {toastAlerts.map(toast => (
                  <motion.div 
                    key={toast.id}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    className="p-3 bg-[#0E1628]/95 border border-white/10 rounded-xl shadow-2xl flex items-start gap-2.5 backdrop-blur-xl pointer-events-auto text-[11px]"
                  >
                    <AlertOctagon className={`w-4 h-4 shrink-0 mt-0.5 ${toast.level === 'danger' ? 'text-red-500' : 'text-amber-500 animate-pulse'}`} />
                    <div className="flex-1 space-y-0.5">
                      <strong className="text-white text-[10px] block font-extrabold uppercase leading-none">{toast.type}</strong>
                      <p className="text-slate-350 leading-snug">{toast.msg}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Side: Tabbed AI, Hubs, Weather radar panel */}
        <div className="xl:col-span-1 glass bg-[#0E1628]/80 border border-white/5 rounded-3xl p-5 h-[650px] flex flex-col justify-between shadow-2xl relative">
          <div className="space-y-4 flex-grow overflow-y-auto custom-scrollbar pr-1">
            
            {/* Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-white/5 pb-2 text-[9px] font-black uppercase tracking-wider text-slate-500">
              <button onClick={() => { setRightPanelTab('AI'); setDrawnPoints([]); }} className={`pb-1 border-b-2 ${rightPanelTab === 'AI' ? 'border-indigo-500 text-indigo-400 font-black' : 'border-transparent hover:text-slate-355'}`}>AI</button>
              <button onClick={() => { setRightPanelTab('HUBS'); setDrawnPoints([]); }} className={`pb-1 border-b-2 ${rightPanelTab === 'HUBS' ? 'border-indigo-500 text-indigo-400 font-black' : 'border-transparent hover:text-slate-355'}`}>Hubs</button>
              <button onClick={() => { setRightPanelTab('WEATHER'); setDrawnPoints([]); }} className={`pb-1 border-b-2 ${rightPanelTab === 'WEATHER' ? 'border-indigo-500 text-indigo-400 font-black' : 'border-transparent hover:text-slate-355'}`}>Radar</button>
              <button onClick={() => { setRightPanelTab('GEOFENCES'); setDrawnPoints([]); }} className={`pb-1 border-b-2 ${rightPanelTab === 'GEOFENCES' ? 'border-indigo-500 text-indigo-400 font-black' : 'border-transparent hover:text-slate-355'}`}>Geofences</button>
              <button onClick={() => { setRightPanelTab('HEATMAP'); setDrawnPoints([]); }} className={`pb-1 border-b-2 ${rightPanelTab === 'HEATMAP' ? 'border-indigo-500 text-indigo-400 font-black' : 'border-transparent hover:text-slate-355'}`}>Heatmaps</button>
            </div>

            {/* AI Predictions tab contents */}
            {rightPanelTab === 'AI' && (
              <div className="space-y-3.5">
                <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl text-xs space-y-1.5">
                  <div className="flex items-center gap-1 text-indigo-400 font-black">
                    <Cpu className="w-3.5 h-3.5" /> AI Recommended Action
                  </div>
                  <p className="text-slate-400 leading-normal text-[11px]">
                    Severe storm detected near Chicago bypass corridor. Reroute flatbed tankers via Route 66 bypass pipeline to save 55 mins.
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block pl-1">Priority Alerts</span>
                  
                  <div className="p-3 bg-red-500/5 border border-red-500/15 rounded-2xl text-xs space-y-1 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                    <strong className="text-white text-[11px] block">SOS: Power Drop</strong>
                    <p className="text-slate-400 text-[10px]">BIK-02 battery charge critical (14%). Dispatch courier support.</p>
                  </div>

                  <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-2xl text-xs space-y-1 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
                    <strong className="text-white text-[11px] block">Speeding Warning</strong>
                    <p className="text-slate-400 text-[10px]">TRK-12 exceeding limits on interstate freeway corridor.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Hub queue analytics */}
            {rightPanelTab === 'HUBS' && (
              <div className="space-y-3">
                {HUBS.map(hub => (
                  <div key={hub.id} className="p-3 bg-[#070B1A]/40 border border-white/5 rounded-2xl text-xs space-y-2">
                    <div className="flex justify-between items-center border-b border-white/5 pb-1">
                      <strong className="text-white font-extrabold">{hub.name}</strong>
                      <span className="text-[9px] text-slate-500 font-bold uppercase">{hub.type}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-455">
                      <div>Capacity: <strong className="text-slate-300 font-mono">{hub.inside}/{hub.capacity}</strong></div>
                      <div>Queue: <strong className="text-slate-300 font-mono">{hub.incoming} incoming</strong></div>
                      <div className="col-span-2">Avg Loading Delay: <strong className="text-amber-400 font-mono">{hub.delay}</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Weather alerts */}
            {rightPanelTab === 'WEATHER' && (
              <div className="space-y-4">
                {/* 1. CURRENT CONDITION ADVISORY */}
                <div className="p-4 bg-[#070B1A]/60 border border-white/5 rounded-2xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-white font-extrabold text-sm">Chicago Metro</h3>
                      <span className="text-[9px] uppercase font-bold text-slate-500 block mt-0.5">Midwest Weather Advisory</span>
                    </div>
                    <span className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase rounded-lg animate-pulse">
                      Severe Storm
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-500/10 rounded-2xl text-red-400">
                      <CloudRain className="w-8 h-8 animate-bounce" />
                    </div>
                    <div>
                      <div className="text-2xl font-black text-white">14°C</div>
                      <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Feels Like 12°C • Heavy Storm Front</div>
                    </div>
                  </div>

                  {/* Diagnostic stats */}
                  <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-3 text-[10px] text-slate-455">
                    <div>
                      <span className="block font-bold text-slate-550">Wind</span>
                      <strong className="text-slate-200">65 km/h NE</strong>
                    </div>
                    <div>
                      <span className="block font-bold text-slate-555">Humidity</span>
                      <strong className="text-slate-200">84%</strong>
                    </div>
                    <div>
                      <span className="block font-bold text-slate-555">Rain %</span>
                      <strong className="text-slate-200">92%</strong>
                    </div>
                    <div className="mt-1">
                      <span className="block font-bold text-slate-555">Visibility</span>
                      <strong className="text-slate-200">120m</strong>
                    </div>
                    <div className="mt-1">
                      <span className="block font-bold text-slate-555">Pressure</span>
                      <strong className="text-slate-200">994 hPa</strong>
                    </div>
                    <div className="mt-1">
                      <span className="block font-bold text-slate-555">Air Quality</span>
                      <strong className="text-emerald-400 font-bold">42 AQI</strong>
                    </div>
                  </div>
                </div>

                {/* 2. AI WEATHER IMPACT PREDICTOR */}
                <div className="p-4 bg-indigo-500/5 border border-indigo-500/15 rounded-2xl space-y-3">
                  <div className="flex items-center gap-1.5 text-indigo-400 font-black text-[11px] uppercase tracking-wide">
                    <Sparkles className="w-4 h-4 animate-pulse" /> AI Weather Impact Model
                  </div>
                  
                  <div className="space-y-2">
                    <div className="p-2.5 bg-[#070B1A]/40 border border-white/5 rounded-xl text-[11px] space-y-1.5">
                      <div className="flex justify-between font-bold">
                        <span className="text-slate-400">Delay Risk Factor</span>
                        <span className="text-red-400 font-black">CRITICAL (+45m)</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                    </div>

                    <div className="p-2.5 bg-[#070B1A]/40 border border-white/5 rounded-xl text-[11px] space-y-1.5">
                      <div className="flex justify-between font-bold">
                        <span className="text-slate-400">Crosswind Risk (Reefers)</span>
                        <span className="text-amber-400 font-black">MODERATE (38kt)</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: '60%' }}></div>
                      </div>
                    </div>

                    <div className="p-2.5 bg-[#070B1A]/40 border border-white/5 rounded-xl text-[10px] space-y-1 text-slate-400">
                      <div className="flex justify-between font-bold text-white mb-1">
                        <span>Predictive Metrics</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Road Closure Status:</span>
                        <strong className="text-red-400">Flood Warnings Cook County</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Fuel Increase:</span>
                        <strong className="text-slate-200">+8.4% (low velocity drag)</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Estimated ETA Shifts:</span>
                        <strong className="text-slate-200">+38m to +55m</strong>
                      </div>
                    </div>
                  </div>

                  {/* Recommendation action */}
                  <div className="p-3 bg-[#070B1A]/60 border border-white/5 rounded-xl text-[10px] leading-normal text-slate-350 space-y-1">
                    <span className="font-bold text-indigo-400 block uppercase">Recommended Alternative Route</span>
                    <p className="italic">Detour northbound trailers via Route 66 bypass to avoid lane water accumulation.</p>
                  </div>
                </div>

                {/* 3. RADAR & VISIBILITY TOGGLE */}
                <div className="p-3.5 bg-[#070B1A]/40 border border-white/5 rounded-xl flex items-center justify-between text-xs font-bold text-slate-450">
                  <span>Show Radar Cloud Overlay</span>
                  <button 
                    onClick={() => setLayers(prev => ({ ...prev, weather: !prev.weather }))}
                    className={`w-8 h-4.5 rounded-full p-0.5 transition-all ${layers.weather ? 'bg-indigo-600' : 'bg-slate-800'}`}
                  >
                    <div className={`w-3.5 h-3.5 bg-white rounded-full transition-all ${layers.weather ? 'translate-x-3.5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            )}

            {/* Geofences Manager tab */}
            {rightPanelTab === 'GEOFENCES' && (
              <div className="space-y-4">
                <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl text-xs space-y-2">
                  <strong className="text-indigo-400 block font-bold">Draw Geofence Boundary</strong>
                  <p className="text-slate-400 text-[10px] leading-relaxed">
                    Click on the map to define polygon nodes. Minimum 3 points required.
                  </p>
                  
                  {drawnPoints.length > 0 && (
                    <div className="pt-2 border-t border-white/5 space-y-2">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-slate-500">Zone Name</label>
                        <input 
                          type="text" 
                          placeholder="Zone Name" 
                          value={newGeoName}
                          onChange={(e) => setNewGeoName(e.target.value)}
                          className="w-full bg-[#070B1A] border border-white/5 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none placeholder-slate-600"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-slate-500">Type</label>
                        <select 
                          value={newGeoType}
                          onChange={(e) => setNewGeoType(e.target.value)}
                          className="w-full bg-[#070B1A] border border-white/5 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none"
                        >
                          <option value="Restricted">Restricted</option>
                          <option value="Terminal">Terminal</option>
                          <option value="Warehouse">Warehouse</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={handleSaveGeofence} 
                          disabled={drawnPoints.length < 3 || !newGeoName.trim()}
                          className="flex-1 py-1.5 bg-indigo-650 hover:bg-indigo-600 disabled:opacity-40 text-white font-bold text-[10px] rounded-lg transition-colors"
                        >
                          Save
                        </button>
                        <button 
                          onClick={() => setDrawnPoints([])}
                          className="px-2 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-[10px] rounded-lg transition-colors"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <span className="text-[9px] font-black uppercase text-slate-500 block pl-1">Active Geofences</span>
                  <div className="space-y-1.5">
                    {customGeofences.map(geo => (
                      <div key={geo.id} className="p-2.5 bg-[#070B1A]/40 border border-white/5 rounded-xl flex items-center justify-between text-[11px]">
                        <div className="space-y-0.5">
                          <strong className="text-white block truncate max-w-[130px] font-extrabold">{geo.name}</strong>
                          <span className="text-[8px] font-bold text-slate-550 uppercase">{geo.type}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => toggleGeofence(geo.id)}
                            className={`w-6 h-3 rounded-full p-0.5 transition-all ${geo.active ? 'bg-indigo-600' : 'bg-slate-800'}`}
                          >
                            <div className={`w-2 h-2 bg-white rounded-full transition-all ${geo.active ? 'translate-x-3' : 'translate-x-0'}`} />
                          </button>
                          <button onClick={() => handleDeleteGeofence(geo.id)} className="p-0.5 hover:bg-red-500/10 text-slate-500 hover:text-red-500 rounded">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Heatmaps Manager tab */}
            {rightPanelTab === 'HEATMAP' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[9px] uppercase font-bold text-slate-550 block">Select Heatmap Layer</label>
                  <div className="space-y-1.5">
                    {[
                      { key: 'TRAFFIC', label: 'Traffic Density', desc: 'Congestion bottlenecks' },
                      { key: 'SPEED', label: 'Speed Violations', desc: 'Overspeed warning locations' },
                      { key: 'IDLE', label: 'Idle Times', desc: 'Stationary target hotspots' }
                    ].map(m => (
                      <button 
                        key={m.key} 
                        onClick={() => setHeatmapMetric(m.key)}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${
                          heatmapMetric === m.key ? 'border-indigo-500 bg-indigo-500/5 text-white' : 'border-white/5 text-slate-400 hover:border-white/10'
                        }`}
                      >
                        <strong className="text-[11px] block">{m.label}</strong>
                        <span className="text-[9px] text-slate-500 block mt-0.5">{m.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl text-[10px] text-slate-400 leading-relaxed">
                  <strong className="text-indigo-400 block font-bold mb-1">Density Insight</strong>
                  Visual overlays reflect historical and real-time telemetry inputs parsed from vehicle diagnostics. Chicago bypass shows highest speed violation counts.
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* 4. OPERATIONS TIMELINE LOG CONSOLE & TOASTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        
        {/* Horizontal event timelines */}
        <div className="lg:col-span-2 glass bg-[#0E1628]/80 border border-white/5 rounded-3xl p-5 shadow-2xl flex flex-col justify-between min-h-[220px]">
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Activity Progression Pipeline</span>
              <span className="text-[9px] text-slate-500">Continuous telemetry feed</span>
            </div>
            
            <div className="space-y-3 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
              {opsLog.map(log => (
                <div key={log.id} className="flex gap-4 items-start relative text-xs">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 bg-indigo-500 shrink-0"></div>
                  <div className="flex-grow flex justify-between items-center border-b border-white/5 pb-2">
                    <div className="space-y-0.5">
                      <span className="text-slate-500 text-[10px] font-black uppercase">{log.type}</span>
                      <p className="text-slate-200 font-semibold">{log.msg}</p>
                    </div>
                    <span className="text-slate-500 font-mono text-[10px] font-bold">{log.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Predictive maintenance wear */}
        <div className="glass bg-[#0E1628]/80 border border-white/5 rounded-3xl p-5 shadow-2xl flex flex-col justify-between min-h-[220px]">
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">AI Diagnostics Metrics</span>
              <Cpu className="w-4 h-4 text-indigo-400" />
            </div>

            <div className="space-y-2.5">
              {[
                { component: 'Tires Front', risk: 85, color: 'bg-red-500' },
                { component: 'Engine Oil', risk: 62, color: 'bg-amber-500' },
                { component: 'Brake Pads', risk: 40, color: 'bg-slate-500' }
              ].map((p, idx) => (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-400">{p.component}</span>
                    <span className="text-white font-mono">{p.risk}% Wear</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-white/5">
                    <div className={`h-full ${p.color}`} style={{ width: `${p.risk}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>



      {/* 5. RIGHT SLIDE-OUT PROFILE DRAWER OVERLAY */}
      <AnimatePresence>
        {selectedMarker && (
          <div className="fixed inset-0 z-50 flex justify-end">
            
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMarker(null)}
              className="absolute inset-0 bg-slate-955/60 backdrop-blur-sm"
            />

            {/* Profile Drawer */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="relative w-full max-w-md h-full bg-[#0E1628] border-l border-white/5 p-6 flex flex-col justify-between z-10 text-slate-355"
            >
              {/* Drawer Content */}
              <div className="flex-grow overflow-y-auto pr-1 custom-scrollbar space-y-6">
                
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/5 text-white">
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-indigo-400" />
                    <span className="text-sm font-black uppercase tracking-wider">Asset Command File</span>
                  </div>
                  <button 
                    onClick={() => setSelectedMarker(null)}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Hero Information */}
                <div className="flex items-center gap-4 bg-[#141D31] border border-white/5 p-4 rounded-2xl relative overflow-hidden">
                  <div className="w-14 h-14 rounded-full bg-indigo-500/10 border-2 border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-xl">
                    {selectedMarker.registrationNumber.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-base font-black text-white">{selectedMarker.registrationNumber}</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{selectedMarker.nameModel}</p>
                    <span className="inline-block mt-1 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400">
                      AI Risk Index: {selectedMarker.riskScore}%
                    </span>
                  </div>
                  <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 uppercase">
                    {selectedMarker.status}
                  </span>
                </div>

                {/* Telemetry diagnostics */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Live Sensors</span>
                  <div className="grid grid-cols-2 gap-3 bg-[#070B1A]/40 border border-white/5 p-4 rounded-2xl text-xs">
                    <div>
                      <span className="text-[9px] text-slate-500 block">Current Velocity</span>
                      <strong className="text-white font-mono">{selectedMarker.speed} km/h</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block">Fuel Level</span>
                      <strong className="text-white font-mono">{selectedMarker.fuel}%</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block">Engine Temp</span>
                      <strong className="text-white font-mono">{selectedMarker.temp}°C</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block">Cargo Payload</span>
                      <strong className="text-white">{selectedMarker.cargo}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block">Odometer</span>
                      <strong className="text-white font-mono">{selectedMarker.odometer?.toLocaleString()} km</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block">Active Driver</span>
                      <strong className="text-indigo-400 font-semibold">{selectedMarker.driver}</strong>
                    </div>
                  </div>
                </div>

                {/* Physical Health wear scoreboards */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Physical Health</span>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-[#070B1A]/40 border border-white/5 rounded-2xl text-center">
                      <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold block mb-1">Coolant</span>
                      <strong className="text-xs text-white">88°C</strong>
                      <div className="w-full bg-slate-800 h-1 mt-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full" style={{ width: '70%' }}></div>
                      </div>
                    </div>
                    <div className="p-3 bg-[#070B1A]/40 border border-white/5 rounded-2xl text-center">
                      <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold block mb-1">Brakes</span>
                      <strong className="text-xs text-amber-400">14%</strong>
                      <div className="w-full bg-slate-800 h-1 mt-1.5 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full" style={{ width: '14%' }}></div>
                      </div>
                    </div>
                    <div className="p-3 bg-[#070B1A]/40 border border-white/5 rounded-2xl text-center">
                      <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold block mb-1">Tires</span>
                      <strong className="text-xs text-white">112 PSI</strong>
                      <div className="w-full bg-slate-800 h-1 mt-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full" style={{ width: '85%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Compliance Verification details */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Compliance & Insurance</span>
                  <div className="bg-[#070B1A]/40 border border-white/5 p-4 rounded-2xl text-xs space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Driver License Class</span>
                      <strong className="text-white">Commercial Class A</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">DMV Registration Expiry</span>
                      <strong className="text-white">28-Aug-2027</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Insurance Carrier</span>
                      <strong className="text-white">Motive Safe Policy #89201</strong>
                    </div>
                  </div>
                </div>

              </div>

              {/* Action Buttons footer layout */}
              <div className="pt-4 border-t border-white/5 space-y-2 shrink-0">
                <button
                  onClick={() => setSelectedMarker(null)}
                  className="w-full py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/10"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Lock Camera & Track Asset</span>
                </button>
                <div className="flex gap-2">
                  <button className="flex-grow py-2 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 text-[10px] font-bold text-slate-350 uppercase transition-all">
                    Call Driver
                  </button>
                  <button className="flex-grow py-2 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 text-[10px] font-bold text-slate-355 uppercase transition-all">
                    Export Audit
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  Truck, Calendar, CheckCircle2, AlertTriangle, Users, BarChart3, 
  TrendingUp, RefreshCw, Activity, MapPin, Cpu, ShieldAlert, Fuel, 
  Settings, DollarSign, Clock, Zap, Map, ChevronRight, ArrowUpRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../api';
import { LineChart, DonutChart } from '../components/Charts';

// Inline Sparkline helper for premium look
function Sparkline({ points, color }) {
  const width = 100;
  const height = 30;
  const maxVal = Math.max(...points, 1);
  const minVal = Math.min(...points, 0);
  const range = maxVal - minVal;
  
  const pathD = points.map((p, i) => {
    const x = (i * width) / (points.length - 1 || 1);
    const y = height - ((p - minVal) * height) / (range || 1);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible opacity-80">
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Mini Sparklines datasets to map to KPIs
const sparkData = {
  active: [10, 15, 12, 18, 14, 22, 25],
  available: [30, 28, 32, 29, 31, 33, 30],
  maintenance: [2, 4, 3, 5, 2, 4, 3],
  trips: [5, 9, 8, 12, 11, 15, 18],
  pending: [4, 6, 3, 5, 4, 7, 5],
  drivers: [15, 16, 18, 17, 19, 21, 20],
};

export default function Dashboard({ user, onNavigate }) {
  const [filters, setFilters] = useState({ type: '', region: '', status: '' });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  // Local Clock updater
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await api.getDashboardData(filters);
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [filters]);

  // Extended KPI cards representing the requested metrics
  const activeVehicles = data?.kpis.activeVehicles ?? 0;
  const availableVehicles = data?.kpis.availableVehicles ?? 0;
  const maintenanceVehicles = data?.kpis.maintenanceVehicles ?? 0;
  const totalVehicles = activeVehicles + availableVehicles + maintenanceVehicles || 38;

  const kpis = [
    { 
      label: 'Active Vehicles', 
      val: activeVehicles, 
      sub: `${Math.round((activeVehicles / totalVehicles) * 100) || 0}% of total fleet`, 
      spark: sparkData.active,
      trend: '+12.4%',
      trendUp: true,
      icon: Truck, 
      color: 'indigo'
    },
    { 
      label: 'Available Vehicles', 
      val: availableVehicles, 
      sub: 'Ready for dispatch', 
      spark: sparkData.available,
      trend: '+4.2%',
      trendUp: true,
      icon: CheckCircle2, 
      color: 'emerald'
    },
    { 
      label: 'Vehicles On Trip', 
      val: data?.kpis.activeTrips ?? 0, 
      sub: 'Dispatched & moving', 
      spark: sparkData.trips,
      trend: '+8.1%',
      trendUp: true,
      icon: MapPin, 
      color: 'cyan'
    },
    { 
      label: 'Drivers Online', 
      val: data?.kpis.driversOnDuty ?? 0, 
      sub: 'Active / On-Duty', 
      spark: sparkData.drivers,
      trend: '+15.2%',
      trendUp: true,
      icon: Users, 
      color: 'violet'
    },
    { 
      label: 'Pending Trips', 
      val: data?.kpis.pendingTrips ?? 0, 
      sub: 'Scheduled drafts', 
      spark: sparkData.pending,
      trend: '-2.5%',
      trendUp: false,
      icon: Calendar, 
      color: 'slate'
    },
    { 
      label: 'Maintenance Due', 
      val: maintenanceVehicles, 
      sub: 'Currently in shop', 
      spark: sparkData.maintenance,
      trend: '-10.5%',
      trendUp: true, // Decreasing maintenance is good
      icon: AlertTriangle, 
      color: 'amber'
    }
  ];

  // Re-map backend values to the charts
  const lineChartData = [
    { label: 'Mon', value: 3 },
    { label: 'Tue', value: 5 },
    { label: 'Wed', value: 4 },
    { label: 'Thu', value: 8 },
    { label: 'Fri', value: data?.stats.trips.completed || 6 },
    { label: 'Sat', value: 2 },
    { label: 'Sun', value: 1 },
  ];

  const donutChartData = [
    { label: 'Fuel', value: data?.stats.financials.totalFuelCost || 790, color: '#6366F1' },
    { label: 'Maintenance', value: data?.stats.financials.totalMaintenanceCost || 1320, color: '#F59E0B' },
    { label: 'Tolls/Other', value: data?.stats.financials.totalTollsCost || 395, color: '#10B981' },
  ];

  return (
    <div className="space-y-6 text-slate-900 dark:text-white font-sans transition-colors duration-300">
      
      {/* 1. TOP NAVBAR / COMMAND BAR */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/80 backdrop-blur-xl shadow-lg">
        
        {/* Title and stats summary */}
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-xl font-extrabold tracking-tight">Fleet Operations Command Center</h1>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor, dispatch, optimize, and manage your logistics ecosystem in real time.
          </p>
        </div>

        {/* Global info controls */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          
          {/* Live system indicators */}
          <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-xl border border-slate-200/50 dark:border-slate-850">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold">System Status:</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">99.98% Online</span>
            </div>
            <span className="w-px h-3 bg-slate-200 dark:bg-slate-800" />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold">Clock:</span>
              <span className="font-mono font-extrabold text-indigo-600 dark:text-indigo-400">{currentTime}</span>
            </div>
          </div>

          {/* Form Filter controls */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-850">
            <select
              className="bg-transparent text-xs font-bold focus:outline-none px-2 py-0.5 text-slate-600 dark:text-slate-300"
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            >
              <option value="">All Vehicle Types</option>
              <option value="Van">Van</option>
              <option value="Truck">Truck</option>
              <option value="Sedan">Sedan</option>
              <option value="Reefer">Reefer</option>
              <option value="Flatbed">Flatbed</option>
            </select>
            <span className="w-px h-3.5 bg-slate-200 dark:bg-slate-800"></span>
            <select
              className="bg-transparent text-xs font-bold focus:outline-none px-2 py-0.5 text-slate-600 dark:text-slate-300"
              value={filters.region}
              onChange={(e) => setFilters(prev => ({ ...prev, region: e.target.value }))}
            >
              <option value="">All Regions</option>
              <option value="North">North</option>
              <option value="South">South</option>
              <option value="East">East</option>
              <option value="West">West</option>
            </select>
            <button 
              onClick={fetchDashboardData}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors"
              title="Refresh statistics"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>

      {/* 2. KPI GRID SECTION */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          const colorMap = {
            indigo: 'stroke-indigo-500 text-indigo-500 dark:text-indigo-400 bg-indigo-500/10',
            emerald: 'stroke-emerald-500 text-emerald-500 dark:text-emerald-400 bg-emerald-500/10',
            cyan: 'stroke-cyan-500 text-cyan-500 dark:text-cyan-400 bg-cyan-500/10',
            violet: 'stroke-violet-500 text-violet-500 dark:text-violet-400 bg-violet-500/10',
            slate: 'stroke-slate-500 text-slate-500 dark:text-slate-400 bg-slate-500/10',
            amber: 'stroke-amber-500 text-amber-500 dark:text-amber-400 bg-amber-500/10'
          };
          const rawColor = kpi.color;

          return (
            <div 
              key={i} 
              className="glass p-5 rounded-3xl border border-slate-200/50 dark:border-white/5 hover:border-indigo-500/30 transition-all duration-300 hover:shadow-lg flex flex-col justify-between min-h-[140px] relative overflow-hidden bg-white/70 dark:bg-slate-900/60"
            >
              {/* Inner glowing core */}
              <div className={`absolute top-0 right-0 w-[40px] h-[40px] rounded-full bg-${rawColor}-500/5 blur-[20px]`} />

              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                  {kpi.label}
                </span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${colorMap[rawColor]}`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
              </div>

              <div className="mt-6 flex items-end justify-between">
                <div>
                  <span className="text-3xl font-extrabold tracking-tight">
                    {loading ? '...' : kpi.val ?? 0}
                  </span>
                  <span className="block text-[9px] text-slate-400 dark:text-slate-500 font-semibold mt-1">
                    {kpi.sub}
                  </span>
                </div>

                <div className="text-right flex flex-col items-end gap-1.5">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${
                    kpi.trendUp 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                      : 'bg-red-500/10 border-red-500/20 text-red-500'
                  }`}>
                    {kpi.trend}
                  </span>
                  <Sparkline points={kpi.spark} color={rawColor === 'indigo' ? '#6366f1' : rawColor === 'emerald' ? '#10b981' : rawColor === 'cyan' ? '#06b6d4' : rawColor === 'violet' ? '#8b5cf6' : rawColor === 'amber' ? '#f59e0b' : '#94a3b8'} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. MAIN COMMAND MAP & REAL-TIME INTELLIGENCE FEED */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Large Central Fleet Status Map */}
        <div className="glass p-6 rounded-3xl border border-slate-200/50 dark:border-white/5 bg-white/70 dark:bg-slate-900/60 lg:col-span-2 flex flex-col justify-between min-h-[400px] relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-[0.2] dark:opacity-[0.1]" />
          
          <div className="flex items-center justify-between z-10">
            <div>
              <span className="text-xs uppercase font-extrabold text-indigo-600 dark:text-indigo-400 tracking-wider">Command Center Map</span>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">Real-time Route Connections</h3>
            </div>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-md">
              GPS Signals: Nominal
            </span>
          </div>

          {/* Interactive SVG Map */}
          <div className="relative w-full h-[280px] bg-slate-100/50 dark:bg-slate-950/20 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl overflow-hidden mt-4 z-10 flex items-center justify-center">
            <svg className="w-full h-full opacity-80" viewBox="0 0 600 280">
              {/* Grid overlay pattern */}
              <defs>
                <pattern id="dashGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.015)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="600" height="280" fill="url(#dashGrid)" />

              {/* Bezier Highway Lanes */}
              <path d="M 66 160 Q 53 130 53 100" fill="none" stroke="rgba(99, 102, 241, 0.15)" strokeWidth="1.5" strokeDasharray="3,3" />
              <path d="M 66 160 Q 173 185 280 205" fill="none" stroke="rgba(99, 102, 241, 0.15)" strokeWidth="1.5" strokeDasharray="3,3" />
              <path d="M 280 205 Q 366 190 453 170" fill="none" stroke="rgba(99, 102, 241, 0.15)" strokeWidth="1.5" strokeDasharray="3,3" />
              <path d="M 400 80 Q 473 75 546 70" fill="none" stroke="rgba(99, 102, 241, 0.15)" strokeWidth="1.5" strokeDasharray="3,3" />
              <path d="M 453 170 Q 500 120 546 70" fill="none" stroke="rgba(99, 102, 241, 0.15)" strokeWidth="1.5" strokeDasharray="3,3" />
              <path d="M 53 100 Q 226 90 400 80" fill="none" stroke="rgba(99, 102, 241, 0.15)" strokeWidth="1.5" strokeDasharray="3,3" />

              {/* Pulsing Logistics Hub depots */}
              <g className="cursor-pointer">
                <circle cx="66" cy="160" r="5" fill="#6366f1" />
                <circle cx="66" cy="160" r="10" fill="none" stroke="#6366f1" strokeWidth="1" className="animate-ping" />
              </g>
              <g className="cursor-pointer">
                <circle cx="280" cy="205" r="5" fill="#10B981" />
              </g>
              <g className="cursor-pointer">
                <circle cx="453" cy="170" r="5" fill="#06B6D4" />
              </g>
              <g className="cursor-pointer">
                <circle cx="546" cy="70" r="5" fill="#7C3AED" />
              </g>

              {/* Smooth Moving Vehicle Telemetry (animateMotion) */}
              <g>
                <circle cx="0" cy="0" r="3.5" fill="#3B82F6" stroke="#ffffff" strokeWidth="0.8">
                  <animateMotion dur="12s" repeatCount="indefinite" path="M 66 160 Q 173 185 280 205" />
                </circle>
                <circle cx="0" cy="0" r="7" fill="none" stroke="#3B82F6" strokeWidth="1" className="animate-ping" style={{ animationDuration: '3s' }}>
                  <animateMotion dur="12s" repeatCount="indefinite" path="M 66 160 Q 173 185 280 205" />
                </circle>
              </g>

              <g>
                <circle cx="0" cy="0" r="3.5" fill="#EF4444" stroke="#ffffff" strokeWidth="0.8">
                  <animateMotion dur="10s" repeatCount="indefinite" path="M 453 170 Q 500 120 546 70" />
                </circle>
                <circle cx="0" cy="0" r="7" fill="none" stroke="#EF4444" strokeWidth="1" className="animate-ping" style={{ animationDuration: '3s' }}>
                  <animateMotion dur="10s" repeatCount="indefinite" path="M 453 170 Q 500 120 546 70" />
                </circle>
              </g>
            </svg>

            {/* Float Legend panel */}
            <div className="absolute bottom-4 left-4 p-3 bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-xl text-[10px] space-y-1 shadow-md">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                <span className="font-bold">Active Hubs</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-550" />
                <span className="font-bold">eSprinter (VN-06)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="font-bold">Volvo FH16 (TR-12)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Fleet Intelligence & AI Panel */}
        <div className="glass p-6 rounded-3xl border border-slate-200/50 dark:border-white/5 bg-white/70 dark:bg-slate-900/60 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase font-extrabold text-indigo-600 dark:text-indigo-400 tracking-wider">Fleet Intelligence</span>
              <Cpu className="w-4 h-4 text-indigo-500 animate-pulse" />
            </div>
            
            {/* AI message block */}
            <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-xs leading-relaxed space-y-2">
              <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold">
                <Zap className="w-3.5 h-3.5" />
                <span>AI Dispatch Assistant</span>
              </div>
              <p className="text-slate-650 dark:text-slate-350">
                "Targeted routing recommendations generated. TR-2048 is approaching target odometer limit; schedule oil change within next 80 km."
              </p>
            </div>
          </div>

          {/* Critical alerts */}
          <div className="space-y-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Suggested Actions</span>
            
            <div className="space-y-2.5">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-xs">
                <ShieldAlert className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200 leading-tight">Safety Compliance Review</p>
                  <p className="text-[10px] text-slate-450 mt-1">Driver S. Kim's commercial license expires in 12 days.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-xs">
                <TrendingUp className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200 leading-tight">Route Efficiency Improved</p>
                  <p className="text-[10px] text-slate-450 mt-1">Refined regional path parameters cut 12.4 km per dispatch.</p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('ai_assistant')}
            className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-indigo-600 hover:text-white transition-colors duration-150 text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-1.5"
          >
            <span>Ask AI Command Center</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* 4. QUICK ACTIONS FLOATING PANEL */}
      <div className="p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800/85 bg-slate-50/50 dark:bg-slate-900/40">
        <span className="text-[10px] uppercase font-bold text-slate-450 dark:text-slate-500 tracking-widest block mb-4">Command Shortcut Registry</span>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Dispatch Vehicle', view: 'trips', icon: Calendar, color: 'hover:bg-indigo-600 hover:text-white' },
            { label: 'Register Vehicle', view: 'vehicles', icon: Truck, color: 'hover:bg-emerald-600 hover:text-white' },
            { label: 'Add Driver Profile', view: 'drivers', icon: Users, color: 'hover:bg-violet-600 hover:text-white' },
            { label: 'Fuel & Expense Entry', view: 'expenses', icon: Fuel, color: 'hover:bg-amber-600 hover:text-white' },
            { label: 'Book Maintenance', view: 'maintenance', icon: Settings, color: 'hover:bg-cyan-600 hover:text-white' },
            { label: 'Generate Reports', view: 'reports', icon: BarChart3, color: 'hover:bg-purple-600 hover:text-white' }
          ].map((act, idx) => {
            const Icon = act.icon;
            return (
              <button
                key={idx}
                onClick={() => onNavigate(act.view)}
                className={`flex items-center gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 text-xs font-semibold text-slate-650 dark:text-slate-350 transition-all duration-200 hover:-translate-y-0.5 shadow-sm hover:shadow-md ${act.color}`}
              >
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/10">
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <span className="text-left leading-tight">{act.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. ANALYTICS GRID (Trips Line & Operating Cost breakdown Donut) */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Weekly Completed Trips Chart */}
        <div className="glass p-6 rounded-3xl border border-slate-200/50 dark:border-white/5 bg-white/70 dark:bg-slate-900/60 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-xs uppercase font-extrabold text-indigo-600 dark:text-indigo-400 tracking-wider">Dispatch Volume</span>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">Completed Trips by Day</h3>
            </div>
            <BarChart3 className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="pt-2">
            <LineChart data={lineChartData} />
          </div>
        </div>

        {/* Operating Cost breakdown Donut */}
        <div className="glass p-6 rounded-3xl border border-slate-200/50 dark:border-white/5 bg-white/70 dark:bg-slate-900/60 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs uppercase font-extrabold text-indigo-600 dark:text-indigo-400 tracking-wider">Operating Expenses</span>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">Fuel vs Maintenance Ledger</h3>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
              Total: ${loading ? '...' : data?.stats.financials.totalOperationalCost.toLocaleString()}
            </span>
          </div>
          <div className="pt-2 flex-grow flex items-center">
            <DonutChart data={donutChartData} />
          </div>
        </div>

      </div>

      {/* 6. FLEET ASSET HEALTH & COMPLIANCE SUMMARY */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Fleet Health circular indicator */}
        <div className="glass p-6 rounded-3xl border border-slate-200/50 dark:border-white/5 bg-white/70 dark:bg-slate-900/60 flex flex-col justify-between min-h-[220px]">
          <div>
            <span className="text-xs uppercase font-extrabold text-indigo-600 dark:text-indigo-400 tracking-wider block mb-4">Fleet Asset Health</span>
            
            <div className="flex items-center gap-6">
              {/* Circular Gauge */}
              <div className="relative w-24 h-24 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full">
                  <path
                    className="text-slate-100 dark:text-slate-800"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-emerald-500"
                    strokeWidth="3.5"
                    strokeDasharray="95, 100"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center font-extrabold">
                  <span className="text-lg">95%</span>
                  <span className="text-[7px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Healthy</span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-slate-500 dark:text-slate-400">Engine & drivetrain: 96%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-slate-500 dark:text-slate-400">Electrical systems: 89%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span className="text-slate-500 dark:text-slate-400">Tires & Brakes: 92%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Asset Distribution List */}
        <div className="glass p-6 rounded-3xl border border-slate-200/50 dark:border-white/5 bg-white/70 dark:bg-slate-900/60 lg:col-span-2 flex flex-col justify-between">
          <span className="text-xs uppercase font-extrabold text-indigo-600 dark:text-indigo-400 tracking-wider block mb-4">
            Fleet Asset Distribution
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Available Vehicles', val: data?.stats.vehicles.available ?? 0, color: 'text-emerald-500' },
              { label: 'Vehicles On Trip', val: data?.stats.vehicles.onTrip ?? 0, color: 'text-indigo-500' },
              { label: 'Maintenance Shop', val: data?.stats.vehicles.inShop ?? 0, color: 'text-amber-500' },
              { label: 'Suspended Drivers', val: data?.stats.drivers.suspended ?? 0, color: 'text-red-500' }
            ].map((dist, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850 text-center">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block mb-1">{dist.label}</span>
                <span className={`text-2xl font-black ${dist.color}`}>{dist.val}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => onNavigate('trips')}
            className="w-full py-2.5 mt-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-indigo-600 hover:text-white transition-colors duration-150 text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-1"
          >
            <span>Open Dispatch Board</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

    </div>
  );
}

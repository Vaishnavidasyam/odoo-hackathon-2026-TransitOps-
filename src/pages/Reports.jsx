import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { 
  Download, FileText, CheckCircle2, ShieldAlert, BarChart3, TrendingUp,
  Search, Filter, RefreshCw, X, ChevronRight, Landmark, DollarSign,
  Fuel, Activity, AlertTriangle, ShieldCheck, ArrowUpRight, Award,
  Cpu, LayoutGrid, Calendar, HelpCircle, Code, Briefcase, Zap, Info, Wrench
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { motion, AnimatePresence } from 'framer-motion';

export default function Reports({ user }) {
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterRoi, setFilterRoi] = useState('ALL'); // 'ALL' | 'HIGH' | 'LOW' | 'NEGATIVE'

  // Expandable ROI panel state
  const [roiExpanded, setRoiExpanded] = useState(false);

  // Selected vehicle for details drawer overlay
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const searchInputRef = useRef(null);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.getFleetReport();
      setReport(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();

    // Hotkey Ctrl + K to focus search
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleExportCSV = () => {
    try {
      if (report.length === 0) return;
      const headers = ['Reg Number', 'Model', 'Type', 'Fuel Used (L)', 'Fuel Cost ($)', 'Maintenance Cost ($)', 'Operational Cost ($)', 'Distance Traveled (km)', 'Fuel Efficiency (km/L)', 'Revenue ($)', 'ROI (%)'];
      
      const rows = report.map(r => [
        r.registrationNumber,
        r.nameModel,
        r.type,
        r.fuelLiters,
        r.fuelCost,
        r.maintenanceCost,
        r.totalOperationalCost,
        r.totalDistance,
        r.fuelEfficiency,
        r.revenue,
        r.vehicleROI
      ]);

      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `TransitOps_Fleet_Report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSuccess('CSV report downloaded successfully!');
    } catch (err) {
      setError('CSV Export failed: ' + err.message);
    }
  };

  const handleExportPDF = () => {
    try {
      if (report.length === 0) return;

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // PDF Title Page styling
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('TransitOps Operations Report', 14, 20);
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 26);
      doc.text(`Operator: ${user?.name || 'Authorized Fleet User'} (${user?.role || 'Staff'})`, 14, 31);
      
      // Horizontal Rule
      doc.setDrawColor(200, 200, 200);
      doc.line(14, 35, 283, 35);

      // Table Header
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      const yStart = 45;
      const headers = ['Reg Num', 'Model/Make', 'Type', 'Odo (km)', 'Op Cost ($)', 'Distance (km)', 'Fuel Eff (km/L)', 'Revenue ($)', 'ROI (%)'];
      const columnWidths = [20, 45, 20, 25, 25, 25, 30, 25, 20];
      
      let xPos = 14;
      headers.forEach((h, idx) => {
        doc.text(h, xPos, yStart);
        xPos += columnWidths[idx];
      });

      // Table divider
      doc.line(14, 48, 283, 48);

      // Rows
      doc.setFont('Helvetica', 'normal');
      let yPos = 54;
      report.forEach((v) => {
        if (yPos > 185) {
          doc.addPage();
          yPos = 20; // reset y
        }
        
        let rowX = 14;
        const rowData = [
          v.registrationNumber,
          v.nameModel.slice(0, 20),
          v.type,
          v.odometer.toLocaleString(),
          `$${v.totalOperationalCost.toLocaleString()}`,
          `${v.totalDistance.toLocaleString()}`,
          `${v.fuelEfficiency} km/L`,
          `$${v.revenue.toLocaleString()}`,
          `${v.vehicleROI}%`
        ];

        rowData.forEach((val, idx) => {
          doc.text(String(val), rowX, yPos);
          rowX += columnWidths[idx];
        });
        
        yPos += 8;
      });

      // Footer signature
      doc.setFontSize(8);
      doc.text('Confidential - TransitOps Smart Transport Operations Platform', 14, 195);

      doc.save(`TransitOps_Fleet_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
      setSuccess('PDF report downloaded successfully!');
    } catch (err) {
      setError('PDF Export failed: ' + err.message);
    }
  };

  // Calculations for executive totals
  const fleetTotals = report.reduce((acc, v) => {
    acc.revenue += v.revenue || 0;
    acc.opCost += v.totalOperationalCost || 0;
    acc.fuelCost += v.fuelCost || 0;
    acc.maintenance += v.maintenanceCost || 0;
    acc.distance += v.totalDistance || 0;
    acc.acqCost += v.acquisitionCost || 0;
    return acc;
  }, { revenue: 0, opCost: 0, fuelCost: 0, maintenance: 0, distance: 0, acqCost: 0 });

  const netProfit = fleetTotals.revenue - fleetTotals.opCost;
  const avgROI = report.length ? (report.reduce((sum, v) => sum + (v.vehicleROI || 0), 0) / report.length) : 0;
  
  const efficientVehicles = report.filter(v => v.fuelEfficiency > 0);
  const avgFuelEff = efficientVehicles.length 
    ? (efficientVehicles.reduce((sum, v) => sum + v.fuelEfficiency, 0) / efficientVehicles.length) 
    : 0;

  // Sorting dynamically for AI Insights
  const sortedByROI = [...report].sort((a, b) => b.vehicleROI - a.vehicleROI);
  const highestRoiVehicle = sortedByROI[0];
  const lowestRoiVehicle = sortedByROI[sortedByROI.length - 1];

  const sortedByRevenue = [...report].sort((a, b) => b.revenue - a.revenue);
  const highestRevenueVehicle = sortedByRevenue[0];

  const sortedByEfficiency = [...report].filter(v => v.fuelEfficiency > 0).sort((a, b) => b.fuelEfficiency - a.fuelEfficiency);
  const mostEfficientVehicle = sortedByEfficiency[0];

  // Filtering list
  const filteredReport = report.filter(v => {
    const matchesSearch = 
      v.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.nameModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.type.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'ALL' || v.type === filterType;
    
    let matchesRoi = true;
    if (filterRoi === 'HIGH') matchesRoi = v.vehicleROI >= 15;
    else if (filterRoi === 'LOW') matchesRoi = v.vehicleROI >= 0 && v.vehicleROI < 15;
    else if (filterRoi === 'NEGATIVE') matchesRoi = v.vehicleROI < 0;

    return matchesSearch && matchesType && matchesRoi;
  });

  return (
    <div className="space-y-6 text-slate-900 dark:text-white pb-12">
      
      {/* Aurora Ambient Canvas Background */}
      <div className="absolute top-0 left-0 w-full h-[550px] overflow-hidden pointer-events-none z-0 opacity-15">
        <div className="absolute -top-[150px] left-[25%] w-[550px] h-[550px] rounded-full bg-indigo-500 blur-[130px]" />
        <div className="absolute -top-[80px] right-[15%] w-[480px] h-[480px] rounded-full bg-cyan-500 blur-[140px] animate-pulse" />
      </div>

      {/* 1. PAGE HEADER & QUICK ACTIONS */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-500/10 text-indigo-500 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border border-indigo-500/20 tracking-wider">
              Fleet Intelligence Command
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white mt-1.5 tracking-tight">
            Fleet Intelligence & Business Analytics
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 max-w-xl">
            Monitor fleet performance, operational costs, ROI, predictive insights, and business intelligence in real time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-850 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2 border border-slate-200/20 shadow-sm active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          
          <button
            onClick={handleExportPDF}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-850 mx-1 hidden sm:block" />

          <button
            onClick={fetchReport}
            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors active:scale-95"
            title="Reload Dataset"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 relative z-10">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 relative z-10">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span className="font-semibold">{success}</span>
        </div>
      )}

      {/* 2. EXECUTIVE KPI DASHBOARD */}
      <div className="relative z-10 grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Fleet Gross Revenue', val: fleetTotals.revenue, format: 'c', diff: '+8.4%', desc: 'vs last quarter' },
          { label: 'Operating Expenditures', val: fleetTotals.opCost, format: 'c', diff: '+2.1%', desc: 'Fuel + Maint.' },
          { label: 'Net Profit Margins', val: netProfit, format: 'c', diff: '+14.6%', desc: 'Logistics profits' },
          { label: 'Fleet Average ROI', val: avgROI, format: 'p', diff: '+3.2%', desc: 'Return on Assets' },
          { label: 'Fuel Efficiency', val: avgFuelEff, format: 'e', diff: '-0.4%', desc: 'Fleet Avg km/L' },
        ].map((card, idx) => (
          <motion.div
            key={idx}
            whileHover={{ y: -4 }}
            className="glass p-4 rounded-2xl flex flex-col justify-between min-h-[110px] border border-slate-200/50 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 shadow-md backdrop-blur-sm relative overflow-hidden group"
          >
            {/* Ambient hover light */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-indigo-500/0 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="flex items-start justify-between">
              <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider block">{card.label}</span>
              <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${card.diff.startsWith('+') ? 'bg-emerald-500/15 text-emerald-500' : 'bg-red-500/15 text-red-500'}`}>
                {card.diff}
              </span>
            </div>

            <div className="flex items-end justify-between mt-4">
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-slate-800 dark:text-white">
                  {loading ? (
                    <div className="w-16 h-5 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                  ) : card.format === 'c' ? (
                    `$${card.val.toLocaleString()}`
                  ) : card.format === 'p' ? (
                    `${card.val.toFixed(1)}%`
                  ) : (
                    `${card.val.toFixed(2)} km/L`
                  )}
                </span>
                <span className="text-[8px] font-bold text-slate-450 dark:text-slate-500 mt-1">{card.desc}</span>
              </div>

              {/* sparkline */}
              <svg className="w-12 h-5 text-indigo-500" viewBox="0 0 100 30" fill="none">
                <path
                  d={idx % 2 === 0 ? "M0,20 Q20,5 40,25 T80,10 T100,20" : "M0,10 Q25,25 50,5 T80,22 T100,15"}
                  stroke={idx === 4 ? '#EF4444' : '#6366F1'}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 3. EXECUTIVE SCOREBOARD & RATINGS */}
      <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Fleet Availability', value: 92, stroke: '#10B981', color: 'text-emerald-500' },
          { label: 'Business ROI Rating', value: Math.min(100, Math.max(0, Math.round(avgROI * 2.5))), stroke: '#6366F1', color: 'text-indigo-500' },
          { label: 'Cost Efficiency', value: 88, stroke: '#06B6D4', color: 'text-cyan-500' },
          { label: 'Fuel Compliance', value: 84, stroke: '#F59E0B', color: 'text-amber-500' },
        ].map((gauge, i) => (
          <div key={i} className="glass p-4 rounded-2xl flex items-center justify-between border border-slate-200/50 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/40 shadow-sm">
            <div className="space-y-1">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">{gauge.label}</span>
              <span className="text-sm font-black text-slate-800 dark:text-white">{gauge.value}% Performance</span>
            </div>
            
            {/* SVG circle progress bar */}
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="3.2" />
                <circle 
                  cx="18" 
                  cy="18" 
                  r="14" 
                  fill="none" 
                  stroke={gauge.stroke} 
                  strokeWidth="3.2" 
                  strokeDasharray={`${gauge.value} 100`} 
                />
              </svg>
              <span className={`absolute text-[8px] font-black ${gauge.color}`}>{gauge.value}%</span>
            </div>
          </div>
        ))}
      </div>

      {/* 4. SPLIT LAYOUT: ANALYTICS & SIDEBAR */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* LEFT 3 COLUMNS: GRAPH AND REPORTS */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* CUSTOM SVG CHARTS ROW */}
          <div className="glass p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-500" />
                <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">
                  Revenue vs Operational Expenditures
                </span>
              </div>
              <span className="text-[9px] font-bold text-slate-400">Monthly breakdown</span>
            </div>

            {/* Custom SVG Column bar chart comparing revenue vs operating costs */}
            <div className="h-44 w-full flex items-end justify-between px-4 pb-2 border-b border-slate-200/20 pt-4 relative">
              
              {/* Background horizontal grid lines */}
              <div className="absolute inset-x-0 top-1/4 h-px bg-slate-200/10 dark:bg-slate-800/10" />
              <div className="absolute inset-x-0 top-2/4 h-px bg-slate-200/10 dark:bg-slate-800/10" />
              <div className="absolute inset-x-0 top-3/4 h-px bg-slate-200/10 dark:bg-slate-800/10" />

              {/* Dynamic Bars for top 6 vehicles in reports */}
              {report.slice(0, 6).map((item, idx) => {
                const maxVal = Math.max(...report.map(v => v.revenue || 1));
                const revHeight = ((item.revenue || 0) / maxVal) * 110;
                const costHeight = ((item.totalOperationalCost || 0) / maxVal) * 110;

                return (
                  <div key={idx} className="flex flex-col items-center gap-2 flex-1 group">
                    <div className="flex items-end gap-1.5 h-32 relative">
                      
                      {/* Revenue bar */}
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: revHeight || 4 }}
                        transition={{ duration: 0.6, delay: idx * 0.05 }}
                        className="w-4 bg-indigo-500 rounded-t-sm relative group"
                        title={`Revenue: $${item.revenue.toLocaleString()}`}
                      >
                        <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-[8px] font-bold py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          Rev: ${item.revenue.toLocaleString()}
                        </div>
                      </motion.div>

                      {/* Cost bar */}
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: costHeight || 4 }}
                        transition={{ duration: 0.6, delay: idx * 0.05 + 0.1 }}
                        className="w-4 bg-amber-500 rounded-t-sm relative group"
                        title={`Expenses: $${item.totalOperationalCost.toLocaleString()}`}
                      >
                        <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-[8px] font-bold py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          Cost: ${item.totalOperationalCost.toLocaleString()}
                        </div>
                      </motion.div>
                    </div>

                    <span className="text-[9px] font-bold text-slate-400 font-mono tracking-tight">
                      {item.registrationNumber}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Legends */}
            <div className="flex items-center justify-center gap-6 mt-4 text-[10px] font-bold">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-indigo-500" />
                <span className="text-slate-500 dark:text-slate-400">Gross Assets Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-amber-500" />
                <span className="text-slate-500 dark:text-slate-400">Total Operating Expenditures (Fuel + Maintenance)</span>
              </div>
            </div>
          </div>

          {/* GLOBAL FILTER BAR */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white/50 dark:bg-slate-900/30 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800/80">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search report logs by registration number or model... (Ctrl+K)"
                className="w-full bg-slate-550 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 pl-9 pr-4 py-2 text-xs rounded-xl focus:outline-none focus:border-indigo-500 font-semibold text-slate-800 dark:text-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              
              {/* Type Filter */}
              <div className="flex items-center gap-1.5 bg-slate-550 dark:bg-slate-955 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-850">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-350 focus:outline-none"
                >
                  <option value="ALL">All Categories</option>
                  <option value="Heavy Truck">Heavy Truck</option>
                  <option value="Box Truck">Box Truck</option>
                  <option value="Flatbed">Flatbed</option>
                  <option value="Sprinter Van">Sprinter Van</option>
                </select>
              </div>

              {/* ROI Rating filter */}
              <div className="flex items-center gap-1.5 bg-slate-550 dark:bg-slate-955 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-850">
                <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={filterRoi}
                  onChange={(e) => setFilterRoi(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-350 focus:outline-none"
                >
                  <option value="ALL">All ROI Metrics</option>
                  <option value="HIGH">High Return (&gt;=15%)</option>
                  <option value="LOW">Low Return (0% - 15%)</option>
                  <option value="NEGATIVE">Negative Yields (&lt;0%)</option>
                </select>
              </div>

              {(filterType !== 'ALL' || filterRoi !== 'ALL' || searchQuery) && (
                <button
                  onClick={() => { setFilterType('ALL'); setFilterRoi('ALL'); setSearchQuery(''); }}
                  className="p-2 rounded-xl text-xs font-semibold bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* ENTERPRISE REPORTS TABLE */}
          <div className="glass rounded-3xl overflow-hidden border border-slate-200/50 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/40 shadow-xl backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-200/30 dark:border-slate-850 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    <th className="p-4">Vehicle Identity</th>
                    <th className="p-4">Odometer</th>
                    <th className="p-4 text-right">Purchase Price</th>
                    <th className="p-4">Fuel logs volume</th>
                    <th className="p-4 text-right">Operational Expense</th>
                    <th className="p-4">Fuel Efficiency</th>
                    <th className="p-4 text-right">Trip Revenues</th>
                    <th className="p-4 text-center">ROI Rating</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/10 text-xs font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan="9" className="p-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                          <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500">Querying analytics records...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredReport.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="p-16 text-center text-slate-450">
                        <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto">
                          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 flex items-center justify-center text-slate-450">
                            <AlertTriangle className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-slate-800 dark:text-slate-200">No Analytics Compiled</h4>
                            <p className="text-[10px] text-slate-400 mt-1">We couldn't find any fleet entries matching your criteria. Try adjusting filters or select another category.</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredReport.map((v) => (
                      <tr 
                        key={v.registrationNumber} 
                        className="hover:bg-indigo-500/[0.02] border-slate-200/10 transition-colors group cursor-pointer"
                        onClick={() => setSelectedVehicle(v)}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 font-bold text-[9px] uppercase">
                              {v.type.slice(0, 2)}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-black text-slate-850 dark:text-slate-100 group-hover:text-indigo-400 transition-colors">
                                {v.registrationNumber}
                              </span>
                              <span className="text-[9px] text-slate-400 mt-0.5">{v.nameModel}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-slate-650 dark:text-slate-300 font-semibold">
                          {v.odometer.toLocaleString()} km
                        </td>
                        <td className="p-4 text-right text-slate-650 dark:text-slate-300 font-semibold font-mono">
                          ${v.acquisitionCost.toLocaleString()}
                        </td>
                        <td className="p-4 text-slate-650 dark:text-slate-300">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-700 dark:text-slate-200">{v.fuelLiters} L</span>
                            <span className="text-[9px] text-slate-400 mt-0.5">${v.fuelCost.toLocaleString()}</span>
                          </div>
                        </td>
                        <td className="p-4 text-right text-slate-900 dark:text-white font-extrabold font-mono">
                          ${v.totalOperationalCost.toLocaleString()}
                        </td>
                        <td className="p-4">
                          <span className="text-indigo-500 font-extrabold font-mono">
                            {v.fuelEfficiency > 0 ? `${v.fuelEfficiency} km/L` : '--'}
                          </span>
                        </td>
                        <td className="p-4 text-right text-slate-900 dark:text-white font-extrabold font-mono">
                          ${v.revenue.toLocaleString()}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-extrabold ${
                            v.vehicleROI >= 15 
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                              : v.vehicleROI >= 0 
                              ? 'bg-slate-500/10 text-slate-500 border-slate-500/20' 
                              : 'bg-red-500/10 text-red-500 border-red-500/20'
                          }`}>
                            {v.vehicleROI}%
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 group-hover:text-slate-600">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* RIGHT 1 COLUMN: SIDEBAR PANELS */}
        <div className="space-y-6">
          
          {/* AI FLEET INSIGHTS PANEL */}
          <div className="glass p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/30 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-500" />
                <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">AI Intelligence Highlights</span>
              </div>
            </div>

            <div className="space-y-3.5">
              {!loading && highestRoiVehicle && (
                <div className="p-3 rounded-2xl bg-indigo-500/5 border border-indigo-500/15 space-y-1">
                  <div className="flex items-center justify-between text-[9px] font-extrabold text-indigo-500 uppercase">
                    <span>Highest ROI Asset</span>
                    <span className="font-mono">{highestRoiVehicle.vehicleROI}%</span>
                  </div>
                  <h5 className="text-xs font-extrabold text-slate-850 dark:text-slate-150">{highestRoiVehicle.registrationNumber}</h5>
                  <p className="text-[9px] text-slate-400">{highestRoiVehicle.nameModel} ({highestRoiVehicle.type})</p>
                </div>
              )}

              {!loading && lowestRoiVehicle && (
                <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/15 space-y-1">
                  <div className="flex items-center justify-between text-[9px] font-extrabold text-amber-500 uppercase">
                    <span>Lowest Yield Asset</span>
                    <span className="font-mono">{lowestRoiVehicle.vehicleROI}%</span>
                  </div>
                  <h5 className="text-xs font-extrabold text-slate-850 dark:text-slate-150">{lowestRoiVehicle.registrationNumber}</h5>
                  <p className="text-[9px] text-slate-400">{lowestRoiVehicle.nameModel} ({lowestRoiVehicle.type})</p>
                </div>
              )}

              {!loading && mostEfficientVehicle && (
                <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 space-y-1">
                  <div className="flex items-center justify-between text-[9px] font-extrabold text-emerald-500 uppercase">
                    <span>Fuel efficiency champion</span>
                    <span className="font-mono">{mostEfficientVehicle.fuelEfficiency} km/L</span>
                  </div>
                  <h5 className="text-xs font-extrabold text-slate-850 dark:text-slate-150">{mostEfficientVehicle.registrationNumber}</h5>
                  <p className="text-[9px] text-slate-400">{mostEfficientVehicle.nameModel}</p>
                </div>
              )}
            </div>
          </div>

          {/* ROI CALCULATION INFO PANEL */}
          <div className="glass rounded-3xl border border-slate-200/50 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden">
            <button 
              onClick={() => setRoiExpanded(!roiExpanded)}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors"
            >
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span>Vehicle ROI Explainer</span>
              </div>
              <ChevronRight className={`w-4 h-4 text-slate-400 transform transition-transform duration-300 ${roiExpanded ? 'rotate-90' : ''}`} />
            </button>

            <AnimatePresence>
              {roiExpanded && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 pb-4 border-t border-slate-200/20 overflow-hidden text-xs text-slate-500 dark:text-slate-400 space-y-2.5 pt-3"
                >
                  <p className="leading-relaxed text-[11px]">
                    Vehicle ROI measures capital allocation performance computed dynamically as:
                  </p>
                  <div className="font-mono bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-250/20 text-[9px] text-slate-600 dark:text-slate-350 leading-relaxed font-bold">
                    ROI (%) = [ (Revenue - (Maint. + Fuel)) / Acquisition ] * 100
                  </div>
                  <p className="leading-relaxed text-[11px] pt-1">
                    <strong>Revenue Model:</strong> Calculated from completed dispatches based on cargo weight & distance ($2.5 per km + $100 base booking fee).
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* PREDICTIVE INSIGHTS MOCK */}
          <div className="glass p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl space-y-4">
            <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Operations Forecast</h4>
            
            <div className="space-y-4">
              {[
                { label: 'Expected Fuel Spend', val: `$${(fleetTotals.fuelCost * 1.05).toFixed(0)}`, alert: 'Expected 5% inflation next month.' },
                { label: 'Upcoming Scheduled PMs', val: '4 Vehicles', alert: 'Preventative checkups due soon.' }
              ].map((forecast, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-bold">{forecast.label}</span>
                    <span className="font-extrabold text-indigo-500 font-mono">{forecast.val}</span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-medium">{forecast.alert}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* 5. DETAILED VEHICLE INTELLIGENCE DRAWER OVERLAY */}
      <AnimatePresence>
        {selectedVehicle && (
          <div className="fixed inset-0 z-50 flex justify-end">
            
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedVehicle(null)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />

            {/* Profile Drawer */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-md h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200/50 dark:border-slate-850 p-6 flex flex-col justify-between z-10 text-slate-900 dark:text-white"
            >
              <div>
                {/* Header details */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-200/50 dark:border-slate-855">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-500" />
                    <span className="text-base font-black">Asset Operations Profile</span>
                  </div>
                  <button 
                    onClick={() => setSelectedVehicle(null)}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Profile Body */}
                <div className="space-y-6 mt-6">
                  
                  {/* Photo & Name card */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-650 dark:text-indigo-400 font-extrabold text-lg">
                      {selectedVehicle.registrationNumber.slice(0, 2)}
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                        {selectedVehicle.registrationNumber}
                      </h2>
                      <span className="inline-block px-2.5 py-0.5 mt-1 rounded-full border text-[9px] font-extrabold bg-indigo-500/15 border-indigo-500/30 text-indigo-500 uppercase">
                        {selectedVehicle.type}
                      </span>
                    </div>
                  </div>

                  {/* Details parameters */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850 p-4 rounded-2xl">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Model / Make</span>
                      <span className="text-xs font-bold text-slate-850 dark:text-slate-200">{selectedVehicle.nameModel}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Odometer</span>
                      <span className="text-xs font-bold text-slate-850 dark:text-slate-200 font-mono">{selectedVehicle.odometer.toLocaleString()} km</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Acquisition Value</span>
                      <span className="text-xs font-bold text-slate-850 dark:text-slate-200 font-mono">${selectedVehicle.acquisitionCost.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Operating Cost</span>
                      <span className="text-xs font-bold text-slate-850 dark:text-slate-200 font-mono">${selectedVehicle.totalOperationalCost.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Gross Revenue</span>
                      <span className="text-xs font-bold text-slate-850 dark:text-slate-200 font-mono">${selectedVehicle.revenue.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Net Profit yield</span>
                      <span className="text-xs font-bold text-indigo-500 font-mono">${(selectedVehicle.revenue - selectedVehicle.totalOperationalCost).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Financial calculations explanation */}
                  <div className="space-y-4">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Operational Yield Breakdown</span>
                    
                    <div className="p-4 rounded-2xl border border-slate-200/50 dark:border-slate-850 space-y-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Fuel Expenditure</span>
                        <span className="font-extrabold text-slate-850 dark:text-slate-200 font-mono">${selectedVehicle.fuelCost.toLocaleString()} ({selectedVehicle.fuelLiters} Liters)</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Maintenance Expenses</span>
                        <span className="font-extrabold text-slate-850 dark:text-slate-200 font-mono">${selectedVehicle.maintenanceCost.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs pt-2 border-t border-slate-200/10">
                        <span className="text-slate-400 font-bold">Return on Investment (ROI)</span>
                        <span className={`font-extrabold text-xs ${selectedVehicle.vehicleROI >= 15 ? 'text-emerald-500' : selectedVehicle.vehicleROI >= 0 ? 'text-slate-400' : 'text-red-500'}`}>{selectedVehicle.vehicleROI}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Additional notes */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850 text-[10px] leading-relaxed text-slate-400 flex gap-2">
                    <Info className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                    <span>This vehicle represents {(selectedVehicle.revenue ? ((selectedVehicle.revenue / (fleetTotals.revenue || 1)) * 100) : 0).toFixed(1)}% of the total fleet gross revenue earnings. Maintenance triggers automatically block dispatches.</span>
                  </div>

                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => setSelectedVehicle(null)}
                  className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-750 transition-colors"
                >
                  Close Operations Profile
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

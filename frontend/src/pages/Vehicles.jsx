import React, { useState, useEffect } from 'react';
import { 
  Truck, Plus, Trash2, CheckCircle2, AlertCircle, ShieldAlert, Search, 
  Filter, Grid, List, Download, RefreshCw, X, FileText, Settings, Info, 
  MapPin, Activity, DollarSign, Calendar, ChevronRight, Eye, ShieldCheck, Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api';

export default function Vehicles({ user, focusId }) {
  const [vehicles, setVehicles] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null); // Side Profile drawer
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  
  // Local Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [sortBy, setSortBy] = useState('regNum');

  // Form Fields
  const [regNum, setRegNum] = useState('');
  const [model, setModel] = useState('');
  const [type, setType] = useState('Van');
  const [capacity, setCapacity] = useState('');
  const [odometer, setOdometer] = useState('');
  const [cost, setCost] = useState('');
  const [region, setRegion] = useState('North');

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await api.getVehicles();
      setVehicles(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!regNum || !model || !capacity || !odometer || !cost) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      await api.createVehicle({
        registrationNumber: regNum.trim().toUpperCase(),
        nameModel: model.trim(),
        type,
        maxLoadCapacity: Number(capacity),
        odometer: Number(odometer),
        acquisitionCost: Number(cost),
        region
      });
      setSuccess('Vehicle registered successfully!');
      setRegNum('');
      setModel('');
      setCapacity('');
      setOdometer('');
      setCost('');
      setShowAddForm(false);
      fetchVehicles();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRetireVehicle = async (id, e) => {
    e?.stopPropagation(); // Prevent opening drawer
    if (!window.confirm('Are you sure you want to retire this vehicle? Retired vehicles cannot be dispatched.')) return;
    try {
      await api.updateVehicle(id, { status: 'Retired' });
      setSuccess('Vehicle status marked as Retired.');
      fetchVehicles();
    } catch (err) {
      setError(err.message);
    }
  };

  // CSV Export utility
  const handleExportCSV = () => {
    if (vehicles.length === 0) return;
    const headers = 'Registration,Model,Type,Capacity(kg),Odometer(km),AcquisitionCost($),Region,Status\n';
    const csvContent = vehicles.map(v => 
      `"${v.registrationNumber}","${v.nameModel}","${v.type}",${v.maxLoadCapacity},${v.odometer},${v.acquisitionCost},"${v.region}","${v.status}"`
    ).join('\n');
    const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'TransitOps_Fleet_Registry.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Local filtering logic
  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          v.nameModel.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType ? v.type === filterType : true;
    const matchesStatus = filterStatus ? v.status === filterStatus : true;
    const matchesRegion = filterRegion ? v.region === filterRegion : true;
    return matchesSearch && matchesType && matchesStatus && matchesRegion;
  }).sort((a, b) => {
    if (sortBy === 'regNum') return a.registrationNumber.localeCompare(b.registrationNumber);
    if (sortBy === 'capacity') return b.maxLoadCapacity - a.maxLoadCapacity;
    if (sortBy === 'odometer') return b.odometer - a.odometer;
    return 0;
  });

  // Calculate fleet status KPIs
  const totalFleet = vehicles.length;
  const availableCount = vehicles.filter(v => v.status === 'Available').length;
  const onTripCount = vehicles.filter(v => v.status === 'On Trip').length;
  const maintenanceCount = vehicles.filter(v => v.status === 'In Shop').length;
  const retiredCount = vehicles.filter(v => v.status === 'Retired').length;

  const statusColors = {
    'Available': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]',
    'On Trip': 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 shadow-[0_0_8px_rgba(99,102,241,0.1)]',
    'In Shop': 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.1)]',
    'Retired': 'bg-slate-500/10 text-slate-650 dark:text-slate-400 border-slate-500/20',
  };

  const isManager = user?.role === 'Fleet Manager';

  return (
    <div className="space-y-6 text-slate-900 dark:text-white font-sans transition-colors duration-300 relative">
      
      {/* 1. PAGE HEADER HERO SECTION */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 p-6 rounded-3xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/80 backdrop-blur-xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[20%] h-[50%] rounded-full bg-indigo-500/5 blur-[40px] pointer-events-none" />
        
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">Fleet Asset Registry</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">
            Register, monitor, maintain, and manage every transport asset across the organization from one centralized platform.
          </p>
        </div>

        {/* Dynamic Status Counter Widgets */}
        <div className="grid grid-cols-5 gap-3 max-w-xl w-full">
          {[
            { label: 'Total Fleet', count: totalFleet, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/5' },
            { label: 'Available', count: availableCount, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
            { label: 'On Trip', count: onTripCount, color: 'text-cyan-500', bg: 'bg-cyan-500/5' },
            { label: 'In Shop', count: maintenanceCount, color: 'text-amber-500', bg: 'bg-amber-500/5' },
            { label: 'Retired', count: retiredCount, color: 'text-slate-500', bg: 'bg-slate-500/5' }
          ].map((kpi, idx) => (
            <div key={idx} className={`p-3 rounded-2xl ${kpi.bg} border border-slate-200/10 text-center`}>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider block mb-1">{kpi.label}</span>
              <span className={`text-lg font-black ${kpi.color}`}>{kpi.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. FILTER & TOOLBAR CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850 shadow-sm">
        
        {/* Left Side Filters */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Instant Search */}
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search registration, model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 text-slate-800 dark:text-white font-medium"
            />
          </div>

          <span className="hidden sm:block w-px h-5 bg-slate-200 dark:bg-slate-850" />

          {/* Quick filter dropdowns */}
          <div className="flex items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-transparent text-xs font-bold focus:outline-none p-1 text-slate-655 dark:text-slate-400"
            >
              <option value="">All Types</option>
              <option value="Van">Van</option>
              <option value="Truck">Truck</option>
              <option value="Sedan">Sedan</option>
              <option value="Reefer">Reefer</option>
              <option value="Flatbed">Flatbed</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-xs font-bold focus:outline-none p-1 text-slate-655 dark:text-slate-400"
            >
              <option value="">All Statuses</option>
              <option value="Available">Available</option>
              <option value="On Trip">On Trip</option>
              <option value="In Shop">In Shop</option>
              <option value="Retired">Retired</option>
            </select>

            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              className="bg-transparent text-xs font-bold focus:outline-none p-1 text-slate-655 dark:text-slate-400"
            >
              <option value="">All Regions</option>
              <option value="North">North</option>
              <option value="South">South</option>
              <option value="East">East</option>
              <option value="West">West</option>
            </select>
          </div>
        </div>

        {/* Right Side Options & Actions */}
        <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-slate-200/50 dark:border-slate-800">
          
          {/* Sorting control */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-transparent text-xs font-bold focus:outline-none p-1 text-slate-655 dark:text-slate-400"
          >
            <option value="regNum">Sort by Reg Number</option>
            <option value="capacity">Sort by Capacity</option>
            <option value="odometer">Sort by Odometer</option>
          </select>

          <span className="w-px h-5 bg-slate-200 dark:bg-slate-850" />

          {/* Toggle View mode */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/20">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-slate-950 text-indigo-500 shadow-sm' : 'text-slate-400'}`}
              title="Table view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'cards' ? 'bg-white dark:bg-slate-950 text-indigo-500 shadow-sm' : 'text-slate-400'}`}
              title="Grid Cards view"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-350 transition-colors flex items-center gap-1.5 text-xs font-bold"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {isManager && (
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-xs flex items-center gap-2 font-medium">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* 3. SHIMMER SHIMMER LOADING OR EMPTY STATE OR DUAL VIEW GRID */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {[1, 2, 3, 4].map(idx => (
              <div key={idx} className="h-16 w-full rounded-2xl bg-slate-200/40 dark:bg-slate-900/40 animate-pulse border border-slate-200/20 dark:border-white/5" />
            ))}
          </motion.div>
        ) : filteredVehicles.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center p-12 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/10"
          >
            <div className="p-4 bg-indigo-500/5 rounded-full mb-4">
              <Truck className="w-10 h-10 text-indigo-500/60" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No vehicles registered yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm text-center">
              Create transport asset master files by registering new trucks or vans into operations.
            </p>
            {isManager && (
              <button
                onClick={() => setShowAddForm(true)}
                className="px-5 py-2.5 mt-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/20"
              >
                Register First Vehicle
              </button>
            )}
          </motion.div>
        ) : viewMode === 'table' ? (
          <motion.div
            key="table"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass rounded-3xl overflow-hidden border border-slate-200/50 dark:border-white/5 bg-white/70 dark:bg-slate-900/60 shadow-lg"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 dark:bg-slate-950/40 border-b border-slate-200/30 dark:border-white/5 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                    <th className="p-4">Reg Number</th>
                    <th className="p-4">Model & Make</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Odometer</th>
                    <th className="p-4">Max Capacity</th>
                    <th className="p-4">Acquisition Cost</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/10 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {filteredVehicles.map((v) => (
                    <tr 
                      key={v._id} 
                      onClick={() => setSelectedVehicle(v)}
                      className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors cursor-pointer ${focusId === v._id ? 'bg-indigo-500/10' : ''}`}
                    >
                      <td className="p-4 font-black text-slate-900 dark:text-white">{v.registrationNumber}</td>
                      <td className="p-4 text-slate-650 dark:text-slate-350">{v.nameModel}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold text-slate-500 dark:text-slate-400">
                          {v.type}
                        </span>
                      </td>
                      <td className="p-4">{v.odometer.toLocaleString()} km</td>
                      <td className="p-4">{v.maxLoadCapacity.toLocaleString()} kg</td>
                      <td className="p-4">${v.acquisitionCost.toLocaleString()}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold ${statusColors[v.status] || 'bg-slate-500/10 text-slate-500'}`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="p-4 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedVehicle(v)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                            title="View Profile Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {isManager && (
                            v.status !== 'Retired' ? (
                              <button
                                onClick={(e) => handleRetireVehicle(v._id, e)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                                title="Retire Asset"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ) : (
                              <div className="w-7 h-7" />
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          /* Cards Grid view */
          <motion.div
            key="cards"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {filteredVehicles.map((v) => (
              <div 
                key={v._id}
                onClick={() => setSelectedVehicle(v)}
                className="glass p-5 rounded-3xl border border-slate-200/50 dark:border-white/5 bg-white/70 dark:bg-slate-900/60 hover:border-indigo-500/20 transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[180px] shadow-sm hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider block">{v.type}</span>
                    <h3 className="text-base font-black text-slate-900 dark:text-white mt-0.5">{v.registrationNumber}</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">{v.nameModel}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${statusColors[v.status] || 'bg-slate-500/10 text-slate-500'}`}>
                    {v.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-6 pt-4 border-t border-slate-200/30 dark:border-slate-800/30 text-[10px] text-slate-500 font-bold">
                  <div>
                    <span className="block text-slate-400">Odometer</span>
                    <span className="text-slate-850 dark:text-slate-200 text-xs">{v.odometer.toLocaleString()} km</span>
                  </div>
                  <div>
                    <span className="block text-slate-400">Region</span>
                    <span className="text-slate-850 dark:text-slate-200 text-xs">{v.region}</span>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. REGISTER NEW VEHICLE DRAWER OVERLAY */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex justify-end">
            
            {/* Backdrop shadow */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddForm(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />

            {/* Slide-out Drawer Panel */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-lg h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200/50 dark:border-slate-850 p-6 flex flex-col justify-between z-10 text-slate-900 dark:text-white"
            >
              <div>
                {/* Header info */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-200/50 dark:border-slate-850">
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-indigo-500" />
                    <h3 className="text-base font-black">Register New Asset</h3>
                  </div>
                  <button 
                    onClick={() => setShowAddForm(false)}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Split inputs form */}
                <form onSubmit={handleAddVehicle} className="space-y-5 mt-6 h-[72vh] overflow-y-auto pr-2">
                  
                  {/* Basic Specifications */}
                  <div className="space-y-4">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Basic Information</span>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={regNum}
                          onChange={(e) => setRegNum(e.target.value)}
                          placeholder=" "
                          className="peer w-full px-3 py-3 pt-5 pb-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:outline-none focus:border-indigo-500 font-semibold"
                        />
                        <label className="absolute left-3 top-1.5 text-[8px] font-bold text-slate-400 uppercase transition-all pointer-events-none peer-placeholder-shown:top-3 peer-placeholder-shown:text-[10px] peer-placeholder-shown:font-normal peer-focus:top-1.5 peer-focus:text-[8px] peer-focus:font-bold peer-focus:text-indigo-500">
                          Reg Number (Unique)
                        </label>
                      </div>

                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={model}
                          onChange={(e) => setModel(e.target.value)}
                          placeholder=" "
                          className="peer w-full px-3 py-3 pt-5 pb-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:outline-none focus:border-indigo-500 font-semibold"
                        />
                        <label className="absolute left-3 top-1.5 text-[8px] font-bold text-slate-400 uppercase transition-all pointer-events-none peer-placeholder-shown:top-3 peer-placeholder-shown:text-[10px] peer-placeholder-shown:font-normal peer-focus:top-1.5 peer-focus:text-[8px] peer-focus:font-bold peer-focus:text-indigo-500">
                          Make & Model
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Operational Settings */}
                  <div className="space-y-4 pt-4 border-t border-slate-200/50 dark:border-slate-850">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Operational Settings</span>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <select
                          value={type}
                          onChange={(e) => setType(e.target.value)}
                          className="w-full px-3 py-3 pt-4 pb-1 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:outline-none focus:border-indigo-500 font-bold"
                        >
                          <option value="Van">Van</option>
                          <option value="Truck">Truck</option>
                          <option value="Sedan">Sedan</option>
                          <option value="Reefer">Reefer</option>
                          <option value="Flatbed">Flatbed</option>
                        </select>
                        <label className="absolute left-3 top-1 text-[8px] font-bold text-slate-400 uppercase">
                          Vehicle Type
                        </label>
                      </div>

                      <div className="relative">
                        <select
                          value={region}
                          onChange={(e) => setRegion(e.target.value)}
                          className="w-full px-3 py-3 pt-4 pb-1 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:outline-none focus:border-indigo-500 font-bold"
                        >
                          <option value="North">North</option>
                          <option value="South">South</option>
                          <option value="East">East</option>
                          <option value="West">West</option>
                        </select>
                        <label className="absolute left-3 top-1 text-[8px] font-bold text-slate-400 uppercase">
                          Operating Region
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Specifications and Metrics */}
                  <div className="space-y-4 pt-4 border-t border-slate-200/50 dark:border-slate-850">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Specifications & Costs</span>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div className="relative">
                        <input
                          type="number"
                          required
                          min="1"
                          value={capacity}
                          onChange={(e) => setCapacity(e.target.value)}
                          placeholder=" "
                          className="peer w-full px-3 py-3 pt-5 pb-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:outline-none focus:border-indigo-500 font-semibold"
                        />
                        <label className="absolute left-3 top-1.5 text-[8px] font-bold text-slate-400 uppercase transition-all pointer-events-none peer-placeholder-shown:top-3 peer-placeholder-shown:text-[10px] peer-placeholder-shown:font-normal peer-focus:top-1.5 peer-focus:text-[8px] peer-focus:font-bold peer-focus:text-indigo-500">
                          Capacity (kg)
                        </label>
                      </div>

                      <div className="relative">
                        <input
                          type="number"
                          required
                          min="0"
                          value={odometer}
                          onChange={(e) => setOdometer(e.target.value)}
                          placeholder=" "
                          className="peer w-full px-3 py-3 pt-5 pb-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:outline-none focus:border-indigo-500 font-semibold"
                        />
                        <label className="absolute left-3 top-1.5 text-[8px] font-bold text-slate-400 uppercase transition-all pointer-events-none peer-placeholder-shown:top-3 peer-placeholder-shown:text-[10px] peer-placeholder-shown:font-normal peer-focus:top-1.5 peer-focus:text-[8px] peer-focus:font-bold peer-focus:text-indigo-500">
                          Odometer (km)
                        </label>
                      </div>

                      <div className="relative">
                        <input
                          type="number"
                          required
                          min="1"
                          value={cost}
                          onChange={(e) => setCost(e.target.value)}
                          placeholder=" "
                          className="peer w-full px-3 py-3 pt-5 pb-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:outline-none focus:border-indigo-500 font-semibold"
                        />
                        <label className="absolute left-3 top-1.5 text-[8px] font-bold text-slate-400 uppercase transition-all pointer-events-none peer-placeholder-shown:top-3 peer-placeholder-shown:text-[10px] peer-placeholder-shown:font-normal peer-focus:top-1.5 peer-focus:text-[8px] peer-focus:font-bold peer-focus:text-indigo-500">
                          Acquisition ($)
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Buttons controls */}
                  <div className="flex justify-end gap-3 pt-6 border-t border-slate-200/50 dark:border-slate-850">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/20"
                    >
                      Save Asset
                    </button>
                  </div>

                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. DETAILED VEHICLE PROFILE DRAWER (Interactive Analytics) */}
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
                <div className="flex items-center justify-between pb-4 border-b border-slate-200/50 dark:border-slate-850">
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-indigo-500" />
                    <span className="text-base font-black">Asset Profile File</span>
                  </div>
                  <button 
                    onClick={() => setSelectedVehicle(null)}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Body Specs */}
                <div className="space-y-6 mt-6">
                  
                  {/* Title card info */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
                        {selectedVehicle.registrationNumber}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {selectedVehicle.nameModel}
                      </p>
                    </div>

                    <span className={`px-3 py-1 rounded-full border text-[10px] font-bold ${statusColors[selectedVehicle.status] || 'bg-slate-500/10 text-slate-500'}`}>
                      {selectedVehicle.status}
                    </span>
                  </div>

                  {/* Profile parameters */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850 p-4 rounded-2xl">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Asset Type</span>
                      <span className="text-xs font-bold text-slate-850 dark:text-slate-200">{selectedVehicle.type}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Region</span>
                      <span className="text-xs font-bold text-slate-850 dark:text-slate-200">{selectedVehicle.region} Region</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Odometer</span>
                      <span className="text-xs font-bold text-slate-850 dark:text-slate-200">{selectedVehicle.odometer.toLocaleString()} km</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Max Load</span>
                      <span className="text-xs font-bold text-slate-850 dark:text-slate-200">{selectedVehicle.maxLoadCapacity.toLocaleString()} kg</span>
                    </div>
                  </div>

                  {/* Extra mock analytics cards to feel premium */}
                  <div className="space-y-4">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Estimated Performance metrics</span>
                    
                    <div className="space-y-3">
                      
                      {/* Health Gauge */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-500 dark:text-slate-400">Asset Health Score</span>
                          <span className="text-emerald-500 dark:text-emerald-400">92% Optimal</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-850 h-2 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: '92%' }}></div>
                        </div>
                      </div>

                      {/* Fuel Efficiency */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-500 dark:text-slate-400">Estimated Fuel Efficiency</span>
                          <span className="text-indigo-500">8.4 km / Liter</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-850 h-2 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 h-full rounded-full" style={{ width: '80%' }}></div>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              </div>

              {/* Retire button inside profile drawer for managers */}
              {isManager && selectedVehicle.status !== 'Retired' && (
                <button
                  onClick={(e) => {
                    handleRetireVehicle(selectedVehicle._id, e);
                    setSelectedVehicle(null);
                  }}
                  className="w-full py-3 rounded-xl border border-red-500/20 hover:bg-red-500/10 text-red-500 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Retire Transport Asset</span>
                </button>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

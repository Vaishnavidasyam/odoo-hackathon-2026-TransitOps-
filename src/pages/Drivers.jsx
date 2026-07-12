import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Upload, CheckCircle2, ShieldAlert, AlertTriangle, Eye, X, 
  Search, Filter, List, Grid, Download, RefreshCw, FileText, Settings, Info,
  ShieldCheck, Heart, User, Calendar, Phone, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api';

export default function Drivers({ user, focusId }) {
  const [drivers, setDrivers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null); // Side Profile drawer
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  
  // Local Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSafety, setFilterSafety] = useState(''); // 'Excellent' | 'Good' | 'Critical'
  const [sortBy, setSortBy] = useState('name');

  // Form Fields
  const [name, setName] = useState('');
  const [licNum, setLicNum] = useState('');
  const [licCat, setLicCat] = useState('Class A CDL');
  const [expiryDate, setExpiryDate] = useState('');
  const [contact, setContact] = useState('');
  const [safety, setSafety] = useState('100');

  // Document Upload details
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const [docName, setDocName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const res = await api.getDrivers();
      setDrivers(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleAddDriver = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name || !licNum || !expiryDate || !contact) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      await api.createDriver({
        name: name.trim(),
        licenseNumber: licNum.trim().toUpperCase(),
        licenseCategory: licCat,
        licenseExpiryDate: expiryDate,
        contactNumber: contact.trim(),
        safetyScore: Number(safety)
      });
      setSuccess('Driver profile registered successfully!');
      setName('');
      setLicNum('');
      setExpiryDate('');
      setContact('');
      setSafety('100');
      setShowAddForm(false);
      fetchDrivers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile({ name: file.name, size: (file.size / 1024 / 1024).toFixed(2) + ' MB' });
    setUploadProgress(0);
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    setDocName(baseName.replace(/[_-]/g, ' '));

    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 100);
  };

  const handleUploadDoc = async (e) => {
    e.preventDefault();
    if (!docName || !selectedFile) {
      setError('Please select a file to upload.');
      return;
    }
    if (uploadProgress < 100) {
      setError('Please wait for the upload to complete.');
      return;
    }

    try {
      await api.uploadDriverDoc(selectedDriverId, {
        name: docName,
        url: `/documents/${selectedFile.name.toLowerCase().replace(/\s+/g, '_')}`
      });
      setSuccess('Document uploaded successfully!');
      setDocName('');
      setSelectedFile(null);
      setUploadProgress(0);
      setSelectedDriverId(null);
      fetchDrivers();
    } catch (err) {
      setError(err.message);
    }
  };

  // CSV Export utility
  const handleExportCSV = () => {
    if (drivers.length === 0) return;
    const headers = 'Name,LicenseNumber,Category,ExpiryDate,Contact,SafetyScore,Status\n';
    const csvContent = drivers.map(d => 
      `"${d.name}","${d.licenseNumber}","${d.licenseCategory}","${d.licenseExpiryDate}","${d.contactNumber}",${d.safetyScore},"${d.status}"`
    ).join('\n');
    const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'TransitOps_Drivers_Profiles.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // License Expiry Checks
  const getExpiryWarning = (dateStr) => {
    const today = new Date();
    const expiry = new Date(dateStr);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return { label: 'Expired', style: 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse' };
    if (diffDays <= 30) return { label: `Expiring in ${diffDays}d`, style: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
    return null;
  };

  // Safety rating calculation
  const getSafetyLevel = (score) => {
    if (score >= 90) return { label: 'Excellent', style: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
    if (score >= 75) return { label: 'Good', style: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
    return { label: 'Critical', style: 'text-red-500 bg-red-500/10 border-red-500/20 animate-pulse' };
  };

  // Local filtering logic
  const filteredDrivers = drivers.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          d.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus ? d.status === filterStatus : true;
    const matchesCategory = filterCategory ? d.licenseCategory === filterCategory : true;
    
    // Safety score filters
    let matchesSafety = true;
    if (filterSafety === 'Excellent') matchesSafety = d.safetyScore >= 90;
    else if (filterSafety === 'Good') matchesSafety = d.safetyScore >= 75 && d.safetyScore < 90;
    else if (filterSafety === 'Critical') matchesSafety = d.safetyScore < 75;

    return matchesSearch && matchesStatus && matchesCategory && matchesSafety;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'safety') return b.safetyScore - a.safetyScore;
    if (sortBy === 'expiry') return new Date(a.licenseExpiryDate) - new Date(b.licenseExpiryDate);
    return 0;
  });

  // KPI aggregation
  const totalDrivers = drivers.length;
  const availableCount = drivers.filter(d => d.status === 'Available').length;
  const onTripCount = drivers.filter(d => d.status === 'On Trip').length;
  const offDutyCount = drivers.filter(d => d.status === 'Off Duty').length;
  const suspendedCount = drivers.filter(d => d.status === 'Suspended').length;

  const statusColors = {
    'Available': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]',
    'On Trip': 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 shadow-[0_0_8px_rgba(99,102,241,0.1)]',
    'Off Duty': 'bg-slate-500/10 text-slate-650 dark:text-slate-400 border-slate-200',
    'Suspended': 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  };

  const canEdit = user?.role === 'Fleet Manager' || user?.role === 'Safety Officer';

  return (
    <div className="space-y-6 text-slate-900 dark:text-white font-sans transition-colors duration-300 relative">
      
      {/* 1. PAGE HEADER HERO SECTION */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 p-6 rounded-3xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/80 backdrop-blur-xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[20%] h-[50%] rounded-full bg-indigo-500/5 blur-[40px] pointer-events-none" />
        
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">Driver Operations Center</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">
            Manage driver profiles, license compliance, certifications, safety performance, assignments, and operational readiness across your fleet.
          </p>
        </div>

        {/* Dynamic Status Counter Widgets */}
        <div className="grid grid-cols-5 gap-3 max-w-xl w-full">
          {[
            { label: 'Total active', count: totalDrivers, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/5' },
            { label: 'Available', count: availableCount, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
            { label: 'On Trip', count: onTripCount, color: 'text-cyan-500', bg: 'bg-cyan-500/5' },
            { label: 'Off Duty', count: offDutyCount, color: 'text-slate-500', bg: 'bg-slate-500/5' },
            { label: 'Suspended', count: suspendedCount, color: 'text-red-500', bg: 'bg-red-500/5' }
          ].map((kpi, idx) => (
            <div key={idx} className={`p-3 rounded-2xl ${kpi.bg} border border-slate-200/10 text-center`}>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider block mb-1">{kpi.label}</span>
              <span className={`text-lg font-black ${kpi.color}`}>{kpi.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. FILTER & TOOLBAR CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-855 shadow-sm">
        
        {/* Left Side Filters */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Instant Search */}
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, license ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 text-slate-800 dark:text-white font-medium"
            />
          </div>

          <span className="hidden sm:block w-px h-5 bg-slate-200 dark:bg-slate-850" />

          {/* Quick filter dropdowns */}
          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-xs font-bold focus:outline-none p-1 text-slate-655 dark:text-slate-400"
            >
              <option value="">All Statuses</option>
              <option value="Available">Available</option>
              <option value="On Trip">On Trip</option>
              <option value="Off Duty">Off Duty</option>
              <option value="Suspended">Suspended</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-transparent text-xs font-bold focus:outline-none p-1 text-slate-655 dark:text-slate-400"
            >
              <option value="">All License Categories</option>
              <option value="Class A CDL">Class A CDL</option>
              <option value="Class B CDL">Class B CDL</option>
              <option value="Class C Standard">Class C Standard</option>
            </select>

            <select
              value={filterSafety}
              onChange={(e) => setFilterSafety(e.target.value)}
              className="bg-transparent text-xs font-bold focus:outline-none p-1 text-slate-655 dark:text-slate-400"
            >
              <option value="">All Safety Levels</option>
              <option value="Excellent">Excellent (&ge; 90)</option>
              <option value="Good">Good (75-89)</option>
              <option value="Critical">Critical (&lt; 75)</option>
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
            <option value="name">Sort by Name</option>
            <option value="safety">Sort by Safety</option>
            <option value="expiry">Sort by Expiry</option>
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

          {canEdit && (
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

      {/* 3. GRID LAYOUT OR DUAL VIEW DATA PANEL */}
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
        ) : filteredDrivers.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center p-12 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/10"
          >
            <div className="p-4 bg-indigo-500/5 rounded-full mb-4">
              <Users className="w-10 h-10 text-indigo-500/60" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No drivers registered yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm text-center">
              Add commercial operators into your registry to assign trips and schedule maintenance.
            </p>
            {canEdit && (
              <button
                onClick={() => setShowAddForm(true)}
                className="px-5 py-2.5 mt-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/20"
              >
                Register First Driver
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
                    <th className="p-4">Name</th>
                    <th className="p-4">License Number</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Expiry Date</th>
                    <th className="p-4">Contact</th>
                    <th className="p-4">Safety Score</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/10 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {filteredDrivers.map((d) => {
                    const warn = getExpiryWarning(d.licenseExpiryDate);
                    const safetyLvl = getSafetyLevel(d.safetyScore);
                    return (
                      <tr 
                        key={d._id} 
                        onClick={() => setSelectedDriver(d)}
                        className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors cursor-pointer ${focusId === d._id ? 'bg-indigo-500/10' : ''}`}
                      >
                        <td className="p-4 font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-extrabold text-[10px]">
                            {d.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span>{d.name}</span>
                        </td>
                        <td className="p-4 text-slate-650 dark:text-slate-350 font-mono">{d.licenseNumber}</td>
                        <td className="p-4">{d.licenseCategory}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <span>{new Date(d.licenseExpiryDate).toLocaleDateString()}</span>
                            {warn && (
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border uppercase flex items-center gap-0.5 ${warn.style}`}>
                                <AlertTriangle className="w-2.5 h-2.5" />
                                {warn.label}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">{d.contactNumber}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold ${safetyLvl.style}`}>
                              {d.safetyScore} pts
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold ${statusColors[d.status] || 'bg-slate-500/10 text-slate-500'}`}>
                            {d.status}
                          </span>
                        </td>
                        <td className="p-4 text-right flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedDriver(d)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                            title="View Profile Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => setSelectedDriverId(d._id)}
                              className="p-1.5 rounded-lg hover:bg-indigo-500/10 text-indigo-500 transition-colors"
                              title="Attach Document"
                            >
                              <Upload className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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
            {filteredDrivers.map((d) => {
              const safetyLvl = getSafetyLevel(d.safetyScore);
              return (
                <div 
                  key={d._id}
                  onClick={() => setSelectedDriver(d)}
                  className="glass p-5 rounded-3xl border border-slate-200/50 dark:border-white/5 bg-white/70 dark:bg-slate-900/60 hover:border-indigo-500/20 transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[180px] shadow-sm hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-extrabold text-xs">
                        {d.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">{d.name}</h3>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block mt-0.5">{d.licenseCategory}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${statusColors[d.status] || 'bg-slate-500/10 text-slate-500'}`}>
                      {d.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-6 pt-4 border-t border-slate-200/30 dark:border-slate-800/30 text-[10px] text-slate-500 font-bold">
                    <div>
                      <span className="block text-slate-400">Safety Score</span>
                      <span className={`text-xs font-black ${safetyLvl.style.split(' ')[0]}`}>{d.safetyScore} pts</span>
                    </div>
                    <div>
                      <span className="block text-slate-400">License ID</span>
                      <span className="text-slate-850 dark:text-slate-200 text-xs font-mono">{d.licenseNumber}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. REGISTER NEW DRIVER PROFILE DRAWER OVERLAY */}
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
                    <Users className="w-5 h-5 text-indigo-500" />
                    <h3 className="text-base font-black">Register Operator Profile</h3>
                  </div>
                  <button 
                    onClick={() => setShowAddForm(false)}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-655"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form fields */}
                <form onSubmit={handleAddDriver} className="space-y-5 mt-6 h-[72vh] overflow-y-auto pr-2">
                  
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Personal Information</span>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder=" "
                          className="peer w-full px-3 py-3 pt-5 pb-1.5 text-xs rounded-xl bg-slate-550 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:outline-none focus:border-indigo-500 font-semibold"
                        />
                        <label className="absolute left-3 top-1.5 text-[8px] font-bold text-slate-400 uppercase transition-all pointer-events-none peer-placeholder-shown:top-3 peer-placeholder-shown:text-[10px] peer-placeholder-shown:font-normal peer-focus:top-1.5 peer-focus:text-[8px] peer-focus:font-bold peer-focus:text-indigo-500">
                          Full Name
                        </label>
                      </div>

                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={contact}
                          onChange={(e) => setContact(e.target.value)}
                          placeholder=" "
                          className="peer w-full px-3 py-3 pt-5 pb-1.5 text-xs rounded-xl bg-slate-550 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:outline-none focus:border-indigo-500 font-semibold"
                        />
                        <label className="absolute left-3 top-1.5 text-[8px] font-bold text-slate-400 uppercase transition-all pointer-events-none peer-placeholder-shown:top-3 peer-placeholder-shown:text-[10px] peer-placeholder-shown:font-normal peer-focus:top-1.5 peer-focus:text-[8px] peer-focus:font-bold peer-focus:text-indigo-500">
                          Contact Number
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* License specifications */}
                  <div className="space-y-4 pt-4 border-t border-slate-200/50 dark:border-slate-850">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Licensing Credentials</span>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative col-span-2">
                        <input
                          type="text"
                          required
                          value={licNum}
                          onChange={(e) => setLicNum(e.target.value)}
                          placeholder=" "
                          className="peer w-full px-3 py-3 pt-5 pb-1.5 text-xs rounded-xl bg-slate-550 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 focus:outline-none focus:border-indigo-500 font-semibold"
                        />
                        <label className="absolute left-3 top-1.5 text-[8px] font-bold text-slate-400 uppercase transition-all pointer-events-none peer-placeholder-shown:top-3 peer-placeholder-shown:text-[10px] peer-placeholder-shown:font-normal peer-focus:top-1.5 peer-focus:text-[8px] peer-focus:font-bold peer-focus:text-indigo-500">
                          License Number
                        </label>
                      </div>

                      <div className="relative">
                        <select
                          value={licCat}
                          onChange={(e) => setLicCat(e.target.value)}
                          className="w-full px-3 py-3 pt-4 pb-1 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-850 focus:outline-none focus:border-indigo-500 font-bold text-slate-800 dark:text-white"
                        >
                          <option value="Class A CDL" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Class A CDL (Commercial)</option>
                          <option value="Class B CDL" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Class B CDL (Commercial)</option>
                          <option value="Class C Standard" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Class C Standard</option>
                        </select>
                        <label className="absolute left-3 top-1 text-[8px] font-bold text-slate-400 uppercase">
                          License Category
                        </label>
                      </div>

                      <div className="relative">
                        <input
                          type="date"
                          required
                          value={expiryDate}
                          onChange={(e) => setExpiryDate(e.target.value)}
                          className="w-full px-3 py-3 pt-4 pb-1 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:outline-none focus:border-indigo-500 font-semibold"
                        />
                        <label className="absolute left-3 top-1 text-[8px] font-bold text-slate-400 uppercase">
                          Expiry Date
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Safety ratings */}
                  <div className="space-y-4 pt-4 border-t border-slate-200/50 dark:border-slate-850">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Safety Performance</span>
                    
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        required
                        value={safety}
                        onChange={(e) => setSafety(e.target.value)}
                        placeholder=" "
                        className="peer w-full px-3 py-3 pt-5 pb-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:outline-none focus:border-indigo-500 font-semibold"
                      />
                      <label className="absolute left-3 top-1.5 text-[8px] font-bold text-slate-400 uppercase transition-all pointer-events-none peer-placeholder-shown:top-3 peer-placeholder-shown:text-[10px] peer-placeholder-shown:font-normal peer-focus:top-1.5 peer-focus:text-[8px] peer-focus:font-bold peer-focus:text-indigo-500">
                        Initial Safety Score (0-100)
                      </label>
                    </div>
                  </div>

                  {/* Submit actions */}
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
                      Save Operator
                    </button>
                  </div>

                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. ATTACH COMPLIANCE DOCUMENT MODAL OVERLAY */}
      <AnimatePresence>
        {selectedDriverId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm" 
              onClick={() => setSelectedDriverId(null)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass w-full max-w-sm p-6 rounded-3xl shadow-2xl z-10 border border-slate-200/50 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl relative"
            >
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Attach Compliance Document</h3>
              
              <form onSubmit={handleUploadDoc} className="space-y-4">
                
                {/* Visual File Upload Zone */}
                {!selectedFile ? (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                      <Upload className="w-8 h-8 text-slate-450 dark:text-slate-500 mb-2 animate-bounce" />
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Drag & drop file or click to browse</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Supports PDF, PNG, JPG up to 10MB</p>
                    </div>
                    <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.png,.jpg,.jpeg" />
                  </label>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                        <div className="truncate text-xs">
                          <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{selectedFile.name}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-555 mt-0.5">{selectedFile.size}</p>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => { setSelectedFile(null); setUploadProgress(0); setDocName(''); }}
                        className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Progress indicator */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-bold text-slate-400">
                        <span>{uploadProgress < 100 ? 'Uploading...' : 'Upload Complete'}</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-205 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="relative">
                  <input
                    type="text"
                    required
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    placeholder=" "
                    className="peer w-full px-3 py-3.5 pt-5 pb-1 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                  <label className="absolute left-3 top-1.5 text-[8px] font-bold text-slate-400 uppercase transition-all pointer-events-none peer-placeholder-shown:top-3 peer-placeholder-shown:text-[10px] peer-placeholder-shown:font-normal peer-focus:top-1.5 peer-focus:text-[8px] peer-focus:font-bold peer-focus:text-indigo-500">
                    Document Title
                  </label>
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => { setSelectedDriverId(null); setSelectedFile(null); setDocName(''); }}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedFile || !docName || uploadProgress < 100}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center gap-1 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Attach</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. DETAILED DRIVER PROFILE SIDE DRAWER OVERLAY */}
      <AnimatePresence>
        {selectedDriver && (
          <div className="fixed inset-0 z-50 flex justify-end">
            
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDriver(null)}
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
                    <Users className="w-5 h-5 text-indigo-500" />
                    <span className="text-base font-black">Operator Compliance File</span>
                  </div>
                  <button 
                    onClick={() => setSelectedDriver(null)}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-655"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Profile Body */}
                <div className="space-y-6 mt-6">
                  
                  {/* Photo & Name card */}
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-indigo-500/10 border-2 border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-extrabold text-xl">
                      {selectedDriver.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
                        {selectedDriver.name}
                      </h2>
                      <span className={`inline-block px-2.5 py-0.5 mt-1 rounded-full border text-[9px] font-bold ${statusColors[selectedDriver.status] || 'bg-slate-500/10 text-slate-500'}`}>
                        {selectedDriver.status}
                      </span>
                    </div>
                  </div>

                  {/* Details parameters */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850 p-4 rounded-2xl">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">License ID</span>
                      <span className="text-xs font-bold text-slate-850 dark:text-slate-200 font-mono">{selectedDriver.licenseNumber}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Category</span>
                      <span className="text-xs font-bold text-slate-850 dark:text-slate-200">{selectedDriver.licenseCategory}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Expiry Date</span>
                      <span className="text-xs font-bold text-slate-850 dark:text-slate-200">{new Date(selectedDriver.licenseExpiryDate).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Contact</span>
                      <span className="text-xs font-bold text-slate-855 dark:text-slate-200">{selectedDriver.contactNumber}</span>
                    </div>
                  </div>

                  {/* Safety score gauges */}
                  <div className="space-y-4">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Compliance Performance Stats</span>
                    
                    <div className="p-4 rounded-2xl border border-slate-200/50 dark:border-slate-850 space-y-3">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-500 dark:text-slate-400">Safety Compliance Score</span>
                        <span className={`font-extrabold ${getSafetyLevel(selectedDriver.safetyScore).style.split(' ')[0]}`}>{selectedDriver.safetyScore} pts</span>
                      </div>
                      
                      <div className="w-full bg-slate-100 dark:bg-slate-850 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${selectedDriver.safetyScore >= 90 ? 'bg-emerald-500' : selectedDriver.safetyScore >= 75 ? 'bg-amber-500' : 'bg-red-500'}`} 
                          style={{ width: `${selectedDriver.safetyScore}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Attached Documents List */}
                  <div className="space-y-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Attached Credentials Documents</span>
                    
                    {selectedDriver.documents && selectedDriver.documents.length > 0 ? (
                      <div className="space-y-2">
                        {selectedDriver.documents.map((doc, idx) => (
                          <div 
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-indigo-500" />
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{doc.name}</span>
                            </div>
                            <span className="text-[8px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase">Verified</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-500 italic">No document credentials attached to this profile file.</p>
                    )}
                  </div>

                </div>
              </div>

              {canEdit && (
                <button
                  onClick={() => {
                    setSelectedDriverId(selectedDriver._id);
                    setSelectedDriver(null);
                  }}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20"
                >
                  <Upload className="w-4 h-4" />
                  <span>Attach Verification Credentials</span>
                </button>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  Settings, Plus, CheckCircle2, ShieldAlert, AlertTriangle, Search, 
  List, Grid, Download, RefreshCw, Truck, DollarSign, Calendar, Wrench, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api';

export default function Maintenance({ user }) {
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'table'

  // Search/Filters states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Form Fields
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [desc, setDesc] = useState('');
  const [cost, setCost] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const logsRes = await api.getMaintenanceLogs();
      setLogs(logsRes);

      const vRes = await api.getVehicles();
      setVehicles(vRes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddLog = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedVehicleId || !desc || !cost) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      await api.createMaintenance({
        vehicleId: selectedVehicleId,
        description: desc.trim(),
        cost: Number(cost)
      });
      setSuccess('Vehicle successfully placed in shop maintenance.');
      setSelectedVehicleId('');
      setDesc('');
      setCost('');
      setShowAddForm(false);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCloseMaintenance = async (id) => {
    setError('');
    setSuccess('');
    try {
      await api.closeMaintenance(id);
      setSuccess('Maintenance marked as closed. Vehicle status restored to Available.');
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  // CSV Export utility
  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = 'VehicleReg,VehicleModel,Description,Cost,CheckinDate,CompletionDate,Status\n';
    const csvContent = logs.map(l => 
      `"${l.vehicle?.registrationNumber}","${l.vehicle?.nameModel}","${l.description}",${l.cost},"${new Date(l.startDate).toLocaleDateString()}","${l.endDate ? new Date(l.endDate).toLocaleDateString() : '--'}","${l.status}"`
    ).join('\n');
    const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'TransitOps_Maintenance_Logs.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtering logs locally
  const filteredLogs = logs.filter(l => {
    const matchesSearch = (l.vehicle?.registrationNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (l.vehicle?.nameModel || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          l.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus ? l.status === filterStatus : true;
    return matchesSearch && matchesStatus;
  });

  // KPI aggregations
  const totalInShop = logs.filter(l => l.status === 'Active').length;
  const completedToday = logs.filter(l => l.status === 'Closed').length;
  const totalMaintenanceCost = logs.reduce((sum, curr) => sum + curr.cost, 0);
  const averageCost = logs.length > 0 ? (totalMaintenanceCost / logs.length).toFixed(0) : 0;

  const isManager = user?.role === 'Fleet Manager';

  // Display vehicles that aren't retired or already in maintenance
  const eligibleVehicles = vehicles.filter(v => v.status !== 'Retired' && v.status !== 'In Shop');

  return (
    <div className="space-y-6 text-slate-900 dark:text-white font-sans transition-colors duration-300 relative">
      
      {/* 1. PAGE HEADER HERO SECTION */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 p-6 rounded-3xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/80 backdrop-blur-xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[20%] h-[50%] rounded-full bg-indigo-500/5 blur-[40px] pointer-events-none" />
        
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Wrench className="w-5 h-5 text-white animate-spin-slow" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">Fleet Maintenance Operations Center</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">
            Monitor, schedule, execute, and analyze preventive and corrective maintenance across your entire vehicle fleet.
          </p>
        </div>

        {/* Dynamic Status Counter Widgets */}
        <div className="grid grid-cols-4 gap-3 max-w-lg w-full">
          {[
            { label: 'Vehicles In Shop', count: totalInShop, color: 'text-amber-500', bg: 'bg-amber-500/5' },
            { label: 'Completed Services', count: completedToday, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
            { label: 'Total Cost', count: `$${totalMaintenanceCost.toLocaleString()}`, color: 'text-rose-500', bg: 'bg-rose-500/5' },
            { label: 'Average Ticket', count: `$${Number(averageCost).toLocaleString()}`, color: 'text-indigo-500 dark:text-indigo-400', bg: 'bg-indigo-500/5' }
          ].map((kpi, idx) => (
            <div key={idx} className={`p-3 rounded-2xl ${kpi.bg} border border-slate-200/10 text-center`}>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider block mb-1">{kpi.label}</span>
              <span className={`text-base font-black ${kpi.color}`}>{kpi.count}</span>
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
              placeholder="Search registration, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-550 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-805 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 text-slate-800 dark:text-white font-medium"
            />
          </div>

          <span className="hidden sm:block w-px h-5 bg-slate-200 dark:bg-slate-850" />

          {/* Quick status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-transparent text-xs font-bold focus:outline-none p-1 text-slate-655 dark:text-slate-400"
          >
            <option value="">All Tickets</option>
            <option value="Active">Active</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        {/* Right Side Options & Actions */}
        <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-slate-200/50 dark:border-slate-800">
          
          {/* Toggle View mode */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/20">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'kanban' ? 'bg-white dark:bg-slate-955 text-indigo-500 shadow-sm' : 'text-slate-400'}`}
              title="Kanban Board view"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-slate-955 text-indigo-500 shadow-sm' : 'text-slate-400'}`}
              title="Table Grid view"
            >
              <List className="w-3.5 h-3.5" />
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
              <span>Send to Shop</span>
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

      {/* 3. DUAL VIEW BOARD: KANBAN vs TABLE DATA GRID */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-2 gap-4"
          >
            {[1, 2].map(idx => (
              <div key={idx} className="h-64 w-full rounded-3xl bg-slate-200/40 dark:bg-slate-900/40 animate-pulse border border-slate-200/20 dark:border-white/5" />
            ))}
          </motion.div>
        ) : filteredLogs.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center p-12 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/10"
          >
            <div className="p-4 bg-indigo-500/5 rounded-full mb-4">
              <Settings className="w-10 h-10 text-indigo-500/60" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Workshop is empty</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm text-center">
              All vehicles are running smoothly on route dispatch. No corrective work orders logged.
            </p>
            {isManager && (
              <button
                onClick={() => setShowAddForm(true)}
                className="px-5 py-2.5 mt-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/20"
              >
                Log Maintenance Request
              </button>
            )}
          </motion.div>
        ) : viewMode === 'kanban' ? (
          /* Kanban Board view */
          <motion.div
            key="kanban"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid md:grid-cols-2 gap-6"
          >
            {['Active', 'Closed'].map((status) => {
              const columnLogs = filteredLogs.filter(l => l.status === status);
              return (
                <div key={status} className="flex flex-col h-[70vh] bg-slate-50/30 dark:bg-slate-950/30 border border-slate-200/30 dark:border-slate-850 p-4 rounded-3xl space-y-4 overflow-hidden">
                  
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-250 dark:border-slate-850">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        status === 'Active' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                      }`} />
                      <h3 className="text-xs font-black tracking-tight">{status === 'Active' ? 'Under Repair (Active)' : 'Serviced (Closed)'}</h3>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100/80 dark:bg-slate-900 border border-slate-200/10 px-2 py-0.5 rounded-lg">
                      {columnLogs.length}
                    </span>
                  </div>

                  {/* Column Body Cards - Scrollable */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                    {columnLogs.map((log) => (
                      <div 
                        key={log._id}
                        className="glass p-4 rounded-2xl border border-slate-200/50 dark:border-white/5 bg-white dark:bg-slate-900/60 hover:border-indigo-500/20 transition-all duration-200 space-y-3.5 shadow-sm hover:shadow"
                      >
                        {/* Vehicle details */}
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 flex-shrink-0">
                            <Truck className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold leading-tight text-slate-900 dark:text-white">{log.vehicle?.registrationNumber}</p>
                            <p className="text-[9px] text-slate-500 dark:text-slate-450 mt-0.5">{log.vehicle?.nameModel}</p>
                          </div>
                        </div>

                        {/* Description */}
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">{log.description}</p>
                        </div>

                        {/* Cost & Dates */}
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 pt-3 border-t border-slate-200/30 dark:border-slate-800/30">
                          <div>
                            <span className="block text-[9px] uppercase tracking-wider text-slate-400">Repair Cost</span>
                            <span className="text-slate-800 dark:text-slate-200 font-extrabold">${log.cost.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="block text-[9px] uppercase tracking-wider text-slate-400">Check-in</span>
                            <span className="text-slate-800 dark:text-slate-200 font-semibold">{new Date(log.startDate).toLocaleDateString()}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="block text-[9px] uppercase tracking-wider text-slate-400">Release Date</span>
                            <span className="text-slate-850 dark:text-slate-250 font-semibold">
                              {log.endDate ? new Date(log.endDate).toLocaleDateString() : 'Under Repair'}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        {isManager && log.status === 'Active' && (
                          <div className="pt-1 flex">
                            <button
                              onClick={() => handleCloseMaintenance(log._id)}
                              className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center gap-1 shadow-md shadow-emerald-600/10 active:scale-[0.98] transition-all"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Complete Repair</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                </div>
              );
            })}
          </motion.div>
        ) : (
          /* Table Grid view */
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
                  <tr className="bg-slate-550/70 dark:bg-slate-950/40 border-b border-slate-200/30 dark:border-white/5 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                    <th className="p-4">Vehicle</th>
                    <th className="p-4">Description</th>
                    <th className="p-4">Cost</th>
                    <th className="p-4">Check-in Date</th>
                    <th className="p-4">Completion Date</th>
                    <th className="p-4">Status</th>
                    {isManager && <th className="p-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/10 text-xs font-semibold text-slate-700 dark:text-slate-350">
                  {filteredLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-805/20 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                            <Truck className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white leading-tight">{log.vehicle?.registrationNumber}</p>
                            <p className="text-[9px] text-slate-500 dark:text-slate-450 mt-0.5">{log.vehicle?.nameModel}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-700 dark:text-slate-300 font-semibold">{log.description}</td>
                      <td className="p-4 text-slate-900 dark:text-white font-extrabold">${log.cost.toLocaleString()}</td>
                      <td className="p-4 text-slate-500">{new Date(log.startDate).toLocaleDateString()}</td>
                      <td className="p-4 text-slate-500">
                        {log.endDate ? new Date(log.endDate).toLocaleDateString() : '--'}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold ${
                          log.status === 'Active' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      {isManager && (
                        <td className="p-4 text-right">
                          {log.status === 'Active' ? (
                            <button
                              onClick={() => handleCloseMaintenance(log._id)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold shadow-sm transition-colors"
                            >
                              Close Ticket
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400">Completed</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. CHECK-IN TO SHOP DRAWER OVERLAY */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex justify-end">
            
            {/* Backdrop */}
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
              className="relative w-full max-w-md h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200/50 dark:border-slate-850 p-6 flex flex-col justify-between z-10 text-slate-900 dark:text-white"
            >
              <div>
                {/* Header details */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-200/50 dark:border-slate-850">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-indigo-500" />
                    <h3 className="text-base font-black">Check-in Vehicle</h3>
                  </div>
                  <button 
                    onClick={() => setShowAddForm(false)}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-655"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form fields */}
                <form onSubmit={handleAddLog} className="space-y-5 mt-6 pr-2">
                  
                  {/* Select vehicle */}
                  <div className="relative">
                    <select
                      required
                      value={selectedVehicleId}
                      onChange={(e) => setSelectedVehicleId(e.target.value)}
                      className="w-full px-3 py-3 pt-4 pb-1 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-850 focus:outline-none focus:border-indigo-500 font-bold text-slate-800 dark:text-white"
                    >
                      <option value="" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Select Vehicle...</option>
                      {eligibleVehicles.map(v => (
                        <option key={v._id} value={v._id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                          {v.registrationNumber} - {v.nameModel} ({v.status})
                        </option>
                      ))}
                    </select>
                    <label className="absolute left-3 top-1 text-[8px] font-bold text-slate-400 uppercase">
                      Select Available Vehicle
                    </label>
                  </div>

                  {/* Service Description */}
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      placeholder=" "
                      className="peer w-full px-3 py-3.5 pt-5 pb-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:outline-none focus:border-indigo-500 font-semibold"
                    />
                    <label className="absolute left-3 top-1.5 text-[8px] font-bold text-slate-400 uppercase transition-all pointer-events-none peer-placeholder-shown:top-3 peer-placeholder-shown:text-[10px] peer-placeholder-shown:font-normal peer-focus:top-1.5 peer-focus:text-[8px] peer-focus:font-bold peer-focus:text-indigo-500">
                      Service Description
                    </label>
                  </div>

                  {/* Service Cost */}
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="0"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      placeholder=" "
                      className="peer w-full px-3 py-3.5 pt-5 pb-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:outline-none focus:border-indigo-500 font-semibold"
                    />
                    <label className="absolute left-3 top-1.5 text-[8px] font-bold text-slate-400 uppercase transition-all pointer-events-none peer-placeholder-shown:top-3 peer-placeholder-shown:text-[10px] peer-placeholder-shown:font-normal peer-focus:top-1.5 peer-focus:text-[8px] peer-focus:font-bold peer-focus:text-indigo-500">
                      Estimated Repair Cost ($)
                    </label>
                  </div>

                  {/* Form Submit actions */}
                  <div className="flex justify-end gap-3 pt-6 border-t border-slate-200/50 dark:border-slate-855">
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
                      Check-in to Workshop
                    </button>
                  </div>

                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

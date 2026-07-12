import React, { useState, useEffect } from 'react';
import { 
  Calendar, Plus, Navigation, CheckCircle2, ShieldAlert, X, Play, 
  Milestone, Search, Filter, List, Grid, Download, RefreshCw, MapPin, 
  Truck, Users, DollarSign, Activity, Flag, Clock, HelpCircle, Compass
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api';

export default function Trips({ user }) {
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'table'

  // Search/Filters states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Trip Form Fields
  const [source, setSource] = useState('');
  const [dest, setDest] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [cargoWeight, setCargoWeight] = useState('');
  const [plannedDistance, setPlannedDistance] = useState('');

  // Trip Completion Modal Details
  const [completingTrip, setCompletingTrip] = useState(null);
  const [finalOdo, setFinalOdo] = useState('');
  const [fuelLiters, setFuelLiters] = useState('');
  const [fuelCost, setFuelCost] = useState('');
  const [tollCost, setTollCost] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const tRes = await api.getTrips();
      setTrips(tRes);

      const vRes = await api.getVehicles();
      setVehicles(vRes);

      const dRes = await api.getDrivers();
      setDrivers(dRes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter dispatch pools based on compliance checks
  const dispatchableVehicles = vehicles.filter(v => v.status === 'Available');
  const dispatchableDrivers = drivers.filter(d => {
    const isExpired = new Date(d.licenseExpiryDate) < new Date();
    return d.status === 'Available' && !isExpired;
  });

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!source || !dest || !selectedVehicleId || !selectedDriverId || !cargoWeight || !plannedDistance) {
      setError('Please fill in all fields.');
      return;
    }

    const vehicle = vehicles.find(v => v._id === selectedVehicleId);
    if (vehicle && Number(cargoWeight) > vehicle.maxLoadCapacity) {
      setError(`Weight limit exceeded! Cargo weight (${cargoWeight} kg) exceeds vehicle ${vehicle.registrationNumber}'s max capacity (${vehicle.maxLoadCapacity} kg).`);
      return;
    }

    try {
      await api.createTrip({
        source: source.trim(),
        destination: dest.trim(),
        vehicleId: selectedVehicleId,
        driverId: selectedDriverId,
        cargoWeight: Number(cargoWeight),
        plannedDistance: Number(plannedDistance)
      });
      setSuccess('Trip draft created successfully!');
      setSource('');
      setDest('');
      setSelectedVehicleId('');
      setSelectedDriverId('');
      setCargoWeight('');
      setPlannedDistance('');
      setShowAddForm(false);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDispatch = async (tripId) => {
    setError('');
    setSuccess('');
    try {
      const res = await api.dispatchTrip(tripId);
      setSuccess(res.message);
      
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
      
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCompleteTrip = async (e) => {
    e.preventDefault();
    if (!completingTrip) return;

    setError('');
    setSuccess('');

    const currentOdo = completingTrip.vehicle.odometer;
    if (Number(finalOdo) < currentOdo) {
      setError(`Final odometer (${finalOdo} km) cannot be less than vehicle's current odometer (${currentOdo} km).`);
      return;
    }

    try {
      const extraExpenses = tollCost ? [{ type: 'Tolls', amount: Number(tollCost), description: 'Highway Tolls' }] : [];
      
      await api.completeTrip(completingTrip._id, {
        finalOdometer: Number(finalOdo),
        fuelConsumedLiters: fuelLiters ? Number(fuelLiters) : undefined,
        fuelCost: fuelCost ? Number(fuelCost) : undefined,
        extraExpenses
      });

      setSuccess('Trip marked as Completed. Vehicle and driver returned to Available.');
      setCompletingTrip(null);
      setFinalOdo('');
      setFuelLiters('');
      setFuelCost('');
      setTollCost('');
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancelTrip = async (tripId) => {
    if (!window.confirm('Are you sure you want to cancel this trip?')) return;
    try {
      await api.cancelTrip(tripId);
      setSuccess('Trip cancelled.');
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  // CSV Export utility
  const handleExportCSV = () => {
    if (trips.length === 0) return;
    const headers = 'Source,Destination,VehicleReg,Driver,Cargo(kg),PlannedDistance(km),Status\n';
    const csvContent = trips.map(t => 
      `"${t.source}","${t.destination}","${t.vehicle?.registrationNumber}","${t.driver?.name}",${t.cargoWeight},${t.plannedDistance},"${t.status}"`
    ).join('\n');
    const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'TransitOps_Dispatch_Board.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Local filtering logic
  const filteredTrips = trips.filter(t => {
    const matchesSearch = t.source.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (t.driver?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus ? t.status === filterStatus : true;
    return matchesSearch && matchesStatus;
  });

  // KPI aggregates
  const totalDispatches = trips.length;
  const activeTripsCount = trips.filter(t => t.status === 'Dispatched').length;
  const pendingDispatchesCount = trips.filter(t => t.status === 'Draft').length;
  const completedDeliveriesCount = trips.filter(t => t.status === 'Completed').length;
  const cancelledCount = trips.filter(t => t.status === 'Cancelled').length;

  const tripStatusColors = {
    'Draft': 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200/50 dark:border-slate-800/80',
    'Dispatched': 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 shadow-[0_0_8px_rgba(99,102,241,0.1)]',
    'Completed': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]',
    'Cancelled': 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  };

  const canCreate = user?.role === 'Fleet Manager' || user?.role === 'Driver';

  return (
    <div className="space-y-6 text-slate-900 dark:text-white font-sans transition-colors duration-300 relative">
      
      {/* 1. PAGE HEADER HERO SECTION */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 p-6 rounded-3xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/80 backdrop-blur-xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[20%] h-[50%] rounded-full bg-indigo-500/5 blur-[40px] pointer-events-none" />
        
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">Fleet Dispatch Command Center</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">
            Plan, assign, dispatch, monitor, and complete logistics operations in real time across your entire transport network.
          </p>
        </div>

        {/* Dynamic Status Counter Widgets */}
        <div className="grid grid-cols-5 gap-3 max-w-xl w-full">
          {[
            { label: 'Total Dispatches', count: totalDispatches, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/5' },
            { label: 'Active', count: activeTripsCount, color: 'text-cyan-500', bg: 'bg-cyan-500/5' },
            { label: 'Pending', count: pendingDispatchesCount, color: 'text-amber-500', bg: 'bg-amber-500/5' },
            { label: 'Completed', count: completedDeliveriesCount, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
            { label: 'Cancelled', count: cancelledCount, color: 'text-red-500', bg: 'bg-red-500/5' }
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
              placeholder="Search route, assigned driver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-550 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-805 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 text-slate-800 dark:text-white font-medium"
            />
          </div>

          <span className="hidden sm:block w-px h-5 bg-slate-200 dark:bg-slate-850" />

          {/* Quick status dropdown */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-transparent text-xs font-bold focus:outline-none p-1 text-slate-655 dark:text-slate-400"
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Dispatched">Dispatched</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {/* Right Side Options & Actions */}
        <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-slate-200/50 dark:border-slate-800">
          
          {/* Toggle View mode */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/20">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'kanban' ? 'bg-white dark:bg-slate-950 text-indigo-500 shadow-sm' : 'text-slate-400'}`}
              title="Kanban Board view"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-slate-950 text-indigo-500 shadow-sm' : 'text-slate-400'}`}
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

          {canCreate && (
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Trip</span>
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
            className="grid grid-cols-4 gap-4"
          >
            {[1, 2, 3, 4].map(idx => (
              <div key={idx} className="h-64 w-full rounded-3xl bg-slate-200/40 dark:bg-slate-900/40 animate-pulse border border-slate-200/20 dark:border-white/5" />
            ))}
          </motion.div>
        ) : filteredTrips.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center p-12 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/10"
          >
            <div className="p-4 bg-indigo-500/5 rounded-full mb-4">
              <Calendar className="w-10 h-10 text-indigo-500/60" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No dispatches active</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm text-center">
              Generate route connections and register active trips to begin monitoring deliveries.
            </p>
            {canCreate && (
              <button
                onClick={() => setShowAddForm(true)}
                className="px-5 py-2.5 mt-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/20"
              >
                Plan First Dispatch
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
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {['Draft', 'Dispatched', 'Completed', 'Cancelled'].map((status) => {
              const columnTrips = filteredTrips.filter(t => t.status === status);
              return (
                <div key={status} className="flex flex-col h-[70vh] bg-slate-50/30 dark:bg-slate-950/30 border border-slate-200/30 dark:border-slate-850 p-4 rounded-3xl space-y-4 overflow-hidden">
                  
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-250 dark:border-slate-850">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        status === 'Draft' ? 'bg-slate-400' :
                        status === 'Dispatched' ? 'bg-indigo-500 animate-pulse' :
                        status === 'Completed' ? 'bg-emerald-500' :
                        'bg-red-500'
                      }`} />
                      <h3 className="text-xs font-black tracking-tight">{status}</h3>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100/80 dark:bg-slate-900 border border-slate-200/10 px-2 py-0.5 rounded-lg">
                      {columnTrips.length}
                    </span>
                  </div>

                  {/* Column Body Cards - Scrollable */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                    {columnTrips.map((t) => (
                      <div 
                        key={t._id}
                        className="glass p-4 rounded-2xl border border-slate-200/50 dark:border-white/5 bg-white dark:bg-slate-900/60 hover:border-indigo-500/20 transition-all duration-200 space-y-3.5 shadow-sm hover:shadow"
                      >
                        {/* Route details */}
                        <div>
                          <div className="flex items-start gap-2.5">
                            <Navigation className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-bold leading-tight text-slate-900 dark:text-white">{t.source}</p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1">&rarr; {t.destination}</p>
                            </div>
                          </div>
                        </div>

                        {/* Specs parameters */}
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 pt-3 border-t border-slate-200/30 dark:border-slate-800/30">
                          <div>
                            <span className="block text-[9px] uppercase tracking-wider text-slate-400">Vehicle</span>
                            <span className="text-slate-800 dark:text-slate-200 font-semibold">{t.vehicle?.registrationNumber || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="block text-[9px] uppercase tracking-wider text-slate-400">Driver</span>
                            <span className="text-slate-800 dark:text-slate-200 font-semibold truncate block">{t.driver?.name || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="block text-[9px] uppercase tracking-wider text-slate-400">Distance</span>
                            <span className="text-slate-800 dark:text-slate-200 font-semibold">
                              {t.status === 'Completed' ? `${t.actualDistance} km` : `${t.plannedDistance} km`}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[9px] uppercase tracking-wider text-slate-400">Cargo Weight</span>
                            <span className="text-slate-800 dark:text-slate-200 font-semibold">{t.cargoWeight} kg</span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="pt-1 flex gap-2">
                          {t.status === 'Draft' && (
                            <>
                              <button
                                onClick={() => handleDispatch(t._id)}
                                className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center gap-1 shadow-md shadow-indigo-600/10 active:scale-[0.98] transition-all"
                              >
                                <Play className="w-3 h-3" />
                                <span>Dispatch</span>
                              </button>
                              <button
                                onClick={() => handleCancelTrip(t._id)}
                                className="px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-red-500/15 hover:text-red-500 text-slate-500 border border-slate-200/40 dark:border-slate-850 text-[10px] font-bold transition-all"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {t.status === 'Dispatched' && (
                            <>
                              <button
                                onClick={() => setCompletingTrip(t)}
                                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center gap-1 shadow-md shadow-emerald-600/10 active:scale-[0.98] transition-all"
                              >
                                <Milestone className="w-3 h-3" />
                                <span>Complete</span>
                              </button>
                              <button
                                onClick={() => handleCancelTrip(t._id)}
                                className="px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-red-500/15 hover:text-red-500 text-slate-500 border border-slate-200/40 dark:border-slate-850 text-[10px] font-bold transition-all"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
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
                  <tr className="bg-slate-50/70 dark:bg-slate-950/40 border-b border-slate-200/30 dark:border-white/5 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                    <th className="p-4">Route</th>
                    <th className="p-4">Assigned Vehicle</th>
                    <th className="p-4">Assigned Driver</th>
                    <th className="p-4">Cargo Weight</th>
                    <th className="p-4">Distance</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/10 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {filteredTrips.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="p-4">
                        <div className="flex items-start gap-2.5">
                          <Navigation className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white leading-tight">{t.source}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">&rarr; {t.destination}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                            <Truck className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{t.vehicle?.registrationNumber}</p>
                            <p className="text-[9px] text-slate-500 dark:text-slate-450 mt-0.5">{t.vehicle?.nameModel}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-655 dark:text-slate-350">{t.driver?.name}</td>
                      <td className="p-4">{t.cargoWeight} kg</td>
                      <td className="p-4">
                        {t.status === 'Completed' ? `${t.actualDistance} km` : `${t.plannedDistance} km`}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold ${tripStatusColors[t.status]}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {t.status === 'Draft' && (
                            <>
                              <button
                                onClick={() => handleDispatch(t._id)}
                                className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold flex items-center gap-0.5 shadow-sm"
                              >
                                <Play className="w-3.5 h-3.5" /> Dispatch
                              </button>
                              <button
                                onClick={() => handleCancelTrip(t._id)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-red-500/10 hover:text-red-500 text-slate-600 dark:text-slate-400 text-[10px] font-bold"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {t.status === 'Dispatched' && (
                            <>
                              <button
                                onClick={() => setCompletingTrip(t)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-0.5 shadow-sm"
                              >
                                <Milestone className="w-3.5 h-3.5" /> Complete
                              </button>
                              <button
                                onClick={() => handleCancelTrip(t._id)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-red-500/10 hover:text-red-500 text-slate-600 dark:text-slate-400 text-[10px] font-bold"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. DISPATCH TRIP PLANNER DRAWER OVERLAY */}
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
              className="relative w-full max-w-lg h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200/50 dark:border-slate-850 p-6 flex flex-col justify-between z-10 text-slate-900 dark:text-white"
            >
              <div>
                {/* Header details */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-200/50 dark:border-slate-850">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-500" />
                    <h3 className="text-base font-black">Plan Dispatch Schedule</h3>
                  </div>
                  <button 
                    onClick={() => setShowAddForm(false)}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-655"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form fields */}
                <form onSubmit={handleCreateTrip} className="space-y-5 mt-6 h-[72vh] overflow-y-auto pr-2">
                  
                  {/* Route information */}
                  <div className="space-y-4">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Route Parameters</span>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={source}
                          onChange={(e) => setSource(e.target.value)}
                          placeholder=" "
                          className="peer w-full px-3 py-3 pt-5 pb-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:outline-none focus:border-indigo-500 font-semibold"
                        />
                        <label className="absolute left-3 top-1.5 text-[8px] font-bold text-slate-400 uppercase transition-all pointer-events-none peer-placeholder-shown:top-3 peer-placeholder-shown:text-[10px] peer-placeholder-shown:font-normal peer-focus:top-1.5 peer-focus:text-[8px] peer-focus:font-bold peer-focus:text-indigo-500">
                          Source Hub
                        </label>
                      </div>

                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={dest}
                          onChange={(e) => setDest(e.target.value)}
                          placeholder=" "
                          className="peer w-full px-3 py-3 pt-5 pb-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:outline-none focus:border-indigo-500 font-semibold"
                        />
                        <label className="absolute left-3 top-1.5 text-[8px] font-bold text-slate-400 uppercase transition-all pointer-events-none peer-placeholder-shown:top-3 peer-placeholder-shown:text-[10px] peer-placeholder-shown:font-normal peer-focus:top-1.5 peer-focus:text-[8px] peer-focus:font-bold peer-focus:text-indigo-500">
                          Destination Depot
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Cargo Specifications */}
                  <div className="space-y-4 pt-4 border-t border-slate-200/50 dark:border-slate-850">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Cargo Specifications</span>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <input
                          type="number"
                          required
                          min="1"
                          value={cargoWeight}
                          onChange={(e) => setCargoWeight(e.target.value)}
                          placeholder=" "
                          className="peer w-full px-3 py-3 pt-5 pb-1.5 text-xs rounded-xl bg-slate-5-0 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:outline-none focus:border-indigo-500 font-semibold"
                        />
                        <label className="absolute left-3 top-1.5 text-[8px] font-bold text-slate-400 uppercase transition-all pointer-events-none peer-placeholder-shown:top-3 peer-placeholder-shown:text-[10px] peer-placeholder-shown:font-normal peer-focus:top-1.5 peer-focus:text-[8px] peer-focus:font-bold peer-focus:text-indigo-500">
                          Cargo Weight (kg)
                        </label>
                      </div>

                      <div className="relative">
                        <input
                          type="number"
                          required
                          min="1"
                          value={plannedDistance}
                          onChange={(e) => setPlannedDistance(e.target.value)}
                          placeholder=" "
                          className="peer w-full px-3 py-3 pt-5 pb-1.5 text-xs rounded-xl bg-slate-5-0 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:outline-none focus:border-indigo-500 font-semibold"
                        />
                        <label className="absolute left-3 top-1.5 text-[8px] font-bold text-slate-400 uppercase transition-all pointer-events-none peer-placeholder-shown:top-3 peer-placeholder-shown:text-[10px] peer-placeholder-shown:font-normal peer-focus:top-1.5 peer-focus:text-[8px] peer-focus:font-bold peer-focus:text-indigo-500">
                          Planned Distance (km)
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Resource Assignments */}
                  <div className="space-y-4 pt-4 border-t border-slate-200/50 dark:border-slate-850">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Resource Assignments</span>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <select
                          required
                          value={selectedVehicleId}
                          onChange={(e) => setSelectedVehicleId(e.target.value)}
                          className="w-full px-3 py-3 pt-4 pb-1 text-xs rounded-xl bg-slate-5-0 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:outline-none focus:border-indigo-500 font-bold"
                        >
                          <option value="">Select Vehicle...</option>
                          {dispatchableVehicles.map(v => (
                            <option key={v._id} value={v._id}>
                              {v.registrationNumber} (Max: {v.maxLoadCapacity} kg)
                            </option>
                          ))}
                        </select>
                        <label className="absolute left-3 top-1 text-[8px] font-bold text-slate-400 uppercase">
                          Available Vehicle
                        </label>
                      </div>

                      <div className="relative">
                        <select
                          required
                          value={selectedDriverId}
                          onChange={(e) => setSelectedDriverId(e.target.value)}
                          className="w-full px-3 py-3 pt-4 pb-1 text-xs rounded-xl bg-slate-5-0 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:outline-none focus:border-indigo-500 font-bold"
                        >
                          <option value="">Select Operator...</option>
                          {dispatchableDrivers.map(d => (
                            <option key={d._id} value={d._id}>
                              {d.name} (Safety: {d.safetyScore})
                            </option>
                          ))}
                        </select>
                        <label className="absolute left-3 top-1 text-[8px] font-bold text-slate-400 uppercase">
                          Compliance Operator
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Form Submit actions */}
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
                      Create Trip Draft
                    </button>
                  </div>

                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. LOG TRIP COMPLETION DETAILS MODAL OVERLAY */}
      <AnimatePresence>
        {completingTrip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm" 
              onClick={() => setCompletingTrip(null)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass w-full max-w-md p-6 rounded-3xl shadow-2xl z-10 border border-slate-200/50 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl relative"
            >
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/50 dark:border-slate-850">
                <div className="flex items-center gap-2">
                  <Milestone className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Log Completion Parameters</h3>
                </div>
                <button onClick={() => setCompletingTrip(null)}>
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              
              <form onSubmit={handleCompleteTrip} className="space-y-4">
                
                {/* Odometer metrics */}
                <div className="relative">
                  <input
                    type="number"
                    required
                    min={completingTrip.vehicle.odometer}
                    value={finalOdo}
                    onChange={(e) => setFinalOdo(e.target.value)}
                    placeholder=" "
                    className="peer w-full px-3 py-3.5 pt-5 pb-1 text-xs rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                  <label className="absolute left-3 top-1.5 text-[8px] font-bold text-slate-400 uppercase transition-all pointer-events-none peer-placeholder-shown:top-3 peer-placeholder-shown:text-[10px] peer-placeholder-shown:font-normal peer-focus:top-1.5 peer-focus:text-[8px] peer-focus:font-bold peer-focus:text-indigo-500">
                    Final Odometer (Current: {completingTrip.vehicle.odometer} km)
                  </label>
                </div>

                {/* Fuel details */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={fuelLiters}
                      onChange={(e) => setFuelLiters(e.target.value)}
                      placeholder=" "
                      className="peer w-full px-3 py-3.5 pt-5 pb-1 text-xs rounded-xl bg-slate-5-0 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:outline-none focus:border-indigo-500 font-semibold"
                    />
                    <label className="absolute left-3 top-1.5 text-[8px] font-bold text-slate-400 uppercase transition-all pointer-events-none peer-placeholder-shown:top-3 peer-placeholder-shown:text-[10px] peer-placeholder-shown:font-normal peer-focus:top-1.5 peer-focus:text-[8px] peer-focus:font-bold peer-focus:text-indigo-500">
                      Fuel Consumed (L)
                    </label>
                  </div>
                  
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={fuelCost}
                      onChange={(e) => setFuelCost(e.target.value)}
                      placeholder=" "
                      className="peer w-full px-3 py-3.5 pt-5 pb-1 text-xs rounded-xl bg-slate-5-0 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:outline-none focus:border-indigo-500 font-semibold"
                    />
                    <label className="absolute left-3 top-1.5 text-[8px] font-bold text-slate-400 uppercase transition-all pointer-events-none peer-placeholder-shown:top-3 peer-placeholder-shown:text-[10px] peer-placeholder-shown:font-normal peer-focus:top-1.5 peer-focus:text-[8px] peer-focus:font-bold peer-focus:text-indigo-500">
                      Fuel Cost ($)
                    </label>
                  </div>
                </div>

                {/* Toll fees */}
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={tollCost}
                    onChange={(e) => setTollCost(e.target.value)}
                    placeholder=" "
                    className="peer w-full px-3 py-3.5 pt-5 pb-1 text-xs rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                  <label className="absolute left-3 top-1.5 text-[8px] font-bold text-slate-400 uppercase transition-all pointer-events-none peer-placeholder-shown:top-3 peer-placeholder-shown:text-[10px] peer-placeholder-shown:font-normal peer-focus:top-1.5 peer-focus:text-[8px] peer-focus:font-bold peer-focus:text-indigo-500">
                    Highway Toll Fees ($)
                  </label>
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setCompletingTrip(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/10 active:scale-[0.98]"
                  >
                    Complete Trip
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

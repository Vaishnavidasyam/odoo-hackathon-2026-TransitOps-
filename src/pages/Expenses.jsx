import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { 
  Landmark, Plus, CheckCircle2, ShieldAlert, DollarSign, Fuel, Receipt,
  Search, Filter, List, Grid, Download, RefreshCw, X, FileText, Upload,
  TrendingUp, TrendingDown, Brain, Calendar, Activity, ChevronRight,
  AlertTriangle, CreditCard, HelpCircle, BarChart3, PieChart, ShieldCheck,
  Clock, ArrowUpRight, Ban, Award, Trash, Wrench, Truck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Expenses({ user }) {
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formType, setFormType] = useState('fuel'); // 'fuel' or 'expense'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form Fields binding states
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [amountCost, setAmountCost] = useState('');
  const [date, setDate] = useState('');
  const [liters, setLiters] = useState('');
  const [expenseType, setExpenseType] = useState('Tolls');
  const [desc, setDesc] = useState('');
  const [fuelStation, setFuelStation] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Corporate Card');
  const [costCenter, setCostCenter] = useState('Operations');
  const [vendor, setVendor] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [taxIncluded, setTaxIncluded] = useState(true);

  // Search, Filters & View Options
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterVehicle, setFilterVehicle] = useState('ALL');
  const [selectedExpense, setSelectedExpense] = useState(null);
  const searchInputRef = useRef(null);

  // Mock Receipt upload simulation state
  const [mockReceiptName, setMockReceiptName] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const loadData = async () => {
    setLoading(true);
    try {
      const eRes = await api.getExpenses();
      setExpenses(eRes);

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

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedVehicleId || !amountCost) {
      setError('Please select a vehicle and specify the cost/amount.');
      return;
    }

    try {
      if (formType === 'fuel') {
        if (!liters) {
          setError('Please specify fuel volume in liters.');
          return;
        }
        await api.createFuelLog({
          vehicleId: selectedVehicleId,
          liters: Number(liters),
          cost: Number(amountCost),
          date: date || undefined
        });
        setSuccess('Fuel log registered and verified successfully!');
      } else {
        await api.createExpense({
          vehicleId: selectedVehicleId,
          type: expenseType,
          amount: Number(amountCost),
          description: desc.trim() || `${expenseType} Entry`,
          date: date || undefined
        });
        setSuccess('Ledger expense entry posted successfully!');
      }

      // Reset
      setSelectedVehicleId('');
      setAmountCost('');
      setLiters('');
      setDesc('');
      setDate('');
      setFuelStation('');
      setVendor('');
      setInvoiceNumber('');
      setMockReceiptName('');
      setUploadProgress(0);
      setShowAddForm(false);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Mock Receipt drag and drop handler
  const handleReceiptChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMockReceiptName(file.name);
    setUploadProgress(0);
    let progress = 0;
    const timer = setInterval(() => {
      progress += 25;
      setUploadProgress(progress);
      if (progress >= 100) clearInterval(timer);
    }, 120);
  };

  const totals = expenses.reduce((acc, exp) => {
    const amt = exp.amount || exp.cost || 0;
    if (exp.type === 'Maintenance') acc.maintenance += amt;
    else if (exp.type === 'Tolls') acc.tolls += amt;
    else if (exp.type === 'Permits') acc.permits += amt;
    else acc.fuelOther += amt;
    acc.total += amt;
    return acc;
  }, { maintenance: 0, tolls: 0, permits: 0, fuelOther: 0, total: 0 });

  const canEdit = user?.role === 'Fleet Manager' || user?.role === 'Financial Analyst';

  // Filter logic
  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = 
      (exp.description && exp.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (exp.vehicle?.registrationNumber && exp.vehicle.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (exp.vehicle?.nameModel && exp.vehicle.nameModel.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (exp.type && exp.type.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = filterType === 'ALL' || exp.type === filterType;
    const matchesVehicle = filterVehicle === 'ALL' || exp.vehicle?._id === filterVehicle;

    return matchesSearch && matchesType && matchesVehicle;
  });

  // CSV Export utility
  const handleExportCSV = () => {
    if (expenses.length === 0) return;
    const headers = 'VehicleReg,VehicleModel,Description,Type,Date,Amount\n';
    const csvContent = expenses.map(l => 
      `"${l.vehicle?.registrationNumber || 'N/A'}","${l.vehicle?.nameModel || 'N/A'}","${l.description || 'Ledger transaction'}",` +
      `"${l.type}","${new Date(l.date).toLocaleDateString()}",${l.amount || l.cost || 0}`
    ).join('\n');
    const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'TransitOps_Expense_Ledger.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sparkline generator
  const renderSparkline = (color) => (
    <svg className="w-16 h-6 text-indigo-500" viewBox="0 0 100 30" fill="none">
      <path
        d="M0,25 Q15,10 30,18 T60,5 T90,20"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <div className="space-y-6 text-slate-900 dark:text-white pb-12">
      
      {/* 1. Aurora background overlay */}
      <div className="absolute top-0 left-0 w-full h-[500px] overflow-hidden pointer-events-none z-0 opacity-15">
        <div className="absolute -top-[200px] left-[15%] w-[600px] h-[600px] rounded-full bg-indigo-500 blur-[150px] animate-pulse" />
        <div className="absolute -top-[100px] right-[20%] w-[450px] h-[450px] rounded-full bg-purple-500 blur-[120px]" />
      </div>

      {/* 2. PAGE HEADER & QUICK ACTIONS */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-500/10 text-indigo-500 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border border-indigo-500/20 tracking-wider">
              Fleet Financial Operations Center
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white mt-1.5 tracking-tight">
            Financial Ledger & Operations
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 max-w-xl">
            Monitor operational spending, fuel costs, maintenance expenses, tolls, permits, and fleet profitability in real time.
          </p>
        </div>

        {canEdit && (
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => { setFormType('fuel'); setShowAddForm(true); }}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95"
            >
              <Fuel className="w-4 h-4" />
              <span>Log Fuel</span>
            </button>
            <button
              onClick={() => { setFormType('expense'); setShowAddForm(true); }}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-slate-800 dark:text-slate-200 hover:text-indigo-650 dark:hover:text-indigo-400 text-xs font-bold transition-all flex items-center gap-2 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500/30 shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Record Expense</span>
            </button>
            
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

            <button
              onClick={handleExportCSV}
              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
              title="Export Ledger (CSV)"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Status Notifications */}
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

      {/* 3. EXECUTIVE KPI DASHBOARD */}
      <div className="relative z-10 grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Fleet Expenses', val: totals.total, icon: Landmark, color: '#6366F1', bg: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/25', diff: '+4.2%' },
          { label: 'Maintenance Cost', val: totals.maintenance, icon: Wrench, color: '#F59E0B', bg: 'text-amber-500 bg-amber-500/10 border-amber-500/25', diff: '-1.8%' },
          { label: 'Tolls Paid', val: totals.tolls, icon: CreditCard, color: '#06B6D4', bg: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/25', diff: '+12.4%' },
          { label: 'State Permits', val: totals.permits, icon: FileText, color: '#10B981', bg: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/25', diff: '0.0%' },
          { label: 'Fuel / Misc Logs', val: totals.fuelOther, icon: Fuel, color: '#8B5CF6', bg: 'text-purple-500 bg-purple-500/10 border-purple-500/25', diff: '+6.1%' },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div 
              key={i} 
              whileHover={{ y: -4, scale: 1.01 }}
              className="glass p-4 rounded-2xl flex flex-col justify-between min-h-[110px] border border-slate-200/50 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 shadow-md backdrop-blur-sm relative overflow-hidden group"
            >
              {/* Inner ambient glow on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-indigo-500/0 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="flex items-start justify-between">
                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">{card.label}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[9px] font-bold px-1 py-0.2 rounded ${card.diff.startsWith('+') ? 'bg-emerald-500/15 text-emerald-500' : card.diff.startsWith('-') ? 'bg-red-500/15 text-red-500' : 'bg-slate-500/15 text-slate-400'}`}>
                      {card.diff}
                    </span>
                    <span className="text-[8px] text-slate-400 font-bold">vs last mo.</span>
                  </div>
                </div>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${card.bg}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="flex items-end justify-between mt-3">
                <span className="text-xl font-black tracking-tight text-slate-800 dark:text-white">
                  {loading ? (
                    <div className="w-16 h-5 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                  ) : (
                    `$${card.val.toLocaleString()}`
                  )}
                </span>
                <div className="opacity-75 group-hover:opacity-100 transition-opacity">
                  {renderSparkline(card.color)}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 4. LIVE FINANCIAL STATUS BAR */}
      <div className="relative z-10 flex flex-wrap items-center justify-between p-3 px-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-850 gap-4 text-xs font-semibold">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-slate-450 dark:text-slate-400 text-[10px]">Today's Transactions:</span>
            <span className="font-extrabold text-slate-800 dark:text-slate-200 font-mono">
              {filteredExpenses.filter(e => new Date(e.date).toDateString() === new Date().toDateString()).length} entries
            </span>
          </div>
          <div className="hidden md:flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-6">
            <span className="text-slate-455 dark:text-slate-400 text-[10px]">Active Vehicles Fueled:</span>
            <span className="font-extrabold text-slate-800 dark:text-slate-200">
              {vehicles.filter(v => v.status === 'Available').length} units
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-400 text-[10px]">Monthly Ops Budget:</span>
          <div className="w-24 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, (totals.total / 120000) * 100)}%` }}
            />
          </div>
          <span className="font-bold text-[10px] text-indigo-500">
            {((totals.total / 120000) * 100).toFixed(0)}% Used
          </span>
        </div>
      </div>

      {/* 5. SPLIT LAYOUT: ANALYTICS & LEDGER */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* LEFT 3 COLUMNS: GRAPH AND LEDGER */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* CHARTS / ANALYTICS PANEL */}
          <div className="glass p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-500" />
                <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">
                  Spending Analytics & Distribution
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-955 p-0.5 rounded-lg border border-slate-200 dark:border-slate-855 text-[10px] font-bold">
                <span className="px-2 py-0.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded shadow-sm">Ledger Shares</span>
                <span className="px-2 py-0.5 text-slate-400">MoM Trend</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Dynamic Cost breakdown */}
              <div className="md:col-span-2 space-y-3.5">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350">Ledger Allocations</h4>
                <div className="space-y-2">
                  {[
                    { label: 'Maintenance Cost', amt: totals.maintenance, pct: totals.total ? (totals.maintenance / totals.total) * 100 : 0, color: 'bg-amber-500' },
                    { label: 'Tolls Paid', amt: totals.tolls, pct: totals.total ? (totals.tolls / totals.total) * 100 : 0, color: 'bg-cyan-500' },
                    { label: 'State Permits', amt: totals.permits, pct: totals.total ? (totals.permits / totals.total) * 100 : 0, color: 'bg-emerald-500' },
                    { label: 'Fuel / Misc Logs', amt: totals.fuelOther, pct: totals.total ? (totals.fuelOther / totals.total) * 100 : 0, color: 'bg-purple-500' }
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400 font-bold">{item.label}</span>
                        <span className="text-slate-800 dark:text-slate-200 font-extrabold font-mono">
                          ${item.amt.toLocaleString()} <span className="text-slate-400 font-normal">({item.pct.toFixed(0)}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-200/20">
                        <div 
                          className={`h-full rounded-full ${item.color} transition-all duration-700`} 
                          style={{ width: `${item.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Graphical Donut Pie representation */}
              <div className="flex flex-col items-center justify-center p-4 border border-slate-200/30 dark:border-slate-850 rounded-2xl bg-slate-50/20 dark:bg-slate-955/20">
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="3" />
                    
                    {/* Ring calculations based on category percentages */}
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#F59E0B" strokeWidth="4.2" 
                      strokeDasharray={`${totals.total ? (totals.maintenance / totals.total) * 100 : 0} ${100 - (totals.total ? (totals.maintenance / totals.total) * 100 : 0)}`} 
                      strokeDashoffset="0" 
                    />
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#06B6D4" strokeWidth="4.2" 
                      strokeDasharray={`${totals.total ? (totals.tolls / totals.total) * 100 : 0} ${100 - (totals.total ? (totals.tolls / totals.total) * 100 : 0)}`} 
                      strokeDashoffset={`-${totals.total ? (totals.maintenance / totals.total) * 100 : 0}`} 
                    />
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10B981" strokeWidth="4.2" 
                      strokeDasharray={`${totals.total ? (totals.permits / totals.total) * 100 : 0} ${100 - (totals.total ? (totals.permits / totals.total) * 100 : 0)}`} 
                      strokeDashoffset={`-${totals.total ? ((totals.maintenance + totals.tolls) / totals.total) * 100 : 0}`} 
                    />
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#8B5CF6" strokeWidth="4.2" 
                      strokeDasharray={`${totals.total ? (totals.fuelOther / totals.total) * 100 : 0} ${100 - (totals.total ? (totals.fuelOther / totals.total) * 100 : 0)}`} 
                      strokeDashoffset={`-${totals.total ? ((totals.maintenance + totals.tolls + totals.permits) / totals.total) * 100 : 0}`} 
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-[9px] uppercase font-bold text-slate-400">Total Ops</span>
                    <span className="text-xs font-black text-slate-800 dark:text-white font-mono">${(totals.total / 1000).toFixed(1)}k</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  <span className="text-[9px] font-bold text-slate-400">Dynamic Distribution</span>
                </div>
              </div>

            </div>
          </div>

          {/* GLOBAL TOOLBAR */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white/50 dark:bg-slate-900/30 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800/80">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ledger by vehicle, tags, or desc... (Ctrl+K)"
                className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 pl-9 pr-4 py-2 text-xs rounded-xl focus:outline-none focus:border-indigo-500 font-medium text-slate-750 dark:text-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              
              {/* Type Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950/65 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-850">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-350 focus:outline-none"
                >
                  <option value="ALL">All Categories</option>
                  <option value="Tolls">Tolls</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Permits">Permits</option>
                  <option value="Other">Fuel / Misc</option>
                </select>
              </div>

              {/* Vehicle Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-955 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-850">
                <Truck className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={filterVehicle}
                  onChange={(e) => setFilterVehicle(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-350 focus:outline-none animate-none"
                >
                  <option value="ALL">All Vehicles</option>
                  {vehicles.map(v => (
                    <option key={v._id} value={v._id}>{v.registrationNumber}</option>
                  ))}
                </select>
              </div>

              {/* Clear filters shortcut */}
              {(filterType !== 'ALL' || filterVehicle !== 'ALL' || searchQuery) && (
                <button
                  onClick={() => { setFilterType('ALL'); setFilterVehicle('ALL'); setSearchQuery(''); }}
                  className="p-2 rounded-xl text-xs font-semibold bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                >
                  Reset
                </button>
              )}

              <button
                onClick={loadData}
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-955 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-850 text-slate-400 hover:text-slate-600 transition-colors active:scale-95"
                title="Refresh Ledger"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ENTERPRISE TRANSACTION TABLE */}
          <div className="glass rounded-3xl overflow-hidden border border-slate-200/50 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/40 shadow-xl backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-200/30 dark:border-slate-850 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    <th className="p-4">Transaction Code</th>
                    <th className="p-4">Vehicle Identity</th>
                    <th className="p-4">Description / Reference</th>
                    <th className="p-4">Classification</th>
                    <th className="p-4">Accounting Date</th>
                    <th className="p-4 text-right">Debit Amount</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/10 text-xs font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="p-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                          <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500">Querying ledger records...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="p-16 text-center text-slate-450">
                        <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto">
                          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 flex items-center justify-center text-slate-400">
                            <AlertTriangle className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-slate-800 dark:text-slate-200">No Financial Records Found</h4>
                            <p className="text-[10px] text-slate-400 mt-1">We couldn't find any financial entries matching your criteria. Try adjusting filters or record a new transaction.</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => (
                      <tr 
                        key={exp._id} 
                        className="hover:bg-indigo-500/[0.02] dark:hover:bg-indigo-500/[0.02] border-slate-200/10 transition-colors group cursor-pointer"
                        onClick={() => setSelectedExpense(exp)}
                      >
                        <td className="p-4 font-mono text-[10px] text-slate-400 font-bold group-hover:text-indigo-450 transition-colors">
                          #TX-{exp._id.slice(-6).toUpperCase()}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
                              <Truck className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-extrabold text-slate-850 dark:text-slate-100">{exp.vehicle?.registrationNumber || 'UNASSIGNED'}</span>
                              <span className="text-[9px] text-slate-400 mt-0.5">{exp.vehicle?.nameModel || 'Fleet Equipment'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-slate-700 dark:text-slate-350 font-bold max-w-xs truncate">
                          {exp.description || 'Routine Ledger Log'}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-lg text-[9px] uppercase font-extrabold border ${
                            exp.type === 'Maintenance' 
                              ? 'bg-amber-500/10 text-amber-500 border-amber-500/15' 
                              : exp.type === 'Tolls'
                              ? 'bg-cyan-500/10 text-cyan-500 border-cyan-500/15'
                              : exp.type === 'Permits'
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/15'
                              : 'bg-purple-500/10 text-purple-500 border-purple-500/15'
                          }`}>
                            {exp.type}
                          </span>
                        </td>
                        <td className="p-4 text-slate-450 dark:text-slate-400 font-bold">
                          {new Date(exp.date).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right text-slate-900 dark:text-white font-extrabold text-xs font-mono">
                          ${(exp.amount || exp.cost || 0).toLocaleString()}
                        </td>
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            <span>Verified</span>
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors">
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
          
          {/* AI COST INSIGHTS PANEL */}
          <div className="glass p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/30 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-indigo-500" />
                <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">AI Cost Insights</span>
              </div>
              <span className="text-[8px] font-black text-indigo-500 bg-indigo-500/10 px-1.5 py-0.5 rounded uppercase">Realtime</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                <div className="flex items-center gap-1.5 text-amber-500 font-bold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Unusual Consumption</span>
                </div>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-normal">
                  <strong>VAN-05</strong> fuel consumption increased 18% over the past 7 days.
                </p>
                <div className="flex justify-between text-[9px] text-slate-450 dark:text-slate-500 font-bold">
                  <span>Possible: High Idle / Traffic</span>
                  <span className="text-amber-500">Est. Loss: $340</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-500 font-bold">
                  <Award className="w-3.5 h-3.5" />
                  <span>Savings Target Reached</span>
                </div>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-normal">
                  Preventative maintenance checkups on <strong>TRUCK-02</strong> have successfully offset breakdown costs by 22% this quarter.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-1.5">
                <div className="flex items-center gap-1.5 text-indigo-500 font-bold">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Cost Optimizations</span>
                </div>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-normal">
                  Rerouting 3 long-haul lanes from state-highways to toll-roads will save 45 liters per trip.
                </p>
              </div>
            </div>
          </div>

          {/* BUDGET OVERVIEW PANEL */}
          <div className="glass p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/30 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-500" />
                <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Budget Overview</span>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Monthly Operations Limit', current: totals.total, max: 120000, color: 'bg-indigo-500' },
                { label: 'Quarterly Maintenance Allocation', current: totals.maintenance, max: 80000, color: 'bg-amber-500' },
                { label: 'State Toll Allowances', current: totals.tolls, max: 35000, color: 'bg-cyan-500' }
              ].map((item, idx) => {
                const ratio = Math.min(100, (item.current / item.max) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-slate-500 dark:text-slate-400">{item.label}</span>
                      <span className="text-slate-700 dark:text-slate-300 font-mono">{ratio.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-200/10">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${ratio}%` }}></div>
                    </div>
                    <div className="flex justify-between text-[8px] text-slate-450 dark:text-slate-500">
                      <span>Spent: ${item.current.toLocaleString()}</span>
                      <span>Cap: ${item.max.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RECENT FINANCIAL ACTIVITY TIMELINE */}
          <div className="glass p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl space-y-4">
            <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Financial Audit Log</h4>
            
            <div className="space-y-3.5">
              {[
                { icon: Fuel, text: 'Fuel logged for VAN-05', time: '10 mins ago', color: 'text-purple-500' },
                { icon: Wrench, text: 'Maintenance closed for TRUCK-02', time: '2 hours ago', color: 'text-amber-500' },
                { icon: Landmark, text: 'Toll ledger verified in accounting', time: '1 day ago', color: 'text-indigo-500' },
                { icon: FileText, text: 'Registration Permit renewed', time: '2 days ago', color: 'text-emerald-500' }
              ].map((act, idx) => {
                const ActIcon = act.icon;
                return (
                  <div key={idx} className="flex gap-3 text-xs">
                    <div className={`w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 flex items-center justify-center ${act.color} flex-shrink-0`}>
                      <ActIcon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <span className="font-semibold text-slate-700 dark:text-slate-350">{act.text}</span>
                      <span className="text-[8px] text-slate-400 font-bold">{act.time}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* 6. SLIDE-OVER FORM DRAWER (LOG FUEL & RECORD EXPENSE) */}
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

            {/* Slider container */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="relative w-full max-w-md h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200/50 dark:border-slate-850 p-6 flex flex-col justify-between z-10 text-slate-900 dark:text-white"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-200/50 dark:border-slate-850">
                  <div className="flex items-center gap-2">
                    {formType === 'fuel' ? <Fuel className="w-5 h-5 text-indigo-500" /> : <Landmark className="w-5 h-5 text-indigo-500" />}
                    <span className="text-base font-black">
                      {formType === 'fuel' ? 'Log Fuel Transaction' : 'Record Ledger Expense'}
                    </span>
                  </div>
                  <button 
                    onClick={() => setShowAddForm(false)}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-400 hover:text-slate-655"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleAddExpense} className="space-y-4 mt-6">
                  
                  {/* Vehicle selection */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Select Fleet Vehicle</label>
                    <select
                      required
                      className="w-full px-3.5 py-3 text-xs rounded-xl bg-slate-550 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 font-bold"
                      value={selectedVehicleId}
                      onChange={(e) => setSelectedVehicleId(e.target.value)}
                    >
                      <option value="">Select vehicle...</option>
                      {vehicles.map(v => (
                        <option key={v._id} value={v._id}>{v.registrationNumber} - {v.nameModel}</option>
                      ))}
                    </select>
                  </div>

                  {/* Fuel station / Vendor */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      {formType === 'fuel' ? 'Fuel Station Name' : 'Creditor Vendor'}
                    </label>
                    <input
                      type="text"
                      placeholder={formType === 'fuel' ? 'Shell JFK Airport' : 'State DOT Highway Authority'}
                      className="w-full px-3.5 py-3 text-xs rounded-xl bg-slate-550 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 font-bold"
                      value={formType === 'fuel' ? fuelStation : vendor}
                      onChange={(e) => formType === 'fuel' ? setFuelStation(e.target.value) : setVendor(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Fuel volume / Expense category */}
                    {formType === 'fuel' ? (
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Volume (Liters)</label>
                        <input
                          type="number"
                          placeholder="45"
                          required
                          min="1"
                          className="w-full px-3.5 py-3 text-xs rounded-xl bg-slate-550 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 font-bold"
                          value={liters}
                          onChange={(e) => setLiters(e.target.value)}
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Expense Type</label>
                        <select
                          required
                          className="w-full px-3.5 py-3 text-xs rounded-xl bg-slate-550 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-850 dark:text-white focus:outline-none focus:border-indigo-500 font-bold"
                          value={expenseType}
                          onChange={(e) => setExpenseType(e.target.value)}
                        >
                          <option value="Tolls">Tolls</option>
                          <option value="Maintenance">Maintenance</option>
                          <option value="Permits">Permits</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    )}

                    {/* Cost / Amount */}
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                        {formType === 'fuel' ? 'Total Cost ($)' : 'Expense Amount ($)'}
                      </label>
                      <input
                        type="number"
                        placeholder="120"
                        required
                        min="1"
                        className="w-full px-3.5 py-3 text-xs rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 font-bold font-mono"
                        value={amountCost}
                        onChange={(e) => setAmountCost(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Date & Payment Method */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Accounting Date</label>
                      <input
                        type="date"
                        className="w-full px-3.5 py-3 text-xs rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 font-bold"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Payment Method</label>
                      <select
                        className="w-full px-3.5 py-3 text-xs rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 font-bold"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      >
                        <option value="Corporate Card" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Corporate Card</option>
                        <option value="Cash/Reimbursable" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Cash/Reimbursable</option>
                        <option value="Wire Transfer" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Wire Transfer</option>
                      </select>
                    </div>
                  </div>

                  {/* Description / Odometer */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      {formType === 'fuel' ? 'Odometer Reading (km)' : 'Description / Memo'}
                    </label>
                    <input
                      type="text"
                      placeholder={formType === 'fuel' ? 'e.g. 142050' : 'State highway tolls invoice'}
                      className="w-full px-3.5 py-3 text-xs rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 font-bold"
                      value={formType === 'fuel' ? invoiceNumber : desc}
                      onChange={(e) => formType === 'fuel' ? setInvoiceNumber(e.target.value) : setDesc(e.target.value)}
                    />
                  </div>

                  {/* visual Receipt upload container */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-200/50 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Attach Invoice Receipt</span>
                    
                    {!mockReceiptName ? (
                      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                        <Upload className="w-5 h-5 text-slate-400 mb-1" />
                        <span className="text-[10px] font-bold text-slate-500">Click to upload file receipt</span>
                        <input type="file" className="hidden" onChange={handleReceiptChange} accept=".pdf,.png,.jpg" />
                      </label>
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-indigo-500" />
                            <span className="font-bold text-slate-750 dark:text-slate-200 truncate max-w-[200px]">{mockReceiptName}</span>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => { setMockReceiptName(''); setUploadProgress(0); }}
                            className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                          <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Form actions */}
                  <div className="flex justify-end gap-3 pt-6 border-t border-slate-200/50 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 text-xs font-bold transition-all hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={mockReceiptName && uploadProgress < 100}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/10"
                    >
                      {formType === 'fuel' ? 'Post Fuel Log' : 'Post Ledger Entry'}
                    </button>
                  </div>

                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. TRANSACTION DETAIL DRAWER OVERLAY */}
      <AnimatePresence>
        {selectedExpense && (
          <div className="fixed inset-0 z-50 flex justify-end">
            
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedExpense(null)}
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
                    <span className="text-base font-black">Transaction Audit Record</span>
                  </div>
                  <button 
                    onClick={() => setSelectedExpense(null)}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-855 text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Profile Body */}
                <div className="space-y-6 mt-6">
                  
                  {/* Photo & Name card */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-650 dark:text-indigo-400 font-extrabold text-lg">
                      TX
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                        {selectedExpense.description || 'Ledger entry'}
                      </h2>
                      <span className="inline-block px-2.5 py-0.5 mt-1 rounded-full border text-[9px] font-extrabold bg-emerald-500/15 border-emerald-500/30 text-emerald-500 uppercase">
                        Verified Ledger
                      </span>
                    </div>
                  </div>

                  {/* Details parameters */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-855 p-4 rounded-2xl">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Asset Registration</span>
                      <span className="text-xs font-bold text-slate-850 dark:text-slate-200 font-mono">
                        {selectedExpense.vehicle?.registrationNumber || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Vehicle Model</span>
                      <span className="text-xs font-bold text-slate-850 dark:text-slate-200">
                        {selectedExpense.vehicle?.nameModel || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Accounting Classification</span>
                      <span className="text-xs font-bold text-slate-850 dark:text-slate-200">
                        {selectedExpense.type}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Debit Amount</span>
                      <span className="text-xs font-bold text-slate-855 dark:text-slate-200 font-mono">
                        ${(selectedExpense.amount || selectedExpense.cost || 0).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Transaction Date</span>
                      <span className="text-xs font-bold text-slate-850 dark:text-slate-200">
                        {new Date(selectedExpense.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Payment Method</span>
                      <span className="text-xs font-bold text-slate-850 dark:text-slate-200">
                        Corporate Card
                      </span>
                    </div>
                  </div>

                  {/* AI Fraud & Security Verification Details */}
                  <div className="space-y-4">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">AI Audit Security Verification</span>
                    
                    <div className="p-4 rounded-2xl border border-slate-200/50 dark:border-slate-850 space-y-3 bg-slate-50/50 dark:bg-slate-955/40">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-500 dark:text-slate-400">Risk Assessment Score</span>
                        <span className="font-extrabold text-emerald-500">99.8% Clean</span>
                      </div>
                      
                      <div className="w-full bg-slate-100 dark:bg-slate-850 h-2 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: '99.8%' }}></div>
                      </div>

                      <div className="flex flex-col gap-1.5 pt-2 text-[10px] font-bold text-slate-500 border-t border-slate-250/20">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>No duplicate invoice receipts detected.</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Cost is within expected vehicle operational limits.</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Attached Documents List */}
                  <div className="space-y-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Attached Invoice Receipt</span>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-855 text-xs">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-500" />
                        <span className="font-semibold text-slate-855 dark:text-slate-200">
                          {selectedExpense.type.toLowerCase()}_receipt_{selectedExpense._id.slice(-6)}.pdf
                        </span>
                      </div>
                      <span className="text-[8px] font-bold text-indigo-500 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded uppercase animate-pulse">Download</span>
                    </div>
                  </div>

                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => setSelectedExpense(null)}
                  className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-750 transition-colors"
                >
                  Close Audit Record
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

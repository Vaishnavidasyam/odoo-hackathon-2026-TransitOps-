import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Compass, Truck, Users, Calendar, Settings, 
  HelpCircle, Sparkles, Bell, Sun, Moon, LogOut, Search, Menu,
  ChevronRight, Wrench, CreditCard, BarChart3, Activity, Globe, Clock,
  User, Sliders, Mail, ChevronDown, UserCheck, Key, Shield, Map, Trash2, Check, X, Layers
} from 'lucide-react';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Drivers from './pages/Drivers';
import Trips from './pages/Trips';
import Maintenance from './pages/Maintenance';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import AISearch from './pages/AISearch';
import FleetMap from './pages/FleetMap';
import CommandPalette from './components/CommandPalette';
import { api } from './api';

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('transitops_theme');
    if (saved !== null) return saved === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [focusId, setFocusId] = useState(null);
  
  // Notification States
  const [notifications, setNotifications] = useState([]);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Search & Filtering inside sliding notification drawer
  const [notificationSearch, setNotificationSearch] = useState('');
  const [notificationCategory, setNotificationCategory] = useState('ALL');

  // On mount check token
  useEffect(() => {
    const token = localStorage.getItem('transitops_token');
    if (token) {
      fetchUserSession();
    }
  }, []);

  // Sync Dark/Light theme class on document element and persist
  useEffect(() => {
    localStorage.setItem('transitops_theme', darkMode ? 'dark' : 'light');
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  // Global keydown listeners (Ctrl + K)
  useEffect(() => {
    const handleGlobalKeys = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, []);

  const fetchUserSession = async () => {
    try {
      const data = await api.me();
      setUser(data.user);
      scanNotifications();
    } catch (err) {
      localStorage.removeItem('transitops_token');
      setUser(null);
    }
  };

  const scanNotifications = async () => {
    try {
      const drivers = await api.getDrivers();
      const activeMaintenance = await api.getMaintenanceLogs();
      const list = [];

      // Check expiring/expired licenses
      const today = new Date();
      drivers.forEach(d => {
        const expiry = new Date(d.licenseExpiryDate);
        const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
        if (diffDays <= 0) {
          list.push({
            id: `driver-expired-${d._id}`,
            category: 'Driver',
            type: 'danger',
            title: 'Credential Expired',
            message: `Driver ${d.name}'s license is EXPIRED!`,
            time: '10m ago',
            read: false
          });
        } else if (diffDays <= 30) {
          list.push({
            id: `driver-expiring-${d._id}`,
            category: 'Driver',
            type: 'warning',
            title: 'Credential Expiring',
            message: `Driver ${d.name}'s license expires in ${diffDays} days.`,
            time: '1h ago',
            read: false
          });
        }
      });

      // Check active maintenance checked-in
      const activeOrders = activeMaintenance.filter(m => m.status === 'Active');
      activeOrders.forEach(m => {
        list.push({
          id: `maint-${m._id}`,
          category: 'Maintenance',
          type: 'warning',
          title: 'Shop Check-in',
          message: `${m.vehicle?.registrationNumber || 'Vehicle'} checked into maintenance shop.`,
          time: '2h ago',
          read: false
        });
      });

      // Pushing mock items for high-fidelity compliance alerts
      list.push({
        id: 'mock-trip-delay',
        category: 'Trips',
        type: 'danger',
        title: 'Trip Delayed',
        message: 'Trip #TX-8924 to Chicago has been delayed due to high traffic on I-90.',
        time: '3h ago',
        read: false
      });
      list.push({
        id: 'mock-expense-budget',
        category: 'Expenses',
        type: 'danger',
        title: 'Budget Threshold Exceeded',
        message: 'Monthly maintenance expense exceeds regional allocations by 14.5%.',
        time: '4h ago',
        read: false
      });
      list.push({
        id: 'mock-fuel-low',
        category: 'Vehicle',
        type: 'warning',
        title: 'Fuel Level Critical',
        message: 'VAN-06 fuel levels below 15% capacity target.',
        time: '5h ago',
        read: false
      });
      list.push({
        id: 'mock-ai-rec',
        category: 'AI',
        type: 'info',
        title: 'AI Recommendation',
        message: 'AI Model predicts brake replacement needed on TRUCK-02 within 15 days.',
        time: '6h ago',
        read: false
      });
      list.push({
        id: 'mock-maint-done',
        category: 'Maintenance',
        type: 'success',
        title: 'Maintenance Completed',
        message: 'Flatbed-01 oil inspection service ticket successfully resolved.',
        time: '1d ago',
        read: true
      });

      setNotifications(list);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    scanNotifications();
  };

  const handleLogout = () => {
    localStorage.removeItem('transitops_token');
    setUser(null);
  };

  const handleQuickAction = (action, id) => {
    if (action === 'focusVehicle') {
      setFocusId(id);
    } else if (action === 'focusDriver') {
      setFocusId(id);
    }
  };

  // Helper notification filters
  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const filteredNotifications = notifications.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(notificationSearch.toLowerCase()) ||
                          n.message.toLowerCase().includes(notificationSearch.toLowerCase());
    
    let matchesCat = true;
    if (notificationCategory === 'CRITICAL') {
      matchesCat = n.type === 'danger' || n.type === 'warning';
    } else if (notificationCategory === 'OPERATIONS') {
      matchesCat = n.category === 'Driver' || n.category === 'Vehicle' || n.category === 'Trips' || n.category === 'Maintenance' || n.category === 'Expenses';
    } else if (notificationCategory === 'SYSTEM') {
      matchesCat = n.category === 'System' || n.category === 'AI';
    }
    
    return matchesSearch && matchesCat;
  });

  const navigationItems = [
    { view: 'dashboard', label: 'Command Center', icon: Compass },
    { view: 'fleet_map', label: 'Fleet Map', icon: Map },
    { view: 'vehicles', label: 'Vehicle Registry', icon: Truck },
    { view: 'drivers', label: 'Driver Profiles', icon: Users },
    { view: 'trips', label: 'Dispatch Board', icon: Calendar },
    { view: 'maintenance', label: 'Maintenance Shop', icon: Wrench },
    { view: 'expenses', label: 'Expense Ledger', icon: CreditCard },
    { view: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    { view: 'ai_assistant', label: 'AI Command Center', icon: Sparkles },
  ];

  const getFilteredNavigation = () => {
    if (!user) return [];
    switch (user.role) {
      case 'Driver':
        return [
          { view: 'dashboard', label: 'Command Center', icon: Compass },
          { view: 'trips', label: 'Dispatch Board', icon: Calendar },
          { view: 'ai_assistant', label: 'AI Command Center', icon: Sparkles },
        ];
      case 'Safety Officer':
        return [
          { view: 'dashboard', label: 'Command Center', icon: Compass },
          { view: 'drivers', label: 'Driver Profiles', icon: Users },
          { view: 'ai_assistant', label: 'AI Command Center', icon: Sparkles },
        ];
      case 'Financial Analyst':
        return [
          { view: 'dashboard', label: 'Command Center', icon: Compass },
          { view: 'expenses', label: 'Expense Ledger', icon: CreditCard },
          { view: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
          { view: 'ai_assistant', label: 'AI Command Center', icon: Sparkles },
        ];
      case 'Fleet Manager':
      default:
        return navigationItems;
    }
  };

  const filteredNav = getFilteredNavigation();

  // Define premium navigation groups
  const navigationGroups = [
    {
      title: 'Core',
      items: [
        { view: 'dashboard', label: 'Command Center', icon: Compass },
        { view: 'fleet_map', label: 'Fleet Map', icon: Map }
      ]
    },
    {
      title: 'Fleet Registry',
      items: [
        { view: 'vehicles', label: 'Vehicle Registry', icon: Truck },
        { view: 'drivers', label: 'Driver Profiles', icon: Users }
      ]
    },
    {
      title: 'Operations',
      items: [
        { view: 'trips', label: 'Dispatch Board', icon: Calendar },
        { view: 'maintenance', label: 'Maintenance Shop', icon: Wrench }
      ]
    },
    {
      title: 'Finance & Analytics',
      items: [
        { view: 'expenses', label: 'Expense Ledger', icon: CreditCard },
        { view: 'reports', label: 'Reports & Analytics', icon: BarChart3 }
      ]
    },
    {
      title: 'Artificial Intelligence',
      items: [
        { view: 'ai_assistant', label: 'AI Command Center', icon: Sparkles }
      ]
    }
  ];

  // Filter groups dynamically by role permissions
  const filteredGroups = navigationGroups.map(group => {
    const items = group.items.filter(item => filteredNav.some(f => f.view === item.view));
    return { ...group, items };
  }).filter(group => group.items.length > 0);

  // If active view is not accessible for the user role, redirect to default
  useEffect(() => {
    if (user && filteredNav.length > 0) {
      const isAllowed = filteredNav.some(item => item.view === activeView);
      if (!isAllowed) {
        setActiveView(filteredNav[0].view);
      }
    }
  }, [user, activeView]);

  const getBreadcrumbs = () => {
    switch (activeView) {
      case 'dashboard':
        return ['TransitOps', 'Core', 'Command Center'];
      case 'fleet_map':
        return ['TransitOps', 'Core', 'Fleet Map'];
      case 'map_intelligence':
        return ['TransitOps', 'Core', 'Map Intelligence'];
      case 'vehicles':
        return ['TransitOps', 'Fleet Registry', 'Vehicle Registry'];
      case 'drivers':
        return ['TransitOps', 'Fleet Registry', 'Driver Profiles'];
      case 'trips':
        return ['TransitOps', 'Operations', 'Dispatch Board'];
      case 'maintenance':
        return ['TransitOps', 'Operations', 'Maintenance Shop'];
      case 'expenses':
        return ['TransitOps', 'Finance & Analytics', 'Expense Ledger'];
      case 'reports':
        return ['TransitOps', 'Finance & Analytics', 'Reports & Analytics'];
      case 'ai_assistant':
        return ['TransitOps', 'Artificial Intelligence', 'AI Command Center'];
      default:
        return ['TransitOps'];
    }
  };

  const getInitials = (name) => {
    if (!name) return 'US';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  if (!user) {
    if (showLogin) {
      return <Login onLoginSuccess={handleLoginSuccess} onBackToLanding={() => setShowLogin(false)} />;
    }
    return <Landing onDemo={() => setShowLogin(true)} darkMode={darkMode} setDarkMode={setDarkMode} />;
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#070B1A] text-slate-800 dark:text-slate-300 font-sans transition-colors duration-200 overflow-hidden relative">
      
      {/* Sidebar navigation */}
      <motion.aside 
        animate={{ width: sidebarOpen ? 280 : 88 }}
        transition={{ type: 'spring', stiffness: 220, damping: 26 }}
        className="bg-white dark:bg-[#0E1628] border-r border-slate-200/50 dark:border-white/5 flex flex-col justify-between z-30 relative rounded-r-[2rem] shadow-2xl overflow-visible shrink-0"
      >
        {/* Subtle auroral backdrop glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-indigo-500/5 blur-[80px] pointer-events-none"></div>

        <div>
          {/* Logo Brand Header */}
          <div className="p-6 pb-4 flex items-center gap-3 relative border-b border-slate-200/10 dark:border-white/5">
            <div className="relative group flex items-center justify-center shrink-0">
              <div className="absolute inset-0 bg-indigo-500/30 rounded-xl blur-md opacity-50 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-10 h-10 rounded-xl bg-[#070B1A]/80 border border-white/10 flex items-center justify-center shadow-lg relative z-10 overflow-hidden">
                <img src="/logistic.png" alt="TransitOps Logo" className="w-7.5 h-7.5 object-contain" />
              </div>
            </div>
            {sidebarOpen && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col"
              >
                <span className="font-black text-slate-800 dark:text-white tracking-wide text-sm flex items-center gap-1.5">
                  TransitOps <span className="text-[9px] font-bold bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-md">v2.1</span>
                </span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Fleet Intelligence</span>
              </motion.div>
            )}
          </div>

          {/* Navigation Links grouped by categories */}
          <div className="p-4 space-y-6 max-h-[calc(100vh-210px)] overflow-y-auto custom-scrollbar">
            {filteredGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1.5">
                {sidebarOpen ? (
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-3 pt-2">
                    {group.title}
                  </h3>
                ) : (
                  <div className="h-px bg-slate-200/50 dark:bg-white/5 my-3 mx-2" />
                )}
                
                <div className="space-y-1">
                  {group.items.map((item, idx) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.view;
                    return (
                      <div key={idx} className="relative group">
                        <button
                          onClick={() => { setActiveView(item.view); setFocusId(null); }}
                          className={`w-full flex items-center py-2.5 rounded-xl transition-all relative ${
                            sidebarOpen ? 'px-4' : 'justify-center px-0'
                          } ${
                            isActive 
                              ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/5 text-indigo-650 dark:text-white border border-indigo-500/20 dark:border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)] font-bold' 
                              : 'text-slate-555 dark:text-slate-400 hover:bg-slate-100/55 dark:hover:bg-[#1A2640] border border-transparent'
                          }`}
                        >
                          {/* Active left indicator bar */}
                          {isActive && (
                            <motion.div 
                              layoutId="activeBar" 
                              className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-indigo-500 rounded-r-full shadow-[0_0_8px_rgba(99,102,241,0.8)]"
                            />
                          )}
                          
                          <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-indigo-500' : 'text-slate-400'} ${sidebarOpen && 'mr-3.5'}`} />
                          
                          {sidebarOpen && <span className="text-xs">{item.label}</span>}

                          {/* Collapsed dot active indicator */}
                          {!sidebarOpen && isActive && (
                            <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.8)]" />
                          )}
                        </button>

                        {/* Collapsed tooltip */}
                        {!sidebarOpen && (
                          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-[10px] font-bold uppercase tracking-wider opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap shadow-xl">
                            {item.label}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User profile section */}
        <div className="p-4 border-t border-slate-200/20 dark:border-white/5 space-y-3 relative z-10">
          <div className="relative group">
            <div className={`p-3 bg-slate-50 dark:bg-[#141D31] border border-slate-200/50 dark:border-white/5 rounded-2xl flex items-center justify-between transition-all ${
              sidebarOpen ? 'gap-3' : 'justify-center'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 font-extrabold text-xs flex items-center justify-center">
                    {getInitials(user.name)}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#141D31]"></span>
                </div>
                {sidebarOpen && (
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 leading-none truncate max-w-[130px]">{user.name}</span>
                    <span className="text-[9px] uppercase font-bold text-slate-400 mt-1 tracking-wider">{user.role}</span>
                  </div>
                )}
              </div>
              
              {sidebarOpen && (
                <button 
                  onClick={handleLogout} 
                  className="p-1 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {!sidebarOpen && (
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 p-3 rounded-xl bg-slate-900 border border-white/10 text-white z-50 whitespace-nowrap shadow-xl flex flex-col gap-1 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity">
                <span className="text-xs font-bold">{user.name}</span>
                <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-400">{user.role}</span>
                <button onClick={handleLogout} className="mt-2 text-[10px] font-black text-red-400 hover:underline flex items-center gap-1">
                  <LogOut className="w-3 h-3" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Floating Top Header navbar */}
        <header className="h-[76px] mx-6 mt-4 border border-slate-200/50 dark:border-white/5 bg-white/70 dark:bg-[#111827]/70 backdrop-blur-md flex items-center justify-between px-6 z-20 rounded-2xl shadow-xl shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#1A2640] border border-slate-200/10 text-slate-500 dark:text-slate-400 transition-colors"
            >
              <Menu className="w-4.5 h-4.5" />
            </button>

            {/* Quick Command shortcut display */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="hidden md:flex items-center gap-2.5 px-3.5 py-2 w-full max-w-sm rounded-xl bg-slate-100 dark:bg-[#141D31] border border-slate-200/5 dark:border-white/5 text-xs text-slate-555 dark:text-slate-400 hover:text-slate-355 transition-colors font-medium text-left"
            >
              <Search className="w-4 h-4 text-slate-400" />
              <span>Search vehicles, drivers, trips...</span>
              <kbd className="ml-auto px-2 py-0.5 rounded bg-white dark:bg-[#070B1A] border border-slate-200 dark:border-white/10 text-[9px] font-mono shadow-sm">Ctrl+K</kbd>
            </button>
          </div>

          {/* Center - Quick Action Pills */}
          <div className="hidden lg:flex items-center gap-2 mx-4">
            <button onClick={() => { setActiveView('trips'); }} className="px-3 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-extrabold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 transition-all">
              Create Trip
            </button>
            <button onClick={() => { setActiveView('vehicles'); }} className="px-3 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-extrabold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all">
              Register Vehicle
            </button>
            <button onClick={() => { setActiveView('expenses'); }} className="px-3 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-extrabold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-all">
              Log Expense
            </button>
            <button onClick={() => { setActiveView('reports'); }} className="px-3 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-extrabold bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 transition-all">
              Generate Report
            </button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            
            {/* Dark/Light mode toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#141D31] hover:bg-slate-200 dark:hover:bg-[#1A2640] border border-slate-200/10 text-slate-655 dark:text-slate-450 transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-450" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notifications Trigger Bell */}
            <div className="relative">
              <button
                onClick={() => { setShowNotificationDropdown(true); setShowProfileDropdown(false); }}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#141D31] hover:bg-slate-200 dark:hover:bg-[#1A2640] border border-slate-200/10 text-slate-655 dark:text-slate-455 transition-colors relative"
              >
                <Bell className="w-4 h-4" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 border border-white dark:border-[#141D31] animate-pulse"></span>
                )}
              </button>
            </div>

            {/* AI Assistant Quick Pill */}
            <button
              onClick={() => setActiveView('ai_assistant')}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-extrabold text-[10px] uppercase tracking-wider shadow-lg shadow-indigo-500/25 hover:brightness-110 active:scale-95 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Copilot</span>
            </button>

            {/* Profile Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => { setShowProfileDropdown(!showProfileDropdown); setShowNotificationDropdown(false); }}
                className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#141D31] hover:bg-slate-200 dark:hover:bg-[#1A2640] border border-slate-200/10 text-slate-655 dark:text-slate-455 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center font-extrabold text-xs text-indigo-400">
                  {getInitials(user.name)}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <AnimatePresence>
                {showProfileDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-64 bg-white dark:bg-[#0E1628] rounded-2xl shadow-2xl overflow-hidden border border-slate-200/50 dark:border-white/5 z-50 p-2 text-xs"
                  >
                    <div className="p-3 border-b border-slate-200/15 dark:border-white/5 flex flex-col gap-0.5">
                      <span className="font-black text-slate-800 dark:text-white text-sm">{user.name}</span>
                      <span className="text-[10px] font-bold text-indigo-400">{user.role}</span>
                      <span className="text-[9px] text-slate-400 font-medium truncate mt-0.5 font-bold">m.sterling@transitops.com</span>
                    </div>
                    <div className="p-1 space-y-1">
                      <button onClick={() => { setActiveView('dashboard'); setShowProfileDropdown(false); }} className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#1A2640] font-bold flex items-center gap-2 text-slate-655 dark:text-slate-300">
                        <User className="w-3.5 h-3.5 text-slate-400" /> Profile Settings
                      </button>
                      <button onClick={() => { setActiveView('dashboard'); setShowProfileDropdown(false); }} className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#1A2640] font-bold flex items-center gap-2 text-slate-655 dark:text-slate-300">
                        <Sliders className="w-3.5 h-3.5 text-slate-400" /> Preferences
                      </button>
                    </div>
                    <div className="p-1 border-t border-slate-200/15 dark:border-white/5 mt-1">
                      <button onClick={() => { handleLogout(); setShowProfileDropdown(false); }} className="w-full text-left px-3 py-2 rounded-xl hover:bg-red-500/15 text-red-500 font-bold flex items-center gap-2">
                        <LogOut className="w-3.5 h-3.5" /> Logout Session
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </header>

        {/* Dynamic Navigation Breadcrumbs & System Status Bar */}
        <div className="shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 px-6 mt-4">
            {getBreadcrumbs().map((b, i, arr) => (
              <React.Fragment key={i}>
                <span className={i === arr.length - 1 ? "text-slate-800 dark:text-white font-bold" : ""}>{b}</span>
                {i < arr.length - 1 && <ChevronRight className="w-3 h-3 text-slate-400" />}
              </React.Fragment>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 px-6 mb-4">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-500 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              System Online
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black text-indigo-400 uppercase tracking-wider">
              <Activity className="w-3 h-3" />
              Fleet Health: 98.4%
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[9px] font-black text-cyan-400 uppercase tracking-wider">
              <Globe className="w-3 h-3" />
              API Gateway: Stable
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-500/10 border border-slate-200/10 dark:border-white/5 text-[9px] font-bold text-slate-655 dark:text-slate-455">
              <Clock className="w-3 h-3 text-slate-400" />
              <LiveClock />
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[9px] font-black text-purple-400 uppercase tracking-wider">
              <Sparkles className="w-3 h-3 animate-pulse" />
              Live Updates
            </div>
          </div>
        </div>

        {/* Dynamic page container */}
        <main className="flex-1 overflow-y-auto p-6 pt-0 custom-scrollbar">
          {activeView === 'dashboard' && <Dashboard user={user} onNavigate={setActiveView} />}
          {activeView === 'fleet_map' && <FleetMap user={user} />}
          {activeView === 'vehicles' && <Vehicles user={user} focusId={focusId} />}
          {activeView === 'drivers' && <Drivers user={user} focusId={focusId} />}
          {activeView === 'trips' && <Trips user={user} />}
          {activeView === 'maintenance' && <Maintenance user={user} />}
          {activeView === 'expenses' && <Expenses user={user} />}
          {activeView === 'reports' && <Reports user={user} />}
          {activeView === 'ai_assistant' && <AISearch user={user} />}
        </main>
      </div>

      {/* Global Command Palette modal overlay */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={setActiveView}
        onQuickAction={handleQuickAction}
      />

      {/* SLIDING NOTIFICATION DRAWER OVERLAY */}
      <AnimatePresence>
        {showNotificationDropdown && (
          <div className="fixed inset-0 z-50 flex justify-end">
            
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotificationDropdown(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Drawer body */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="w-96 h-full bg-[#0E1628] border-l border-white/5 relative z-10 p-6 flex flex-col justify-between shadow-2xl text-slate-355"
            >
              <div className="space-y-6 flex-1 flex flex-col min-h-0">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div>
                    <h2 className="text-base font-black text-white flex items-center gap-2">
                      <Bell className="w-5 h-5 text-indigo-400" /> Operations Center
                    </h2>
                    <span className="text-[10px] text-slate-500 font-bold uppercase mt-1 block font-bold">Live Audit warnings & recommend alerts</span>
                  </div>
                  <button 
                    onClick={() => setShowNotificationDropdown(false)}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Search & Actions */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 bg-[#070B1A] border border-white/5 rounded-xl px-3 py-2 text-xs">
                    <Search className="w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="Search alerts..." 
                      value={notificationSearch}
                      onChange={(e) => setNotificationSearch(e.target.value)}
                      className="bg-transparent font-medium text-white focus:outline-none w-full placeholder-slate-550"
                    />
                  </div>

                  {/* Tabs Category filters */}
                  <div className="flex items-center justify-between border-b border-white/5 pb-2 text-[10px] font-black uppercase tracking-wider text-slate-555">
                    <button onClick={() => setNotificationCategory('ALL')} className={`pb-1 border-b-2 ${notificationCategory === 'ALL' ? 'border-indigo-500 text-indigo-400 font-black' : 'border-transparent hover:text-slate-400'}`}>All</button>
                    <button onClick={() => setNotificationCategory('CRITICAL')} className={`pb-1 border-b-2 ${notificationCategory === 'CRITICAL' ? 'border-red-500 text-red-400 font-black' : 'border-transparent hover:text-slate-400'}`}>Critical</button>
                    <button onClick={() => setNotificationCategory('OPERATIONS')} className={`pb-1 border-b-2 ${notificationCategory === 'OPERATIONS' ? 'border-indigo-500 text-indigo-400 font-bold' : 'border-transparent hover:text-slate-400'}`}>Ops</button>
                    <button onClick={() => setNotificationCategory('SYSTEM')} className={`pb-1 border-b-2 ${notificationCategory === 'SYSTEM' ? 'border-cyan-500 text-cyan-400' : 'border-transparent hover:text-slate-400'}`}>System</button>
                  </div>

                  {/* Global Actions */}
                  <div className="flex justify-between items-center text-[10px] font-black uppercase text-indigo-455 px-1">
                    <button onClick={markAllAsRead} className="hover:underline flex items-center gap-1">
                      <Check className="w-3 h-3" /> Mark all read
                    </button>
                    <button onClick={clearAllNotifications} className="hover:underline text-red-500 flex items-center gap-1">
                      <Trash2 className="w-3 h-3" /> Clear all
                    </button>
                  </div>
                </div>

                {/* Notifications list queue */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
                  {filteredNotifications.length === 0 ? (
                    <div className="p-12 text-center text-xs text-slate-500">No active warnings. System running stable.</div>
                  ) : (
                    filteredNotifications.map((n) => (
                      <div 
                        key={n.id} 
                        className={`p-3.5 rounded-xl border flex gap-3 items-start relative transition-all ${
                          n.read ? 'opacity-55' : 'opacity-100'
                        } ${
                          n.type === 'danger' 
                            ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                            : n.type === 'warning'
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                            : n.type === 'success'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-450'
                        }`}
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-xs text-white">{n.title}</span>
                            <span className="text-[9px] text-slate-500 font-bold">{n.time}</span>
                          </div>
                          <p className="text-xs font-semibold leading-relaxed text-slate-355">{n.message}</p>
                          <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-white/5 text-[9px] uppercase tracking-wider font-extrabold text-slate-500">
                            <span>{n.category}</span>
                            {!n.read && (
                              <button onClick={() => markAsRead(n.id)} className="text-indigo-400 hover:underline flex items-center gap-0.5 ml-auto">
                                <Check className="w-2.5 h-2.5" /> Mark Read
                              </button>
                            )}
                            <button onClick={() => deleteNotification(n.id)} className={`text-red-455 hover:underline flex items-center gap-0.5 ${n.read ? 'ml-auto' : 'ml-2'}`}>
                              <Trash2 className="w-2.5 h-2.5" /> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>

          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

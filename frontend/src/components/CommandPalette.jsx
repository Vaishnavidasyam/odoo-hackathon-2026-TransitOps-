import React, { useState, useEffect, useRef } from 'react';
import { Search, Compass, Truck, Users, Calendar, Settings, HelpCircle, Terminal } from 'lucide-react';

export default function CommandPalette({ isOpen, onClose, onNavigate, vehicles = [], drivers = [], onQuickAction }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Base navigation items
  const navItems = [
    { type: 'nav', label: 'Go to Dashboard', icon: Compass, action: () => onNavigate('dashboard') },
    { type: 'nav', label: 'Go to Vehicle Registry', icon: Truck, action: () => onNavigate('vehicles') },
    { type: 'nav', label: 'Go to Driver Profiles', icon: Users, action: () => onNavigate('drivers') },
    { type: 'nav', label: 'Go to Dispatch Board', icon: Calendar, action: () => onNavigate('trips') },
    { type: 'nav', label: 'Go to Maintenance Shop', icon: Settings, action: () => onNavigate('maintenance') },
    { type: 'nav', label: 'Go to Expenses & Fuel Ledger', icon: HelpCircle, action: () => onNavigate('expenses') },
    { type: 'nav', label: 'Go to Reports & Analytics', icon: HelpCircle, action: () => onNavigate('reports') },
  ];

  // Quick command actions
  const commandItems = [
    { type: 'cmd', label: 'Create New Trip (/dispatch)', icon: Terminal, action: () => { onNavigate('trips'); onQuickAction?.('createTrip'); } },
    { type: 'cmd', label: 'Add New Vehicle (/vehicle)', icon: Terminal, action: () => { onNavigate('vehicles'); onQuickAction?.('createVehicle'); } },
    { type: 'cmd', label: 'Add New Driver (/driver)', icon: Terminal, action: () => { onNavigate('drivers'); onQuickAction?.('createDriver'); } },
    { type: 'cmd', label: 'Log Maintenance Work (/maintenance)', icon: Terminal, action: () => { onNavigate('maintenance'); onQuickAction?.('createMaintenance'); } },
  ];

  // Search items compilation
  const filteredVehicles = vehicles
    .filter(v => v.registrationNumber.toLowerCase().includes(query.toLowerCase()) || v.nameModel.toLowerCase().includes(query.toLowerCase()))
    .map(v => ({
      type: 'vehicle',
      label: `Vehicle: ${v.registrationNumber} - ${v.nameModel} (${v.status})`,
      icon: Truck,
      action: () => { onNavigate('vehicles'); onQuickAction?.('focusVehicle', v._id); }
    }))
    .slice(0, 3);

  const filteredDrivers = drivers
    .filter(d => d.name.toLowerCase().includes(query.toLowerCase()) || d.licenseNumber.toLowerCase().includes(query.toLowerCase()))
    .map(d => ({
      type: 'driver',
      label: `Driver: ${d.name} (${d.status})`,
      icon: Users,
      action: () => { onNavigate('drivers'); onQuickAction?.('focusDriver', d._id); }
    }))
    .slice(0, 3);

  const allItems = [
    ...navItems.filter(item => item.label.toLowerCase().includes(query.toLowerCase())),
    ...commandItems.filter(item => item.label.toLowerCase().includes(query.toLowerCase())),
    ...filteredVehicles,
    ...filteredDrivers
  ];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % allItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + allItems.length) % allItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (allItems[selectedIndex]) {
          allItems[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, allItems]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
      {/* Overlay */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>

      {/* Palette Container */}
      <div 
        ref={containerRef}
        className="glass w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200/50 dark:border-slate-800/50 flex flex-col z-10"
      >
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-slate-200/20">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none text-sm"
            placeholder="Type a command or search fleet assets..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
          />
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[300px] overflow-y-auto p-2">
          {allItems.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">
              No matching assets or operations found.
            </div>
          ) : (
            allItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={idx}
                  onClick={() => { item.action(); onClose(); }}
                  className={`flex items-center px-3 py-2.5 rounded-xl cursor-pointer transition-colors duration-150 ${
                    isSelected 
                      ? 'bg-indigo-600 text-white' 
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 mr-3 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                  <span className="text-xs font-semibold flex-1">{item.label}</span>
                  {item.type === 'cmd' && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${
                      isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}>
                      Action
                    </span>
                  )}
                  {item.type === 'nav' && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${
                      isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}>
                      Menu
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-slate-100/50 dark:bg-slate-900/50 border-t border-slate-200/20 flex items-center justify-between text-[10px] text-slate-400 font-medium">
          <div className="flex items-center gap-3">
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
          </div>
          <span>TransitOps Command Palette</span>
        </div>
      </div>
    </div>
  );
}

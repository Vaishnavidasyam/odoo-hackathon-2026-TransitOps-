import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Terminal, Sparkles, Truck, Users, Calendar, AlertTriangle, Command, Bot, User, Clock, Activity, Settings, Zap, History, ChevronRight } from 'lucide-react';
import { api } from '../api';

export default function AISearch({ user }) {
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: "Hello! I am your TransitOps Fleet Operations Copilot. How can I assist you with the fleet today?",
      options: [
        "Which vehicles are currently in the shop?",
        "Find driver Alex Mercer",
        "Identify high-risk drivers"
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e, forcedInput = null) => {
    if (e) e.preventDefault();
    
    const userText = forcedInput !== null ? forcedInput.trim() : input.trim();
    if (!userText) return;

    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setInput('');
    setLoading(true);

    try {
      let replyContent = '';
      let replyDataCard = null;
      let replyOptions = null;

      const lowerText = userText.toLowerCase();

      if (lowerText.includes('vehicle') && (lowerText.includes('shop') || lowerText.includes('maintenance'))) {
        const vehicles = await api.getVehicles();
        const shopVehicles = vehicles.filter(v => v.status === 'In Shop');
        
        if (shopVehicles.length > 0) {
          replyContent = `Found **${shopVehicles.length}** vehicle(s) currently in the shop for maintenance.`;
          replyDataCard = (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {shopVehicles.map((v, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={v._id} 
                  className="p-3 bg-[#1E293B]/50 hover:bg-[#1E293B] border border-amber-500/30 rounded-xl flex items-center justify-between text-xs transition-colors"
                >
                  <div className="flex items-center gap-3 text-slate-200">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center border border-amber-500/20">
                      <Truck className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm">{v.registrationNumber}</span>
                      <span className="text-slate-400">{v.nameModel}</span>
                    </div>
                  </div>
                  <span className="font-bold text-[10px] uppercase bg-amber-500/20 px-2 py-1 rounded-md text-amber-500 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]">In Shop</span>
                </motion.div>
              ))}
            </div>
          );
        } else {
          replyContent = "No vehicles are currently checked into the maintenance shop. All active fleet is operational.";
        }
      } else if (lowerText.includes('find driver') || lowerText.includes('search driver')) {
        const match = userText.match(/(?:find|search) driver\s+(.+)/i);
        const nameQuery = match ? match[1].toLowerCase() : '';
        const drivers = await api.getDrivers();
        const driver = drivers.find(d => d.name.toLowerCase().includes(nameQuery));

        if (driver) {
          replyContent = `I found the profile for **${driver.name}** in the driver database.`;
          replyDataCard = (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 p-5 bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-indigo-500/30 rounded-2xl text-xs text-slate-200 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Users className="w-24 h-24" />
              </div>
              <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                  <User className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">{driver.name}</h3>
                  <span className="text-indigo-400 font-medium">Active Driver Profile</span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
                <div className="bg-[#0B1120]/50 p-3 rounded-xl border border-white/5 flex flex-col gap-1">
                  <span className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold">License</span>
                  <strong className="text-sm font-mono text-white">{driver.licenseNumber}</strong>
                </div>
                <div className="bg-[#0B1120]/50 p-3 rounded-xl border border-white/5 flex flex-col gap-1">
                  <span className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold">Category</span>
                  <strong className="text-sm font-mono text-white">{driver.licenseCategory}</strong>
                </div>
                <div className="bg-[#0B1120]/50 p-3 rounded-xl border border-white/5 flex flex-col gap-1">
                  <span className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold">Safety Score</span>
                  <strong className={`text-sm font-black ${driver.safetyScore >= 90 ? 'text-emerald-400' : driver.safetyScore >= 80 ? 'text-amber-400' : 'text-red-400'}`}>
                    {driver.safetyScore}/100
                  </strong>
                </div>
                <div className="bg-[#0B1120]/50 p-3 rounded-xl border border-white/5 flex flex-col gap-1">
                  <span className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold">Status</span>
                  <strong className="text-sm text-white">{driver.status}</strong>
                </div>
              </div>
            </motion.div>
          );
        } else {
          replyContent = `I could not find a driver matching that name. If you're testing, try asking me to "Find driver Alex".`;
        }
      } else if (lowerText.includes('high risk') || lowerText.includes('risk') || lowerText.includes('expired')) {
        const drivers = await api.getDrivers();
        const highRisk = drivers.filter(d => d.safetyScore < 85 || new Date(d.licenseExpiryDate) < new Date());

        if (highRisk.length > 0) {
          replyContent = `Critical Alert: Identified **${highRisk.length}** high-risk driver(s) requiring immediate attention due to low safety scores or expired licenses.`;
          replyDataCard = (
            <div className="mt-4 grid grid-cols-1 gap-3">
              {highRisk.map((d, i) => {
                const isExpired = new Date(d.licenseExpiryDate) < new Date();
                return (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={d._id} 
                    className="p-4 bg-red-950/20 hover:bg-red-950/40 border border-red-500/30 rounded-xl flex items-center justify-between text-xs text-slate-200 transition-colors relative overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center border border-red-500/30">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-red-50">{d.name}</span>
                        <span className="text-red-300/70 text-[10px] uppercase tracking-widest">{d.licenseNumber}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {d.safetyScore < 85 && (
                        <span className="font-bold text-[10px] uppercase bg-orange-500/20 px-2 py-1 rounded-md text-orange-400 border border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.1)]">
                          Score: {d.safetyScore}
                        </span>
                      )}
                      {isExpired && (
                        <span className="font-bold text-[10px] uppercase bg-red-500/20 px-2 py-1 rounded-md text-red-400 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)] flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Expired
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          );
        } else {
          replyContent = "Fleet Compliance Check: All active drivers comply with license validity and exceed safety targets (score > 85).";
        }
      } else {
        replyContent = "I could not fully parse that operation. Currently, I am optimized for specific fleet tasks.";
        replyOptions = [
          "Which vehicles are in the shop?",
          "Find driver Alex Mercer",
          "Identify high risk drivers"
        ];
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: replyContent, 
        dataCard: replyDataCard,
        options: replyOptions
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Apologies, I encountered a processing error: ' + err.message }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-100px)] -mt-4 bg-[#070B1A] text-slate-300 font-sans overflow-hidden rounded-2xl border border-white/5 shadow-2xl">
      
      {/* Left Sidebar - History & Prompts */}
      <div className="w-72 bg-[#0B1120] border-r border-white/5 flex flex-col hidden lg:flex relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 left-0 w-full h-32 bg-indigo-500/5 blur-[80px] pointer-events-none"></div>

        <div className="p-6 pb-2 border-b border-white/5 relative z-10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Command className="w-5 h-5 text-indigo-400" /> Copilot
          </h2>
          <p className="text-xs text-slate-500 mt-1">Enterprise Fleet Operations</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 relative z-10 custom-scrollbar">
          
          <div className="space-y-2">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-2 flex items-center gap-1.5">
              <Zap className="w-3 h-3" /> Quick Actions
            </h3>
            <button onClick={() => handleSend(null, "Which vehicles are in the shop?")} className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 text-xs font-medium text-slate-300 transition-all flex items-center justify-between group">
              <span className="flex items-center gap-2">
                <Truck className="w-3.5 h-3.5 text-amber-400" /> Maintenance Check
              </span>
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </button>
            <button onClick={() => handleSend(null, "Identify high risk drivers")} className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 text-xs font-medium text-slate-300 transition-all flex items-center justify-between group">
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> Risk Analysis
              </span>
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </button>
            <button onClick={() => handleSend(null, "Find driver Alex Mercer")} className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 text-xs font-medium text-slate-300 transition-all flex items-center justify-between group">
              <span className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-indigo-400" /> Driver Search
              </span>
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </button>
          </div>

          <div className="space-y-2">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-2 flex items-center gap-1.5">
              <History className="w-3 h-3" /> Recent Queries
            </h3>
            <div className="space-y-1">
              {['Show fleet ROI', 'Update maintenance logs', 'Weekly expense report'].map((item, idx) => (
                <div key={idx} className="px-3 py-2 text-xs text-slate-500 hover:text-slate-300 cursor-pointer transition-colors truncate">
                  "{item}"
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Center - Main Chat Interface */}
      <div className="flex-1 flex flex-col bg-[#070B1A] relative z-20">
        
        {/* Top bar for mobile/tablet */}
        <div className="lg:hidden p-4 border-b border-white/5 flex items-center justify-between bg-[#0B1120]">
          <h2 className="text-md font-bold text-white flex items-center gap-2">
            <Command className="w-4 h-4 text-indigo-400" /> Copilot
          </h2>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar">
          <AnimatePresence initial={false}>
            {messages.map((m, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-4 w-full max-w-2xl ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  
                  {/* Avatar */}
                  <div className="shrink-0 mt-1 hidden sm:block">
                    {m.role === 'user' ? (
                      <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-white/10 flex items-center justify-center shadow-xl">
                        <Bot className="w-4 h-4 text-indigo-400" />
                      </div>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={`flex flex-col gap-2 flex-1 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 px-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {m.role === 'user' ? 'You' : 'Fleet AI'}
                      </span>
                    </div>
                    
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-lg ${
                      m.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-sm shadow-indigo-900/20'
                        : 'bg-[#1E293B]/40 border border-white/5 text-slate-200 rounded-tl-sm backdrop-blur-md'
                    }`}>
                      {/* Simple markdown parsing for bold text */}
                      <div dangerouslySetInnerHTML={{ __html: m.content.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>') }} />
                    </div>
                    
                    {/* Data Card Insertion */}
                    {m.dataCard && (
                      <div className="w-full mt-2">
                        {m.dataCard}
                      </div>
                    )}

                    {/* Option Chips */}
                    {m.options && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {m.options.map((opt, i) => (
                          <button 
                            key={i}
                            onClick={() => handleSend(null, opt)}
                            className="text-xs px-3 py-1.5 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 transition-colors"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}

                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start gap-4 max-w-2xl">
              <div className="shrink-0 mt-1 hidden sm:block">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-white/10 flex items-center justify-center shadow-xl">
                  <Bot className="w-4 h-4 text-indigo-400" />
                </div>
              </div>
              <div className="bg-[#1E293B]/40 border border-white/5 p-4 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-gradient-to-t from-[#070B1A] via-[#070B1A] to-transparent pt-12 relative z-30">
          <form 
            onSubmit={(e) => handleSend(e)} 
            className="max-w-3xl mx-auto bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex items-end gap-2 shadow-[0_0_30px_rgba(0,0,0,0.5)] focus-within:border-indigo-500/50 transition-colors"
          >
            <div className="p-3 shrink-0">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <textarea
              className="flex-1 max-h-32 min-h-[44px] bg-transparent text-sm text-white focus:outline-none placeholder-slate-500 resize-none py-3 custom-scrollbar"
              placeholder="Ask Copilot about fleet status, driver risks, or maintenance..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              rows={1}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-3 mb-1 mr-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white transition-all flex items-center justify-center shadow-lg shadow-indigo-600/20 disabled:shadow-none"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="text-center mt-3 text-[10px] text-slate-500 font-medium">
            AI Copilot can make mistakes. Verify critical fleet decisions with operational dashboards.
          </div>
        </div>

      </div>

      {/* Right Sidebar - Active Telemetry Context */}
      <div className="w-80 bg-[#0B1120] border-l border-white/5 flex flex-col hidden xl:flex">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
            <Activity className="w-4 h-4 text-emerald-400" /> Active Telemetry
          </h2>
        </div>
        
        <div className="p-4 space-y-4">
          
          <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] p-4 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Truck className="w-16 h-16" />
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">System Status</span>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <div className="text-2xl font-black text-white">Online</div>
            <div className="text-xs text-emerald-400 font-medium mt-1">All APIs connected</div>
          </div>

          <div className="bg-[#1E293B]/30 p-4 rounded-2xl border border-white/5">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Settings className="w-3 h-3" /> Model Config
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Knowledge Base</span>
                <span className="text-white font-medium">TransitOps v2.1</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Response Speed</span>
                <span className="text-white font-medium text-amber-400">Optimized</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Security Tier</span>
                <span className="text-white font-medium text-emerald-400">Enterprise</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

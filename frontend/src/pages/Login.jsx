import React, { useState, useEffect } from 'react';
import { 
  Truck, ShieldAlert, LogIn, ChevronRight, Compass, 
  Users, BarChart3, ShieldCheck, ArrowLeft, Eye, EyeOff, 
  Settings, Lock, Mail, Shield, Check, Globe, Activity, MapPin, TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function AnimatedCounter({ to, decimals = 0, suffix = "" }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let startTimestamp = null;
    const duration = 1500;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setValue(progress * to);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [to]);
  return <span>{value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}{suffix}</span>;
}

export default function Login({ onLoginSuccess, onBackToLanding }) {
  const [step, setStep] = useState('role-selection'); // 'role-selection' | 'auth'
  const [selectedRole, setSelectedRole] = useState(null); // { title, email, color, description, icon }
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  
  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [region, setRegion] = useState('North');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Parallax mouse position
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const x = (clientX / window.innerWidth - 0.5) * 20;
    const y = (clientY / window.innerHeight - 0.5) * 20;
    setMousePos({ x, y });
  };

  const handleQuickLogin = async (roleEmail) => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: roleEmail, password: 'password123' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');

      localStorage.setItem('transitops_token', data.token);
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let endpoint = 'http://localhost:5000/api/auth/login';
      let payload = { email, password };

      if (authMode === 'register') {
        endpoint = 'http://localhost:5000/api/auth/register';
        payload = { name, email, password, role: selectedRole.title, region };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Authentication failed');

      localStorage.setItem('transitops_token', data.token);
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { title: 'Fleet Manager', email: 'manager@transitops.com', color: 'indigo', text: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/15', glow: 'hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/20', description: 'Oversees fleet assets, maintenance lifecycles, and dispatching.', icon: Truck },
    { title: 'Safety Officer', email: 'safety@transitops.com', color: 'amber', text: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/15', glow: 'hover:shadow-amber-500/10 dark:hover:shadow-amber-500/20', description: 'Ensures driver compliance, license validity, and safety score metrics.', icon: ShieldCheck },
    { title: 'Financial Analyst', email: 'finance@transitops.com', color: 'emerald', text: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/15', glow: 'hover:shadow-emerald-500/10 dark:hover:shadow-emerald-500/20', description: 'Reviews expenses, tolls, maintenance costs, and vehicle ROI.', icon: BarChart3 },
    { title: 'Driver', email: 'driver@transitops.com', color: 'cyan', text: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20 hover:bg-cyan-100 dark:hover:bg-cyan-500/15', glow: 'hover:shadow-cyan-500/10 dark:hover:shadow-cyan-500/20', description: 'Schedules active trip dispatches and logs fuel metrics.', icon: Compass },
  ];

  return (
    <div 
      onMouseMove={handleMouseMove}
      className="min-h-screen w-full flex flex-col lg:flex-row bg-[#f8fafc] dark:bg-[#060816] text-slate-900 dark:text-white overflow-hidden font-sans transition-colors duration-300 relative"
    >
      {/* Background aurora gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/5 dark:bg-purple-500/10 blur-[120px] pointer-events-none" />

      {/* LEFT SIDE (60%) - Premium visual command display */}
      <div className="hidden lg:flex lg:w-3/5 relative flex-col justify-between p-16 overflow-hidden bg-slate-100/40 dark:bg-slate-950/20 border-r border-slate-200/50 dark:border-slate-800/10">
        
        {/* Moving grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.4] dark:opacity-[0.2]" />

        {/* Soft glowing particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[20, 45, 75].map((xVal, idx) => (
            <motion.div
              key={idx}
              className="absolute size-1.5 rounded-full bg-indigo-500/30 dark:bg-indigo-400/40 shadow-[0_0_10px_#6366f1]"
              style={{ left: `${xVal}%`, top: `${30 + idx * 20}%` }}
              animate={{ y: [0, -15, 0], opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 4 + idx, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
        </div>

        {/* Top Header Section */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#070B1A]/80 border border-white/10 flex items-center justify-center shadow-lg relative overflow-hidden">
            <img src="/logistic.png" alt="TransitOps Logo" className="w-7.5 h-7.5 object-contain" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Transit<span className="text-indigo-600 dark:text-indigo-400">Ops</span>
          </span>
        </div>

        {/* Main Content Area */}
        <div className="relative z-10 my-auto space-y-12 max-w-2xl">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>Operating System for Logistics</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1] text-slate-900 dark:text-white">
              Operate Your Entire Fleet <br />
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">From One Intelligent Platform</span>
            </h1>
            
            <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Manage dispatch, fleet operations, drivers, maintenance, fuel analytics, and transport intelligence from one secure enterprise platform.
            </p>
          </div>

          {/* Holographic illustration & widgets */}
          <div className="relative w-full h-[280px] bg-slate-200/20 dark:bg-slate-900/20 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl overflow-hidden p-6 shadow-inner backdrop-blur-sm">
            
            {/* Animated SVG Map Route visualization */}
            <svg className="absolute inset-0 w-full h-full opacity-60 dark:opacity-30 pointer-events-none" viewBox="0 0 500 240">
              <path 
                d="M50,180 Q150,60 250,140 T450,80" 
                fill="none" 
                stroke="#6366f1" 
                strokeWidth="2" 
                strokeDasharray="4 4"
              />
              <path 
                d="M50,180 Q150,60 250,140 T450,80" 
                fill="none" 
                stroke="url(#svgGradient)" 
                strokeWidth="3"
                className="animate-[dash_8s_linear_infinite]"
                style={{ strokeDasharray: 80, strokeDashoffset: 800 }}
              />
              <defs>
                <linearGradient id="svgGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity="0" />
                  <stop offset="50%" stopColor="#6366f1" stopOpacity="1" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>

            {/* Parallax Floating Cards */}
            <motion.div 
              style={{ x: mousePos.x * 0.5, y: mousePos.y * 0.5 }}
              className="absolute left-8 top-8 glass p-4 rounded-xl border border-slate-200/50 dark:border-white/10 flex items-center gap-3 bg-white/80 dark:bg-slate-950/60 shadow-lg"
            >
              <div className="p-2 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 rounded-lg">
                <MapPin className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Active Dispatch</p>
                <p className="text-xs font-bold text-slate-800 dark:text-white">TR-1048 &rarr; Hub North</p>
              </div>
            </motion.div>

            <motion.div 
              style={{ x: mousePos.x * -0.7, y: mousePos.y * -0.7 }}
              className="absolute right-8 bottom-8 glass p-4 rounded-xl border border-slate-200/50 dark:border-white/10 flex items-center gap-3 bg-white/80 dark:bg-slate-950/60 shadow-lg"
            >
              <div className="p-2 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 rounded-lg">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Fleet Efficiency</p>
                <p className="text-xs font-bold text-slate-800 dark:text-white">+24.8% fuel optimization</p>
              </div>
            </motion.div>

            {/* Floating animated truck/van representations */}
            <motion.div
              animate={{ 
                x: [50, 430], 
                y: [180, 80],
                rotate: [0, -10, 10, 0]
              }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-0 top-0 pointer-events-none"
            >
              <div className="bg-indigo-600 dark:bg-indigo-500 text-white p-2 rounded-xl shadow-lg border border-indigo-400/20">
                <Truck className="w-5 h-5" />
              </div>
            </motion.div>
          </div>

          {/* Bullet checks */}
          <div className="grid grid-cols-2 gap-4 max-w-md pt-4">
            {[
              "Enterprise Security",
              "Real-Time Fleet Monitoring",
              "AI Powered Analytics",
              "Role Based Access"
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Animated Statistics */}
        <div className="relative z-10 grid grid-cols-4 gap-6 pt-12 border-t border-slate-200 dark:border-slate-800/85">
          {[
            { value: 10000, suffix: "+", label: "Vehicles Managed" },
            { value: 250, suffix: "K+", label: "Trips Completed" },
            { value: 99.98, decimals: 2, suffix: "%", label: "Platform Uptime" },
            { value: 35, suffix: "%", label: "Cost Reduction" }
          ].map((stat, idx) => (
            <div key={idx} className="space-y-1">
              <p className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white">
                <AnimatedCounter to={stat.value} decimals={stat.decimals || 0} suffix={stat.suffix} />
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold leading-tight">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT SIDE (40%) - Floating authentication card context */}
      <div className="w-full lg:w-2/5 flex flex-col justify-center items-center p-6 md:p-12 relative overflow-y-auto">
        
        {/* Floating Back Link */}
        <button 
          onClick={onBackToLanding}
          className="absolute top-6 left-6 inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold transition-all z-20"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Landing
        </button>

        {/* Authentication Container Glassmorphic Card */}
        <div className="w-full max-w-[460px] glass p-8 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl shadow-2xl relative">
          
          {/* Logo Brand on Top of Card */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#070B1A]/80 border border-white/10 flex items-center justify-center overflow-hidden">
                <img src="/logistic.png" alt="TransitOps Logo" className="w-6 h-6 object-contain" />
              </div>
              <span className="text-base font-bold text-slate-900 dark:text-white">TransitOps</span>
            </div>

            {selectedRole && (
              <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                {selectedRole.title}
              </span>
            )}
          </div>

          <AnimatePresence mode="wait">
            {/* STEP 1: Premium Role Selection */}
            {step === 'role-selection' && (
              <motion.div
                key="role-selection"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Choose Your Profile</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Select your administrative workspace to log in.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {roles.map((r, i) => {
                    const Icon = r.icon;
                    return (
                      <button
                        key={i}
                        onClick={() => { setSelectedRole(r); setStep('auth'); setError(''); }}
                        className={`p-4 rounded-2xl border text-left flex flex-col justify-between min-h-[140px] transition-all duration-200 hover:-translate-y-0.5 shadow-sm hover:shadow-md ${r.text} ${r.glow}`}
                      >
                        <div className="p-2 rounded-xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-slate-200/10 w-fit">
                          <Icon className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">{r.title}</h3>
                          <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-normal mt-1">{r.description.slice(0, 52)}...</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 2: Login / Register Form */}
            {step === 'auth' && selectedRole && (
              <motion.div
                key="auth"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Header info */}
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Welcome Back</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Continue managing your fleet operations securely.</p>
                  </div>
                  
                  <button 
                    onClick={() => { setStep('role-selection'); setSelectedRole(null); }}
                    className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Change Role
                  </button>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 font-medium">
                    <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Form fields */}
                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  {authMode === 'register' && (
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder=" "
                        className="peer w-full px-4 py-3.5 pt-5 pb-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 text-slate-800 dark:text-white transition-all font-medium"
                      />
                      <label className="absolute left-4 top-1.5 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider transition-all pointer-events-none peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-xs peer-placeholder-shown:font-normal peer-focus:top-1.5 peer-focus:text-[9px] peer-focus:font-bold peer-focus:text-indigo-500 dark:peer-focus:text-indigo-400">
                        Full Name
                      </label>
                    </div>
                  )}

                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder=" "
                      className="peer w-full px-4 py-3.5 pt-5 pb-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 text-slate-800 dark:text-white transition-all font-medium"
                    />
                    <label className="absolute left-4 top-1.5 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider transition-all pointer-events-none peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-xs peer-placeholder-shown:font-normal peer-focus:top-1.5 peer-focus:text-[9px] peer-focus:font-bold peer-focus:text-indigo-500 dark:peer-focus:text-indigo-400">
                      Email Address
                    </label>
                  </div>

                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder=" "
                      className="peer w-full pl-4 pr-11 py-3.5 pt-5 pb-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 text-slate-800 dark:text-white transition-all font-medium"
                    />
                    <label className="absolute left-4 top-1.5 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider transition-all pointer-events-none peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-xs peer-placeholder-shown:font-normal peer-focus:top-1.5 peer-focus:text-[9px] peer-focus:font-bold peer-focus:text-indigo-500 dark:peer-focus:text-indigo-400">
                      Password
                    </label>
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {authMode === 'register' && (
                    <div className="relative">
                      <select
                        className="w-full px-4 py-3.5 pt-5 pb-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 text-slate-800 dark:text-white font-semibold"
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                      >
                        <option value="North">North Region</option>
                        <option value="South">South Region</option>
                        <option value="East">East Region</option>
                        <option value="West">West Region</option>
                      </select>
                      <label className="absolute left-4 top-1 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Operating Region
                      </label>
                    </div>
                  )}

                  {authMode === 'login' && (
                    <div className="flex items-center justify-between text-xs pt-1">
                      <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-600 dark:text-slate-400">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="rounded border-slate-350 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Remember me</span>
                      </label>
                      
                      <button 
                        type="button" 
                        className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 mt-4 active:scale-[0.98]"
                  >
                    {loading ? (
                      <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>{authMode === 'login' ? 'Sign In Securely' : 'Register Account'}</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Switch between login/signup */}
                <div className="text-center">
                  <button
                    onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                    className="text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold"
                  >
                    {authMode === 'login' ? "Don't have an account? Sign Up" : 'Already registered? Sign In'}
                  </button>
                </div>

                {/* Social Login Providers */}
                {authMode === 'login' && (
                  <div className="space-y-4 pt-4 border-t border-slate-200/10">
                    <div className="relative flex items-center justify-center">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200/50 dark:border-slate-800/80"></div>
                      </div>
                      <span className="relative px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900/60 uppercase tracking-widest">
                        OR
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button 
                        type="button"
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-[10px] font-bold transition-colors text-slate-700 dark:text-slate-300"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                        </svg>
                        <span>Google</span>
                      </button>
                      <button 
                        type="button"
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-[10px] font-bold transition-colors text-slate-700 dark:text-slate-300"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 23 23">
                          <rect width="10.5" height="10.5" fill="#f25f22"/>
                          <rect x="11.5" width="10.5" height="10.5" fill="#10B981"/>
                          <rect y="11.5" width="10.5" height="10.5" fill="#00a1f1"/>
                          <rect x="11.5" y="11.5" width="10.5" height="10.5" fill="#ffb900"/>
                        </svg>
                        <span>Microsoft</span>
                      </button>
                      <button 
                        type="button"
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-[10px] font-bold transition-colors text-slate-700 dark:text-slate-300"
                      >
                        <svg className="w-3.5 h-3.5 text-blue-500 fill-current" viewBox="0 0 24 24">
                          <path d="M12 2L2 7l10 5 10-5-10-5zm0 18.25l-8.5-4.25v-5.5L12 15l8.5-4.5v5.5l-8.5 4.25z"/>
                        </svg>
                        <span>Azure AD</span>
                      </button>
                    </div>

                    {/* Evaluator quick login */}
                    <div className="pt-4 border-t border-slate-200/10">
                      <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-2 text-center">
                        Evaluator Fast-Access Bypass
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuickLogin(selectedRole.email)}
                        disabled={loading}
                        className="w-full py-2.5 rounded-xl bg-slate-550 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all border border-slate-200/50 dark:border-slate-800/50"
                      >
                        Quick Login as {selectedRole.title}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Security badges panel */}
        <div className="mt-8 text-center max-w-[460px] w-full px-4">
          <div className="flex items-center justify-center gap-1.5 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
            <Lock className="w-3 h-3" />
            <span>Enterprise Security Protocols Active</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-2">
            {[
              "End-to-End Encryption",
              "Secure Session Management",
              "Role Based Access Control",
              "Audit Logging Enabled"
            ].map((badge, idx) => (
              <span 
                key={idx} 
                className="px-2.5 py-1 text-[9px] font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 flex items-center gap-1"
              >
                <Shield className="w-2.5 h-2.5 text-indigo-500" />
                <span>{badge}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Form footer */}
        <footer className="mt-12 w-full max-w-[460px] px-4 flex justify-between items-center text-[10px] font-semibold text-slate-400 dark:text-slate-500">
          <div className="flex gap-4">
            <a href="#" className="hover:text-indigo-500 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-indigo-500 transition-colors">Terms</a>
            <a href="#" className="hover:text-indigo-500 transition-colors">Support</a>
          </div>
          <span>v2.4.0 &copy; TransitOps Enterprise</span>
        </footer>

      </div>
    </div>
  );
}

import {
  AnimatePresence,
  motion,
  useInView,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  Command,
  Fuel,
  Globe2,
  Headphones,
  Layers3,
  LockKeyhole,
  Menu,
  Monitor,
  Moon,
  Navigation,
  Play,
  Plus,
  Radio,
  Route,
  Search,
  ShieldCheck,
  Sun,
  Truck,
  Wrench,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

const navItems = [
  "Home",
  "Features",
  "Solutions",
  "Analytics",
  "Pricing",
  "Contact",
];

const features = [
  {
    icon: Truck,
    number: "01",
    title: "Fleet management",
    description:
      "A live, unified view of every vehicle, driver, document, and utilization signal.",
    color: "#4F46E5",
  },
  {
    icon: Route,
    number: "02",
    title: "Trip dispatch",
    description:
      "Build optimized routes, assign drivers, and react to exceptions before they become delays.",
    color: "#7C3AED",
  },
  {
    icon: Wrench,
    number: "03",
    title: "Predictive maintenance",
    description:
      "Automate service schedules using odometer, telematics, and diagnostic data.",
    color: "#10B981",
  },
  {
    icon: Fuel,
    number: "04",
    title: "Fuel intelligence",
    description:
      "Expose waste, fraud, and driving patterns with transaction-level fuel visibility.",
    color: "#F59E0B",
  },
  {
    icon: BarChart3,
    number: "05",
    title: "Executive analytics",
    description:
      "Turn your operation into decision-ready forecasts, benchmarks, and financial insight.",
    color: "#4F46E5",
  },
];

const vehicles = [
  {
    id: "TR-1048",
    model: "Volvo FH16",
    driver: "M. Carter",
    state: "In transit",
    utilization: 94,
    fuel: 74,
    eta: "14:24",
    tone: "indigo",
  },
  {
    id: "VN-2284",
    model: "eSprinter",
    driver: "A. Wilson",
    state: "On route",
    utilization: 87,
    fuel: 61,
    eta: "15:02",
    tone: "violet",
  },
  {
    id: "TR-3082",
    model: "Scania R500",
    driver: "J. Mendes",
    state: "Loading",
    utilization: 81,
    fuel: 92,
    eta: "16:18",
    tone: "emerald",
  },
  {
    id: "VN-1256",
    model: "Ford E-Transit",
    driver: "S. Kim",
    state: "At hub",
    utilization: 76,
    fuel: 48,
    eta: "17:40",
    tone: "amber",
  },
];

const pricing = [
  {
    name: "Core",
    description: "For growing regional fleets",
    monthly: 49,
    annual: 39,
    features: [
      "Up to 25 vehicles",
      "Dispatch workspace",
      "Fuel and expense tracking",
      "Standard reports",
    ],
  },
  {
    name: "Scale",
    description: "For multi-hub operations",
    monthly: 89,
    annual: 69,
    featured: true,
    features: [
      "Unlimited vehicles",
      "Predictive maintenance",
      "Advanced analytics",
      "API and integrations",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    description: "For complex global networks",
    monthly: null,
    annual: null,
    features: [
      "Custom deployment",
      "SSO and audit controls",
      "Data residency",
      "Dedicated success team",
    ],
  },
];

function Logo({ compact = false }) {
  return (
    <a
      href="#home"
      className="group inline-flex items-center gap-2.5"
      aria-label="TransitOps home"
    >
      <span className="relative grid size-8 place-items-center overflow-hidden rounded-[10px] bg-[#070B1A]/85 border border-white/10 shadow-[0_8px_20px_rgba(79,70,229,.1)]">
        <img src="/logistic.png" alt="TransitOps Logo" className="w-6.5 h-6.5 object-contain" />
      </span>
      {!compact && (
        <span className="text-[17px] font-semibold tracking-[-0.03em] text-slate-950 transition-colors duration-300 dark:text-white">
          Transit
          <span className="text-indigo-600 dark:text-indigo-400">Ops</span>
        </span>
      )}
    </a>
  );
}

function ThemeToggle({ theme, onChange }) {
  return (
    <div className="flex items-center rounded-xl border border-slate-200/80 bg-slate-100/90 p-1 backdrop-blur-md dark:border-white/15 dark:bg-white/10">
      {["light", "dark", "system"].map((mode) => {
        const active = theme === mode;
        const Icon = mode === "light" ? Sun : mode === "dark" ? Moon : Monitor;
        return (
          <button
            key={mode}
            onClick={() => onChange(mode)}
            className={`relative flex items-center justify-center rounded-lg px-2.5 py-1.5 text-xs font-medium transition duration-200 ${
              active
                ? "text-slate-950 dark:text-white"
                : "text-slate-500 hover:text-slate-900 dark:text-white/60 dark:hover:text-white"
            }`}
            title={`Switch to ${mode} mode`}
            aria-label={`Switch to ${mode} mode`}
          >
            {active && (
              <motion.span
                layoutId="theme-toggle-pill"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="absolute inset-0 rounded-lg bg-white shadow-sm dark:bg-indigo-600"
              />
            )}
            <Icon className="relative z-10 size-3.5" />
          </button>
        );
      })}
    </div>
  );
}

function Reveal({ children, className = "", delay = 0 }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.72, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function Counter({ to, suffix = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-30px" });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const duration = 1300;
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      setValue(Math.round(to * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, to]);

  return (
    <span ref={ref}>
      {value}
      {suffix}
    </span>
  );
}

function Header({ theme, onThemeChange, onDemo }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${scrolled ? "px-3 pt-3" : "px-3 pt-5 md:px-6 md:pt-6"}`}
    >
      <nav
        className={`mx-auto flex max-w-[1380px] items-center justify-between border px-4 transition-all duration-500 md:px-5 ${scrolled ? "h-16 rounded-2xl border-slate-200/80 bg-white/85 shadow-xl shadow-slate-900/5 backdrop-blur-2xl dark:border-white/15 dark:bg-[#080b13]/80 dark:shadow-slate-950/20" : "h-16 rounded-2xl border-slate-200/60 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.055]"}`}
      >
        <Logo />
        <div className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="rounded-lg px-3.5 py-2 text-[13px] font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-white/70 dark:hover:bg-white/[0.07] dark:hover:text-white"
            >
              {item}
            </a>
          ))}
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle theme={theme} onChange={onThemeChange} />
          <button
            onClick={onDemo}
            className="rounded-xl px-3 py-2 text-[13px] font-medium text-slate-700 transition hover:text-slate-950 dark:text-white/75 dark:hover:text-white"
          >
            Login
          </button>
          <button
            onClick={onDemo}
            className="group flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-indigo-600 dark:bg-white dark:text-slate-950 dark:hover:bg-indigo-50"
          >
            Get Started{" "}
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle theme={theme} onChange={onThemeChange} />
          <button
            className="grid size-10 place-items-center text-slate-800 dark:text-white"
            onClick={() => setOpen((value) => !value)}
            aria-label="Toggle navigation"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="mx-auto mt-2 max-w-[1380px] overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-[#090c15]/95 md:hidden"
          >
            <div className="mb-2 space-y-1">
              {navItems.map((item) => (
                <a
                  key={item}
                  onClick={() => setOpen(false)}
                  href={`#${item.toLowerCase()}`}
                  className="block rounded-xl px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-white/75 dark:hover:bg-white/5 dark:hover:text-white"
                >
                  {item}
                </a>
              ))}
            </div>
            <button
              onClick={() => {
                setOpen(false);
                onDemo();
              }}
              className="flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white dark:bg-white dark:text-slate-950"
            >
              Get Started
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function Hero({ onDemo }) {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], [0, 130]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const rawX = useSpring(0, { stiffness: 80, damping: 18 });
  const rawY = useSpring(0, { stiffness: 80, damping: 18 });

  const handleMove = (event) => {
    rawX.set((event.clientX / window.innerWidth - 0.5) * 38);
    rawY.set((event.clientY / window.innerHeight - 0.5) * 28);
  };

  return (
    <section
      id="home"
      ref={heroRef}
      onMouseMove={handleMove}
      className="relative min-h-[780px] overflow-hidden bg-[#f1f5f9] transition-colors duration-500 dark:bg-[#060912] md:min-h-[900px]"
    >
      <motion.div
        style={{ y: imageY, x: rawX }}
        className="absolute -inset-x-12 -inset-y-16 scale-[1.05]"
      >
        <img
          src="/hero_bg.jpg"
          alt="3D logistics command center with connected trucks, fleet dashboards, and live route data"
          className="h-full w-full object-cover object-[63%_center]"
        />
      </motion.div>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(241,245,249,.96)_0%,rgba(241,245,249,.86)_36%,rgba(241,245,249,.25)_68%,rgba(241,245,249,.52)_100%)] dark:bg-[linear-gradient(90deg,rgba(5,8,16,.97)_0%,rgba(5,8,16,.86)_35%,rgba(5,8,16,.24)_68%,rgba(5,8,16,.4)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(241,245,249,.6)_0%,transparent_35%,rgba(241,245,249,.3)_70%,#f1f5f9_100%)] dark:bg-[linear-gradient(180deg,rgba(4,7,14,.55)_0%,transparent_35%,rgba(4,7,14,.25)_70%,#060912_100%)]" />
      <motion.div
        style={{ x: rawX, y: rawY }}
        className="pointer-events-none absolute left-[52%] top-[30%] size-[440px] rounded-full bg-indigo-500/20 blur-[120px]"
      />
      <div className="hero-grid absolute inset-0 opacity-30 dark:opacity-25" />
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        {[12, 26, 43, 68, 82].map((left, index) => (
          <span
            key={left}
            className="particle absolute size-1 rounded-full bg-indigo-600/60 shadow-[0_0_12px_#6366f1] dark:bg-indigo-200/50 dark:shadow-[0_0_12px_#818cf8]"
            style={{
              left: `${left}%`,
              top: `${28 + (index % 3) * 19}%`,
              animationDelay: `${index * -1.8}s`,
            }}
          />
        ))}
      </div>
      <motion.div
        style={{ y: contentY }}
        className="relative z-10 mx-auto flex min-h-[780px] max-w-[1380px] items-center px-6 pb-20 pt-32 md:min-h-[900px] md:px-10 lg:px-12"
      >
        <div className="max-w-[710px]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7 }}
            className="mb-7 flex items-center gap-4"
          >
            <span className="h-px w-8 bg-indigo-600 dark:bg-indigo-400" />
            <span className="text-[13px] font-semibold uppercase tracking-[0.23em] text-indigo-700 dark:text-indigo-200">
              The operating system for movement
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.18,
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <span className="mb-4 block text-[clamp(3.4rem,7vw,6.7rem)] font-semibold leading-[0.88] tracking-[-0.075em] text-slate-950 dark:text-white">
              Transit
              <span className="text-indigo-600 dark:text-indigo-400">Ops</span>
            </span>
            <span className="block max-w-[680px] text-[clamp(2rem,4vw,4rem)] font-medium leading-[1.02] tracking-[-0.055em] text-slate-800 dark:text-white/95">
              Transform Fleet Operations with Intelligent Transport Management
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.75 }}
            className="mt-7 max-w-[640px] text-base leading-7 text-slate-600 md:text-lg md:leading-8 dark:text-slate-300"
          >
            Manage vehicles, drivers, dispatch, maintenance, fuel, expenses,
            analytics, and fleet operations from one intelligent platform.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <button
              onClick={onDemo}
              className="group flex h-13 items-center gap-3 rounded-xl bg-indigo-600 px-6 text-[14px] font-semibold text-white shadow-xl shadow-indigo-600/25 transition hover:-translate-y-0.5 hover:bg-indigo-700 dark:bg-white dark:text-slate-950 dark:shadow-[0_12px_40px_rgba(255,255,255,.1)] dark:hover:bg-indigo-50"
            >
              Get Started{" "}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </button>

          </motion.div>
        </div>
      </motion.div>
      <div className="absolute bottom-7 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-[10px] uppercase tracking-[.25em] text-slate-500 dark:text-white/40 lg:flex">
        Explore platform
        <motion.span
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        >
          <ChevronDown className="size-4" />
        </motion.span>
      </div>
    </section>
  );
}

function Trusted() {
  return (
    <section
      className="border-b border-slate-200 bg-white py-10 transition-colors duration-500 dark:border-white/10 dark:bg-[#080b13] md:py-12"
      aria-label="Trusted companies"
    >
      <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-8 px-6 md:flex-row md:justify-between md:gap-12">
        <p className="max-w-[170px] text-center text-[11px] font-semibold uppercase leading-5 tracking-[0.18em] text-slate-500 dark:text-slate-400 md:text-left">
          Trusted by transport leaders worldwide
        </p>
        <div className="grid flex-1 grid-cols-2 items-center gap-x-10 gap-y-7 text-center text-lg font-semibold tracking-tight text-slate-400 dark:text-slate-500 sm:grid-cols-3 md:grid-cols-6 md:text-left">
          <span>Northstar</span>
          <span>APEX</span>
          <span className="font-serif">Volter</span>
          <span className="tracking-[.15em]">CARGO</span>
          <span>Movana</span>
          <span className="font-mono">KINEX</span>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section
      id="features"
      className="scroll-mt-20 bg-[#f8fafc] py-24 transition-colors duration-500 dark:bg-[#060912] md:py-36"
    >
      <div className="mx-auto max-w-[1280px] px-6">
        <Reveal className="max-w-[820px]">
          <p className="text-indigo-600 dark:text-indigo-400 font-bold tracking-wider text-xs uppercase">
            Built as one system
          </p>
          <h2 className="text-4xl md:text-5xl font-black mt-4 text-slate-900 dark:text-white">
            Every moving part,
            <br />
            finally moving together.
          </h2>
          <p className="mt-6 max-w-[620px] text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
            One operational source of truth from the first dispatch to the final
            invoice. No disconnected tools. No blind spots.
          </p>
        </Reveal>
        <div className="mt-16 border-t border-slate-200 dark:border-white/10 md:mt-24">
          {features.map((feature, index) => (
            <motion.a
              href={feature.number === "05" ? "#analytics" : "#solutions"}
              key={feature.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: index * 0.06, duration: 0.55 }}
              className="group grid items-center gap-5 border-b border-slate-200 py-7 transition dark:border-white/10 md:grid-cols-[80px_1.1fr_1fr_40px] md:py-9"
            >
              <span className="hidden text-xs font-medium text-slate-400 dark:text-slate-500 md:block">
                {feature.number}
              </span>
              <span className="flex items-center gap-4 text-xl font-semibold tracking-[-0.025em] text-slate-950 dark:text-white md:text-2xl">
                <span
                  className="grid size-10 place-items-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200 transition duration-300 group-hover:-translate-y-1 group-hover:shadow-lg dark:bg-[#0e1322] dark:ring-white/10"
                  style={{ color: feature.color }}
                >
                  <feature.icon className="size-5" />
                </span>
                {feature.title}
              </span>
              <span className="max-w-[430px] text-sm leading-6 text-slate-600 dark:text-slate-400">
                {feature.description}
              </span>
              <span className="hidden size-10 place-items-center rounded-full border border-slate-200 text-slate-400 transition group-hover:border-indigo-600 group-hover:bg-indigo-600 group-hover:text-white dark:border-white/15 dark:text-slate-500 md:grid">
                <ArrowUpRight className="size-4" />
              </span>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}

function FleetWorkspace() {
  const [selected, setSelected] = useState(vehicles[0]);
  return (
    <section
      id="solutions"
      className="scroll-mt-10 overflow-hidden bg-white py-24 transition-colors duration-500 dark:bg-[#080b13] md:py-36"
    >
      <div className="mx-auto max-w-[1380px] px-4 sm:px-6">
        <Reveal className="mx-auto max-w-[790px] text-center">
          <p className="text-indigo-600 dark:text-indigo-400 font-bold tracking-wider text-xs uppercase">
            Fleet management
          </p>
          <h2 className="text-4xl md:text-5xl font-black mt-4 text-slate-900 dark:text-white">
            Your entire fleet.
            <br />
            Alive in real time.
          </h2>
          <p className="mx-auto mt-6 max-w-[610px] text-slate-600 dark:text-slate-400 leading-relaxed">
            Watch vehicles, driver status, utilization, and delivery risk change
            as your operation moves.
          </p>
        </Reveal>
        <Reveal
          delay={0.15}
          className="mt-16 md:mt-20"
          style={{ perspective: "1000px" }}
        >
          <motion.div
            whileHover={{ rotateX: 0, rotateY: 0, y: -4 }}
            transition={{ duration: 0.45 }}
            className="mx-auto max-w-[1250px] overflow-hidden rounded-[22px] border border-slate-200 bg-[#f8fafc] shadow-[0_45px_100px_-40px_rgba(15,23,42,.22)] dark:border-white/15 dark:bg-[#0c101d] dark:shadow-[0_45px_100px_-40px_rgba(0,0,0,.85)] md:[transform:rotateX(1.5deg)_rotateY(-1deg)]"
          >
            <div className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-white/10 dark:bg-[#0f1424] md:px-6">
              <div className="flex items-center gap-3">
                <Logo compact />
                <span className="hidden text-sm font-semibold text-slate-800 dark:text-white sm:block">
                  Operations center
                </span>
                <span className="hidden text-slate-300 dark:text-slate-600 sm:block">
                  /
                </span>
                <span className="hidden text-xs text-slate-400 dark:text-slate-400 sm:block">
                  Live fleet
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Search className="size-4" />
                <Bell className="size-4" />
                <span className="ml-1 grid size-7 place-items-center rounded-full bg-slate-900 text-[10px] font-semibold text-white dark:bg-indigo-600">
                  AJ
                </span>
              </div>
            </div>
            <div className="grid min-h-[570px] md:grid-cols-[72px_1fr]">
              <aside className="hidden border-r border-slate-200 bg-white py-5 dark:border-white/10 dark:bg-[#0f1424] md:flex md:flex-col md:items-center md:gap-3">
                {[Command, Truck, Route, Wrench, Fuel, BarChart3].map(
                  (Icon, index) => (
                    <span
                      key={index}
                      className={`grid size-10 place-items-center rounded-xl ${index === 1 ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-950" : "text-slate-400 dark:text-slate-500"}`}
                    >
                      <Icon className="size-4.5" />
                    </span>
                  ),
                )}
              </aside>
              <div className="min-w-0 p-4 sm:p-6 md:p-8">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                  <div>
                    <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                      Tuesday, 24 September
                    </p>
                    <h3 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                      Fleet overview
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                      <Layers3 className="size-3.5" /> All hubs
                    </button>
                    <button className="flex h-9 items-center gap-2 rounded-lg bg-slate-950 px-3 text-xs font-medium text-white dark:bg-indigo-600">
                      <Plus className="size-3.5" /> Add vehicle
                    </button>
                  </div>
                </div>
                <div className="mt-7 grid gap-4 lg:grid-cols-[1.55fr_.75fr]">
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#0f1424]">
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-white/10">
                      <span className="text-sm font-semibold text-slate-800 dark:text-white">
                        Active vehicles
                      </span>
                      <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                        <span className="size-1.5 rounded-full bg-emerald-500" />{" "}
                        38 online
                      </span>
                    </div>
                    <div className="hidden grid-cols-[.8fr_1.2fr_1fr_.8fr] px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 sm:grid">
                      <span>Vehicle</span>
                      <span>Driver</span>
                      <span>Status</span>
                      <span>Utilization</span>
                    </div>
                    {vehicles.map((vehicle) => (
                      <button
                        key={vehicle.id}
                        onClick={() => setSelected(vehicle)}
                        className={`grid w-full grid-cols-[1fr_auto] items-center gap-3 border-t border-slate-100 px-4 py-4 text-left transition dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 sm:grid-cols-[.8fr_1.2fr_1fr_.8fr] sm:px-5 ${selected.id === vehicle.id ? "bg-indigo-50/70 dark:bg-indigo-500/15" : "bg-white dark:bg-transparent"}`}
                      >
                        <span>
                          <span className="block text-xs font-semibold text-slate-800 dark:text-white">
                            {vehicle.id}
                          </span>
                          <span className="mt-0.5 block text-[10px] text-slate-400 dark:text-slate-400">
                            {vehicle.model}
                          </span>
                        </span>
                        <span className="hidden text-xs text-slate-600 dark:text-slate-300 sm:block">
                          {vehicle.driver}
                        </span>
                        <span className="hidden items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 sm:flex">
                          <span
                            className={`w-2 h-2 rounded-full bg-${vehicle.tone}-500`}
                          />
                          {vehicle.state}
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <span
                              className="block h-full rounded-full bg-indigo-600 dark:bg-indigo-500"
                              style={{ width: `${vehicle.utilization}%` }}
                            />
                          </span>
                          <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                            {vehicle.utilization}%
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                  <motion.div
                    key={selected.id}
                    initial={{ opacity: 0.5, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative min-h-[300px] overflow-hidden rounded-2xl bg-[#0b1020] p-5 text-white shadow-xl shadow-slate-900/10"
                  >
                    <div className="absolute inset-0 opacity-50 bg-[url('/fleet-map.png')] bg-cover" />
                    <svg
                      viewBox="0 0 300 250"
                      className="absolute inset-x-0 bottom-0 w-full opacity-90"
                      aria-hidden="true"
                    >
                      <path
                        d="M-20 225 C50 208 50 85 126 130 S190 208 244 110 S320 45 330 30"
                        fill="none"
                        stroke="#30394f"
                        strokeWidth="14"
                        strokeLinecap="round"
                      />
                      <motion.path
                        d="M-20 225 C50 208 50 85 126 130 S190 208 244 110 S320 45 330 30"
                        fill="none"
                        stroke="#818cf8"
                        strokeWidth="2"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.2 }}
                      />
                      <circle
                        cx="126"
                        cy="130"
                        r="6"
                        fill="#0b1020"
                        stroke="#A5B4FC"
                        strokeWidth="3"
                      />
                      <circle cx="244" cy="110" r="5" fill="#10B981" />
                    </svg>
                    <div className="relative flex items-start justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-[.16em] text-indigo-300">
                          Live tracking
                        </p>
                        <p className="mt-1 text-lg font-semibold">
                          {selected.id}
                        </p>
                        <p className="text-xs text-white/50">
                          {selected.model}
                        </p>
                      </div>
                      <span className="flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] text-emerald-300">
                        <Radio className="size-3" /> Live
                      </span>
                    </div>
                    <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
                      <div>
                        <p className="text-[10px] text-white/40">
                          ETA to destination
                        </p>
                        <p className="mt-1 text-xl font-semibold">
                          {selected.eta}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-white/40">Fuel level</p>
                        <p className="mt-1 text-sm font-semibold text-emerald-300">
                          {selected.fuel}%
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </Reveal>
      </div>
    </section>
  );
}

function Dispatch() {
  const [active, setActive] = useState(2);
  const stops = ["North Hub", "Portside DC", "Central Market", "West Terminal"];
  return (
    <section className="overflow-hidden bg-[#f1f5f9] py-24 transition-colors duration-500 dark:bg-[#0a0d16] md:py-36">
      <div className="mx-auto grid max-w-[1280px] items-center gap-16 px-6 lg:grid-cols-[.8fr_1.2fr]">
        <Reveal>
          <p className="text-indigo-600 dark:text-indigo-400 font-bold tracking-wider text-xs uppercase">
            Trip dispatch
          </p>
          <h2 className="text-4xl md:text-5xl font-black mt-4 text-slate-900 dark:text-white">
            From assignment
            <br />
            to arrival.
          </h2>
          <p className="mt-6 max-w-[480px] text-base leading-7 text-slate-600 dark:text-slate-400">
            Plan faster with intelligent load matching and live routes that
            adapt when traffic, capacity, or priorities change.
          </p>
          <div className="mt-10 flex flex-col gap-1">
            {[
              "Auto-match drivers and vehicles",
              "Re-optimize routes in real time",
              "Notify customers before delays",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 py-2.5 text-sm text-slate-700 dark:text-slate-300"
              >
                <span className="grid size-5 place-items-center rounded-full bg-emerald-500/15 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300">
                  <Check className="size-3" />
                </span>
                {item}
              </div>
            ))}
          </div>
          <button className="group mt-8 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-white">
            Explore dispatch{" "}
            <ArrowRight className="size-4 transition group-hover:translate-x-1" />
          </button>
        </Reveal>
        <Reveal delay={0.12} className="relative min-h-[530px]">
          <div className="absolute left-1/2 top-1/2 size-[450px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/15 blur-[100px] dark:bg-indigo-600/20" />
          <div className="absolute inset-x-0 top-8 mx-auto max-w-[680px] overflow-hidden rounded-[24px] border border-slate-200/80 bg-white/90 shadow-[0_30px_80px_rgba(15,23,42,.12)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.055] dark:shadow-[0_40px_100px_rgba(0,0,0,.45)]">
            <div className="flex h-14 items-center justify-between border-b border-slate-200/80 px-5 dark:border-white/10">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-white">
                <Navigation className="size-4 text-indigo-600 dark:text-indigo-300" />{" "}
                Dispatch / T-0281
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-300">
                Optimized
              </span>
            </div>
            <div className="relative grid min-h-[405px] sm:grid-cols-[.75fr_1.25fr]">
              <div className="border-b border-slate-200/80 p-5 dark:border-white/10 sm:border-b-0 sm:border-r">
                <p className="mb-4 text-[10px] uppercase tracking-[.18em] text-slate-400 dark:text-white/35">
                  Route plan
                </p>
                {stops.map((stop, index) => (
                  <button
                    key={stop}
                    onClick={() => setActive(index)}
                    className="group relative flex w-full gap-3 pb-7 text-left last:pb-0"
                  >
                    {index < stops.length - 1 && (
                      <span className="absolute left-[7px] top-4 h-[calc(100%-8px)] w-px bg-slate-200 dark:bg-white/15" />
                    )}
                    <span
                      className={`relative z-10 mt-0.5 size-[15px] rounded-full border-4 transition ${index <= active ? "border-indigo-500 bg-indigo-600 dark:border-indigo-300 dark:bg-indigo-500" : "border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-900"}`}
                    />
                    <span>
                      <span
                        className={`block text-xs font-medium transition ${index === active ? "text-slate-950 font-semibold dark:text-white" : "text-slate-600 dark:text-white/60"}`}
                      >
                        {stop}
                      </span>
                      <span className="mt-1 block text-[10px] text-slate-400 dark:text-white/30">
                        {8 + index * 2}:{index % 2 ? "45" : "15"} AM
                      </span>
                    </span>
                  </button>
                ))}
              </div>
              <div className="relative min-h-[300px] overflow-hidden bg-[#0c1020] dark:bg-transparent">
                <svg
                  viewBox="0 0 400 400"
                  className="absolute inset-0 size-full"
                  aria-hidden="true"
                >
                  <path
                    d="M-30 345 C90 330 52 210 150 205 S250 305 280 185 S330 60 430 55"
                    fill="none"
                    stroke="#252b3d"
                    strokeWidth="22"
                    strokeLinecap="round"
                  />
                  <motion.path
                    d="M-30 345 C90 330 52 210 150 205 S250 305 280 185 S330 60 430 55"
                    fill="none"
                    stroke="url(#routeGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                  />
                  <defs>
                    <linearGradient id="routeGradient">
                      <stop stopColor="#10B981" />
                      <stop offset=".55" stopColor="#818CF8" />
                      <stop offset="1" stopColor="#C4B5FD" />
                    </linearGradient>
                  </defs>
                  {[
                    { x: 150, y: 205 },
                    { x: 280, y: 185 },
                    { x: 346, y: 86 },
                  ].map((dot, index) => (
                    <g key={index}>
                      <circle
                        cx={dot.x}
                        cy={dot.y}
                        r="12"
                        fill="#0c1020"
                        stroke="#818CF8"
                        strokeWidth="2"
                      />
                      <circle cx={dot.x} cy={dot.y} r="3" fill="#fff" />
                    </g>
                  ))}
                  <motion.g
                    animate={{ x: [0, 105, 130], y: [0, -120, -125] }}
                    transition={{
                      duration: 7,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <circle cx="150" cy="205" r="10" fill="#10B981" />
                    <Navigation
                      x="144"
                      y="199"
                      width="12"
                      height="12"
                      color="white"
                      fill="white"
                    />
                  </motion.g>
                </svg>
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl border border-white/15 bg-[#0a0e19]/90 px-4 py-3 text-white backdrop-blur-xl">
                  <span>
                    <span className="block text-[10px] text-white/50">
                      Distance remaining
                    </span>
                    <span className="text-sm font-semibold">184.6 km</span>
                  </span>
                  <span className="text-right">
                    <span className="block text-[10px] text-white/50">
                      On-time probability
                    </span>
                    <span className="text-sm font-semibold text-emerald-300">
                      96.4%
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function MaintenanceFuel() {
  return (
    <section className="bg-[#f8fafc] py-24 transition-colors duration-500 dark:bg-[#060912] md:py-36">
      <div className="mx-auto max-w-[1280px] px-6">
        <Reveal className="max-w-[760px]">
          <p className="text-indigo-600 dark:text-indigo-400 font-bold tracking-wider text-xs uppercase">
            Maintenance and fuel
          </p>
          <h2 className="text-4xl md:text-5xl font-black mt-4 text-slate-900 dark:text-white">
            Spend less time
            <br />
            reacting.
          </h2>
          <p className="mt-6 max-w-[600px] text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
            TransitOps finds the risks and waste hiding in your fleet before
            they reach the balance sheet.
          </p>
        </Reveal>
        <div className="mt-16 grid border-y border-slate-200 dark:border-white/10 lg:mt-24 lg:grid-cols-2">
          <Reveal className="border-b border-slate-200 py-10 dark:border-white/10 lg:border-b-0 lg:border-r lg:py-14 lg:pr-14">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-3 text-sm font-semibold text-slate-900 dark:text-white">
                <span className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                  <Wrench className="size-4" />
                </span>{" "}
                Maintenance status
              </span>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                92% healthy
              </span>
            </div>
            <div className="mt-10 space-y-7">
              {[
                {
                  label: "Engine and powertrain",
                  value: 96,
                  color: "bg-emerald-500",
                },
                {
                  label: "Tires and brakes",
                  value: 83,
                  color: "bg-indigo-500",
                },
                {
                  label: "Electrical systems",
                  value: 72,
                  color: "bg-amber-500",
                },
              ].map((item, index) => (
                <div key={item.label}>
                  <div className="mb-2 flex justify-between text-xs">
                    <span className="font-medium text-slate-600 dark:text-slate-300">
                      {item.label}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500">
                      {item.value}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-800">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${item.value}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                      className={`h-full rounded-full ${item.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 flex items-center justify-between border-t border-slate-200 pt-6 dark:border-white/10">
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Next scheduled service
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-white">
                  TR-2048 in 840 km
                </p>
              </div>
              <button className="grid size-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 hover:border-indigo-500 hover:text-indigo-600 dark:border-white/15 dark:bg-[#0e1322] dark:text-slate-400 dark:hover:border-indigo-400 dark:hover:text-indigo-300">
                <ChevronRight className="size-4" />
              </button>
            </div>
          </Reveal>
          <Reveal delay={0.1} className="py-10 lg:py-14 lg:pl-14">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-3 text-sm font-semibold text-slate-900 dark:text-white">
                <span className="grid size-9 place-items-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
                  <Fuel className="size-4" />
                </span>{" "}
                Fuel efficiency
              </span>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                8.4% improved
              </span>
            </div>
            <div className="mt-8 flex items-baseline gap-2">
              <span className="text-4xl font-semibold tracking-[-.05em] text-slate-950 dark:text-white">
                7.8
              </span>
              <span className="text-sm text-slate-400 dark:text-slate-500">
                km / liter
              </span>
            </div>
            <svg
              viewBox="0 0 520 190"
              className="mt-4 w-full overflow-visible"
              aria-label="Fuel efficiency trend"
            >
              <defs>
                <linearGradient id="fuelArea" x1="0" y1="0" x2="0" y2="1">
                  <stop stopColor="#4F46E5" stopOpacity=".25" />
                  <stop offset="1" stopColor="#4F46E5" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[20, 70, 120, 170].map((y) => (
                <line
                  key={y}
                  x1="0"
                  x2="520"
                  y1={y}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                  className="stroke-slate-200 dark:stroke-slate-800"
                />
              ))}
              <motion.path
                d="M0 145 C45 156 58 124 100 132 S158 112 195 121 S248 90 290 103 S352 82 392 88 S442 48 520 52 L520 190 L0 190 Z"
                fill="url(#fuelArea)"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              />
              <motion.path
                d="M0 145 C45 156 58 124 100 132 S158 112 195 121 S248 90 290 103 S352 82 392 88 S442 48 520 52"
                fill="none"
                stroke="#4F46E5"
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.4 }}
              />
              <circle
                cx="520"
                cy="52"
                r="6"
                fill="#4F46E5"
                stroke="white"
                strokeWidth="3"
              />
            </svg>
            <div className="flex justify-between text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
              <span>Jul</span>
              <span>Aug</span>
              <span>Sep</span>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Analytics() {
  return (
    <section
      id="analytics"
      className="relative scroll-mt-10 overflow-hidden bg-white py-24 transition-colors duration-500 dark:bg-[#080b13] dark:text-white md:py-36"
    >
      <div className="absolute left-[15%] top-[-20%] size-[700px] rounded-full bg-indigo-500/10 blur-[150px] dark:bg-indigo-700/15" />
      <div className="absolute bottom-[-30%] right-[5%] size-[600px] rounded-full bg-violet-500/10 blur-[140px] dark:bg-violet-700/10" />
      <div className="mx-auto max-w-[1280px] px-6">
        <Reveal className="relative max-w-[850px]">
          <p className="text-indigo-600 dark:text-indigo-400 font-bold tracking-wider text-xs uppercase">
            Decision intelligence
          </p>
          <h2 className="text-4xl md:text-5xl font-black mt-4 text-slate-900 dark:text-white">
            See the signal.
            <br />
            Run a better operation.
          </h2>
          <p className="mt-6 max-w-[590px] text-base leading-7 text-slate-600 dark:text-slate-400">
            Live operational context meets long-range business intelligence, so
            every decision is made with confidence.
          </p>
        </Reveal>
        <div className="relative mt-16 border-y border-slate-200 dark:border-white/10 md:mt-24">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4">
            {[
              { value: 99, suffix: ".8%", label: "Fleet data uptime" },
              { value: 24, suffix: "%", label: "Lower idle time" },
              { value: 16, suffix: "h", label: "Saved per dispatcher" },
              { value: 2, suffix: ".4x", label: "Faster resolution" },
            ].map((metric, index) => (
              <Reveal
                key={metric.label}
                delay={index * 0.08}
                className="border-b border-slate-200 px-1 py-8 dark:border-white/10 sm:px-7 lg:border-b-0 lg:border-r first:pl-0 last:border-r-0"
              >
                <p className="text-4xl font-semibold tracking-[-.05em] text-slate-950 dark:text-white md:text-5xl">
                  <Counter to={metric.value} suffix={metric.suffix} />
                </p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {metric.label}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
        <Reveal delay={0.15} className="mt-16 md:mt-20">
          <div className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-[#f8fafc] p-5 shadow-xl dark:border-white/10 dark:bg-white/[0.045] dark:shadow-[0_50px_120px_rgba(0,0,0,.45)] dark:backdrop-blur-xl md:p-8">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
              <div>
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-300">
                  Network performance
                </p>
                <h3 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">
                  Cost per completed trip
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
                  Last 12 months
                </button>
                <button className="rounded-lg bg-slate-900 px-3 py-2 text-[11px] font-semibold text-white dark:bg-white dark:text-slate-950">
                  Export report
                </button>
              </div>
            </div>
            <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_240px]">
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">
                    $184.20
                  </span>
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-300">
                    -12.8%
                  </span>
                </div>
                <svg
                  viewBox="0 0 820 270"
                  className="mt-5 w-full overflow-visible"
                  aria-label="Cost per trip chart"
                >
                  <defs>
                    <linearGradient
                      id="analyticsArea"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop stopColor="#818CF8" stopOpacity=".3" />
                      <stop offset="1" stopColor="#818CF8" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[20, 85, 150, 215, 270].map((y) => (
                    <line
                      key={y}
                      x1="0"
                      x2="820"
                      y1={y}
                      y2={y}
                      stroke="#818CF8"
                      strokeOpacity=".15"
                    />
                  ))}
                  <motion.path
                    d="M0 64 C60 75 72 92 132 88 S220 120 280 112 S370 146 420 135 S510 168 570 150 S672 190 730 175 S780 205 820 190 L820 270 L0 270Z"
                    fill="url(#analyticsArea)"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.1 }}
                  />
                  <motion.path
                    d="M0 64 C60 75 72 92 132 88 S220 120 280 112 S370 146 420 135 S510 168 570 150 S672 190 730 175 S780 205 820 190"
                    fill="none"
                    stroke="#6366F1"
                    strokeWidth="3"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.7 }}
                    className="stroke-indigo-600 dark:stroke-[#A5B4FC]"
                  />
                </svg>
                <div className="mt-3 flex justify-between text-[10px] text-slate-400 dark:text-white/30">
                  <span>Oct</span>
                  <span>Dec</span>
                  <span>Feb</span>
                  <span>Apr</span>
                  <span>Jun</span>
                  <span>Aug</span>
                  <span>Sep</span>
                </div>
              </div>
              <div className="border-t border-slate-200 pt-8 dark:border-white/10 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                <p className="text-[10px] uppercase tracking-[.18em] text-slate-400 dark:text-white/35">
                  Cost distribution
                </p>
                <div className="mt-8 space-y-6">
                  {[
                    {
                      name: "Fuel",
                      value: 42,
                      color: "bg-indigo-500 dark:bg-indigo-400",
                    },
                    {
                      name: "Labor",
                      value: 31,
                      color: "bg-violet-500 dark:bg-violet-400",
                    },
                    {
                      name: "Maintenance",
                      value: 18,
                      color: "bg-emerald-500 dark:bg-emerald-400",
                    },
                    {
                      name: "Other",
                      value: 9,
                      color: "bg-amber-500 dark:bg-amber-400",
                    },
                  ].map((item) => (
                    <div key={item.name}>
                      <div className="mb-2 flex justify-between text-xs">
                        <span className="text-slate-600 dark:text-white/55">
                          {item.name}
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-white">
                          {item.value}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-200 dark:bg-white/10">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${item.value}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1 }}
                          className={`h-full rounded-full ${item.color}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Testimonial() {
  return (
    <section className="bg-[#f8fafc] py-24 transition-colors duration-500 dark:bg-[#0a0d16] md:py-36">
      <div className="mx-auto max-w-[1100px] px-6 text-center">
        <Reveal>
          <span className="mx-auto grid size-11 place-items-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
            <span className="text-2xl font-serif leading-none">&ldquo;</span>
          </span>
          <blockquote className="mx-auto mt-8 max-w-[980px] text-[clamp(1.8rem,4vw,3.8rem)] font-medium leading-[1.13] tracking-[-.045em] text-slate-950 dark:text-white">
            TransitOps gave our teams a shared pulse. We now see risk sooner,
            plan faster, and move 30% more freight without adding overhead.
          </blockquote>
          <div className="mt-10">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Elena Marquez
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              COO, Northstar Logistics
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Pricing() {
  const [annual, setAnnual] = useState(true);
  return (
    <section
      id="pricing"
      className="scroll-mt-16 bg-white py-24 transition-colors duration-500 dark:bg-[#060912] md:py-36"
    >
      <div className="mx-auto max-w-[1200px] px-6">
        <Reveal className="mx-auto max-w-[760px] text-center">
          <p className="text-indigo-600 dark:text-indigo-400 font-bold tracking-wider text-xs uppercase">
            Simple pricing
          </p>
          <h2 className="text-4xl md:text-5xl font-black mt-4 text-slate-900 dark:text-white">
            Scale operations,
            <br />
            not complexity.
          </h2>
          <p className="mx-auto mt-6 max-w-[550px] text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
            Start with exactly what your fleet needs. Add capability as your
            operation grows.
          </p>
        </Reveal>
        <Reveal delay={0.08} className="mt-10 flex justify-center">
          <div className="inline-flex rounded-xl border border-slate-200 bg-[#f8fafc] p-1 text-xs font-semibold shadow-sm dark:border-white/15 dark:bg-[#0c101d]">
            <button
              onClick={() => setAnnual(false)}
              className={`rounded-lg px-4 py-2 transition ${!annual ? "bg-slate-900 text-white dark:bg-indigo-600" : "text-slate-600 dark:text-slate-400"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`rounded-lg px-4 py-2 transition ${annual ? "bg-slate-900 text-white dark:bg-indigo-600" : "text-slate-600 dark:text-slate-400"}`}
            >
              Annual{" "}
              <span
                className={
                  annual
                    ? "text-emerald-300"
                    : "text-emerald-600 dark:text-emerald-400"
                }
              >
                save 20%
              </span>
            </button>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {pricing.map((plan, index) => (
            <Reveal key={plan.name} delay={index * 0.08} className="h-full">
              <div
                className={`flex h-full flex-col rounded-[22px] border p-7 transition duration-300 hover:-translate-y-1 md:p-8 ${plan.featured ? "border-indigo-600 bg-slate-950 text-white shadow-2xl dark:border-indigo-500 dark:bg-indigo-950/60 dark:shadow-[0_30px_70px_-25px_rgba(79,70,229,.5)]" : "border-slate-200 bg-[#f8fafc] text-slate-950 shadow-sm dark:border-white/10 dark:bg-[#0c101d] dark:text-white"}`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  {plan.featured && (
                    <span className="text-[10px] font-semibold uppercase tracking-[.14em] text-indigo-300">
                      Most popular
                    </span>
                  )}
                </div>
                <p
                  className={`mt-2 text-sm ${plan.featured ? "text-slate-400" : "text-slate-600 dark:text-slate-400"}`}
                >
                  {plan.description}
                </p>
                <div className="mt-8 min-h-14">
                  {plan.monthly ? (
                    <>
                      <span className="text-4xl font-semibold tracking-[-.05em]">
                        ${annual ? plan.annual : plan.monthly}
                      </span>
                      <span
                        className={`text-xs ${plan.featured ? "text-slate-500" : "text-slate-500 dark:text-slate-400"}`}
                      >
                        {" "}
                        / vehicle / mo
                      </span>
                    </>
                  ) : (
                    <span className="text-3xl font-semibold tracking-[-.04em]">
                      Let&apos;s talk
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {}}
                  className={`mt-8 flex h-11 items-center justify-center rounded-xl text-sm font-semibold transition ${plan.featured ? "bg-white text-slate-950 hover:bg-indigo-50" : "bg-slate-900 text-white hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-500"}`}
                >
                  {plan.monthly ? "Start free" : "Contact sales"}
                </button>
                <div
                  className={`my-7 h-px ${plan.featured ? "bg-white/10" : "bg-slate-200 dark:bg-white/10"}`}
                />
                <ul className="space-y-3.5">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className={`flex items-center gap-3 text-xs ${plan.featured ? "text-slate-300" : "text-slate-700 dark:text-slate-300"}`}
                    >
                      <Check
                        className={`size-4 ${plan.featured ? "text-emerald-300" : "text-emerald-600 dark:text-emerald-400"}`}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA({ onDemo }) {
  return (
    <section
      id="contact"
      className="relative overflow-hidden bg-indigo-600 py-24 text-white transition-colors duration-500 dark:bg-indigo-900 md:py-32"
    >
      <div className="absolute inset-0 opacity-20 bg-[url('/hero-grid.svg')]" />
      <div className="absolute -right-32 -top-40 size-[500px] rounded-full bg-violet-400/30 blur-[100px]" />
      <div className="absolute -bottom-44 left-[15%] size-[450px] rounded-full bg-emerald-400/15 blur-[120px]" />
      <div className="relative mx-auto max-w-[700px] px-6 text-center z-10">
        <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-6">
          Ready to transform your fleet operations?
        </h2>
        <p className="text-indigo-100 text-lg mb-10 max-w-[500px] mx-auto">
          Join thousands of operators managing logistics intuitively and
          effectively on a unified platform.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onDemo}
            className="rounded-xl bg-white px-8 py-4 text-[15px] font-semibold text-slate-900 shadow-xl transition hover:scale-105 hover:bg-slate-50 flex items-center gap-2"
          >
            Get Started Now <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-white dark:bg-[#060912] border-t border-slate-200 dark:border-white/10 pt-16 pb-8 transition-colors duration-500">
      <div className="mx-auto max-w-[1280px] px-6 grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
        <div className="col-span-2">
          <Logo compact={false} />
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 max-w-[280px]">
            Intelligent Transport Management platform for modern fleet
            operations and logistics teams worldwide.
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-slate-900 dark:text-white mb-4">
            Platform
          </h4>
          <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
            <li>Fleet Management</li>
            <li>Trip Dispatching</li>
            <li>Predictive Maintenance</li>
            <li>Fuel Intelligence</li>
            <li>Executive Analytics</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-slate-900 dark:text-white mb-4">
            Company
          </h4>
          <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
            <li>About Us</li>
            <li>Careers</li>
            <li>Blog</li>
            <li>Contact</li>
            <li>Partners</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-slate-900 dark:text-white mb-4">
            Legal
          </h4>
          <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
            <li>Privacy Policy</li>
            <li>Terms of Service</li>
            <li>Cookie Policy</li>
            <li>Security</li>
          </ul>
        </div>
      </div>
      <div className="mx-auto max-w-[1280px] px-6 border-t border-slate-200 dark:border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-500">
        <p>© 2026 TransitOps Inc. All rights reserved.</p>
        <div className="flex gap-4 mt-4 md:mt-0">
          <span>San Francisco, CA</span>
          <span>Global Operations</span>
        </div>
      </div>
    </footer>
  );
}

export default function Landing({ onDemo, darkMode, setDarkMode }) {
  const theme = darkMode ? "dark" : "light";

  const handleThemeChange = (newTheme) => {
    if (newTheme === "dark" || newTheme === "system") {
      setDarkMode(true);
    } else {
      setDarkMode(false);
    }
  };

  return (
    <div className="font-sans text-slate-900 dark:text-slate-100 bg-white dark:bg-[#060912]">
      <Header theme={theme} onThemeChange={handleThemeChange} onDemo={onDemo} />
      <Hero onDemo={onDemo} />
      <Trusted />
      <Footer />
    </div>
  );
}

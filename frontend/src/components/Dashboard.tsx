"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Activity,
  Pill,
  CalendarCheck2,
  HeartPulse,
  Stethoscope,
  Sparkles,
  BellRing,
  ShieldCheck,
  Moon,
  GlassWater,
  User,
  Flame,
  Award,
} from "lucide-react";
import AvatarDashboard from "./AvatarDashBoard";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import Link from "next/link";

/* -------------------------
   Mock Data
------------------------- */
const initialWaterData = [
  { day: "Mon", cups: 4 },
  { day: "Tue", cups: 5 },
  { day: "Wed", cups: 6 },
  { day: "Thu", cups: 5 },
  { day: "Fri", cups: 3 },
];

const initialSleepData = [
  { day: "Mon", hrs: 7 },
  { day: "Tue", hrs: 6.5 },
  { day: "Wed", hrs: 8 },
  { day: "Thu", hrs: 7.2 },
  { day: "Fri", hrs: 6.8 },
];

// Date-dependent values moved into the component to avoid SSR/client mismatch

/* -------------------------
   Panel Component
------------------------- */
interface PanelProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

function Panel({ title, icon, children, className = "" }: PanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`rounded-2xl border border-blue-900/30 bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-xl p-4 shadow-2xl shadow-blue-900/20 hover:shadow-red-900/20 hover:border-red-900/30 transition-all duration-300 ${className}`}
    >
      <div className="flex items-center gap-2 mb-3 text-sm font-semibold">
        <motion.span 
          className="text-blue-400"
          animate={{ rotate: [0, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {icon}
        </motion.span>
        <span className="text-white">{title}</span>
      </div>
      {children}
    </motion.div>
  );
}

/* -------------------------
   Main Dashboard Component
------------------------- */
export default function MedTwinDashboard() {
  const router = useRouter();
  const [waterCount, setWaterCount] = useState(0);
  const [filledCups, setFilledCups] = useState<boolean[]>(Array(8).fill(false));
  const [sleepHours, setSleepHours] = useState(7.0);
  // client-only date/checkin state to avoid hydration mismatch
  const [daysInMonth, setDaysInMonth] = useState<number | null>(null);
  const [firstWeekday, setFirstWeekday] = useState<number | null>(null);
  const [checkins, setCheckins] = useState<Array<{ day: number; ok: boolean }>>([]);
  const [checkedCount, setCheckedCount] = useState<number>(0);

  React.useEffect(() => {
    const now = new Date();
    const YEAR = now.getFullYear();
    const MONTH = now.getMonth();
    const DAYS_IN_MONTH = new Date(YEAR, MONTH + 1, 0).getDate();
    const FIRST_WEEKDAY = new Date(YEAR, MONTH, 1).getDay();
    const TODAY = now.getDate();
    const generated = Array.from({ length: DAYS_IN_MONTH }, (_, i) => ({
      day: i + 1,
      ok: Math.random() > 0.4 || i + 1 === TODAY,
    }));
    setCheckins(generated);
    setDaysInMonth(DAYS_IN_MONTH);
    setFirstWeekday(FIRST_WEEKDAY);
    setCheckedCount(generated.filter((d) => d.ok).length);
  }, []);
  const [sleepHoursWhole, setSleepHoursWhole] = useState(7);
  const [sleepMinutes, setSleepMinutes] = useState(0);

  const handleHoursScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const scrollTop = element.scrollTop;
    const itemHeight = 40; // height of each item (h-10 = 40px)
    const containerHeight = 128; // h-32 = 128px
    const paddingTop = 44; // py-11 = 44px top padding
    
    // Calculate which item is at the center of the viewport
    const centerOfViewport = containerHeight / 2; // 64px from top of viewport
    const centerInContent = scrollTop + centerOfViewport; // Position in scrollable content
    const centerRelativeToFirstItem = centerInContent - paddingTop; // Subtract top padding
    const centeredIndex = Math.round(centerRelativeToFirstItem / itemHeight);
    const clampedIndex = Math.max(0, Math.min(12, centeredIndex));
    
    if (clampedIndex !== sleepHoursWhole) {
      setSleepHoursWhole(clampedIndex);
      setSleepHours(clampedIndex + sleepMinutes / 60);
    }
  };

  const handleMinutesScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const scrollTop = element.scrollTop;
    const itemHeight = 40;
    const containerHeight = 128;
    const paddingTop = 44;
    
    const centerOfViewport = containerHeight / 2;
    const centerInContent = scrollTop + centerOfViewport;
    const centerRelativeToFirstItem = centerInContent - paddingTop;
    const centeredIndex = Math.round(centerRelativeToFirstItem / itemHeight);
    const minutesValues = [0, 15, 30, 45];
    const clampedIndex = Math.max(0, Math.min(3, centeredIndex));
    const selectedMinutes = minutesValues[clampedIndex];
    
    if (selectedMinutes !== sleepMinutes) {
      setSleepMinutes(selectedMinutes);
      setSleepHours(sleepHoursWhole + selectedMinutes / 60);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated glowing background */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div 
          className="absolute inset-x-0 top-0 h-[40rem] bg-gradient-to-br from-blue-900/30 via-purple-900/15 to-red-900/30 blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute inset-x-0 bottom-0 h-[40rem] bg-gradient-to-tr from-red-900/30 via-pink-900/15 to-blue-900/30 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
      </div>

      {/* Spider Web Decorations */}
      <div className="pointer-events-none absolute inset-0 opacity-15">
        {/* Top Right Web */}
        <svg className="absolute top-0 right-0 w-64 h-64" viewBox="0 0 200 200">
          <path d="M200 0 L100 100 L200 100 Z M200 0 L120 20 M200 20 L140 40 M200 40 L160 60 M200 60 L180 80" 
                stroke="white" strokeWidth="1.5" fill="none"/>
          <circle cx="100" cy="100" r="4" fill="white"/>
        </svg>

        {/* Bottom Left Web */}
        <svg className="absolute bottom-10 left-10 w-64 h-64" viewBox="0 0 200 200">
          <path d="M0 200 L100 100 L0 100 Z M0 200 L80 180 M0 180 L60 160 M0 160 L40 140 M0 140 L20 120" 
                stroke="white" strokeWidth="1.5" fill="none"/>
          <circle cx="100" cy="100" r="4" fill="white"/>
        </svg>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-blue-900/30 bg-black/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div 
              className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-900 to-red-900 grid place-items-center shadow-lg shadow-blue-900/50"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link href="/" passHref>
                <button style={{ all: "unset", cursor: "pointer" }}>
                  <Sparkles size={16} className="text-white" />
                </button>
              </Link>
            </motion.div>
            <div>
              <Link href="/" passHref>
                <button className="font-semibold leading-tight text-white" style={{ all: "unset", cursor: "pointer" }}>
                  Nomi.ai
                </button>
              </Link>
              <div className="text-xs text-gray-400">
                Soumika Seelam · Last sync 2m ago
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Streak Indicator */}
            <div className="flex items-center gap-1.5 ml-4">
              <Flame size={18} className="text-orange-400" />
              <span className="text-lg font-bold text-orange-400">7</span>
            </div>

            <motion.button 
              onClick={() => router.push('/profile')}
              className="rounded-full bg-gradient-to-r from-purple-900/50 to-blue-900/50 hover:from-purple-800 hover:to-blue-800 border border-blue-900/50 w-11 h-11 flex items-center justify-center transition-all duration-300"
              whileHover={{ scale: 1.08, boxShadow: "0 0 24px rgba(30, 58, 138, 0.5)" }}
              whileTap={{ scale: 0.95 }}
            >
              <User size={20} />
            </motion.button>
          </div>
        </div>
      </header>

      {/* Dashboard Layout */}
      <main className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-12 gap-5 relative z-10">
        {/* LEFT COLUMN */}
        <div className="col-span-12 md:col-span-3 flex flex-col gap-5">
          {/* WATER TRACKER */}
          <Panel title="Water Tracker" icon={<GlassWater size={16} />}>
            <div className="text-sm mb-3">
              <span className="font-semibold text-blue-400">{waterCount}</span> / 8 glasses today
            </div>

            <div className="grid grid-cols-4 gap-2 justify-items-center mb-3">
              {Array.from({ length: 8 }).map((_, i) => {
                const isFilled = filledCups[i];
                return (
                  <motion.button
                    key={i}
                    onClick={() =>
                      setFilledCups((prev) => {
                        const updated = [...prev];
                        updated[i] = !updated[i];
                        setWaterCount(updated.filter(Boolean).length);
                        return updated;
                      })
                    }
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.85 }}
                    className="relative"
                  >
                    <svg width="32" height="40" viewBox="0 0 32 40" className="overflow-visible">
                      <defs>
                        <clipPath id={`glassClip-${i}`}>
                          {/* Glass shape - trapezoid */}
                          <path d="M 8 2 L 24 2 L 26 38 L 6 38 Z" />
                        </clipPath>
                      </defs>
                      
                      {/* Water fill with clip path */}
                      <g clipPath={`url(#glassClip-${i})`}>
                        <motion.rect
                          x="0"
                          y="0"
                          width="32"
                          height="40"
                          fill="url(#waterGradient)"
                          initial={{ y: 40 }}
                          animate={{ y: isFilled ? 8 : 40 }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                        />
                      </g>
                      
                      {/* Glass outline */}
                      <path 
                        d="M 8 2 L 24 2 L 26 38 L 6 38 Z" 
                        fill="none" 
                        stroke={isFilled ? "white" : "#4b5563"} 
                        strokeWidth="2"
                        className="transition-colors duration-300"
                      />
                      
                      {/* Water gradient definition */}
                      <defs>
                        <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#60a5fa" />
                          <stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </motion.button>
                );
              })}
            </div>

            <div className="text-xs text-zinc-400 text-center mt-2">
              {waterCount >= 8 ? (
                <span className="text-emerald-400 font-medium">
                  Perfect! You’ve hit your hydration goal!
                </span>
              ) : (
                <span>Keep going — stay hydrated!</span>
              )}
            </div>
          </Panel>

          {/* WATER GRAPH */}
            <Panel title="Water Intake (Past 5 Days)" icon={<Activity size={16} />}>
            <div className="flex justify-center">
                <ResponsiveContainer width="90%" height={150}>
                <AreaChart
                    data={initialWaterData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                    <XAxis
                    dataKey="day"
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    axisLine={{ stroke: "#374151" }}
                    />
                    <YAxis
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    axisLine={{ stroke: "#374151" }}
                    width={25}
                    domain={[0, 8]}
                    />
                    <Tooltip
                    contentStyle={{
                        backgroundColor: "#ffffff",
                        color: "#111111", // darker text
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        fontSize: "12px",
                    }}
                    labelStyle={{
                        color: "#111111", // darker label (the day)
                        fontWeight: 600,
                    }}
                    />
                    <Area
                    type="monotone"
                    dataKey="cups"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.25}
                    />
                </AreaChart>
                </ResponsiveContainer>
            </div>
            </Panel>

          {/* SLEEP TRACKER */}
          <Panel title="Sleep Tracker" icon={<Moon size={16} />}>
            <div className="flex flex-col items-center gap-2">
              <div className="text-[10px] text-zinc-400 text-center mb-1">
                Hours slept last night
              </div>
              
              {/* Apple-style 3-Column Time Picker Wheel */}
              <div className="relative w-full max-w-[350px]">
                {/* Selection highlight bar */}
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-10 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-y border-blue-500/30 pointer-events-none z-10 rounded-md shadow-lg shadow-blue-900/20" />
                
                {/* Gradient overlays for fade effect */}
                <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-[#0c0f14] via-[#0c0f14]/80 to-transparent pointer-events-none z-20" />
                <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#0c0f14] via-[#0c0f14]/80 to-transparent pointer-events-none z-20" />
                
                {/* 3 Column Layout */}
                <div className="flex items-center justify-center">
                  {/* Hours Column */}
                  <div className="relative h-32 w-16 overflow-y-auto scrollbar-hide" onScroll={handleHoursScroll}>
                    <div className="py-11">
                      {Array.from({ length: 13 }).map((_, i) => {
                        const isSelected = i === sleepHoursWhole;
                        return (
                          <motion.button
                            key={i}
                            onClick={() => {
                              setSleepHoursWhole(i);
                              setSleepHours(i + sleepMinutes / 60);
                            }}
                            className={`w-full h-10 flex items-center justify-center transition-all duration-200 ${
                              isSelected
                                ? "text-blue-400 font-bold text-2xl drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]"
                                : "text-zinc-500 text-lg hover:text-zinc-300"
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {i}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Separator Label */}
                  <div className="text-white text-sm font-medium px-1 relative z-30">
                    hours
                  </div>
                  
                  {/* Minutes Column */}
                  <div className="relative h-32 w-16 overflow-y-auto scrollbar-hide" onScroll={handleMinutesScroll}>
                    <div className="py-11">
                      {[0, 15, 30, 45].map((min) => {
                        const isSelected = min === sleepMinutes;
                        return (
                          <motion.button
                            key={min}
                            onClick={() => {
                              setSleepMinutes(min);
                              setSleepHours(sleepHoursWhole + min / 60);
                            }}
                            className={`w-full h-10 flex items-center justify-center transition-all duration-200 ${
                              isSelected
                                ? "text-blue-400 font-bold text-2xl drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                                : "text-zinc-500 text-lg hover:text-zinc-300"
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {min.toString().padStart(2, '0')}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Minutes Label */}
                  <div className="text-white text-sm font-medium px-1 relative z-30">
                    min
                  </div>
                </div>
              </div>
              
              {/* Log Button */}
              <motion.button
                onClick={() => {
                  // TODO: Log sleep data
                  alert(`Logged: ${sleepHoursWhole}h ${sleepMinutes}m of sleep`);
                }}
                className="mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-900/30 hover:bg-blue-900/50 border border-blue-900/50 text-blue-400 text-xs font-medium transition-all"
                whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(59, 130, 246, 0.3)" }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-sm">+</span>
                <span>Log Sleep</span>
              </motion.button>
            </div>
            
            <style jsx>{`
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
              .scrollbar-hide {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
            `}</style>
          </Panel>

          {/* SLEEP GRAPH */}
            <Panel title="Sleep Duration (Past 5 Days)" icon={<Activity size={16} />}>
            <div className="flex justify-center">
                <ResponsiveContainer width="90%" height={150}>
                <LineChart
                    data={initialSleepData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                    <XAxis
                    dataKey="day"
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    axisLine={{ stroke: "#374151" }}
                    />
                    <YAxis
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    axisLine={{ stroke: "#374151" }}
                    width={25}
                    domain={[5, 9]}
                    />
                    <Tooltip
                    contentStyle={{
                        backgroundColor: "#ffffff",
                        color: "#111111", // darker text
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        fontSize: "12px",
                    }}
                    labelStyle={{
                        color: "#111111", // darker label (the day)
                        fontWeight: 600,
                    }}
                    />
                    <Line
                    type="monotone"
                    dataKey="hrs"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    dot={{ fill: "#38bdf8" }}
                    />
                </LineChart>
                </ResponsiveContainer>
            </div>
            </Panel>
        </div>

        {/* CENTER COLUMN */}
        <div className="col-span-12 md:col-span-6 flex flex-col gap-5 items-center">
          <Panel title="3D Avatar" icon={<Brain size={16} />} className="w-full">
            <div className="aspect-[3/4] rounded-xl overflow-hidden">
              <div className="w-full h-full">
                <AvatarDashboard />
              </div>
            </div>
          </Panel>
        </div>

        {/* RIGHT COLUMN */}
        <div className="col-span-12 md:col-span-3 flex flex-col gap-5">
          <Panel title="Doc AI" icon={<Stethoscope size={16} />}>
            <div className="bg-black/50 border border-blue-900/30 rounded-xl p-3 h-32 overflow-auto text-sm space-y-2">
              <div>
                <b className="text-blue-400">You:</b> <span className="text-gray-300">Why am I feeling tired lately?</span>
              </div>
              <div>
                <b className="text-red-400">AI:</b> <span className="text-gray-300">Your sleep dropped below 7h average. Try consistent bedtime and hydration tracking.</span>
              </div>
            </div>
            <div className="mt-2 flex gap-2">
              <input
                placeholder="Ask your AI doctor..."
                className="flex-1 rounded-lg bg-black/50 border border-blue-900/30 px-3 py-2 text-sm placeholder:text-gray-500 text-white focus:ring-2 focus:ring-blue-900 focus:outline-none"
              />
              <motion.button 
                className="rounded-lg bg-blue-900/20 hover:bg-blue-900/30 border border-blue-900/30 px-3 py-2 text-sm font-semibold"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Send
              </motion.button>
            </div>
          </Panel>

          <Panel title="Monthly Check-ins" icon={<CalendarCheck2 size={16} />}>
            {/* Streak and Points - Compact */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <motion.div 
                className="flex items-center justify-center gap-1 bg-gradient-to-br from-orange-900/20 to-red-900/20 border border-orange-900/30 rounded-md px-2 py-1"
                whileHover={{ scale: 1.02 }}
              >
                <Flame size={12} className="text-orange-400" />
                <div className="text-xs font-bold text-orange-400">7</div>
                <div className="text-[9px] text-gray-400">streak</div>
              </motion.div>
              
              <motion.div 
                className="flex items-center justify-center gap-1 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-900/30 rounded-md px-2 py-1"
                whileHover={{ scale: 1.02 }}
              >
                <Award size={12} className="text-blue-400" />
                <div className="text-xs font-bold text-blue-400">350</div>
                <div className="text-[9px] text-gray-400">pts</div>
              </motion.div>
            </div>
            
            <div className="flex items-center justify-between mb-2 text-sm">
              <div>
                <span className="font-semibold">{checkedCount}</span> / {daysInMonth ?? "--"} days checked in
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-[10px]">
<<<<<<< Updated upstream
              {Array.from({ length: firstWeekday ?? 0}).map((_, i) => (
=======
               {Array.from({ length: firstWeekday ?? 0 }).map((_, i) => (
>>>>>>> Stashed changes
                <div key={`b-${i}`} className="h-7 rounded bg-gray-900/50 opacity-30 border border-blue-900/20" />
              ))}
              {checkins.map((d, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.01 }}
                  className={`h-7 rounded grid place-items-center border transition-all duration-300 ${
                    d.ok 
                      ? "bg-gradient-to-br from-blue-900/40 to-red-900/40 border-blue-900/50 text-blue-300 hover:border-red-900/50" 
                      : "bg-gray-900/50 border-blue-900/20 text-gray-400 hover:border-blue-900/40"
                  }`}
                >
                  {d.day}
                </motion.div>
              ))}
            </div>
          </Panel>

          <Panel title="Refill Countdown" icon={<Pill size={16} />}>
            <div className="text-sm text-gray-300">
              Refill atorvastatin in <b className="text-blue-400">5 days</b>.
            </div>
            <div className="mt-2 h-2 rounded-full bg-gray-900/50 border border-blue-900/30 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-900 to-red-900"
                initial={{ width: "0%" }}
                animate={{ width: "75%" }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            
            {/* Request Refill Button */}
            <motion.button
              onClick={() => {
                // TODO: Implement refill request logic
                alert('Refill request sent! Your pharmacy will be notified.');
              }}
              className="w-full mt-4 rounded-xl bg-blue-900/20 hover:bg-blue-900/30 border border-blue-900/30 px-4 py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Pill size={16} />
              Request Refill
            </motion.button>
          </Panel>

          <Panel title="AI Recommendations" icon={<BellRing size={16} />}>
            <ul className="text-sm text-gray-300 list-disc list-inside space-y-1">
              <li className="hover:text-blue-400 transition-colors duration-300">Drink 8 glasses of water daily</li>
              <li className="hover:text-blue-400 transition-colors duration-300">Sleep at least 7 hours tonight</li>
              <li className="hover:text-blue-400 transition-colors duration-300">Take your meds with food</li>
            </ul>
          </Panel>
        </div>
      </main>

      <motion.footer 
        className="py-8 text-center text-xs text-gray-500 border-t border-blue-900/20 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <div className="flex items-center justify-center gap-2">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles size={12} className="text-blue-400" />
          </motion.div>
          <span>© {new Date().getFullYear()} Nomi.ai · Demo UI</span>
          <motion.div
            animate={{ rotate: [360, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles size={12} className="text-red-400" />
          </motion.div>
        </div>
      </motion.footer>
    </div>
  );
}

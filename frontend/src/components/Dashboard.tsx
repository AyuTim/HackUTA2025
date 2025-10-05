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
} from "lucide-react";
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

const now = new Date();
const YEAR = now.getFullYear();
const MONTH = now.getMonth();
const DAYS_IN_MONTH = new Date(YEAR, MONTH + 1, 0).getDate();
const FIRST_WEEKDAY = new Date(YEAR, MONTH, 1).getDay();
const TODAY = now.getDate();
const checkins = Array.from({ length: DAYS_IN_MONTH }, (_, i) => ({
  day: i + 1,
  ok: Math.random() > 0.4 || i + 1 === TODAY,
}));
const checkedCount = checkins.filter((d) => d.ok).length;

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
              <Sparkles size={16} className="text-white" />
            </motion.div>
            <div>
              <div className="font-semibold leading-tight text-white">
                MedTwin Dashboard
              </div>
              <div className="text-xs text-gray-400">
                Peter Parker · Last sync 2m ago
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button 
              onClick={() => router.push('/profile')}
              className="rounded-xl bg-gradient-to-r from-purple-900/50 to-blue-900/50 hover:from-purple-800 hover:to-blue-800 border border-blue-900/50 px-3 py-2 text-sm flex items-center gap-2 transition-all duration-300"
              whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(30, 58, 138, 0.5)" }}
              whileTap={{ scale: 0.95 }}
            >
              <User size={14} /> Edit Profile
            </motion.button>
            <motion.button 
              className="rounded-xl bg-blue-900/50 hover:bg-blue-800/50 border border-blue-900/50 px-3 py-2 text-sm flex items-center gap-2 transition-all duration-300"
              whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(30, 58, 138, 0.5)" }}
              whileTap={{ scale: 0.95 }}
            >
              <ShieldCheck size={14} /> Emergency QR
            </motion.button>
            <motion.button 
              className="rounded-xl bg-gradient-to-r from-blue-900 to-red-900 hover:from-blue-800 hover:to-red-800 px-4 py-2 text-sm font-semibold transition-all duration-300"
              whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(127, 29, 29, 0.5)" }}
              whileTap={{ scale: 0.95 }}
            >
              Open What-If
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

            <div className="grid grid-cols-4 gap-3 justify-items-center mb-3">
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
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="relative h-12 w-8 rounded-md flex items-center justify-center"
                  >
                    <motion.div
                      animate={isFilled ? {
                        boxShadow: ["0 0 10px rgba(59, 130, 246, 0.3)", "0 0 20px rgba(59, 130, 246, 0.5)", "0 0 10px rgba(59, 130, 246, 0.3)"]
                      } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <GlassWater
                        size={26}
                        className={`relative z-20 transition-colors duration-300 ${
                          isFilled ? "text-blue-400" : "text-gray-600"
                        }`}
                      />
                    </motion.div>
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
            <div className="flex items-center justify-between mb-2 text-sm">
              <label htmlFor="sleepInput" className="text-zinc-300">
                Hours slept last night:
              </label>
              <input
                id="sleepInput"
                type="number"
                min={0}
                max={12}
                step={0.5}
                value={sleepHours}
                onChange={(e) => setSleepHours(parseFloat(e.target.value) || 0)}
                className="w-16 text-center rounded-md bg-black/50 border border-blue-900/30 p-1 text-white focus:ring-2 focus:ring-blue-900 focus:outline-none"
              />
            </div>
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
            <div className="aspect-[3/4] rounded-xl bg-gradient-to-br from-blue-900/20 to-red-900/20 grid place-items-center text-gray-400 text-xs border border-blue-900/30 relative overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-900/10 via-red-900/10 to-blue-900/10"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                style={{ backgroundSize: "200% 100%" }}
              />
              <span className="relative z-10">Three.js canvas placeholder</span>
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
                className="rounded-lg bg-gradient-to-r from-blue-900 to-red-900 px-3 py-2 text-sm font-semibold"
                whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(30, 58, 138, 0.5)" }}
                whileTap={{ scale: 0.95 }}
              >
                Send
              </motion.button>
            </div>
          </Panel>

          <Panel title="Monthly Check-ins" icon={<CalendarCheck2 size={16} />}>
            <div className="flex items-center justify-between mb-2 text-sm">
              <div>
                <span className="font-semibold">{checkedCount}</span> / {DAYS_IN_MONTH} days checked in
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-[10px]">
              {Array.from({ length: FIRST_WEEKDAY }).map((_, i) => (
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
          <span>© {new Date().getFullYear()} MedTwin · Demo UI</span>
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

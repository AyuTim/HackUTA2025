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
} from "lucide-react";
import AvatarDashboard from "./AvatarDashBoard";
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
    <div
      className={`rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4 shadow-lg shadow-black/20 ${className}`}
    >
      <div className="flex items-center gap-2 mb-3 text-sm font-semibold">
        <span className="text-blue-400">{icon}</span>
        <span>{title}</span>
      </div>
      {children}
    </div>
  );
}

/* -------------------------
   Main Dashboard Component
------------------------- */
export default function MedTwinDashboard() {
  const [waterCount, setWaterCount] = useState(0);
  const [filledCups, setFilledCups] = useState<boolean[]>(Array(8).fill(false));
  const [sleepHours, setSleepHours] = useState(7.0);

  return (
    <div className="min-h-screen bg-[#0b0f14] text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/30 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 grid place-items-center">
              <Sparkles size={16} />
            </div>
            <div>
              <div className="font-semibold leading-tight">MedTwin Dashboard</div>
              <div className="text-xs text-zinc-400">
                Peter Parker · Last sync 2m ago
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-xl bg-white/10 px-3 py-2 border border-white/10 text-sm flex items-center gap-2">
              <ShieldCheck size={14} /> Emergency QR
            </button>
            <button className="rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 px-4 py-2 text-sm font-semibold">
              Open What-If
            </button>
          </div>
        </div>
      </header>

      {/* Dashboard Layout */}
      <main className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-12 gap-5">
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
                  <button
                    key={i}
                    onClick={() =>
                      setFilledCups((prev) => {
                        const updated = [...prev];
                        updated[i] = !updated[i];
                        setWaterCount(updated.filter(Boolean).length);
                        return updated;
                      })
                    }
                    className="relative h-12 w-8 rounded-md flex items-center justify-center"
                  >
                    <GlassWater
                      size={26}
                      className={`relative z-20 ${
                        isFilled ? "text-blue-400" : "text-zinc-400/40"
                      }`}
                    />
                  </button>
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
                className="w-16 text-center rounded-md bg-white/10 border border-white/10 p-1 text-zinc-100"
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
            <div className="aspect-[3/4] rounded-xl overflow-hidden bg-[linear-gradient(120deg,#151a22,#0f141a)] border border-white/10">
              <div className="w-full h-full">
                <AvatarDashboard />
              </div>
            </div>
          </Panel>
        </div>

        {/* RIGHT COLUMN */}
        <div className="col-span-12 md:col-span-3 flex flex-col gap-5">
          <Panel title="Doc AI" icon={<Stethoscope size={16} />}>
            <div className="bg-black/30 border border-white/10 rounded-xl p-3 h-32 overflow-auto text-sm space-y-1">
              <div>
                <b>You:</b> Why am I feeling tired lately?
              </div>
              <div>
                <b>AI:</b> Your sleep dropped below 7h average. Try consistent bedtime and hydration tracking.
              </div>
            </div>
            <div className="mt-2 flex gap-2">
              <input
                placeholder="Ask your AI doctor..."
                className="flex-1 rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm placeholder:text-zinc-400"
              />
              <button className="rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600 px-3 py-2 text-sm font-semibold">
                Send
              </button>
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
                <div key={`b-${i}`} className="h-7 rounded bg-white/5 opacity-30" />
              ))}
              {checkins.map((d, i) => (
                <div
                  key={i}
                  className={`h-7 rounded grid place-items-center border border-white/10 ${
                    d.ok ? "bg-blue-500/20 text-blue-300" : "bg-white/5 text-zinc-300"
                  }`}
                >
                  {d.day}
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Refill Countdown" icon={<Pill size={16} />}>
            <div className="text-sm text-zinc-300">
              Refill atorvastatin in <b>5 days</b>.
            </div>
            <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                style={{ width: "75%" }}
              />
            </div>
          </Panel>

          <Panel title="AI Recommendations" icon={<BellRing size={16} />}>
            <ul className="text-sm text-zinc-300 list-disc list-inside">
              <li>Drink 8 glasses of water daily</li>
              <li>Sleep at least 7 hours tonight</li>
              <li>Take your meds with food</li>
            </ul>
          </Panel>
        </div>
      </main>

      <footer className="py-8 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} MedTwin · Demo UI
      </footer>
    </div>
  );
}

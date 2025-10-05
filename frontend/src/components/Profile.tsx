"use client";

import React from "react";
import { motion } from "framer-motion";
import { User, Activity, Pill, HeartPulse } from "lucide-react";

/* -------------------------
   Reusable Panel Wrapper (Static — no hover)
------------------------- */
function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0c0f14] to-[#111722] backdrop-blur-xl p-5 sm:p-6 shadow-[0_0_20px_rgba(0,0,0,0.3)] transition-all w-full">
      <div className="flex items-center gap-2 mb-4 font-semibold tracking-wide">
        <span className="text-red-400">{icon}</span>
        <span className="text-zinc-100 text-base sm:text-lg">{title}</span>
      </div>
      {children}
    </div>
  );
}

/* -------------------------
   Info Card (Hover Motion)
------------------------- */
function InfoCard({
  title,
  description,
  color,
  opacity = 0.6,
}: {
  title: string;
  description: string;
  color: "blue" | "red";
  opacity?: number;
}) {
  const glow =
    color === "blue"
      ? "hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] border-blue-500/20"
      : "hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] border-red-500/20";

  const accent =
    color === "blue"
      ? "text-blue-300 border-l-2 border-blue-500/40"
      : "text-red-300 border-l-2 border-red-500/40";

  return (
    <motion.div
      whileHover={{ scale: 1.03, boxShadow: "0 0 18px rgba(59,130,246,0.3)" }}
      style={{ opacity }}
      className={`rounded-xl border bg-[#0e121a]/70 p-4 sm:p-5 ${glow} transition-all`}
    >
      <h3
        className={`font-semibold mb-2 text-sm sm:text-base ${
          color === "blue" ? "text-blue-400" : "text-red-400"
        }`}
      >
        {title}
      </h3>
      <p
        className={`text-xs sm:text-sm text-zinc-300 ${accent} pl-3 leading-relaxed`}
      >
        {description}
      </p>
    </motion.div>
  );
}

/* -------------------------
   Main Profile Page
------------------------- */
export default function Profile() {
  const medications = [
    {
      title: "Atorvastatin 20mg – Nightly",
      description:
        "Lowers LDL cholesterol and reduces heart disease risk. Take after dinner with water.",
    },
    {
      title: "Vitamin D 1000 IU – Morning",
      description:
        "Supports bone and immune health. Take after breakfast with food for best absorption.",
    },
    {
      title: "Ibuprofen 200mg – As Needed",
      description:
        "Pain reliever and anti-inflammatory. Do not exceed 1200mg/day. Avoid empty stomach.",
    },
  ];

  const ailments = [
    {
      title: "Mild Seasonal Allergies",
      description:
        "Triggered by pollen and dust. Managed with antihistamines, hydration, and air filters.",
    },
    {
      title: "Elevated LDL Cholesterol",
      description:
        "Controlled with diet, exercise, and medication. Regular checkups recommended every 6 months.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#070a0f] text-zinc-100 px-4 sm:px-6 py-10 relative overflow-hidden">
      {/* Subtle Animated Background */}
      <motion.div
        animate={{
          background: [
            "radial-gradient(circle at 70% 30%, rgba(59,130,246,0.1), transparent 70%)",
            "radial-gradient(circle at 30% 60%, rgba(239,68,68,0.1), transparent 70%)",
          ],
        }}
        transition={{ duration: 12, repeat: Infinity, repeatType: "mirror" }}
        className="absolute inset-0 -z-10 blur-3xl opacity-70"
      />

      <div className="max-w-5xl mx-auto space-y-8 sm:space-y-10">
        {/* Header */}
        <div className="text-center px-2">
          <div className="inline-flex items-center gap-3 px-5 sm:px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500/15 to-red-500/15 border border-white/10 shadow-[0_0_25px_rgba(59,130,246,0.15)]">
            <User size={22} className="text-red-400" />
            <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-wide">
              My Profile
            </h1>
          </div>
          <p className="text-zinc-400 text-xs sm:text-sm mt-3">
            Review and manage your health information
          </p>
        </div>

        {/* Biodata */}
        <Panel
          title="Biodata"
          icon={<Activity size={16} className="text-red-400" />}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 sm:gap-y-2 text-sm sm:text-base">
            <div>
              <span className="text-zinc-400">Full Name:</span>{" "}
              <span className="text-white font-medium">Peter Parker</span>
            </div>
            <div>
              <span className="text-zinc-400">Age:</span>{" "}
              <span className="text-white font-medium">26</span>
            </div>
            <div>
              <span className="text-zinc-400">Height:</span>{" "}
              <span className="text-white font-medium">5'10"</span>
            </div>
            <div>
              <span className="text-zinc-400">Weight:</span>{" "}
              <span className="text-white font-medium">159 lbs</span>
            </div>
            <div>
              <span className="text-zinc-400">Gender:</span>{" "}
              <span className="text-white font-medium">Male</span>
            </div>
            <div>
              <span className="text-zinc-400">Blood Type:</span>{" "}
              <span className="text-white font-medium">O+</span>
            </div>
          </div>
        </Panel>

        {/* Medications */}
        <Panel
          title="Medications"
          icon={<Pill size={16} className="text-red-400" />}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {medications.map((med, i) => (
              <InfoCard
                key={i}
                title={med.title}
                description={med.description}
                color="blue"
                opacity={0.85}
              />
            ))}
          </div>
        </Panel>

        {/* Current Ailments */}
        <Panel
          title="Current Ailments"
          icon={<HeartPulse size={16} className="text-red-400" />}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {ailments.map((a, i) => (
              <InfoCard
                key={i}
                title={a.title}
                description={a.description}
                color="blue"
                opacity={0.85}
              />
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

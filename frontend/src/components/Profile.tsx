"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, Pill, HeartPulse, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0/client";
import AuthButton from "./AuthButton";
import dynamic from "next/dynamic";
import Link from "next/link";

const AvatarViewer = dynamic(() => import("./AvatarViewer"), { ssr: false });

/* -------------------------
   Reusable Panel Wrapper
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
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0c0f14] to-[#111722] backdrop-blur-xl p-4 sm:p-6 shadow-[0_0_20px_rgba(0,0,0,0.3)] transition-all w-full">
      <div className="flex items-center gap-2 mb-3 sm:mb-4 font-semibold tracking-wide">
        <motion.span
          className="text-blue-400"
          animate={{ rotate: [0, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {icon}
        </motion.span>
        <span className="text-white text-sm sm:text-lg">{title}</span>
      </div>
      {children}
    </div>
  );
}

/* -------------------------
   Info Card
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
      ? "hover:shadow-blue-900/30 border-blue-900/20"
      : "hover:shadow-red-900/30 border-red-900/20";

  const accent =
    color === "blue"
      ? "text-blue-300 border-l-2 border-blue-900/40"
      : "text-red-300 border-l-2 border-red-900/40";

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      style={{ opacity }}
      className={`rounded-xl border bg-gray-900/70 p-4 sm:p-5 ${glow} transition-all`}
    >
      <h3
        className={`font-semibold mb-1 sm:mb-2 text-sm ${
          color === "blue" ? "text-blue-400" : "text-red-400"
        }`}
      >
        {title}
      </h3>
      <p
        className={`text-xs sm:text-sm text-gray-300 ${accent} pl-3 leading-relaxed`}
      >
        {description}
      </p>
    </motion.div>
  );
}

/* -------------------------
   Main Profile
------------------------- */
export default function Profile() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const response = await fetch("/api/profile");
        if (response.ok) {
          const result = await response.json();
          setProfileData(result.data);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

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

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <motion.div
          className="w-14 h-14 border-4 border-blue-500 border-t-red-500 rounded-full animate-spin"
        />
      </div>
    );
  }

  if (!user)
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4">
            Please log in to view your profile
          </h1>
          <AuthButton />
        </div>
      </div>
    );

  if (!profileData)
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4">No profile found</h1>
          <p className="text-gray-400 mb-6 text-sm sm:text-base">
            Create your profile to get started
          </p>
          <motion.button
            onClick={() => router.push("/profile/edit")}
            className="rounded-xl bg-gradient-to-r from-blue-900 to-red-900 px-5 sm:px-6 py-2 sm:py-3 font-semibold text-sm sm:text-base"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Create Profile
          </motion.button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* BG */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute inset-x-0 top-0 h-[40rem] bg-gradient-to-br from-blue-900/30 via-purple-900/15 to-red-900/30 blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute inset-x-0 bottom-0 h-[40rem] bg-gradient-to-tr from-red-900/30 via-pink-900/15 to-blue-900/30 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>

      {/* NAVBAR */}
      <header className="sticky top-0 z-40 border-b border-blue-900/30 bg-black/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
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
                Profile · Last sync 2m ago
              </div>
            </div>
          </div>
          <motion.button
            onClick={() => router.push("/dashboard")}
            className="rounded-lg sm:rounded-xl bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-blue-900/50 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm"
            whileHover={{
              scale: 1.05,
              boxShadow: "0 0 12px rgba(30,58,138,0.5)",
            }}
            whileTap={{ scale: 0.95 }}
          >
            Dashboard
          </motion.button>
        </div>
      </header>

      {/* MAIN  */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 px-4 sm:px-6 py-8 sm:py-10 relative z-10">
        {/* LEFT: Avatar */}
        <div className="relative">
          <div className="rounded-3xl border border-blue-600/30 bg-gradient-to-br from-gray-900 to-black p-2 sm:p-3 shadow-2xl shadow-blue-600/20">
            <div className="aspect-[3/4] rounded-2xl bg-gradient-to-br from-blue-600/10 to-red-600/10 overflow-hidden">
              <AvatarViewer src="/model/soumika.glb" />
            </div>
          </div>
        </div>

        {/* RIGHT: Panels */}
        <div className="space-y-6 sm:space-y-8">
          <Panel title="Biodata" icon={<Activity size={16} className="text-red-400" />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 sm:gap-y-3 text-xs sm:text-sm md:text-base">
              <div>
                <span className="text-gray-400">Full Name:</span>{" "}
                <span className="font-medium">{profileData.full_name || "N/A"}</span>
              </div>
              <div>
                <span className="text-gray-400">Age:</span>{" "}
                <span className="font-medium">{profileData.age || "N/A"}</span>
              </div>
              <div>
                <span className="text-gray-400">Height:</span>{" "}
                <span className="font-medium">
                  {profileData.height_feet && profileData.height_inches
                    ? `${profileData.height_feet}'${profileData.height_inches}"`
                    : "N/A"}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Weight:</span>{" "}
                <span className="font-medium">
                  {profileData.weight ? `${profileData.weight} lbs` : "N/A"}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Gender:</span>{" "}
                <span className="font-medium">{profileData.gender || "N/A"}</span>
              </div>
              <div>
                <span className="text-gray-400">Blood Type:</span>{" "}
                <span className="font-medium">
                  {profileData.blood_type || "N/A"}
                </span>
              </div>
            </div>
          </Panel>

          <Panel title="Medications" icon={<Pill size={16} className="text-red-400" />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {medications.map((m, i) => (
                <InfoCard key={i} title={m.title} description={m.description} color="blue" />
              ))}
            </div>
          </Panel>

          <Panel title="Current Ailments" icon={<HeartPulse size={16} className="text-red-400" />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {ailments.map((a, i) => (
                <InfoCard key={i} title={a.title} description={a.description} color="blue" />
              ))}
            </div>
          </Panel>
        </div>
      </div>

      {/* FOOTER */}
      <motion.footer
        className="py-6 sm:py-8 text-center text-[10px] sm:text-xs text-gray-500 border-t border-blue-900/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <div className="flex items-center justify-center gap-2">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles size={10} className="text-blue-400" />
          </motion.div>
          <span>© {new Date().getFullYear()} Nomi.ai · Demo</span>
          <motion.div
            animate={{ rotate: [360, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles size={10} className="text-red-400" />
          </motion.div>
        </div>
      </motion.footer>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, Pill, HeartPulse, Home, Sparkles } from "lucide-react";
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
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0c0f14] to-[#111722] backdrop-blur-xl p-5 sm:p-6 shadow-[0_0_20px_rgba(0,0,0,0.3)] transition-all w-full">
      <div className="flex items-center gap-2 mb-4 font-semibold tracking-wide">
        <motion.span
          className="text-blue-400"
          animate={{ rotate: [0, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {icon}
        </motion.span>
        <span className="text-white text-base sm:text-lg">{title}</span>
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
      ? "hover:shadow-blue-900/30 border-blue-900/20"
      : "hover:shadow-red-900/30 border-red-900/20";

  const accent =
    color === "blue"
      ? "text-blue-300 border-l-2 border-blue-900/40"
      : "text-red-300 border-l-2 border-red-900/40";

  return (
    <motion.div
      whileHover={{ scale: 1.03, boxShadow: "0 0 18px rgba(30, 58, 138, 0.3)" }}
      style={{ opacity }}
      className={`rounded-xl border bg-gray-900/70 p-4 sm:p-5 ${glow} transition-all`}
    >
      <h3
        className={`font-semibold mb-2 text-sm sm:text-base ${
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
   Main Profile View
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
        <div className="text-center">
          <motion.div
            className="w-16 h-16 border-4 border-blue-500 border-t-red-500 rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-gray-300">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">
            Please log in to view your profile
          </h1>
          <AuthButton />
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">No profile found</h1>
          <p className="text-gray-400 mb-6">
            Create your profile to get started
          </p>
          <motion.button
            onClick={() => router.push("/profile/edit")}
            className="rounded-xl bg-gradient-to-r from-blue-900 to-red-900 px-6 py-3 font-semibold"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Create Profile
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated Background */}
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
            ease: "easeInOut",
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
            delay: 1,
          }}
        />
      </div>

      {/* Navbar (same style as dashboard) */}
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
                My Profile · Last sync 2m ago
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => router.push("/dashboard")}
              className="rounded-xl bg-gradient-to-r from-purple-900/50 to-blue-900/50 hover:from-purple-800 hover:to-blue-800 border border-blue-900/50 px-4 py-2 text-sm flex items-center gap-2"
              whileHover={{
                scale: 1.05,
                boxShadow: "0 0 20px rgba(30, 58, 138, 0.5)",
              }}
              whileTap={{ scale: 0.95 }}
            >
              Dashboard
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main layout - 50/50 */}
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10 items-start relative z-10 px-4 sm:px-6 py-10">
        {/* LEFT: Live 3D model */}
        <div className="relative spider-float">
          <div className="rounded-3xl border border-blue-600/30 bg-gradient-to-br from-gray-900 to-black p-3 shadow-2xl shadow-blue-600/20">
            <div className="aspect-[3/4] rounded-2xl bg-gradient-to-br from-blue-600/10 to-red-600/10 overflow-hidden">
              <AvatarViewer src="/model/soumika.glb" />
            </div>
          </div>
          <div className="absolute -inset-6 -z-10 bg-gradient-to-r from-blue-600/20 via-red-600/10 to-blue-600/20 blur-3xl rounded-[2rem]" />
        </div>

        {/* RIGHT: Profile info panels */}
        <div className="space-y-8 sm:space-y-10">
          <Panel
            title="Biodata"
            icon={<Activity size={16} className="text-red-400" />}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 sm:gap-y-2 text-sm sm:text-base">
              <div>
                <span className="text-gray-400">Full Name:</span>{" "}
                <span className="text-white font-medium">
                  {profileData.full_name || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Age:</span>{" "}
                <span className="text-white font-medium">
                  {profileData.age || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Height:</span>{" "}
                <span className="text-white font-medium">
                  {profileData.height_feet && profileData.height_inches
                    ? `${profileData.height_feet}'${profileData.height_inches}"`
                    : "N/A"}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Weight:</span>{" "}
                <span className="text-white font-medium">
                  {profileData.weight ? `${profileData.weight} lbs` : "N/A"}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Gender:</span>{" "}
                <span className="text-white font-medium">
                  {profileData.gender || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Blood Type:</span>{" "}
                <span className="text-white font-medium">
                  {profileData.blood_type || "N/A"}
                </span>
              </div>
            </div>

            {profileData.medical_record_filename && (
              <div className="mt-4 pt-4 border-t border-blue-900/30">
                <span className="text-gray-400">Medical Record:</span>{" "}
                <a
                  href={profileData.medical_record_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline font-medium"
                >
                  {profileData.medical_record_filename}
                </a>
              </div>
            )}
          </Panel>

          <Panel title="Medications" icon={<Pill size={16} className="text-red-400" />}>
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

      {/* Footer */}
      <motion.footer
        className="py-8 text-center text-xs text-gray-500 border-t border-blue-900/20 relative z-10 mt-12"
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
          <span>© {new Date().getFullYear()} Nomi.ai · For demo purposes only</span>
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

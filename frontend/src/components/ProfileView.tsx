"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Activity, Pill, HeartPulse, Edit, Home, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from '@auth0/nextjs-auth0/client';
import AuthButton from "./AuthButton";

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-blue-900/30 bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-xl p-5 sm:p-6 shadow-2xl shadow-blue-900/20 hover:shadow-red-900/20 hover:border-red-900/30 transition-all w-full"
    >
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
    </motion.div>
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
export default function ProfileView() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const result = await response.json();
          setProfileData(result.data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  // Sample data for medications and ailments (will be replaced with real data later)
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
          <h1 className="text-3xl font-bold mb-4">Please log in to view your profile</h1>
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
          <p className="text-gray-400 mb-6">Create your profile to get started</p>
          <motion.button
            onClick={() => router.push('/profile/edit')}
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
    <div className="min-h-screen bg-black text-white px-4 sm:px-6 py-10 relative overflow-hidden">
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
        <svg className="absolute top-0 right-0 w-64 h-64" viewBox="0 0 200 200">
          <path d="M200 0 L100 100 L200 100 Z M200 0 L120 20 M200 20 L140 40 M200 40 L160 60 M200 60 L180 80" 
                stroke="white" strokeWidth="1.5" fill="none"/>
          <circle cx="100" cy="100" r="4" fill="white"/>
        </svg>

        <svg className="absolute bottom-10 left-10 w-64 h-64" viewBox="0 0 200 200">
          <path d="M0 200 L100 100 L0 100 Z M0 200 L80 180 M0 180 L60 160 M0 160 L40 140 M0 140 L20 120" 
                stroke="white" strokeWidth="1.5" fill="none"/>
          <circle cx="100" cy="100" r="4" fill="white"/>
        </svg>
      </div>

      <div className="max-w-5xl mx-auto space-y-8 sm:space-y-10 relative z-10">
        {/* Header */}
        <div className="text-center px-2">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 px-5 sm:px-6 py-3 rounded-xl bg-gradient-to-r from-blue-900/50 to-red-900/50 border border-blue-900/50 shadow-lg shadow-blue-900/20"
          >
            <User size={22} className="text-blue-400" />
            <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-wide">
              My Profile
            </h1>
          </motion.div>
          <p className="text-gray-400 text-xs sm:text-sm mt-3">
            Review and manage your health information
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-center mt-6">
            <motion.button
              onClick={() => router.push('/')}
              className="rounded-xl bg-blue-900/50 hover:bg-blue-800/50 border border-blue-900/50 px-4 py-2 text-sm flex items-center gap-2"
              whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(30, 58, 138, 0.5)" }}
              whileTap={{ scale: 0.95 }}
            >
              <Home size={16} /> Home
            </motion.button>
            <motion.button
              onClick={() => router.push('/profile/edit')}
              className="rounded-xl bg-gradient-to-r from-purple-900/50 to-blue-900/50 hover:from-purple-800 hover:to-blue-800 border border-blue-900/50 px-4 py-2 text-sm flex items-center gap-2"
              whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(30, 58, 138, 0.5)" }}
              whileTap={{ scale: 0.95 }}
            >
              <Edit size={16} /> Edit Profile
            </motion.button>
            <motion.button
              onClick={() => router.push('/dashboard')}
              className="rounded-xl bg-gradient-to-r from-blue-900 to-red-900 hover:from-blue-800 hover:to-red-800 px-4 py-2 text-sm font-semibold flex items-center gap-2"
              whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(127, 29, 29, 0.5)" }}
              whileTap={{ scale: 0.95 }}
            >
              <Sparkles size={16} /> Dashboard
            </motion.button>
          </div>
        </div>

        {/* Biodata */}
        <Panel
          title="Biodata"
          icon={<Activity size={16} />}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 sm:gap-y-2 text-sm sm:text-base">
            <div>
              <span className="text-gray-400">Full Name:</span>{" "}
              <span className="text-white font-medium">{profileData.full_name || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-400">Age:</span>{" "}
              <span className="text-white font-medium">{profileData.age || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-400">Height:</span>{" "}
              <span className="text-white font-medium">
                {profileData.height_feet && profileData.height_inches 
                  ? `${profileData.height_feet}'${profileData.height_inches}"` 
                  : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Weight:</span>{" "}
              <span className="text-white font-medium">
                {profileData.weight ? `${profileData.weight} lbs` : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Gender:</span>{" "}
              <span className="text-white font-medium">{profileData.gender || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-400">Blood Type:</span>{" "}
              <span className="text-white font-medium">{profileData.blood_type || 'N/A'}</span>
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

         {/* Medications */}
         <Panel
           title="Medications"
           icon={<Pill size={16} />}
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
           <p className="text-xs text-gray-500 mt-4 text-center">
             Note: This is sample data. Connect to your medical records to see actual medications.
           </p>
           
           {/* Request Refill Button */}
           <div className="mt-6 flex justify-center">
             <motion.button
               onClick={() => {
                 // TODO: Implement refill request logic
                 alert('Refill request feature coming soon!');
               }}
               className="rounded-xl bg-gradient-to-r from-blue-900 to-purple-900 hover:from-blue-800 hover:to-purple-800 border border-blue-900/50 px-6 py-3 text-sm font-semibold flex items-center gap-2 shadow-lg"
               whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(30, 58, 138, 0.5)" }}
               whileTap={{ scale: 0.95 }}
             >
               <Pill size={18} />
               Request Refill
             </motion.button>
           </div>
         </Panel>

        {/* Current Ailments */}
        <Panel
          title="Current Ailments"
          icon={<HeartPulse size={16} />}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {ailments.map((a, i) => (
              <InfoCard
                key={i}
                title={a.title}
                description={a.description}
                color="red"
                opacity={0.85}
              />
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-4 text-center">
            Note: This is sample data. Connect to your medical records to see actual conditions.
          </p>
        </Panel>
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
          <span>© {new Date().getFullYear()} MedTwin · For demo purposes only</span>
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

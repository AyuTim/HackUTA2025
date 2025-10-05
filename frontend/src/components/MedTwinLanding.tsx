"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Activity,
  Shield,
  Cpu,
  FileSearch,
  Sparkles,
  SmartphoneNfc,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from '@auth0/nextjs-auth0/client';
import { useEffect, useState } from "react";
import AuthButton from "./AuthButton";
import dynamic from "next/dynamic";

// Dynamically import the 3D viewer to avoid SSR issues. The actual package
// dependencies are optional and instructions are provided in the new component.
const AvatarViewer = dynamic(() => import("./AvatarViewer"), { ssr: false });

const Section = ({
  id,
  children,
  className = "",
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <section id={id} className={`w-full max-w-7xl mx-auto px-6 ${className}`}>
    {children}
  </section>
);

const Glow = ({ className = "" }: { className?: string }) => (
  <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(60%_60%_at_50%_40%,black,transparent)]">
    <div
      className={`absolute -inset-x-40 -top-40 h-[32rem] bg-gradient-to-r from-blue-900/20 via-red-900/15 to-blue-900/20 blur-3xl ${className}`}
    />
  </div>
);

export default function MedTwinLanding() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [hasProfile, setHasProfile] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  
  // Check if user has a profile
  useEffect(() => {
    const checkProfile = async () => {
      if (!user) {
        setCheckingProfile(false);
        setHasProfile(false);
        return;
      }
      
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const result = await response.json();
          setHasProfile(result.data !== null && result.data !== undefined);
        }
      } catch (error) {
        console.error('Error checking profile:', error);
        setHasProfile(false);
      } finally {
        setCheckingProfile(false);
      }
    };

    checkProfile();
  }, [user]);
  
  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Loading your MedTwin...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <Glow />
      {/* NAV */}
      <nav className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-black/50 bg-black/30 border-b border-blue-900/30">
        <Section className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-900 to-red-900 grid place-items-center shadow-lg shadow-blue-900/40 spider-pulse">
              <Sparkles size={16} className="text-white spider-glow" />
            </div>
            <span className="font-bold tracking-wide text-lg bg-gradient-to-r from-blue-400 to-red-400 bg-clip-text text-transparent">MedTwin</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-300">
            <a href="#features" className="hover:text-blue-400 transition-colors duration-300 neon-flicker">
              Features
            </a>
            <a href="#preview" className="hover:text-red-400 transition-colors duration-300 neon-flicker">
              Preview
            </a>
            <a href="#how" className="hover:text-blue-400 transition-colors duration-300 neon-flicker">
              How it works
            </a>
            <a href="#cta" className="hover:text-red-400 transition-colors duration-300 neon-flicker">
              Get started
            </a>
          </div>
          <AuthButton />
        </Section>
      </nav>

      {/* HERO */}
      <Section className="relative py-12 md:py-2">
        <div className="grid md:grid-cols-2 gap-27 items-start md:items-center">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-6xl font-bold leading-tight"
            >
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Your{" "}
              </motion.span>
              <motion.span 
                className="relative inline-block"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <span className="relative z-10 font-extrabold">
                  <motion.span
                    className="bg-gradient-to-r from-blue-900 via-purple-800 to-red-900 bg-clip-text text-transparent"
                    style={{ backgroundSize: "200% 100%" }}
                    animate={{
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    digital twin
                  </motion.span>
                </span>
                {/* Animated glow layer 1 */}
                <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-red-900 to-blue-900 blur-2xl"
                  animate={{
                    opacity: [0.4, 0.5, 0.4],
                    scale: [0.98, 1.05, 0.98],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                {/* Animated glow layer 2 - offset timing */}
                <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-red-900 to-blue-900 blur-xl"
                  animate={{
                    opacity: [0.1, 0.3, 0.1],
                    scale: [1.05, 0.98, 1.05],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1.5
                  }}
                />
              </motion.span>{" "}
              <motion.span
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="relative inline-block"
              >
                <span className="bg-gradient-to-r from-gray-100 via-blue-00 to-gray-100 bg-clip-text text-transparent">
                  for personal health.
                </span>
                <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/20 to-transparent"
                  animate={{
                    x: ["-100%", "100%"],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear",
                    repeatDelay: 1
                  }}
                />
              </motion.span>
            </motion.h1>
            <p className="mt-4 text-gray-300 max-w-xl">
              Upload scans and checkups, visualize a 3D body, simulate what-if
              scenarios, and carry a tap-to-share health pass. Built for
              clarity, privacy, and control.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => {
                  if (user && hasProfile) {
                    router.push('/dashboard');
                  } else {
                    router.push('/profile');
                  }
                }}
                disabled={checkingProfile}
                className="group inline-flex items-center gap-2 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 px-5 py-3 border border-blue-600/30 hover:border-blue-600/50 transition-all duration-300 web-sway disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkingProfile ? (
                  'Loading...'
                ) : user && hasProfile ? (
                  <>
                    Dashboard{" "}
                    <ChevronRight
                      className="group-hover:translate-x-0.5 transition"
                      size={16}
                    />
                  </>
                ) : (
                  <>
                    Create Digital Twin{" "}
                    <ChevronRight
                      className="group-hover:translate-x-0.5 transition"
                      size={16}
                    />
                  </>
                )}
              </button>
              <a
                href="#cta"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-900 to-red-900 px-5 py-3 font-semibold shadow-lg shadow-blue-600/30 hover:shadow-red-600/30 transition-all duration-300 hover:scale-105 spider-pulse"
              >
                Get started
              </a>
            </div>
            <div className="mt-6 flex gap-6 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-blue-400 spider-glow" /> HIPAA-aware design
              </div>
              <div className="flex items-center gap-2">
                <Cpu size={14} className="text-red-400 spider-glow" /> AI what-ifs
              </div>
              <div className="flex items-center gap-2">
                <SmartphoneNfc size={14} className="text-blue-400 spider-glow" /> NFC/QR pass
              </div>
            </div>
          </div>

          {/* 3D Avatar Viewer */}
          <div className="relative spider-float">
            <div className="rounded-3xl border border-blue-600/30 bg-gradient-to-br from-gray-900 to-black p-3 shadow-2xl shadow-blue-600/20">
              <div className="aspect-[4/5] rounded-2xl bg-gradient-to-br from-blue-600/10 to-red-600/10 relative overflow-hidden">
                <AvatarViewer />
              </div>
            </div>
            <div className="absolute -inset-6 -z-10 bg-gradient-to-r from-blue-600/20 via-red-600/10 to-blue-600/20 blur-3xl rounded-[2rem] spider-glow" />
          </div>
        </div>
      </Section>

      {/* FEATURES */}
      <Section id="features" className="py-10 md:py-14">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: <FileSearch />,
              title: "Upload & Understand",
              text: "PDFs, labs, and MRI scans parsed to plain English and linked to your timeline.",
            },
            {
              icon: <Brain />,
              title: "3D Body Twin",
              text: "Spin a full 360° avatar with hotspots for organs, meds, and findings.",
            },
            {
              icon: <Activity />,
              title: "What-If Simulations",
              text: "Ask ‘What if I skip a dose?’ and see projected trends with citations.",
            },
          ].map((f, i) => (
            <div
              key={i}
              className="rounded-2xl border border-blue-600/20 bg-gradient-to-br from-gray-900/80 to-black/50 p-5 shadow-lg shadow-blue-600/10 hover:shadow-red-600/20 hover:border-red-600/30 transition-all duration-300 hover:scale-105 web-sway"
            >
              <div className="mb-3 text-blue-400 spider-glow">{f.icon}</div>
              <h3 className="font-semibold mb-1 text-white">{f.title}</h3>
              <p className="text-sm text-gray-300">{f.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* PREVIEW */}
      <Section id="preview" className="py-16">
        <div className="rounded-3xl border border-blue-600/30 bg-gradient-to-b from-gray-900 to-black p-6 shadow-2xl shadow-blue-600/20 spider-float">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-3">
              <h2 className="text-2xl font-bold spider-text-glow">Live dashboard preview</h2>
              <p className="text-gray-300">
                Timeline, vitals, adherence heatmap, and an AI doctor chat that
                cites your own records.
              </p>
              <ul className="text-sm text-gray-300 list-disc list-inside">
                <li>Plain-English summaries from uploads</li>
                <li>NFC/QR emergency pass in one tap</li>
                <li>Private-by-default, on your device</li>
              </ul>
              <div className="pt-2 flex gap-3">
                <button 
                  onClick={() => {
                    if (user && hasProfile) {
                      router.push('/dashboard');
                    } else {
                      router.push('/profile');
                    }
                  }}
                  disabled={checkingProfile}
                  className="rounded-xl bg-blue-600/10 px-4 py-2 border border-blue-600/30 hover:bg-blue-600/20 transition-all duration-300 web-sway disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkingProfile ? 'Loading...' : user && hasProfile ? 'Open Dashboard' : 'Create Digital Twin'}
                </button>
                <button className="rounded-xl bg-gradient-to-r from-blue-900 to-red-900 px-4 py-2 font-semibold shadow-lg shadow-blue-600/30 hover:shadow-red-600/30 transition-all duration-300 hover:scale-105 spider-pulse">
                  Try What-If
                </button>
              </div>
            </div>
            <div className="rounded-2xl border border-red-600/30 bg-black/60 p-4">
              <div className="aspect-video rounded-xl bg-gradient-to-br from-blue-600/10 to-red-600/10 relative overflow-hidden">
                <div className="absolute inset-0 opacity-60 [mask-image:radial-gradient(50%_70%_at_50%_50%,white,transparent)]">
                  <div className="absolute -inset-24 bg-[conic-gradient(from_120deg,rgba(59,130,246,0.25),rgba(220,38,38,0.15),rgba(59,130,246,0.2))] blur-2xl" />
                </div>
                <div className="absolute inset-0 grid place-items-center text-sm text-gray-400">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
                    <p>Embed your dashboard preview here</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* HOW IT WORKS */}
      <Section id="how" className="py-16">
        <h2 className="text-2xl font-bold mb-6 spider-text-glow">How it works</h2>
        <div className="grid md:grid-cols-4 gap-4 text-sm">
          {[
            {
              step: 1,
              title: "Build Profile",
              text: "Create your avatar and set preferences.",
            },
            {
              step: 2,
              title: "Upload Records",
              text: "PDFs/DICOM parsed with OCR; linked to organs and timeline.",
            },
            {
              step: 3,
              title: "Chat & Simulate",
              text: "Ask the AI doctor and run what-if scenarios.",
            },
            {
              step: 4,
              title: "Share Safely",
              text: "NFC/QR pass for visits; revoke anytime.",
            },
          ].map((s, i) => (
            <div
              key={i}
              className="rounded-2xl border border-blue-600/20 bg-gradient-to-br from-gray-900/80 to-black/50 p-5 hover:border-red-600/30 transition-all duration-300 hover:scale-105 web-sway"
            >
              <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-blue-500 to-red-600 leading-none spider-gradient-text">
                {s.step}
              </div>
              <div className="mt-2 font-semibold text-white">{s.title}</div>
              <p className="text-gray-300">{s.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section id="cta" className="py-20">
        <div className="relative rounded-3xl overflow-hidden border border-blue-600/30 spider-float">
          <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_0%,rgba(59,130,246,0.25),transparent)]" />
          <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_100%,rgba(220,38,38,0.15),transparent)]" />
          <div className="relative p-10 md:p-14 grid md:grid-cols-[1.2fr_.8fr] gap-8 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold spider-text-glow">
                Be part of the human-health evolution
              </h2>
              <p className="mt-2 text-gray-300">
                Own your data. See it. Understand it. Share it safely.
              </p>
            </div>
            <div className="flex gap-3 md:justify-end">
              <button
                onClick={() => router.push("/profile")}
                className="rounded-xl bg-gradient-to-r from-blue-900 to-red-900 px-6 py-3 font-semibold shadow-lg shadow-blue-600/40 hover:shadow-red-600/40 transition-all duration-300 hover:scale-105 spider-pulse"
              >
                Create your Twin
              </button>
              <button className="rounded-xl bg-blue-600/10 px-6 py-3 border border-blue-600/30 hover:bg-blue-600/20 transition-all duration-300 web-sway">
                Learn more
              </button>
            </div>
          </div>
        </div>
      </Section>

      {/* FOOTER */}
      <footer className="py-10 text-center text-xs text-gray-500 border-t border-blue-600/20">
        © {new Date().getFullYear()} MedTwin. For demo purposes only.
      </footer>
    </div>
  );
}
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
      className={`absolute -inset-x-40 -top-40 h-[32rem] bg-gradient-to-r from-blue-500/20 via-cyan-400/10 to-indigo-500/20 blur-3xl ${className}`}
    />
  </div>
);

export default function MedTwinLanding() {
  const router = useRouter();
  
  return (
    <div className="min-h-screen bg-[#0b0f14] text-zinc-100 relative overflow-hidden">
      <Glow />
      {/* NAV */}
      <nav className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-black/30 bg-black/10 border-b border-white/10">
        <Section className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 grid place-items-center">
              <Sparkles size={16} />
            </div>
            <span className="font-semibold tracking-wide">MedTwin</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-zinc-300">
            <a href="#features" className="hover:text-white">
              Features
            </a>
            <a href="#preview" className="hover:text-white">
              Preview
            </a>
            <a href="#how" className="hover:text-white">
              How it works
            </a>
            <a href="#cta" className="hover:text-white">
              Get started
            </a>
          </div>
          <button className="rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 px-4 py-2 text-sm font-semibold shadow-lg shadow-blue-500/20">
            Launch App
          </button>
        </Section>
      </nav>

      {/* HERO */}
      <Section className="relative py-20 md:py-28">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-6xl font-bold leading-tight"
            >
              Your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-500 to-indigo-300">
                digital twin
              </span>{" "}
              for personal health.
            </motion.h1>
            <p className="mt-4 text-zinc-300 max-w-xl">
              Upload scans and checkups, visualize a 3D body, simulate what-if
              scenarios, and carry a tap-to-share health pass. Built for
              clarity, privacy, and control.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#preview"
                className="group inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 px-5 py-3 border border-white/10"
              >
                See the demo{" "}
                <ChevronRight
                  className="group-hover:translate-x-0.5 transition"
                  size={16}
                />
              </a>
              <a
                href="#cta"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 px-5 py-3 font-semibold shadow-lg shadow-blue-500/20"
              >
                Get started
              </a>
            </div>
            <div className="mt-6 flex gap-6 text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <Shield size={14} /> HIPAA-aware design
              </div>
              <div className="flex items-center gap-2">
                <Cpu size={14} /> AI what-ifs
              </div>
              <div className="flex items-center gap-2">
                <SmartphoneNfc size={14} /> NFC/QR pass
              </div>
            </div>
          </div>

          {/* 3D Canvas Placeholder */}
          <div className="relative">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-800 p-3 shadow-2xl">
              <div className="aspect-[4/5] rounded-2xl bg-black/50 grid place-items-center text-zinc-400">
                <span className="text-sm">Three.js 3D Avatar Canvas</span>
              </div>
            </div>
            <div className="absolute -inset-6 -z-10 bg-gradient-to-r from-blue-500/20 via-cyan-500/10 to-indigo-400/20 blur-3xl rounded-[2rem]" />
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
              className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/30"
            >
              <div className="mb-3 text-blue-400">{f.icon}</div>
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-zinc-300">{f.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* PREVIEW */}
      <Section id="preview" className="py-16">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-800 p-6 shadow-2xl">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-3">
              <h2 className="text-2xl font-bold">Live dashboard preview</h2>
              <p className="text-zinc-300">
                Timeline, vitals, adherence heatmap, and an AI doctor chat that
                cites your own records.
              </p>
              <ul className="text-sm text-zinc-300 list-disc list-inside">
                <li>Plain-English summaries from uploads</li>
                <li>NFC/QR emergency pass in one tap</li>
                <li>Private-by-default, on your device</li>
              </ul>
              <div className="pt-2 flex gap-3">
                <button className="rounded-xl bg-white/10 px-4 py-2 border border-white/10">
                  Open Dashboard
                </button>
                <button className="rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 px-4 py-2 font-semibold">
                  Try What-If
                </button>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <div className="aspect-video rounded-xl bg-[linear-gradient(120deg,#151a22,#0f141a)] relative overflow-hidden">
                <div className="absolute inset-0 opacity-60 [mask-image:radial-gradient(50%_70%_at_50%_50%,white,transparent)]">
                  <div className="absolute -inset-24 bg-[conic-gradient(from_120deg,rgba(59,130,246,0.25),rgba(14,165,233,0.15),rgba(129,140,248,0.2))] blur-2xl" />
                </div>
                <div className="absolute inset-0 grid place-items-center text-sm text-zinc-400">
                  Embed your dashboard preview here
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* HOW IT WORKS */}
      <Section id="how" className="py-16">
        <h2 className="text-2xl font-bold mb-6">How it works</h2>
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
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-blue-400 to-white/30 leading-none">
                {s.step}
              </div>
              <div className="mt-2 font-semibold">{s.title}</div>
              <p className="text-zinc-300">{s.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section id="cta" className="py-20">
        <div className="relative rounded-3xl overflow-hidden border border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_0%,rgba(59,130,246,0.25),transparent)]" />
          <div className="relative p-10 md:p-14 grid md:grid-cols-[1.2fr_.8fr] gap-8 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold">
                Be part of the human-health evolution
              </h2>
              <p className="mt-2 text-zinc-300">
                Own your data. See it. Understand it. Share it safely.
              </p>
            </div>
            <div className="flex gap-3 md:justify-end">
              <button
                onClick={() => router.push("/profile")}
                className="rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 px-6 py-3 font-semibold shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition"
              >
                Create your Twin
              </button>
              <button className="rounded-xl bg-white/10 px-6 py-3 border border-white/10">
                Learn more
              </button>
            </div>
          </div>
        </div>
      </Section>

      {/* FOOTER */}
      <footer className="py-10 text-center text-xs text-zinc-400">
        © {new Date().getFullYear()} MedTwin. For demo purposes only.
      </footer>
    </div>
  );
}

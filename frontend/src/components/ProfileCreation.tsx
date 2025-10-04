"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Upload, User, HeartPulse, Ruler, FileText, Sparkles } from "lucide-react";

export default function ProfileCreation() {
  const [fileName, setFileName] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setFileName(file.name);
    } else {
      alert("Please upload a valid PDF file.");
      e.target.value = "";
      setFileName("");
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f14] text-zinc-100 relative overflow-hidden">
      {/* Glowing background */}
      <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(70%_70%_at_50%_40%,black,transparent)]">
        <div className="absolute -inset-x-40 -top-40 h-[32rem] bg-gradient-to-r from-blue-500/20 via-red-500/10 to-indigo-600/20 blur-3xl" />
      </div>

      {/* NAV */}
      <nav className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-black/30 bg-black/10 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-red-600 grid place-items-center">
              <Sparkles size={16} />
            </div>
            <span className="font-semibold tracking-wide">MedTwin</span>
          </div>
          <button className="rounded-xl bg-gradient-to-r from-blue-500 to-red-600 px-4 py-2 text-sm font-semibold shadow-lg shadow-red-500/20">
            Home
          </button>
        </div>
      </nav>

      {/* CONTENT */}
      <div className="max-w-4xl mx-auto py-16 px-6 relative z-10">
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-bold text-center mb-10"
        >
          Create Your{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-red-500 to-indigo-300">
            Medical Profile
          </span>
        </motion.h1>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6 rounded-3xl bg-gradient-to-b from-zinc-900/60 to-zinc-800/40 border border-white/10 p-8 shadow-2xl"
        >
          {/* Input fields */}
          <div className="grid md:grid-cols-2 gap-6">
            <FormInput label="Full Name" placeholder="Peter Parker" icon={<User />} />
            <FormInput label="Age" type="number" placeholder="18" icon={<HeartPulse />} />

            {/* Height in ft/in */}
            <div>
              <label className="block text-sm mb-2 text-zinc-400">Height</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  placeholder="5"
                  className="w-1/2 bg-black/30 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none text-zinc-100 placeholder-zinc-500"
                />
                <span className="text-zinc-400">ft</span>
                <input
                  type="number"
                  placeholder="10"
                  className="w-1/2 bg-black/30 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none text-zinc-100 placeholder-zinc-500"
                />
                <span className="text-zinc-400">in</span>
              </div>
            </div>

            {/* Weight in lbs */}
            <FormInput label="Weight (lbs)" type="number" placeholder="150" icon={<Ruler />} />
          </div>

          {/* Gender and Blood Type */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm mb-2 text-zinc-400">Gender</label>
              <select className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <option value="">Select</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-2 text-zinc-400">Blood Type</label>
              <select className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:outline-none">
                <option value="">Select</option>
                <option>A+</option>
                <option>A-</option>
                <option>B+</option>
                <option>B-</option>
                <option>AB+</option>
                <option>AB-</option>
                <option>O+</option>
                <option>O-</option>
              </select>
            </div>
          </div>

          {/* PDF Upload */}
          <div className="pt-4">
            <label className="block text-sm mb-2 text-zinc-400">Upload Medical Records (PDF only)</label>
            <div className="flex items-center justify-between gap-3 bg-black/30 border border-dashed border-blue-500/40 hover:border-red-500/40 rounded-xl px-4 py-6 transition">
              <div className="flex items-center gap-3">
                <FileText className="text-blue-400" />
                <div className="text-sm">
                  {fileName ? (
                    <span className="text-green-400">{fileName}</span>
                  ) : (
                    <span className="text-zinc-400">No file selected</span>
                  )}
                </div>
              </div>
              <label className="relative cursor-pointer bg-gradient-to-r from-blue-500 to-red-600 px-4 py-2 rounded-xl text-sm font-semibold">
                <input
                  type="file"
                  accept="application/pdf"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                />
                <Upload className="inline-block mr-2" size={14} />
                Upload
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-6 text-center">
            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-blue-500 via-red-600 to-cyan-500 px-8 py-3 font-semibold text-white shadow-lg shadow-red-500/30 hover:scale-[1.02] transition"
            >
              Save Profile
            </button>
          </div>
        </motion.form>
      </div>

      {/* FOOTER */}
      <footer className="py-10 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} MedTwin. All rights reserved.
      </footer>
    </div>
  );
}

/* Reusable input component */
const FormInput = ({
  label,
  type = "text",
  placeholder,
  icon,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  icon?: React.ReactNode;
}) => (
  <div>
    <label className="block text-sm mb-2 text-zinc-400">{label}</label>
    <div className="flex items-center bg-black/30 border border-white/10 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 transition">
      <span className="text-blue-400 mr-2">{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full bg-transparent outline-none text-zinc-100 placeholder-zinc-500"
      />
    </div>
  </div>
);

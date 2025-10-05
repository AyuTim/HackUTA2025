"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Upload, User, HeartPulse, Ruler, FileText, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from '@auth0/nextjs-auth0/client';
import AuthButton from "./AuthButton";

export default function ProfileCreation() {
  const [fileName, setFileName] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const [heightFeet, setHeightFeet] = useState<string>("");
  const [heightInches, setHeightInches] = useState<string>("");
  const [weight, setWeight] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [bloodType, setBloodType] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const router = useRouter();
  const { user, isLoading } = useUser();

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

  // Load existing profile data when component mounts
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const result = await response.json();
          if (result.data) {
            setFullName(result.data.full_name || "");
            setAge(result.data.age?.toString() || "");
            setHeightFeet(result.data.height_feet?.toString() || "");
            setHeightInches(result.data.height_inches?.toString() || "");
            setWeight(result.data.weight?.toString() || "");
            setGender(result.data.gender || "");
            setBloodType(result.data.blood_type || "");
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    loadProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName,
          age,
          heightFeet,
          heightInches,
          weight,
          gender,
          bloodType,
          medicalRecordFile: fileName // Note: actual file upload would need additional handling
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitMessage({ type: 'success', text: 'Profile saved successfully!' });
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        setSubmitMessage({ 
          type: 'error', 
          text: result.error || 'Failed to save profile. Please try again.' 
        });
      }
    } catch (error) {
      console.error('Error submitting profile:', error);
      setSubmitMessage({ 
        type: 'error', 
        text: 'An error occurred. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Glowing background */}
      <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(60%_60%_at_50%_40%,black,transparent)]">
        <div className="absolute -inset-x-40 -top-40 h-[32rem] bg-gradient-to-r from-blue-600/15 via-red-600/10 to-blue-600/15 blur-3xl" />
      </div>

      {/* NAV */}
      <nav className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-black/50 bg-black/30 border-b border-red-500/20">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-red-600 grid place-items-center shadow-lg shadow-blue-600/30 spider-pulse">
              <Sparkles size={16} className="text-white spider-glow" />
            </div>
            <span className="font-bold tracking-wide text-lg spider-text-glow">MedTwin</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="rounded-xl bg-gradient-to-r from-blue-900 to-red-900 px-4 py-2 text-sm font-semibold shadow-lg shadow-blue-600/30 hover:shadow-red-600/30 transition-all duration-300 hover:scale-105 spider-pulse"
            >
              Home
            </button>
            <AuthButton />
          </div>
        </div>
      </nav>

      {/* CONTENT */}
      <div className="max-w-4xl mx-auto py-16 px-6 relative z-10">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-300">Loading...</p>
            </div>
          </div>
        ) : !user ? (
          <div className="text-center min-h-[400px] flex items-center justify-center">
            <div className="max-w-md">
              <h1 className="text-3xl font-bold mb-4 spider-text-glow">
                Authentication Required
              </h1>
              <p className="text-gray-300 mb-6">
                Please log in to create your medical profile and access your digital health twin.
              </p>
              <AuthButton />
            </div>
          </div>
        ) : (
          <>
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl font-bold text-center mb-10"
            >
              Create Your{" "}
              <span className="spider-gradient-text">
                Medical Profile
              </span>
            </motion.h1>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          onSubmit={handleSubmit}
          className="space-y-6 rounded-3xl bg-gradient-to-b from-gray-900 to-black border border-blue-600/30 p-8 shadow-2xl shadow-blue-600/20 spider-float"
        >
          {/* Submit message */}
          {submitMessage && (
            <div className={`p-4 rounded-xl border ${
              submitMessage.type === 'success' 
                ? 'bg-green-900/30 border-green-500/50 text-green-300' 
                : 'bg-red-900/30 border-red-500/50 text-red-300'
            }`}>
              {submitMessage.text}
            </div>
          )}

          {/* Input fields */}
          <div className="grid md:grid-cols-2 gap-6">
            <FormInput 
              label="Full Name" 
              placeholder="Peter Parker" 
              icon={<User />} 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <FormInput 
              label="Age" 
              type="number" 
              placeholder="18" 
              icon={<HeartPulse />} 
              value={age}
              onChange={(e) => setAge(e.target.value)}
              required
            />

            {/* Height in ft/in */}
            <div>
              <label className="block text-sm mb-2 text-gray-400">Height</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  placeholder="5"
                  value={heightFeet}
                  onChange={(e) => setHeightFeet(e.target.value)}
                  className="w-1/2 bg-black/50 border border-blue-600/20 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 focus:outline-none text-white placeholder-gray-500 transition-all duration-300"
                />
                <span className="text-gray-400">ft</span>
                <input
                  type="number"
                  placeholder="10"
                  value={heightInches}
                  onChange={(e) => setHeightInches(e.target.value)}
                  className="w-1/2 bg-black/50 border border-blue-600/20 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 focus:outline-none text-white placeholder-gray-500 transition-all duration-300"
                />
                <span className="text-gray-400">in</span>
              </div>
            </div>

            {/* Weight in lbs */}
            <FormInput 
              label="Weight (lbs)" 
              type="number" 
              placeholder="150" 
              icon={<Ruler />} 
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>

          {/* Gender and Blood Type */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm mb-2 text-gray-400">Gender</label>
              <select 
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-black/50 border border-blue-600/20 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 focus:outline-none text-white transition-all duration-300"
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-2 text-gray-400">Blood Type</label>
              <select 
                value={bloodType}
                onChange={(e) => setBloodType(e.target.value)}
                className="w-full bg-black/50 border border-red-600/20 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500/50 focus:outline-none text-white transition-all duration-300"
              >
                <option value="">Select</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>

          {/* PDF Upload */}
          <div className="pt-4">
            <label className="block text-sm mb-2 text-gray-400">Upload Medical Records (PDF only)</label>
            <div className="flex items-center justify-between gap-3 bg-black/50 border border-dashed border-blue-600/30 hover:border-red-600/40 rounded-xl px-4 py-6 transition-all duration-300 web-sway">
              <div className="flex items-center gap-3">
                <FileText className="text-blue-400 spider-glow" />
                <div className="text-sm">
                  {fileName ? (
                    <span className="text-green-400">{fileName}</span>
                  ) : (
                    <span className="text-gray-400">No file selected</span>
                  )}
                </div>
              </div>
              <label className="relative cursor-pointer bg-gradient-to-r from-blue-900 to-red-900 px-4 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/30 hover:shadow-red-600/30 transition-all duration-300 hover:scale-105 spider-pulse">
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
              disabled={isSubmitting}
              className="rounded-xl bg-gradient-to-r from-blue-900 to-red-900 px-8 py-3 font-semibold text-white shadow-lg shadow-blue-600/40 hover:shadow-red-600/40 transition-all duration-300 hover:scale-105 spider-pulse disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSubmitting ? 'Saving...' : 'Save Profile'}
            </button>
          </div>

          <div className="pt-4 text-center">
            <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="rounded-xl bg-gradient-to-r from-red-600 to-blue-500 px-8 py-3 font-semibold text-white shadow-lg shadow-red-500/30 hover:scale-[1.02] transition"
            >
                Go to Dashboard
            </button>
            </div>

        </motion.form>
          </>
        )}
      </div>

      {/* FOOTER */}
      <footer className="py-10 text-center text-xs text-gray-500 border-t border-blue-600/20">
        © {new Date().getFullYear()} MedTwin. For demo purposes only.
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
  value,
  onChange,
  required = false,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  icon?: React.ReactNode;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}) => (
  <div>
    <label className="block text-sm mb-2 text-gray-400">{label}</label>
    <div className="flex items-center bg-black/50 border border-blue-600/20 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500/50 transition-all duration-300">
      <span className="text-blue-400 spider-glow mr-2">{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full bg-transparent outline-none text-white placeholder-gray-500"
      />
    </div>
  </div>
);

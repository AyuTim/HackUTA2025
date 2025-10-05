"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  User,
  HeartPulse,
  Ruler,
  FileText,
  Sparkles,
  Activity,
  Droplet,
  Loader2,
  Eye,
  EyeOff,
  FolderOpen,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0/client";
import AuthButton from "./AuthButton";
import { supabase } from "@/lib/supabase";

/* ================================
   Body-part mapping
================================== */
type BodyCat =
  | "head"
  | "hair"
  | "stomach"
  | "legs"
  | "feet"
  | "arms"
  | "unknown";

const PART_MAP: Record<string, Exclude<BodyCat, "unknown">> = {
  brain: "head",
  neuro: "head",
  head: "head",
  scalp: "hair",
  hair: "hair",
  stomach: "stomach",
  abdomen: "stomach",
  abdominal: "stomach",
  liver: "stomach",
  pancreas: "stomach",
  kidney: "stomach",
  kidneys: "stomach",
  renal: "stomach",
  spleen: "stomach",
  intestine: "stomach",
  intestines: "stomach",
  bowel: "stomach",
  bladder: "stomach",
  gastro: "stomach",
  leg: "legs",
  legs: "legs",
  knee: "legs",
  thigh: "legs",
  femur: "legs",
  tibia: "legs",
  foot: "feet",
  feet: "feet",
  ankle: "feet",
  toe: "feet",
  toes: "feet",
  calcaneus: "feet",
  arm: "arms",
  arms: "arms",
  shoulder: "arms",
  elbow: "arms",
  wrist: "arms",
  hand: "arms",
  humerus: "arms",
  radius: "arms",
  ulna: "arms",
};

function toBodyCategory(raw?: string | null): BodyCat {
  const t = (raw || "").toLowerCase();
  for (const key of Object.keys(PART_MAP)) {
    if (t.includes(key)) return PART_MAP[key];
  }
  return "unknown";
}

function extractBodyPartCategoriesFromAnalyze(json: any): string {
  const data = json?.data ?? json;
  const findings = Array.isArray(data?.findings) ? data.findings : [];
  const cats = new Set<string>();
  for (const f of findings) {
    const src = f?.bodyPart || f?.region || "";
    cats.add(toBodyCategory(src));
  }
  if (cats.size === 0) return "unknown";
  return Array.from(cats).join(",");
}

/* ================================
   Types
================================== */
type AnalysisItem = {
  file: string;
  result?: any;
  error?: string;
};

/* ================================
   Component
================================== */
export default function ProfileCreation() {
  // profile fields
  const [fileName, setFileName] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fullName, setFullName] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const [heightFeet, setHeightFeet] = useState<string>("");
  const [heightInches, setHeightInches] = useState<string>("");
  const [weight, setWeight] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [bloodType, setBloodType] = useState<string>("");

  // submission + notifications
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitMessage, setSubmitMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // analyze UI state
  const [fileNamesSelected, setFileNamesSelected] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [analyses, setAnalyses] = useState<AnalysisItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [showJson, setShowJson] = useState<boolean>(false);

  const router = useRouter();
  const { user, isLoading } = useUser();
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

  // Load existing profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      try {
        const response = await fetch("/api/profile");
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
        console.error("Error loading profile:", error);
      }
    };
    loadProfile();
  }, [user]);

  // Multi-file upload + sequential analysis
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAnalyses([]);
    setIsAnalyzing(false);

    if (files.length === 0) {
      setFileNamesSelected([]);
      setSelectedFile(null);
      return;
    }

    const pdfs = files.filter(
      (f) =>
        f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );
    const nonPdfs = files.filter(
      (f) =>
        !(f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"))
    );

    if (nonPdfs.length > 0) {
      alert(
        `Some files were ignored because they are not PDFs:\n- ${nonPdfs
          .map((f) => f.name)
          .join("\n- ")}`
      );
    }
    if (pdfs.length === 0) {
      e.target.value = "";
      setFileNamesSelected([]);
      setSelectedFile(null);
      return;
    }

    // keep the first file for Storage upload on submit
    setSelectedFile(pdfs[0]);
    setFileNamesSelected(pdfs.map((f) => f.name));
    setIsAnalyzing(true);

    const results: AnalysisItem[] = [];
    for (const file of pdfs) {
      try {
        const formData = new FormData();
        formData.append("pdf", file);
        formData.append("mode", "json");

        const resp = await fetch(`${API_BASE}/api/pdf/analyze`, {
          method: "POST",
          body: formData,
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          const detail =
            err?.detail || `Upload/analysis failed (${resp.status})`;
          results.push({ file: file.name, error: detail });
        } else {
          const json = await resp.json();
          console.log(`Gemini JSON for ${file.name}:`, json);
          results.push({ file: file.name, result: json });

          // Insert row into Supabase (documents)
          const extractedPayload = json;
          const docType = "Medical Report";
          const pathGuess = `uploads/${file.name}`;
          const bodyPartCsv = extractBodyPartCategoriesFromAnalyze(json);

          if (supabase) {
            const { error } = await supabase.from("documents").insert([
              {
                file_name: file.name,
                file_path: pathGuess,
                document_type: docType,
                extracted_text: JSON.stringify(extractedPayload),
                body_part: bodyPartCsv,
              },
            ]);
            if (error) {
              console.error("Error saving to Supabase:", error);
              alert(`Database save failed for ${file.name}: ${error.message}`);
            } else {
              alert(`✅ ${file.name} saved to database successfully!`);
              setUploadedFiles((prev) =>
                Array.from(new Set([...prev, file.name]))
              );
            }
          } else {
            console.warn("Supabase env missing; skipping DB insert.");
            setUploadedFiles((prev) =>
              Array.from(new Set([...prev, file.name]))
            );
          }

          setFileName(file.name);
        }
      } catch (err: any) {
        console.error(err);
        results.push({
          file: file.name,
          error: err?.message || "Failed to analyze PDF",
        });
      }

      setAnalyses([...results]);
    }

    setIsAnalyzing(false);
  };

  // Submit profile (optionally upload first-selected PDF to Supabase Storage)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      let medicalRecordUrl: string | null = null;
      let medicalRecordFilename: string | null = null;

      if (selectedFile && user && supabase) {
        const fileExt = selectedFile.name.split(".").pop();
        const uniqueBase = `${(user as any)?.sub || "anon"}_${Date.now()}`;
        const filePath = `medical-records/${uniqueBase}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("medical-documents")
          .upload(filePath, selectedFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error("File upload error:", uploadError);
          setSubmitMessage({
            type: "error",
            text: "Failed to upload medical document. Please try again.",
          });
          setIsSubmitting(false);
          return;
        }

        const { data: urlData } = supabase.storage
          .from("medical-documents")
          .getPublicUrl(filePath);
        medicalRecordUrl = urlData.publicUrl;
        medicalRecordFilename = selectedFile.name;
      }

      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          age,
          heightFeet,
          heightInches,
          weight,
          gender,
          bloodType,
          medicalRecordUrl,
          medicalRecordFilename,
          medicalRecordFile: fileName,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitMessage({
          type: "success",
          text: "Profile saved successfully!",
        });
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } else {
        setSubmitMessage({
          type: "error",
          text: result.error || "Failed to save profile. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error submitting profile:", error);
      setSubmitMessage({
        type: "error",
        text: "An error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated glowing background */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute inset-x-0 top-0 h-[40rem] bg-gradient-to-br from-blue-900/30 via-purple-900/15 to-red-900/30 blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute inset-x-0 bottom-0 h-[40rem] bg-gradient-to-tr from-red-900/30 via-pink-900/15 to-blue-900/30 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
      </div>

      {/* NAV */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl supports-[backdrop-filter]:bg-black/60 bg-black/40 border-b border-blue-900/30">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-900 to-red-900 grid place-items-center shadow-lg shadow-blue-900/50"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Sparkles size={16} className="text-white" />
            </motion.div>
            <span className="font-bold tracking-wide text-lg bg-gradient-to-r from-blue-400 to-red-400 bg-clip-text text-transparent">
              Nomi.ai
            </span>
          </motion.div>
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.button
              onClick={() => router.push("/")}
              className="rounded-xl bg-gradient-to-r from-blue-900 to-red-900 hover:from-blue-800 hover:to-red-800 border border-blue-900/50 px-4 py-2 text-sm font-semibold backdrop-blur-sm transition-all duration-300"
              whileHover={{
                scale: 1.05,
                boxShadow: "0 0 20px rgba(30, 58, 138, 0.5)",
              }}
              whileTap={{ scale: 0.95 }}
            >
              Home
            </motion.button>
            <AuthButton />
          </motion.div>
        </div>
      </nav>

      {/* CONTENT */}
      <div className="max-w-5xl mx-auto py-16 px-6 relative z-10">
        {isLoading ? (
          <motion.div
            className="flex items-center justify-center min-h-[400px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-center">
              <motion.div
                className="w-16 h-16 border-4 border-blue-500 border-t-red-500 rounded-full mx-auto mb-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <p className="text-gray-300">Loading...</p>
            </div>
          </motion.div>
        ) : !user ? (
          <motion.div
            className="text-center min-h-[400px] flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="max-w-md">
              <motion.div
                className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-900 to-red-900 mx-auto mb-6 grid place-items-center"
                animate={{
                  boxShadow: [
                    "0 0 20px rgba(30, 58, 138, 0.5)",
                    "0 0 40px rgba(127, 29, 29, 0.5)",
                    "0 0 20px rgba(30, 58, 138, 0.5)",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <User size={32} className="text-white" />
              </motion.div>
              <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-red-400 bg-clip-text text-transparent">
                Authentication Required
              </h1>
              <p className="text-gray-300 mb-6">
                Please log in to create your medical profile and access your
                digital health twin.
              </p>
              <AuthButton />
            </div>
          </motion.div>
        ) : (
          <>
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-5xl font-bold text-center mb-12"
            >
              Create Your{" "}
              <motion.span
                className="bg-gradient-to-r from-blue-400 via-purple-400 to-red-400 bg-clip-text text-transparent"
                animate={{ backgroundPosition: ["0%", "100%", "0%"] }}
                transition={{ duration: 5, repeat: Infinity }}
              >
                Medical Profile
              </motion.span>
            </motion.h1>

            <motion.form
              onSubmit={handleSubmit}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-8 rounded-3xl bg-gradient-to-b from-gray-900/80 to-black/80 backdrop-blur-xl border border-blue-900/30 p-10 shadow-2xl shadow-blue-900/20 relative overflow-hidden"
            >
              {/* 🔧 Fix: this overlay now ignores pointer events so inputs remain clickable/typable */}
              <motion.div
                className="absolute inset-0 rounded-3xl pointer-events-none"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(30, 58, 138, 0.15), rgba(127, 29, 29, 0.15), rgba(30, 58, 138, 0.15))",
                  backgroundSize: "200% 100%",
                }}
                animate={{ backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />

              <AnimatePresence>
                {submitMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
                    className={`p-5 rounded-2xl border backdrop-blur-sm ${
                      submitMessage.type === "success"
                        ? "bg-emerald-900/30 border-emerald-500/50 text-emerald-300 shadow-lg shadow-emerald-500/20"
                        : "bg-red-900/30 border-red-500/50 text-red-300 shadow-lg shadow-red-500/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{
                          rotate:
                            submitMessage.type === "success" ? [0, 360] : 0,
                        }}
                        transition={{ duration: 0.5 }}
                      >
                        {submitMessage.type === "success" ? "✓" : "✗"}
                      </motion.div>
                      {submitMessage.text}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input fields */}
              <motion.div
                variants={itemVariants}
                className="grid md:grid-cols-2 gap-6"
              >
                <EnhancedFormInput
                  label="Full Name"
                  placeholder="Enter your name"
                  icon={<User className="text-blue-400" />}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
                <EnhancedFormInput
                  label="Age"
                  type="number"
                  placeholder="Enter your age"
                  icon={<Activity className="text-red-400" />}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                />
              </motion.div>

              {/* Height and Weight */}
              <motion.div
                variants={itemVariants}
                className="grid md:grid-cols-2 gap-6"
              >
                <div>
                  <label className="block text-sm mb-3 text-gray-300 font-medium flex items-center gap-2">
                    <Ruler className="text-blue-400" size={16} />
                    Height
                  </label>
                  <div className="flex items-center gap-3">
                    <motion.input
                      type="number"
                      placeholder="5"
                      value={heightFeet}
                      onChange={(e) => setHeightFeet(e.target.value)}
                      className="w-1/2 bg-black/50 border border-blue-900/30 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-900 focus:border-blue-900/50 focus:outline-none text-white placeholder-gray-500 transition-all duration-300 hover:border-blue-900/50"
                      whileFocus={{ scale: 1.02 }}
                    />
                    <span className="text-gray-400 font-medium">ft</span>
                    <motion.input
                      type="number"
                      placeholder="10"
                      value={heightInches}
                      onChange={(e) => setHeightInches(e.target.value)}
                      className="w-1/2 bg-black/50 border border-blue-900/30 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-900 focus:border-blue-900/50 focus:outline-none text-white placeholder-gray-500 transition-all duration-300 hover:border-blue-900/50"
                      whileFocus={{ scale: 1.02 }}
                    />
                    <span className="text-gray-400 font-medium">in</span>
                  </div>
                </div>

                <EnhancedFormInput
                  label="Weight (lbs)"
                  type="number"
                  placeholder="Enter weight"
                  icon={<HeartPulse className="text-red-400" />}
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </motion.div>

              {/* Gender and Blood Type */}
              <motion.div
                variants={itemVariants}
                className="grid md:grid-cols-2 gap-6"
              >
                <div>
                  <label className="block text-sm mb-3 text-gray-300 font-medium flex items-center gap-2">
                    <User className="text-purple-400" size={16} />
                    Gender
                  </label>
                  <motion.select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-black/50 border border-blue-900/30 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-900 focus:border-blue-900/50 focus:outline-none text-white transition-all duration-300 hover:border-blue-900/50 cursor-pointer"
                    whileFocus={{ scale: 1.02 }}
                  >
                    <option value="" className="bg-gray-900">
                      Select Gender
                    </option>
                    <option value="Male" className="bg-gray-900">
                      Male
                    </option>
                    <option value="Female" className="bg-gray-900">
                      Female
                    </option>
                    <option value="Other" className="bg-gray-900">
                      Other
                    </option>
                  </motion.select>
                </div>
                <div>
                  <label className="block text-sm mb-3 text-gray-300 font-medium flex items-center gap-2">
                    <Droplet className="text-red-400" size={16} />
                    Blood Type
                  </label>
                  <motion.select
                    value={bloodType}
                    onChange={(e) => setBloodType(e.target.value)}
                    className="w-full bg-black/50 border border-red-900/30 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-900 focus:border-red-900/50 focus:outline-none text-white transition-all duration-300 hover:border-red-900/50 cursor-pointer"
                    whileFocus={{ scale: 1.02 }}
                  >
                    <option value="" className="bg-gray-900">
                      Select Blood Type
                    </option>
                    <option value="A+" className="bg-gray-900">
                      A+
                    </option>
                    <option value="A-" className="bg-gray-900">
                      A-
                    </option>
                    <option value="B+" className="bg-gray-900">
                      B+
                    </option>
                    <option value="B-" className="bg-gray-900">
                      B-
                    </option>
                    <option value="AB+" className="bg-gray-900">
                      AB+
                    </option>
                    <option value="AB-" className="bg-gray-900">
                      AB-
                    </option>
                    <option value="O+" className="bg-gray-900">
                      O+
                    </option>
                    <option value="O-" className="bg-gray-900">
                      O-
                    </option>
                  </motion.select>
                </div>
              </motion.div>

              {/* PDF Upload (multi) + controls */}
              <motion.div variants={itemVariants} className="pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm mb-3 text-gray-300 font-medium flex items-center gap-2">
                    <FileText className="text-blue-400" size={16} />
                    Upload Medical Records (PDF only)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowJson((s) => !s)}
                    className="inline-flex items-center gap-2 rounded-lg border border-blue-900/40 bg-black/40 px-3 py-1.5 text-xs text-gray-200 hover:bg-black/60 transition"
                  >
                    {showJson ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    {showJson ? "Hide JSON" : "Show JSON"}
                  </button>
                </div>

                <motion.div
                  className="flex items-center justify-between gap-4 bg-black/50 border border-dashed border-blue-900/40 hover:border-red-900/50 rounded-2xl px-6 py-8 transition-all duration-300 group relative overflow-hidden"
                  whileHover={{
                    scale: 1.01,
                    borderColor: "rgba(127, 29, 29, 0.5)",
                  }}
                >
                  <motion.div className="absolute inset-0 bg-gradient-to-r from-blue-900/10 to-red-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="flex items-center gap-4 relative z-10">
                    <motion.div
                      className="p-3 rounded-xl bg-gradient-to-br from-blue-900/30 to-red-900/30"
                      whileHover={{ rotate: 5 }}
                    >
                      <FileText className="text-blue-400" size={24} />
                    </motion.div>
                    <div className="text-sm">
                      {fileNamesSelected.length > 0 ? (
                        <motion.span
                          className="text-emerald-400 font-medium"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                        >
                          ✓ {fileNamesSelected.length} file
                          {fileNamesSelected.length > 1 ? "s" : ""} selected
                        </motion.span>
                      ) : (
                        <span className="text-gray-400">No files selected</span>
                      )}
                    </div>
                  </div>
                  <motion.label
                    className="relative cursor-pointer bg-gradient-to-r from-blue-900 to-red-900 px-6 py-3 rounded-xl text-sm font-semibold shadow-lg hover:shadow-blue-900/50 transition-all duration-300 z-10"
                    whileHover={{
                      scale: 1.05,
                      boxShadow: "0 0 30px rgba(30, 58, 138, 0.6)",
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <input
                      type="file"
                      accept="application/pdf"
                      multiple
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleFileChange}
                    />
                    <Upload className="inline-block mr-2" size={16} />
                    Upload
                  </motion.label>
                </motion.div>

                {/* Previously Uploaded Files (this session) */}
                <div className="rounded-xl border border-blue-900/30 bg-black/50 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-blue-300" />
                    <h4 className="font-semibold text-sm">
                      Previously Uploaded Files
                    </h4>
                  </div>
                  {uploadedFiles.length > 0 ? (
                    <ul className="text-xs text-gray-300 grid sm:grid-cols-2 gap-y-1 gap-x-4">
                      {uploadedFiles.map((f) => (
                        <li key={f} className="truncate">
                          • {f}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-400">
                      No files on record yet.
                    </p>
                  )}
                </div>

                {/* Analyzing indicator */}
                {isAnalyzing && (
                  <div className="mt-2 flex items-center gap-2 text-blue-300">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>
                      Analyzing {fileNamesSelected.length} PDF
                      {fileNamesSelected.length > 1 ? "s" : ""}…
                    </span>
                  </div>
                )}

                {/* Per-file results (toggle) */}
                {showJson && analyses.length > 0 && (
                  <div className="mt-4 space-y-4">
                    {analyses.map((a) => (
                      <div
                        key={a.file}
                        className="rounded-xl border border-blue-900/30 bg-black/50 p-4"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <h4 className="font-semibold text-sm">{a.file}</h4>
                          {a.error ? (
                            <span className="text-red-300 text-xs">Error</span>
                          ) : (
                            <span className="text-green-300 text-xs">
                              Analyzed
                            </span>
                          )}
                        </div>
                        {a.error ? (
                          <div className="text-red-300 text-sm">{a.error}</div>
                        ) : (
                          <pre className="text-xs bg-black/40 border border-blue-900/30 rounded-lg p-3 overflow-auto">
                            {JSON.stringify(a.result, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Submit */}
              <motion.div variants={itemVariants} className="pt-8 text-center">
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className="relative group px-12 py-4 rounded-2xl bg-gradient-to-r from-blue-900 to-red-900 font-bold text-lg text-white shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                  whileHover={{
                    scale: isSubmitting ? 1 : 1.05,
                    boxShadow: "0 0 40px rgba(30, 58, 138, 0.8)",
                  }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
                >
                  <motion.div className="absolute inset-0 bg-gradient-to-r from-red-900 to-blue-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isSubmitting ? (
                      <>
                        <motion.div
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Sparkles size={20} />
                        Save Profile
                      </>
                    )}
                  </span>
                </motion.button>
              </motion.div>
            </motion.form>
          </>
        )}
      </div>

      {/* FOOTER */}
      <motion.footer
        className="py-12 text-center text-xs text-gray-500 border-t border-blue-900/20 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles size={12} className="text-blue-400" />
          </motion.div>
          <span>
            © {new Date().getFullYear()} Nomi.ai. For demo purposes only.
          </span>
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

/* Enhanced reusable input component */
const EnhancedFormInput = ({
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
    <label className="block text-sm mb-3 text-gray-300 font-medium flex items-center gap-2">
      {icon}
      {label}
    </label>
    <motion.div
      className="flex items-center bg-black/50 border border-blue-900/30 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-900 focus-within:border-blue-900/50 transition-all duration-300 hover:border-blue-900/50 group"
      whileFocus={{ scale: 1.02 }}
    >
      <motion.input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full bg-transparent outline-none text-white placeholder-gray-500"
      />
    </motion.div>
  </div>
);

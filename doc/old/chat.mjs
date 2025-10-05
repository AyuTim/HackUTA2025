// chat.mjs — Doc's Reasoning Layer (friendly + succinct, with fallback)
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

const genAI = new GoogleGenerativeAI(process.dotenv.GEMINI_API_KEY);

// default fast model; we'll auto-fallback to Pro if needed
const FAST_MODEL = "gemini-2.5-flash";
const DEEP_MODEL = "gemini-2.5-pro";
const DEBUG = process.dotenv.DOC_DEBUG === "1";

// --- Load patient history ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// make sure this matches your actual filename
const filePath = path.join(__dirname, "mock_patient_soumika.json");
const patientContext = JSON.parse(fs.readFileSync(filePath, "utf-8"));

// --- Helper: summarize key facts for context ---
function formatFacts(ctx) {
  const parts = [];
  parts.push(`User: ${ctx.user.name}, DOB: ${ctx.user.dob}`);
  if (ctx.conditions?.length) parts.push(`Conditions: ${ctx.conditions.map(c => c.label).join(", ")}`);
  if (ctx.medications?.length) parts.push(`Medications: ${ctx.medications.map(m => m.name).join(", ")}`);
  if (ctx.symptoms?.length) {
    parts.push(
      `Symptoms: ${ctx.symptoms
        .map(s => `${s.label} (${s.body_region}, sev ${s.severity}${s.onset_date ? `, since ${s.onset_date}` : ""})`)
        .join("; ")}`
    );
  }
  parts.push(`Metrics window: ${ctx.metrics_window_days} days`);
  return parts.join("\n");
}

function buildPrompt(question, ctx) {
  const facts = formatFacts(ctx);
  return `
You are Doc, a warm, friendly, succinct AI health companion for ${ctx.user.name}.
Use ONLY the structured facts below. If something is unknown, say so.
Tone: empathetic, helpful, conversational, concise.

STRUCTURED_FACTS:
${facts}

QUESTION:
${question}

OUTPUT:
- One short friendly intro line (≤10 words).
- Then 2–3 bullets, one sentence each, practical actions or explanations.
- Finish with: "Why this fits your data: ..." (≤15 words).
- If you cite a file/entity, include exactly one like (From: GI_Clinic_Note_2025-09-20.pdf).
- Max 90 words total.
`.trim();
}

// --- Utilities ---
function stripFences(s) {
  return (s || "")
    .replace(/```(?:json)?\s*([\s\S]*?)```/gi, "$1")
    .trim();
}

function extractTextFromCandidates(resp) {
  try {
    const cands = resp?.response?.candidates || [];
    for (const c of cands) {
      const parts = c?.content?.parts || [];
      for (const p of parts) {
        if (p?.text && p.text.trim()) return p.text.trim();
      }
    }
  } catch {}
  return "";
}

function explainSafety(resp) {
  try {
    const c = resp?.response?.candidates?.[0];
    const b = c?.safetyRatings || c?.finishReason;
    return b ? JSON.stringify(b) : "";
  } catch {}
  return "";
}

// Core ask with multi-path fallback + debug
async function askWithModel(modelId, prompt, mime = "text/plain") {
  const model = genAI.getGenerativeModel({ model: modelId });
  const res = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.25, maxOutputTokens: 256, responseMimeType: mime }
  });

  let out = stripFences(res.response.text());
  if (!out) out = stripFences(extractTextFromCandidates(res));
  if (!out && DEBUG) {
    console.error(`\n[Doc Debug] Empty text from ${modelId}. Safety/finish info: ${explainSafety(res)}\n`);
  }
  return out;
}

export async function askDocWithContext(question, contextObj) {
  const prompt = buildPrompt(question, contextObj);

  // 1) fast model
  let out = await askWithModel(FAST_MODEL, prompt, "text/plain");
  if (out) return out;

  // 2) fallback to deep
  out = await askWithModel(DEEP_MODEL, prompt, "text/plain");
  if (out) return out;

  // 3) last-resort minimal prompt (very safe & short)
  const minimal = `Answer briefly (≤70 words), friendly tone:
Facts:
${formatFacts(contextObj)}
Question:
${question}`;
  out = await askWithModel(DEEP_MODEL, minimal, "text/plain");
  if (out) return out;

  // 4) guarantee something visible
  return "I’m not confident enough to answer that safely with the info I have. Try rephrasing or asking a simpler question.";
}

// Manual test
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const question = process.argv.slice(2).join(" ") || "Why am I getting stomach pain again?";
  console.log(`🩺 Question: ${question}\n`);
  const answer = await askDocWithContext(question, patientContext);
  console.log("💬 Doc says:\n" + answer + "\n");
}

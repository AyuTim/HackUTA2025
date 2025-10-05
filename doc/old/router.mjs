// router.mjs — Doc's Understanding Layer (intent router)
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import "dotenv/config";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL_ID = "gemini-2.5-flash";

// ---- Schemas ----
const AddSymptomSchema = z.object({
  label: z.string().min(1),
  severity: z.number().min(0).max(10),
  onset_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  body_region: z.string().min(1),
  notes: z.string().optional(),
});

const LogBehaviorSchema = z.object({
  metric: z.string().min(1),
  value: z.union([z.number(), z.string()]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const RoutedSchema = z.object({
  intent: z.enum(["add_symptom", "question", "log_behavior", "smalltalk"]),
  parsed: z.union([AddSymptomSchema, LogBehaviorSchema, z.record(z.any())]).optional(),
});

// ---- Helpers ----
const REGION_SYNONYMS = {
  stomach: "abdomen",
  tummy: "abdomen",
  belly: "abdomen",
  knee: "left_knee",
  wrist: "left_wrist",
  back: "spine",
  head: "head",
  pelvis: "pelvis",
  abdomen: "abdomen",
};

function normalizeRegion(region) {
  const key = String(region || "").toLowerCase().trim();
  return REGION_SYNONYMS[key] ?? key.replace(/\s+/g, "_");
}

// A tiny JSON “repair” helper: extract first {...} block and try parse
function tryRepairJson(raw) {
  // remove code fences if any
  const unfenced = raw.replace(/```json\s*([\s\S]*?)```/gi, "$1").replace(/```([\s\S]*?)```/g, "$1");
  // find first JSON object
  const m = unfenced.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]);
  } catch {
    return null;
  }
}

// ---- Router system prompt (few-shot + strict shape) ----
const SYSTEM_INSTRUCTIONS = `
You are an intent router for a personal health companion named Doc.

Return ONLY valid JSON with this EXACT shape:
{
  "intent": "add_symptom" | "question" | "log_behavior" | "smalltalk",
  "parsed"?: object
}

Rules:
- "add_symptom" when the user reports a feeling/pain/discomfort.
  parsed must include:
  { "label": string, "severity": 0-10, "onset_date": "YYYY-MM-DD", "body_region": string, "notes"?: string }
- If onset is vague ("today", "yesterday", "since Wednesday"), convert it to ISO date using "Today".
- Use concise anatomical regions only: abdomen, left_knee, left_wrist, spine, pelvis, head.
- "log_behavior" for metrics (water_oz, sleep_min, steps, exercise_min, protein_g, etc.):
  parsed must include:
  { "metric": string, "value": number|string, "date"?: "YYYY-MM-DD" }
- "question" when the user asks for guidance/explanations.
- Otherwise "smalltalk".

Return JSON ONLY. No prose. No explanations.

Examples (do not copy text, just follow format):
User: "my stomach has been hurting today"
→ { "intent": "add_symptom",
     "parsed": { "label": "stomach pain", "severity": 5, "onset_date": "YYYY-MM-DD", "body_region": "abdomen" } }

User: "i drank 70 oz of water"
→ { "intent": "log_behavior", "parsed": { "metric": "water_oz", "value": 70 } }

User: "why does my knee still hurt?"
→ { "intent": "question" }
`.trim();

// ---- Core ----
export async function routeIntent(text, isoToday) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing. Add it to your .env");
  }

  const model = genAI.getGenerativeModel({ model: MODEL_ID });
  const today = isoToday ?? new Date().toISOString().slice(0, 10);

  const userPrompt = [
    SYSTEM_INSTRUCTIONS,
    `Today: ${today}`,
    `User: ${text}`,
    `Return JSON only.`,
  ].join("\n");

  const DEBUG = process.env.DOC_DEBUG === "1";

  // 1) Ask for JSON only (no responseSchema; just MIME forcing)
  const res = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
      maxOutputTokens: 256,
    },
  });

  let raw = (res.response.text() || "").trim();
  if (DEBUG) console.error("\n[Router Raw 1]\n" + raw + "\n");

  // 2) Parse → if fail, try repair → if still fail, one strict retry
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = tryRepairJson(raw);
  }

  if (!parsed) {
    const retryPrompt = [
      SYSTEM_INSTRUCTIONS,
      `Today: ${today}`,
      `User: ${text}`,
      `Return ONLY a single JSON object. If unsure, return {"intent":"smalltalk"}.`,
    ].join("\n");

    const res2 = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: retryPrompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.0,
        maxOutputTokens: 192,
      },
    });

    raw = (res2.response.text() || "").trim();
    if (DEBUG) console.error("\n[Router Raw 2]\n" + raw + "\n");

    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = tryRepairJson(raw);
    }
  }

  if (!parsed) return { intent: "smalltalk" };

  // 3) Validate
  const safe = RoutedSchema.safeParse(parsed);
  if (!safe.success) {
    if (DEBUG) console.error("[Router] Zod validation failed:", safe.error?.errors ?? safe.error);
    return { intent: "smalltalk" };
  }

  // 4) Normalize + harden
  if (safe.data.intent === "add_symptom" && safe.data.parsed?.body_region) {
    safe.data.parsed.body_region = normalizeRegion(safe.data.parsed.body_region);
  }
  if (safe.data.intent === "add_symptom" && typeof safe.data.parsed?.severity === "number") {
    safe.data.parsed.severity = Math.max(0, Math.min(10, safe.data.parsed.severity));
  }

  return safe.data;
}

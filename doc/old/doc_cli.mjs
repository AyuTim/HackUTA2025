// doc_cli.mjs — Conversational CLI for Doc (logs + grounded response)
import readline from "node:readline";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

import { routeIntent } from "../router.mjs";
import { askDocWithContext } from "./chat.mjs";

// --- setup paths ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, "mock_patient_soumika.json"); // keep this name aligned with chat.mjs

// --- load context once ---
let ctx;
try {
  ctx = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
} catch (e) {
  console.error("❌ Failed to read mock_patient_soumika.json:", e?.message || e);
  process.exit(1);
}

// --- helpers to persist context ---
function saveContext() {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(ctx, null, 2));
  } catch (e) {
    console.error("⚠️  Failed to persist context:", e?.message || e);
  }
}

// --- helpers to mutate in-memory context ---
function addSymptom(p) {
  ctx.symptoms ??= [];
  const record = {
    body_region: p.body_region,
    label: p.label,
    severity: Number(p.severity) || 5,
    onset_date: p.onset_date || new Date().toISOString().slice(0, 10),
    notes: p.notes,
  };
  ctx.symptoms.push(record);
  saveContext();
  return record;
}

function logBehavior(p) {
  const date = p.date || new Date().toISOString().slice(0, 10);
  ctx.observations_daily ??= [];
  let day = ctx.observations_daily.find(d => d.date === date);
  if (!day) {
    day = { date };
    ctx.observations_daily.push(day);
  }

  // normalize metric names (e.g., "water" -> "water_oz")
  const normalized = String(p.metric).trim().toLowerCase().replace(/\s+/g, "_");
  const metric = normalized === "water" ? "water_oz" : normalized;
  const val = isNaN(Number(p.value)) ? p.value : Number(p.value);
  day[metric] = val;

  saveContext();
  return { metric, val, date };
}

// Build a focused follow-up question for the reasoner given a new symptom
function buildSymptomFollowUp(s) {
  const sev = s.severity ?? "unknown";
  const when = s.onset_date ?? "unknown date";
  const region = s.body_region ?? "unknown region";
  return `New symptom: ${s.label} (${region}), severity ${sev}/10, since ${when}.
What could be driving this based on my records, and what should I do today?`;
}

async function startChat() {
  if (!process.dotenv.GEMINI_API_KEY) {
    console.error("❌ Missing GEMINI_API_KEY in .dotenv");
    process.exit(1);
  }

  console.log("💬 Doc is online. Type your message (Ctrl+C to exit).");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "> ",
  });
  rl.prompt();

  rl.on("line", async (line) => {
    const text = line.trim();

    // quick exits
    if (!text) { rl.prompt(); return; }
    if (["exit", "quit", ":q", "q"].includes(text.toLowerCase())) {
      rl.close();
      return;
    }

    try {
      const todayIso = new Date().toISOString().slice(0, 10);
      const routed = await routeIntent(text, todayIso);

      if (routed.intent === "add_symptom" && routed.parsed) {
        const rec = addSymptom(routed.parsed);
        console.log(`✅ Symptom logged (${rec.label}, ${rec.severity}/10).`);

        // Immediately provide grounded guidance based on the new symptom
        const followQ = buildSymptomFollowUp(rec);
        const answer = await askDocWithContext(followQ, ctx);
        console.log("\n🤖 Doc:\n" + answer + "\n");

      } else if (routed.intent === "log_behavior" && routed.parsed) {
        const { metric, val, date } = logBehavior(routed.parsed);
        console.log(`✅ Behavior logged (${metric}: ${val} on ${date}).`);

        // Lightweight nudge for key metrics
        if (["water_oz", "sleep_min", "steps", "exercise_min", "protein_g"].includes(metric)) {
          const quickQ = `Given today's ${metric} is ${val}, any quick advice tied to my recent symptoms?`;
          const tip = await askDocWithContext(quickQ, ctx);
          console.log("\n🤖 Doc:\n" + tip + "\n");
        }

      } else if (routed.intent === "question") {
        const answer = await askDocWithContext(text, ctx);
        console.log("\n🤖 Doc:\n" + answer + "\n");

      } else {
        // smalltalk — keep it friendly
        console.log("🙂 Doc: I’m here. You can log a symptom/behavior or ask a health question.");
      }
    } catch (err) {
      // surface useful error info
      const msg = err?.message || String(err);
      console.error("⚠️  Error:", msg);
      if (process.dotenv.DOC_DEBUG === "1" && err?.response?.statusText) {
        console.error("   Status:", err.response.statusText);
      }
    }

    rl.prompt();
  });

  rl.on("close", () => {
    console.log("👋 Goodbye!");
    process.exit(0);
  });
}

startChat();

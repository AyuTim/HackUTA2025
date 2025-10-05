// src/doc_cli.mjs
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { loadPatient } from "./patient.js";
import { runReasoner } from "./reasoner.js";
import { synthesizeToFile } from "./tts.js";

async function main() {
  const rl = readline.createInterface({ input, output });
  const patient = loadPatient("./mock_patient_soumika.json");

  console.log("💬 Doc is online. Type your message (type 'exit' to quit).");

  let prevDocQuestion = null;

  // Get the very first user message
  let userMsg = (await rl.question("> ")).trim();
  while (userMsg.toLowerCase() !== "exit") {
    // Give minimal context so short replies like "no I haven't" still make sense
    const composed = prevDocQuestion
      ? `Previous question from Doc: "${prevDocQuestion}"\nMy answer: ${userMsg}`
      : userMsg;

    const res = await runReasoner(composed, patient);

    // Speak & print
    const spoken = res.advice_text.length > 300
      ? res.advice_text.slice(0, 300) + "..."
      : res.advice_text;
    const mp3Path = await synthesizeToFile(spoken);

    console.log("\nDoc:", res.advice_text);
    if (res.follow_up_q?.[0]) {
      console.log("Doc asks:", res.follow_up_q[0]);
    }
    console.log("🔊", mp3Path);

    // Prepare next turn
    prevDocQuestion = res.follow_up_q?.[0] || null;
    userMsg = (await rl.question("> ")).trim();
  }

  rl.close();
}

main().catch((e) => {
  console.error("Doc chat error:", e?.message || e);
  process.exit(1);
});

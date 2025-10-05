import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

const key = process.env.GEMINI_API_KEY;

if (!key) {
  console.error("❌ No GEMINI_API_KEY found in .env");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(key);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" }); // or gemini-2.5-flash if you prefer

const prompt = "Say hello from Gemini to Soumika 👋";

try {
  const result = await model.generateContent(prompt);
  console.log("✅ Gemini reply:\n", result.response.text());
} catch (err) {
  console.error("❌ Error:", err);
}

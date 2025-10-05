// reasoner.js
import dotenv from "dotenv";
// dotenv.config();
dotenv.config({ path: ".docenv" });
dotenv.config({ path: ".env", override: false });

import Anthropic from "@anthropic-ai/sdk";
import { buildDocPrompt } from "./prompt.js";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// the preferred models in order (404s will be handled and we can fall back automatically)
const PREFERRED = [
  "claude-3-5-sonnet-latest",
  "claude-3-sonnet-latest",
  "claude-3-haiku-latest"
];

export async function runReasoner(userMessage, patient) {
  const prompt = buildDocPrompt(userMessage, patient);

  // trying the preferred models first
  for (const model of PREFERRED) {
    try {
      const text = await callClaude(model, prompt);
      if (text && text.trim()) {
        return parseSections(text);
      }
    } catch (err) {
      const code = getErrCode(err);
      if (code !== 404) {
        throw friendlyError(err);
      }
      // else continue to next model
    }
  }

  const text = await tryAnyAvailable(prompt);
  return parseSections(text);
}

async function callClaude(model, prompt) {
  const resp = await client.messages.create({
    model,
    max_tokens: 350,
    temperature: 0.2,
    messages: [{ role: "user", content: prompt }]
  });

  const parts = (resp.content || [])
    .filter((p) => p.type === "text")
    .map((p) => p.text);
  return parts.join("\n").trim();
}

function getErrCode(err) {
  try {
    if (err?.status) return err.status;
    const body = typeof err?.error === "object" ? err.error : null;
    if (body?.type === "not_found_error") return 404;
  } catch {}
  return undefined;
}

function friendlyError(err) {
  const msg = err?.message || JSON.stringify(err);
  return new Error(msg);
}

function parseSections(raw) {
  // 1) here we're trying to extract and parse JSON first (handles code fences and extra text)
  const json = extractJSON(raw);
  if (json && typeof json === "object") {
    // the new chat schema
    if (json.speak || json.next_q) {
      const advice_text = (json.speak || "").trim();
      const follow_up_q = json.next_q ? [String(json.next_q).trim()] : [];
      return {
        advice_text,
        likely_causes: [],
        self_care: [],
        red_flags: [],
        follow_up_q
      };
    }

    // the legacy schema fallback
    const {
      advice_text = "",
      likely_causes = [],
      self_care = [],
      red_flags = [],
      follow_up_q = []
    } = json;
    return { advice_text, likely_causes, self_care, red_flags, follow_up_q };
  }

  // 2) the fallback to legacy section parsing if a non-JSON blob comes back
  const get = (label) => {
    const re = new RegExp(
      `${label}\\s*:\\s*([\\s\\S]*?)(?=\\n\\s*\\w[^\\n]*:\\s*|$)`,
      "i"
    );
    const m = raw.match(re);
    return m ? m[1].trim() : "";
  };

  const toList = (block) =>
    block
      .split("\n")
      .map((l) => l.replace(/^[-•*\d.)\s]+/, "").trim())
      .filter(Boolean);

  const advice = get("Advice") || raw.trim();
  const causes = toList(get("Possible Causes"));
  const care = toList(get("Self-Care Steps"));
  const flags = toList(get("Red Flags"));
  const follow = toList(get("Follow-Up Questions"));

  return {
    advice_text: advice,
    likely_causes: causes,
    self_care: care,
    red_flags: flags,
    follow_up_q: follow
  };
}

function extractJSON(raw) {
  if (!raw) return null;

  // a) If its fenced, then we grab inside first ``` ``` block
  const fenced = raw.replace(/```(?:json)?/gi, "```").match(/```([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : raw;

  // b) Find the largest plausible JSON object in the candidate
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;

  const slice = candidate.slice(start, end + 1);
  try {
    return JSON.parse(slice);
  } catch {
    return null;
  }
}

// If all preferred models 404, then we can try what we CAN use and then pick the best
async function tryAnyAvailable(prompt) {
  const list = await client.models.list();
  const names = (list?.data || []).map((m) => m.id);

  const pick =
    names.find((n) => /sonnet/i.test(n)) ||
    names.find((n) => /haiku/i.test(n)) ||
    names[0];

  if (!pick) throw new Error("No Claude models available to this API key.");

  const text = await callClaude(pick, prompt);
  // Return raw so JSON parsing works
  return text;
}

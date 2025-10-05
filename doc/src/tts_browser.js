// src/tts_browser.js
import express from "express";
import { Readable } from "node:stream";
import { exec } from "node:child_process";
import dotenv from "dotenv";
// dotenv.config();
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env", override: false });

import { loadPatient } from "./patient.js";
import { runReasoner } from "./reasoner.js";

const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
const PORT = Number(process.env.DOC_TTS_PORT || 5173);

let serverStarted = false;
let pageOpened = false;
const clients = new Set(); // SSE clients

const app = express();
app.use(express.json());

// ---------- UI (voice chat with bubbles) ----------
app.get("/voice", (_req, res) => {
  res.type("html").send(VOICE_HTML);
});

// ---------- SSE (push Doc text; page plays via /tts) ----------
app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  res.write("retry: 1000\n\n");
  clients.add(res);
  req.on("close", () => clients.delete(res));
});
function broadcastText(text) {
  const msg = `data: ${JSON.stringify({ text })}\n\n`;
  for (const res of clients) res.write(msg);
}

// ---------- ElevenLabs proxy (stream MP3 to browser) ----------
app.get("/tts", async (req, res) => {
  try {
    if (!ELEVEN_KEY) return res.status(500).send("Missing ELEVENLABS_API_KEY");
    const text = String(req.query.text || "Hello from Doc.");
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream?optimize_streaming_latency=3&output_format=mp3_44100_128`;

    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVEN_KEY,
        accept: "audio/mpeg",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.85,
          style: 0.15,
          use_speaker_boost: true,
        },
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const msg = await safeText(upstream);
      return res.status(502).send(`TTS failed ${upstream.status}: ${msg}`);
    }

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Transfer-Encoding", "chunked");
    Readable.fromWeb(upstream.body).pipe(res);
  } catch (e) {
    res.status(500).send(String(e?.message || e));
  }
});

// ---------- Chat endpoint (uses the Claude reasoner) ----------
const state = {
  prevDocQuestion: null,
  history: [], // tiny memory [{user, doc, q}]
};

app.post("/chat", async (req, res) => {
  try {
    const userMsg = String(req.body?.text || "").trim();
    if (!userMsg) return res.status(400).json({ error: "text required" });

    const patient = loadPatient("./mock_patient_soumika.json");

    // Minimal threading so short replies make sense
    const composed = state.prevDocQuestion
      ? `Previous question from Doc: "${state.prevDocQuestion}"\nMy answer: ${userMsg}`
      : userMsg;

    const out = await runReasoner(composed, patient);

    // Speak in browser
    const spoken =
      out.advice_text.length > 300 ? out.advice_text.slice(0, 300) + "..." : out.advice_text;
    broadcastText(spoken);

    // Update small memory
    state.history.push({ user: userMsg, doc: out.advice_text, q: out.follow_up_q?.[0] || null });
    if (state.history.length > 8) state.history.shift();
    state.prevDocQuestion = out.follow_up_q?.[0] || null;

    res.json({ speak: out.advice_text, next_q: state.prevDocQuestion });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// ---------- Helpers: server + open browser ----------
async function ensureServer() {
  if (serverStarted) return;
  await new Promise((resolve, reject) => {
    app
      .listen(PORT, () => {
        serverStarted = true;
        console.log(`🌐 Voice server on http://localhost:${PORT}/voice`);
      })
      .on("error", reject);
  });
}
function openURL(url) {
  return new Promise((resolve, reject) => {
    const cmd =
      process.platform === "darwin" ? `open "${url}"` :
      process.platform === "win32" ? `start "" "${url}"` :
      `xdg-open "${url}"`;
    exec(cmd, (err) => (err ? reject(err) : resolve()));
  });
}
async function ensurePage() {
  if (pageOpened) return;
  try { await openURL(`http://localhost:${PORT}/voice`); pageOpened = true; } catch {}
}
async function safeText(resp) { try { return await resp.text(); } catch { return ""; } }

// ---------- Public API for CLI: play text in same tab ----------
export async function playInBrowser(text) {
  await ensureServer();
  await ensurePage();
  broadcastText(text);
}

// Start server & open the page if run directly
ensureServer().then(ensurePage).catch(() => {
  console.log(`Open http://localhost:${PORT}/voice in the browser`);
});

// ---------- Inline HTML with bubble UI + robust push-to-talk + transcript toggle ----------
const VOICE_HTML = `<!doctype html>
<html><head>
<meta charset="utf-8"/>
<title>Doc — Voice Chat</title>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
  :root {
    font-family: system-ui,-apple-system,Segoe UI,Roboto,Inter,sans-serif;
    --blue-900: #7fa5e4ff; /* Doc bubble */
    --blue-500: #7fa5e4ff;
    --red-900:  #b65a5aff; /* You bubble */
    --red-600:  #b65a5aff;
  }
  body { margin:0; background:#0b0c10; color:#e9eef3; display:grid; place-items:center; min-height:100dvh; }
  .card { position:relative; width:min(560px,92vw); background:#11151c; border:1px solid #222b36; border-radius:20px; padding:20px; box-shadow:0 10px 30px rgba(0,0,0,.35); }
  // .card::after { content:""; position:absolute; inset:0 0 auto 0; height:3px; border-top-left-radius:20px; border-top-right-radius:20px; background:linear-gradient(90deg, rgba(127,29,29,.28), rgba(127,29,29,0) 70%); pointer-events:none; }

  .topbar { display:flex; align-items:center; justify-content:space-between; gap:8px; }
  h1 { margin:0; font-size:18px; }
  #status { font-size:12px; opacity:.8; margin:6px 0 10px; }

  /* Transcript toggle (ghost) */
  #toggle {
    padding:6px 10px; border-radius:10px; border:1px solid #2c3644; background:#131a22; color:#e9eef3;
    cursor:pointer; font-size:12px;
  }
  #toggle:hover { background:#1a2330; }
  #toggle[data-unread="true"]::after { content:" •"; color:#dc2626; font-weight:700; }

  /* Orb: smooth red→blue diagonal gradient */
  #orb {
    width:120px; height:120px; margin:14px auto; border-radius:999px;
    background:
      radial-gradient(80% 80% at 60% 70%, rgba(0,0,0,.28), rgba(0,0,0,0) 70%),
      linear-gradient(135deg, var(--red-600) 0%, var(--red-900) 35%, var(--blue-500) 65%, var(--blue-900) 100%);
    background-blend-mode: multiply, normal;
    box-shadow: 0 0 34px rgba(30,58,138,.45), 0 0 22px rgba(127,29,29,.30);
    transform: scale(1);
    transition: transform .18s ease, box-shadow .18s ease, filter .18s ease;
    filter: saturate(110%);
  }
  #orb.talking { transform: scale(1.06); box-shadow: 0 0 44px rgba(30,58,138,.55), 0 0 32px rgba(127,29,29,.38); filter: saturate(120%); }

  /* Transcript area */
  #log { max-height:42vh; overflow:auto; padding:4px 2px; }
  #log.hidden { display:none; }
  .msg { max-width:80%; padding:10px 12px; border-radius:14px; margin:6px 0; line-height:1.25; word-wrap:break-word; color:#e9eef3; }
  .msg.doc { background: var(--blue-900);  margin-right:auto; }
  .msg.you { background: var(--red-900);   margin-left:auto; }

  /* Buttons (neutral) */
  .row { display:flex; gap:8px; margin-top:10px; }
  button.action { flex:1; padding:10px 12px; border-radius:12px; border:1px solid #2c3644; background:#17202b; color:#e9eef3; cursor:pointer; }
  button.action:hover { background:#1b2633; }

  audio { width:100%; margin-top:12px; }
</style>
</head>
<body>
<div class="card">
  <div class="topbar">
    <h1>Doc — Voice Chat</h1>
    <button id="toggle" aria-pressed="false" title="Show transcript">Transcript</button>
  </div>
  <div id="status">ready</div>
  <div id="orb"></div>
  <div id="log" class="hidden"></div>
  <div class="row">
    <button class="action" id="ptt">Hold to talk</button>
    <button class="action" id="interrupt">Interrupt</button>
  </div>
  <audio id="player" controls autoplay></audio>
</div>

<script>
  const statusEl = document.getElementById('status');
  const orb = document.getElementById('orb');
  const logEl = document.getElementById('log');
  const ptt = document.getElementById('ptt');
  const interruptBtn = document.getElementById('interrupt');
  const toggleBtn = document.getElementById('toggle');
  const audioEl = document.getElementById('player');

  // SSE: server pushes Doc's next line; we stream via /tts
  const es = new EventSource('/events');
  es.onopen = () => statusEl.textContent = 'connected';
  es.onerror = () => statusEl.textContent = 'reconnecting…';
  es.onmessage = (e) => {
    try {
      const { text } = JSON.parse(e.data);
      if (!text) return;
      orb.classList.add('talking');
      audioEl.src = '/tts?text=' + encodeURIComponent(text);
      audioEl.play().catch(()=>{});
      audioEl.onended = () => orb.classList.remove('talking');
    } catch {}
  };

  // Transcript toggle
  toggleBtn.addEventListener('click', () => {
    const hidden = logEl.classList.toggle('hidden');
    toggleBtn.setAttribute('aria-pressed', String(!hidden));
    toggleBtn.title = hidden ? 'Show transcript' : 'Hide transcript';
    if (!hidden) {
      toggleBtn.removeAttribute('data-unread');
      // scroll to bottom when opening
      requestAnimationFrame(() => { logEl.scrollTop = logEl.scrollHeight; });
    }
  });

  // Bubble helper
  function appendLine(who, text) {
    const b = document.createElement('div');
    b.className = 'msg ' + (who === 'you' ? 'you' : 'doc');
    b.textContent = text;
    logEl.appendChild(b);
    if (!logEl.classList.contains('hidden')) {
      logEl.scrollTop = logEl.scrollHeight;
    } else if (who !== 'you') {
      // mark unread if transcript is hidden and Doc speaks
      toggleBtn.setAttribute('data-unread', 'true');
    }
  }

  // --- Robust Push-to-Talk ---
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null, isRecording = false, finals = [], interim = "";

  async function sendToDoc(text) {
    appendLine('you', text);
    const r = await fetch('/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text })
    });
    const data = await r.json();
    if (data?.speak) {
      const line = data.next_q ? data.speak + ' — ' + data.next_q : data.speak;
      appendLine('doc', line);
    }
  }

  function startRec() {
    finals = []; interim = ""; isRecording = true;
    orb.classList.add('talking');
    if (!SR) { statusEl.textContent = 'speech recognition not supported'; return; }

    if (rec) { try { rec.onresult = rec.onerror = rec.onend = null; rec.abort(); } catch {} rec = null; }

    rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (ev) => {
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i];
        const txt = r[0]?.transcript || '';
        if (r.isFinal) finals.push(txt.trim());
        else interim = txt.trim();
      }
    };
    rec.onerror = () => {};
    rec.onend = () => { if (isRecording) { try { rec.start(); } catch {} } };
    try { rec.start(); } catch {}
  }

  async function stopRecAndSend() {
    isRecording = false;
    orb.classList.remove('talking');
    if (rec) { try { rec.stop(); rec.abort(); } catch {} rec = null; }
    const text = (finals.concat(interim).join(' ').trim());
    finals = []; interim = "";
    if (text) await sendToDoc(text);
  }

  // Mouse / touch / keyboard
  ptt.addEventListener('mousedown', startRec);
  ptt.addEventListener('mouseup', stopRecAndSend);
  ptt.addEventListener('mouseleave', () => { if (isRecording) stopRecAndSend(); });
  ptt.addEventListener('touchstart', (e)=>{ e.preventDefault(); startRec(); }, {passive:false});
  ptt.addEventListener('touchend',   (e)=>{ e.preventDefault(); stopRecAndSend(); }, {passive:false});
  window.addEventListener('keydown', (e)=> {
    if (e.code === 'Space' && !isRecording) { e.preventDefault(); startRec(); }
  });
  window.addEventListener('keyup', (e)=> {
    if (e.code === 'Space' && isRecording) { e.preventDefault(); stopRecAndSend(); }
  });

  // Interrupt
  interruptBtn.onclick = () => {
    audioEl.pause();
    orb.classList.remove('talking');
    if (rec) { try { rec.abort(); } catch {} rec = null; }
    isRecording = false;
  };

  // Initial line (goes to transcript but it's hidden by default)
  appendLine('doc', 'Hi, I’m Doc. Hold the button, speak, then release — I’ll reply and ask one question.');
</script>
</body></html>`;

// src/tts_browser.js
import express from "express";
import { Readable } from "node:stream";
import { exec } from "node:child_process";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env", override: false });

import { loadPatient } from "./patient.js";
import { runReasoner } from "./reasoner.js";

const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
const PORT = Number(process.env.DOC_TTS_PORT || 5173);

let serverStarted = false;
let pageOpened = false;
const clients = new Set();

const app = express();
app.use(express.json());

// ---------- UI ----------
app.get("/voice", (_req, res) => {
  res.type("html").send(VOICE_HTML);
});

// ---------- SSE ----------
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

// ---------- ElevenLabs proxy ----------
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

// ---- Combine & near-dedupe speak + next_q (server) ----
const _STOP = new Set([
  "the","a","an","to","is","are","am","and","or","of","for","in","on","at","it",
  "this","that","have","has","be","been","do","does","did","you","your","yours",
  "me","my","i","we","us","our","with","from","by","as","was","were","than","then",
  "so","but","if","not","any","has","have","had","still","there","now","today"
]);
function _norm(s = "") {
  return s.toLowerCase().replace(/[\s\p{P}]+/gu, " ").trim();
}
function _tokens(s = "") {
  return _norm(s).split(/\s+/).filter(Boolean).filter((w) => !_STOP.has(w));
}
function _jaccard(a, b) {
  const A = new Set(a), B = new Set(b);
  if (A.size === 0 && B.size === 0) return 1;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  const uni = A.size + B.size - inter;
  return uni ? inter / uni : 0;
}
function _splitSentences(s = "") {
  return (s || "").split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter(Boolean);
}
function _dedupeSimilarSentences(s = "") {
  const parts = _splitSentences(s);
  const kept = [];
  for (const p of parts) {
    const pt = _tokens(p);
    const pn = _norm(p);
    let dup = false;
    for (const k of kept) {
      const kt = _tokens(k);
      const kn = _norm(k);
      const sim = _jaccard(pt, kt);
      // near-duplicate if very similar tokens OR one contains the other
      if (sim >= 0.70 || kn.includes(pn) || pn.includes(kn)) { dup = true; break; }
    }
    if (!dup) kept.push(p);
  }
  return kept.join(" ");
}
function combineSpeakAndQuestion(speak = "", q = "") {
  const s = (speak || "").trim();
  const qq = (q || "").trim();
  if (!qq) return _dedupeSimilarSentences(s);
  const sn = _norm(s);
  const qn = _norm(qq);
  if (qn.length > 6 && (sn.includes(qn) || sn.endsWith(qn))) {
    return _dedupeSimilarSentences(s);
  }
  return _dedupeSimilarSentences(`${s}${s ? " — " : ""}${qq}`);
}

// ---------- Chat endpoint ----------
const state = {
  prevDocQuestion: null,
  history: [],
};

app.post("/chat", async (req, res) => {
  try {
    const userMsg = String(req.body?.text || "").trim();
    if (!userMsg) return res.status(400).json({ error: "text required" });

    const patient = loadPatient("./mock_patient_soumika.json");

    const composed = state.prevDocQuestion
      ? `Previous question from Doc: "${state.prevDocQuestion}"\nMy answer: ${userMsg}`
      : userMsg;

    const out = await runReasoner(composed, patient);

    // Combine without near-duplicates, then send to TTS
    const combined = combineSpeakAndQuestion(
      out.advice_text,
      out.follow_up_q?.[0] || ""
    );
    const ttsText = normalizeForTTS(combined);
    broadcastText(ttsText);

    state.history.push({
      user: userMsg,
      doc: out.advice_text,
      q: out.follow_up_q?.[0] || null,
    });
    if (state.history.length > 8) state.history.shift();
    state.prevDocQuestion = out.follow_up_q?.[0] || null;

    res.json({ speak: out.advice_text, next_q: state.prevDocQuestion });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

function normalizeForTTS(s = "") {
  return s
    .replace(/\u2014/g, " - ")
    .replace(/\u2013/g, " - ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'");
}

// ---------- Server helpers ----------
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
      process.platform === "darwin"
        ? `open "${url}"`
        : process.platform === "win32"
        ? `start "" "${url}"`
        : `xdg-open "${url}"`;
    exec(cmd, (err) => (err ? reject(err) : resolve()));
  });
}
async function ensurePage() {
  if (pageOpened) return;
  try {
    await openURL(`http://localhost:${PORT}/voice`);
    pageOpened = true;
  } catch {}
}
async function safeText(resp) {
  try {
    return await resp.text();
  } catch {
    return "";
  }
}

export async function playInBrowser(text) {
  await ensureServer();
  await ensurePage();
  broadcastText(text);
}

ensureServer()
  .then(ensurePage)
  .catch(() => {
    console.log(`Open http://localhost:${PORT}/voice in your browser`);
  });

// ---------- Inline HTML ----------
const VOICE_HTML = `<!doctype html>
<html><head>
<meta charset="utf-8"/>
<title>Doc — Voice Chat</title>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
  :root {
    font-family: system-ui,-apple-system,Segoe UI,Roboto,Inter,sans-serif;
    --blue-900: #7fa5e4ff; /* Doc bubble */
    --red-900:  #b65a5aff; /* You bubble */
  }
  body { margin:0; background:#0b0c10; color:#e9eef3; display:grid; place-items:center; min-height:100dvh; }
  .card { position:relative; width:min(560px,92vw); background:#11151c; border:1px solid #222b36; border-radius:20px; padding:20px; box-shadow:0 10px 30px rgba(0,0,0,.35); }

  .topbar { display:flex; align-items:center; justify-content:space-between; gap:8px; }
  h1 { margin:0; font-size:18px; }
  #status { font-size:12px; opacity:.8; margin:6px 0 10px; }

  #toggle, #mode {
    padding:6px 10px; border-radius:10px; border:1px solid #2c3644; background:#131a22; color:#e9eef3;
    cursor:pointer; font-size:12px;
  }
  #toggle:hover, #mode:hover { background:#1a2330; }
  #toggle[data-unread="true"]::after { content:" •"; color:#dc2626; font-weight:700; }

  /* Morphing blob */
  #blob {
    width: 180px; height: 180px; margin:14px auto; display:block;
    filter: drop-shadow(0 0 22px rgba(127,29,29,.35)) drop-shadow(0 0 30px rgba(30,58,138,.45));
    transform: scale(1);
    transition: filter .1s linear;
  }
  #blob.big {
    filter: drop-shadow(0 0 40px rgba(127,29,29,.6)) drop-shadow(0 0 48px rgba(30,58,138,.7));
  }

  /* Transcript area / chat thread */
  #log { max-height:42vh; overflow:auto; padding:4px 2px; }
  .hidden { display:none; }
  .msg { max-width:80%; padding:10px 12px; border-radius:14px; margin:6px 0; line-height:1.25; word-wrap:break-word; color:#e9eef3; }
  .msg.doc { background: var(--blue-900);  margin-right:auto; }
  .msg.you { background: var(--red-900);   margin-left:auto; opacity: .95; }
  .msg.draft { opacity: .6; }

  .row { display:flex; gap:8px; margin-top:10px; }
  button.action { flex:1; padding:10px 12px; border-radius:12px; border:1px solid #2c3644; background:#17202b; color:#e9eef3; cursor:pointer; }
  button.action:hover { background:#1b2633; }

  /* Text row with icon button */
  #textRow input[type="text"] {
    flex:1; padding:10px 12px; border-radius:12px; border:1px solid #2c3644; background:#0f1620; color:#e9eef3;
    outline:none;
  }
  #sendIcon {
    width:44px; height:44px; border-radius:12px; border:1px solid #2c3644; background:#17202b; display:grid; place-items:center; cursor:pointer;
  }
  #sendIcon:hover { background:#1b2633; }

  /* ----- MODE TOGGLE (hard CSS) ----- */
  body[data-mode="voice"] #textRow { display: none !important; }
  body[data-mode="voice"] #voiceRow { display: flex !important; }

  body[data-mode="text"]  #textRow  { display: flex !important; }
  body[data-mode="text"]  #voiceRow { display: none !important; }

  /* Listen toggle with icons only */
  #listen { display:flex; align-items:center; justify-content:center; gap:8px; }
  #listen svg { width:16px; height:16px; }
</style>
</head>
<body data-mode="voice">
<div class="card">
  <div class="topbar">
    <h1>Doc — Voice Chat</h1>
    <div style="display:flex; gap:8px;">
      <button id="toggle" aria-pressed="false" title="Show transcript">Transcript</button>
      <button id="mode" aria-pressed="false" title="Switch to text input">Text</button>
    </div>
  </div>
  <div id="status">connected</div>

  <!-- Morphing SVG blob -->
  <svg id="blob" viewBox="-1 -1 2 2" aria-hidden="true">
    <defs>
      <linearGradient id="g" x1="-1" y1="-1" x2="1" y2="1">
        <stop offset="0"  stop-color="#b65a5a"/>
        <stop offset="1"  stop-color="#7fa5e4"/>
      </linearGradient>
    </defs>
    <path id="blobPath" fill="url(#g)"></path>
  </svg>

  <!-- Chat thread (Transcript) -->
  <div id="log" class="hidden"></div>

  <!-- Voice controls: single toggle button (icons only) -->
  <div class="row" id="voiceRow">
    <button class="action" id="listen" aria-pressed="false" title="Start listening">
      <!-- idle = pause icon -->
      <svg id="iconPause" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="6" y="4" width="4" height="16" rx="1.2" stroke="#e9eef3" stroke-width="1.8"/>
        <rect x="14" y="4" width="4" height="16" rx="1.2" stroke="#e9eef3" stroke-width="1.8"/>
      </svg>
      <!-- listening = play icon -->
      <svg id="iconPlay" viewBox="0 0 24 24" fill="none" aria-hidden="true" style="display:none">
        <path d="M6 4l12 8-12 8V4Z" stroke="#e9eef3" stroke-width="1.8" stroke-linejoin="round"/>
      </svg>
    </button>
  </div>

  <!-- Text mode row -->
  <div id="textRow" class="row">
    <input id="textInput" type="text" placeholder="Type to Doc and press Enter…" autocomplete="off" />
    <button id="sendIcon" title="Send" aria-label="Send">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3 12L21 3l-4 18-5-7-9-2Z" stroke="#e9eef3" stroke-width="1.7" stroke-linejoin="round"/>
      </svg>
    </button>
  </div>

  <!-- Hidden audio sink (kept for TTS playback + metering) -->
  <audio id="player" autoplay style="position:absolute;width:0;height:0;opacity:0;pointer-events:none"></audio>
</div>

<script>
  const statusEl   = document.getElementById('status');
  const logEl      = document.getElementById('log');
  const toggleBtn  = document.getElementById('toggle');
  const modeBtn    = document.getElementById('mode');
  const audioEl    = document.getElementById('player');

  const blob       = document.getElementById('blob');
  const blobPath   = document.getElementById('blobPath');

  const textInput  = document.getElementById('textInput');
  const sendIcon   = document.getElementById('sendIcon');

  // Listen toggle
  const listenBtn  = document.getElementById('listen');
  const iconPause  = document.getElementById('iconPause');
  const iconPlay   = document.getElementById('iconPlay');

  // SSE -> TTS (Doc speaks)
  const es = new EventSource('/events');
  es.onopen = () => statusEl.textContent = 'connected';
  es.onerror = () => statusEl.textContent = 'reconnecting…';
  es.onmessage = (e) => {
    try {
      const { text } = JSON.parse(e.data);
      if (!text) return;
      ensureAudioContext();
      startTTS(text);
      if (logEl.classList.contains('hidden')) toggleBtn.setAttribute('data-unread', 'true');
    } catch {}
  };

  function startTTS(text) {
    try { audioEl.pause(); } catch {}
    audioEl.src = '/tts?text=' + encodeURIComponent(text);
    audioEl.play().catch(()=>{});
  }

  // TTS lifecycle
  let listening = false;
  let ttsActive = false;
  let freezeBlob = true;
  let resumeAfterTTS = false;

  const TTS_COOLDOWN_MS = 400;
  const SR_SQUELCH_MS   = 300;
  let ttsCooldownUntil = 0;
  let srSquelchUntil   = 0;

  audioEl.addEventListener('playing', () => {
    ttsActive = true;
    freezeBlob = false;
    if (listening) { resumeAfterTTS = true; pauseRecognitionForTTS(); }
    acquireMic();
  });
  audioEl.addEventListener('pause', onTTSEnd);
  audioEl.addEventListener('ended', onTTSEnd);
  function onTTSEnd(){
    ttsActive = false;
    ttsCooldownUntil = performance.now() + TTS_COOLDOWN_MS;
    if (resumeAfterTTS && document.body.dataset.mode === 'voice') {
      resumeAfterTTS = false;
      setTimeout(() => {
        if (document.body.dataset.mode === 'voice') startListening();
      }, TTS_COOLDOWN_MS);
    } else {
      releaseMic();
      freezeBlob = true;
    }
  }

  // Transcript toggle
  toggleBtn.addEventListener('click', () => {
    const hidden = logEl.classList.toggle('hidden');
    toggleBtn.setAttribute('aria-pressed', String(!hidden));
    toggleBtn.title = hidden ? 'Show transcript' : 'Hide transcript';
    if (!hidden) {
      toggleBtn.removeAttribute('data-unread');
      requestAnimationFrame(() => { logEl.scrollTop = logEl.scrollHeight; });
    }
  });

  // Append bubbles
  function appendLine(who, text, {draft=false} = {}) {
    const b = document.createElement('div');
    b.className = 'msg ' + (who === 'you' ? 'you' : 'doc') + (draft ? ' draft' : '');
    b.textContent = text;
    if (draft) b.id = 'draftLine';
    const existing = document.getElementById('draftLine');
    if (draft && existing) existing.replaceWith(b); else logEl.appendChild(b);
    if (!logEl.classList.contains('hidden')) logEl.scrollTop = logEl.scrollHeight;
  }
  function clearDraft(){ const d=document.getElementById('draftLine'); if(d) d.remove(); }
  function updateDraft(text){ if(!text){clearDraft();return;} appendLine('you', text, {draft:true}); }

  // ---- Client-side combine & near-dedupe before rendering ----
  function _normC(s){ return (s||"").toLowerCase().replace(/[^a-z0-9\s]/g," ").replace(/\s+/g," ").trim(); }
  const _STOP_C = new Set(${JSON.stringify([..._STOP])});
  function _tokC(s){ return _normC(s).split(" ").filter(Boolean).filter(w=>!_STOP_C.has(w)); }
  function _jacC(a,b){ const A=new Set(a), B=new Set(b); if(!A.size && !B.size) return 1; let inter=0; for(const x of A){ if(B.has(x)) inter++; } const uni=A.size+B.size-inter; return uni? inter/uni:0; }
  function combineAndDedupe(speak="", q=""){
    const s=(speak||"").trim(), qq=(q||"").trim();
    const sn=_normC(s), qn=_normC(qq);
    let base = s;
    if(qq && !(qn.length>6 && (sn.includes(qn) || sn.endsWith(qn)))) base = s ? (s+" — "+qq) : qq;

    // sentence-level near-dedupe
    const parts = (base||"").split(/(?<=[.!?])\s+/).map(x=>x.trim()).filter(Boolean);
    const kept=[];
    for(const p of parts){
      const pt=_tokC(p), pn=_normC(p);
      let dup=false;
      for(const k of kept){
        const kt=_tokC(k), kn=_normC(k);
        const sim=_jacC(pt,kt);
        if(sim>=0.70 || kn.includes(pn) || pn.includes(kn)) { dup=true; break; }
      }
      if(!dup) kept.push(p);
    }
    return kept.join(" ");
  }

  // Dedupe last-sent (prevent double sends) + FIX: replace draft text with final full text
  let lastSent = "";
  let lastSentAt = 0;
  async function sendToDoc(text) {
    const t = (text || "").trim();
    const now = Date.now();
    if (!t) return;
    if (t === lastSent && now - lastSentAt < 2000) return;  // 2s guard
    lastSent = t; lastSentAt = now;

    const d = document.getElementById('draftLine');
    if (d) {
      d.textContent = t;              // <<< ensure full sentence is saved
      d.classList.remove('draft');
      d.id = '';
    } else {
      appendLine('you', t);
    }

    const r = await fetch('/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: t })
    });
    const data = await r.json();
    if (data?.speak) {
      const line = combineAndDedupe(data.speak, data.next_q || "");
      appendLine('doc', line);
    }
  }

  // ---- Audio metering + morphing blob + echo-aware barge-in ----
  let audioCtx, micAnalyser, outAnalyser, micData, outData, micStream;
  function ensureAudioContext() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const outSrc = audioCtx.createMediaElementSource(audioEl);
    outAnalyser = audioCtx.createAnalyser(); outAnalyser.fftSize = 2048;
    outSrc.connect(outAnalyser);
    outSrc.connect(audioCtx.destination);
    outData = new Uint8Array(outAnalyser.fftSize);
  }
  async function acquireMic(){
    if (micStream) return;
    try {
      micStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      ensureAudioContext();
      const src = audioCtx.createMediaStreamSource(micStream);
      micAnalyser = audioCtx.createAnalyser(); micAnalyser.fftSize = 2048;
      src.connect(micAnalyser);
      micData = new Uint8Array(micAnalyser.fftSize);
      freezeBlob = false;
    } catch {}
  }
  function releaseMic(){
    if (micStream){ micStream.getTracks().forEach(t=>{ try{t.stop();}catch{} }); micStream=null; }
    micAnalyser=null; micData=null;
  }
  function rms(buf){ let s=0; for(let i=0;i<buf.length;i++){const v=(buf[i]-128)/128; s+=v*v;} return Math.sqrt(s/buf.length); }
  function makeBlob(level,t){
    const lobes=5, base=0.75, amp=0.125*level;
    let d=""; for(let i=0;i<=360;i+=6){ const th=i*Math.PI/180;
      const r=base+amp*Math.sin(lobes*th+t*1.8)+0.05*Math.sin(2*th+t*0.7);
      const x=r*Math.cos(th), y=r*Math.sin(th); d+=(i===0?"M":"L")+x.toFixed(4)+" "+y.toFixed(4)+" ";
    } return d+"Z";
  }
  const BARGE_THRESHOLD = 0.09;
  const BARGE_MIN_MS = 140;
  const OUT_ECHO_GUARD = 1.35; // mic must be ~35% louder than output
  let bargeStartAt = null;
  let t0 = performance.now();
  function animateBlob(){
    const t=(performance.now()-t0)/1000;
    let micLevel=0, outLevel=0;
    if (micAnalyser && micData){ micAnalyser.getByteTimeDomainData(micData); micLevel=rms(micData); }
    if (outAnalyser && outData){ outAnalyser.getByteTimeDomainData(outData); outLevel=rms(outData); }

    const levelRaw=(micLevel*2.6 + outLevel*2.0) * 1.8;
    const level=Math.min(1, levelRaw*0.5);
    const scale=1 + level*0.45;
    blob.style.transform = \`scale(\${scale.toFixed(3)})\`;
    if (level>0.15) blob.classList.add('big'); else blob.classList.remove('big');
    blobPath.setAttribute('d', makeBlob(level,t));

    // Echo-aware barge-in during TTS
    if (ttsActive && micLevel > BARGE_THRESHOLD && micLevel > outLevel * OUT_ECHO_GUARD) {
      if (!bargeStartAt) bargeStartAt = performance.now();
      else if (performance.now() - bargeStartAt > BARGE_MIN_MS) {
        try { audioEl.pause(); } catch {}
        ttsActive = false;
        bargeStartAt = null;
        if (!listening && document.body.dataset.mode === 'voice') startListening();
      }
    } else {
      bargeStartAt = null;
    }

    requestAnimationFrame(animateBlob);
  }
  requestAnimationFrame(animateBlob);

  // --- SpeechRecognition (toggle listen) ---
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec=null, finals=[], interim="", flushTimer=null;

  function setListenUI(active) {
    listenBtn.setAttribute('aria-pressed', String(active));
    listenBtn.title = active ? 'Stop listening' : 'Start listening';
    iconPause.style.display = active ? 'none' : '';
    iconPlay.style.display  = active ? '' : 'none';
  }

  function pauseRecognitionForTTS() {
    if (rec) { try { rec.stop(); rec.abort(); } catch {} rec=null; }
    listening = false;
    setListenUI(false);
    if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
    finals = []; interim = "";
  }

  function startListening() {
    if (!SR) { statusEl.textContent = 'speech recognition not supported'; return; }
    if (listening) return;
    listening = true;
    setListenUI(true);
    acquireMic();

    try { audioEl.pause(); } catch {}

    rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;

    srSquelchUntil = performance.now() + SR_SQUELCH_MS;

    rec.onresult = (ev) => {
      if (performance.now() < ttsCooldownUntil) return; // after TTS tail
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i];
        const txt = r[0]?.transcript || '';
        if (performance.now() < srSquelchUntil) continue; // ignore early frames

        if (r.isFinal) {
          finals.push(txt.trim());
          if (flushTimer) clearTimeout(flushTimer);
          flushTimer = setTimeout(async () => {
            const text = [finals.join(' '), interim].filter(Boolean).join(' ').trim();
            finals = []; interim = ""; flushTimer = null;
            await sendToDoc(text);
            clearDraft();
          }, 400);
        } else {
          interim = txt.trim();
          updateDraft([finals.join(' '), interim].filter(Boolean).join(' '));
        }
      }
    };
    rec.onerror = () => {};
    rec.onend = () => { if (listening) { try { rec.start(); } catch {} } };
    try { rec.start(); } catch {}
  }

  async function stopListening() {
    freezeBlob = true;
    if (!listening && !micStream) { return; }
    listening = false;
    setListenUI(false);

    if (rec) { try { rec.stop(); rec.abort(); } catch {} rec = null; }
    if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }

    const text = [finals.join(' '), interim].filter(Boolean).join(' ').trim();
    finals = []; interim = "";
    if (text) await sendToDoc(text);
    clearDraft();

    try { audioEl.pause(); } catch {}
    if (!ttsActive) releaseMic();
  }

  listenBtn.addEventListener('click', () => {
    if (document.body.dataset.mode !== 'voice') return;
    if (listening) stopListening(); else startListening();
  });

  // --- Text mode: draft + send ---
  async function sendTyped() {
    const text = (textInput?.value || "").trim();
    if (!text) return;
    textInput.value = '';
    updateDraft('');
    await sendToDoc(text);
  }
  if (sendIcon) sendIcon.onclick = sendTyped;
  if (textInput) {
    textInput.addEventListener('input', (e)=> updateDraft(e.target.value));
    textInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); sendTyped(); }
    });
  }

  // Mode toggle (Voice <-> Text)
  let mode = 'voice';
  function setMode(next) {
    mode = next;
    document.body.dataset.mode = mode;

    const voice = (mode === 'voice');
    modeBtn.setAttribute('aria-pressed', String(!voice));
    modeBtn.textContent = voice ? 'Text' : 'Voice';
    modeBtn.title = voice ? 'Switch to text input' : 'Switch to voice';

    if (!voice) {
      try { audioEl.pause(); } catch {}
      if (listening) stopListening(); else { releaseMic(); freezeBlob = true; }
      toggleBtn.removeAttribute('data-unread');
      logEl.classList.remove('hidden');
      toggleBtn.setAttribute('aria-pressed', 'true');
      toggleBtn.title = 'Hide transcript';
      textInput?.focus();
    } else {
      freezeBlob = true;
    }
  }
  modeBtn.onclick = () => setMode(mode === 'voice' ? 'text' : 'voice');
  setMode('voice');

  // Initial line
  appendLine('doc', 'Hi, I’m Doc. Tap ■ to start listening (it turns to ▶). Tap again to stop — or press Text to type.');
</script>
</body></html>`;

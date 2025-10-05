# main.py
import os
import json
import tempfile
from typing import Literal, Optional

import google.generativeai as genai
from fastapi import FastAPI, File, Form, UploadFile, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# --- ENV + Gemini setup ---
load_dotenv()
API_KEY = os.getenv("GOOGLE_API_KEY")
if not API_KEY:
    raise RuntimeError("Missing GOOGLE_API_KEY in environment (.env)")

genai.configure(api_key=API_KEY)

DEFAULT_MODEL = os.getenv("GEMINI_MODEL", "models/gemini-2.5-flash")

app = FastAPI(title="MedTwin PDF Analyzer")

# CORS (loose for dev; tighten in prod)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# MODELS / SCHEMAS
# -----------------------------
class AnalyzeResponse(BaseModel):
    mode: Literal["json", "transcript"]
    data: Optional[dict] = None
    transcript: Optional[str] = None


# -----------------------------
# HEALTH
# -----------------------------
@app.get("/health")
def health_check():
    return {"status": "ok", "model": DEFAULT_MODEL}


# -----------------------------
# LIST AVAILABLE MODELS
# -----------------------------
@app.get("/models")
def list_models():
    out = []
    try:
        for m in genai.list_models():
            if "generateContent" in getattr(m, "supported_generation_methods", []):
                out.append(m.name)
        return {"models": out}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -----------------------------
# PDF ANALYSIS
# -----------------------------
@app.post("/api/pdf/analyze", response_model=AnalyzeResponse)
async def analyze_pdf(
    pdf: UploadFile = File(...),
    mode: Literal["json", "transcript"] = Form("json"),
    model_name: str = Form(DEFAULT_MODEL),
):
    """
    Upload a medical PDF and extract structured JSON or transcript text using Gemini.
    """
    if not pdf.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    # Save to a temp file (upload_file expects a path)
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tf:
        try:
            file_bytes = await pdf.read()
            if not file_bytes:
                raise HTTPException(status_code=400, detail="Empty file.")
            tf.write(file_bytes)
            tmp_path = tf.name
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to read upload: {e}")

    try:
        # Upload to Gemini Files API (path required)
        up = genai.upload_file(
            path=tmp_path,
            mime_type="application/pdf",
            display_name=pdf.filename,
        )

        model = genai.GenerativeModel(model_name)

        if mode == "json":
            prompt = """
            You are a medical report parser.
            From this PDF, return STRICT JSON only (no extra text) with the shape:

            {
              "patientName": string?,
              "examDate": string?,
              "findings": [
                {
                  "bodyPart": string?,   // e.g., brain/heart/kidney_left/etc.
                  "modality": string?,   // MRI/CT/X-ray/Ultrasound/Lab/Note
                  "summary": string,     // 1-3 sentences, patient-friendly
                  "impression": string?,
                  "laterality": string?, // left/right/bilateral/midline/n/a
                  "region": string?,     // thorax/abdomen/neuro/msk/general
                  "severity": string?,   // none/mild/moderate/severe
                  "pages": [int]
                }
              ],
              "labs": [
                {
                  "name": string,
                  "value": string,
                  "unit": string?,
                  "refRange": string?,
                  "relatedBodyPart": string?, // map if obvious (e.g., eGFR -> kidneys)
                  "sourcePage": int?
                }
              ],
              "meds": [
                {
                  "name": string,
                  "dose": string?,
                  "freq": string?,
                  "relatedBodyPart": string?, // e.g., statin -> heart
                  "sourcePage": int?
                }
              ]
            }
            """
            resp = model.generate_content([up, prompt])

            content = (resp.text or "").strip()
            if not content:
                raise HTTPException(status_code=502, detail="Empty JSON from model.")

            # Be robust to fences
            cleaned = content
            if cleaned.startswith("```"):
                cleaned = cleaned.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()

            try:
                data = json.loads(cleaned)
            except json.JSONDecodeError:
                # If model returned non-strict JSON, surface raw for debugging
                data = {"raw": content}

            return AnalyzeResponse(mode="json", data=data)

        # transcript mode
        t_prompt = (
            "Transcribe this medical PDF to readable text for a patient. "
            "Preserve headings. Insert markers like [Page X] at each new page. "
            "Render tables as simple markdown where possible. Do not include extra commentary."
        )
        resp = model.generate_content([up, t_prompt])
        text = (resp.text or "").strip()
        if not text:
            raise HTTPException(status_code=502, detail="No transcript returned by model.")
        return AnalyzeResponse(mode="transcript", transcript=text)

    except HTTPException:
        raise
    except Exception as e:
        # Make sure errors don't break response_model
        raise HTTPException(status_code=500, detail=f"Analyze error: {e}")
    finally:
        # Clean up temp file
        try:
            os.remove(tmp_path)
        except Exception:
            pass


# -----------------------------
# SUMMARY & BODY-PART INDEX
# -----------------------------
@app.post("/api/pdf/summary")
def summarize_and_categorize(payload: dict = Body(...)):
    data = payload.get("data", {}) or {}
    findings = data.get("findings", []) or []
    labs = data.get("labs", []) or []
    meds = data.get("meds", []) or []

    # --- Updated body part mappings (now includes 'hair') ---
    part_map = {
        "brain": "head",
        "neuro": "head",
        "head": "head",
        "scalp": "hair",
        "hair": "hair",

        "stomach": "stomach",
        "abdomen": "stomach",
        "liver": "stomach",
        "pancreas": "stomach",
        "kidney": "stomach",
        "kidney_left": "stomach",
        "kidney_right": "stomach",
        "spleen": "stomach",
        "intestine": "stomach",
        "bladder": "stomach",

        "leg": "legs",
        "knee": "legs",
        "thigh": "legs",

        "foot": "feet",
        "feet": "feet",
        "ankle": "feet",

        "arm": "arms",
        "shoulder": "arms",
        "wrist": "arms",
        "hand": "arms",

        # fallback if unclear
        "general": "head"
    }

    def to_region(text: Optional[str]) -> str:
        t = (text or "").lower()
        for key, region in part_map.items():
            if key in t:
                return region
        return "head"  # default fallback

    # Initialize categories
    regions = ["head", "hair", "stomach", "legs", "feet", "arms"]
    body_index = {r: {"findings": [], "labs": [], "meds": []} for r in regions}

    # Group findings/labs/meds into their regions
    for f in findings:
        key = f.get("bodyPart") or f.get("region") or "general"
        body_index[to_region(key)]["findings"].append(f)

    for l in labs:
        key = l.get("relatedBodyPart") or "general"
        body_index[to_region(key)]["labs"].append(l)

    for m in meds:
        key = m.get("relatedBodyPart") or "general"
        body_index[to_region(key)]["meds"].append(m)

    # --- Build readable summary ---
    parts_present = sorted({to_region(f.get("bodyPart") or f.get("region") or "general") for f in findings})
    summary_bits = []
    if findings:
        summary_bits.append(f"{len(findings)} finding(s) noted, involving: {', '.join(parts_present)}.")
        if findings[0].get("impression"):
            summary_bits.append(f"Impression: {findings[0]['impression']}")
    if labs:
        summary_bits.append(f"{len(labs)} lab result(s) summarized.")
    if meds:
        summary_bits.append("Current meds: " + ", ".join(m.get("name", '?') for m in meds) + ".")
    if not summary_bits:
        summary_bits.append("No significant abnormalities described in this record.")

    summary = " ".join(summary_bits)

    return {
        "summary": summary,
        "bodyIndex": body_index,
        "patientName": data.get("patientName"),
        "examDate": data.get("examDate"),
    }


# -----------------------------
# STARTUP
# -----------------------------
@app.on_event("startup")
def on_startup():
    print(f"MedTwin server running with model: {DEFAULT_MODEL}")

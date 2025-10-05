# 🧠 Doc

## Overview
**Doc** is an AI-powered medical reasoning system that connects directly with a user’s **digital twin (Nomi)** to create a continuously updating model of health.  
It ingests clinical documents, lifestyle metrics, and contextual data to perform structured understanding, reasoning, and feedback generation — weaving a complete *web of health.*  

Doc acts as the **cognitive layer** of the ecosystem — interpreting, reasoning, and evolving alongside its user’s digital twin.

---

## 🩺 System Functionality
- **Unstructured Data Parsing:** Extracts diagnoses, medications, lab results, and physician notes from uploaded PDFs and EHR-like documents.  
- **Longitudinal Metric Integration:** Syncs daily metrics such as sleep, nutrition, exercise, hydration, and stress levels.  
- **Structured Health State Maintenance:** Continuously synchronizes insights to the user’s digital twin profile.  
- **Context-Aware Reasoning:** Uses LLMs (GPT-5, Llama-3, or SambaNova Cloud) to interpret health patterns and produce adaptive recommendations.  
- **Explainable Insight Generation:** Summarizes patient context, detects anomalies, and generates actionable feedback or next-step recommendations.  

---

## ⚙️ Tech Stack & Architecture
Doc is designed as a modular, multi-layered health reasoning system with a backend intelligence layer and real-time conversational interface.

---

### 🧩 Architecture Overview
User → Nomi (Digital Twin) → Doc (LLM Engine)
↓
Health State Engine ↔ Metric Storage
↓
Reasoning Layer → Output Insights


---

### 🧠 Backend & AI

| Component | Description |
|------------|-------------|
| **Language Model** | LLMs (GPT-5 / Llama-3 / SambaNova Cloud) for medical text understanding and reasoning. |
| **Data Understanding Layer** | OCR + entity extraction pipeline (spaCy + regex + MedCAT) to process PDFs, notes, and lab reports. |
| **Reasoning Layer** | Chain-of-thought + retrieval-augmented reasoning that correlates symptoms, trends, and conditions. |
| **Health State Engine** | Graph-based representation of user health data and relationships (Neo4j / NetworkX). |
| **Insight Generation** | Produces structured outputs: summaries, alerts, and recommendations. |

---

### 💻 Frontend & Interaction

| Component | Description |
|------------|-------------|
| **React / Next.js Dashboard** | Displays the digital twin (Nomi) and its evolving health state through interactive visualizations. |
| **Doc Chat Interface** | Natural-language chat interface that allows health queries with contextual recall. |
| **3D Twin Visualizer (Optional)** | Avatar dynamically reflects user’s health trends (posture, aura, glow). |

---

## 🩸 Data Integration
- **User Metrics:** Sleep, nutrition, hydration, exercise, mood, and vitals tracked daily.  
- **Clinical Data:** Uploaded PDFs (e.g., test results, prescriptions) parsed into structured JSON.  
- **Context Fusion:** Combines structured and unstructured data into a unified health state.  

---

## 🔐 Infrastructure

| Component | Purpose |
|------------|----------|
| **FastAPI / Flask** | Serves backend APIs and inference endpoints. |
| **PostgreSQL / Firebase** | Persistent storage for user profiles and longitudinal metrics. |
| **SambaNova Cloud API** | Handles high-context LLM inference. |
| **Docker** | Containerized deployment for reproducibility. |

---

## 🌐 Key Features
- Modular LLM reasoning architecture  
- Unified data ingestion pipeline (structured + unstructured)  
- Health-state evolution via graph-based context modeling  
- Explainable, traceable insight generation  
- Seamless integration between **Doc** and **Nomi** for full health-twin simulation  

---

## 🔄 How It Works
1. **Data Upload →** User uploads PDFs or syncs wearable/health data.  
2. **Parsing & Extraction →** Understanding layer extracts entities like diagnoses, vitals, and metrics.  
3. **Health Graph Update →** Information updates the health-state engine.  
4. **LLM Reasoning →** Contextual reasoning layer identifies risks and generates insights.  
5. **Insight Delivery →** Doc outputs structured recommendations, visual updates to Nomi, and optional clinician-facing summaries.  

---

## 🧬 Example Use Cases
- Early detection of potential nutritional deficiencies  
- Pattern recognition across multi-week biometric logs  
- Automatic doctor visit summaries and structured reports  
- Personalized “what-if” health simulations with Nomi  

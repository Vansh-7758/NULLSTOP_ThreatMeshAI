# ThreatMesh AI — Autonomous Supply Chain Defense Platform

> **Predict. Protect. Govern. Trust.**
> 
> ThreatMesh AI is the world's first autonomous AI Governance & Software Supply Chain Defense Platform. MODULE 1 — WATCH delivers real-time vulnerability monitoring, knowledge graph reachability analysis, adaptive trust scoring, and automated AI council remediation playbooks.

---

## 🏛️ System Architecture

```
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                         FRONTEND DASHBOARD (Next.js 14)                     │
 │  Next Router · Tailwind CSS · React Flow · Recharts · Framer Motion · WS    │
 └──────────────────────┬──────────────────────────────▲───────────────────────┘
                        │ HTTP / REST                  │ WebSockets (Pub/Sub)
 ┌──────────────────────▼──────────────────────────────┴───────────────────────┐
 │                           BACKEND API (FastAPI)                             │
 │   Lifespan DB Managers · Async Background Pipelines · Pydantic Validation   │
 └──────┬───────────────────────┬──────────────────────────────┬───────────────┘
        │                       │                              │
 ┌──────▼─────────────┐  ┌──────▼─────────────┐  ┌─────────────▼─────────────┐
 │ Neo4j Knowledge    │  │ PostgreSQL State   │  │ Redis Cache & Pub/Sub     │
 │ Graph (Cypher)     │  │ Engine (asyncpg)   │  │ (redis.asyncio)           │
 └────────────────────┘  └────────────────────┘  └───────────────────────────┘
```

---

## 🚀 MODULE 1 — WATCH Features

- **Multi-Format SBOM Ingestion:** Ingests CycloneDX v1.4+ and SPDX v2.2+ JSON dependency files.
- **Multi-Source Threat Intelligence:** Aggregates NVD, OSV.dev, and GitHub Security Advisories in real time with Redis caching.
- **Adaptive AI & Dependency Trust Graph (AADTG):** Calculates a 5-factor weighted Trust Score (0–100) based on CVE severity (30%), EPSS risk (25%), exploit code availability (20%), maintainer commit health (15%), and release cadence (10%).
- **Graph Reachability Analysis:** Traces shortest execution paths from application root to vulnerable components using Cypher queries in Neo4j.
- **Interactive Dependency Knowledge Graph:** Visualizes supply chain architecture with React Flow, color-coded node trust scores, and animated attack propagation path highlighting.
- **8-Agent AI Council Playbooks:** Synthesizes threat assessments, business blast radius, compliance framework mappings (NIST CSF, MITRE ATT&CK, OWASP, EU AI Act), and safe patch recommendations using Claude.
- **Attack Vector Replay Timeline:** Animated 8-step playback sequence visualizing how threats propagate through your dependency tree.
- **AI Governance & Guardrails:** Real-time prompt inspection engine enforcing SQL injection, PII, toxicity, and jailbreak prevention policies.
- **Automated AI Red Team Simulator:** Benchmark test suites evaluating AI model safety across 8 attack vectors.
- **Predictive Risk Engine:** Heuristic signal-based forecasting of future package vulnerabilities prior to official CVE disclosures.
- **Autonomous Remediation:** One-click automated GitHub Pull Request generation with non-breaking manifest updates.

---

## 🛠️ Quick Start & Local Execution

### 1. Configure Environment Variables
Copy `.env.example` to `.env` and configure your credentials:
```bash
cp .env.example .env
```

### 2. Launch Stack via Docker Compose
```bash
docker compose up --build
```

### 3. Or Run Locally Without Docker:

#### Start FastAPI Backend (Port 8000)
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --port 8000
```

#### Start Next.js Frontend (Port 3000)
```bash
cd frontend
npm install
npm run dev
```

---

## 🎬 Hackathon Demo Walkthrough (MODULE 1 — WATCH)

1. Open **[http://localhost:3000](http://localhost:3000)** in your browser.
2. Drag and drop **[`sample-sbom.json`](file:///d:/Hack4Humanity/threatmesh-ai/sample-sbom.json)** or **[`trial-sbom.json`](file:///d:/Hack4Humanity/threatmesh-ai/trial-sbom.json)** into the upload zone.
3. Watch the empty state transition seamlessly to the **Executive Cyber Health Dashboard**:
   - Cyber Health Score gauge animates to the calculated average trust score.
   - Summary stat cards display total package count, at-risk count, active CVEs, and open PRs.
   - Live Feed streams real-time pub/sub security events.
   - Critical Packages Table ranks vulnerable dependencies (`log4j-core`, `lodash`, `Pillow`).
4. Click **"Fix Package"** on any vulnerable row to trigger autonomous GitHub PR generation.
5. Click any package row to open the deep-dive **Scan Detail Page** (`/scan/{scan_id}`):
   - Interact with the React Flow dependency graph canvas.
   - Click the `log4j-core` node to open the side panel displaying the 5-factor ADTG score breakdown, active CVEs, and shortest attack path.
   - Replay the 8-step **Attack Vector Replay Timeline**.

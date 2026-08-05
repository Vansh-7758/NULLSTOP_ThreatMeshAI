# ThreatMesh AI Platform — Frontend Architecture & Design Specification (Redesign Blueprint)

## 📌 Document Overview & Purpose
This document provides a comprehensive technical blueprint defining the current frontend architecture, UI design system, user navigation flows, real-time WebSocket protocol, component hierarchy, and redesign guidelines for the **ThreatMesh AI Platform** dashboard.

Any frontend engineer tasked with redesigning, refactoring, or building new interfaces for this platform should follow this specification to ensure zero regressions on core capabilities while creating a state-of-the-art, premium cybersecurity experience.

---

## 🎨 1. Design System & Aesthetic Tokens

ThreatMesh AI uses a high-contrast, cyberpunk-inspired dark glassmorphism design system.

### Color Tokens (Tailwind CSS Mapping)
- **Root Background**: `#0D1117` (GitHub Dark High Contrast base canvas)
- **Primary Panel Background**: `#161B22` (Slightly elevated dark surface)
- **Inset / Sub-Container Background**: `#0D1117` or `#21262D`
- **Subtle Borders**: `#30363D` (1px clean gray dividers)

### Status & Accent Palette
- **Healthy / Passed (Emerald Green)**:
  - Text: `#00C896`
  - Background Badge: `rgba(0, 200, 150, 0.15)`
  - Border: `rgba(0, 200, 150, 0.30)`
- **Warning / Moderate Risk (Amber Gold)**:
  - Text: `#F0A500`
  - Background Badge: `rgba(240, 165, 0, 0.15)`
  - Border: `rgba(240, 165, 0, 0.30)`
- **Critical Risk / Compromised / Alert (Crimson Red)**:
  - Text: `#E84040`
  - Background Badge: `rgba(232, 64, 64, 0.15)`
  - Border: `rgba(232, 64, 64, 0.50)`
- **AI Reasoning / Knowledge Graph Layer (Cyber Purple)**:
  - Text: `#7C3AED`
  - Background Badge: `rgba(124, 58, 237, 0.15)`
  - Border: `rgba(124, 58, 237, 0.40)`

### Typography Standards
- **Body Font Family**: `Inter`, `Roboto`, `ui-sans-serif`, `system-ui`
- **Code & Metric Font Family**: `ui-monospace`, `SFMono-Regular`, `Consolas`, `JetBrains Mono`
- **Scale**:
  - H1 Page Titles: `text-2xl font-black`
  - H2 Section Titles: `text-base font-extrabold`
  - H3 Subsection Titles: `text-sm font-bold`
  - Body Copy: `text-xs leading-relaxed`
  - Badges & Metric Labels: `text-[10px] font-mono font-bold uppercase`

---

## 🏛️ 2. Overall Dashboard Navigation & Layout Architecture

The application is built using **Next.js 14 App Router** in [`frontend/app/page.tsx`](file:///d:/Hack4Humanity/threatmesh-ai/frontend/app/page.tsx).

### Layout Structure
1. **Header Navigation Bar**:
   - **Brand Identifier**: `ThreatMesh AI` logo with a pulsing status badge (`Live Graph Active`).
   - **Scan Context Indicator**: Displays `Scan ID: scan-xxx` or current active SBOM filename.
   - **Module Tab Switcher**:
     - 👁️ **WATCH** — Software Supply Chain Monitoring & Ingestion
     - 🎯 **HUNT** — Autonomous AI Threat Hunting & Playbooks
     - 🛡️ **DEFEND** — AI Governance, Red Team Service & Portfolio Defense

2. **Main Dynamic Body Area**:
   - Renders the active module component based on state (`activeTab = 'watch' | 'hunt' | 'defend'`).

3. **Global Live WebSocket Event Drawer / Notification Stream**:
   - Connects to `ws://localhost:8000/ws`.
   - Listens to live events (`scan_progress`, `vulnerability_found`, `trust_score_degraded`, `attack_path_found`, `attack_simulated`).

---

## 🔍 3. Module Specifications & UI Flows

### Module 1: WATCH (Supply Chain Monitoring & Ingestion)
- **Purpose**: Upload CycloneDX / SPDX SBOM files, visualize package dependency trees, discover CVEs, inspect attack path reachability, and compute ADTG trust scores.
- **Key UI Components**:
  - **SBOM Upload Box**: File drag-and-drop zone + 1-click sample SBOM preset buttons (`sample-sbom.json`, `sample-malicious-sbom.json`).
  - **Summary Metric Cards**: Monitored Packages, CVEs Found, At-Risk Count, Global Trust Score.
  - **Tabbed Inspector Views**: Packages Table, CVE List, Attack Paths Graph, AI Risk Predictions.

### Module 2: HUNT (Autonomous AI Threat Hunting)
- **Purpose**: Autonomous AI multi-agent team (Threat, Trust, Risk, Patch, Compliance, Safety, Governance agents) hunting zero-day threats and generating remediation playbooks.
- **Key UI Components**:
  - **Hunt Execution Bar**: "Start Autonomous AI Threat Hunt" trigger button & live progress status.
  - **Playbook Inspector**: Executive threat playbooks per package with threat mechanics, business impact, compliance mapping, and 1-click **"Generate PR Remediation Patch"**.
  - **AI Copilot Chat**: RAG assistant powered by Claude (`claude-sonnet-4-6`).

### Module 3: DEFEND (Governance, Red Team & Portfolio Defense)
Divided into 3 sub-sections:
1. **AI Governance & Compliance**:
   - EU AI Act Article 15 & ISO 42001 compliance analyzer.
   - Domain signal checkers, interactive questionnaire, confidence scorer, and report generator.

2. **AI Red Team as a Service**:
   - **Target Config Modal (`AIProductConfigModal.tsx`)**: Target Endpoint URL, Product Type (RAG, Chatbot, Agent, LLM API), write-only API key encryption, and consent gate checkbox.
   - **Red Team Suite (`RedTeamSection.tsx`)**: 8 Attack Vectors (Prompt Injection, Jailbreak, Hallucination, System Prompt Override, Data Leakage, Agent Hijacking, Toxicity/Bias, RAG Poisoning).
   - **Probe Inspector Modal**: Details prompt payload, target HTTP response, LLM judge verdict (`PASS`/`FAIL`), reasoning, and remediation.
   - **Trend Chart (`RedTeamHistoryChart.tsx`)**: Recharts historical safety score line chart.

3. **Multi-Tenant Enterprise Portfolio Defense (`MultiTenantSection.tsx` & `TenantCard.tsx`)**:
   - **Dedicated On-Page Multi-SBOM Uploader**: Upload App #1 and App #2 SBOM files directly on the page to build shared package nodes in Neo4j (or click `⚡ 1-Click Hackathon Demo Setup`).
   - **Supply Chain Attack Propagation Simulator**: Attack package preset buttons (`lodash`, `log4j-core`, `axios`), degraded score slider, and `Simulate Attack & Propagate` trigger button.
   - **Split-Screen Tenant Portfolio Cards (`TenantCard.tsx`)**:
     - Circular SVG Cyber Health Score Gauge (updates real-time on WS broadcast).
     - Shared ADTG Packages list with badge highlights.
     - Staggered 300ms visual flash border animation.
     - **Expandable Detailed Technical Analysis Panel**: Plain-text breakdown explaining Zero-Day Vulnerability Discovery ➔ Neo4j `HAS_PACKAGE` Edge Resolution ➔ Staggered 300ms Health Drop ➔ Recommended Container Isolation & Patch Deployment.

---

## ⚡ 4. Real-Time WebSocket Protocol & State Management

### Connection Endpoint
`ws://localhost:8000/ws` (managed by `wsClient` in [`frontend/lib/websocket.ts`](file:///d:/Hack4Humanity/threatmesh-ai/frontend/lib/websocket.ts)).

### `attack_simulated` Event Schema
```json
{
  "event_type": "attack_simulated",
  "package_name": "lodash",
  "new_trust_score": 10.0,
  "triggered_by": "tenant-fintech",
  "banner_message": "One compromised package (lodash) in Fintech immediately lowered trust scores across Healthcare via the shared ADTG layer.",
  "affected_tenants": [
    { "tenant_id": "tenant-1", "tenant_name": "Fintech Mobile App", "old_score": 88.5, "new_score": 15.0, "stagger_ms": 0 },
    { "tenant_id": "tenant-2", "tenant_name": "Healthcare Patient Portal", "old_score": 92.0, "new_score": 34.6, "stagger_ms": 300 }
  ]
}
```

### Critical State Management Rules
1. **Real-Time Synchronous Gauge Updates**: When an `attack_simulated` event arrives, components MUST update `tenants` state array synchronously in React memory so gauges and status badges re-render immediately.
2. **Event Deduplication**: Deduplicate incoming WebSocket logs by checking `package_name` and `new_trust_score` against the latest log (`prev[0]`) to prevent duplicate list rendering.

---

## 🚀 5. Redesign Recommendations for Frontend Engineers

When redesigning or upgrading this frontend:
1. **Interactive D3 / Canvas Node Graph Visualizer**: Replace simple text badges for shared packages with a 2D canvas node graph visualizer. When an attack is simulated, animate red threat pulses traveling down graph edges from package nodes to tenant nodes with a 300ms wave effect!
2. **Smooth Count-Up Animations**: Use Framer Motion and animated counter hooks for circular score gauges (`0` ➔ `88.5` ➔ `15.0`).
3. **Glassmorphism Header Bar**: Implement sticky top navigation with backdrop blur (`backdrop-blur-md bg-[#0D1117]/80`).
4. **Decoupled Modular Architecture**: Keep all components modular with strict TypeScript interfaces (`Tenant`, `RedTeamReport`, `ComplianceReport`, `PropagationEvent`).

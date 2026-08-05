# ThreatMesh AI — Next-Gen Frontend Redesign & Landing Page Mega-Prompt

You are a principal frontend architect and staff UI engineer specializing in high-performance cybersecurity dashboards, interactive node graph visualizers, and enterprise SaaS landing pages. You write production-grade Next.js 15+, React 19, and TypeScript code with zero placeholders, zero TODOs, and full accessibility.

You are tasked with redesigning the frontend of ThreatMesh AI, an autonomous software supply chain defense and AI governance platform. The current application suffers from information crowding—too many dense cards, tables, and live logs competing for user attention simultaneously.

Your task is to implement a complete frontend architecture redesign based on **Progressive Disclosure** ("Show the answer first, show the evidence on demand"), introducing a dedicated enterprise Landing Page and a spacious, high-impact Cybersec Dashboard.

---

## 🎨 Tech Stack & Design System

### Framework & Libraries
- **Core**: Next.js 15+ (App Router), React 19, TypeScript (Strict Mode)
- **Styling**: Tailwind CSS v4, CSS Modules for custom canvas effects
- **Icons & UI Primitives**: Lucide Icons (`lucide-react`), Radix UI primitives (`@radix-ui/react-dialog`, `@radix-ui/react-tabs`, `@radix-ui/react-[#...`)
- **Animations**: `motion` (Framer Motion successor) for layout transitions, micro-interactions, and cinematic state shifts
- **Graph Visualizer**: React Flow or D3 / Cytoscape.js canvas for interactive 2D supply chain dependency graph rendering
- **Charts**: Recharts for historical safety score trend lines

### Theme & Color Tokens (Dark Cyberpunk Glassmorphism)
- **Base Canvas (`root`)**: `#0D1117` (GitHub Dark High Contrast base)
- **Elevated Panels**: `#161B22` with 1px subtle `#30363D` borders
- **Surface Insets**: `#0D1117` or `#21262D`
- **Healthy / Clean**: `#00C896` (Emerald Green) | `rgba(0, 200, 150, 0.15)`
- **Warning / Moderate**: `#F0A500` (Amber Gold) | `rgba(240, 165, 0, 0.15)`
- **Critical / Threat**: `#E84040` (Crimson Red) | `rgba(232, 64, 64, 0.15)`
- **AI Graph / Council**: `#7C3AED` (Cyber Purple) | `rgba(124, 58, 237, 0.15)`
- **Typography**: Primary `Inter` / System Sans, Mono `SFMono-Regular` / `JetBrains Mono`

---

## 🌐 1. Enterprise Project Landing Page (`/` or `/landing`)

Build a dedicated, high-converting enterprise landing page for ThreatMesh AI that introduces the platform to CISOs, DevOps teams, and AI security leaders.

### Landing Page Sections & Features
1. **Hero Header & Navigation**:
   - Brand Logo: **ThreatMesh AI** with pulsing `Autonomous AI Supply Chain & EU AI Act Defense` badge.
   - Nav Links: Features, Architecture, Compliance (EU AI Act / ISO 42001), Pricing, Documentation.
   - Action Buttons: `Launch Platform Dashboard` (links to `/dashboard`) and `Book Enterprise Demo`.
2. **Interactive Hero Canvas Section**:
   - Large bold headline: *"Autonomous Defense for Your Entire AI Software Supply Chain"*
   - Subtitle: *"Detect zero-days, evaluate adversarial LLM risks, and protect multi-application portfolios in real time using shared Neo4j knowledge graphs."*
   - Interactive 3D/2D background grid canvas rendering animated threat nodes connected by cyber mesh edges.
   - Interactive Security Score Estimator widget directly in hero section.
3. **Core Capability Showcases (4 Key Pillars)**:
   - **Pillar 1: ADTG Package Trust Layer**: Dynamic graph-based trust scoring across open-source dependencies.
   - **Pillar 2: Autonomous AI Threat Hunting**: 7 multi-agent AI personas executing zero-day threat hunts & automated PR remediation.
   - **Pillar 3: AI Red Team as a Service**: Adversarial evaluation suite testing 8 LLM attack vectors against EU AI Act Article 15 rubrics.
   - **Pillar 4: Multi-Tenant Enterprise Portfolio Defense**: Shared Neo4j dependency graph broadcasting cross-tenant blast radius drops in < 50ms via WebSockets.
4. **Live Interactive Feature Teaser**:
   - Interactive tabbed widget allowing visitors to simulate an attack on package `lodash` and watch a mini portfolio score drop animation in real time right on the landing page!
5. **Regulatory Compliance Standards Section**:
   - Badges & cards for **EU AI Act Article 15**, **ISO/IEC 42001**, **NIST AI RMF**, and **SOC2 Type II**.
6. **Enterprise Footer**:
   - Site sitemap, security policy disclosures, status page link, and copyright notices.

---

## 🖥️ 2. Redesigned Dashboard Architecture (`/dashboard`)

### Header Navigation Bar
- Thin 60px glassmorphism header bar with `backdrop-blur-md bg-[#0D1117]/80`.
- Left: ThreatMesh AI Brand + Pulse Status (`Live Graph Active`).
- Center: Active Scan context dropdown (`Scan ID: scan-xxx` or active SBOM file name).
- Right: Module Switcher (`WATCH`, `HUNT`, `DEFEND`), WebSocket connection indicator, and Floating Notification Bell Shade.

---

### Module 1: WATCH (Graph-First Layout & Progressive Disclosure)
*Answer to user: "Is my software safe right now?"*

#### Layout Structure (3 Horizontal Zones)
- **Zone 1 (Top 80px Metrics Strip)**:
  - 4 large numbers with maximum whitespace: **Total Packages** (`48`), **At Risk** (`3`), **Active CVEs** (`12`), **Health Score** (`88.5/100`).
  - Clean typography without heavy borders or cards competing for attention.
- **Zone 2 (65% Screen Height Dependency Graph Canvas)**:
  - Interactive React Flow / Canvas 2D dependency graph taking 65% of the screen.
  - Nodes represent packages color-coded by ADTG trust score (Green >= 75, Amber 50-74, Red < 50).
  - Hovering a node highlights its dependency edges; clicking a node opens Zone 3.
- **Zone 3 (Collapsible 320px Right Drawer)**:
  - Default state: Collapsed (thin right edge).
  - Sliding open when a package node is clicked: displays full package details, purl, trust score breakdown, CVE list, attack path reachability, and 1-click remediation actions.
- **Floating Notification Shade (Top Right Bell)**:
  - WebSocket event stream renders inside a slide-down notification shade instead of cluttering the main screen. Auto-closes after 5 seconds of inactivity.
- **Bottom Sheet Drawer (Predictions & Playbooks)**:
  - Subtle tab at bottom: `"3 Predictions · 2 Playbooks"`. Clicking slides up a half-height overlay for deep inspection.

---

### Module 2: HUNT (Cinematic Council Animation & Two-Mode Workflow)
*Answer to user: "What is the threat and what do I do?"*

#### Two-Mode Interface Transition
1. **Pre-Hunt Mode**:
   - Centered card on a clean dark background.
   - Shows count of at-risk packages, a single explanatory sentence, and one large prominent button: `🚀 Start Autonomous AI Threat Hunt`.
2. **During-Hunt Mode (Cinematic 40/60 Split-Screen)**:
   - **Left 40% (Package List)**: Clean vertical list of package names with a pulsing status dot indicating the package currently under analysis.
   - **Right 60% (Cinematic Council Visualization)**:
     - 7 specialist agent nodes arranged in a circular ring surrounding the **Consensus Engine** node in the center.
     - Agents: Threat Agent, Trust Agent, Risk Agent, Patch Agent, Compliance Agent, Safety Agent, Governance Agent.
     - As each agent completes analysis, its node in the ring lights up with color and displays a 1-line verdict.
     - When all 7 complete, glowing laser lines connect each agent to the central node, and the **Consensus Playbook** expands outward from the center.
   - **Consensus Playbook Render**:
     - Rendered below the council ring with generous padding.
     - Large-type Threat Summary, supporting details, 1-click **"Generate PR Remediation Patch"** button, and compliance badges.
   - **Floating Copilot Assistant**: Expanding drawer button for asking AI security questions.

---

### Module 3: DEFEND (Sidebar Navigation & Portfolio Defense)
*Answer to user: "Am I compliant and is my AI trustworthy?"*

#### Layout Structure (200px Left Sidebar + Active View)
- **Sidebar Items**:
  1. **Governance**: Split into two spacious panels:
     - Left Panel: "AI Agent Safety" (today's policy check count, block rate, terminal-style audit log with generous line height).
     - Right Panel: "Regulatory Compliance" (5 framework cards: EU AI Act, ISO 42001, NIST AI RMF, SOC2). Clicking "Start Assessment" launches a full-screen questionnaire flow.
  2. **Red Team**:
     - Large centered AI Safety Score Gauge (`94.2/100`).
     - 8 Test Vector Cards arranged in a single horizontal scrollable carousel (Prompt Injection, Jailbreak, Hallucination, System Prompt Override, Data Leakage, Agent Hijacking, Toxicity/Bias, RAG Poisoning).
     - Target Config Modal (`AIProductConfigModal.tsx`) with endpoint config, write-only API key, and consent gate.
     - Recharts historical safety score trend chart.
     - Probe Inspector Modal for inspecting prompt/response payloads and LLM judge rubrics.
  3. **Compliance**:
     - Complete EU AI Act Article 15 gap analysis report & remediation roadmap.
  4. **Portfolio (Multi-Tenant Defense)**:
     - **On-Page Multi-SBOM Upload Panel**: Upload App #1 and App #2 SBOM files directly on the page, or click `⚡ 1-Click Hackathon Demo Setup`.
     - **Attack Simulator Bar**: Select target package (`lodash`, `log4j-core`, `axios`), set degraded score slider, click `Simulate Attack & Propagate`.
     - **Split-Screen Layout**:
       - Left: Clean vertical list of registered portfolio applications showing health scores as horizontal progress bars.
       - Right: Attack simulator controls & real-time WebSocket event log.
     - **Real-Time Animation**: When an attack is simulated, affected rows on the left flash red with a 300ms staggered delay, and their health bars shrink dynamically.
     - **Expandable Detailed Technical Analysis Panel**: Toggles open inline showing Zero-Day Vulnerability Discovery ➔ Neo4j `HAS_PACKAGE` Edge Resolution ➔ Staggered Score Drop ➔ Container Isolation & PR Patch Guidance.

---

## ⚡ 5. State Management & Real-Time WebSocket Handlers

- **WebSocket Endpoint**: `ws://localhost:8000/ws`
- **Real-Time State Updates**:
  ```typescript
  // Synchronous React memory update on WebSocket broadcast
  if (msg.event_type === 'attack_simulated' && Array.isArray(msg.affected_tenants)) {
    setTenants((prevTenants) =>
      prevTenants.map((t) => {
        const affected = msg.affected_tenants.find((at) => at.tenant_id === t.id);
        if (affected) {
          return {
            ...t,
            cyber_health_score: affected.new_score,
            status: affected.new_score < 50 ? 'critical' : affected.new_score < 75 ? 'warning' : 'healthy',
            critical_packages_count: (t.critical_packages_count || 0) + 1
          };
        }
        return t;
      })
    );
  }
  ```
- **Event Deduplication**: Deduplicate incoming WebSocket logs by checking `package_name` and `new_trust_score` against `prev[0]`.

---

## 📁 6. Folder Structure

```
frontend/
├── app/
│   ├── layout.tsx
│   ├── page.tsx (Dedicated Enterprise Landing Page)
│   ├── dashboard/
│   │   ├── page.tsx (Main Cybersec Dashboard Shell)
│   │   ├── watch/
│   │   ├── hunt/
│   │   └── defend/
│   └── api/
├── components/
│   ├── landing/
│   │   ├── HeroCanvas.tsx
│   │   ├── FeaturePillars.tsx
│   │   ├── InteractiveDemoTeaser.tsx
│   │   └── ComplianceBadges.tsx
│   ├── layout/
│   │   ├── HeaderNav.tsx
│   │   ├── DefendSidebar.tsx
│   │   └── NotificationShade.tsx
│   ├── watch/
│   │   ├── MetricsStrip.tsx
│   │   ├── DependencyGraphCanvas.tsx
│   │   ├── PackageDetailDrawer.tsx
│   │   └── PredictionsBottomSheet.tsx
│   ├── hunt/
│   │   ├── PreHuntCard.tsx
│   │   ├── CouncilRingVisualizer.tsx
│   │   ├── ConsensusPlaybookCard.tsx
│   │   └── CopilotDrawer.tsx
│   ├── defend/
│   │   ├── GovernancePanel.tsx
│   │   ├── RedTeamSection.tsx
│   │   ├── AIProductConfigModal.tsx
│   │   ├── RedTeamHistoryChart.tsx
│   │   ├── ProbeInspectorModal.tsx
│   │   ├── MultiTenantSection.tsx
│   │   └── TenantCard.tsx
│   └── ui/
├── lib/
│   ├── api.ts
│   ├── websocket.ts
│   └── utils.ts
├── types/
│   └── index.ts
└── DESIGN_SPECIFICATION.md
```

---

## 🎯 Implementation Directives for AI Engineer
1. Build every file completely with full code, imports, and TypeScript typing. No placeholders or TODOs.
2. Maintain zero regressions on existing backend API contracts (`/api/scan`, `/api/hunt`, `/api/defend/tenants`, `/api/defend/red-team`).
3. Ensure generous padding (`padding: 24px - 32px`), high typography scale contrast (3x size ratio for key numbers), and progressive disclosure across all views.

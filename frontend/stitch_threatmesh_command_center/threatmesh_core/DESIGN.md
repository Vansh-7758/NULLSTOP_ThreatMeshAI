---
name: ThreatMesh Core
colors:
  surface: '#131319'
  surface-dim: '#131319'
  surface-bright: '#393840'
  surface-container-lowest: '#0e0e14'
  surface-container-low: '#1b1b21'
  surface-container: '#1f1f26'
  surface-container-high: '#2a2930'
  surface-container-highest: '#35343b'
  on-surface: '#e4e1ea'
  on-surface-variant: '#ccc3d8'
  inverse-surface: '#e4e1ea'
  inverse-on-surface: '#303037'
  outline: '#958da1'
  outline-variant: '#4a4455'
  surface-tint: '#d2bbff'
  primary: '#d2bbff'
  on-primary: '#3f008e'
  primary-container: '#7c3aed'
  on-primary-container: '#ede0ff'
  inverse-primary: '#732ee4'
  secondary: '#b4c5ff'
  on-secondary: '#002a78'
  secondary-container: '#0053db'
  on-secondary-container: '#cdd7ff'
  tertiary: '#ffb4ab'
  on-tertiary: '#690005'
  tertiary-container: '#cb161c'
  on-tertiary-container: '#ffdeda'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#eaddff'
  primary-fixed-dim: '#d2bbff'
  on-primary-fixed: '#25005a'
  on-primary-fixed-variant: '#5a00c6'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#ffdad6'
  tertiary-fixed-dim: '#ffb4ab'
  on-tertiary-fixed: '#410002'
  on-tertiary-fixed-variant: '#93000b'
  background: '#131319'
  on-background: '#e4e1ea'
  surface-variant: '#35343b'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.08em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-page: 24px
  panel-padding: 12px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style
The design system is engineered for the **ThreatMesh AI** platform, targeting cybersecurity analysts and DevSecOps engineers. The brand personality is authoritative, vigilant, and ultra-precise—evoking the high-stakes environment of a global security operations center (SOC).

The aesthetic is **Operational-Dark**, blending **Minimalism** with **Glassmorphism** and **Technical Brutalism**. 
- **The "War Room" Narrative:** Every screen is a mission-critical terminal. Information density is prioritized over whitespace, using structured grids and monospaced data streams to communicate intelligence at scale.
- **Visual Metaphor:** Data is treated as physical energy. High-risk vectors use vibrant, glowing "hot" colors (Red/Purple), while stable infrastructure remains "cold" (Deep Blue/Cyan).
- **Depth:** Surfaces use multi-layered transparency and background blurs to create a sense of looking through a tactical glass overlay.

## Colors
The palette is rooted in a "Cold Blue-Black" spectrum to minimize eye strain during long-term monitoring. 

- **Module Identity:** Color functions as a primary navigation cue. **Purple (WATCH)** denotes visibility and ingestion; **Blue (HUNT)** denotes active analysis; **Red (DEFEND)** denotes remediation and crisis.
- **Contrast Ratios:** Text must maintain high legibility against dark backgrounds. Use the White Secondary (#94A3B8) for most body content to reduce "vibrance bleed," reserving White Primary (#F8FAFC) for critical headings and active states.
- **Data/Metrics:** Cyan (#06B6D4) is exclusively used for non-critical telemetry and system health metrics to distinguish from alert-level colors.

## Typography
This design system utilizes a tri-font hierarchy to separate intent:
- **Space Grotesk:** Used for high-level navigation, page titles, and module headers. Its geometric structure feels mechanical and engineered.
- **Inter:** The workhorse for documentation, tooltips, and long-form descriptions where readability is paramount.
- **JetBrains Mono:** Used for all "Live" data. This includes IP addresses, SHA-256 hashes, console logs, and numerical metrics. This font signals to the user that the information is raw and machine-generated.

## Layout & Spacing
The layout follows a **Fixed-Grid Technical** model. On desktop and ultrawide, the dashboard uses a "tiled terminal" approach where the screen is divided into functional sectors.

- **Information Density:** Use a tight 4px baseline grid. 
- **Layout Model:** A 12-column grid system is used, but content is largely contained within "Panels" that have a fixed padding of 12px.
- **Responsive Behavior:** 
  - **Ultrawide:** Side-car panels for "Watch List" and "Global Health" stay pinned.
  - **Desktop:** Side panels collapse into icons or hide behind a toggle.
  - **Mobile:** Single column flow; charts and complex data tables are replaced by simplified summary cards.

## Elevation & Depth
Elevation is not achieved through traditional dropshadows, but through **Luminance and Blur**.

- **Z-0 (Base):** Primary Background (#09090F). 
- **Z-1 (Panels):** Card Background (#0F0F1A) with a 1px Border Default (#1E1E3A).
- **Z-2 (Active/Hover):** Background Elevated (#141428) with a 1px Border Accent (#2D2D5E).
- **Overlays (Modals/Popovers):** 70% opacity background with a `backdrop-filter: blur(20px)`. This creates the "Glassmorphism" effect, allowing the "War Room" data underneath to remain dimly visible, suggesting the system is always running in the background.
- **BorderGlow:** Active cards or high-priority alerts should use a 2px inner-glow matching the module's primary color (e.g., Purple for WATCH).

## Shapes
The design system uses a **Soft (0.25rem)** roundedness to maintain a professional, architectural feel. 
- Avoid pill shapes except for status indicators (chips). 
- Buttons and Card containers should remain strictly at the base roundedness (4px) to feel structural.
- **Interactive States:** On hover, borders should sharpen or glow rather than increase in roundedness. 
- **Attack Paths:** Use 2px dashed lines with `stroke-dasharray` animations to visualize movement between nodes in the supply chain.

## Components
- **Terminal Logs:** Monospaced text panels with a slightly darker background (#05050A). Use syntax highlighting for logs: green for success, amber for warnings, and red for errors.
- **BorderGlow Cards:** Standard cards with a thin top or left-edge accent line colored by module (Purple, Blue, Red). High-alert cards feature a subtle radial pulse glow.
- **Data Grids:** High-density tables with no vertical borders. Use horizontal dividers at 10% opacity. Row height should be fixed at 32px for maximum data visibility.
- **Module Focus Rings:** Standard focus states are replaced by a 2px solid ring using the specific module's color (WATCH = Purple, etc.) with a 4px blur spread.
- **Attack Path Visualizer:** Uses nodes with a 1px Border Accent. Connection lines are animated dashes. If a path is "compromised," the line color shifts to Red.
- **Input Fields:** Flat styling. No background (transparent) with a 1px bottom border. On focus, the border transitions to a full outline with the primary accent.
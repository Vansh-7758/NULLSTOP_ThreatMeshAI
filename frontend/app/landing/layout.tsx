import type { Metadata } from "next";
import "./landing.css";

export const metadata: Metadata = {
  title: "ThreatMesh AI — Autonomous Supply Chain Defense",
  description: "Predict. Protect. Govern. Trust. The world's first autonomous AI Governance & Software Supply Chain Defense Platform.",
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="landing-page">
      {children}
    </div>
  );
}

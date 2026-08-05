// frontend/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/shared/Navbar";
import DitherBackground from "@/components/ui/DitherBackground";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ThreatMesh AI | Autonomous Supply Chain Defense",
  description: "Autonomous AI Software Supply Chain Defense Platform - WATCH, HUNT, and DEFEND.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#09090F] text-[#E4E1EA] min-h-screen flex flex-col relative`}>
        {/* Dynamic Dither Canvas WebGL Background Layer (Client-side rendered) */}
        <div className="fixed inset-0 z-0 pointer-events-auto opacity-40">
          <DitherBackground
            waveColor={[0.49, 0.23, 0.93]}
            waveSpeed={0.04}
            waveFrequency={2.5}
            waveAmplitude={0.25}
            colorNum={4}
            pixelSize={2}
            enableMouseInteraction={true}
            mouseRadius={0.4}
          />
        </div>

        {/* Scanline Overlay */}
        <div className="scanline" />

        {/* Content Container */}
        <div className="relative z-10 flex-1 flex flex-col">
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

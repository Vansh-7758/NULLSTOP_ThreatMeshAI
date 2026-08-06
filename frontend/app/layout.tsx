// frontend/app/layout.tsx
import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/shared/Navbar";
import DitherBackground from "@/components/ui/DitherBackground";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
});

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
      <body className={`${plusJakartaSans.className} ${inter.className} bg-[#1B1931] text-[#E9BCB9] min-h-screen flex flex-col relative selection:bg-[#ED9E58]/30 selection:text-white`}>
        {/* Dynamic Dither Canvas WebGL Background Layer (Client-side rendered) */}
        <div className="fixed inset-0 z-0 pointer-events-auto opacity-30">
          <DitherBackground
            waveColor={[0.64, 0.25, 0.33]}
            waveSpeed={0.03}
            waveFrequency={2.2}
            waveAmplitude={0.20}
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

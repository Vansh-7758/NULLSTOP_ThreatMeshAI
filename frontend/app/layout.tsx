import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/shared/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ThreatMesh X - AI Trust & Supply Chain Defense",
  description: "Autonomous, multi-agent software supply chain threat intelligence platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-background text-text-primary min-h-screen flex flex-col`}>
        <Navbar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </body>
    </html>
  );
}

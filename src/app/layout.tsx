import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import ClientShell from "@/components/ClientShell";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TerraBloom — Your choices shape the world you live in",
  description:
    "A living AI sustainability platform. Track your environmental impact through a cinematic 3D city that reflects your lifestyle.",
  keywords: ["sustainability", "carbon footprint", "AI", "environment", "green living"],
  openGraph: {
    title: "TerraBloom",
    description: "Your choices shape the world you live in.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable}>
      <body style={{ background: "#000", color: "#fff", minHeight: "100vh" }}>
        <a href="#main-content" className="skip-nav">Skip to content</a>
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}

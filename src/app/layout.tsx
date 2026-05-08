import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

import { brand } from "@/lib/copy";
import { SiteHeader } from "@/components/layout/site-header";
import { DisclaimerModal } from "@/components/disclaimer-modal";

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: `${brand.name} — ${brand.tagline}`,
  description: brand.shortDescription,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${sans.variable} ${mono.variable} h-full`}
      style={{ background: "var(--bg-base)" }}
    >
      <body
        className="h-full flex flex-col"
        style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
      >
        <SiteHeader />
        <div className="flex-1 flex flex-col min-h-0">{children}</div>
        <DisclaimerModal />
      </body>
    </html>
  );
}

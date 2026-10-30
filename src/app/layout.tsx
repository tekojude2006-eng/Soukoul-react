import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { IBM_Plex_Sans, Source_Serif_4 } from "next/font/google";
import { Pwa } from "@/components/Pwa";
import "./globals.css";

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans-actual",
});

const display = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-display-actual",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Soukoul — Université",
  description: "Espace numérique de travail de l'Université Soukoul.",
  applicationName: "Soukoul",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Soukoul",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#efe8dc",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${sans.variable} ${display.variable}`}>
      <body className={`${sans.className} antialiased`}>
        <Pwa />
        {children}
      </body>
    </html>
  );
}

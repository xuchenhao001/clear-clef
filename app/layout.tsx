import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Geist_Mono, Public_Sans, Spectral } from "next/font/google";
import { ThemeInit } from "@/components/theme-init";
import "./globals.css";

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spectral = Spectral({
  variable: "--font-spectral",
  subsets: ["latin"],
  weight: ["600"],
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: {
    default: "ClearClef",
    template: "%s · ClearClef",
  },
  description:
    "Public catalog of Common Western Musical Notation scores. MusicXML on Cloudflare.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${publicSans.variable} ${geistMono.variable} ${spectral.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeInit />
      </head>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}

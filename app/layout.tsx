import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Geist_Mono, Public_Sans } from "next/font/google";
import localFont from "next/font/local";
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

// The serifs are self-hosted rather than pulled from the Google subset, which
// strips the OpenType features we rely on: real small capitals (smcp/c2sc) for
// running heads, credit labels and the colophon, and discretionary ligatures.
// The files are subset to Latin, so other scripts fall back to the stack below.
// next/font requires these values to be written literally at each call.
const ebGaramond = localFont({
  src: "./fonts/eb-garamond.woff2",
  variable: "--font-garamond",
  weight: "400 600",
  style: "normal",
  display: "swap",
  adjustFontFallback: "Times New Roman",
  fallback: [
    "Songti SC",
    "SimSun",
    "Noto Serif CJK SC",
    "Source Han Serif SC",
    "ui-serif",
    "Georgia",
    "serif",
  ],
});

const cormorantGaramond = localFont({
  src: "./fonts/cormorant-garamond.woff2",
  variable: "--font-cormorant",
  weight: "400 600",
  style: "normal",
  display: "swap",
  adjustFontFallback: "Times New Roman",
  fallback: [
    "Songti SC",
    "SimSun",
    "Noto Serif CJK SC",
    "Source Han Serif SC",
    "ui-serif",
    "Georgia",
    "serif",
  ],
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
      className={`${publicSans.variable} ${geistMono.variable} ${ebGaramond.variable} ${cormorantGaramond.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeInit />
      </head>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}

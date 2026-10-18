import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Bitter, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { ThemeInit } from "@/components/theme-init";
import "./globals.css";

// ClearClef is dressed from the Red Dead Redemption menus: type laid straight on
// a near-black ground, hairline rules, torn edges, and a single saturated
// vermilion for what is live. Paper appears only where the content is a
// document — the folio a score is read on. The game's UI uses two voices and no
// more, and ClearClef does the same: anything set in CAPITALS is Bitter, an
// Egyptian slab; anything set in sentence case is EB Garamond, the reading
// serif; technical strings stay in Geist Mono. No third display face, no sans.
const bitter = Bitter({
  variable: "--font-bitter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// The reading serif is self-hosted rather than pulled from the Google subset,
// which strips the OpenType features we rely on: real small capitals (smcp/c2sc)
// and discretionary ligatures. The file is subset to Latin, so other scripts
// fall back to the stack below. next/font requires these values to be written
// literally.
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
      className={`${bitter.variable} ${geistMono.variable} ${ebGaramond.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeInit />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        {children}
      </body>
    </html>
  );
}

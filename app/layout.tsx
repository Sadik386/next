import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NextGen Cloud POS — Precision POS & Inventory Operating System",
  description: "High-density retail POS terminal, multi-warehouse inventory control, automated revenue ledger, and commerce intelligence.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-[100dvh] bg-[#f8fafc] text-[#18181b] antialiased selection:bg-blue-100 selection:text-blue-900 font-sans">
        {children}
      </body>
    </html>
  );
}

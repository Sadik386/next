import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Suspense } from "react"; // Import Suspense

const inter = Inter({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Accoraze",
  description: "Business Operating System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.className}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{const t=localStorage.getItem('theme');if(t==='dark')document.documentElement.classList.add('dark');const b=localStorage.getItem('accoraze_brandColor');if(b)document.documentElement.style.setProperty('--brand',b)}catch(e){}`,
          }}
        />
      </head>
      <body>
        {children} {/* Wrap children in Suspense */}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MediS",
  description: "Sistema inteligente para analise de crescimento de plantas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('medis-theme') || 'light';
                  const primaryId = localStorage.getItem('medis-primary') || 'ocean';
                  
                  const COLOR_PRESETS = {
                    ocean: { primary: '#2563eb', primaryDark: '#1d4ed8' },
                    jade: { primary: '#10b981', primaryDark: '#059669' },
                    amber: { primary: '#f59e0b', primaryDark: '#d97706' },
                    rose: { primary: '#e11d48', primaryDark: '#be123c' },
                    slate: { primary: '#0f766e', primaryDark: '#115e59' }
                  };
                  
                  const preset = COLOR_PRESETS[primaryId] || COLOR_PRESETS.ocean;
                  const root = document.documentElement;
                  
                  root.dataset.theme = theme;
                  root.style.setProperty('--primary', preset.primary);
                  root.style.setProperty('--primary-dark', preset.primaryDark);
                } catch (e) {
                  // Falha silenciosa
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Toaster position="top-right" />
        {children}
      </body>
    </html>
  );
}

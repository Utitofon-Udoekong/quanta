"use client";
import { Inter } from 'next/font/google';
import './globals.css';
import { AbstraxionProvider } from "@burnt-labs/abstraxion";
import "@burnt-labs/abstraxion/dist/index.css";
import "@burnt-labs/ui/dist/index.css";
import { XionProvider } from './components/xion/XionProvider';
import { treasuryConfig } from './lib/services/xion';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AbstraxionProvider config={treasuryConfig}>
          <XionProvider>
            {children}
          </XionProvider>
        </AbstraxionProvider>
      </body>
    </html>
  );
}

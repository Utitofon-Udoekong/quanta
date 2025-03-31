"use client";
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { XionProvider } from './components/xion/XionProvider';
import './globals.css';
import { AbstraxionProvider } from '@burnt-labs/abstraxion';
import { treasuryConfig } from './lib/services/xion';

const inter = Inter({ subsets: ['latin'] });

const metadata: Metadata = {
  title: 'QUANTA - Web3 Content Platform',
  description: 'A decentralized content platform powered by XION',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
      <AbstraxionProvider config={treasuryConfig}>
        <XionProvider>
          {children}
          <Toaster position="bottom-right" />
        </XionProvider>
        </AbstraxionProvider>
      </body>
    </html>
  );
}

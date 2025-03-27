"use client";
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { XionProvider } from './components/xion/XionProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
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
        <XionProvider>
          {children}
          <Toaster position="bottom-right" />
        </XionProvider>
      </body>
    </html>
  );
}

"use client";

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AbstraxionProvider } from '@burnt-labs/abstraxion';

export const treasuryConfig = {
    treasury: process.env.NEXT_PUBLIC_TREASURY_CONTRACT_ADDRESS,
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL,
    restUrl: process.env.NEXT_PUBLIC_REST_URL,
  };

const inter = Inter({ subsets: ['latin'] });

const metadata: Metadata = {
    title: 'Content Platform',
    description: 'A platform for managing videos, audio and articles',
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
                    {children}
                    <Toaster position="bottom-right" />
                </AbstraxionProvider>
            </body>
        </html>
    );
}
"use client";

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AbstraxionProvider } from '@burnt-labs/abstraxion';
import UserProvider from './components/providers/UserProvider';

export const treasuryConfig = {
    treasury: process.env.NEXT_TREASURY_CONTRACT_ADDRESS ?? '',
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL,
    restUrl: process.env.NEXT_PUBLIC_REST_URL,
};

const inter = Inter({ subsets: ['latin'] });

const metadata: Metadata = {
    title: 'Quanta',
    description: 'Web3 Content Platform',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <UserProvider>
                    <AbstraxionProvider config={treasuryConfig}>
                        {children}
                        <Toaster position="bottom-right" />
                    </AbstraxionProvider>
                </UserProvider>
            </body>
        </html>
    );
}
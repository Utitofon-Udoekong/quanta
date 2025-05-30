"use client";

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AbstraxionProvider } from '@burnt-labs/abstraxion';
import UserProvider from '@/app/providers/UserProvider';
import { KeplrProvider } from '@/app/providers/KeplrProvider';

const treasuryConfig = {
    treasury: process.env.treasuryAddress ?? '',
    rpcUrl: process.env.rpcUrl,
    restUrl: process.env.restUrl,
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
                    <KeplrProvider>
                        <AbstraxionProvider config={treasuryConfig}>
                            {children}
                            <Toaster position="bottom-right" />
                        </AbstraxionProvider>
                    </KeplrProvider>
                </UserProvider>
            </body>
        </html>
    );
}
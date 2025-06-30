"use client";

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AbstraxionProvider } from '@burnt-labs/abstraxion';
import UserProvider from '@/app/providers/UserProvider';
import LayoutShell from '@/app/components/LayoutShell';
import UserStoreDebug from '@/app/components/debug/UserStoreDebug';
import '@/app/utils/debug'; // Import debug utilities
import { usePathname } from 'next/navigation';

const treasuryConfig = {
    treasury: process.env.treasuryAddress ?? '',
    // rpcUrl: process.env.rpcUrl,
    // restUrl: process.env.restUrl,
};

const inter = Inter({ subsets: ['latin'] });

const metadata: Metadata = {
    title: 'Zentex',
    description: 'Web3 Content Platform',
};

function LayoutShellWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    if (pathname === '/') {
        return <>{children}</>;
    }
    return <LayoutShell>{children}</LayoutShell>;
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <AbstraxionProvider config={treasuryConfig}>
                    <UserProvider>
                        <LayoutShellWrapper>{children}</LayoutShellWrapper>
                        <Toaster position="bottom-right" />
                        {/* <UserStoreDebug /> */}
                    </UserProvider>
                </AbstraxionProvider>
            </body>
        </html>
    );
}
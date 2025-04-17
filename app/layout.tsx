import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AbstraxionProvider } from '@burnt-labs/abstraxion';
import { treasuryConfig } from './old/lib/services/xion';

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
import { ReactNode } from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Content | Quanta',
  description: 'Explore articles, audio, and video content on Quanta',
};

export default function ContentLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0C10] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
} 
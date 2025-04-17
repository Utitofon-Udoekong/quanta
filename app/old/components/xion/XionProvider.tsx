"use client";

import { createContext, useContext, ReactNode } from 'react';
import { useAbstraxionAccount } from "@burnt-labs/abstraxion";

interface XionContextType {
  account: any;
}

const XionContext = createContext<XionContextType | null>(null);

export function XionProvider({ children }: { children: ReactNode }) {
  const { data: account } = useAbstraxionAccount();

  return (
    <XionContext.Provider value={{ account }}>
      {children}
    </XionContext.Provider>
  );
}

export function useXion() {
  const context = useContext(XionContext);
  if (!context) {
    throw new Error('useXion must be used within a XionProvider');
  }
  return context;
} 
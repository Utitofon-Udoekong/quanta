'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AuthCodeErrorPage() {
  const router = useRouter();
  const [errorInfo, setErrorInfo] = useState<{
    error?: string;
    errorCode?: string;
    errorDescription?: string;
  }>({});

  useEffect(() => {
    // Extract error information from URL parameters
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const error = urlParams.get('error');
      const errorCode = urlParams.get('error_code');
      const errorDescription = urlParams.get('error_description');
      
      setErrorInfo({
        error: error || undefined,
        errorCode: errorCode || undefined,
        errorDescription: errorDescription || undefined,
      });
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0C10] p-4">
      <div className="max-w-md w-full bg-gray-900/50 border border-gray-800 rounded-lg p-8 text-center">
        <div className="mb-6">
          <svg 
            className="mx-auto h-12 w-12 text-red-500" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-4">Authentication Error</h1>
        
        <p className="text-gray-400 mb-6">
          There was a problem with the authentication process.
        </p>
        
        {errorInfo.error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-md text-left">
            <h2 className="text-red-400 font-medium mb-2">Error Details:</h2>
            <ul className="text-sm text-gray-300 space-y-1">
              {errorInfo.error && (
                <li><span className="font-medium">Error:</span> {errorInfo.error}</li>
              )}
              {errorInfo.errorCode && (
                <li><span className="font-medium">Error Code:</span> {errorInfo.errorCode}</li>
              )}
              {errorInfo.errorDescription && (
                <li><span className="font-medium">Description:</span> {errorInfo.errorDescription}</li>
              )}
            </ul>
          </div>
        )}
        
        <div className="space-y-4">
          <button
            onClick={() => router.push('/auth')}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Return to Sign In
          </button>
          
          <div className="text-sm text-gray-500">
            <p>If this problem persists, please contact support.</p>
          </div>
        </div>
      </div>
    </div>
  );
} 
'use client';

import { useUserStore } from '@/app/stores/user';
import { useState } from 'react';
import { Icon } from '@iconify/react';

export default function UserStoreDebug() {
  const { user, loading, error, errorDetails, clearError } = useUserStore();
  const [isMinimized, setIsMinimized] = useState(false);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-lg max-w-md w-96">
        <div className="flex items-center justify-between p-3 border-b border-gray-700">
          <h3 className="text-sm font-semibold text-white">User Store Debug</h3>
          <div className="flex items-center gap-2">
            {error && (
              <button
                onClick={clearError}
                className="text-red-400 hover:text-red-300 text-xs"
              >
                Clear Error
              </button>
            )}
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-gray-400 hover:text-white"
            >
              <Icon icon={isMinimized ? 'mdi:arrow-expand' : 'mdi:window-minimize'} className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <div className="p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-400">Status:</span>
              <span className={`px-2 py-1 rounded text-xs ${
                loading ? 'bg-yellow-600 text-yellow-100' : 
                error ? 'bg-red-600 text-red-100' : 
                user ? 'bg-green-600 text-green-100' : 
                'bg-gray-600 text-gray-100'
              }`}>
                {loading ? 'Loading' : error ? 'Error' : user ? 'Authenticated' : 'No User'}
              </span>
            </div>

            {user && (
              <div className="text-xs">
                <div className="text-gray-400">User:</div>
                <div className="text-white font-mono text-xs break-all">
                  {user.wallet_address}
                </div>
              </div>
            )}

            {error && (
              <div className="border border-red-500 bg-red-900/20 rounded p-2">
                <div className="text-red-400 text-xs font-semibold mb-1">Error:</div>
                <div className="text-red-300 text-xs break-words">{error}</div>
                
                {errorDetails && (
                  <div className="mt-2 pt-2 border-t border-red-500/50">
                    <div className="text-red-400 text-xs font-semibold mb-1">Details:</div>
                    <div className="text-red-300 text-xs space-y-1">
                      <div><span className="text-red-400">Context:</span> {errorDetails.context}</div>
                      <div><span className="text-red-400">Time:</span> {errorDetails.timestamp.toLocaleString()}</div>
                      {errorDetails.stack && (
                        <details className="mt-1">
                          <summary className="text-red-400 text-xs cursor-pointer">Stack Trace</summary>
                          <pre className="text-red-300 text-xs mt-1 whitespace-pre-wrap break-words">
                            {errorDetails.stack}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="border-t border-gray-700 pt-2 mt-2">
              <div className="text-gray-400 text-xs font-semibold mb-1">Debug Info:</div>
              <div className="text-white text-xs space-y-1">
                <div>User ID: {user?.id || 'None'}</div>
                <div>Created: {user?.created_at ? new Date(user.created_at).toLocaleString() : 'None'}</div>
                <div>Last Login: {user?.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'None'}</div>
                <div>Chain: {user?.wallet_chain || 'None'}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
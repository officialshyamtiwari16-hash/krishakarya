import React, { useState } from 'react';
import { WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { useNetworkStatus } from '../lib/useNetworkStatus';

export const OfflineBanner: React.FC = () => {
  const { isOnline, isSlowConnection } = useNetworkStatus();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      setIsRetrying(false);
      // Triggers browser check
      if (typeof window !== 'undefined' && navigator.onLine) {
        window.location.reload();
      }
    }, 1200);
  };

  if (isOnline && !isSlowConnection) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`w-full py-2 px-4 text-xs font-semibold flex items-center justify-between shadow-md transition-all duration-300 z-50 ${
        !isOnline
          ? 'bg-amber-600 text-white'
          : 'bg-amber-100 text-amber-900 border-b border-amber-300'
      }`}
    >
      <div className="flex items-center gap-2 max-w-5xl mx-auto w-full justify-between">
        <div className="flex items-center gap-2">
          {!isOnline ? (
            <WifiOff className="w-4 h-4 shrink-0 text-white animate-pulse" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-700" />
          )}
          <span>
            {!isOnline
              ? 'You are currently offline. Showing cached agricultural listings & ledger entries.'
              : 'Slow rural network connection detected. Media loading may take a little longer.'}
          </span>
        </div>

        {!isOnline && (
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-lg transition-all cursor-pointer min-h-[32px]"
            aria-label="Retry network connection"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'Checking...' : 'Retry'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

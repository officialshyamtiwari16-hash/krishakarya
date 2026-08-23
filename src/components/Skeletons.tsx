import React from 'react';

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-slate-200 rounded-2xl shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-slate-200 rounded-md w-3/4" />
              <div className="h-3 bg-slate-100 rounded-md w-1/2" />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="h-3 bg-slate-100 rounded-md w-full" />
            <div className="h-3 bg-slate-100 rounded-md w-4/5" />
          </div>

          <div className="flex gap-2 pt-2">
            <div className="h-6 bg-slate-100 rounded-full w-16" />
            <div className="h-6 bg-slate-100 rounded-full w-20" />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="h-5 bg-slate-200 rounded-md w-24" />
            <div className="h-9 bg-slate-200 rounded-xl w-24" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const WeatherSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-5 bg-slate-200 rounded-md w-40" />
        <div className="h-7 bg-slate-100 rounded-xl w-28" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-slate-50 p-4 rounded-2xl space-y-2">
            <div className="h-3 bg-slate-200 rounded w-16" />
            <div className="h-6 bg-slate-300 rounded w-20" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const LedgerSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-5 bg-slate-200 rounded w-36" />
        <div className="h-8 bg-slate-200 rounded-xl w-32" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl">
            <div className="space-y-1.5">
              <div className="h-4 bg-slate-200 rounded w-44" />
              <div className="h-3 bg-slate-100 rounded w-24" />
            </div>
            <div className="h-5 bg-slate-200 rounded w-20" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const PageLoadingSkeleton: React.FC<{ message?: string }> = ({
  message = 'Loading agricultural data...',
}) => {
  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-700 animate-spin" />
        <span className="absolute inset-0 flex items-center justify-center text-sm">🌾</span>
      </div>
      <p className="text-xs font-bold text-slate-600 animate-pulse">{message}</p>
    </div>
  );
};

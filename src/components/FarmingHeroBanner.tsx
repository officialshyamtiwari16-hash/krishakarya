import React from 'react';

interface FarmingHeroBannerProps {
  className?: string;
  isBackgroundOverlay?: boolean;
}

export const FarmingHeroBanner: React.FC<FarmingHeroBannerProps> = ({
  className = '',
}) => {
  return (
    <div className={`relative w-full rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-900 to-teal-900 p-6 text-white shadow-lg ${className}`}>
      <div className="max-w-xl space-y-2">
        <h3 className="text-xl font-bold">Krishakarya Smart Agriculture</h3>
        <p className="text-xs text-emerald-100">Connecting Indian farmers with labor, machinery, and smart tools.</p>
      </div>
    </div>
  );
};

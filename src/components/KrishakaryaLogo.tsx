import React from 'react';

interface KrishakaryaLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  showText?: boolean;
  textClassName?: string;
}

export const KrishakaryaLogo: React.FC<KrishakaryaLogoProps> = ({
  className = '',
  size = 'md',
  showText = false,
  textClassName = '',
}) => {
  let pixelSize = 40;
  if (typeof size === 'number') {
    pixelSize = size;
  } else {
    switch (size) {
      case 'xs':
        pixelSize = 24;
        break;
      case 'sm':
        pixelSize = 32;
        break;
      case 'md':
        pixelSize = 42;
        break;
      case 'lg':
        pixelSize = 56;
        break;
      case 'xl':
        pixelSize = 80;
        break;
    }
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {/* Metallic Emblem Badge matching uploaded logo */}
      <div 
        style={{ width: `${pixelSize}px`, height: `${pixelSize}px` }}
        className="relative shrink-0 rounded-full select-none shadow-md transition-transform duration-200 hover:scale-105"
      >
        <img
          src="/logo.svg"
          alt="Krishakarya Logo - कृ"
          className="w-full h-full object-contain rounded-full"
          referrerPolicy="no-referrer"
        />
      </div>

      {showText && (
        <span className={`font-['Outfit',sans-serif] font-black tracking-tight leading-none text-emerald-700 dark:text-emerald-400 ${textClassName || 'text-2xl sm:text-3xl'}`}>
          Krishakarya
        </span>
      )}
    </div>
  );
};

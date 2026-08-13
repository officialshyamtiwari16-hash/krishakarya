import React, { useId } from 'react';

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
  const idPrefix = useId().replace(/:/g, '');

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

  const bronzeRimId = `bronzeRim_${idPrefix}`;
  const innerRimHighlightId = `innerRimHighlight_${idPrefix}`;
  const paleGreenBgId = `paleGreenBg_${idPrefix}`;
  const kriShadowId = `kriShadow_${idPrefix}`;
  const badgeShadowId = `badgeShadow_${idPrefix}`;

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {/* Metallic Emblem Badge matching Krishakarya logo */}
      <div 
        style={{ width: `${pixelSize}px`, height: `${pixelSize}px` }}
        className="relative shrink-0 rounded-full select-none shadow-md transition-transform duration-200 hover:scale-105 flex items-center justify-center overflow-hidden"
      >
        <svg
          viewBox="0 0 512 512"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-contain rounded-full"
        >
          <defs>
            {/* Outer metallic bronze ring gradient */}
            <linearGradient id={bronzeRimId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8a562d" />
              <stop offset="25%" stopColor="#4d2b14" />
              <stop offset="50%" stopColor="#281308" />
              <stop offset="75%" stopColor="#4d2b14" />
              <stop offset="100%" stopColor="#8a562d" />
            </linearGradient>

            {/* Inner rim highlight */}
            <linearGradient id={innerRimHighlightId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e2b166" />
              <stop offset="50%" stopColor="#73441c" />
              <stop offset="100%" stopColor="#331808" />
            </linearGradient>

            {/* Center pale yellow-green gradient */}
            <radialGradient id={paleGreenBgId} cx="45%" cy="40%" r="58%">
              <stop offset="0%" stopColor="#f2fcc2" />
              <stop offset="45%" stopColor="#d8f285" />
              <stop offset="85%" stopColor="#b6d955" />
              <stop offset="100%" stopColor="#93b53c" />
            </radialGradient>

            {/* Drop shadow for Devanagari text */}
            <filter id={kriShadowId} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="2" dy="5" stdDeviation="3" floodColor="#1f0900" floodOpacity="0.38" />
            </filter>

            <filter id={badgeShadowId} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#000000" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Outer Metallic Ring */}
          <circle cx="256" cy="256" r="248" fill={`url(#${bronzeRimId})`} filter={`url(#${badgeShadowId})`} />
          <circle cx="256" cy="256" r="236" fill={`url(#${innerRimHighlightId})`} />
          <circle cx="256" cy="256" r="226" fill="#2d160a" />

          {/* Inner Pale Green Dial */}
          <circle cx="256" cy="256" r="218" fill={`url(#${paleGreenBgId})`} stroke="#89a733" strokeWidth="3" />

          {/* Inner Soft Bevel Ring */}
          <circle cx="256" cy="256" r="215" fill="none" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="2" />

          {/* Devanagari Text 'कृ' */}
          <g filter={`url(#${kriShadowId})`}>
            <text
              x="256"
              y="325"
              textAnchor="middle"
              fontFamily="'Noto Sans Devanagari', 'Mukta', 'Kohinoor Devanagari', 'Arial', sans-serif"
              fontWeight="900"
              fontSize="280"
              fill="#361908"
              letterSpacing="-2"
            >
              कृ
            </text>
          </g>
        </svg>
      </div>

      {showText && (
        <span className={`font-['Outfit',sans-serif] font-black tracking-tight leading-none text-emerald-700 dark:text-emerald-400 ${textClassName || 'text-2xl sm:text-3xl'}`}>
          Krishakarya
        </span>
      )}
    </div>
  );
};


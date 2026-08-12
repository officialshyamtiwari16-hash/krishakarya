import React from 'react';

interface FarmingHeroBannerProps {
  className?: string;
  isBackgroundOverlay?: boolean;
}

export const FarmingHeroBanner: React.FC<FarmingHeroBannerProps> = ({
  className = '',
  isBackgroundOverlay = false,
}) => {
  const containerClasses = isBackgroundOverlay
    ? `absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0 ${className}`
    : `relative w-full rounded-3xl overflow-hidden shadow-2xl border border-emerald-500/30 bg-slate-950 my-2 ${className}`;

  return (
    <div className={containerClasses}>
      {/* CSS Keyframes for realistic farming scene animations */}
      <style>{`
        /* Majestic Sun Rising from Below the Hills on Load */
        @keyframes sunRiseFromHorizon {
          0% {
            transform: translate3d(0, 180px, 0) scale(0.5);
            opacity: 0;
          }
          30% {
            opacity: 0.6;
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 1;
          }
        }
        @keyframes sunGlowPulse {
          0%, 100% { filter: drop-shadow(0 0 15px rgba(253, 224, 71, 0.6)); }
          50% { filter: drop-shadow(0 0 35px rgba(249, 115, 22, 0.85)); }
        }
        .anim-sun-rise {
          transform-box: fill-box;
          transform-origin: center;
          animation: sunRiseFromHorizon 3.2s cubic-bezier(0.16, 1, 0.3, 1) forwards,
                     sunGlowPulse 4s ease-in-out infinite 3.2s;
          will-change: transform, opacity, filter;
        }

        /* Sunlight Rays Rotation */
        @keyframes sunRaysRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .anim-sun-rays {
          transform-box: fill-box;
          transform-origin: center;
          animation: sunRaysRotate 45s linear infinite;
        }

        /* Clouds Drifting */
        @keyframes cloudDrift1 {
          0% { transform: translate3d(-220px, 0, 0); }
          100% { transform: translate3d(1280px, 0, 0); }
        }
        @keyframes cloudDrift2 {
          0% { transform: translate3d(-320px, 0, 0); }
          100% { transform: translate3d(1280px, 0, 0); }
        }
        .anim-cloud-1 { animation: cloudDrift1 38s linear infinite; will-change: transform; }
        .anim-cloud-2 { animation: cloudDrift2 56s linear infinite; animation-delay: -20s; will-change: transform; }
        .anim-cloud-3 { animation: cloudDrift1 44s linear infinite; animation-delay: -12s; will-change: transform; }

        /* Birds Flying V-Formation */
        @keyframes birdsFlyV {
          0% { transform: translate3d(-140px, 10px, 0) scale(0.85); }
          50% { transform: translate3d(600px, -20px, 0) scale(0.95); }
          100% { transform: translate3d(1300px, 5px, 0) scale(0.85); }
        }
        @keyframes wingFlapMotion {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.2); }
        }
        .anim-birds-v { animation: birdsFlyV 24s linear infinite; will-change: transform; }
        .anim-wing-flap {
          transform-box: fill-box;
          transform-origin: center;
          animation: wingFlapMotion 0.45s ease-in-out infinite;
          will-change: transform;
        }

        /* Initial Crop Growth/Sprout on Load */
        @keyframes cropSproutUp {
          0% {
            transform: scaleY(0.1) scaleX(0.7);
            opacity: 0.2;
          }
          100% {
            transform: scaleY(1) scaleX(1);
            opacity: 1;
          }
        }

        /* Continuous Crop Wind Swaying */
        @keyframes cropSwayA {
          0%, 100% { transform: scaleY(1) rotate(-4deg); }
          50% { transform: scaleY(1) rotate(4deg); }
        }
        @keyframes cropSwayB {
          0%, 100% { transform: scaleY(1) rotate(5deg); }
          50% { transform: scaleY(1) rotate(-5deg); }
        }
        @keyframes cropSwayC {
          0%, 100% { transform: scaleY(1) rotate(-3deg); }
          50% { transform: scaleY(1) rotate(3deg); }
        }

        .center-crop-grow-a {
          transform-box: fill-box;
          transform-origin: bottom center;
          animation: cropSproutUp 2.5s cubic-bezier(0.25, 1, 0.5, 1) forwards,
                     cropSwayA 3.8s ease-in-out infinite 2.5s;
          will-change: transform;
        }
        .center-crop-grow-b {
          transform-box: fill-box;
          transform-origin: bottom center;
          animation: cropSproutUp 2.8s cubic-bezier(0.25, 1, 0.5, 1) forwards,
                     cropSwayB 3.4s ease-in-out infinite 2.8s;
          will-change: transform;
        }
        .center-crop-grow-c {
          transform-box: fill-box;
          transform-origin: bottom center;
          animation: cropSproutUp 3.1s cubic-bezier(0.25, 1, 0.5, 1) forwards,
                     cropSwayC 4.2s ease-in-out infinite 3.1s;
          will-change: transform;
        }

        /* Water Sprinkler Drops */
        @keyframes waterArcSpray {
          0% { opacity: 0; transform: translate3d(0, 0, 0) scale(0.3); }
          30% { opacity: 0.9; }
          100% { opacity: 0; transform: translate3d(55px, 40px, 0) scale(1.2); }
        }
        .water-drop-1 { animation: waterArcSpray 1.6s ease-out infinite; transform-box: fill-box; }
        .water-drop-2 { animation: waterArcSpray 1.6s ease-out infinite; animation-delay: -0.4s; transform-box: fill-box; }
        .water-drop-3 { animation: waterArcSpray 1.6s ease-out infinite; animation-delay: -0.8s; transform-box: fill-box; }
        .water-drop-4 { animation: waterArcSpray 1.6s ease-out infinite; animation-delay: -1.2s; transform-box: fill-box; }
      `}</style>

      {/* Embedded SVG Responsive Banner View */}
      <svg
        viewBox="0 0 1200 480"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-auto block min-h-[240px] max-h-[460px]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Sky Sunrise Gradient */}
          <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="25%" stopColor="#1e3a8a" />
            <stop offset="55%" stopColor="#2563eb" />
            <stop offset="82%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#c2410c" />
          </linearGradient>

          {/* Sun Radial Glow */}
          <radialGradient id="sunGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="1" />
            <stop offset="40%" stopColor="#fde047" stopOpacity="0.8" />
            <stop offset="75%" stopColor="#f97316" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
          </radialGradient>

          {/* Distance Hill Gradients */}
          <linearGradient id="hill1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#15803d" />
            <stop offset="100%" stopColor="#166534" />
          </linearGradient>

          <linearGradient id="hill2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#16a34a" />
            <stop offset="100%" stopColor="#15803d" />
          </linearGradient>

          {/* Soil Gradient */}
          <linearGradient id="soil" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#854d0e" />
            <stop offset="40%" stopColor="#713f12" />
            <stop offset="100%" stopColor="#451a03" />
          </linearGradient>

          {/* Golden Wheat Crop Gradient */}
          <linearGradient id="wheat" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>

          {/* Lush Green Crop Gradient */}
          <linearGradient id="greenCrop" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#bbf7d0" />
            <stop offset="50%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#15803d" />
          </linearGradient>

          {/* Reusable Golden Wheat Stalk */}
          <g id="wheatStalk">
            <path d="M 0,0 C -2,-25 -1,-50 0,-70" stroke="#ca8a04" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            <ellipse cx="-4" cy="-55" rx="3.5" ry="7" fill="url(#wheat)" transform="rotate(-25 -4 -55)" />
            <ellipse cx="4" cy="-50" rx="3.5" ry="7" fill="url(#wheat)" transform="rotate(25 4 -50)" />
            <ellipse cx="-5" cy="-40" rx="3.5" ry="7" fill="url(#wheat)" transform="rotate(-25 -5 -40)" />
            <ellipse cx="5" cy="-35" rx="3.5" ry="7" fill="url(#wheat)" transform="rotate(25 5 -35)" />
            <ellipse cx="-4" cy="-25" rx="3" ry="6" fill="url(#wheat)" transform="rotate(-20 -4 -25)" />
            <ellipse cx="4" cy="-20" rx="3" ry="6" fill="url(#wheat)" transform="rotate(20 4 -20)" />
            <ellipse cx="0" cy="-68" rx="3" ry="8" fill="url(#wheat)" />
          </g>

          {/* Reusable Green Paddy Plant */}
          <g id="greenPlant">
            <path d="M 0,0 C -12,-30 -20,-50 -25,-60" stroke="#16a34a" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M 0,0 C -5,-35 -8,-55 -10,-70" stroke="#22c55e" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M 0,0 C 0,-40 0,-60 0,-75" stroke="#4ade80" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path d="M 0,0 C 5,-35 8,-55 10,-70" stroke="#22c55e" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M 0,0 C 12,-30 20,-50 25,-60" stroke="#16a34a" strokeWidth="3" fill="none" strokeLinecap="round" />
            <ellipse cx="0" cy="-75" rx="3" ry="6" fill="#86efac" />
          </g>

          {/* Reusable Lush Corn/Maize Plant */}
          <g id="cornStalk">
            <path d="M 0,0 L 0,-85" stroke="#15803d" strokeWidth="4" />
            {/* Broad Leaves */}
            <path d="M 0,-20 Q -25,-35 -35,-25" stroke="#22c55e" strokeWidth="4.5" fill="none" strokeLinecap="round" />
            <path d="M 0,-30 Q 25,-45 35,-35" stroke="#22c55e" strokeWidth="4.5" fill="none" strokeLinecap="round" />
            <path d="M 0,-45 Q -28,-60 -32,-50" stroke="#16a34a" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M 0,-55 Q 28,-70 32,-60" stroke="#16a34a" strokeWidth="4" fill="none" strokeLinecap="round" />
            {/* Golden Corn Cobs */}
            <g transform="translate(6, -42) rotate(25)">
              <ellipse cx="0" cy="0" rx="4.5" ry="12" fill="#eab308" />
              <path d="M 0,-12 L -2,-18 M 0,-12 L 2,-18" stroke="#ca8a04" strokeWidth="1.5" />
            </g>
            <g transform="translate(-6, -55) rotate(-25)">
              <ellipse cx="0" cy="0" rx="4.5" ry="12" fill="#eab308" />
              <path d="M 0,-12 L -2,-18 M 0,-12 L 2,-18" stroke="#ca8a04" strokeWidth="1.5" />
            </g>
          </g>
        </defs>

        {/* 1. Sky Canvas */}
        <rect width="1200" height="480" fill="url(#skyGrad)" />

        {/* 2. Rising Sun Animation from Below Hills (y = 110) */}
        <g className="anim-sun-rise" transform="translate(920, 110)">
          {/* Rotating Sun Rays */}
          <g className="anim-sun-rays" opacity="0.35">
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => (
              <line key={i} x1="0" y1="0" x2={140 * Math.cos((deg * Math.PI) / 180)} y2={140 * Math.sin((deg * Math.PI) / 180)} stroke="#fde047" strokeWidth="2.5" strokeDasharray="10,6" />
            ))}
          </g>
          {/* Sun Body & Corona */}
          <circle cx="0" cy="0" r="105" fill="url(#sunGrad)" />
          <circle cx="0" cy="0" r="42" fill="#fef08a" />
        </g>

        {/* 3. Drifting Clouds */}
        <g className="anim-cloud-1" opacity="0.85">
          <path d="M 50 95 Q 65 75 90 80 Q 110 65 135 75 Q 155 70 165 85 Q 180 95 170 110 Q 155 120 120 120 L 60 120 Q 40 110 50 95 Z" fill="#ffffff" />
        </g>
        <g className="anim-cloud-2" opacity="0.7">
          <path d="M 200 60 Q 215 40 240 45 Q 260 30 285 40 Q 305 35 315 50 Q 330 60 320 75 Q 305 85 270 85 L 210 85 Q 190 75 200 60 Z" fill="#ffffff" />
        </g>
        <g className="anim-cloud-3" opacity="0.8">
          <path d="M 700 110 Q 715 90 740 95 Q 760 80 785 90 Q 805 85 815 100 Q 830 110 820 125 L 710 125 Q 690 115 700 110 Z" fill="#ffffff" />
        </g>

        {/* 4. Birds Flying V-Formation */}
        <g className="anim-birds-v">
          <path className="anim-wing-flap" d="M 100,70 Q 105,62 112,70 Q 119,62 124,70" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
          <path className="anim-wing-flap" d="M 85,82 Q 90,75 96,82 Q 102,75 107,82" fill="none" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
          <path className="anim-wing-flap" d="M 72,94 Q 77,88 82,94 Q 87,88 92,94" fill="none" stroke="#0f172a" strokeWidth="1.6" strokeLinecap="round" />
          <path className="anim-wing-flap" d="M 115,84 Q 120,78 125,84 Q 130,78 135,84" fill="none" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
          <path className="anim-wing-flap" d="M 128,97 Q 133,91 138,97 Q 143,91 147,97" fill="none" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" />
        </g>

        {/* 5. Distant Rolling Green Hills */}
        <path d="M 0 220 Q 250 170 500 210 T 1000 190 Q 1120 180 1200 200 L 1200 480 L 0 480 Z" fill="url(#hill1)" opacity="0.9" />
        <path d="M 0 245 Q 350 200 700 235 T 1200 220 L 1200 480 L 0 480 Z" fill="url(#hill2)" />

        {/* 6. Rich Agricultural Land & Terraces */}
        <path d="M 0 310 Q 300 295 600 315 T 1200 300 L 1200 480 L 0 480 Z" fill="url(#soil)" />
        <path d="M 0 360 C 350 340 750 370 1200 350 L 1200 480 L 0 480 Z" fill="#15803d" />
        <path d="M 0 415 C 400 395 800 425 1200 405 L 1200 480 L 0 480 Z" fill="#14532d" />

        {/* 7. Water Irrigation Sprinkler in Field */}
        <g transform="translate(760, 320)">
          <rect x="-3" y="0" width="6" height="28" fill="#64748b" rx="1.5" />
          <circle cx="0" cy="0" r="5" fill="#38bdf8" />
          {/* Water Arc Sprays */}
          <circle className="water-drop-1" cx="0" cy="-2" r="3" fill="#7dd3fc" />
          <circle className="water-drop-2" cx="-5" cy="-4" r="2.5" fill="#38bdf8" />
          <circle className="water-drop-3" cx="5" cy="-4" r="2.5" fill="#38bdf8" />
          <circle className="water-drop-4" cx="0" cy="-6" r="3" fill="#bfdbfe" />
        </g>

        {/* 8. CROPS GROWING ALL OVER THE ENTIRE FIELD (5 DENSE STAGGERED ROWS) */}

        {/* Row 1: Distant Upper Hilltop Terrace Crops (y = 285) */}
        <g transform="translate(0, 285)">
          {Array.from({ length: 38 }).map((_, i) => {
            const x = 15 + i * 31;
            const animClass = i % 3 === 0 ? 'center-crop-grow-a' : i % 3 === 1 ? 'center-crop-grow-b' : 'center-crop-grow-c';
            const plantType = i % 2 === 0 ? '#greenPlant' : '#wheatStalk';
            return (
              <g key={`r1-${i}`} transform={`translate(${x}, 0) scale(0.5)`}>
                <g className={animClass}>
                  <use href={plantType} />
                </g>
              </g>
            );
          })}
        </g>

        {/* Row 2: Upper Soil Terrace Crops (y = 325) */}
        <g transform="translate(0, 325)">
          {Array.from({ length: 35 }).map((_, i) => {
            const x = 10 + i * 34;
            const animClass = i % 3 === 0 ? 'center-crop-grow-b' : i % 3 === 1 ? 'center-crop-grow-c' : 'center-crop-grow-a';
            const plantType = i % 3 === 0 ? '#greenPlant' : i % 3 === 1 ? '#wheatStalk' : '#cornStalk';
            return (
              <g key={`r2-${i}`} transform={`translate(${x}, 0) scale(0.72)`}>
                <g className={animClass}>
                  <use href={plantType} />
                </g>
              </g>
            );
          })}
        </g>

        {/* Row 3: Mid-Terrace Dense Crops (y = 365) */}
        <g transform="translate(0, 365)">
          {Array.from({ length: 32 }).map((_, i) => {
            const x = 5 + i * 37.5;
            const animClass = i % 3 === 0 ? 'center-crop-grow-c' : i % 3 === 1 ? 'center-crop-grow-a' : 'center-crop-grow-b';
            const plantType = i % 3 === 0 ? '#wheatStalk' : i % 3 === 1 ? '#cornStalk' : '#greenPlant';
            return (
              <g key={`r3-${i}`} transform={`translate(${x}, 0) scale(0.9)`}>
                <g className={animClass}>
                  <use href={plantType} />
                </g>
              </g>
            );
          })}
        </g>

        {/* Row 4: Lower Field Crops (y = 415) */}
        <g transform="translate(0, 415)">
          {Array.from({ length: 28 }).map((_, i) => {
            const x = 8 + i * 42;
            const animClass = i % 3 === 0 ? 'center-crop-grow-a' : i % 3 === 1 ? 'center-crop-grow-b' : 'center-crop-grow-c';
            const plantType = i % 3 === 0 ? '#cornStalk' : i % 3 === 1 ? '#greenPlant' : '#wheatStalk';
            return (
              <g key={`r4-${i}`} transform={`translate(${x}, 0) scale(1.1)`}>
                <g className={animClass}>
                  <use href={plantType} />
                </g>
              </g>
            );
          })}
        </g>

        {/* Row 5: Foreground High-Impact Bountiful Harvest Crops (y = 470) */}
        <g transform="translate(0, 470)">
          {Array.from({ length: 25 }).map((_, i) => {
            const x = 12 + i * 48;
            const animClass = i % 3 === 0 ? 'center-crop-grow-b' : i % 3 === 1 ? 'center-crop-grow-c' : 'center-crop-grow-a';
            const plantType = i % 3 === 0 ? '#wheatStalk' : i % 3 === 1 ? '#cornStalk' : '#greenPlant';
            return (
              <g key={`r5-${i}`} transform={`translate(${x}, 0) scale(1.3)`}>
                <g className={animClass}>
                  <use href={plantType} />
                </g>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};



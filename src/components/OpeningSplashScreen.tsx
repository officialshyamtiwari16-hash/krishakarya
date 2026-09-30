import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Sprout, 
  TrendingUp, 
  Tractor,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { KrishakaryaLogo } from './KrishakaryaLogo';

interface OpeningSplashScreenProps {
  onComplete: () => void;
  autoDismissMs?: number;
}

export const OpeningSplashScreen: React.FC<OpeningSplashScreenProps> = ({
  onComplete,
  autoDismissMs = 2900,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [phase, setPhase] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // High-performance 60fps organic golden ember / crop pollen particle simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    interface Particle {
      x: number;
      y: number;
      size: number;
      baseSpeedY: number;
      wobbleSpeed: number;
      wobbleDist: number;
      opacity: number;
      color: string;
      phaseOffset: number;
    }

    const colors = ['#fde047', '#f59e0b', '#34d399', '#10b981', '#ffffff'];
    const particleCount = Math.min(width > 768 ? 48 : 28, 50);
    const particles: Particle[] = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.8 + 1.2,
      baseSpeedY: Math.random() * 0.7 + 0.35,
      wobbleSpeed: Math.random() * 0.025 + 0.01,
      wobbleDist: Math.random() * 1.6 + 0.6,
      opacity: Math.random() * 0.65 + 0.25,
      color: colors[Math.floor(Math.random() * colors.length)],
      phaseOffset: Math.random() * Math.PI * 2,
    }));

    let frame = 0;
    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.y -= p.baseSpeedY;
        p.x += Math.sin(frame * p.wobbleSpeed + p.phaseOffset) * p.wobbleDist;

        // Wrap around seamlessly
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        // Draw soft radiant glowing circle
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.shadowBlur = p.size * 3.5;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Choreographed Cinematic Animation Phases
  useEffect(() => {
    // Phase 1: Shockwave burst & orbital rings activation (0.15s)
    const t1 = setTimeout(() => setPhase(1), 150);
    // Phase 2: Brand typography reveal & Devanagari badge (0.75s)
    const t2 = setTimeout(() => setPhase(2), 750);
    // Phase 3: Pillars & ecosystem badges (1.4s)
    const t3 = setTimeout(() => setPhase(3), 1400);

    // Auto dismiss after autoDismissMs
    const tDismiss = setTimeout(() => {
      handleDismiss();
    }, autoDismissMs);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(tDismiss);
    };
  }, [autoDismissMs]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onComplete();
    }, 550);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="opening-splash-masterpiece"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ 
            opacity: 0, 
            scale: 1.08, 
            filter: 'blur(10px)',
            transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } 
          }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#01140b] via-[#042417] to-[#010a05] text-white select-none cursor-default"
        >
          {/* Hardware-Accelerated 60fps HTML5 Canvas Particle Field */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none w-full h-full z-0"
          />

          {/* Atmospheric Dawn Glow & Radial Light Rays */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            {/* Pulsing Warm Gold Sunrise Halo Behind Logo */}
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ 
                scale: [0.75, 1.3, 1.1], 
                opacity: [0.35, 0.65, 0.45] 
              }}
              transition={{ duration: 3.5, ease: 'easeOut', repeat: Infinity, repeatType: 'reverse' }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[580px] h-[580px] rounded-full bg-radial from-amber-400/30 via-emerald-500/25 to-transparent blur-3xl pointer-events-none"
            />

            {/* Lush Agricultural Emerald Fog */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(16,185,129,0.22),transparent_72%)] pointer-events-none" />

            {/* Subtle Agricultural Furrow Dot-Grid */}
            <div 
              className="absolute inset-0 opacity-[0.04] pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle, #f8fafc 1.2px, transparent 1.2px)',
                backgroundSize: '30px 30px'
              }}
            />
          </div>

          {/* Quick Skip Button (Top-Right Glassmorphic Badge) */}
          <motion.div 
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-40"
          >
            <button
              onClick={handleDismiss}
              className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-emerald-500/25 border border-emerald-400/35 hover:border-emerald-300/70 text-xs font-bold text-emerald-100 hover:text-white transition-all cursor-pointer backdrop-blur-xl shadow-lg active:scale-95"
            >
              <span>Skip / छोड़ें</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </motion.div>

          {/* Central Showcase Stage */}
          <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-xl w-full">
            
            {/* ========================================================================= */}
            {/* EMBLEM STAGE WITH SACRED CELESTIAL ORBITS & 3D SPRING BOUNCE */}
            {/* ========================================================================= */}
            <div className="relative flex items-center justify-center mb-5 sm:mb-6">
              
              {/* Expanding Concentric Shockwave Pulse 1 (Emerald) */}
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: [0.75, 1.9, 2.4], opacity: [0.8, 0.3, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut', delay: 0.1 }}
                className="absolute w-40 h-40 rounded-full border border-emerald-400/50 pointer-events-none shadow-[0_0_15px_rgba(52,211,153,0.3)]"
              />

              {/* Expanding Concentric Shockwave Pulse 2 (Amber Gold) */}
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: [0.75, 1.7, 2.15], opacity: [0.7, 0.2, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut', delay: 0.8 }}
                className="absolute w-40 h-40 rounded-full border border-amber-400/40 pointer-events-none shadow-[0_0_15px_rgba(251,191,36,0.25)]"
              />

              {/* Radiant Sunray Corona (Pulsing 24 Solar Rays) */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 34, repeat: Infinity, ease: 'linear' }}
                className="absolute w-60 h-60 rounded-full pointer-events-none flex items-center justify-center opacity-45"
              >
                {Array.from({ length: 24 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-0.5 h-7 bg-gradient-to-t from-amber-300 via-amber-200 to-transparent"
                    style={{
                      transform: `rotate(${i * 15}deg) translateY(-114px)`,
                    }}
                  />
                ))}
              </motion.div>

              {/* Outer Counter-Clockwise Dashed Celestial Orbit Ring with Satellite Light Pearl */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
                className="absolute w-52 h-52 rounded-full border border-dashed border-amber-300/40 pointer-events-none flex items-center justify-end"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-amber-300 shadow-[0_0_12px_#f59e0b] translate-x-1" />
              </motion.div>

              {/* Inner Clockwise Orbit Ring with Satellite Emerald Node */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                className="absolute w-44 h-44 rounded-full border border-emerald-400/35 pointer-events-none flex items-center justify-start"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-300 shadow-[0_0_12px_#10b981] -translate-x-1" />
              </motion.div>

              {/* Central Exact Logo (Zero Point of Difference) with Elastic Spring Scale-In */}
              <motion.div
                initial={{ scale: 0, rotate: -22, filter: 'drop-shadow(0 0 0px transparent)' }}
                animate={{ 
                  scale: [0, 1.14, 0.96, 1], 
                  rotate: [-22, 3, -1, 0],
                  filter: 'drop-shadow(0 18px 45px rgba(16, 185, 129, 0.55))'
                }}
                transition={{ duration: 0.9, ease: [0.34, 1.56, 0.64, 1] }}
                className="relative rounded-full shadow-2xl flex items-center justify-center select-none"
              >
                {/* 100% Authentic Exact Logo */}
                <KrishakaryaLogo size={144} />

                {/* Animated Specular Light Bar Sweep */}
                <motion.div
                  initial={{ x: '-160%', opacity: 0 }}
                  animate={{ x: '160%', opacity: [0, 0.9, 0] }}
                  transition={{ duration: 1.4, delay: 0.45, ease: 'easeInOut' }}
                  className="absolute inset-0 rounded-full pointer-events-none overflow-hidden"
                >
                  <div className="w-16 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12 -translate-x-1/2" />
                </motion.div>
              </motion.div>
            </div>

            {/* Brand Title with Kinetic Staggered Reveal */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-1.5 mb-3"
            >
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                <h1 className="font-['Outfit',sans-serif] font-black tracking-tight text-3xl sm:text-5xl bg-gradient-to-r from-emerald-100 via-white to-amber-200 bg-clip-text text-transparent drop-shadow-md">
                  Krishakarya
                </h1>
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              </div>

              {/* Devanagari Slogan Badge */}
              <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-400/30 text-xs sm:text-sm font-bold text-emerald-200 backdrop-blur-md shadow-xs">
                <span className="font-extrabold text-amber-300 text-sm tracking-wide">कृषककार्य</span>
                <span className="text-emerald-400/60">•</span>
                <span className="tracking-wide text-emerald-100/90 font-medium">आधुनिक कृषि क्रांति</span>
                <span className="text-emerald-400/60">•</span>
                <span className="text-amber-200/90 font-mono text-[11px] uppercase tracking-wider">Smart Agro</span>
              </div>
            </motion.div>

            {/* 3 Core Pillar Badges with Micro-Spring Entrances */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={phase >= 2 ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
              className="flex items-center justify-center gap-2 sm:gap-2.5 text-[11px] sm:text-xs text-emerald-100/90 my-2.5 sm:my-3.5 flex-wrap"
            >
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/75 border border-emerald-400/35 backdrop-blur-md shadow-md transition-transform hover:scale-105">
                <TrendingUp className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="font-bold">Live Mandi Bhav</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/75 border border-emerald-400/35 backdrop-blur-md shadow-md transition-transform hover:scale-105">
                <Sprout className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-bold">AI Crop Doctor</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/75 border border-emerald-400/35 backdrop-blur-md shadow-md transition-transform hover:scale-105">
                <Tractor className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                <span className="font-bold">Sahyogi & Machinery</span>
              </div>
            </motion.div>

            {/* Loading & Enter Progress Bar with Glowing Laser Bead */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={phase >= 2 ? { opacity: 1 } : {}}
              transition={{ duration: 0.4 }}
              className="w-56 sm:w-64 mt-2 sm:mt-3 space-y-2"
            >
              <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden p-0.5 shadow-inner relative">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: autoDismissMs / 1000 - 0.45, ease: 'easeInOut' }}
                  className="h-full bg-gradient-to-r from-emerald-400 via-amber-300 to-emerald-300 rounded-full shadow-[0_0_10px_#34d399] relative"
                />
              </div>
              <p className="text-[11px] text-emerald-200/80 font-medium tracking-wide flex items-center justify-center gap-1.5">
                <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span>Entering Smart Agro Ecosystem...</span>
              </p>
            </motion.div>

          </div>

          {/* Footer Farmers Dedication Note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="absolute bottom-4 sm:bottom-5 text-[11px] text-emerald-100/60 flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Dedicated to Indian Farmers • किसान सशक्तिकरण एवं समृद्धि</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

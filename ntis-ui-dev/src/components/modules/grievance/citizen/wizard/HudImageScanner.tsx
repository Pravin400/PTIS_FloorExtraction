'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface HudImageScannerProps {
  label?: string;
  isScanning?: boolean;
}

/**
 * Sci-Fi HUD Tri-Ring Scanner Component
 *
 * Fully GPU-accelerated via Framer Motion & Tailwind classes.
 * Zero main-thread React re-render loops (no setInterval).
 * Zero inline style={{...}} blocks.
 */
export function HudImageScanner({
  label,
  isScanning = true,
}: HudImageScannerProps) {
  if (!isScanning) return null;

  return (
    <div
      className="absolute inset-0 bg-slate-950/65 backdrop-blur-[2px] flex items-center justify-center z-25 pointer-events-none select-none animate-in fade-in duration-300"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      {/* Viewfinder Corner Reticles */}
      <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-emerald-400/60" />
      <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-emerald-400/60" />
      <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-emerald-400/60" />
      <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-emerald-400/60" />

      {/* Subtle Horizontal Laser Sweep */}
      <motion.div
        className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] z-10 opacity-70"
        initial={{ top: '5%' }}
        animate={{ top: ['5%', '95%', '5%'] }}
        transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
      />

      {/* Main HUD Tri-Ring Assembly */}
      <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center">
        {/* Ring 1: Outer Ring (Solid emerald arcs top & bottom, 2.4s clockwise) */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2.4, ease: 'linear' }}
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-400 border-b-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]"
        />

        {/* Ring 2: Middle Ring (Dashed green circle, 5s counter-clockwise) */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 5, ease: 'linear' }}
          className="absolute inset-3.5 sm:inset-4 rounded-full border-[1.5px] border-dashed border-emerald-600 drop-shadow-[0_0_4px_rgba(5,150,105,0.4)]"
        />

        {/* Ring 3: Inner Ring (Light mint arcs left & right, 1.6s clockwise) */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'linear' }}
          className="absolute inset-7 sm:inset-8 rounded-full border-2 border-transparent border-l-emerald-200 border-r-emerald-200 drop-shadow-[0_0_6px_rgba(167,243,208,0.7)]"
        />

        {/* Central HUD Data Readout */}
        <div className="relative z-20 flex flex-col items-center justify-center text-center px-2">
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.85, 1, 0.85] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            className="flex items-center justify-center"
          >
            <Sparkles className="w-6 h-6 text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
          </motion.div>

          {label && (
            <div className="text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-[0.16em] text-emerald-200 animate-pulse whitespace-nowrap mt-1 drop-shadow-[0_0_6px_rgba(167,243,208,0.6)]">
              {label}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

/**
 * Citizen Register Receipt (Layer 2 - Presentation Component)
 * Path: src/components/modules/grievance/citizen/CitizenRegisterReceipt.tsx
 *
 * Polished success state with spring scale-up, SVG checkmark self-drawing,
 * physics-based celebratory confetti burst (Canvas), and sequenced upward slide-in reveals.
 */

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Check, Copy, ChevronRight } from 'lucide-react';
import { getTrackingUrl } from '@/lib/services/grievance/tracking-storage.service';

interface CitizenRegisterReceiptProps {
  generatedTrackingId: string;
  isSavedOffline: boolean;
  onClose?: () => void;
}

export function CitizenRegisterReceipt({
  generatedTrackingId,
  isSavedOffline,
  onClose,
}: CitizenRegisterReceiptProps) {
  const t = useTranslations('grievance');
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const badgeRef = useRef<HTMLDivElement | null>(null);

  const triggerBurst = () => {
    setAnimKey((prev) => prev + 1);
  };

  // Physics-based Confetti & Microparticle Burst on Mount or Replay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let isCancelled = false;

    // Small delay so checkmark starts drawing first, then celebratory sparkle burst explodes
    const timer = setTimeout(() => {
      if (isCancelled || !canvas) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      // Measure exact center of the badge relative to the full-modal canvas
      const badge = badgeRef.current?.getBoundingClientRect();
      const centerX = badge ? badge.left - rect.left + badge.width / 2 : rect.width / 2;
      const centerY = badge ? badge.top - rect.top + badge.height / 2 : 56;

      const colors = [
        '#fbbf24', // bright gold
        '#f59e0b', // amber sparkle
        '#fde047', // sunny lemon
        '#ffffff', // crystal white shimmer
        '#10b981', // vibrant emerald
        '#34d399', // neon mint
        '#059669', // deep emerald
        '#6ee7b7', // soft mint
        '#14b8a6', // electric teal
        '#38bdf8', // radiant cyan
        '#a7f3d0', // pale mint glow
      ];

      // 125 sparkling particles spreading across a massive area
      const particleCount = 125;
      const particles = Array.from({ length: particleCount }).map((_, i) => {
        const angle = Math.random() * Math.PI * 2;
        // Wide explosive velocity covering the whole modal
        const speed = 4.2 + Math.random() * 12.8;
        const shapeType = i % 4; // 0: 4-point star sparkle, 1: circle, 2: diamond, 3: cross spark
        return {
          id: i,
          x: centerX + Math.cos(angle) * 16,
          y: centerY + Math.sin(angle) * 16,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2.8, // lofty upward arc
          size: 4 + Math.random() * 8.5,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 20,
          opacity: 1,
          shapeType,
          twinkleFreq: 0.008 + Math.random() * 0.018,
        };
      });

      const startTime = performance.now();
      const duration = 2800; // 2.8s wide-area celebration

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = elapsed / duration;

        if (progress >= 1 || isCancelled) {
          ctx.clearRect(0, 0, rect.width, rect.height);
          return;
        }

        ctx.clearRect(0, 0, rect.width, rect.height);

        particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.12; // gentle floating gravity
          p.vx *= 0.974; // low drag for maximum spread distance
          p.vy *= 0.974;
          p.rotation += p.rotationSpeed;

          // Twinkle shimmer calculation
          const twinkle = 0.6 + 0.4 * Math.sin(now * p.twinkleFreq + p.id);
          p.opacity = Math.max(0, (1 - progress * 1.05) * twinkle);

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = p.opacity;
          ctx.fillStyle = p.color;
          ctx.strokeStyle = p.color;

          if (p.shapeType === 0) {
            // 4-point Diamond Star Sparkle (✨)
            const s = p.size;
            ctx.beginPath();
            ctx.moveTo(0, -s);
            ctx.quadraticCurveTo(0, 0, s, 0);
            ctx.quadraticCurveTo(0, 0, 0, s);
            ctx.quadraticCurveTo(0, 0, -s, 0);
            ctx.quadraticCurveTo(0, 0, 0, -s);
            ctx.closePath();
            ctx.fill();
          } else if (p.shapeType === 1) {
            // Glowing Circular Sparkle
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
          } else if (p.shapeType === 2) {
            // Shiny Confetti Diamond
            const s = p.size * 0.8;
            ctx.beginPath();
            ctx.moveTo(0, -s);
            ctx.lineTo(s * 0.7, 0);
            ctx.lineTo(0, s);
            ctx.lineTo(-s * 0.7, 0);
            ctx.closePath();
            ctx.fill();
          } else {
            // Cross Star (+)
            const s = p.size * 0.75;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -s);
            ctx.lineTo(0, s);
            ctx.moveTo(-s, 0);
            ctx.lineTo(s, 0);
            ctx.stroke();
          }

          ctx.restore();
        });

        animationFrameId = requestAnimationFrame(animate);
      };

      animationFrameId = requestAnimationFrame(animate);
    }, 240);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [animKey]);

  const handleCopyTrackingId = async () => {
    if (!generatedTrackingId) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(generatedTrackingId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {}
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="py-6 px-2 text-center space-y-4 relative overflow-visible"
    >
      {/* Full-Modal Physics Sparkle Canvas Burst */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-30"
      />

      {/* Animated Success Badge with Drawing Checkmark */}
      <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
        {/* Soft Aura Ring */}
        <motion.div
          key={`aura-${animKey}`}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: [0.75, 1.45], opacity: [0.8, 0] }}
          transition={{ duration: 0.75, delay: 0.12, ease: 'easeOut' }}
          className="absolute w-20 h-20 rounded-full bg-emerald-400/25 pointer-events-none z-0"
        />

        {/* Green Circle smoothly scaling up (Click to Replay) */}
        <motion.div
          ref={badgeRef}
          key={`badge-${animKey}`}
          whileTap={{ scale: 0.92 }}
          onClick={triggerBurst}
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 22, delay: 0.05 }}
          className="relative w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 ring-4 ring-emerald-100 z-10 cursor-pointer select-none"
          title="Click to replay celebration"
        >
          {/* Animated SVG Checkmark drawing itself */}
          <motion.svg
            className="w-8 h-8 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={3.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <motion.path
              d="M5 13l4.5 4.5L19 7"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{
                pathLength: { duration: 0.42, delay: 0.22, ease: [0.2, 0.8, 0.2, 1] },
                opacity: { duration: 0.1, delay: 0.22 },
              }}
            />
          </motion.svg>
        </motion.div>
      </div>

      {/* Grievance Title & Subtitle Fade In */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.38, ease: 'easeOut' }}
        className="space-y-0.5"
      >
        <h3 className="text-lg font-black text-slate-900">{t('successTitle')}</h3>
        <p className="text-xs text-slate-500">{t('successSubtitle')}</p>
        {isSavedOffline && (
          <p className="text-xs font-bold text-amber-600 mt-1">{t('savedOffline')}</p>
        )}
      </motion.div>

      {/* Grievance Number Fades In Below */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, delay: 0.48, ease: 'easeOut' }}
        className="bg-slate-50 rounded-2xl p-4 border border-slate-200/90 max-w-sm mx-auto text-left shadow-2xs"
      >
        <span className="text-[10px] font-black uppercase text-slate-400">{t('trackingNumber')}</span>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-base font-black text-emerald-700 font-mono tracking-wide">{generatedTrackingId}</span>
          <motion.button
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={handleCopyTrackingId}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-600 cursor-pointer transition-colors shadow-2xs"
            aria-label={t('trackingNumber')}
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </motion.button>
        </div>
      </motion.div>

      {/* The Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3 pt-3 w-full max-w-sm sm:max-w-md mx-auto"
      >
        <button
          type="button"
          onClick={onClose}
          className="w-full sm:flex-1 inline-flex items-center justify-center h-11 px-4 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer shadow-xs active:scale-98 transition-all whitespace-nowrap order-2 sm:order-1"
        >
          <span className="whitespace-nowrap">{t('backToMap')}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onClose?.();
            router.push(getTrackingUrl(generatedTrackingId));
          }}
          className="w-full sm:flex-1 inline-flex items-center justify-center h-11 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-sm shadow-emerald-600/20 active:scale-98 transition-all whitespace-nowrap order-1 sm:order-2"
        >
          <span className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
            <span>{t('trackGrievanceLive')}</span>
            <ChevronRight className="w-4 h-4 shrink-0" />
          </span>
        </button>
      </motion.div>
    </motion.div>
  );
}

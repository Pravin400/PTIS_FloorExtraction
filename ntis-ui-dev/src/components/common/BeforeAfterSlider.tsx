'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage?: string | null;
  beforeLabel?: string;
  afterLabel?: string;
  photoBadge?: string;
  emptyNotice?: string;
  inProgressTitle?: string;
  inProgressNotice?: string;
  className?: string;
  aspectRatioClassName?: string;
  initialPosition?: number;
  alt?: string;
}

/**
 * Universal Before/After Image Comparison Slider
 *
 * Provides a responsive, touch-friendly, and accessible split slider
 * that allows users to compare pre-resolution and post-resolution photos.
 * Can be used anywhere across modules (Grievance, Property Tax, Asset inspection, etc.).
 * Falls back to single image view when `afterImage` is not present.
 */
export function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel = 'Before',
  afterLabel = 'After',
  photoBadge,
  emptyNotice = 'No photo evidence attached',
  inProgressTitle = 'Work In Progress',
  inProgressNotice = 'Resolution photo will appear once resolved',
  className = '',
  aspectRatioClassName = 'aspect-video',
  initialPosition = 50,
  alt = 'Before and after comparison',
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset slider position when before/after image sources change
  const [prevImagesKey, setPrevImagesKey] = useState(`${beforeImage}-${afterImage}`);
  if (prevImagesKey !== `${beforeImage}-${afterImage}`) {
    setPrevImagesKey(`${beforeImage}-${afterImage}`);
    setSliderPosition(initialPosition);
  }

  const handleSliderMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width === 0) return;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  // Global mouse & touch listeners while dragging
  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      handleSliderMove(clientX);
    };

    const onEnd = () => setIsDragging(false);

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [isDragging, handleSliderMove]);

  const validBefore = (beforeImage || '').trim();
  const validAfter = (afterImage || '').trim();

  // No Photos Available: Fallback placeholder view (never pass empty string to img src)
  if (!validBefore && !validAfter) {
    return (
      <div
        className={`relative w-full overflow-hidden rounded-2xl bg-slate-100 border border-slate-200/90 flex flex-col items-center justify-center p-3 text-center ${aspectRatioClassName} ${className}`}
      >
        <div className="w-8 h-8 rounded-full bg-slate-200/80 flex items-center justify-center text-slate-400 mb-1">
          <svg
            className="w-4 h-4 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <span className="text-[10.5px] font-bold text-slate-400">
          {emptyNotice}
        </span>
      </div>
    );
  }

  // Single Photo View (only beforeImage available and no placeholder)
  if (!validAfter && validBefore) {
    return (
      <div
        className={`relative w-full overflow-hidden rounded-2xl bg-slate-900 border border-slate-200/90 shadow-xs ${aspectRatioClassName} ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={validBefore}
          alt={alt}
          className="w-full h-full object-cover"
        />
        <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-rose-600/90 backdrop-blur-xs text-white text-[10px] font-black tracking-wide shadow-md">
          {beforeLabel}
        </span>
        {photoBadge && (
          <span className="absolute bottom-2 left-2 z-10 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[9.5px] font-bold">
            📷 {photoBadge}
          </span>
        )}
      </div>
    );
  }

  // Single Photo View (only afterImage available)
  if (!validBefore && validAfter && !validAfter.startsWith('placeholder:')) {
    return (
      <div
        className={`relative w-full overflow-hidden rounded-2xl bg-slate-900 border border-slate-200/90 shadow-xs ${aspectRatioClassName} ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={validAfter}
          alt={alt}
          className="w-full h-full object-cover"
        />
        <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-emerald-600/90 backdrop-blur-xs text-white text-[10px] font-black tracking-wide shadow-md">
          {afterLabel}
        </span>
      </div>
    );
  }

  const isAfterPlaceholder = validAfter.startsWith('placeholder:');

  // Interactive Split Comparison Slider
  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Before and after image comparison slider"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setSliderPosition((prev) => Math.max(0, prev - 5));
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          setSliderPosition((prev) => Math.min(100, prev + 5));
        }
      }}
      onMouseDown={(e) => {
        setIsDragging(true);
        handleSliderMove(e.clientX);
      }}
      onTouchStart={(e) => {
        setIsDragging(true);
        handleSliderMove(e.touches[0].clientX);
      }}
      className={`relative w-full overflow-hidden rounded-2xl bg-slate-900 border border-slate-200/90 shadow-xs touch-none cursor-ew-resize select-none group focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${aspectRatioClassName} ${className}`}
    >
      {/* 1. Background Layer: Cleaned (After) Image OR Smart Municipal In-Progress Pane */}
      {isAfterPlaceholder ? (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex flex-col items-center justify-center p-3 text-center select-none pointer-events-none">
          <div className="relative mb-1">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-emerald-400 opacity-75"></span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <span className="text-[11px] font-black text-white tracking-wide">{inProgressTitle}</span>
          <span className="text-[9px] font-medium text-emerald-300/80 max-w-[130px] leading-tight mt-0.5">
            {inProgressNotice}
          </span>
        </div>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={validAfter}
          alt="After comparison"
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
          draggable={false}
        />
      )}
      <span className={`absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full ${isAfterPlaceholder ? 'bg-amber-600/90' : 'bg-emerald-600/90'} backdrop-blur-xs text-white text-[10px] font-black tracking-wide shadow-md z-10 pointer-events-none`}>
        {afterLabel}
      </span>

      {/* 2. Foreground Layer: Dirty (Before) Image with dynamic clip-path */}
      <div
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        className="absolute inset-0 overflow-hidden pointer-events-none select-none transition-none"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={validBefore}
          alt="Before comparison"
          className="w-full h-full object-cover select-none pointer-events-none"
          draggable={false}
        />
        <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-rose-600/90 backdrop-blur-xs text-white text-[10px] font-black tracking-wide shadow-md z-10 pointer-events-none">
          {beforeLabel}
        </span>
      </div>

      {/* Multiple Photos Badge Pill */}
      {photoBadge && (
        <span className="absolute bottom-2 left-2 z-10 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[9.5px] font-bold pointer-events-none">
          📷 {photoBadge}
        </span>
      )}

      {/* 3. Divider Line & Draggable Pill Handle (↔) */}
      <div
        style={{ left: `${sliderPosition}%` }}
        className="absolute inset-y-0 -ml-[1px] w-[2px] bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] flex items-center justify-center pointer-events-none z-10"
      >
        <div
          role="slider"
          aria-label="Comparison slider position"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(sliderPosition)}
          className="w-7 h-7 rounded-full bg-white border-2 border-emerald-500 text-emerald-600 flex items-center justify-center shadow-lg text-[11px] font-black pointer-events-auto cursor-ew-resize transition-transform group-hover:scale-110 active:scale-95"
        >
          ↔
        </div>
      </div>
    </div>
  );
}

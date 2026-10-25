'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Maximize2, ArrowLeftRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ResolutionProof } from '@/types/grievance';

interface ResolutionImageSliderProps {
  proof: ResolutionProof;
  onPreviewImage: (data: { url: string; title: string; isAfter: boolean }) => void;
}

export function ResolutionImageSlider({
  proof,
  onPreviewImage,
}: ResolutionImageSliderProps) {
  const t = useTranslations('grievance');
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const sliderContainerRef = useRef<HTMLDivElement>(null);

  const handleSliderMove = useCallback((clientX: number) => {
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const percentage = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
    setSliderPosition(Math.round(percentage));
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent | TouchEvent) =>
      handleSliderMove('touches' in e ? e.touches[0].clientX : e.clientX);
    const onUp = () => setIsDragging(false);

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [isDragging, handleSliderMove]);

  if (!proof.afterImageUrl) {
    return (
      <div className="grid gap-2 sm:gap-3 grid-cols-2">
        <div
          onClick={() =>
            onPreviewImage({
              url: proof.beforeImageUrl,
              title: 'Before Resolution',
              isAfter: false,
            })
          }
          className="relative rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200 shadow-2xs group bg-slate-900/5 h-36 sm:h-44 md:h-48 cursor-pointer"
          title="Click to view full-screen HD"
        >
          <span className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 z-10 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-rose-600 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-md">
            BEFORE
          </span>
          <span className="absolute bottom-1.5 right-1.5 z-10 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-white text-[9px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            <Maximize2 className="w-2.5 h-2.5" />
            <span className="hidden sm:inline">{t('tapToZoom')}</span>
          </span>
          {/* Before Resolution Image */}
          <Image
            src={proof.beforeImageUrl}
            alt="Before resolution"
            fill
            unoptimized
            className="object-cover group-hover:scale-103 transition-transform duration-300"
          />
        </div>

        <div className="relative rounded-xl sm:rounded-2xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center p-4 text-center h-36 sm:h-44 md:h-48">
          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full mb-1">
            {t('workInProgress')}
          </span>
          <p className="text-xs text-slate-500 font-medium">
            {t('afterPhotoUploadPending')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={sliderContainerRef}
      onMouseDown={(e) => {
        setIsDragging(true);
        handleSliderMove(e.clientX);
      }}
      onTouchStart={(e) => {
        setIsDragging(true);
        handleSliderMove(e.touches[0].clientX);
      }}
      className="relative w-full h-44 sm:h-52 md:h-60 rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200 bg-slate-900/5 cursor-ew-resize select-none touch-none shadow-2xs group"
      title="Drag slider to compare Before & After"
    >
      {/* Right/Background: After Resolution Photo */}
      <Image
        src={proof.afterImageUrl}
        alt="After resolution"
        fill
        unoptimized
        className="object-cover"
        draggable={false}
      />
      <span className="absolute top-2.5 right-2.5 z-10 px-2.5 py-0.5 sm:py-1 rounded-full bg-emerald-600/90 backdrop-blur-xs text-white text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-md">
        {t('statusCleaned')}
      </span>

      {/* Left/Foreground: Before Resolution Photo with clip-path */}
      <div
        className="absolute inset-0 w-full h-full overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <Image
          src={proof.beforeImageUrl}
          alt="Before resolution"
          fill
          unoptimized
          className="object-cover"
          draggable={false}
        />
        <span className="absolute top-2.5 left-2.5 z-10 px-2.5 py-0.5 sm:py-1 rounded-full bg-rose-600/90 backdrop-blur-xs text-white text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-md">
          {t('statusDirty')}
        </span>
      </div>

      {/* Draggable Divider Handle with ↔ pill */}
      <div
        style={{ left: `${sliderPosition}%` }}
        className="absolute inset-y-0 -ml-[1px] w-[2px] bg-white shadow-[0_0_12px_rgba(0,0,0,0.6)] flex items-center justify-center pointer-events-none z-20"
      >
        <div
          tabIndex={0}
          role="slider"
          aria-label="Comparison slider"
          aria-valuenow={sliderPosition}
          aria-valuemin={0}
          aria-valuemax={100}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') setSliderPosition((p) => Math.max(5, p - 5));
            if (e.key === 'ArrowRight') setSliderPosition((p) => Math.min(95, p + 5));
          }}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border-2 border-emerald-500 text-emerald-600 flex items-center justify-center shadow-lg pointer-events-auto cursor-ew-resize hover:scale-110 active:scale-95 transition-transform focus:outline-hidden focus:ring-2 focus:ring-emerald-400"
        >
          <ArrowLeftRight className="w-3.5 h-3.5 stroke-[2.5]" />
        </div>
      </div>

      {/* Floating helper note & Full-screen zoom CTA */}
      <div className="absolute bottom-2 sm:bottom-2.5 inset-x-2 sm:inset-x-2.5 flex items-center justify-between pointer-events-none z-20">
        <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[9px] sm:text-[10px] font-semibold opacity-85 group-hover:opacity-100 transition-opacity">
          {t('dragToCompare')}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPreviewImage({
              url: sliderPosition < 50 ? proof.afterImageUrl! : proof.beforeImageUrl,
              title: sliderPosition < 50 ? 'After Resolution' : 'Before Resolution',
              isAfter: sliderPosition < 50,
            });
          }}
          className="pointer-events-auto px-2 py-1 rounded-md bg-black/60 hover:bg-black/80 backdrop-blur-xs text-white text-[9px] sm:text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-xs"
          title="Click to view full-screen HD"
        >
          <Maximize2 className="w-2.5 h-2.5" />
          <span className="hidden sm:inline">{t('tapToZoom')}</span>
        </button>
      </div>
    </div>
  );
}

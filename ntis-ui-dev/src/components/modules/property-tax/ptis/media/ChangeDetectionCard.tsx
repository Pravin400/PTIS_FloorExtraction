'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { ImageWithFallback } from './ImageWithFallback';

interface ChangeDetectionCardProps {
  beforeImageSrc?: string;
  afterImageSrc?: string;
  beforeLabel?: string;
  afterLabel?: string;
  fallbackBeforeSrc?: string;
  fallbackAfterSrc?: string;
  onClick?: () => void;
  onMouseEnter?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave?: () => void;
}

export function ChangeDetectionCard({
  beforeImageSrc = '',
  afterImageSrc = '',
  beforeLabel = 'Before (Old)',
  afterLabel = 'After (New)',
  fallbackBeforeSrc,
  fallbackAfterSrc,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: ChangeDetectionCardProps): React.ReactElement {
  const t = useTranslations('ptis');

  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`
        relative flex-1 min-h-[105px] lg:min-h-0 lg:h-0 w-full rounded-lg overflow-hidden
        border border-slate-200/80 shadow-md transition-all duration-300
        hover:shadow-lg hover:border-blue-400 bg-white
        ${onClick ? 'cursor-pointer hover:scale-[1.01]' : ''}
      `}
    >
      {/* 50/50 split container */}
      <div className="grid grid-cols-2 h-full w-full relative">
        {/* Left Side: Before */}
        <div className="relative h-full w-full overflow-hidden group/before border-r border-slate-200">
          <ImageWithFallback
            src={beforeImageSrc}
            fallbackSrc={fallbackBeforeSrc}
            alt={`${beforeLabel} Satellite View`}
            fill
            sizes="(max-width: 768px) 50vw, 100px"
            className="w-full h-full object-cover transition-transform duration-500 group-hover/before:scale-110"
            priority
          />
          {/* Year Badge */}
          <div className="absolute top-2 left-2 z-10 bg-black/75 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm backdrop-blur-[2px] pointer-events-none">
            {beforeLabel}
          </div>
        </div>

        {/* Right Side: After */}
        <div className="relative h-full w-full overflow-hidden group/after">
          <ImageWithFallback
            src={afterImageSrc}
            fallbackSrc={fallbackAfterSrc}
            alt={`${afterLabel} Satellite View`}
            fill
            sizes="(max-width: 768px) 50vw, 100px"
            className="w-full h-full object-cover transition-transform duration-500 group-hover/after:scale-110"
            priority
          />
          {/* Year Badge (Emerald highlight to indicate new/updated) */}
          <div className="absolute top-2 left-2 z-10 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm pointer-events-none">
            {afterLabel}
          </div>
        </div>
      </div>

      {/* Bottom overlay banner spanning both halves */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 flex items-end pointer-events-none select-none">
        <span className="text-white text-xs lg:text-sm font-bold tracking-wide drop-shadow-md">
          {t('media.changeDetection') || 'Change Detection'}
        </span>
      </div>
    </div>
  );
}

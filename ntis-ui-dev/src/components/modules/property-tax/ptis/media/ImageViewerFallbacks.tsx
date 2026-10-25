'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

/** Skeleton shown while the main image is loading. */
export function ImageLoadingSkeleton({
  label,
  subtitle,
}: {
  label?: string;
  subtitle?: string;
} = {}): React.ReactElement {
  const t = useTranslations('ptis');
  const displayLabel = label || t('media.loadingImage') || 'Loading image...';
  const displaySubtitle = subtitle || t('media.pleaseWait') || 'Please wait a moment...';

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-100/75 backdrop-blur-[2px] z-20 transition-all select-none">
      <div className="flex flex-col items-center justify-center gap-3 p-6 bg-white/95 rounded-2xl shadow-lg border border-slate-200/90 max-w-xs text-center animate-in fade-in duration-200">
        <div className="relative flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-3 border-blue-100 border-t-blue-600 animate-spin" />
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs font-semibold text-slate-700 tracking-wide">
            {displayLabel}
          </span>
          <span className="text-[11px] text-slate-400">
            {displaySubtitle}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Fallback shown when the main image fails to load. */
export function ImageErrorFallback({
  alt,
  errorLabel,
}: {
  alt: string;
  errorLabel: string;
}): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8 text-slate-500">
      <svg className="w-16 h-16 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 9v2m0 4h.01M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <span className="text-sm font-medium opacity-60 text-center">
        {errorLabel}: {alt}
      </span>
    </div>
  );
}

/** Shimmer skeleton shown while an image is loading. */
export function ImageSkeleton({ className }: { className: string }): React.ReactElement {
  return (
    <div
      className={`bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] ${className}`}
      aria-hidden="true"
    />
  );
}

/** Placeholder shown when src is empty or the image fails to load. */
export function ImagePlaceholder({
  alt,
  isSmall,
  label,
}: {
  alt: string;
  isSmall: boolean;
  label: string;
}): React.ReactElement {
  return (
    <div
      className="flex items-center justify-center bg-slate-100 text-slate-400 w-full h-full border border-slate-200"
      aria-label={alt}
    >
      <div className="flex flex-col items-center justify-center gap-0.5 p-1 text-center">
        <svg
          className={`${isSmall ? 'w-4 h-4' : 'w-5 h-5 xl:w-6 xl:h-6 2xl:w-7 2xl:h-7'} text-slate-400 opacity-70 shrink-0`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        {!isSmall && (
          <span className="text-[8.5px] sm:text-[9px] xl:text-[9.5px] 2xl:text-xs font-medium opacity-70 text-center leading-tight break-words px-0.5">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

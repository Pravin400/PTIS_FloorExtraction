'use client';

import React, { useState } from 'react';
import NextImage from 'next/image';
import { useTranslations } from 'next-intl';
import { ImageWithFallbackProps } from '@/types/asset/asset-register/media.types';

export function ImageWithFallback({
  src,
  alt = '',
  className = '',
  width,
  height,
  fill,
  sizes,
  priority = false,
  onLoad,
  style,
}: ImageWithFallbackProps): React.ReactElement {
  const [failedSrc, setFailedSrc] = useState<string | undefined>(undefined);
  const t = useTranslations('assetRegister');

  const hasError = !src || failedSrc === src;

  const handleError = () => {
    setFailedSrc(src);
  };

  if (hasError || !src) {
    const isSmall = width !== undefined && width < 100;
    return (
      <div
        className="flex items-center justify-center bg-slate-100 text-slate-400 w-full h-full border border-slate-200"
        aria-label={alt}
      >
        <div className="flex flex-col items-center justify-center gap-1 p-2 text-center select-none">
          <svg
            className={`${isSmall ? 'w-5 h-5' : 'w-8 h-8'} text-slate-400 opacity-60`}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
            />
          </svg>
          {!isSmall && (
            <span className="text-[10px] font-semibold opacity-60 text-center leading-tight">
              {t('Image_Unavailable') || 'Image Unavailable'}
            </span>
          )}
        </div>
      </div>
    );
  }

  const isUnoptimized =
    src.startsWith('data:') ||
    src.startsWith('blob:') ||
    src.startsWith('/api/documents/');

  return (
    <div className="relative w-full h-full" style={style}>
      <NextImage
        src={src}
        alt={alt}
        className={className}
        onError={handleError}
        onLoad={onLoad}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        sizes={sizes}
        priority={priority}
        unoptimized={isUnoptimized}
        style={fill ? { objectFit: 'cover' } : undefined}
      />
    </div>
  );
}

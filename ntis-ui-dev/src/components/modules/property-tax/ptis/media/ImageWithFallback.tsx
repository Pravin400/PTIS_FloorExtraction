'use client';

import React, { useState, useCallback } from 'react';
import NextImage from 'next/image';
import { useTranslations } from 'next-intl';
import { ImageSkeleton, ImagePlaceholder } from './ImageViewerFallbacks';

interface ImageWithFallbackProps {
  src: string;
  documentGuid?: string;
  alt?: string;
  fallbackSrc?: string;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  unoptimized?: boolean;
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  style?: React.CSSProperties;
  hasPhoto?: boolean;
  emptyLabel?: string;
}

export function getDirectDocumentUrl(src?: string, documentGuid?: string): string {
  if (src && (src.startsWith('data:') || src.startsWith('blob:') || src.startsWith('http:') || src.startsWith('https:'))) {
    return src;
  }
  if (src && src.startsWith('/api/documents/')) {
    return src;
  }

  let guid = documentGuid;
  if (!guid && src) {
    const match = src.match(/\/documents\/([^/?]+)/);
    if (match) {
      guid = match[1];
    }
  }

  if (!guid || guid === 'undefined' || guid === 'null' || !guid.trim()) {
    if (src && !src.includes('/documents/undefined') && !src.includes('/documents/null')) {
      return src;
    }
    return '';
  }

  const decodedGuid = decodeURIComponent(guid.trim());
  return `/api/documents/${encodeURIComponent(decodedGuid)}/view`;
}

export async function resolveDocumentUrl(src: string, documentGuid?: string): Promise<string> {
  return getDirectDocumentUrl(src, documentGuid);
}

export function ImageWithFallback({
  src,
  documentGuid,
  alt = '',
  fallbackSrc,
  className = '',
  width: _width,
  height: _height,
  fill: _fill,
  sizes: _sizes,
  priority = false,
  unoptimized: _unoptimized,
  onLoad,
  style,
  hasPhoto,
  emptyLabel,
}: ImageWithFallbackProps): React.ReactElement {
  const directUrl = getDirectDocumentUrl(src, documentGuid);
  const targetSrc = directUrl || (fallbackSrc ?? '');
  const [prevTargetSrc, setPrevTargetSrc] = useState(targetSrc);
  const [resolvedSrc, setResolvedSrc] = useState<string>(targetSrc);
  const [hasError, setHasError] = useState(false);
  const [triedFallback, setTriedFallback] = useState(() => Boolean(!directUrl && fallbackSrc));
  const [isLoading, setIsLoading] = useState(() => Boolean(targetSrc));
  const t = useTranslations('ptis');

  if (prevTargetSrc !== targetSrc) {
    setPrevTargetSrc(targetSrc);
    setHasError(false);
    setTriedFallback(Boolean(!directUrl && fallbackSrc));
    setResolvedSrc(targetSrc);
    setIsLoading(Boolean(targetSrc));
  }

  const handleError = useCallback(() => {
    if (fallbackSrc && !triedFallback) {
      setTriedFallback(true);
      setResolvedSrc(fallbackSrc);
      setHasError(false);
      setIsLoading(true);
    } else {
      setHasError(true);
      setIsLoading(false);
      setResolvedSrc('');
    }
  }, [fallbackSrc, triedFallback]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const effectiveSrc = !hasError ? resolvedSrc : '';
  const isSmall = _width !== undefined && _width < 100;
  const isSlotBlank =
    hasPhoto === false ||
    ((!src || src === 'undefined' || src === 'null' || !src.trim()) &&
      (!documentGuid || documentGuid === 'undefined' || documentGuid === 'null' || !documentGuid.trim()) &&
      !effectiveSrc);

  if (isLoading && !effectiveSrc && !isSlotBlank) {
    return (
      <div className={`relative w-full h-full overflow-hidden bg-slate-100 flex items-center justify-center ${className}`} style={style}>
        <ImageSkeleton className="w-full h-full" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin opacity-70" />
        </div>
      </div>
    );
  }

  // If the slot has no photo uploaded or has no document specified, show 'No Photo'
  if (isSlotBlank) {
    return <ImagePlaceholder alt={alt} isSmall={isSmall} label={emptyLabel || t('media.noPhoto') || 'No Photo'} />;
  }

  // If an actual image was specified but failed to load, show 'Image Unavailable'
  if (hasError) {
    return <ImagePlaceholder alt={alt} isSmall={isSmall} label={t('media.imageUnavailable') || 'Image Unavailable'} />;
  }

  if (!effectiveSrc) {
    return <ImagePlaceholder alt={alt} isSmall={isSmall} label={emptyLabel || t('media.noPhoto') || 'No Photo'} />;
  }

  const objectFit = className.includes('object-cover')
    ? 'cover'
    : className.includes('object-contain')
    ? 'contain'
    : undefined;

  return (
    <div className="relative w-full h-full overflow-hidden" style={style}>
      {isLoading && <ImageSkeleton className={`w-full h-full ${className}`} />}
      {effectiveSrc && (
        <NextImage
          src={effectiveSrc}
          alt={alt}
          fill
          sizes={_sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'}
          priority={priority}
          className={`w-full h-full ${className}`}
          style={{ objectFit: objectFit || 'cover' }}
          onError={handleError}
          onLoad={(e) => {
            handleLoad();
            onLoad?.(e as unknown as React.SyntheticEvent<HTMLImageElement>);
          }}
          unoptimized={true}
        />
      )}
    </div>
  );
}

/** Utility to clear document references if needed */
export function clearDocumentCacheEntry(_srcOrGuid?: string): void {
  // No-op: caching removed
}

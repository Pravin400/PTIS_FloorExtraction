'use client';

import React, { useState, useCallback, useEffect } from 'react';
import NextImage from 'next/image';
import { useTranslations } from 'next-intl';
import { getDocumentAction } from '@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/document.actions';
import { fetchAssetDocumentFile } from '@/app/[locale]/assets/municipal-Asset/asset-detail/actions';
import { ImageSkeleton, ImagePlaceholder } from './ImageViewerFallbacks';

import { ImageWithFallbackProps } from '@/types/asset/media.types';

/** blob: and data: URLs are browser-generated — Next.js optimizer cannot handle them. */
function isBlobOrDataUrl(src: string): boolean {
  return src.startsWith('blob:') || src.startsWith('data:');
}

/**
 * Image component with built-in loading skeleton, error fallback, and optimization.
 * All URLs are rendered through NextImage — blob/data/external URLs set `unoptimized`
 * to bypass the Next.js image optimizer.
 */
// In-memory cache for document base64 data URLs to prevent re-fetching and flickering
export const documentCache = new Map<string, string | Promise<string>>();

/** Remove a single document from the in-memory cache so it will be re-fetched.
 *  Call this after replacing an image to ensure the new version loads. */
export function clearDocumentCacheEntry(src: string): void {
  if (!src || (!src.startsWith('/api/documents/') && !src.startsWith('/api/asset-documents/'))) return;
  const guidOrId = src.split('/')[3];
  if (guidOrId) documentCache.delete(guidOrId);
}

export function ImageWithFallback({
  src,
  alt = '',
  fallbackSrc,
  className = '',
  width,
  height,
  fill,
  sizes,
  priority = false,
  onLoad,
  onError,
  hideErrorBanner = false,
  style,
}: ImageWithFallbackProps): React.ReactElement {
  const [prevSrc, setPrevSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const getInitialState = useCallback((currentSrc: string) => {
    if (!currentSrc || (!currentSrc.startsWith('/api/documents/') && !currentSrc.startsWith('/api/asset-documents/'))) {
      return { resolved: currentSrc, loading: false };
    }
    const parts = currentSrc.split('/');
    const guidOrId = parts[3];
    if (guidOrId && documentCache.has(guidOrId)) {
      const cached = documentCache.get(guidOrId)!;
      if (typeof cached === 'string') {
        return { resolved: cached, loading: false };
      }
    }
    return { resolved: '', loading: true };
  }, []);

  const initialState = getInitialState(src);
  const [resolvedSrc, setResolvedSrc] = useState(initialState.resolved);
  const [isLoading, setIsLoading] = useState(initialState.loading);
  const t = useTranslations('ptis');

  if (src !== prevSrc) {
    setPrevSrc(src);
    setHasError(false);
    const nextState = getInitialState(src);
    setIsLoading(nextState.loading);
    setResolvedSrc(nextState.resolved);
  }

  useEffect(() => {
    if (!src || (!src.startsWith('/api/documents/') && !src.startsWith('/api/asset-documents/'))) {
      return;
    }
    const isAssetDoc = src.startsWith('/api/asset-documents/');
    const parts = src.split('/');
    const guidOrId = parts[3];
    if (!guidOrId) return;

    let active = true;

    if (documentCache.has(guidOrId)) {
      const cached = documentCache.get(guidOrId)!;
      if (typeof cached === 'string') {
        return;
      }
      cached.then((dataUrl) => {
        if (active) {
          setResolvedSrc(dataUrl);
          setHasError(false);
          setIsLoading(false);
        }
      }).catch(() => {
        // Evict failed promise so a future render can retry.
        documentCache.delete(guidOrId);
        if (active) {
          setHasError(true);
          setIsLoading(false);
        }
      });
      return () => {
        active = false;
      };
    }

    let promise: Promise<string>;

    if (isAssetDoc) {
      promise = fetchAssetDocumentFile(decodeURIComponent(guidOrId)).then((res) => {
        if (!res.error && res.base64) {
          const dataUrl = `data:${res.contentType};base64,${res.base64}`;
          documentCache.set(guidOrId, dataUrl);
          return dataUrl;
        }
        return src;
      }).catch(() => src);
    } else {
      promise = getDocumentAction(decodeURIComponent(guidOrId), 'view').then((res) => {
        if (res.success && res.data?.base64) {
          const dataUrl = `data:${res.data.contentType};base64,${res.data.base64}`;
          documentCache.set(guidOrId, dataUrl);
          return dataUrl;
        }
        return src;
      }).catch(() => src);
    }

    documentCache.set(guidOrId, promise);

    promise.then((dataUrl) => {
      if (active) {
        setResolvedSrc(dataUrl);
        setHasError(false);
        setIsLoading(false);
      }
    }).catch(() => {
      // Evict failed promise so a future render can retry.
      documentCache.delete(guidOrId);
      if (active) {
        setHasError(true);
        setIsLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [src]);

  const handleError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    setHasError(true);
    setIsLoading(false);
    if (onError) onError(e);
  }, [onError]);

  const handleLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoading(false);
    if (onLoad) onLoad(e);
  }, [onLoad]);

  const effectiveSrc = hasError && fallbackSrc ? fallbackSrc : resolvedSrc;
  const isSmall = width !== undefined && width < 100;
  const noImageLabel = t.has?.('media.noImagePresent') ? t('media.noImagePresent') : 'No image present';
  const loadFailedLabel = t.has?.('media.imageLoadFailed') ? t('media.imageLoadFailed') : 'Image failed to load';

  if ((hasError || !src) && !fallbackSrc) {
    if (hideErrorBanner) {
      return (
        <ImagePlaceholder alt={alt} isSmall={isSmall} label={noImageLabel} variant="missing" />
      );
    }
    return hasError && src ? (
      <ImagePlaceholder alt={alt} isSmall={isSmall} label={loadFailedLabel} variant="error" />
    ) : (
      <ImagePlaceholder alt={alt} isSmall={isSmall} label={noImageLabel} variant="missing" />
    );
  }

  const objectFit = className.includes('object-cover')
    ? 'cover'
    : className.includes('object-contain')
      ? 'contain'
      : undefined;

  return (
    <div className="relative w-full h-full" style={style}>
      {isLoading && <ImageSkeleton className={className} />}
      {!isLoading && effectiveSrc && (
        <NextImage
          src={effectiveSrc}
          alt={alt}
          className={className}
          style={{ objectFit }}
          onError={handleError}
          onLoad={(e) => {
            handleLoad(e);
          }}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          fill={fill}
          sizes={sizes ?? (fill ? '100vw' : undefined)}
          priority={priority}
          quality={75}
          loading={priority ? undefined : 'lazy'}
          unoptimized={
            isBlobOrDataUrl(effectiveSrc) ||
            !effectiveSrc.startsWith('/') ||
            effectiveSrc.startsWith('/api/documents/') ||
            effectiveSrc.startsWith('/api/asset-documents/')
          }
        />
      )}
    </div>
  );
}

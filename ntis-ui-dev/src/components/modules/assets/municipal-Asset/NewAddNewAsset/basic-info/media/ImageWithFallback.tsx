/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import NextImage from 'next/image';
import { useTranslations } from 'next-intl';
import { getDocumentAction } from '@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/document.actions';
import { fetchAssetDocumentFile } from '@/app/[locale]/assets/municipal-Asset/asset-detail/actions';
import { ImageSkeleton, ImagePlaceholder } from './ImageViewerFallbacks';
import { ImageWithFallbackProps } from '@/types/asset/media.types';

export const documentCache = new Map<string, string | Promise<string>>();

export async function resolveDocumentUrl(src: string, documentGuid?: string): Promise<string> {
  if (src && (src.startsWith('data:') || src.startsWith('blob:'))) {
    return src;
  }
  if (!src && !documentGuid) return '';

  let guid = documentGuid;
  const isAssetDoc = Boolean(src && src.startsWith('/api/asset-documents/'));

  if (!guid && src) {
    const match = src.match(/\/documents\/([^/]+)/) || src.match(/\/asset-documents\/([^/]+)/);
    if (match) {
      guid = match[1];
    }
  }

  // Guard against invalid GUID string literals ('undefined', 'null', whitespace)
  if (!guid || guid === 'undefined' || guid === 'null' || !guid.trim()) {
    if (src && !src.includes('/documents/undefined') && !src.includes('/documents/null') && !src.includes('/asset-documents/undefined') && !src.includes('/asset-documents/null')) {
      return src;
    }
    return '';
  }

  const decodedGuid = decodeURIComponent(guid);

  if (documentCache.has(decodedGuid)) {
    return documentCache.get(decodedGuid)!;
  }
  if (documentCache.has(guid)) {
    return documentCache.get(guid)!;
  }
  if (src && documentCache.has(src)) {
    return documentCache.get(src)!;
  }

  const fetchPromise = (async () => {
    try {
      if (isAssetDoc) {
        const res = await fetchAssetDocumentFile(decodedGuid);
        if (!res.error && res.base64) {
          const dataUrl = `data:${res.contentType};base64,${res.base64}`;
          documentCache.set(decodedGuid, dataUrl);
          return dataUrl;
        }
      } else {
        const res = await getDocumentAction(decodedGuid, 'view');
        if (res.success && res.data?.base64) {
          const dataUrl = `data:${res.data.contentType};base64,${res.data.base64}`;
          documentCache.set(decodedGuid, dataUrl);
          return dataUrl;
        }
      }
      documentCache.delete(decodedGuid);
      return src || '';
    } catch (_err) {
      documentCache.delete(decodedGuid);
      return src || '';
    }
  })();

  documentCache.set(decodedGuid, fetchPromise);
  return fetchPromise;
}

export function ImageWithFallback({
  src,
  initialResolvedSrc,
  documentGuid,
  alt = '',
  fallbackSrc,
  className = '',
  width: _width,
  height: _height,
  fill: _fill,
  sizes: _sizes,
  priority: _priority = false,
  unoptimized,
  onLoad,
  onError,
  style,
  hasPhoto,
  emptyLabel,
}: ImageWithFallbackProps): React.ReactElement {
  const [resolvedSrc, setResolvedSrc] = useState<string>(initialResolvedSrc || '');
  const [hasError, setHasError] = useState(false);
  const [triedFallback, setTriedFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(!initialResolvedSrc);
  const t = useTranslations('newAddNewAsset');

  const handleError = useCallback((e?: React.SyntheticEvent<HTMLImageElement>) => {
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
    if (onError && e) onError(e);
  }, [fallbackSrc, triedFallback, onError]);

  const handleLoad = useCallback((e?: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoading(false);
    if (onLoad && e) onLoad(e);
  }, [onLoad]);

  useEffect(() => {
    if (initialResolvedSrc) {
      setResolvedSrc(initialResolvedSrc);
      setIsLoading(false);
      return;
    }
    let active = true;
    setIsLoading(true);
    setHasError(false);
    setTriedFallback(false);
    setResolvedSrc('');

    const timer = setTimeout(() => {
      if (active) {
        setIsLoading(false);
        setHasError(true);
      }
    }, 15000);

    const isBlank =
      (!src || src === 'undefined' || src === 'null' || !src.trim()) &&
      (!documentGuid || documentGuid === 'undefined' || documentGuid === 'null' || !documentGuid.trim());

    if (isBlank) {
      if (fallbackSrc) {
        setTriedFallback(true);
        setResolvedSrc(fallbackSrc);
        setHasError(false);
        setIsLoading(true);
      } else {
        setHasError(false);
        setResolvedSrc('');
        setIsLoading(false);
      }
      clearTimeout(timer);
      return;
    }

    resolveDocumentUrl(src, documentGuid)
      .then((url) => {
        if (active) {
          if (url) {
            setResolvedSrc(url);
            setHasError(false);
          } else if (fallbackSrc) {
            setTriedFallback(true);
            setResolvedSrc(fallbackSrc);
            setHasError(false);
          } else {
            setHasError(true);
            setResolvedSrc('');
          }
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          if (fallbackSrc) {
            setTriedFallback(true);
            setResolvedSrc(fallbackSrc);
            setHasError(false);
          } else {
            setHasError(true);
            setResolvedSrc('');
          }
          setIsLoading(false);
        }
      })
      .finally(() => {
        clearTimeout(timer);
      });

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [src, documentGuid, fallbackSrc, initialResolvedSrc]);

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
    return <ImagePlaceholder alt={alt} isSmall={isSmall} label={emptyLabel || (t.has?.('media.noPhoto') ? t('media.noPhoto') : 'No Photo')} />;
  }

  // If an actual image was specified but failed to load, show 'Image Unavailable'
  if (hasError) {
    return <ImagePlaceholder alt={alt} isSmall={isSmall} label={t.has?.('media.imageUnavailable') ? t('media.imageUnavailable') : 'Image Unavailable'} variant="error" />;
  }

  if (!effectiveSrc) {
    return <ImagePlaceholder alt={alt} isSmall={isSmall} label={emptyLabel || (t.has?.('media.noPhoto') ? t('media.noPhoto') : 'No Photo')} />;
  }

  const objectFit = className.includes('object-cover')
    ? 'cover'
    : className.includes('object-contain')
    ? 'contain'
    : undefined;

  const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
  const isDataOrBlob = effectiveSrc.startsWith('data:') || effectiveSrc.startsWith('blob:');
  const isRemoteTile =
    effectiveSrc.includes('arcgis.com') ||
    effectiveSrc.includes('arcgisonline.com') ||
    effectiveSrc.includes('openstreetmap.org');
  const shouldUnoptimize = unoptimized ?? (isDataOrBlob || isRemoteTile || isTest);
  const normalizedSrc =
    !shouldUnoptimize && !effectiveSrc.startsWith('/') && !effectiveSrc.startsWith('http://') && !effectiveSrc.startsWith('https://')
      ? `/${effectiveSrc}`
      : effectiveSrc;

  return (
    <div className="relative w-full h-full overflow-hidden" style={style}>
      {isLoading && <ImageSkeleton className={`w-full h-full ${className}`} />}
      {effectiveSrc && (
        <NextImage
          src={normalizedSrc}
          alt={alt}
          fill
          sizes={_sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'}
          priority={_priority}
          className={`w-full h-full ${className}`}
          style={{ objectFit: objectFit || 'cover' }}
          onError={(e) => handleError(e)}
          onLoad={(e) => handleLoad(e)}
          unoptimized={shouldUnoptimize}
        />
      )}
    </div>
  );
}

/** Clears a cached document entry (or all entries if no key specified) */
export function clearDocumentCacheEntry(srcOrGuid?: string): void {
  if (!srcOrGuid) {
    documentCache.clear();
    return;
  }
  const match = srcOrGuid.match(/\/documents\/([^/]+)/) || srcOrGuid.match(/\/asset-documents\/([^/]+)/);
  const guid = match ? match[1] : srcOrGuid;
  const decodedGuid = decodeURIComponent(guid);
  documentCache.delete(decodedGuid);
  documentCache.delete(guid);
  documentCache.delete(srcOrGuid);
}

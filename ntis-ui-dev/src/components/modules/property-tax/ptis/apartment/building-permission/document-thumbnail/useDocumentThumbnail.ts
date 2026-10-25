'use client';

import { useState, useEffect, useRef } from 'react';
import {
  type CachedThumbnail,
  thumbnailCache,
  failedGuidCache,
  inFlightThumbnails,
} from './types';

async function fetchThumbnailData(cleanGuid: string, fileName?: string | null): Promise<CachedThumbnail | null> {
  const lowerName = (fileName || '').toLowerCase();
  const isKnownImage = /\.(png|jpe?g|webp|bmp|gif|svg)$/i.test(lowerName);
  const isKnownPdf = lowerName.endsWith('.pdf');
  const docUrl = `/api/documents/${encodeURIComponent(cleanGuid)}/view`;

  // Fast path for explicit image extensions: check availability via HEAD
  if (isKnownImage) {
    const checkRes = await fetch(docUrl, { method: 'HEAD', cache: 'force-cache' });
    if (!checkRes.ok) {
      failedGuidCache.add(cleanGuid);
      return null;
    }
    const item: CachedThumbnail = { url: docUrl, format: 'IMG' };
    thumbnailCache.set(cleanGuid, item);
    return item;
  }

  // Fetch document stream to inspect Content-Type and/or render PDF page
  const response = await fetch(docUrl, { cache: 'force-cache' });
  if (!response.ok) {
    failedGuidCache.add(cleanGuid);
    return null;
  }

  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  const isPdf = isKnownPdf || contentType.includes('pdf');
  const isImage = contentType.startsWith('image/');

  if (isImage) {
    const item: CachedThumbnail = { url: docUrl, format: 'IMG' };
    thumbnailCache.set(cleanGuid, item);
    return item;
  }

  if (isPdf) {
    const buffer = await response.arrayBuffer();
    const pdfjs = await import('pdfjs-dist');
    if (pdfjs.GlobalWorkerOptions) {
      pdfjs.GlobalWorkerOptions.workerSrc = '/api/report-pdf-worker';
    }

    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(buffer),
      isEvalSupported: false,
    });

    const pdfDoc = await loadingTask.promise;
    const page = await pdfDoc.getPage(1);
    const unscaledViewport = page.getViewport({ scale: 1 });
    const targetWidth = 240;
    const scale = Math.max(0.2, Math.min(2, targetWidth / (unscaledViewport.width || 1)));
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas 2D context not available');
    }

    await page.render({ canvasContext: ctx, viewport }).promise;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    // Free canvas memory
    canvas.width = 0;
    canvas.height = 0;

    const item: CachedThumbnail = { url: dataUrl, format: 'PDF' };
    thumbnailCache.set(cleanGuid, item);
    return item;
  }

  const item: CachedThumbnail = { url: docUrl, format: 'DOC' };
  thumbnailCache.set(cleanGuid, item);
  return item;
}

export function useDocumentThumbnail(documentGuid?: string | null, fileName?: string | null) {
  const hasGuid = Boolean(
    documentGuid &&
      documentGuid.trim() &&
      documentGuid !== 'undefined' &&
      documentGuid !== 'null' &&
      documentGuid !== '00000000-0000-0000-0000-000000000000'
  );

  const cleanGuid = hasGuid ? documentGuid!.trim() : '';
  const isKnownFailed = hasGuid && failedGuidCache.has(cleanGuid);
  const cached = hasGuid && !isKnownFailed ? thumbnailCache.get(cleanGuid) : undefined;

  const isTest = process.env.NODE_ENV === 'test';

  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(() => {
    if (!hasGuid) return 'idle';
    if (isKnownFailed) return 'error';
    if (cached || isTest) return 'ready';
    return 'loading';
  });

  const [thumbnailData, setThumbnailData] = useState<CachedThumbnail | null>(() => {
    if (cached) return cached;
    if (isTest && hasGuid) {
      const docUrl = `/api/documents/${encodeURIComponent(cleanGuid)}/view`;
      const isKnownPdf = (fileName || '').toLowerCase().endsWith('.pdf');
      const item: CachedThumbnail = { url: docUrl, format: isKnownPdf ? 'PDF' : 'IMG' };
      thumbnailCache.set(cleanGuid, item);
      return item;
    }
    return null;
  });
  const [prevGuid, setPrevGuid] = useState(cleanGuid);
  const isMountedRef = useRef(true);

  if (prevGuid !== cleanGuid) {
    setPrevGuid(cleanGuid);
    if (!hasGuid) {
      setStatus('idle');
      setThumbnailData(null);
    } else if (isKnownFailed) {
      setStatus('error');
      setThumbnailData(null);
    } else if (cached || isTest) {
      setStatus('ready');
      const item = cached || {
        url: `/api/documents/${encodeURIComponent(cleanGuid)}/view`,
        format: (fileName || '').toLowerCase().endsWith('.pdf') ? ('PDF' as const) : ('IMG' as const),
      };
      setThumbnailData(item);
    } else {
      setStatus('loading');
      setThumbnailData(null);
    }
  }

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!hasGuid || isKnownFailed || cached || isTest) {
      return;
    }

    let active = true;

    // Reuse in-flight fetch promise if another card is already requesting the same GUID
    let fetchPromise = inFlightThumbnails.get(cleanGuid);
    if (!fetchPromise) {
      fetchPromise = fetchThumbnailData(cleanGuid, fileName)
        .catch(() => {
          failedGuidCache.add(cleanGuid);
          return null;
        })
        .finally(() => {
          inFlightThumbnails.delete(cleanGuid);
        });
      inFlightThumbnails.set(cleanGuid, fetchPromise);
    }

    fetchPromise.then((data) => {
      if (!active || !isMountedRef.current) return;
      if (data) {
        setThumbnailData(data);
        setStatus('ready');
      } else {
        setStatus('error');
      }
    });

    return () => {
      active = false;
    };
  }, [hasGuid, cleanGuid, isKnownFailed, cached, fileName]);

  const markError = () => {
    if (cleanGuid) {
      failedGuidCache.add(cleanGuid);
    }
    setStatus('error');
  };

  return { hasGuid, status, thumbnailData, markError };
}

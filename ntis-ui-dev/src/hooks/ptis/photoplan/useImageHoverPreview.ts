'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export interface HoverPreviewData {
  src: string;
  src2?: string;
  title: string;
  beforeLabel?: string;
  afterLabel?: string;
  fallbackSrc?: string;
  fallbackSrc2?: string;
  documentGuid?: string;
}

export function useImageHoverPreview() {
  const [hoverPreview, setHoverPreview] = useState<HoverPreviewData | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleImageHover = useCallback(
    (
      src: string,
      title: string,
      src2?: string,
      beforeLabel?: string,
      afterLabel?: string,
      fallbackSrc?: string,
      fallbackSrc2?: string,
      documentGuid?: string
    ) => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
      setHoverPreview({
        src,
        src2,
        title,
        beforeLabel,
        afterLabel,
        fallbackSrc,
        fallbackSrc2,
        ...(documentGuid !== undefined ? { documentGuid } : {}),
      });
    },
    []
  );

  const handleImageLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoverPreview(null);
      hoverTimeoutRef.current = null;
    }, 250);
  }, []);

  const cancelImageLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, []);

  const resetHoverPreview = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoverPreview(null);
  }, []);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return {
    hoverPreview,
    handleImageHover,
    handleImageLeave,
    cancelImageLeave,
    resetHoverPreview,
  };
}

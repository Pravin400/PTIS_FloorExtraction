'use client';

import React, { useRef, useCallback } from 'react';

export function useApartmentScrollSync(onNearBottom?: () => void) {
  const surveyScrollRef = useRef<HTMLDivElement>(null);
  const differenceScrollRef = useRef<HTMLDivElement>(null);
  const existingScrollRef = useRef<HTMLDivElement>(null);

  const activeSourceRef = useRef<HTMLDivElement | null>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSyncScroll = useCallback((sourceRef: React.RefObject<HTMLDivElement | null>) => {
    const sourceEl = sourceRef.current;
    if (!sourceEl) return;

    if (onNearBottom && sourceEl.scrollTop + sourceEl.clientHeight >= sourceEl.scrollHeight - 80) {
      onNearBottom();
    }

    if (activeSourceRef.current && activeSourceRef.current !== sourceEl) {
      return;
    }

    activeSourceRef.current = sourceEl;
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    clearTimerRef.current = setTimeout(() => {
      activeSourceRef.current = null;
    }, 60);

    const scrollTop = sourceEl.scrollTop;
    const scrollLeft = sourceEl.scrollLeft;

    [surveyScrollRef, differenceScrollRef, existingScrollRef].forEach((ref) => {
      if (ref !== sourceRef && ref.current && ref.current.scrollTop !== scrollTop) {
        ref.current.scrollTop = scrollTop;
      }
    });

    if (sourceRef === surveyScrollRef && existingScrollRef.current) {
      if (existingScrollRef.current.scrollLeft !== scrollLeft) {
        existingScrollRef.current.scrollLeft = scrollLeft;
      }
    } else if (sourceRef === existingScrollRef && surveyScrollRef.current) {
      if (surveyScrollRef.current.scrollLeft !== scrollLeft) {
        surveyScrollRef.current.scrollLeft = scrollLeft;
      }
    }
  }, [onNearBottom]);

  return {
    surveyScrollRef,
    differenceScrollRef,
    existingScrollRef,
    handleSyncScroll,
  };
}

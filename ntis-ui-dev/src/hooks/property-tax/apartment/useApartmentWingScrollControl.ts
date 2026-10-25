'use client';

import { useRef, useCallback, useEffect, useState } from 'react';

export function useApartmentWingScrollControl() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const leftArrowRef = useRef<HTMLButtonElement | HTMLDivElement>(null);
  const rightArrowRef = useRef<HTMLButtonElement | HTMLDivElement>(null);
  const [hiddenLeftCount, setHiddenLeftCount] = useState(0);
  const [hiddenRightCount, setHiddenRightCount] = useState(0);

  const timeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const rafIdRef = useRef<number | null>(null);

  const safeSetTimeout = useCallback((fn: () => void, delayMs: number) => {
    const handle = setTimeout(() => {
      timeoutsRef.current.delete(handle);
      fn();
    }, delayMs);
    timeoutsRef.current.add(handle);
    return handle;
  }, []);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    
    // Add a 5px tolerance to account for subpixel rendering or slight flexbox rounding
    const isScrollable = scrollWidth > clientWidth + 5;

    if (!isScrollable) {
      setHiddenLeftCount(0);
      setHiddenRightCount(0);
      return;
    }

    const children = Array.from(el.children) as HTMLElement[];
    if (children.length === 0) {
      setHiddenLeftCount(0);
      setHiddenRightCount(0);
      return;
    }

    const viewportLeft = scrollLeft + 5;
    const viewportRight = scrollLeft + clientWidth - 5;

    let left = 0;
    let right = 0;

    children.forEach((child) => {
      // Calculate child center position to accurately detect if outside viewport
      const childCenter = child.offsetLeft + child.offsetWidth / 2;
      if (childCenter < viewportLeft) {
        left++;
      } else if (childCenter > viewportRight) {
        right++;
      }
    });

    setHiddenLeftCount(left);
    setHiddenRightCount(right);
  }, []);

  // Throttled version of checkScroll to prevent layout thrashing (reflow) on high-frequency scroll events
  const scheduleCheckScroll = useCallback(() => {
    if (rafIdRef.current !== null) return;
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      checkScroll();
    });
  }, [checkScroll]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    checkScroll();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        scheduleCheckScroll();
      });
      resizeObserver.observe(el);
      Array.from(el.children).forEach((child) => resizeObserver?.observe(child));
    }

    // Attach passive scroll listener to handle trackpad, keyboard, and momentum scrolling natively
    el.addEventListener('scroll', scheduleCheckScroll, { passive: true });
    window.addEventListener('resize', scheduleCheckScroll);

    const activeTimeouts = timeoutsRef.current;

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      activeTimeouts.forEach(clearTimeout);
      activeTimeouts.clear();
      resizeObserver?.disconnect();
      el.removeEventListener('scroll', scheduleCheckScroll);
      window.removeEventListener('resize', scheduleCheckScroll);
    };
  }, [checkScroll, scheduleCheckScroll]);

  const scrollNext = useCallback(() => {
    const el = scrollRef.current;
    if (!el?.firstElementChild) return;
    el.scrollBy({ left: el.firstElementChild.clientWidth + 16, behavior: 'smooth' });
    safeSetTimeout(checkScroll, 350);
  }, [checkScroll, safeSetTimeout]);

  const scrollPrev = useCallback(() => {
    const el = scrollRef.current;
    if (!el?.firstElementChild) return;
    el.scrollBy({ left: -(el.firstElementChild.clientWidth + 16), behavior: 'smooth' });
    safeSetTimeout(checkScroll, 350);
  }, [checkScroll, safeSetTimeout]);

  const initScrollRef = useCallback((node: HTMLDivElement | null) => {
    (scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    if (node) {
      safeSetTimeout(checkScroll, 50);
      safeSetTimeout(checkScroll, 200);
    }
  }, [checkScroll, safeSetTimeout]);

  return {
    leftArrowRef,
    rightArrowRef,
    scrollNext,
    scrollPrev,
    checkScroll: scheduleCheckScroll,
    initScrollRef,
    hiddenLeftCount,
    hiddenRightCount,
  };
}

export { useApartmentWingScrollControl as useWingScrollControl };

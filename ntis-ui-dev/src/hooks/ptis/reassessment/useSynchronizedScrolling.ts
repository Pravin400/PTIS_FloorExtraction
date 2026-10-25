import { useRef, useCallback, useEffect } from 'react';

export function useSynchronizedScrolling() {
  const oldTableRef = useRef<HTMLDivElement>(null);
  const newTableRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);

  const syncScroll = useCallback((sourceRef: React.RefObject<HTMLDivElement | null>, targetRef: React.RefObject<HTMLDivElement | null>) => {
    if (isScrolling.current || !sourceRef.current || !targetRef.current) return;

    isScrolling.current = true;
    targetRef.current.scrollTop = sourceRef.current.scrollTop;
    targetRef.current.scrollLeft = sourceRef.current.scrollLeft;
    
    requestAnimationFrame(() => {
      isScrolling.current = false;
    });
  }, []);

  const handleOldScroll = useCallback(() => {
    syncScroll(oldTableRef, newTableRef);
  }, [syncScroll]);

  const handleNewScroll = useCallback(() => {
    syncScroll(newTableRef, oldTableRef);
  }, [syncScroll]);

  useEffect(() => {
    const oldEl = oldTableRef.current;
    const newEl = newTableRef.current;

    if (oldEl) oldEl.addEventListener('scroll', handleOldScroll, { passive: true });
    if (newEl) newEl.addEventListener('scroll', handleNewScroll, { passive: true });

    return () => {
      if (oldEl) oldEl.removeEventListener('scroll', handleOldScroll);
      if (newEl) newEl.removeEventListener('scroll', handleNewScroll);
    };
  }, [handleOldScroll, handleNewScroll]);

  return { oldTableRef, newTableRef };
}

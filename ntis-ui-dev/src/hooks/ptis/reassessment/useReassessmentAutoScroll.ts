import { useEffect, useRef } from 'react';

export function useReassessmentAutoScroll({
  isAutoScrolling,
  containerId,
}: {
  isAutoScrolling: boolean;
  containerId: string;
}) {
  const scrollDirectionRef = useRef<number>(1);

  useEffect(() => {
    if (!isAutoScrolling) return;
    const el = document.querySelector(`${containerId} .overflow-auto`) as HTMLElement;
    if (!el) return;
    let frameId: number;

    const smoothScroll = () => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) return;

      if (el.scrollLeft >= maxScroll - 1) {
        scrollDirectionRef.current = -1;
      } else if (el.scrollLeft <= 1) {
        scrollDirectionRef.current = 1;
      }

      el.scrollLeft = Math.max(
        0,
        Math.min(maxScroll, el.scrollLeft + scrollDirectionRef.current)
      );
      frameId = requestAnimationFrame(smoothScroll);
    };

    frameId = requestAnimationFrame(smoothScroll);
    return () => cancelAnimationFrame(frameId);
  }, [isAutoScrolling, containerId]);
}

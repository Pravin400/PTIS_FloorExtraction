import { useEffect, useRef, useCallback } from "react";

export const useTableAutoScroll = (isAutoScrolling: boolean) => {
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const scrollDirectionRef = useRef<number>(1);

  const findScrollableElement = useCallback(() => {
    const candidates = Array.from(
      document.querySelectorAll(".overflow-auto, .overflow-x-auto")
    ) as HTMLElement[];

    const scrollables = candidates.filter((el) => {
      const style = window.getComputedStyle(el);

      const isVisible =
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        el.offsetParent !== null;

      const isScrollable =
        el.scrollWidth > el.clientWidth + 5;

      return isVisible && isScrollable;
    });

    // 🔥 IMPORTANT: pick the MOST horizontal scrollable one
    return (
      scrollables.sort(
        (a, b) => (b.scrollWidth - b.clientWidth) - (a.scrollWidth - a.clientWidth)
      )[0] || null
    );
  }, []);
  useEffect(() => {
    const smoothScroll = () => {
      if (!scrollContainerRef.current || !isAutoScrolling) return;
      const el = scrollContainerRef.current;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= maxScroll - 1) scrollDirectionRef.current = -1;
      else if (el.scrollLeft <= 1) scrollDirectionRef.current = 1;
      el.scrollLeft = Math.max(0, Math.min(maxScroll, el.scrollLeft + scrollDirectionRef.current));
      animationFrameRef.current = requestAnimationFrame(smoothScroll);
    };

    if (isAutoScrolling) {
      let activeContainer: HTMLElement | null = null;
      let mouseEnterHandler: () => void;
      let mouseLeaveHandler: () => void;

      const timeoutId = setTimeout(() => {
        const container = findScrollableElement();
        if (!container) return;
        activeContainer = container;
        scrollContainerRef.current = container;

        mouseEnterHandler = () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
        mouseLeaveHandler = () => { if (isAutoScrolling) animationFrameRef.current = requestAnimationFrame(smoothScroll); };

        container.addEventListener('mouseenter', mouseEnterHandler);
        container.addEventListener('mouseleave', mouseLeaveHandler);
        animationFrameRef.current = requestAnimationFrame(smoothScroll);
      }, 150);

      return () => {
        clearTimeout(timeoutId);
        if (activeContainer) {
          activeContainer.removeEventListener('mouseenter', mouseEnterHandler);
          activeContainer.removeEventListener('mouseleave', mouseLeaveHandler);
        }
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      };
    } else {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (scrollContainerRef.current) {
        scrollContainerRef.current = null;
      }
    }
  }, [isAutoScrolling, findScrollableElement]);

  useEffect(() => () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); }, []);
};

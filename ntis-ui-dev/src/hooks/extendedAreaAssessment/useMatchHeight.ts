"use client";

import { useEffect, useRef, useState } from "react";

/** Measures a target element's rendered height live (via ResizeObserver) so a sibling panel can
 *  match it exactly — used by the single-assessment screen to cap the left form panel's height to
 *  whatever the right column (KPI cards + timeline + schedule table) actually renders at, instead
 *  of guessing with CSS intrinsic-sizing (which doesn't reliably match across browsers once the
 *  measured element has its own internal `overflow` scroll regions). Returns `null` until the
 *  first measurement is available (e.g. during SSR/first paint), so callers should fall back to a
 *  CSS-only height in that case. */
export function useMatchHeight<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setHeight(entry.contentRect.height);
    });
    observer.observe(el);
    setHeight(el.getBoundingClientRect().height);

    return () => observer.disconnect();
  }, []);

  return { ref, height };
}

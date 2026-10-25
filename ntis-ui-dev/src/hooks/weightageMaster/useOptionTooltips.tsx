"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface TooltipState {
  visible: boolean;
  text: string;
  top: number;
  left: number;
}

const INITIAL_STATE: TooltipState = { visible: false, text: "", top: 0, left: 0 };

/**
 * Shows a floating tooltip (styled like the app's shared Tooltip component)
 * for whatever dropdown option row or select trigger is hovered inside the
 * returned container — via mouseover delegation, so long/truncated labels
 * (e.g. "AA - विटांची भिंत व टिनाचे छत") stay readable without modifying the
 * shared SearchSelect/MultiSelect components. Render the returned `tooltip`
 * node once, anywhere in the consuming component's JSX tree.
 */
export function useOptionTooltips<T extends HTMLElement = HTMLDivElement>() {
  const containerRef = useRef<T>(null);
  const [state, setState] = useState<TooltipState>(INITIAL_STATE);

  const showFor = useCallback((el: HTMLElement, text: string) => {
    const rect = el.getBoundingClientRect();
    // Positioned to the right of the row (option rows span the full dropdown
    // width, so rect.right lines up with the dropdown's own right edge)
    // rather than below it, so it never overlaps the option list itself.
    setState({ visible: true, text, top: rect.top + rect.height / 2, left: rect.right + 8 });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const matchEl =
        target.closest<HTMLElement>('[role="option"]') ||
        target.closest<HTMLElement>('[role="combobox"]');

      if (!matchEl) return;

      const text = matchEl instanceof HTMLInputElement ? matchEl.value.trim() : matchEl.textContent?.trim();
      if (text) showFor(matchEl, text);
    };

    const handleMouseLeave = () => setState(INITIAL_STATE);

    container.addEventListener("mouseover", handleMouseOver);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      container.removeEventListener("mouseover", handleMouseOver);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [showFor]);

  const tooltip =
    state.visible && typeof document !== "undefined"
      ? createPortal(
          <span
            role="tooltip"
            className="fixed z-[9999] -translate-y-1/2 whitespace-normal break-words text-center px-4 py-2 min-w-[160px] max-w-[260px] rounded-lg shadow-lg text-xs font-medium pointer-events-none opacity-95 bg-gradient-to-br from-blue-500 via-blue-400 to-blue-300 text-white border border-blue-300"
            style={{ top: state.top, left: state.left }}
          >
            {state.text}
          </span>,
          document.body
        )
      : null;

  return { containerRef, tooltip };
}

"use client";

import React, {
  ReactNode,
  useRef,
  useState,
  useId,
  useEffect,
  useCallback,
  isValidElement,
  cloneElement,
} from "react";
import ReactDOM from "react-dom";
import { cn } from "@/lib/utils/cn";

/* ================= TYPES ================= */

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  className?: string;
  placement?: "top" | "bottom" | "left" | "right";
}

/* ================= COMPONENT ================= */

export const Tooltip = ({
  content,
  children,
  className = "",
  placement = "bottom",
}: TooltipProps): React.ReactElement => {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [mounted] = useState(true); // Initialize as true for client-side rendering
  const triggerRef = useRef<HTMLElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tooltipId = useId();

  /* ---------------- Show tooltip ---------------- */
  const show = (): void => {
    timeoutRef.current = setTimeout(() => {
      if (!triggerRef.current) return;

      const rect = triggerRef.current.getBoundingClientRect();

      const positions: Record<
        NonNullable<TooltipProps["placement"]>,
        { top: number; left: number }
      > = {
        top: { top: rect.top - 16, left: rect.left + rect.width / 2 },
        bottom: { top: rect.bottom + 8, left: rect.left + rect.width / 2 },
        left: { top: rect.top + rect.height / 2, left: rect.left - 8 },
        right: { top: rect.top + rect.height / 2, left: rect.right + 8 },
      };

      setCoords(positions[placement]);
      setVisible(true);
    }, 100);
  };

  /* ---------------- Hide tooltip ---------------- */
  const hide = (): void => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  /* ---------------- Cleanup ---------------- */
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const hasContent =
    !!content && (typeof content !== "string" || content.trim() !== "");

  const transformMap: Record<
    NonNullable<TooltipProps["placement"]>,
    string
  > = {
    top: "-translate-x-1/2 -translate-y-full",
    bottom: "-translate-x-1/2 translate-y-0",
    left: "-translate-x-full -translate-y-1/2",
    right: "translate-x-0 -translate-y-1/2",
  };

  // Extract child and ref before early returns to satisfy Rules of Hooks
  const child = isValidElement(children)
    ? (children as React.ReactElement<React.HTMLAttributes<HTMLElement>>)
    : null;

  const childRef = child
    ? (child.props as { ref?: React.Ref<HTMLElement> }).ref || (child as React.ReactElement & { ref?: React.Ref<HTMLElement> }).ref
    : null;

  // Handle ref forwarding safely - must be before early returns
  const mergedRef = useCallback(
    (node: HTMLElement | null): void => {
      triggerRef.current = node;

      if (!childRef) return;

      if (typeof childRef === "function") {
        childRef(node);
      } else if ("current" in childRef) {
        const refObject = childRef as { current: HTMLElement | null };
        Object.defineProperty(refObject, "current", {
          value: node,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
    },
    [childRef]
  );

  // Early returns AFTER all hooks
  if (!hasContent) return <>{children}</>;

  if (!child) {
    console.warn("Tooltip children must be a valid React element.");
    return <>{children}</>;
  }

  return (
    <>
      {/* ================= TRIGGER ================= */}
      {/* eslint-disable-next-line react-hooks/refs */}
      {cloneElement(child, {
        ref: mergedRef,
        onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
          show();
          child.props.onMouseEnter?.(e);
        },
        onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
          hide();
          child.props.onMouseLeave?.(e);
        },
        onFocus: (e: React.FocusEvent<HTMLElement>) => {
          show();
          child.props.onFocus?.(e);
        },
        onBlur: (e: React.FocusEvent<HTMLElement>) => {
          hide();
          child.props.onBlur?.(e);
        },
        onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
          if (e.key === "Escape") hide();
          child.props.onKeyDown?.(e);
        },
        "aria-describedby": visible ? tooltipId : undefined,
      } as unknown as React.HTMLProps<HTMLElement>)}

      {/* ================= TOOLTIP ================= */}
      {visible && mounted && ReactDOM.createPortal(
        <span
          id={tooltipId}
          role="tooltip"
          aria-live="polite"
          className={cn(
            "fixed z-[9999] whitespace-normal break-words text-center px-4 py-2 min-w-[160px] max-w-[260px] rounded-lg shadow-lg text-xs font-medium pointer-events-none opacity-95",
            "bg-gradient-to-br from-blue-500 via-blue-400 to-blue-300 text-white border border-blue-300",
            transformMap[placement],
            className
          )}
          style={{
            top: coords.top,
            left: coords.left,
          }}
        >
          {content}
        </span>,
        document.body
      )}
    </>
  );
};

Tooltip.displayName = "Tooltip";

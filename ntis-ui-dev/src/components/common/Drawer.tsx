"use client";

import { X, AlertCircle } from "lucide-react";
import React from "react";
import { useTranslations } from "next-intl";
import {
  getSessionExpiresAtUnixFromCookie,
  isSessionWarningActiveAtUnix,
  SESSION_EXPIRY_CLOCK_SKEW_SECONDS,
} from "@/lib/utils/session-expiry-client";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  onCloseHover?: () => void;
  title?: React.ReactNode;
  headerActions?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  description?: string;
  width?: "sm" | "md" | "lg" | "xl" | "2xl";
  children: React.ReactNode;
  footer?: React.ReactNode;
  hideHeader?: boolean;
  zIndex?: number;
}

export function Drawer({
  open,
  onClose,
  onCloseHover,
  title,
  headerActions,
  className,
  width = "md",
  children,
  footer,
  hideHeader = false,
  bodyClassName,
  zIndex,
}: DrawerProps) {
  const tLogin = useTranslations("login");
  const [warningActive, setWarningActive] = React.useState(false);
  const [secondsLeft, setSecondsLeft] = React.useState(0);
  const [warningType, setWarningType] = React.useState<'session' | 'inactivity'>('session');
  const isCritical = secondsLeft <= 20;

  React.useEffect(() => {
    if (typeof window === "undefined" || !open) return;

    const initWarning = () => {
      const expiresUnix = getSessionExpiresAtUnixFromCookie();
      if (expiresUnix !== null) {
        const nowUnix = Math.floor(Date.now() / 1000);
        if (isSessionWarningActiveAtUnix(expiresUnix, nowUnix)) {
          const remaining = (expiresUnix - SESSION_EXPIRY_CLOCK_SKEW_SECONDS) - nowUnix;
          if (remaining > 0) {
            setWarningActive(true);
            setSecondsLeft(remaining);
          }
        }
      }
    };
    initWarning();

    const handleTick = (e: Event) => {
      const customEvent = e as CustomEvent<{ secondsLeft: number; active: boolean; type?: 'session' | 'inactivity' }>;
      setWarningActive(customEvent.detail.active);
      setSecondsLeft(customEvent.detail.secondsLeft);
      if (customEvent.detail.type) {
        setWarningType(customEvent.detail.type);
      }
    };

    window.addEventListener("ntis:session-warning-tick", handleTick);
    return () => {
      window.removeEventListener("ntis:session-warning-tick", handleTick);
    };
  }, [open]);

  const drawerRef = React.useRef<HTMLDivElement>(null);
  const lastActiveElement = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!open) return;

    lastActiveElement.current = document.activeElement as HTMLElement;

    const drawer = drawerRef.current;
    if (!drawer) return;

    const focusableSelectors =
      'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])';

    // Find focusable elements
    const focusableElements = Array.from(
      drawer.querySelectorAll<HTMLElement>(focusableSelectors)
    ).filter(el => {
      if (el.tagName === 'INPUT' && (el as HTMLInputElement).type === 'hidden') return false;
      return el.tabIndex >= 0;
    });

    const firstEl = focusableElements[0];
    const lastEl = focusableElements[focusableElements.length - 1];

    if (firstEl) {
      firstEl.focus();
    } else {
      drawer.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab" && focusableElements.length > 0) {
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      lastActiveElement.current?.focus();
    };
  }, [open]);

  React.useEffect(() => {
    if (open) {
      document.body.classList.add("drawer-open");
    } else {
      const otherDrawers = document.querySelectorAll(".drawer-instance");
      if (otherDrawers.length === 0) {
        document.body.classList.remove("drawer-open");
      }
    }
    return () => {
      const otherDrawers = document.querySelectorAll(".drawer-instance");
      if (otherDrawers.length <= 1) {
        document.body.classList.remove("drawer-open");
      }
    };
  }, [open]);

  if (!open) return null;

  const renderWarningPill = () => {
    if (!warningActive || secondsLeft <= 0) return null;

    const isLargeDrawer = width === "lg" || width === "xl";
    const pillPaddingClass = isLargeDrawer ? "px-5 py-2" : "px-3.5 py-1.5";
    const pillTextClass = isLargeDrawer ? "text-sm md:text-base" : "text-[12px] md:text-[13px]";
    const iconSizeClass = isLargeDrawer ? "h-5 w-5" : "h-4 w-4";
    const countdownTextClass = isLargeDrawer ? "text-base md:text-lg" : "text-sm";
    const hintTextClass = isLargeDrawer ? "text-xs md:text-sm" : "text-[10px]";

    return (
      <div
        className={`flex items-center gap-2.5 rounded-lg border ${pillPaddingClass} ${pillTextClass} font-bold shadow-md backdrop-blur-sm transition-all duration-300 ${isCritical
          ? "border-red-500 bg-red-950/90 text-white shadow-red-500/30 critical-flash-active"
          : "border-amber-500/70 bg-amber-950/80 text-amber-100 shadow-amber-500/20 warning-flash-active"
          } session-warn-active`}
        role="status"
        aria-live="polite"
      >
        <span className={`relative flex ${isLargeDrawer ? "h-3.5 w-3.5" : "h-2.5 w-2.5"} shrink-0`}>
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${isCritical ? "animate-ping bg-red-400" : "bg-amber-400 animate-pulse"
              }`}
          />
          <span
            className={`relative inline-flex rounded-full ${isLargeDrawer ? "h-3.5 w-3.5" : "h-2.5 w-2.5"} ${isCritical ? "bg-red-500" : "bg-amber-500"
              }`}
          />
        </span>
        <AlertCircle
          className={`${iconSizeClass} shrink-0 transition-transform ${isCritical ? "text-red-400 animate-bounce timer-blink-sharp" : "text-amber-400 timer-blink-smooth"
            }`}
          aria-hidden
        />
        <span
          className={`font-mono ${countdownTextClass} font-extrabold tracking-wide ${isCritical ? "text-red-200 timer-blink-sharp" : "text-amber-300 timer-blink-smooth"
            }`}
        >
          {tLogin("sessionTimeout.countdown", { seconds: secondsLeft })}
        </span>
        <span
          className={`hidden sm:inline ${hintTextClass} font-semibold tracking-normal ${isCritical ? "text-red-100" : "text-amber-200/90"
            }`}
        >
          {warningType === 'inactivity'
            ? tLogin("sessionTimeout.inactivitySaveWorkHint")
            : tLogin("sessionTimeout.saveWorkHint")}
        </span>
      </div>
    );
  };

  const widthClass = {
    sm: "w-[90vw] md:w-[420px]",
    md: "w-[90vw] md:w-[520px]",
    lg: "w-[95vw] md:w-[900px] lg:w-[900px] xl:w-[900px]",
    xl: "w-[97vw] md:w-[1000px] lg:w-[1200px] xl:w-[1400px]",
    "2xl": "w-[97vw] md:w-[1000px] lg:w-[1200px] xl:w-[1600px]"
  }[width];

  const responsiveValidationClasses = `
    max-[768px]:[&_[class*='text-red-']]:!text-[9.5px]
    max-[768px]:[&_[class*='text-red-']]:!leading-[1.2]
    max-[768px]:[&_[class*='text-red-']]:!mt-[0.125rem]
    ${width === "sm"
      ? "md:[&_[class*='text-red-']]:!text-[9.5px] md:[&_[class*='text-red-']]:!leading-[1.2] md:[&_[class*='text-red-']]:!mt-[0.125rem]"
      : ""
    }
    ${width === "md"
      ? "md:[&_[class*='text-red-']]:!text-[10.5px] md:[&_[class*='text-red-']]:!leading-[1.25] md:[&_[class*='text-red-']]:!mt-[0.175rem]"
      : ""
    }
  `.replace(/\s+/g, ' ').trim();

  return (
    <>
      <div
        className="fixed inset-0 z-[100] bg-black/50 "
        style={zIndex ? { zIndex: zIndex - 10 } : undefined}
        onClick={onClose}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            onClose();
          }
        }}
      />

      <div
        ref={drawerRef}
        tabIndex={-1}
        style={zIndex ? { zIndex } : undefined}
        className={`
          drawer-instance
          drawer-${width}
          fixed top-0 right-0 z-[110] h-full
          ${widthClass}
          bg-[#F8FAFF]
          shadow-2xl
          flex flex-col
          focus:outline-none
          transition-[width] duration-300 ease-in-out overflow-hidden
          animate-in slide-in-from-right duration-300
          ${responsiveValidationClasses}
          ${className || ""}
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Floating warning timer for drawers without a header */}
        {hideHeader && (
          <div className="absolute top-3 right-12 z-[120]">
            {renderWarningPill()}
          </div>
        )}

        {/* ================= HEADER ================= */}
        {!hideHeader && (
          <div className="
            px-5 py-2.5 border-b-2 border-blue-200
            flex items-center justify-between
          ">
            <div className="flex items-center gap-3">
              {/* ICON SLOT (from title JSX) */}
              {title}
            </div>

            <div className="flex items-center gap-3">
              {renderWarningPill()}
              {headerActions}
              <button
                onClick={onClose}
                onMouseEnter={onCloseHover}
                className="
                  p-2 rounded-lg
                  text-gray-400 hover:text-gray-600
                  transition
                "
              >
                <X className="w-5 h-5 text-gray-500 hover:text-gray-600" />
              </button>
            </div>
          </div>
        )}

        {/* ================= BODY ================= */}
        <div className={`flex-1 ${bodyClassName || "overflow-y-auto overflow-x-hidden"}`}>
          <div className="min-h-full">
            {children}
          </div>
        </div>

        {/* ================= FOOTER ================= */}
        {footer && (
          <div className="
            px-6 py-4
            bg-white
            border-t border-[#DCEAFF]
            flex justify-end gap-3
          ">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}

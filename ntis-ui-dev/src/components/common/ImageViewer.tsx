"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils/cn";

/* =========================
   TYPES
========================= */

export interface ImageViewerImage {
  src: string;
  alt?: string;
  title?: string;
}

export interface ImageViewerProps {
  open: boolean;
  onClose: () => void;
  images: ImageViewerImage[];
  initialIndex?: number;
  showDownload?: boolean;
  showRotate?: boolean;
  showZoom?: boolean;
  showNavigation?: boolean;
  maxZoom?: number;
  minZoom?: number;
  zoomStep?: number;
  className?: string;
}

/* =========================
   CONSTANTS
========================= */

const DEFAULT_MAX_ZOOM = 3;
const DEFAULT_MIN_ZOOM = 0.5;
const DEFAULT_ZOOM_STEP = 0.25;
const ROTATION_STEP = 90;

/* =========================
   HELPERS
========================= */

/** Clamp a value between min and max */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/* =========================
   COMPONENT
========================= */

export function ImageViewer({
  open,
  onClose,
  images,
  initialIndex = 0,
  showDownload = true,
  showRotate = true,
  showZoom = true,
  showNavigation = true,
  maxZoom = DEFAULT_MAX_ZOOM,
  minZoom = DEFAULT_MIN_ZOOM,
  zoomStep = DEFAULT_ZOOM_STEP,
  className,
}: ImageViewerProps): React.ReactElement | null {
  const t = useTranslations("common");

  // ─── State ───────────────────────────────────────────────────────────────────

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  /**
   * Track loaded state PER IMAGE SOURCE so switching back to a previously
   * loaded image does not re-show the spinner, and opening the viewer always
   * correctly reflects load state regardless of which index was last shown.
   */
  const [loadedSrcs, setLoadedSrcs] = useState<Set<string>>(new Set());
  const [errorSrcs, setErrorSrcs] = useState<Set<string>>(new Set());

  // ─── Refs ────────────────────────────────────────────────────────────────────

  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const lastActiveElement = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  // Pinch-to-zoom refs (touch)
  const pinchStartDistanceRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef<number>(1);

  // ─── Keep onClose ref current ─────────────────────────────────────────────────

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // ─── Derived values ───────────────────────────────────────────────────────────

  const currentImage = images[currentIndex] ?? null;
  const hasMultipleImages = images.length > 1;
  const isImageLoaded = currentImage ? loadedSrcs.has(currentImage.src) : false;
  const isImageError = currentImage ? errorSrcs.has(currentImage.src) : false;

  /* =========================
     RESET TRANSFORM
  ========================= */

  const resetTransform = useCallback(() => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }, []);

  /* =========================
     OPEN / CLOSE EFFECT
     - On open  → sync initialIndex + reset transform
     - On close → clear loaded/error cache for fresh loads on reopen
     Merged into one effect to satisfy react-hooks/set-state-in-effect:
     setState is gated behind transition booleans, not called on every run.
  ========================= */

  const prevOpenRef = useRef(false);

  useEffect(() => {
    const justOpened = open && !prevOpenRef.current;
    const justClosed = !open && prevOpenRef.current;
    prevOpenRef.current = open;

    if (justOpened) {
      setCurrentIndex(initialIndex);
      resetTransform();
    }

    if (justClosed) {
      setLoadedSrcs(new Set());
      setErrorSrcs(new Set());
    }
  }, [open, initialIndex, resetTransform]);

  // Reset transform whenever the displayed image index changes
  const prevIndexRef = useRef(currentIndex);
  useEffect(() => {
    if (prevIndexRef.current !== currentIndex) {
      prevIndexRef.current = currentIndex;
      resetTransform();
    }
  }, [currentIndex, resetTransform]);

  /* =========================
     ZOOM HANDLERS
  ========================= */

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => clamp(prev + zoomStep, minZoom, maxZoom));
  }, [zoomStep, minZoom, maxZoom]);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => clamp(prev - zoomStep, minZoom, maxZoom));
  }, [zoomStep, minZoom, maxZoom]);

  const handleReset = useCallback(() => {
    resetTransform();
  }, [resetTransform]);

  /* =========================
     ROTATION
  ========================= */

  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + ROTATION_STEP) % 360);
  }, []);

  /* =========================
     NAVIGATION
  ========================= */

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  /* =========================
     DOWNLOAD
  ========================= */

  const handleDownload = useCallback(async () => {
    if (!currentImage) return;
    try {
      const response = await fetch(currentImage.src);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = currentImage.title || `image-${currentIndex + 1}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      // Silent fail — user observes no download
    }
  }, [currentImage, currentIndex]);

  /* =========================
     FIT TO SCREEN
  ========================= */

  const handleFitToScreen = useCallback(() => {
    const image = imageRef.current;
    const container = containerRef.current;

    // Guard against unloaded image (naturalWidth/Height are 0)
    if (!image || !container || !image.naturalWidth || !image.naturalHeight) {
      return;
    }

    const scaleX = container.clientWidth / image.naturalWidth;
    const scaleY = container.clientHeight / image.naturalHeight;
    const scale = clamp(Math.min(scaleX, scaleY), minZoom, maxZoom);

    setZoom(scale);
    setPosition({ x: 0, y: 0 });
  }, [minZoom, maxZoom]);

  /* =========================
     CURSOR
  ========================= */

  const getCursor = useCallback((): string => {
    if (isDragging) return "grabbing";
    if (zoom > 1) return "grab";
    if (zoom >= maxZoom) return "zoom-out";
    return "zoom-in";
  }, [isDragging, zoom, maxZoom]);

  /* =========================
     DRAG BOUNDARY CLAMPING
  ========================= */

  const getMaxDragOffset = useCallback((): { maxX: number; maxY: number } => {
    const image = imageRef.current;
    const container = containerRef.current;
    if (!image || !container) return { maxX: 0, maxY: 0 };

    const scaledW = (image.naturalWidth || image.clientWidth) * zoom;
    const scaledH = (image.naturalHeight || image.clientHeight) * zoom;
    const maxX = Math.max(0, (scaledW - container.clientWidth) / 2);
    const maxY = Math.max(0, (scaledH - container.clientHeight) / 2);
    return { maxX, maxY };
  }, [zoom]);

  const clampPosition = useCallback(
    (x: number, y: number): { x: number; y: number } => {
      const { maxX, maxY } = getMaxDragOffset();
      return {
        x: clamp(x, -maxX, maxX),
        y: clamp(y, -maxY, maxY),
      };
    },
    [getMaxDragOffset]
  );

  /* =========================
     DRAG — MOUSE
  ========================= */

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (zoom <= 1) return;
      e.preventDefault();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    },
    [zoom, position]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      const raw = {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      };
      setPosition(clampPosition(raw.x, raw.y));
    },
    [isDragging, dragStart, clampPosition]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback((e: React.MouseEvent) => {
    // Only stop dragging when leaving the outer container itself
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  }, []);

  /* =========================
     DRAG — TOUCH + PINCH-TO-ZOOM
  ========================= */

  const getDistance = (touches: React.TouchList): number => {
    const [a, b] = [touches[0], touches[1]];
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  };

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        pinchStartDistanceRef.current = getDistance(e.touches);
        pinchStartZoomRef.current = zoom;
        setIsDragging(false);
        return;
      }
      if (e.touches.length !== 1 || zoom <= 1) return;
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({
        x: touch.clientX - position.x,
        y: touch.clientY - position.y,
      });
    },
    [zoom, position]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      // Pinch-to-zoom
      if (e.touches.length === 2 && pinchStartDistanceRef.current !== null) {
        const currentDistance = getDistance(e.touches);
        const ratio = currentDistance / pinchStartDistanceRef.current;
        setZoom(clamp(pinchStartZoomRef.current * ratio, minZoom, maxZoom));
        return;
      }
      // Single-touch drag
      if (!isDragging || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const raw = {
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      };
      setPosition(clampPosition(raw.x, raw.y));
    },
    [isDragging, dragStart, clampPosition, minZoom, maxZoom]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    pinchStartDistanceRef.current = null;
  }, []);

  /* =========================
     WHEEL ZOOM
     Attached via useEffect with { passive: false } so preventDefault works.
     Targets viewerRef so the entire modal responds to scroll, not just the
     image area.
  ========================= */

  useEffect(() => {
    if (!open || !showZoom) return;

    const viewer = viewerRef.current;
    if (!viewer) return;

    const onWheel = (e: WheelEvent): void => {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY > 0 ? -zoomStep : zoomStep;
      setZoom((prev) => clamp(prev + delta, minZoom, maxZoom));
    };

    viewer.addEventListener("wheel", onWheel, { passive: false });
    return () => viewer.removeEventListener("wheel", onWheel);
  }, [open, showZoom, zoomStep, minZoom, maxZoom]);

  /* =========================
     BODY SCROLL LOCK
  ========================= */

  useEffect(() => {
    if (!open || !currentImage) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, currentImage]);

  /* =========================
     FOCUS TRAP + KEYBOARD SHORTCUTS
     Single unified keydown handler — runs only on open/close,
     NOT on every navigation (currentIndex intentionally excluded).
  ========================= */

  // Keep latest shortcut handlers in a ref so the keydown closure
  // always calls the current version without re-registering the listener.
  const shortcutHandlers = useMemo(
    () => ({
      showNavigation,
      showZoom,
      showRotate,
      imagesLength: images.length,
      handlePrevious,
      handleNext,
      handleZoomIn,
      handleZoomOut,
      handleRotate,
      handleReset,
    }),
    [
      showNavigation,
      showZoom,
      showRotate,
      images.length,
      handlePrevious,
      handleNext,
      handleZoomIn,
      handleZoomOut,
      handleRotate,
      handleReset,
    ]
  );

  const shortcutHandlersRef = useRef(shortcutHandlers);
  useEffect(() => {
    shortcutHandlersRef.current = shortcutHandlers;
  }, [shortcutHandlers]);

  useEffect(() => {
    if (!open || !currentImage) return;

    lastActiveElement.current = document.activeElement as HTMLElement;

    const viewer = viewerRef.current;
    if (!viewer) return;

    const FOCUSABLE =
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

    const focusTimeout = setTimeout(() => {
      const els = Array.from(viewer.querySelectorAll<HTMLElement>(FOCUSABLE));
      els[0]?.focus();
    }, 0);

    const handleKeyDown = (e: KeyboardEvent): void => {
      const handlers = shortcutHandlersRef.current;

      switch (e.key) {
        // ── Focus trap ──────────────────────────────────────────
        case "Tab": {
          const els = Array.from(
            viewer.querySelectorAll<HTMLElement>(FOCUSABLE)
          );
          if (els.length === 0) return;
          const first = els[0];
          const last = els[els.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
          break;
        }
        // ── Shortcuts ───────────────────────────────────────────
        case "Escape":
          onCloseRef.current();
          break;
        case "ArrowLeft":
          if (handlers.showNavigation && handlers.imagesLength > 1) {
            handlers.handlePrevious();
          }
          break;
        case "ArrowRight":
          if (handlers.showNavigation && handlers.imagesLength > 1) {
            handlers.handleNext();
          }
          break;
        case "+":
        case "=":
          if (handlers.showZoom) handlers.handleZoomIn();
          break;
        case "-":
        case "_":
          if (handlers.showZoom) handlers.handleZoomOut();
          break;
        case "r":
        case "R":
          if (handlers.showRotate) handlers.handleRotate();
          break;
        case "0":
          handlers.handleReset();
          break;
        default:
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(focusTimeout);
      document.removeEventListener("keydown", handleKeyDown);
      lastActiveElement.current?.focus();
    };
    // currentIndex intentionally excluded — focus trap must not
    // re-mount on every navigation keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* =========================
     IMAGE LOAD / ERROR HANDLERS
  ========================= */

  const handleImageLoad = useCallback(() => {
    if (!currentImage) return;
    setLoadedSrcs((prev) => new Set(prev).add(currentImage.src));
  }, [currentImage]);

  const handleImageError = useCallback(() => {
    if (!currentImage) return;
    // Mark as error AND loaded so the spinner hides
    setErrorSrcs((prev) => new Set(prev).add(currentImage.src));
    setLoadedSrcs((prev) => new Set(prev).add(currentImage.src));
  }, [currentImage]);

  /* =========================
     RENDER GUARD
  ========================= */

  if (!open || !currentImage) return null;

  /* =========================
     RENDER
  ========================= */

  return (
    <div
      ref={viewerRef}
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center",
        className
      )}
      role="dialog"
      aria-modal="true"
      aria-label={t("imageViewer.title")}
      data-testid="image-viewer"
    >
      {/* ── Backdrop ──────────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        onClick={() => onCloseRef.current()}
        aria-hidden="true"
        data-testid="image-viewer-backdrop"
      />

      {/* ── Shell ─────────────────────────────────────────────────────── */}
      <div className="relative w-full h-full flex flex-col">

        {/* ── Header / Toolbar ──────────────────────────────────────────── */}
        <div className="relative z-10 flex items-center justify-between px-4 py-3 bg-black/90">
          {/* Title + counter */}
          <div className="flex-1 min-w-0 pr-4">
            {currentImage.title && (
              <h2 className="text-white font-semibold text-lg truncate">
                {currentImage.title}
              </h2>
            )}
            {hasMultipleImages && (
              <p className="text-white/70 text-sm">
                {currentIndex + 1} / {images.length}
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {showZoom && (
              <>
                <button
                  onClick={handleZoomOut}
                  disabled={zoom <= minZoom}
                  className={cn(
                    "p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                  aria-label={t("imageViewer.zoomOut")}
                  data-testid="zoom-out-button"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>

                <span
                  className="text-white text-sm min-w-[4rem] text-center tabular-nums"
                  aria-live="polite"
                  aria-label={`${t("imageViewer.zoomLevel")} ${Math.round(zoom * 100)}%`}
                  data-testid="zoom-level"
                >
                  {Math.round(zoom * 100)}%
                </span>

                <button
                  onClick={handleZoomIn}
                  disabled={zoom >= maxZoom}
                  className={cn(
                    "p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                  aria-label={t("imageViewer.zoomIn")}
                  data-testid="zoom-in-button"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
              </>
            )}

            {showRotate && (
              <button
                onClick={handleRotate}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label={t("imageViewer.rotate")}
                data-testid="rotate-button"
              >
                <RotateCw className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={handleReset}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label={t("imageViewer.reset")}
              data-testid="reset-button"
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            <button
              onClick={handleFitToScreen}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label={t("imageViewer.fitToScreen")}
              data-testid="fit-to-screen-button"
            >
              <Maximize2 className="w-5 h-5" />
            </button>

            {showDownload && (
              <button
                onClick={handleDownload}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white hidden transition-colors"
                aria-label={t("imageViewer.download")}
                data-testid="download-button"
              >
                <Download className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={() => onCloseRef.current()}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label={t("imageViewer.close")}
              data-testid="close-button"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Image Container ───────────────────────────────────────────── */}
        <div
          ref={containerRef}
          className="relative flex-1 flex items-center justify-center overflow-hidden select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ cursor: getCursor() }}
          data-testid="image-container"
        >
          {/* Spinner */}
          {!isImageLoaded && !isImageError && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              aria-label={t("imageViewer.loading")}
              role="status"
            >
              <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          )}

          {/* Error state */}
          {isImageError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/60">
              <span
                className="text-4xl"
                role="img"
                aria-hidden="true"
                aria-label={t("imageViewer.errorIcon")}
              >
                {"\u26A0\uFE0F"}
              </span>
              <p className="text-sm">{t("imageViewer.loadError")}</p>
            </div>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imageRef}
            key={currentImage.src}
            src={currentImage.src}
            alt={
              currentImage.alt ||
              currentImage.title ||
              t("imageViewer.image")
            }
            className={cn(
              "max-w-none",
              // Only apply transition when not dragging to avoid snap/lag
              !isDragging && "transition-transform duration-200 ease-out",
              isImageLoaded && !isImageError ? "opacity-100" : "opacity-0"
            )}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: "center",
            }}
            onLoad={handleImageLoad}
            onError={handleImageError}
            draggable={false}
            data-testid="viewer-image"
          />
        </div>

        {/* ── Navigation Arrows ─────────────────────────────────────────── */}
        {showNavigation && hasMultipleImages && (
          <>
            <button
              onClick={handlePrevious}
              className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 z-10",
                "p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
              )}
              aria-label={t("imageViewer.previous")}
              data-testid="previous-button"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className={cn(
                "absolute right-4 top-1/2 -translate-y-1/2 z-10",
                "p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
              )}
              aria-label={t("imageViewer.next")}
              data-testid="next-button"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* ── Keyboard Hint ─────────────────────────────────────────────── */}
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-black/70 text-white/80 text-xs px-4 py-2 rounded-lg pointer-events-none select-none"
          aria-hidden="true"
        >
          <span className="hidden sm:inline">
            {t("imageViewer.keyboardShortcuts")}
          </span>
          <span className="sm:hidden">{t("imageViewer.tapToNavigate")}</span>
        </div>
      </div>
    </div>
  );
}
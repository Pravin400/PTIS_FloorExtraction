"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { ZoomIn, ZoomOut, RotateCcw, Download, X, Maximize, Minimize, Printer, FileText, MapPin, Hash, Layers } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

export interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
  label?: string;
  wardNo?: string;
  propertyNo?: string;
  partitionNo?: string;
  contentType?: string;
}

/**
 * DocumentViewerModal displays images and documents in a popup overlay.
 * Supports zoom-to-cursor via scroll wheel, drag/touch-pan, fullscreen toggle,
 * and print for both images and PDFs. Strictly light mode, SSR-safe.
 */
export function DocumentViewerModal({
  isOpen,
  onClose,
  fileUrl,
  fileName,
  label,
  wardNo,
  propertyNo,
  partitionNo,
  contentType,
}: DocumentViewerModalProps) {
  const t = useTranslations("quickDataEntry");
  const searchParams = useSearchParams();

  const resolvedWardNo = wardNo || searchParams.get("wardNo") || "";
  const resolvedPropertyNo = propertyNo || searchParams.get("propertyNo") || "";
  const resolvedPartitionNo = partitionNo || searchParams.get("partitionNo") || "";

  const [mounted, setMounted] = useState(false);
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [containerNode, setContainerNode] = useState<HTMLDivElement | null>(null);
  const [detectedType, setDetectedType] = useState<"pdf" | "image" | "unsupported" | null>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);
  const pdfIframeRef = useRef<HTMLIFrameElement>(null);

  // Fast-path synchronous guess for initial render / SSR
  const getInitialGuess = useCallback(() => {
    if (contentType) {
      const lowerCt = contentType.toLowerCase();
      if (lowerCt.includes("pdf")) return "pdf";
      if (lowerCt.startsWith("image/")) return "image";
    }
    if (!fileUrl) return null;
    const lowerUrl = fileUrl.toLowerCase();
    const lowerName = fileName.toLowerCase();
    
    if (
      lowerUrl.startsWith("data:image/") ||
      lowerName.endsWith(".png") ||
      lowerName.endsWith(".jpg") ||
      lowerName.endsWith(".jpeg") ||
      lowerName.endsWith(".gif") ||
      lowerName.endsWith(".webp") ||
      lowerName.endsWith(".svg")
    ) {
      return "image";
    }

    if (lowerUrl.includes(".pdf") || lowerUrl.startsWith("data:application/pdf") || lowerName.endsWith(".pdf")) {
      return "pdf";
    }

    return null;
  }, [fileUrl, fileName, contentType]);

  const initialGuess = getInitialGuess();
  const isDetecting = detectedType === null && initialGuess === null;

  const currentType = detectedType || initialGuess || "image";
  const isPdf = currentType === "pdf";
  const isImage = currentType === "image";
  const isUnsupported = currentType === "unsupported";

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDetectedType(null);
    if (!fileUrl) return;

    if (contentType) {
      const lowerCt = contentType.toLowerCase();
      if (lowerCt.includes("pdf")) {
        setDetectedType("pdf");
        return;
      }
      if (lowerCt.startsWith("image/")) {
        setDetectedType("image");
        return;
      }
    }
    
    const initial = getInitialGuess();
    if (initial) {
      setDetectedType(initial);
      // Skip async inspection if non-blob URL has explicit PDF or image extension, or is data: URI
      if (
        fileUrl.startsWith("data:") ||
        (!fileUrl.startsWith("blob:") && (fileUrl.toLowerCase().includes(".pdf") || fileUrl.toLowerCase().match(/\.(png|jpe?g|gif|webp|svg)/i)))
      ) {
        return;
      }
    }
    
    let active = true;
    const detect = async () => {
      try {
        const response = await fetch(fileUrl);
        const blob = await response.blob();
        
        if (blob.type) {
          const mime = blob.type.toLowerCase();
          if (mime.includes("pdf")) {
            if (active) setDetectedType("pdf");
            return;
          }
          if (mime.startsWith("image/")) {
            if (active) setDetectedType("image");
            return;
          }
          if (active && !initial) setDetectedType("unsupported");
          return;
        }
        
        // Fallback to magic numbers
        const reader = new FileReader();
        reader.onloadend = () => {
          if (!active) return;
          const arr = new Uint8Array(reader.result as ArrayBuffer);
          if (arr.length >= 4) {
            const isPDFMagic = arr[0] === 0x25 && arr[1] === 0x50 && arr[2] === 0x44 && arr[3] === 0x46;
            if (isPDFMagic) {
              setDetectedType("pdf");
            } else if (
              (arr[0] === 0x89 && arr[1] === 0x50 && arr[2] === 0x4e && arr[3] === 0x47) ||
              (arr[0] === 0xff && arr[1] === 0xd8) ||
              (arr[0] === 0x47 && arr[1] === 0x49 && arr[2] === 0x46)
            ) {
              setDetectedType("image");
            } else {
              setDetectedType(initial || "unsupported");
            }
          } else {
            setDetectedType(initial || "unsupported");
          }
        };
        reader.readAsArrayBuffer(blob.slice(0, 4));
      } catch (_err) {
        if (active) {
          setDetectedType(initial || "unsupported");
        }
      }
    };
    
    detect();
    return () => {
      active = false;
    };
  }, [fileUrl, fileName, contentType, getInitialGuess]);

  useEffect(() => {
    if (!isOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTransform({ scale: 1, x: 0, y: 0 });
    setIsDragging(false);
    setIsFullscreen(false);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Sync fullscreen state when user exits via Escape or browser controls
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!containerNode || !isImage || !isOpen) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = containerNode.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;

      setTransform((prev) => {
        const step = prev.scale * 0.15;
        const nextScale = Math.min(Math.max(prev.scale + (e.deltaY < 0 ? step : -step), 0.5), 7);
        if (nextScale <= 1) return { scale: nextScale, x: 0, y: 0 };
        
        const ratio = nextScale / prev.scale;
        const rawX = mx - cx - (mx - cx - prev.x) * ratio;
        const rawY = my - cy - (my - cy - prev.y) * ratio;
        const maxX = Math.max(0, (rect.width * (nextScale - 1)) / 2);
        const maxY = Math.max(0, (rect.height * (nextScale - 1)) / 2);
        return {
          scale: nextScale,
          x: Math.min(Math.max(rawX, -maxX), maxX),
          y: Math.min(Math.max(rawY, -maxY), maxY),
        };
      });
    };
    containerNode.addEventListener("wheel", handleWheel, { passive: false });
    return () => containerNode.removeEventListener("wheel", handleWheel);
  }, [containerNode, isImage, isOpen]);

  const handleToggleFullscreen = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!modalRef.current) return;
    if (!document.fullscreenElement) {
      modalRef.current.requestFullscreen().catch(() => {
        // Fullscreen API not supported or denied — silently ignore
      });
    } else {
      document.exitFullscreen().catch(() => {
        // Already exited or not supported — silently ignore
      });
    }
  }, []);

  const handlePrint = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isImage) {
      // Print image via a temporary hidden iframe
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      iframe.style.left = "-9999px";
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${fileName || "Print"}</title>
              <style>
                @media print {
                  @page { margin: 0.5in; }
                  body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                  img { max-width: 100%; max-height: 100vh; object-fit: contain; }
                }
                body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #fff; }
                img { max-width: 100%; max-height: 100vh; object-fit: contain; }
              </style>
            </head>
            <body>
              <img src="${fileUrl}" alt="${fileName || "Document"}" />
            </body>
          </html>
        `);
        iframeDoc.close();

        // Wait for image to load inside the iframe before printing
        const imgEl = iframeDoc.querySelector("img");
        if (imgEl) {
          let hasPrinted = false;
          const doPrint = () => {
            if (hasPrinted) return;
            hasPrinted = true;
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setTimeout(() => {
              try {
                if (iframe.parentNode) {
                  iframe.parentNode.removeChild(iframe);
                }
              } catch (_) {
                // Silently swallow in case of JSDOM or teardown timing issues
              }
            }, 1000);
          };

          imgEl.onload = doPrint;
          // If already cached/loaded
          if (imgEl.complete) {
            doPrint();
          }
        }
      }
    } else if (isPdf) {
      // Print PDF via iframe contentWindow, fallback to new tab
      try {
        const pdfIframe = pdfIframeRef.current;
        if (pdfIframe?.contentWindow) {
          pdfIframe.contentWindow.focus();
          pdfIframe.contentWindow.print();
        } else {
          window.open(fileUrl, "_blank");
        }
      } catch {
        // Cross-origin restriction — open in new tab as fallback
        window.open(fileUrl, "_blank");
      }
    }
  }, [isImage, isPdf, fileUrl, fileName]);

  if (!isOpen || !mounted || !fileUrl) return null;

  const updatePan = (newX: number, newY: number, scale: number) => {
    if (!containerNode) return;
    const rect = containerNode.getBoundingClientRect();
    const maxX = Math.max(0, (rect.width * (scale - 1)) / 2);
    const maxY = Math.max(0, (rect.height * (scale - 1)) / 2);
    setTransform((prev) => ({
      ...prev,
      x: Math.min(Math.max(newX, -maxX), maxX),
      y: Math.min(Math.max(newY, -maxY), maxY),
    }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (transform.scale <= 1 || !isImage) return;
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || transform.scale <= 1 || !isImage) return;
    updatePan(e.clientX - dragStart.current.x, e.clientY - dragStart.current.y, transform.scale);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (transform.scale <= 1 || !isImage || e.touches.length !== 1) return;
    setIsDragging(true);
    const touch = e.touches[0];
    dragStart.current = { x: touch.clientX - transform.x, y: touch.clientY - transform.y };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || transform.scale <= 1 || !isImage || e.touches.length !== 1) return;
    const touch = e.touches[0];
    updatePan(touch.clientX - dragStart.current.x, touch.clientY - dragStart.current.y, transform.scale);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerTransition = () => {
    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), 200);
  };

  const handleZoom = (zoomIn: boolean) => {
    triggerTransition();
    setTransform((prev) => {
      const nextScale = Math.min(Math.max(prev.scale + (zoomIn ? 0.25 : -0.25), 0.5), 7);
      if (nextScale <= 1) return { scale: nextScale, x: 0, y: 0 };
      const ratio = nextScale / prev.scale;
      const rawX = prev.x * ratio;
      const rawY = prev.y * ratio;
      if (!containerNode) return { scale: nextScale, x: rawX, y: rawY };
      const rect = containerNode.getBoundingClientRect();
      const maxX = Math.max(0, (rect.width * (nextScale - 1)) / 2);
      const maxY = Math.max(0, (rect.height * (nextScale - 1)) / 2);
      return {
        scale: nextScale,
        x: Math.min(Math.max(rawX, -maxX), maxX),
        y: Math.min(Math.max(rawY, -maxY), maxY),
      };
    });
  };

  const handleReset = () => {
    triggerTransition();
    setTransform({ scale: 1, x: 0, y: 0 });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/20 p-0 sm:p-4 transition-opacity duration-300"
      onClick={onClose}
    >
      {/* Modal Container - STRICT LIGHT MODE */}
      <div
        ref={modalRef}
        className="relative flex flex-col w-full h-full sm:h-[94vh] sm:w-[96vw] sm:max-w-7xl bg-white rounded-none sm:rounded-xl shadow-2xl overflow-hidden border border-gray-200 text-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header/Toolbar */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border-b border-gray-200 flex-wrap sm:flex-nowrap gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-1 sm:flex-initial">
            <div className="flex flex-col min-w-0">
              <span className="text-xs sm:text-sm font-bold text-gray-800 truncate" title={label || fileName || "Document Viewer"}>
                {label || fileName || "Document Viewer"}
              </span>
              {label && fileName && (
                <span className="text-[10px] text-gray-500 truncate" title={fileName}>
                  {fileName}
                </span>
              )}
            </div>

            <div className="hidden md:flex items-center gap-1.5 flex-shrink-0">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-[10px] font-bold text-blue-700 border border-blue-100/80">
                <MapPin className="h-3 w-3 text-blue-600/80" />
                <span>{t("roomSubmission.info.ward")}: {resolvedWardNo || "—"}</span>
              </div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-[10px] font-bold text-blue-700 border border-blue-100/80">
                <Hash className="h-3 w-3 text-blue-600/80" />
                <span>{t("roomSubmission.info.property")}: {resolvedPropertyNo || "—"}</span>
              </div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-[10px] font-bold text-blue-700 border border-blue-100/80">
                <Layers className="h-3 w-3 text-blue-600/80" />
                <span>{t("roomSubmission.info.partition")}: {resolvedPartitionNo || "—"}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0 ml-auto">
            {isImage && (
              <>
                <button
                  type="button"
                  onClick={() => handleZoom(false)}
                  disabled={transform.scale <= 0.5}
                  className="p-1 sm:p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <span className="text-[10px] sm:text-sm font-bold text-gray-600 min-w-[2.2rem] sm:min-w-[3.5rem] text-center select-none">
                  {Math.round(transform.scale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => handleZoom(true)}
                  disabled={transform.scale >= 7}
                  className="p-1 sm:p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="p-1 sm:p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <div className="w-px h-5 bg-gray-200 mx-0.5 sm:mx-1.5" />
              </>
            )}
            {!isUnsupported && (
              <button
                type="button"
                onClick={handlePrint}
                className="p-1 sm:p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="Print"
                aria-label="Print document"
              >
                <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
            <button
              type="button"
              onClick={handleDownload}
              className="p-1 sm:p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title="Download File"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="p-1 sm:p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              aria-label={isFullscreen ? "Exit fullscreen mode" : "Enter fullscreen mode"}
            >
              {isFullscreen ? (
                <Minimize className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 sm:p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div
          ref={setContainerNode}
          className="flex-1 relative overflow-hidden bg-gray-100 flex items-center justify-center select-none"
        >
          {isDetecting ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <p className="text-xs text-gray-500">{t("discount.detectingDocumentType")}</p>
            </div>
          ) : isPdf ? (
            <div className="w-full h-full p-2 bg-white">
              <iframe
                ref={pdfIframeRef}
                src={`${fileUrl}#toolbar=0`}
                className="w-full h-full border-0 rounded-lg bg-white"
                title={fileName}
              />
            </div>
          ) : isImage ? (
            <div
              className={`w-full h-full flex items-center justify-center overflow-hidden ${
                transform.scale > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : ""
              }`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={() => setIsDragging(false)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fileUrl}
                alt={fileName}
                style={{
                  transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                  transition: isTransitioning ? "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)" : "none",
                }}
                className="max-w-full max-h-full object-contain pointer-events-none select-none"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500 bg-white rounded-lg border border-dashed border-gray-300 max-w-sm w-full mx-4 shadow-sm">
              <FileText className="h-12 w-12 text-blue-500 mb-3" />
              <p className="text-sm font-bold text-gray-800 mb-1">{t("discount.previewNotAvailable")}</p>
              <p className="text-xs text-gray-500 mb-4 max-w-[240px]">
                {t("discount.previewNotAvailableDesc")}
              </p>
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-4 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                {t("discount.downloadToView")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

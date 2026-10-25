"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Download, X, Maximize, Minimize, Printer } from "lucide-react";
import { IconOnlyActionButton } from "@/components/common/ActionButtons";

export interface Section129PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
  label?: string;
}

/**
 * A dedicated, PDF-only preview modal for the Section 129A single-assessment screen — a scoped
 * fork of the shared DocumentViewerModal (@/components/common/DocumentViewerModal.tsx), kept
 * local to this screen so it can drop what this screen never needs: image zoom/pan, image-vs-PDF
 * type detection, and the Ward/Property/Partition context badges (not applicable here — this
 * modal only ever shows the server-generated Section 129A schedule PDF).
 */
export function Section129PdfPreviewModal({ isOpen, onClose, fileUrl, fileName, label }: Section129PdfPreviewModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const pdfIframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

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

  const handlePrint = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        const iframe = pdfIframeRef.current;
        if (iframe?.contentWindow) {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } else {
          window.open(fileUrl, "_blank");
        }
      } catch {
        // Cross-origin restriction — open in new tab as fallback
        window.open(fileUrl, "_blank");
      }
    },
    [fileUrl]
  );

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName || "download.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen || !mounted || !fileUrl) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/20 p-0 sm:p-4 transition-opacity duration-300"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="relative flex flex-col w-full h-full sm:h-[94vh] sm:w-[96vw] sm:max-w-7xl bg-white rounded-none sm:rounded-xl shadow-2xl overflow-hidden border border-gray-200 text-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border-b border-gray-200 gap-2">
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

          <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0 ml-auto">
            <IconOnlyActionButton
              icon={Printer}
              variant="ghost"
              size="sm"
              onClick={handlePrint}
              title="Print"
              aria-label="Print document"
              className="p-1 sm:p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors h-auto w-auto px-1 sm:px-2"
            />
            <IconOnlyActionButton
              icon={Download}
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              title="Download File"
              aria-label="Download file"
              className="p-1 sm:p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors h-auto w-auto px-1 sm:px-2"
            />
            <IconOnlyActionButton
              icon={isFullscreen ? Minimize : Maximize}
              variant="ghost"
              size="sm"
              onClick={handleToggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              aria-label={isFullscreen ? "Exit fullscreen mode" : "Enter fullscreen mode"}
              className="p-1 sm:p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors h-auto w-auto px-1 sm:px-2"
            />
            <IconOnlyActionButton
              icon={X}
              variant="ghost"
              size="sm"
              onClick={onClose}
              title="Close"
              aria-label="Close"
              className="p-1 sm:p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors h-auto w-auto px-1 sm:px-2"
            />
          </div>
        </div>

        <div className="flex-1 relative overflow-hidden bg-gray-100 flex items-center justify-center">
          <div className="w-full h-full p-2 bg-white">
            <iframe ref={pdfIframeRef} src={`${fileUrl}#toolbar=0`} className="w-full h-full border-0 rounded-lg bg-white" title={fileName} />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

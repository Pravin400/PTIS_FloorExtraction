'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { ImageWithFallback } from './ImageWithFallback';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ImageHoverPreviewProps {
  src: string;
  src2?: string;
  title: string;
  visible: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  beforeLabel?: string;
  afterLabel?: string;
  fallbackSrc?: string;
  fallbackSrc2?: string;
  documentGuid?: string;
}

export function ImageHoverPreview({
  src,
  src2,
  title,
  visible,
  onMouseEnter,
  onMouseLeave,
  beforeLabel,
  afterLabel,
  fallbackSrc,
  fallbackSrc2,
  documentGuid,
}: ImageHoverPreviewProps): React.ReactElement | null {
  const t = useTranslations('ptis');
  const [zoomScale, setZoomScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset zoom and pan during rendering when displayed images change
  const currentSrcKey = `${src || ''}_${src2 || ''}_${documentGuid || ''}_${fallbackSrc || ''}_${fallbackSrc2 || ''}_${title || ''}`;
  const [prevSrcKey, setPrevSrcKey] = useState(currentSrcKey);
  if (prevSrcKey !== currentSrcKey) {
    setPrevSrcKey(currentSrcKey);
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
    setIsDragging(false);
  }

  // Handle mouse up globally to prevent drag getting stuck if user releases mouse outside
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging]);

  const applyZoomDelta = React.useCallback((deltaAmount: number, deltaMode = 0) => {
    const normalizedDelta = deltaMode === 1 ? deltaAmount * 33 : deltaMode === 2 ? deltaAmount * 100 : deltaAmount;
    const zoomStep = normalizedDelta * 0.0035;
    if (Math.abs(zoomStep) < 0.001) return;

    setZoomScale((prev) => {
      let next = prev + zoomStep;
      if (next < 0.1) next = 0.1;
      if (next > 4) next = 4;
      next = Math.round(next * 100) / 100;

      if (next <= 1) {
        setPanOffset({ x: 0, y: 0 });
      } else if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const contentWidth = rect.width - 16;
        const contentHeight = rect.height;
        const maxOffsetX = ((next - 1) * contentWidth) / 2;
        const maxOffsetY = ((next - 1) * contentHeight) / 2;
        setPanOffset((prevPan) => ({
          x: Math.max(-maxOffsetX, Math.min(maxOffsetX, prevPan.x)),
          y: Math.max(-maxOffsetY, Math.min(maxOffsetY, prevPan.y)),
        }));
      }

      return next;
    });
  }, []);

  const hasValidImage = Boolean(src || documentGuid || fallbackSrc || src2 || fallbackSrc2);

  // Handle wheel events: on preview container and across active media panel
  useEffect(() => {
    if (!visible || !hasValidImage) return;

    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      if (containerRef.current?.contains(target)) {
        e.preventDefault();
        e.stopPropagation();
        applyZoomDelta(-e.deltaY, e.deltaMode);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, [visible, hasValidImage, applyZoomDelta]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomScale <= 1 || e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="button"]')) return;

    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - panOffset.x,
      y: e.clientY - panOffset.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomScale <= 1 || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const contentWidth = rect.width - 16;
    const contentHeight = rect.height;

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    // Constrain offset so the image doesn't pan past its borders
    const maxOffsetPrevX = ((zoomScale - 1) * contentWidth) / 2;
    const maxOffsetPrevY = ((zoomScale - 1) * contentHeight) / 2;

    const constrainedX = Math.max(-maxOffsetPrevX, Math.min(maxOffsetPrevX, dx));
    const constrainedY = Math.max(-maxOffsetPrevY, Math.min(maxOffsetPrevY, dy));

    setPanOffset({ x: constrainedX, y: constrainedY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomScale((prev) => {
      const step = prev < 1 ? 0.2 : 0.5;
      return Math.min(Math.round((prev + step) * 100) / 100, 4);
    });
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomScale((prev) => {
      const step = prev <= 1 ? 0.2 : 0.5;
      const next = Math.max(Math.round((prev - step) * 100) / 100, 0.1);
      if (next <= 1) {
        setPanOffset({ x: 0, y: 0 });
      } else if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const contentWidth = rect.width - 16;
        const contentHeight = rect.height;
        const maxOffsetX = ((next - 1) * contentWidth) / 2;
        const maxOffsetY = ((next - 1) * contentHeight) / 2;
        setPanOffset((prevPan) => ({
          x: Math.max(-maxOffsetX, Math.min(maxOffsetX, prevPan.x)),
          y: Math.max(-maxOffsetY, Math.min(maxOffsetY, prevPan.y)),
        }));
      }
      return next;
    });
  };

  const handleResetZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
    setIsDragging(false);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;

    setZoomScale((prev) => {
      if (prev !== 1) {
        setPanOffset({ x: 0, y: 0 });
        setIsDragging(false);
        return 1;
      }
      return 2;
    });
  };

  if (!visible || !hasValidImage) return null;

  const isPlanPreview = Boolean(
    (title && /plan|नकाशा|प्लॅन/i.test(title)) ||
    (src && /\.svg/i.test(src)) ||
    (fallbackSrc && /\.svg/i.test(fallbackSrc))
  );

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`
        hidden lg:block
        absolute right-full top-0 bottom-0 pr-3 z-50
        ${isPlanPreview ? 'w-[560px] xl:w-[620px] 2xl:w-[680px]' : 'w-[440px] xl:w-[480px] 2xl:w-[496px]'}
        max-w-[calc(100vw-350px)] max-h-[calc(100vh-140px)] pointer-events-auto
        animate-in fade-in slide-in-from-right-3 duration-200
      `}
    >
      <div className={`w-full h-full rounded-2xl overflow-hidden shadow-2xl border-[3px] border-blue-600 ${isPlanPreview ? 'bg-white' : 'bg-slate-950'} relative select-none flex flex-col`}>
        {/* Floating Control Toolbar */}
        <div
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-3 right-3 z-30 flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/20 shadow-lg text-white select-none"
        >
          <span className="text-[11px] font-bold text-slate-200 px-1 select-none">
            {Math.round(zoomScale * 100)}%
          </span>
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={handleZoomOut}
            disabled={zoomScale <= 0.1}
            className="p-1 hover:bg-white/20 rounded-full transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer text-white"
            title={t('media.zoomOut') || 'Zoom Out'}
            aria-label={t('media.zoomOut') || 'Zoom Out'}
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={handleZoomIn}
            disabled={zoomScale >= 4}
            className="p-1 hover:bg-white/20 rounded-full transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer text-white"
            title={t('media.zoomIn') || 'Zoom In'}
            aria-label={t('media.zoomIn') || 'Zoom In'}
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          {zoomScale !== 1 && (
            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={handleResetZoom}
              className="p-1 hover:bg-white/20 rounded-full transition-colors cursor-pointer text-white"
              title={t('media.resetZoom') || 'Reset Zoom'}
              aria-label={t('media.resetZoom') || 'Reset Zoom'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Viewport Content */}
        <div
          onDoubleClick={handleDoubleClick}
          className={`w-full h-full relative overflow-hidden ${isPlanPreview ? 'bg-white' : 'bg-slate-950'} ${
            zoomScale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
          }`}
          style={{
            transform: `scale(${zoomScale}) translate(${panOffset.x / zoomScale}px, ${panOffset.y / zoomScale}px)`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
        >
          {(src2 || fallbackSrc2) ? (
            <div className="grid grid-cols-2 h-full w-full relative bg-slate-950">
              {/* Left Side: Before */}
              <div className="relative h-full w-full overflow-hidden border-r border-slate-800 bg-slate-950 flex items-center justify-center">
                <ImageWithFallback
                  src={src}
                  documentGuid={documentGuid}
                  fallbackSrc={fallbackSrc}
                  alt={`${beforeLabel || t('media.beforeYear') || 'Before (2015)'} ${t('media.satelliteView') || 'Satellite View'}`}
                  className={`w-full h-full ${zoomScale < 1 ? 'object-contain' : 'object-cover'}`}
                  width={480}
                  height={1200}
                  priority
                />
                {/* Year Badge */}
                <div className="absolute top-3 left-3 z-10 bg-black/80 text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-md backdrop-blur-xs border border-white/10">
                  {beforeLabel || t('media.beforeYear') || 'Before (2015)'}
                </div>
              </div>

              {/* Right Side: After */}
              <div className="relative h-full w-full overflow-hidden bg-slate-950 flex items-center justify-center">
                <ImageWithFallback
                  src={src2 || ''}
                  fallbackSrc={fallbackSrc2}
                  alt={`${afterLabel || t('media.afterYear') || 'After (2026)'} ${t('media.satelliteView') || 'Satellite View'}`}
                  className={`w-full h-full ${zoomScale < 1 ? 'object-contain' : 'object-cover'}`}
                  width={480}
                  height={1200}
                  priority
                />
                {/* Year Badge */}
                <div className="absolute top-3 left-3 z-10 bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-md border border-emerald-400/30">
                  {afterLabel || t('media.afterYear') || 'After (2026)'}
                </div>
              </div>
            </div>
          ) : (
            <div className={`w-full h-full relative ${isPlanPreview ? 'bg-white' : 'bg-slate-950'} flex items-center justify-center`}>
              <ImageWithFallback
                src={src}
                documentGuid={documentGuid}
                fallbackSrc={fallbackSrc}
                alt={title}
                className={`w-full h-full ${isPlanPreview ? 'object-contain p-4 pb-16' : (zoomScale < 1 ? 'object-contain' : 'object-cover')}`}
                width={960}
                height={1200}
                priority
              />
            </div>
          )}
        </div>

        {/* Caption Overlay */}
        <div className={`absolute bottom-0 left-0 right-0 ${isPlanPreview ? 'bg-gradient-to-t from-white via-white/90 to-transparent pt-6 pb-3 px-4 border-t border-slate-100' : 'bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4'} z-10 pointer-events-none flex items-center justify-between`}>
          <p className={`${isPlanPreview ? 'text-slate-800 font-bold' : 'text-white font-semibold'} text-xs sm:text-sm tracking-wide drop-shadow-xs truncate`}>
            {title}
          </p>
          <span className={`text-[10px] font-medium ${isPlanPreview ? 'text-slate-600 bg-slate-100/95 border-slate-200 shadow-xs' : 'text-slate-300 bg-black/60 border-white/10'} px-2 py-0.5 rounded border ml-2 shrink-0 backdrop-blur-xs`}>
            {zoomScale > 1
              ? t('media.dragToPan') || 'Drag to Pan'
              : t('media.zoomInstructions') || 'Scroll / Dbl-Click to Zoom'}
          </span>
        </div>
      </div>
    </div>
  );
}

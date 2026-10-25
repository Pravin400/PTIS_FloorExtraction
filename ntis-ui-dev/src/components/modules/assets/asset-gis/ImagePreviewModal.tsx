'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Eye, ChevronLeft, ChevronRight, AlertTriangle, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/common';
import type { ImagePreviewModalProps } from '@/types/asset-gis.types';

export type { ImagePreviewModalProps };

export function ImagePreviewModal({
  isOpen,
  onClose,
  carouselImages,
  carouselIndex,
  onPrev,
  onNext,
  onSetIndex,
  failedImages,
  onImageError
}: ImagePreviewModalProps) {
  const t = useTranslations('assetGis');
  const [localFailed, setLocalFailed] = useState<Record<string, boolean>>({});
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [prevIndex, setPrevIndex] = useState(carouselIndex);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  // ESC handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (prevIndex !== carouselIndex || prevIsOpen !== isOpen) {
    setPrevIndex(carouselIndex);
    setPrevIsOpen(isOpen);
    setScale(1);
    setPosition({ x: 0, y: 0 });
    if (!isOpen) {
      setLocalFailed({});
    }
  }

  if (!isOpen) return null;

  const currentUrl = carouselImages[carouselIndex]?.url || '';
  const isWmfFile = currentUrl.toLowerCase().includes('.wmf') || currentUrl.toLowerCase().endsWith('.wmf');
  const isImageFailed = !currentUrl ||
    currentUrl.trim() === '' ||
    currentUrl === 'NOT_FOUND' ||
    failedImages[currentUrl] ||
    localFailed[currentUrl];

  const handleImageError = () => {
    if (currentUrl) {
      setLocalFailed(prev => ({ ...prev, [currentUrl]: true }));
      onImageError(currentUrl);
    }
  };

  // Zoom / Drag logic
  const handlePointerDown = (e: React.PointerEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleDoubleClick = () => {
    if (scale > 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(2.5);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" />
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 bg-white rounded-2xl shadow-2xl overflow-hidden"
        style={{ width: '90vw', maxWidth: '900px', maxHeight: '85vh' }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <h4 className="text-sm font-black text-slate-700 flex items-center gap-2">
            <Eye className="w-4 h-4 text-emerald-600" />
            {t('details.photos')}
          </h4>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={onClose}
            icon={X}
            className="rounded-full h-7 w-7 p-0 flex items-center justify-center hover:bg-slate-200 text-slate-500 border-0"
            aria-label={t('actions.close')}
            title="Close"
          />
        </div>

        <div className="p-4 flex flex-col items-center justify-center relative group/modal" style={{ height: 'calc(85vh - 52px)' }}>
          <div className="w-full h-full flex items-center justify-center overflow-hidden min-h-[400px] relative select-none">
            <AnimatePresence mode="wait">
              {isImageFailed ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center p-8 rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-50/70 to-amber-50/50 max-w-md shadow-lg shadow-rose-500/5"
                >
                  <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-5 animate-pulse">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <h5 className="text-lg font-black text-rose-950 uppercase tracking-tight">{t('details.noPhotosFound')}</h5>
                  <p className="text-xs font-semibold text-slate-500 mt-2.5 text-center leading-relaxed">
                    {isWmfFile
                      ? 'The document plan is in Windows Metafile (.wmf) format, which is not natively supported by modern web browsers.'
                      : t('details.noPhotosFound')}
                  </p>
                </motion.div>
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center pointer-events-auto"
                  style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                    transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                    cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                    touchAction: 'none'
                  }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onDoubleClick={handleDoubleClick}
                >
                  <motion.img
                    key={carouselIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    src={currentUrl}
                    alt={carouselImages[carouselIndex]?.label || 'Preview'}
                    className="max-w-full max-h-full object-contain rounded-lg select-none pointer-events-none"
                    onError={handleImageError}
                  />
                </div>
              )}
            </AnimatePresence>

            {/* Floating Zoom Controls */}
            {!isImageFailed && (
              <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-full z-30 shadow-lg border border-white/10">
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => setScale(s => {
                    const newS = Math.max(1, s - 0.5);
                    if (newS === 1) setPosition({ x: 0, y: 0 });
                    return newS;
                  })}
                  disabled={scale <= 1}
                  icon={ZoomOut}
                  className="p-1.5 text-white hover:text-blue-400 disabled:text-white/20 disabled:hover:text-white/20 transition-colors cursor-pointer disabled:cursor-not-allowed h-auto border-0"
                  title="Zoom Out"
                />
                <span className="text-[10px] font-black text-white px-1 select-none min-w-[32px] text-center tracking-tight">
                  {Math.round(scale * 100)}%
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => setScale(s => Math.min(5, s + 0.5))}
                  disabled={scale >= 5}
                  icon={ZoomIn}
                  className="p-1.5 text-white hover:text-blue-400 disabled:text-white/20 disabled:hover:text-white/20 transition-colors cursor-pointer disabled:cursor-not-allowed h-auto border-0"
                  title="Zoom In"
                />
                {scale > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => { setScale(1); setPosition({ x: 0, y: 0 }); }}
                    icon={RotateCcw}
                    className="p-1.5 text-white hover:text-rose-400 transition-colors border-l border-white/10 pl-2 cursor-pointer h-auto border-y-0 border-r-0 rounded-none"
                    title="Reset Zoom"
                  />
                )}
              </div>
            )}
          </div>

          {carouselImages.length > 1 && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onPrev}
                icon={ChevronLeft}
                className="absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition-colors text-slate-700 hover:scale-110 active:scale-95 z-20 h-auto p-0 border-0"
                title="Previous Image"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onNext}
                icon={ChevronRight}
                className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition-colors text-slate-700 hover:scale-110 active:scale-95 z-20 h-auto p-0 border-0"
                title="Next Image"
              />

              <div className="absolute bottom-6 flex gap-1.5 z-20">
                {carouselImages.map((_, i) => (
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    key={i}
                    onClick={() => onSetIndex(i)}
                    className={`h-2 p-0 rounded-full transition-all border-0 ${i === carouselIndex ? 'w-6 bg-blue-600' : 'w-2 bg-slate-300'}`}
                  />
                ))}
              </div>
            </>
          )}

          <div className="absolute bottom-6 left-6 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-white text-[10px] font-bold uppercase tracking-widest z-20 shadow-xl">
            {carouselImages[carouselIndex]?.label} — {carouselIndex + 1} OF {carouselImages.length}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

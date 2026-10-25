'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { PhotoUploadSuccessModalProps } from '@/types/common.types';

export type { PhotoUploadSuccessModalProps };

export function PhotoUploadSuccessModal({
  open,
  onClose,
  isReplacement = false,
}: PhotoUploadSuccessModalProps): React.ReactElement | null {
  const t = useTranslations('common');

  // Auto-close after 2 seconds
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      onClose();
    }, 2000);
    return () => clearTimeout(timer);
  }, [open, onClose]);

  // Handle ESC key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open || typeof window === 'undefined') return null;

  const titleText = isReplacement
    ? (t.has?.('photoReplacedSuccess') ? t('photoReplacedSuccess') : (t.has?.('media.photoReplacedSuccess') ? t('media.photoReplacedSuccess') : 'Photo Replaced Successfully'))
    : (t.has?.('photoUploadedSuccess') ? t('photoUploadedSuccess') : (t.has?.('media.photoUploadedSuccess') ? t('media.photoUploadedSuccess') : 'Photo Uploaded Successfully'));
  const descText = isReplacement
    ? (t.has?.('photoReplacedDesc') ? t('photoReplacedDesc') : (t.has?.('media.photoReplacedDesc') ? t('media.photoReplacedDesc') : 'The photo has been successfully updated in your gallery.'))
    : (t.has?.('photoUploadedDesc') ? t('photoUploadedDesc') : (t.has?.('media.photoUploadedDesc') ? t('media.photoUploadedDesc') : 'The photo has been successfully added to your asset gallery.'));

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-xs sm:max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[151] animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Top Decorative Gradient Bar */}
        <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 text-center">
          {/* Animated Green Badge */}
          <div className="relative inline-flex items-center justify-center mb-3.5">
            <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-30" />
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="w-7 h-7 text-white stroke-[2.5]" />
            </div>
          </div>

          {/* Heading */}
          <h3 className="text-base font-bold text-slate-900 tracking-tight mb-1">
            {titleText}
          </h3>
          <p className="text-xs text-slate-500 max-w-[240px] mx-auto leading-relaxed">
            {descText}
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}

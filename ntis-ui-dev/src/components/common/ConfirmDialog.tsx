'use client';

/**
 * Universal Confirm Dialog (Common Presentation Primitive)
 * Path: src/components/common/ConfirmDialog.tsx
 *
 * Lightweight, compact, and accessible modal confirmation dialog for
 * destructive actions (delete) and verified operations without the
 * bloated layout or forced heights of legacy providers.
 * Line ceiling: <= 300 lines.
 */

import React, { useEffect, useRef, useCallback, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { Trash2, AlertTriangle, Info, CheckCircle2, X, Loader2 } from 'lucide-react';
import { Button } from './ActionButton';

export type ConfirmDialogVariant = 'delete' | 'warning' | 'info' | 'success';
export type ConfirmDialogSize = 'xs' | 'sm' | 'md';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  variant?: ConfirmDialogVariant;
  size?: ConfirmDialogSize;
  title: React.ReactNode;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

const SIZE_CLASS_MAP: Record<ConfirmDialogSize, string> = {
  xs: 'max-w-[300px]',
  sm: 'max-w-[340px]',
  md: 'max-w-[420px]',
};

const emptySubscribe = () => () => {};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  variant = 'delete',
  size = 'sm',
  title,
  description,
  confirmText,
  cancelText,
  isLoading = false,
}: ConfirmDialogProps): React.ReactElement | null {
  const t = useTranslations('common');
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const modalRef = useRef<HTMLDivElement>(null);

  // ESC key dismissal
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    },
    [onClose, isLoading]
  );

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!mounted || !isOpen || typeof document === 'undefined') return null;

  const isDelete = variant === 'delete';
  const isWarning = variant === 'warning';
  const isSuccess = variant === 'success';

  const accentBar = isDelete
    ? 'bg-gradient-to-r from-rose-500 via-red-500 to-rose-600'
    : isWarning
    ? 'bg-gradient-to-r from-amber-500 to-orange-500'
    : isSuccess
    ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
    : 'bg-gradient-to-r from-blue-500 to-indigo-600';

  const badgeStyle = isDelete
    ? 'bg-rose-50 text-rose-600 border-rose-200 ring-4 ring-rose-50/50'
    : isWarning
    ? 'bg-amber-50 text-amber-600 border-amber-200 ring-4 ring-amber-50/50'
    : isSuccess
    ? 'bg-emerald-50 text-emerald-600 border-emerald-200 ring-4 ring-emerald-50/50'
    : 'bg-blue-50 text-blue-600 border-blue-200 ring-4 ring-blue-50/50';

  const Icon = isDelete ? Trash2 : isWarning ? AlertTriangle : isSuccess ? CheckCircle2 : Info;
  const defaultConfirmText = isDelete ? t('buttons.delete') : t('buttons.confirm');
  const defaultCancelText = t('buttons.cancel');
  const closeLabel = t('buttons.close');

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 select-none"
    >
      {/* Backdrop */}
      <div
        onClick={() => !isLoading && onClose()}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
      />

      {/* Sized Dialog Card */}
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full ${SIZE_CLASS_MAP[size]} overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200/90 z-10 animate-in fade-in zoom-in-95 duration-150 flex flex-col`}
      >
        {/* Top Accent Gradient Bar */}
        <div className={`h-1 w-full ${accentBar}`} />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
          aria-label={closeLabel}
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Content Body */}
        <div className="p-4 sm:p-5 flex flex-col items-center text-center space-y-2.5">
          {/* Icon Badge */}
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs ${badgeStyle}`}>
            <Icon className="w-5 h-5" />
          </div>

          {/* Title & Description */}
          <div className="space-y-1">
            <h3 id="confirm-dialog-title" className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-snug">
              {title}
            </h3>
            <div id="confirm-dialog-desc" className="text-xs text-slate-500 font-medium leading-relaxed max-w-[280px] mx-auto">
              {description}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full pt-1.5 flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="xs"
              onClick={onClose}
              disabled={isLoading}
              className="h-8 flex-1 border-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer active:scale-95 transition-all"
            >
              {cancelText || defaultCancelText}
            </Button>

            <Button
              type="button"
              variant={isDelete ? 'danger' : 'primary'}
              size="xs"
              onClick={() => onConfirm()}
              disabled={isLoading}
              icon={isLoading ? Loader2 : Icon}
              className={`h-8 flex-1 font-bold text-xs rounded-xl cursor-pointer active:scale-95 transition-all shadow-2xs text-white ${
                isDelete
                  ? 'bg-red-600 hover:bg-red-700 border-red-700'
                  : isWarning
                  ? 'bg-amber-600 hover:bg-amber-700 border-amber-700'
                  : isSuccess
                  ? 'bg-emerald-600 hover:bg-emerald-700 border-emerald-700'
                  : 'bg-blue-600 hover:bg-blue-700 border-blue-700'
              }`}
            >
              {confirmText || defaultConfirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

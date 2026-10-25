'use client';

/**
 * Common Grievance Modal Shell
 * Unified responsive modal & mobile bottom-sheet primitive across the Grievance module.
 *
 * Behaviors:
 * - Mobile (< 768px): Smooth slide-in-from-bottom drawer with drag handle.
 * - Desktop (>= 768px): Centered modal dialog with subtle scale-in animation.
 * - Backdrop: Dark translucent backdrop with blur and fade-in animation.
 * - Keyboard: Native ESC key dismissal.
 * - Scroll: Body overflow lock while active.
 *
 * Path: src/components/modules/grievance/shared/GrievanceModalShell.tsx
 */

import React, { useEffect, useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

const subscribe = () => () => {};

export const GRIEVANCE_MODAL_WIDTH = {
  sm: 'max-w-sm sm:max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full',
} as const;

export type GrievanceModalWidth = keyof typeof GRIEVANCE_MODAL_WIDTH;

export interface GrievanceModalShellProps {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  maxWidth?: GrievanceModalWidth;
  className?: string;
  isPageMode?: boolean;
  showDragHandle?: boolean;
  zIndex?: string;
  ariaLabelledBy?: string;
  role?: string;
  closeOnBackdropClick?: boolean;
}

export function GrievanceModalShell({
  isOpen,
  onClose,
  children,
  maxWidth = 'md',
  className = '',
  isPageMode = false,
  zIndex = 'z-[150]',
  ariaLabelledBy,
  role = 'dialog',
  closeOnBackdropClick,
}: GrievanceModalShellProps) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // ESC key listener & body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current?.();
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const widthClass = GRIEVANCE_MODAL_WIDTH[maxWidth];
  const isBackdropClickAllowed = closeOnBackdropClick ?? !isPageMode;

  const modalNode = (
    <div
      role={role}
      aria-modal="true"
      aria-labelledby={ariaLabelledBy}
      className={`fixed inset-0 ${zIndex} flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto pointer-events-auto`}
      onClick={(e) => {
        if (e.target === e.currentTarget && isBackdropClickAllowed) {
          onClose?.();
        }
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full ${widthClass} max-h-[94vh] sm:max-h-[90vh] bg-white border border-slate-200/90 shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden font-sans text-left animate-in zoom-in-95 fade-in duration-200 flex flex-col pointer-events-auto my-auto ${className}`}
      >
        {children}
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
}

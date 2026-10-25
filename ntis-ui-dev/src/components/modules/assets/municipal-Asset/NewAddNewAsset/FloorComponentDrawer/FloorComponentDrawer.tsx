'use client';
import type { FloorComponentDrawerProps } from "@/types/asset/municipal-Asset/new-add-new-asset";

import { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { FloorDrawerContent } from './FloorDrawerContent';
import { useConfirm } from '@/components/common/ConfirmProvider';
import { motion, AnimatePresence } from 'framer-motion';



export function FloorComponentDrawer({
  isOpen,
  onClose,
  assetId,
  categoryId,
  typeId,
  categoryStr,
  assetTypeStr,
  mode = 'floorSubmission',
  editFloorId,
  onSuccess
}: FloorComponentDrawerProps) {
  const { confirm } = useConfirm();

  const handleClose = useCallback(() => {
    const isDirty = false; // Add real check here if needed

    if (isDirty) {
      confirm({
        title: 'Discard Changes?',
        description: 'You have unsaved changes in this form. Are you sure you want to discard them and close?',
        confirmText: 'Discard',
        cancelText: 'Cancel',
        variant: 'warning',
        onConfirm: () => {
          onClose();
        }
      });
    } else {
      onClose();
    }
  }, [confirm, onClose]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, handleClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100]"
            onClick={handleClose}
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-[95vw] md:max-w-[1200px] bg-slate-50 shadow-2xl z-[101] flex flex-col"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-3.5 bg-[#101b87] text-white border-b border-[#101b87] shrink-0 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-6.5 h-6.5 rounded-lg bg-white/10 flex items-center justify-center text-white shrink-0 border border-white/20 shadow-sm">
                  {mode === 'generateUnits' ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                  )}
                </div>
                <div>
                  <h2 className="text-[12.5px] font-black text-white tracking-wide leading-none">
                    {mode === 'generateUnits' ? 'Unit Management Pool' : 'Floor Submission'}
                  </h2>
                  <p className="text-[8.5px] font-black text-blue-100 uppercase tracking-widest mt-1.5 leading-none">
                    {mode === 'generateUnits' ? 'Generate units directly against the building' : 'Register and configure floor layouts'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Drawer Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-3 md:p-4 custom-scrollbar bg-slate-50 relative">
              <FloorDrawerContent
                assetId={assetId}
                categoryId={categoryId}
                typeId={typeId}
                categoryStr={categoryStr}
                assetTypeStr={assetTypeStr}
                mode={mode}
                editFloorId={editFloorId}
                onSuccess={onSuccess}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

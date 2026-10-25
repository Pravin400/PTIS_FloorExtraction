'use client';

import React from 'react';
import { OldDetailsPanel } from './OldDetailsPanel';

export interface OldDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  wingDetailsId?: number | null;
  societyDetailId?: number | null;
  wingName?: string | null;
}

export const OldDetailsModal: React.FC<OldDetailsModalProps> = ({
  isOpen,
  onClose,
  wingDetailsId,
  societyDetailId,
  wingName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-6xl max-h-[85vh] bg-white rounded-xl shadow-2xl border border-zinc-200 flex flex-col overflow-hidden">
        <OldDetailsPanel
          wingDetailsId={wingDetailsId}
          societyDetailId={societyDetailId}
          wingName={wingName}
          onClose={onClose}
        />
      </div>
    </div>
  );
};

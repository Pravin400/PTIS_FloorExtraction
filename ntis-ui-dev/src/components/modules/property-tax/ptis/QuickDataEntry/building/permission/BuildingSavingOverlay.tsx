import React from 'react';
import { Loader2 } from 'lucide-react';

interface BuildingSavingOverlayProps {
  isSaving: boolean;
  t: (key: string) => string;
}

export function BuildingSavingOverlay({
  isSaving,
  t,
}: BuildingSavingOverlayProps): React.ReactElement | null {
  if (!isSaving) return null;

  return (
    <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-50 flex items-center justify-center rounded-xl shadow-lg">
      <div className="flex items-center gap-3 px-5 py-3 bg-slate-900/90 text-white rounded-xl shadow-2xl text-sm font-semibold animate-pulse">
        <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
        <span>{t('building.saving') || 'Saving building permissions & documents...'}</span>
      </div>
    </div>
  );
}

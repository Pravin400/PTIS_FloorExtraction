'use client';

import { Save } from 'lucide-react';
import { SubUnitConfiguratorFooterProps } from '@/types/asset/sub-units.types';

export function SubUnitConfiguratorFooter({
  onCancel,
  onSaveClick,
  t,
}: SubUnitConfiguratorFooterProps) {
  return (
    <div className="px-4 py-2.5 bg-white border-t border-slate-200 flex justify-end gap-2.5 shrink-0">
      <button
        onClick={onCancel}
        className="px-5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 uppercase tracking-widest transition-colors"
      >
        {t('buttons.cancel')}
      </button>
      <button
        onClick={onSaveClick}
        className="px-5 py-1.5 bg-emerald-600 rounded-lg text-xs font-bold text-white hover:bg-emerald-700 uppercase tracking-widest flex items-center gap-2 shadow-md transition-colors"
      >
        <Save className="size-3.5" /> {t('buttons.saveUnit')}
      </button>
    </div>
  );
}

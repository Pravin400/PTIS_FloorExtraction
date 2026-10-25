'use client';

import { Save } from 'lucide-react';
import { SubUnitConfiguratorFooterProps } from '@/types/asset/sub-units.types';

export function SubUnitConfiguratorFooter({
  onCancel,
  onSaveClick,
  t,
}: SubUnitConfiguratorFooterProps) {
  return (
    <div className="px-4 py-2 bg-white border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
      <div />
      <div className="flex items-center gap-2">
        <button
          onClick={onCancel}
          className="h-[25px] px-4 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-md text-[9.5px] font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer"
        >
          {t('buttons.cancel')}
        </button>
        <button
          onClick={onSaveClick}
          className="h-[25px] px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[9.5px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
        >
          <Save className="size-3" /> {t('buttons.saveUnit')}
        </button>
      </div>
    </div>
  );
}

'use client';

import { Building2 } from 'lucide-react';
import { SubUnitConfiguratorHeaderProps } from '@/types/asset/sub-units.types';

export function SubUnitConfiguratorHeader({
  parentBuildingName,
  unitNumber,
  onCancel,
  t,
}: SubUnitConfiguratorHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-[#1e293b] border-b border-white/10 shrink-0">
      <div className="flex items-center gap-3">
        <div className="p-1.5 bg-blue-500/20 rounded-lg border border-blue-500/30">
          <Building2 className="size-4 text-blue-400" />
        </div>
        <div>
          <h2 className="text-sm font-black text-white tracking-wide">{parentBuildingName}</h2>
          <p className="text-[10px] text-blue-400 font-semibold tracking-widest uppercase">
            {t('subunit.title', { unit: unitNumber || t('subunit.fields.newUnit') })}
          </p>
        </div>
      </div>
      <button
        onClick={onCancel}
        className="px-3 py-1.5 border border-slate-500 hover:border-slate-300 hover:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-300 uppercase transition-colors"
      >
        {t('buttons.close')}
      </button>
    </div>
  );
}

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
    <div className="flex items-center justify-between px-6 py-3.5 bg-[#101b87] text-white border-b border-[#101b87] shrink-0 shadow-sm">
      <div className="flex items-center gap-2.5">
        <div className="w-6.5 h-6.5 rounded-lg bg-white/10 flex items-center justify-center text-white shrink-0 border border-white/20 shadow-sm">
          <Building2 className="size-3.5 text-white" />
        </div>
        <div>
          <h2 className="text-[12.5px] font-black text-white tracking-wide leading-none">{parentBuildingName}</h2>
          <p className="text-[8.5px] font-black text-blue-100 uppercase tracking-widest mt-1.5 leading-none">
            {t('subunit.title', { unit: unitNumber || t('subunit.fields.newUnit') })}
          </p>
        </div>
      </div>
      <button
        onClick={onCancel}
        className="px-3 py-1 bg-white/15 hover:bg-white/25 border border-white/10 hover:border-white/20 rounded-md text-[9.5px] font-bold text-white uppercase transition-all shadow-sm cursor-pointer"
      >
        {t('buttons.close')}
      </button>
    </div>
  );
}

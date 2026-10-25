import React from 'react';
import { Building2, Home, Store } from 'lucide-react';
import type { ApplicationLevel, WingOption } from '@/types/building-permission.types';

interface EditRecordLevelSelectorProps {
  level: ApplicationLevel;
  setLevel: (lvl: ApplicationLevel) => void;
  selectedWingDetailId: number | null;
  setSelectedWingDetailId: (id: number | null) => void;
  wings: WingOption[];
  wingFilter: string;
  setWingFilter: (filter: string) => void;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
}

export const EditRecordLevelSelector: React.FC<EditRecordLevelSelectorProps> = ({
  level,
  setLevel,
  selectedWingDetailId,
  setSelectedWingDetailId,
  wings,
  wingFilter,
  setWingFilter,
  t,
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-[#5B50E6] text-white px-4 py-2.5 rounded-xl flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 font-bold text-sm">
          <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">
            1
          </span>
          <span>{t('building.selectApplicationLevel') || 'SELECT APPLICATION LEVEL'}</span>
        </div>
        <span className="text-xs text-indigo-100 font-normal">
          {t('building.chooseWhereRecordApplies') || 'Choose where this record should apply'}
        </span>
      </div>

      {/* Application Level Selection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Apartment Level Card */}
        <button
          type="button"
          onClick={() => setLevel('Apartment')}
          className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer font-semibold text-sm ${
            level === 'Apartment'
              ? 'border-[#5B50E6] bg-[#5B50E6] text-white shadow-md'
              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <Building2 className="w-5 h-5 shrink-0" />
          <span>{t('building.apartmentLevel') || 'Apartment Level'}</span>
        </button>

        {/* Wing Level Card */}
        <button
          type="button"
          onClick={() => setLevel('Wing')}
          className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer font-semibold text-sm ${
            level === 'Wing'
              ? 'border-[#5B50E6] bg-[#5B50E6] text-white shadow-md'
              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <Home className="w-5 h-5 shrink-0" />
          <span>{t('building.wingLevel') || 'Wing Level'}</span>
        </button>

        {/* Unit Level Card */}
        <button
          type="button"
          onClick={() => {
            setLevel('Unit');
            if (selectedWingDetailId && String(selectedWingDetailId) !== wingFilter) {
              setWingFilter(String(selectedWingDetailId));
            }
          }}
          className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer font-semibold text-sm ${
            level === 'Unit'
              ? 'border-[#5B50E6] bg-[#5B50E6] text-white shadow-md'
              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <Store className="w-5 h-5 shrink-0" />
          <span>{t('building.unitLevel') || 'Unit Level'}</span>
        </button>
      </div>

      {/* SELECT WING Pills (visible only for Wing level) */}
      {level === 'Wing' && (
        <div className="space-y-2 pt-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {t('building.selectWing') || 'SELECT WING'}
          </span>
          <div className="flex flex-wrap gap-3">
            {wings.length > 0 ? (
              wings.map((wing) => {
                const isSelected = selectedWingDetailId === wing.wingDetailId;
                return (
                  <button
                    key={wing.wingDetailId}
                    type="button"
                    onClick={() => {
                      setSelectedWingDetailId(wing.wingDetailId);
                      setWingFilter(String(wing.wingDetailId));
                    }}
                    className={`px-6 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all cursor-pointer flex-1 sm:flex-initial text-center ${
                      isSelected
                        ? 'border-[#10B981] bg-white text-[#10B981] shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {wing.wingName}
                  </button>
                );
              })
            ) : (
              <div className="text-xs text-slate-400 italic">
                {t('building.noWingsFound') || 'No wings found'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

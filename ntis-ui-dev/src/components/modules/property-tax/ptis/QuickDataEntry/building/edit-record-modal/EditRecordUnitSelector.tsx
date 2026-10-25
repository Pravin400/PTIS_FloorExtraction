import React from 'react';
import { SearchInput, Select, Checkbox } from '@/components/common';
import type { WingOption, UnitSelectionItem } from '@/types/building-permission.types';

interface EditRecordUnitSelectorProps {
  selectedUnitIds: Set<number>;
  unitSearchQuery: string;
  setUnitSearchQuery: (query: string) => void;
  wingFilter: string;
  setWingFilter: (filter: string) => void;
  wings: WingOption[];
  setSelectedWingDetailId: (id: number | null) => void;
  isAllUnitsSelected: boolean;
  toggleAllUnits: () => void;
  filteredUnits: UnitSelectionItem[];
  toggleUnitSelection: (id: number) => void;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
}

export const EditRecordUnitSelector: React.FC<EditRecordUnitSelectorProps> = ({
  selectedUnitIds,
  unitSearchQuery,
  setUnitSearchQuery,
  wingFilter,
  setWingFilter,
  wings,
  setSelectedWingDetailId,
  isAllUnitsSelected,
  toggleAllUnits,
  filteredUnits,
  toggleUnitSelection,
  t,
}) => {
  const wingOptions = wings.map((w) => ({
    label: w.wingName,
    value: String(w.wingDetailId),
  }));

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {t('building.selectUnits')}
        </span>
        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
          {t('building.unitsSelected', { count: selectedUnitIds.size })}
        </span>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="sm:col-span-1">
          <SearchInput
            value={unitSearchQuery}
            onChange={setUnitSearchQuery}
            placeholder={t('building.searchUnitOrSubProperty')}
            className="w-full mb-0"
            inputClassName="text-xs py-2 pl-9 rounded-lg"
          />
        </div>

        <div>
          <Select
            options={wingOptions}
            value={wingFilter}
            onChange={(_e, val) => {
              setWingFilter(val);
              const matched = wings.find(
                (w) => String(w.wingDetailId) === val || w.wingName === val
              );
              if (matched) {
                setSelectedWingDetailId(matched.wingDetailId);
              }
            }}
            selectSize="sm"
            className="text-xs"
          />
        </div>
      </div>

      {/* Units Selection Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 sticky top-0 uppercase tracking-wider">
            <tr>
              <th className="p-3 w-10 text-center">
                <Checkbox
                  checked={isAllUnitsSelected}
                  onCheckedChange={() => toggleAllUnits()}
                  aria-label={t('building.selectUnits')}
                />
              </th>
              <th className="p-3">{t('building.unitSubProperty')}</th>
              <th className="p-3">{t('building.wing')}</th>
              <th className="p-3">{t('building.floor')}</th>
              <th className="p-3">{t('building.use')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredUnits.length > 0 ? (
              filteredUnits.map((u) => {
                const checked = selectedUnitIds.has(u.propertyDetailsId);
                return (
                  <tr
                    key={u.propertyDetailsId}
                    onClick={() => toggleUnitSelection(u.propertyDetailsId)}
                    className={`hover:bg-indigo-50/50 cursor-pointer transition-colors ${
                      checked ? 'bg-indigo-50/30' : ''
                    }`}
                  >
                    <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleUnitSelection(u.propertyDetailsId)}
                        aria-label={`${u.unitNo}`}
                      />
                    </td>
                    <td className="p-3 font-semibold text-blue-600">{u.unitNo}</td>
                    <td className="p-3 font-semibold text-slate-700">{u.wingName}</td>
                    <td className="p-3 text-slate-600">{u.floorName}</td>
                    <td className="p-3">
                      <span className="bg-blue-100 text-blue-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        {u.useName || t('building.residential')}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="p-6 text-center text-slate-400 italic">
                  {t('building.noUnitsMatch')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

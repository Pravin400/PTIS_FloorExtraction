'use client';

import { RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SearchInput, Select } from '@/components/common';

interface AttributeFilterBarProps {
  searchValue: string;
  dataTypeValue: string;
  attributeValue: string;
  hasActiveFilters: boolean;
  onSearchChange: (val: string) => void;
  onDataTypeChange: (val: string) => void;
  onAttributeChange: (val: string) => void;
  onReset: () => void;
}

export function AttributeFilterBar({
  searchValue,
  dataTypeValue,
  attributeValue,
  hasActiveFilters,
  onSearchChange,
  onDataTypeChange,
  onAttributeChange,
  onReset,
}: AttributeFilterBarProps) {
  const t = useTranslations('socialAttribute');

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center gap-3 overflow-visible relative z-[35]">
      <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
        <div className="w-[380px]">
          <SearchInput
            value={searchValue}
            onChange={onSearchChange}
            placeholder={t('list.filters.search')}
            className="mb-0 w-full text-gray-900"
          />
        </div>
        <div className="w-[180px]">
          <Select
            value={dataTypeValue}
            onChange={(e) => onDataTypeChange(e.target.value)}
            options={[
              { label: t('list.filters.dataType.placeholder'), value: 'ALL' },
              { label: 'BIT', value: 'BIT' },
              { label: 'INT', value: 'INTEGER' },
              { label: 'DECIMAL', value: 'DECIMAL' },
              { label: 'TEXT', value: 'TEXT' },
              { label: 'DATE', value: 'DATE' },
            ]}
            selectSize="md"
            className="w-full text-gray-700 font-medium"
            ariaLabel={t('list.filters.dataType.ariaLabel')}
          />
        </div>
        <div className="w-[180px]">
          <Select
            value={attributeValue}
            onChange={(e) => onAttributeChange(e.target.value)}
            options={[
              { label: t('list.filters.attributeType.placeholder'), value: 'ALL' },
              { label: t('list.filters.attributeType.parentOnly'), value: 'PARENT_ONLY' },
              { label: t('list.filters.attributeType.childOnly'), value: 'CHILD_ONLY' },
              { label: t('list.filters.attributeType.discount'), value: 'DISCOUNT' },
            ]}
            selectSize="md"
            className="w-full text-gray-700 font-medium"
            ariaLabel={t('list.filters.attributeType.ariaLabel')}
          />
        </div>
      </div>

      {hasActiveFilters && (
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 hover:border-slate-400 hover:text-slate-800 transition-all duration-150 whitespace-nowrap ml-auto"
        >
          <RotateCcw size={14} />
          {t('list.buttons.reset')}
        </button>
      )}
    </div>
  );
}

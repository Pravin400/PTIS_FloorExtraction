'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Input, Select, Button } from '@/components/common';
import { Search, X } from 'lucide-react';

export function InventoryFilterBar({
  searchTerm,
  setSearchTerm,
  categoryFilter,
  setCategoryFilter,
  conditionFilter,
  setConditionFilter,
  categories,
  conditions,
  setCurrentPage,
}: {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
  conditionFilter: string;
  setConditionFilter: (v: string) => void;
  categories: string[];
  conditions: string[];
  setCurrentPage: (v: number) => void;
}): React.ReactElement {
  const t = useTranslations('asset-detail');

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center">
      <div className="flex-1 min-w-[200px] relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="w-4 h-4 text-slate-400" />
        </div>
        <Input
          placeholder={t('searchInventory')}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="pl-9 pr-9 h-9 text-sm w-full"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearchTerm('');
              setCurrentPage(1);
            }}
            className="absolute inset-y-0 right-3 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors !p-0 !min-w-0 !h-auto hover:bg-transparent"
            title="Clear"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      <div className="w-48">
        <Select
          options={[{ label: t('allCategories'), value: '' }, ...categories.map(c => ({ label: c, value: c }))]}
          value={categoryFilter}
          onChange={(_, val) => {
            setCategoryFilter(val);
            setCurrentPage(1);
          }}
          className="h-9 text-sm"
          placeholder={t('allCategories')}
        />
      </div>
      <div className="w-48">
        <Select
          options={[{ label: t('allConditions'), value: '' }, ...conditions.map(c => ({ label: c, value: c }))]}
          value={conditionFilter}
          onChange={(_, val) => {
            setConditionFilter(val);
            setCurrentPage(1);
          }}
          className="h-9 text-sm"
          placeholder={t('allConditions')}
        />
      </div>
    </div>
  );
}

'use client';

import { SearchInput } from '@/components/common/SearchInput';

interface ModuleFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  t: (key: string) => string;
}

export function ModuleFilters({ search, onSearchChange, t }: ModuleFiltersProps) {
  return (
    <div className="flex w-full items-center gap-3 justify-end">
      <div className="w-72">
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder={t('filters.searchPlaceholder')}
          className="mb-0 w-full text-gray-900"
        />
      </div>
    </div>
  );
}

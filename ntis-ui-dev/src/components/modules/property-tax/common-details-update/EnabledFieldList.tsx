/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { cn } from '@/lib/utils/cn';
import { Checkbox } from '@/components/common/checkbox';
import { SearchInput } from '@/components/common';

import { ClipboardList, Loader2 } from 'lucide-react';

interface EnabledFieldListProps {
  t: (key: string, values?: Record<string, string | number>) => string;
  isFieldListCollapsed?: boolean;
  setIsFieldListCollapsed?: (collapsed: boolean) => void;
  filteredMenuItems: any[];
  selectedCodes: string[];
  handleMenuSelect: (code: string) => void;
  locale: string;
  selectionType?: 'single' | 'multi';
  /** Controlled search box value — the state lives in the hook file, not in this component */
  searchValue?: string;
  /** Called instantly on every keystroke; debounce + server API call are handled in the hook */
  onSearchChange?: (term: string) => void;
  /** True while the server API call is in-flight */
  isSearching?: boolean;
}

export const EnabledFieldList = ({
  t,
  filteredMenuItems,
  selectedCodes,
  handleMenuSelect,
  locale,
  selectionType = 'single',
  searchValue = '',
  onSearchChange,
  isSearching = false,
}: EnabledFieldListProps) => {
  return (
    <div className="flex flex-col min-h-0 border border-blue-200 rounded-xl bg-white overflow-hidden w-full h-full">
      <div className="flex flex-col gap-2 px-4 py-3 border-b border-blue-200 bg-[#F8FAFF] shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#1E3A8A]">{t('fieldList.title')}</h3>
          <p className="text-xs text-gray-500">{t('fieldList.subtitle')}</p>
        </div>
        {/* Common search bar (search icon + clear button) — debounce & server API call live in the hook */}
        <SearchInput
          value={searchValue}
          onChange={(value) => onSearchChange?.(value)}
          placeholder={t('fieldList.searchPlaceholder')}
          showClear
          className="mb-0 w-full"
        />
      </div>

      <div className="p-4 py-2 flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-2 shrink-0">
          <p className="text-sm font-medium text-gray-700">{t('fieldList.enabledFieldList')}</p>
          <span className="text-sm text-gray-500">
            {filteredMenuItems.length} {t('fieldList.available')}
          </span>
        </div>

        <div className="space-y-2 flex-1 overflow-y-auto pr-1">
          {/* Loading spinner while search is in-flight */}
          {isSearching && (
            <div className="flex items-center justify-center py-6 gap-2 text-blue-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-xs text-gray-500">{t('fieldList.searching')}</span>
            </div>
          )}

          {!isSearching &&
            filteredMenuItems.map((item) => {
              const isSelected = selectedCodes.includes(item.updateCode);
              const displayLabel =
                locale === 'mr' || locale === 'hi'
                  ? item.updateNameMarathi || item.updateName
                  : item.updateName;

              return (
                <div
                  key={item.updateCode}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleMenuSelect(item.updateCode)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleMenuSelect(item.updateCode);
                    }
                  }}
                  className={cn(
                    'group w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left h-auto cursor-pointer focus:!ring-0 focus:outline-none focus:ring-offset-0',
                    isSelected
                      ? 'bg-blue-50/80 border-blue-300 ring-1 ring-blue-200 shadow-sm'
                      : 'bg-white border-gray-200 hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-sm'
                  )}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-sm font-medium',
                          isSelected ? 'text-[#1E3A8A]' : 'text-gray-700'
                        )}
                      >
                        {displayLabel}
                      </p>
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                  {selectionType === 'multi' && (
                    <div className="flex items-center gap-2 ml-2 shrink-0">
                      <Checkbox
                        checked={isSelected}
                        className="pointer-events-none data-[state=checked]:bg-white border-blue-100 data-[state=checked]:border-blue-500 data-[state=checked]:text-blue-500"
                      />
                    </div>
                  )}
                </div>
              );
            })}

          {!isSearching && filteredMenuItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-2 px-2">
              {searchValue.trim() ? (
                /* Search returned no results */
                <p className="text-sm font-medium text-gray-700">
                  {t('fieldList.noResultsTitle', { term: searchValue.trim() })}
                </p>
              ) : (
                /* No groups configured at all */
                <div className="flex flex-col items-center gap-2">
                  <ClipboardList className="w-8 h-8 text-gray-400 stroke-1" />
                  <p className="text-sm text-gray-500">{t('form.noFields')}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

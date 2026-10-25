'use client';

import { Search, Plus } from 'lucide-react';
import { Card, CardContent, Label, Button, SearchInput } from '@/components/common';
import { useTranslations } from 'next-intl';
import { UserFiltersProps } from '@/types/user-management';

import { useActivePagePermissions } from '@/hooks/useActivePagePermissions';

export function UserFilters({ searchTerm, onSearchChange, onAddClick }: UserFiltersProps) {
  const t = useTranslations('userManagement');
  const { haveFullAccess } = useActivePagePermissions();
  const showAdd = haveFullAccess;

  return (
    <Card className="shadow-md bg-linear-to-r from-card via-card to-indigo-50/30 ">
      <CardContent className="p-0">
        <div className="grid grid-cols-12 gap-2 items-end">
          {/* Search */}
          <div
            className={showAdd ? 'col-span-12 md:col-span-9 space-y-1' : 'col-span-12 space-y-1'}
          >
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <Search className="w-3 h-3 text-indigo-600" />
              {t('filters.search')}
            </Label>
            <SearchInput
              placeholder={t('filters.searchPlaceholder')}
              value={searchTerm}
              onChange={(val) => onSearchChange(val)}
              className="mb-0 focus:ring-2 focus:ring-indigo-500/20 h-8 text-sm [&_input]:text-black [&_input]:opacity-100"
            />
          </div>

          {/* Add User Button */}
          {showAdd && (
            <div className="col-span-12 md:col-span-3 space-y-1 flex md:justify-end">
              <Button
                onClick={onAddClick}
                className="w-full md:w-auto transition-all text-white h-8 px-4 text-sm"
                actionType="add"
                icon={Plus}
              >
                {t('actions.add')}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

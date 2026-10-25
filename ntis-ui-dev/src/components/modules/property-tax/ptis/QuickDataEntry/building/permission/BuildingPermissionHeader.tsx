import React from 'react';
import { Building2, Home, Store } from 'lucide-react';
import { Button } from '@/components/common';
import { cn } from '@/lib/utils/cn';
import type { ApplicationLevel } from '@/types/building-permission.types';

interface BuildingPermissionHeaderProps {
  showLevelSelector: boolean;
  showApartmentTab: boolean;
  showWingTab: boolean;
  level: ApplicationLevel;
  onSelectLevel: (lvl: ApplicationLevel) => void;
  isLoading?: boolean;
  t: (key: string) => string;
}

export function BuildingPermissionHeader({
  showLevelSelector,
  showApartmentTab,
  showWingTab,
  level,
  onSelectLevel,
  isLoading = false,
  t,
}: BuildingPermissionHeaderProps): React.ReactElement {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2 gap-2 flex-shrink-0">
      <h2 className="text-base font-bold text-blue-900">
        {t('building.title') || 'Building Permissions & Documents'}
      </h2>

      {showLevelSelector && (
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 h-10 flex-shrink-0 shadow-xs">
          {showApartmentTab && (
            <Button
              size="xs"
              variant={level === 'Apartment' ? 'primary' : 'ghost'}
              icon={Building2}
              isLoading={Boolean(isLoading && level === 'Apartment')}
              disabled={isLoading}
              onClick={() => onSelectLevel('Apartment')}
              className={cn(
                'font-bold cursor-pointer rounded-lg transition-all duration-200 h-8',
                level === 'Apartment'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-blue-900 hover:bg-slate-200/50'
              )}
            >
              {t('building.apartmentLevel') || 'Apartment Level'}
            </Button>
          )}

          {showWingTab && (
            <Button
              size="xs"
              variant={level === 'Wing' ? 'primary' : 'ghost'}
              icon={Home}
              isLoading={Boolean(isLoading && level === 'Wing')}
              disabled={isLoading}
              onClick={() => onSelectLevel('Wing')}
              className={cn(
                'font-bold cursor-pointer rounded-lg transition-all duration-200 h-8',
                level === 'Wing'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-blue-900 hover:bg-slate-200/50'
              )}
            >
              {t('building.wingLevel') || 'Wing Level'}
            </Button>
          )}

          <Button
            size="xs"
            variant={level === 'Unit' ? 'primary' : 'ghost'}
            icon={Store}
            isLoading={Boolean(isLoading && level === 'Unit')}
            disabled={isLoading}
            onClick={() => onSelectLevel('Unit')}
            className={cn(
              'font-bold cursor-pointer rounded-lg transition-all duration-200 h-8',
              level === 'Unit'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-blue-900 hover:bg-slate-200/50'
            )}
          >
            {t('building.unitLevel') || 'Unit Level'}
          </Button>
        </div>
      )}
    </div>
  );
}

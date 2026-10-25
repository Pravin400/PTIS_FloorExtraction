import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button, Label, ValidationMessage } from '@/components/common';
import { cn } from '@/lib/utils/cn';
import type { ApplicationLevel, WingOption } from '@/types/building-permission.types';
import type { FieldErrors } from './building-permission.types';

interface BuildingWingSelectorProps {
  isApartmentIndividual: boolean;
  level: ApplicationLevel;
  activeWings: WingOption[];
  selectedWingDetailId: number | null;
  isLoadingGridRecords: boolean;
  fieldErrors: FieldErrors;
  onSelectWing: (wingDetailId: number) => void;
  t: (key: string) => string;
}

export function BuildingWingSelector({
  isApartmentIndividual,
  level,
  activeWings,
  selectedWingDetailId,
  isLoadingGridRecords,
  fieldErrors,
  onSelectWing,
  t,
}: BuildingWingSelectorProps): React.ReactElement | null {
  if (isApartmentIndividual || level !== 'Wing') {
    return null;
  }

  return (
    <div
      className={cn(
        'space-y-1.5 p-2.5 rounded-lg border transition-all',
        fieldErrors.wing ? 'bg-red-50/20 border-red-300' : 'bg-slate-50/60 border-slate-200'
      )}
    >
      <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">
        {t('building.selectWing') || 'SELECT WING'}
      </Label>
      <div className="flex flex-wrap gap-2">
        {activeWings.length > 0 ? (
          activeWings.map((wing) => {
            const isSelected = selectedWingDetailId === wing.wingDetailId;
            return (
              <Button
                key={wing.wingDetailId}
                size="xs"
                variant={isSelected ? 'success' : 'secondary'}
                onClick={() => onSelectWing(wing.wingDetailId)}
                className={cn(
                  'px-4 font-semibold rounded-lg transition-all cursor-pointer border flex items-center gap-1.5',
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                )}
              >
                {isLoadingGridRecords && isSelected && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                )}
                {wing.wingName}
              </Button>
            );
          })
        ) : (
          <div className="text-xs text-slate-400 italic">
            {t('building.noWingsFound') || 'No wings found'}
          </div>
        )}
      </div>
      <ValidationMessage message={fieldErrors.wing} />
    </div>
  );
}

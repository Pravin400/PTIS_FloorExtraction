import { Loader2, CheckCircle2 } from 'lucide-react';
import type { UnitPoolPanelStatusProps } from '@/types/asset/floor-details.types';

export function UnitPoolPanelStatus({ isSaving, unsavedCount, t }: UnitPoolPanelStatusProps) {
  return (
    <div className="flex items-center gap-2 pt-1 border-t border-slate-100 text-[10px]">
      {isSaving && (
        <>
          <Loader2 className="size-3.5 animate-spin text-blue-500" />
          <span className="text-blue-600 font-bold">{t('floorDetails.savingProgress')}</span>
        </>
      )}
      {!isSaving && unsavedCount > 0 && (
        <span className="text-amber-600 font-semibold">
          {t('floorDetails.willBeSaved', { count: unsavedCount })}
        </span>
      )}
      {!isSaving && unsavedCount === 0 && (
        <>
          <CheckCircle2 className="size-3.5 text-emerald-500" />
          <span className="text-emerald-600 font-bold">{t('floorDetails.allUnitsSaved')}</span>
        </>
      )}
    </div>
  );
}

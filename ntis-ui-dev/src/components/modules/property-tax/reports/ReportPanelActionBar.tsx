'use client';
import { ApplyButton, ClearButton } from '@/components/common';
import type { ReportParamsPanelCopy } from '@/types/report.types';
import { useTranslations } from 'next-intl';

interface ReportPanelActionBarProps {
  isPending: boolean;
  loadingParameters: boolean;
  selectionMode: string;
  fromProperty: string;
  toProperty: string;
  hasViewedProperties: boolean;
  copy: ReportParamsPanelCopy;
  handleResetAll: () => void;
  handleSubmit: () => void;
  setIsPropertyDrawerOpen: (open: boolean) => void;
  setHasViewedProperties: (viewed: boolean) => void;
}

export function ReportPanelActionBar({
  isPending,
  loadingParameters,
  selectionMode,
  fromProperty,
  toProperty,
  hasViewedProperties,
  copy,
  handleResetAll,
  handleSubmit,
  setIsPropertyDrawerOpen,
  setHasViewedProperties,
}: ReportPanelActionBarProps) {
  const t = useTranslations('report.params');

  return (
    <div className="flex flex-wrap gap-2.5 mt-2 pt-3 border-t border-gray-100">
      <ClearButton
        type="button"
        size="md"
        label={copy.buttons.reset}
        onClick={handleResetAll}
        disabled={isPending || loadingParameters}
      />
      <ApplyButton
        type="button"
        size="md"
        label={copy.buttons.generate}
        isLoading={isPending}
        onClick={() => handleSubmit()}
        disabled={isPending || loadingParameters || (selectionMode === 'range' && !hasViewedProperties)}
        className="w-auto min-w-[150px] rounded-xl py-2.5 font-bold tracking-wide shadow-md hover:shadow-lg active:scale-95 transition-all duration-150"
      />
      {selectionMode === 'range' && (
        <ApplyButton
          type="button"
          size="md"
          label={t('showProperties')}
          onClick={() => {
            setIsPropertyDrawerOpen(true);
            setHasViewedProperties(true);
          }}
          disabled={!fromProperty || !toProperty}
          className="w-auto min-w-[150px] rounded-xl py-2.5 font-bold tracking-wide shadow-md hover:shadow-lg active:scale-95 transition-all duration-150"
        />
      )}
    </div>
  );
}

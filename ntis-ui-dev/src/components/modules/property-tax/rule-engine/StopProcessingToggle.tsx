'use client';

import { ToggleSwitch } from '@/components/common';
import { useTranslations } from 'next-intl';

interface StopProcessingToggleProps {
  stopProcessing?: boolean;
  onStopProcessingChange: (checked: boolean) => void;
}

/**
 * Sub-component rendering the rule-level Stop Processing toggle and status badge.
 */
export default function StopProcessingToggle({
  stopProcessing,
  onStopProcessingChange,
}: StopProcessingToggleProps) {
  const t = useTranslations('ruleEngine');

  return (
    <div className="flex items-center gap-3 mt-2.5">
      <div
        className={`inline-flex items-center gap-3.5 px-3 py-1.5 rounded-lg border transition-all duration-200 w-fit ${
          stopProcessing ? 'bg-amber-50/70 border-amber-200/80 shadow-sm' : 'bg-zinc-50 border-zinc-200'
        }`}
      >
        <span className="text-xs font-bold text-zinc-800 select-none">{t('stopProcessing.toggleLabel')}</span>
        <ToggleSwitch checked={stopProcessing || false} onChange={onStopProcessingChange} showPopup={false} />
      </div>
      <span
        className={`text-xs font-bold px-2.5 py-1 rounded border transition-colors ${
          stopProcessing
            ? 'text-amber-800 bg-amber-50 border-amber-200 shadow-sm'
            : 'text-emerald-800 bg-emerald-50 border-emerald-200 shadow-sm'
        }`}
      >
        {stopProcessing ? t('stopProcessing.activeNotice') : t('stopProcessing.inactiveNotice')}
      </span>
    </div>
  );
}

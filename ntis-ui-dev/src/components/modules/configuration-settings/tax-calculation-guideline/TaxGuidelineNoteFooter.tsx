'use client';

import { useTranslations } from 'next-intl';
import { Info } from 'lucide-react';

/**
 * Note footer displayed at the bottom of the Tax Calculation Guideline form.
 * Matches the blue informational callout shown in the design.
 */
export function TaxGuidelineNoteFooter() {
  const t = useTranslations('taxCalculationGuideline');

  return (
    <div className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-800">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
      <div className="flex flex-col gap-1">
        <span className="font-semibold">{t('notes.note')}</span>
        <ul className="list-disc pl-4 text-xs leading-relaxed text-blue-700">
          <li>{t('notes.bullet1')}</li>
          <li>{t('notes.bullet2')}</li>
        </ul>
      </div>
    </div>
  );
}

import { memo } from 'react';
import { Settings } from 'lucide-react';
import type { TaxCalculationGuidelineDto } from '@/types/tax-calculation-guideline.types';
import type { PolicyConfiguration } from '@/types/policy-configuration.types';
import { DynamicGuidelineField } from '../TaxFormField';
import { isToggleGuideline } from '@/lib/api/configuration-settings/tax-calculation-guideline/tax-calculation-guideline.rules';
import { SECTION_LAYOUT_GRID_COLS } from '@/lib/utils/guideline-layout.utils';

type TranslationFn = ((key: string, params?: Record<string, string | number>) => string) & { has: (key: string) => boolean };

interface GuidelineSectionCardProps {
  groupKey: string;
  titleKey: string;
  guidelines: TaxCalculationGuidelineDto[];
  onChange: (code: string, value: string | null) => void;
  isFieldDisabled: (code: string) => boolean;
  t: TranslationFn;
  policyConfigs?: PolicyConfiguration[];
  colSpanToggle?: boolean;
}

export const GuidelineSectionCard = memo(function GuidelineSectionCard({
  groupKey,
  titleKey,
  guidelines,
  onChange,
  isFieldDisabled,
  t,
  policyConfigs,
  colSpanToggle = false,
}: GuidelineSectionCardProps) {
  if (!guidelines || guidelines.length === 0) return null;

  const cols = SECTION_LAYOUT_GRID_COLS[groupKey] ?? 2;
  const colClass =
    cols === 4
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
      : cols === 3
        ? 'grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3'
        : 'grid-cols-1 sm:grid-cols-2';

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-gradient-to-r from-[#4F73A8] to-[#5D7FB3] px-4 py-2.5 flex items-center gap-2 rounded-t-xl">
        <span className="text-white opacity-90">
          <Settings className="w-4 h-4" />
        </span>
        <h2 className="text-sm font-bold text-white tracking-wide">
          {t.has(titleKey) ? t(titleKey) : groupKey}
        </h2>
      </div>

      <div className={`grid ${colClass} gap-x-4 gap-y-4 px-4 py-4`}>
        {guidelines.map((guideline) => {
          const spanFull =
            colSpanToggle &&
            isToggleGuideline(guideline.dataType);

          return (
            <div
              key={guideline.guidelineCode}
              className={`flex flex-col${spanFull ? ' col-span-full' : ''}`}
            >
              <DynamicGuidelineField
                guideline={guideline}
                value={guideline.guidelineValue}
                onChange={(val) => onChange(guideline.guidelineCode!, val)}
                disabled={isFieldDisabled(guideline.guidelineCode!)}
                t={t}
                policyConfigs={policyConfigs}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});

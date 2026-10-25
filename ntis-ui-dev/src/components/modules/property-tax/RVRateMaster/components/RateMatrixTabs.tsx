"use client";

import { Tabs } from "@/components/common/Tabs";
import type { ISelectOption } from "@/types/RVRateMaster";

interface RateMatrixTabsProps {
  activeMultipliers: [string, number][];
  activePreviewTab: string;
  setActivePreviewTab: (val: string) => void;
  selectedUseGroup: string;
  useGroupOptions: ISelectOption[];
  t: ReturnType<typeof import("next-intl").useTranslations>;
}

export function RateMatrixTabs({
  activeMultipliers,
  activePreviewTab,
  setActivePreviewTab,
  selectedUseGroup,
  useGroupOptions,
  t,
}: RateMatrixTabsProps) {
  if (activeMultipliers.length === 0) return null;

  return (
    <div className="px-4 pt-2 pb-2 border-b border-blue-100 bg-blue-50/50 flex items-center gap-3 overflow-x-auto hide-scrollbar">
      <span className="text-xs font-bold text-blue-700 uppercase tracking-wider shrink-0">
        {t('sections.previewRates')}
      </span>
      <Tabs
        value={activePreviewTab}
        onChange={(val) => setActivePreviewTab(val as string)}
        variant="pills"
        size="sm"
        className="mb-0"
        tabListClassName="gap-2 bg-transparent p-0 border-none shadow-none flex-nowrap"
        items={[
          {
            value: selectedUseGroup,
            label: `${useGroupOptions.find(o => o.value === selectedUseGroup)?.label || selectedUseGroup} (Base)`,
            content: null,
            className: `!px-4 !py-1 rounded-md text-xs font-semibold transition-all duration-200 shrink-0 ${
              activePreviewTab === selectedUseGroup
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`
          },
          ...activeMultipliers.map(([useGroup, multiplier]) => ({
            value: useGroup,
            label: `${useGroupOptions.find(o => o.value === useGroup)?.label || useGroup} (${multiplier}x)`,
            content: null,
            className: `!px-4 !py-1 rounded-md text-xs font-semibold transition-all duration-200 shrink-0 ${
              activePreviewTab === useGroup
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`
          }))
        ]}
      />
    </div>
  );
}

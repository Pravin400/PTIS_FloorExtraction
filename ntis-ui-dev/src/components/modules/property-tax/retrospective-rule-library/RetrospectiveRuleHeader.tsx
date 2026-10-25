'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { RotateCcw, Plus } from 'lucide-react';
import { Button } from '@/components/common';

interface RetrospectiveRuleHeaderProps {
  selectedCorporation?: string;
  onCorporationChange?: (corp: string) => void;
  onExportJson: () => void;
  onCreateRule?: () => void;
}

export const RetrospectiveRuleHeader: React.FC<RetrospectiveRuleHeaderProps> = ({
  onExportJson,
  onCreateRule,
}) => {
  const t = useTranslations('retrospectiveRuleLibrary');

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {t('title')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
          {t('subtitle')}
        </p>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-3 self-end md:self-auto">
        {/* View History / Export Button */}
        <Button
          type="button"
          variant="secondary"
          icon={RotateCcw}
          onClick={onExportJson}
          className="bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 text-xs font-semibold rounded-xl"
        >
          {t('exportJson')}
        </Button>

        {/* Create Rule Button */}
        {onCreateRule && (
          <Button
            type="button"
            icon={Plus}
            onClick={onCreateRule}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs border-none cursor-pointer whitespace-nowrap shrink-0"
          >
            {t('ruleLibrary.createRule')}
          </Button>
        )}
      </div>
    </div>
  );
};


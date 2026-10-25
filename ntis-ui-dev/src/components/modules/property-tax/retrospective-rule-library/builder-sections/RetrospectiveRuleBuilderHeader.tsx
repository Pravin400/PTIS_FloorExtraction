'use client';

import React, { memo } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Zap } from 'lucide-react';

interface RetrospectiveRuleBuilderHeaderProps {
  onBack: () => void;
}

export const RetrospectiveRuleBuilderHeader: React.FC<RetrospectiveRuleBuilderHeaderProps> = memo(({ onBack }) => {
  const t = useTranslations('retrospectiveRuleLibrary.builder');

  return (
    <div className="bg-white border-b border-gray-200/90 px-6 py-4 sticky top-0 z-30 shadow-2xs">
      <div className="w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            aria-label={t('title')}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-lg bg-pink-50 text-rose-800 flex items-center justify-center border border-pink-100">
            <Zap className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
              {t('title')}
            </h1>
            <p className="text-xs text-gray-500">
              {t('subtitle')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

RetrospectiveRuleBuilderHeader.displayName = 'RetrospectiveRuleBuilderHeader';

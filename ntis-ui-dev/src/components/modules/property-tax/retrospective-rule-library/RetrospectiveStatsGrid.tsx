'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { FileText, CheckSquare, Search, Shield } from 'lucide-react';
import type { RetrospectiveRuleStats } from '@/types/retrospective-rule.types';

interface RetrospectiveStatsGridProps {
  stats: RetrospectiveRuleStats;
}

export const RetrospectiveStatsGrid: React.FC<RetrospectiveStatsGridProps> = ({ stats }) => {
  const t = useTranslations('retrospectiveRuleLibrary.stats');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Card 1: Imported Rules */}
      <div className="bg-white rounded-xl border border-gray-200/80 p-4 flex items-center gap-4 shadow-xs hover:border-gray-300 transition-all">
        <div className="w-12 h-12 rounded-lg bg-pink-50 text-rose-700 flex items-center justify-center shrink-0 border border-pink-100">
          <FileText className="w-6 h-6 stroke-[1.75]" />
        </div>
        <div>
          <div className="text-2xl font-extrabold text-gray-900 leading-none">
            {stats.importedRulesCount}
          </div>
          <div className="text-xs font-medium text-gray-500 mt-1">
            {t('importedRules')}
          </div>
        </div>
      </div>

      {/* Card 2: Ready / active */}
      <div className="bg-white rounded-xl border border-gray-200/80 p-4 flex items-center gap-4 shadow-xs hover:border-gray-300 transition-all">
        <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
          <CheckSquare className="w-6 h-6 stroke-[1.75]" />
        </div>
        <div>
          <div className="text-2xl font-extrabold text-gray-900 leading-none">
            {stats.readyActiveCount}
          </div>
          <div className="text-xs font-medium text-gray-500 mt-1">
            {t('readyActive')}
          </div>
        </div>
      </div>

      {/* Card 3: Need review */}
      <div className="bg-white rounded-xl border border-gray-200/80 p-4 flex items-center gap-4 shadow-xs hover:border-gray-300 transition-all">
        <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
          <Search className="w-6 h-6 stroke-[1.75]" />
        </div>
        <div>
          <div className="text-2xl font-extrabold text-gray-900 leading-none">
            {stats.needReviewCount}
          </div>
          <div className="text-xs font-medium text-gray-500 mt-1">
            {t('needReview')}
          </div>
        </div>
      </div>

      {/* Card 4: Statutory look-back guardrail */}
      <div className="bg-white rounded-xl border border-gray-200/80 p-4 flex items-center gap-4 shadow-xs hover:border-gray-300 transition-all">
        <div className="w-12 h-12 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center shrink-0 border border-rose-100">
          <Shield className="w-6 h-6 stroke-[1.75]" />
        </div>
        <div>
          <div className="text-2xl font-extrabold text-gray-900 leading-none">
            {stats.lookbackGuardrailYears} {t('years')}
          </div>
          <div className="text-xs font-medium text-gray-500 mt-1">
            {t('lookbackGuardrail')}
          </div>
        </div>
      </div>
    </div>
  );
};

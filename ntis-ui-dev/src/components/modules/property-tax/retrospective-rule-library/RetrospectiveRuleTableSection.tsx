'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import type { RetrospectiveRule, RetrospectiveRuleFilterState } from '@/types/retrospective-rule.types';
import { getStatusBadgeStyle } from '@/lib/utils/retrospective-rule.utils';
import { SearchInput, EditButton, Button, Badge } from '@/components/common';

interface RetrospectiveRuleTableSectionProps {
  rules: RetrospectiveRule[];
  filterState: RetrospectiveRuleFilterState;
  onSearchChange: (query: string) => void;
  onStatusFilterChange: (status: string) => void;
  onEvidenceFilterChange: (evidence: string) => void;
  onCreateRule?: () => void;
  onViewRule: (rule: RetrospectiveRule) => void;
  onEditRule: (rule: RetrospectiveRule) => void;
}

export const RetrospectiveRuleTableSection: React.FC<RetrospectiveRuleTableSectionProps> = ({
  rules,
  filterState,
  onSearchChange,
  onStatusFilterChange,
  onEvidenceFilterChange,
  onViewRule,
  onEditRule,
}) => {
  const t = useTranslations('retrospectiveRuleLibrary.ruleLibrary');

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 p-6 space-y-6 shadow-sm">
      {/* Section Header */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 tracking-tight">
          {t('title')}
        </h3>
        <p className="text-xs sm:text-sm text-gray-400 mt-1 font-medium">
          {t('subtitle')}
        </p>
      </div>

      {/* Search Input Bar & Dropdown Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Common Search Input */}
        <div className="w-full sm:max-w-md">
          <SearchInput
            value={filterState.searchQuery}
            onChange={(val) => onSearchChange(val)}
            placeholder={t('searchPlaceholder')}
            className="w-full text-xs font-medium rounded-xl"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Status Filter */}
          <div className="relative w-full sm:w-40">
            <select
              value={filterState.statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 pr-8 text-xs font-medium text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#6B1F38]/20 focus:border-[#6B1F38] cursor-pointer shadow-2xs"
            >
              <option value="All statuses">{t('statuses.all')}</option>
              <option value="Active">{t('statuses.active')}</option>
              <option value="Review">{t('statuses.review')}</option>
              <option value="Draft">{t('statuses.draft')}</option>
              <option value="Inactive">{t('statuses.inactive')}</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Evidence Filter */}
          <div className="relative w-full sm:w-44">
            <select
              value={filterState.evidenceFilter}
              onChange={(e) => onEvidenceFilterChange(e.target.value)}
              className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 pr-8 text-xs font-medium text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#6B1F38]/20 focus:border-[#6B1F38] cursor-pointer shadow-2xs"
            >
              <option value="All evidence">{t('evidenceFilters.all')}</option>
              <option value="Authorized">{t('evidenceFilters.authorized')}</option>
              <option value="Unauthorized">{t('evidenceFilters.unauthorized')}</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Rules Data Table */}
      <div className="overflow-x-auto">
        <div className="border border-gray-200/90 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/90 border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-700">
                <th className="py-3.5 px-5 border-r border-gray-200/90 min-w-[220px]">{t('columns.rule')}</th>
                <th className="py-3.5 px-5 border-r border-gray-200/90 min-w-[280px]">{t('columns.condition')}</th>
                <th className="py-3.5 px-5 border-r border-gray-200/90 min-w-[180px]">{t('columns.startLogic')}</th>
                <th className="py-3.5 px-5 border-r border-gray-200/90 min-w-[220px]">{t('columns.commonTaxation')}</th>
                <th className="py-3.5 px-5 border-r border-gray-200/90 min-w-[200px]">{t('columns.unauthorizedPenalty')}</th>
                <th className="py-3.5 px-5 border-r border-gray-200/90 min-w-[110px]">{t('columns.status')}</th>
                <th className="py-3.5 px-5 text-right min-w-[130px]">{t('columns.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/70 text-xs bg-white">
              {rules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 font-medium">
                    {t('noRules')}
                  </td>
                </tr>
              ) : (
                rules.map((rule) => {
                  const statusStyle = getStatusBadgeStyle(rule.status);
                  return (
                    <tr
                      key={rule.id}
                      className="hover:bg-blue-50/20 transition-colors"
                    >
                      {/* RULE Column */}
                      <td className="py-4 px-5 border-r border-gray-200/70 align-top">
                        <div className="font-bold text-gray-900 text-xs sm:text-sm">
                          {rule.ruleTitle}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5 font-medium tracking-wide">
                          {rule.ruleCode}
                        </div>
                      </td>

                      {/* CONDITION Column */}
                      <td className="py-4 px-5 border-r border-gray-200/70 align-top">
                        <div className="text-gray-600 font-normal leading-relaxed text-xs">
                          {rule.conditionDescription}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-1 font-medium">
                          {rule.evidenceCategory}
                        </div>
                      </td>

                      {/* START LOGIC Column */}
                      <td className="py-4 px-5 border-r border-gray-200/70 align-top">
                        <div className="font-bold text-gray-900 text-xs">
                          {rule.startLogicTitle}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          {rule.startLogicBoundary}
                        </div>
                      </td>

                      {/* COMMON TAXATION Column */}
                      <td className="py-4 px-5 border-r border-gray-200/70 align-top space-y-1.5">
                        <Badge variant="default" size="sm" className="bg-sky-100/70 text-sky-800 border-sky-200/50">
                          {rule.commonTaxationBadge}
                        </Badge>
                        <div className="text-[11px] text-gray-400">
                          {rule.commonTaxationDescription}
                        </div>
                      </td>

                      {/* UNAUTHORIZED PENALTY Column */}
                      <td className="py-4 px-5 border-r border-gray-200/70 align-top text-gray-700 font-normal text-xs">
                        {rule.unauthorizedPenalty}
                      </td>

                      {/* STATUS Column */}
                      <td className="py-4 px-5 border-r border-gray-200/70 align-top">
                        <div className="inline-flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${statusStyle.dotColor}`} />
                          <span className={`${statusStyle.textColor} font-medium text-xs`}>{statusStyle.label}</span>
                        </div>
                      </td>

                      {/* ACTIONS Column */}
                      <td className="py-4 px-5 align-top text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <Button
                            onClick={() => onViewRule(rule)}
                            variant="secondary"
                            size="sm"
                            className="px-3 py-1 bg-white border border-gray-200 hover:border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-2xs"
                          >
                            {t('buttons.view')}
                          </Button>
                          <EditButton
                            onClick={() => onEditRule(rule)}
                            size="sm"
                            className="px-3 py-1 bg-[#6B1F38] hover:bg-[#58182D] text-white rounded-lg text-xs font-semibold shadow-2xs"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

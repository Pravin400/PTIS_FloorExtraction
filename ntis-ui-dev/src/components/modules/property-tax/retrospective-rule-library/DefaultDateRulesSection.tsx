'use client';
/* eslint-disable i18next/no-literal-string */

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
import {
  EditButton,
  DeleteButton,
  FirstPageButton,
  LastPageButton,
  NextPageButton,
  PageNumberButton,
  PrevPageButton,
  useConfirm,
} from '@/components/common';

import { getRetrospectiveRulesAction, deleteRetrospectiveRuleAction } from '@/app/[locale]/property-tax/retrospective-rule-library/action';
import type { RetrospectiveRule } from '@/types/retrospective-rule.types';

export interface DefaultDateRuleItem {
  id: string;
  priority: number;
  ruleCode?: string;
  ruleName: string;
  isDefault?: boolean;
  appliesTo: string;
  condition: string;
  boldPhrase?: string;
  defaultDateLogic: string;
  effectiveFrom: string;
  status: 'Active' | 'Inactive' | 'Review' | 'Draft';
}

interface DefaultDateRulesSectionProps {
  initialRules?: RetrospectiveRule[];
  onEditRule?: (rule: DefaultDateRuleItem) => void;
  onDeleteRule?: (ruleId: string) => void;
}

const mapRetrospectiveRulesToItems = (rawRules: RetrospectiveRule[]): DefaultDateRuleItem[] => {
  return rawRules
    .filter((r) => r.isActive !== false)
    .map((r, index) => {
    const isAuth =
      r.authorizationStatus === 'AUTHORIZED' ||
      r.evidenceCategory?.toLowerCase().includes('authorized');

    const appliesTo =
      r.evidenceCategory ||
      (isAuth ? 'Authorized: OC or CC available' : 'Unauthorized: OC & CC unavailable');

    const status: 'Active' | 'Inactive' | 'Review' | 'Draft' =
      r.status === 'Inactive'
        ? 'Inactive'
        : r.status === 'Review'
          ? 'Review'
          : r.status === 'Draft'
            ? 'Draft'
            : 'Active';

    return {
      id: r.id,
      priority: r.priorityNo ?? (index + 1),
      ruleCode: r.ruleCode,
      ruleName: r.ruleTitle || `Rule #${r.id}`,
      isDefault: index === 0,
      appliesTo,
      condition: r.conditionDescription || '',
      boldPhrase:
        r.conditionDescription && r.conditionDescription.includes('available')
          ? 'available'
          : undefined,
      defaultDateLogic: r.startLogicTitle || '',
      effectiveFrom: r.startLogicBoundary || '',
      status,
    };
  });
};

export const DefaultDateRulesSection: React.FC<DefaultDateRulesSectionProps> = ({
  initialRules,
  onEditRule,
  onDeleteRule,
}) => {
  const t = useTranslations('retrospectiveRuleLibrary.defaultDateRules');
  const tConfirm = useTranslations('retrospectiveRuleLibrary.confirm');
  const { confirm } = useConfirm();
  const [rules, setRules] = useState<DefaultDateRuleItem[]>(() =>
    initialRules && initialRules.length > 0
      ? mapRetrospectiveRulesToItems(initialRules)
      : []
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [appliesToFilter, setAppliesToFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [prevInitialRules, setPrevInitialRules] = useState(initialRules);
  if (initialRules !== prevInitialRules) {
    setPrevInitialRules(initialRules);
    if (initialRules && initialRules.length > 0) {
      setRules(mapRetrospectiveRulesToItems(initialRules));
    }
  }

  React.useEffect(() => {
    let isMounted = true;
    if (initialRules && initialRules.length > 0) {
      return;
    }
    async function loadRules() {
      try {
        const res = await getRetrospectiveRulesAction();
        if (isMounted && res.success && res.data && res.data.length > 0) {
          setRules(mapRetrospectiveRulesToItems(res.data));
        }
      } catch {
        // Silently handle load errors and fallback to empty state
      }
    }
    loadRules();
    return () => {
      isMounted = false;
    };
  }, [initialRules]);

  const handleDelete = (id: string, name?: string) => {
    confirm({
      variant: 'delete',
      title: tConfirm('deleteTitle'),
      description: tConfirm('deleteDescription', { name: name || id }),
      confirmText: tConfirm('deleteConfirm'),
      cancelText: tConfirm('cancel'),
      meta: { id, name },
      onConfirm: async () => {
        try {
          const res = await deleteRetrospectiveRuleAction(id, 'en');
          if (res.success) {
            setRules((prev) => prev.filter((r) => r.id !== id));
            onDeleteRule?.(id);
          }
        } catch {
          // Handled silently
        }
      },
    });
  };

  const filteredRules = rules.filter((rule) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      rule.ruleName.toLowerCase().includes(query) ||
      (rule.ruleCode && rule.ruleCode.toLowerCase().includes(query)) ||
      rule.condition.toLowerCase().includes(query) ||
      rule.defaultDateLogic.toLowerCase().includes(query) ||
      rule.appliesTo.toLowerCase().includes(query);

    const matchesAppliesTo =
      appliesToFilter === 'all' ||
      (appliesToFilter === 'authorized' &&
        (rule.appliesTo.toLowerCase().includes('authorized') ||
          rule.condition.toLowerCase().includes('oc') ||
          rule.condition.toLowerCase().includes('cc') ||
          rule.ruleName.toLowerCase().includes('oc') ||
          rule.ruleName.toLowerCase().includes('cc'))) ||
      (appliesToFilter === 'unauthorized' &&
        (rule.appliesTo.toLowerCase().includes('unauthorized') ||
          rule.condition.toLowerCase().includes('not available') ||
          rule.condition.toLowerCase().includes('unavailable') ||
          rule.condition.toLowerCase().includes('insufficient') ||
          rule.ruleName.toLowerCase().includes('manual')));

    return matchesSearch && matchesAppliesTo;
  });

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleAppliesToFilterChange = (appliesTo: string) => {
    setAppliesToFilter(appliesTo);
    setCurrentPage(1);
  };

  const totalCount = filteredRules.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const paginatedRules = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRules.slice(start, start + pageSize);
  }, [filteredRules, currentPage, pageSize]);

  const renderConditionText = (condition: string, boldPhrase?: string) => {
    if (!boldPhrase || !condition.includes(boldPhrase)) {
      return condition;
    }
    const parts = condition.split(boldPhrase);
    return (
      <>
        {parts[0]}
        <strong className="font-bold text-gray-900">{boldPhrase}</strong>
        {parts[1]}
      </>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden w-full">
      {/* Section Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 tracking-tight">
              {t('title')}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {t('subtitle')}
            </p>
          </div>

          {/* Search Input Field and Filters in Single Flex Row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Search Input Field */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search rule, evidence or result..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs font-medium text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs placeholder:text-slate-400"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
              <select
                value={appliesToFilter}
                onChange={(e) => handleAppliesToFilterChange(e.target.value)}
                className="appearance-none bg-white border border-slate-200 rounded-xl px-3.5 py-2 pr-8 text-xs font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer shadow-2xs"
              >
                <option value="all">All evidence</option>
                <option value="authorized">Authorized: OC or CC available</option>
                <option value="unauthorized">Unauthorized: OC & CC unavailable</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Rules Data Table */}
      <div className="overflow-x-auto p-4">
        <div className="border border-gray-200/90 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-[#E2EEFF] via-[#D6E8FF] to-[#E2EEFF] border-b border-blue-200 text-[11px] font-bold uppercase tracking-wider text-[#1E3A8A]">
                <th className="py-3.5 px-4 border-r border-blue-200/80 w-[70px] text-center">Sr. No.</th>
                <th className="py-3.5 px-4 border-r border-blue-200/80 min-w-[260px]">{t('columns.ruleName')}</th>
                <th className="py-3.5 px-4 border-r border-blue-200/80 min-w-[160px]">{t('columns.appliesTo')}</th>
                <th className="py-3.5 px-4 border-r border-blue-200/80 min-w-[320px]">{t('columns.condition')}</th>
                <th className="py-3.5 px-4 text-center w-[110px]">{t('columns.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/80 text-xs bg-white">
              {paginatedRules.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    {t('noRules')}
                  </td>
                </tr>
              ) : (
                paginatedRules.map((rule, index) => {
                  return (
                    <tr
                      key={rule.id}
                      className="hover:bg-blue-50/20 transition-colors group"
                    >
                      {/* Sr. No. Column */}
                      <td className="py-3.5 px-4 border-r border-gray-200/70 align-middle text-center font-medium text-gray-600 text-xs">
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>

                      {/* Rule Name Column */}
                      <td className="py-3.5 px-4 border-r border-gray-200/70 align-middle">
                        <span className="font-semibold text-gray-900 text-xs leading-snug">
                          {rule.ruleName}
                        </span>
                      </td>

                      {/* Applies To Column */}
                      <td className="py-3.5 px-4 border-r border-gray-200/70 align-middle">
                        <span className="font-semibold text-gray-700 text-xs">
                          {rule.appliesTo}
                        </span>
                      </td>

                      {/* Condition Column */}
                      <td className="py-3.5 px-4 border-r border-gray-200/70 align-middle">
                        <span className="text-gray-600 font-normal leading-relaxed text-xs">
                          {renderConditionText(rule.condition, rule.boldPhrase)}
                        </span>
                      </td>

                      {/* Actions Column */}
                      <td className="py-3.5 px-4 align-middle text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <EditButton
                            onClick={() => onEditRule?.(rule)}
                            size="xs"
                            className="!w-8 !h-8 !p-0 !bg-sky-50/80 !border-sky-200 !text-sky-600 hover:!bg-sky-100 !shadow-none focus:!outline-none focus:!ring-0 rounded-lg flex items-center justify-center shrink-0"
                          />
                          <DeleteButton
                            onClick={() => handleDelete(rule.id, rule.ruleName)}
                            title="Delete rule"
                            size="xs"
                            className="!w-8 !h-8 !p-0 rounded-lg flex items-center justify-center shrink-0 !bg-rose-50/80 !border-rose-200 !text-rose-600 hover:!bg-rose-100 !shadow-none cursor-pointer"
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

      {/* Table Footer */}
      <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 font-medium bg-gray-50/50">
        <div className="flex items-center gap-3">
          <span>
            Showing {totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
            {Math.min(currentPage * pageSize, totalCount)} of {totalCount} rules
          </span>
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-gray-400 font-normal">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-2xs"
            >
              {[5, 10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <FirstPageButton
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              size="xs"
              className="!px-2 !py-1"
            />
            <PrevPageButton
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              size="xs"
              className="!px-2 !py-1"
            />
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .map((page, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev && page - prev > 1;
                return (
                  <React.Fragment key={page}>
                    {showEllipsis && <span className="px-1 text-gray-400">...</span>}
                    <PageNumberButton
                      page={page}
                      active={currentPage === page}
                      onClick={() => setCurrentPage(page)}
                    />
                  </React.Fragment>
                );
              })}
            <NextPageButton
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              size="xs"
              className="!px-2 !py-1"
            />
            <LastPageButton
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
              size="xs"
              className="!px-2 !py-1"
            />
          </div>
        )}
      </div>
    </div>
  );
};

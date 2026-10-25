'use client';


import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Terminal } from 'lucide-react';
import { RuleItem, RuleScope } from '@/types/rule-engine';
import TableHeader from '@/components/common/TableHeader';
import { Select } from '@/components/common/select';
import RuleEngineTable from './RuleEngineTable';
import RuleExecutionDrawer from './RuleExecutionDrawer';
import RuleViewDrawer from './RuleViewDrawer';
import { useRuleLibrary } from '@/hooks/rule-engine/useRuleLibrary';
import { RuleItemRecord } from '@/hooks/rule-engine/useRuleLibraryColumns';
import RuleLibraryFilter from './RuleLibraryFilter';
import RuleLibraryActions from './RuleLibraryActions';

interface RuleLibraryProps {
  initialRules: RuleItem[];
  scopes: RuleScope[];
  locale: string;
  onDeleteRule: (id: number) => Promise<{ success: boolean; message: string }>;
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  initialSearchTerm?: string;
}

export default function RuleLibrary({
  initialRules,
  scopes,
  locale,
  onDeleteRule,
  pageNumber,
  pageSize,
  totalCount,
  totalPages,
  initialSearchTerm = '',
}: RuleLibraryProps) {
  const router = useRouter();
  const t = useTranslations('ruleEngine');
  const tCommon = useTranslations('common');

  const {
    filterCategory,
    setFilterCategory,
    searchTerm,
    setSearchTerm,
    activeRuleForTest,
    isDrawerOpen,
    setIsDrawerOpen,
    activeRuleForView,
    isViewDrawerOpen,
    setIsViewDrawerOpen,
    loadingRuleId,
    handleOpenTestDrawer,
    handleOpenViewDrawer,
    handleOpenGlobalTestDrawer,
    handleDelete,
    handlePageChange,
    handlePageSizeChange,
    filteredRules,
    categoryFilterOptions,
    columns,
  } = useRuleLibrary({
    initialRules,
    scopes,
    locale,
    onDeleteRule,
    pageSize,
    initialSearchTerm,
    t,
  });

  return (
    <div className="flex flex-col gap-4.5 w-full select-none">
      <TableHeader
        title={t('header.configTitle')}
        subtitle={t('header.configSubtitle')}
        icon="settings"
        actionLabel={t('header.configureNew')}
        onActionClick={() => router.push(`/${locale}/property-tax/rule-engine/new`)}
        rightContent={
          <button
            onClick={handleOpenGlobalTestDrawer}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Terminal className="w-4 h-4 text-slate-600" />
            <span>{t('simulation.dryRunAll')}</span>
          </button>
        }
      />

      <RuleLibraryFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
        categoryFilterOptions={categoryFilterOptions}
        searchPlaceholder={t('library.searchByCodeOrName')}
      />

      <RuleEngineTable<RuleItemRecord>
        columns={columns}
        data={filteredRules as RuleItemRecord[]}
        isPagination={true}
        pageSize={pageSize}
        totalCount={totalCount}
        pageNumber={pageNumber}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        renderActions={(row) => (
          <RuleLibraryActions
            row={row}
            locale={locale}
            loadingRuleId={loadingRuleId}
            handleOpenViewDrawer={handleOpenViewDrawer}
            handleOpenTestDrawer={handleOpenTestDrawer}
            handleDelete={handleDelete}
            router={router}
          />
        )}
        footerLeftContent={
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700">
              {tCommon("table.showingEntries", {
                start: totalCount > 0 ? (pageNumber - 1) * pageSize + 1 : 0,
                end: Math.min(pageNumber * pageSize, totalCount),
                total: totalCount
              })}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{tCommon("table.rowsPerPage")}:</span>
              <Select
                value={String(pageSize)}
                onChange={(e) => handlePageSizeChange(e.target.value)}
                options={[10, 20, 30, 40, 50].map((s) => ({ label: String(s), value: String(s) }))}
                selectSize="sm"
                className="w-20"
                ariaLabel={tCommon("table.rowsPerPage") || "Rows per page"}
              />
            </div>
          </div>
        }
      />
      <RuleExecutionDrawer
        rule={activeRuleForTest}
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
      <RuleViewDrawer
        rule={activeRuleForView}
        open={isViewDrawerOpen}
        onClose={() => setIsViewDrawerOpen(false)}
        scopeName={scopes.find((s) => s.id === activeRuleForView?.ruleScopeId)?.scopeName}
      />
    </div>
  );
}

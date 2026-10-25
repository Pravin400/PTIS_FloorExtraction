'use client';

/**
 * Grievance Category Master Component
 *
 * Client container component that renders the Grievance Category page.
 * Restricts viewing/adding depending on screen access permissions.
 *
 * @module GrievanceCategoryMaster
 */
import type { ReactElement } from 'react';
import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { AlertCircle, Clock, MessageSquare, TrendingUp } from 'lucide-react';
import { PageContainer } from '@/components/common';

import { GrievanceCategoryList } from './GrievanceCategoryList';
import { GrievanceCategoryFilter } from './GrievanceCategoryFilter';
import { StatCard } from './StatCard';
import { AddCategoryButton } from './AddCategoryButton';
import type { GrievanceCategoryMasterViewProps } from '@/types/grievance-category-master/grievance-category-props.types';


function ListLoadingFallback(): ReactElement {
  return (
    <div className="space-y-4">
      <div className="h-10 bg-slate-200 rounded-xl animate-pulse" />
      <div className="border border-slate-200 rounded-2xl overflow-hidden">
        <div className="h-12 bg-slate-100" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 border-t border-slate-200 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

/**
 * GrievanceCategoryMaster Component
 */
export function GrievanceCategoryMaster({
  locale,
  data = [],
  departments = [],
  stats,
  pageSize: initialPageSize = 10,
  page: initialPage = 1,
  totalCount = 0,
  initialSearch = '',
  initialDepartment = 'all',
  initialStatus = 'all',
  children,
  fetchError,
}: GrievanceCategoryMasterViewProps): ReactElement {
  const t = useTranslations('grievanceCategory');
  const tCommon = useTranslations('common');
  const tMaster = (key: string) => t(`master.${key}`);
  const tList = (key: string) => t(`list.${key}`);



  const currentPage = initialPage;
  const currentPageSize = initialPageSize;

  const { total, critical, active, avgSla } = stats;

  const addParams = new URLSearchParams();
  addParams.set('page', String(currentPage));
  addParams.set('pageSize', String(currentPageSize));
  if (initialSearch) addParams.set('search', initialSearch);
  if (initialDepartment && initialDepartment !== 'all') {
    addParams.set('department', String(initialDepartment));
  }
  if (initialStatus !== null && initialStatus !== 'all') {
    addParams.set('status', String(initialStatus));
  }

  addParams.set('drawer', 'add');
  const addPath = `/${locale}/configuration-settings/grievance-category-master?${addParams.toString()}`;



  return (
    <div className="min-h-screen bg-slate-50/50 transition-colors duration-500 light">
      <PageContainer className="px-1 sm:px-3 md:px-4 lg:px-6 py-2 md:py-4 w-full">
        {/* Header Section */}
        <header className="mb-6 md:mb-8 relative overflow-hidden rounded-2xl md:rounded-3xl bg-white border border-slate-200 shadow-sm p-4 sm:p-5 md:p-6">
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:gap-6">
            <div className="flex items-center gap-4 sm:gap-5 md:gap-6">
              <div className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-blue-600 rounded-xl sm:rounded-2xl md:rounded-3xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                  {tMaster('title')}
                </h1>
                <p className="text-slate-500 mt-0.5 text-[10px] sm:text-xs md:text-sm line-clamp-1 opacity-90">
                  {tMaster('description') || ''}
                </p>
              </div>
            </div>

            <AddCategoryButton addPath={addPath} label={tMaster('add')} />
          </div>
        </header>

        {fetchError && (
          <div className="p-4 mb-6 bg-red-50 border-l-4 border-red-500 rounded-r-xl shadow-sm flex items-start gap-3 animate-in fade-in duration-300">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-red-800">
                {tCommon('errors.fetchFailed')}
              </h3>
              <p className="text-xs text-red-700 mt-1 font-mono">{fetchError}</p>
            </div>
          </div>
        )}

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 md:mb-8">
          <StatCard
            label={tMaster('stats.total')}
            value={total}
            icon={MessageSquare}
            color="blue"
          />
          <StatCard
            label={tMaster('stats.critical')}
            value={critical}
            icon={AlertCircle}
            color="rose"
          />
          <StatCard label={tMaster('stats.sla')} value={avgSla} icon={Clock} color="indigo" />
          <StatCard
            label={tMaster('stats.active')}
            value={active}
            icon={TrendingUp}
            color="amber"
          />
        </div>

        {/* Main Content Area */}
        <div className="relative">
          <Suspense fallback={<ListLoadingFallback />}>
            <GrievanceCategoryList
              locale={locale}
              categories={data}
              totalCount={totalCount}
              page={currentPage}
              pageSize={currentPageSize}
              departments={departments}
              searchParams={{
                search: initialSearch,
                department: initialDepartment,
                status: initialStatus,
              }}
              headerTitle={tMaster('tableTitle')}
              headerSubtitle={tMaster('tableSubtitle')}
              emptyText={tList('empty')}
              headerExtra={
                <div className="flex-1 w-full">
                  <GrievanceCategoryFilter
                    locale={locale}
                    initialSearch={initialSearch}
                    initialDepartment={initialDepartment}
                    initialStatus={initialStatus}
                    departments={departments}
                  />
                </div>
              }
            />
          </Suspense>
        </div>

        {children}
      </PageContainer>
      <style dangerouslySetInnerHTML={{ __html: LIGHT_MODE_OVERRIDES }} />
    </div>
  );
}

const LIGHT_MODE_OVERRIDES = `
  .light .dark\\:text-slate-500 { color: #94a3b8 !important; }
  .light .dark\\:text-gray-200 { color: #374151 !important; }
  .light .dark\\:border-slate-700\\/30 { border-color: rgba(226, 232, 240, 0.6) !important; }
  .light .dark\\:bg-slate-800\\/20 { background-color: rgba(248, 250, 252, 0.5) !important; }
  .light .dark\\:bg-blue-900\\/10 { background-color: rgba(239, 246, 255, 0.3) !important; }
  .light .dark\\:bg-slate-800\\/50 { background-color: rgba(241, 245, 249, 0.5) !important; }
  .light .dark\\:border-slate-700 { border-color: rgb(226, 232, 240) !important; }
  .light .dark\\:bg-emerald-900\\/20 { background-color: rgb(240, 253, 244) !important; }
  .light .dark\\:text-emerald-400 { color: rgb(5, 150, 105) !important; }
  .light .dark\\:border-emerald-900\\/30 { border-color: rgb(220, 252, 231) !important; }
  .light .dark\\:bg-slate-700 { background-color: rgb(226, 232, 240) !important; }
  .light .dark\\:text-slate-400 { color: rgb(100, 116, 139) !important; }
  .light .dark\\:border-slate-600 { border-color: rgb(203, 213, 225) !important; }
  .light .dark\\:text-white { color: rgb(15, 23, 42) !important; }
  .light .dark\\:text-slate-300 { color: rgb(51, 65, 85) !important; }
  .light .dark\\:text-slate-400 { color: rgb(100, 116, 139) !important; }
  .light .dark\\:text-slate-500 { color: rgb(148, 163, 184) !important; }
`;

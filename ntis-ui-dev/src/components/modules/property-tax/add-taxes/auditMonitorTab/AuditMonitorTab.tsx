'use client';

import { Calendar } from 'lucide-react';
import { SearchButton, RefreshButton, ViewButton } from '@/components/common/ActionButtons';
import { MasterTable } from '@/components/common/MasterTable';
import { Select } from '@/components/common/select';
import { SearchSelect } from '@/components/common/SearchSelect';
import { getAuditColumns, JobAuditItem } from './AuditMonitorColumns';
import { JobDetailModal } from './JobDetailModal';
import { useAuditMonitor } from '@/hooks/add-taxes/useAuditMonitor';

type JobAuditRow = JobAuditItem & Record<string, unknown>;

interface AuditMonitorTabProps {
  financeYearId?: string;
  refreshKey?: number;
}

export function AuditMonitorTab({ financeYearId, refreshKey }: AuditMonitorTabProps) {
  const {
    t,
    selectedJobCode,
    setSelectedJobCode,
    selectedStatus,
    setSelectedStatus,
    selectedDate,
    setSelectedDate,
    jobOptions,
    stats,
    filteredJobs,
    pageNumber,
    pageSize,
    totalCount,
    totalPages,
    setPageNumber,
    setPageSize,
    isLoading,
    handleApplyFilter,
    handleResetFilters,
    handleViewJobDetails,
    selectedJobDetails,
    setSelectedJobId,
    detailProperties,
    detailTotalCount,
    detailPage,
    detailPageSize,
    isDetailLoading,
    setDetailPage,
    setDetailPageSize,
  } = useAuditMonitor({ financeYearId, refreshKey });

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col 2xl:flex-row gap-2 items-end">

          {/* Stats - Text/Span Version */}
          <div className="flex gap-4 items-end overflow-x-auto pb-1 2xl:pb-0 hide-scrollbar w-full 2xl:w-auto shrink-0">
            <div className="flex flex-col">
              <span className="block mb-1 text-[11px] text-gray-500 font-semibold uppercase tracking-wider">{t('audit.stats.totalJobs')}</span>
              <span className="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-md min-w-[48px] text-center border border-slate-200 h-[36px] flex items-center justify-center">{stats.total}</span>
            </div>

            <div className="flex flex-col">
              <span className="block mb-1 text-[11px] text-gray-500 font-semibold uppercase tracking-wider">{t('audit.stats.completed')}</span>
              <span className="text-sm font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-md min-w-[48px] text-center border border-green-200 h-[36px] flex items-center justify-center">{stats.completed}</span>
            </div>

            <div className="flex flex-col">
              <span className="block mb-1 text-[11px] text-gray-500 font-semibold uppercase tracking-wider">{t('audit.stats.running')}</span>
              <span className="text-sm font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-md min-w-[48px] text-center border border-blue-200 h-[36px] flex items-center justify-center">{stats.running}</span>
            </div>

            <div className="flex flex-col">
              <span className="block mb-1 text-[11px] text-gray-500 font-semibold uppercase tracking-wider">{t('audit.stats.failed')}</span>
              <span className="text-sm font-bold text-red-700 bg-red-50 px-3 py-1.5 rounded-md min-w-[48px] text-center border border-red-200 h-[36px] flex items-center justify-center">{stats.failed}</span>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden 2xl:block w-px self-stretch bg-slate-200 mx-1" />

          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-3 items-end w-full flex-1 min-w-0">
            <div className="flex-1 w-full min-w-0">
              <span className="block mb-1 text-[11px] text-gray-500 font-semibold uppercase tracking-wider">{t('audit.filters.searchJobId')}</span>
              <SearchSelect options={jobOptions} value={selectedJobCode} onChange={(_, val) => setSelectedJobCode(val)} placeholder={t('audit.filters.searchPlaceholder')} />
            </div>

            <div className="w-full lg:w-40">
              <Select
                label={t('audit.filters.status')}
                options={[
                  { value: '', label: t('audit.status.all') },
                  { value: 'Completed', label: t('audit.status.completed') },
                  { value: 'InProgress', label: t('audit.status.inProgress') },
                  { value: 'Pending', label: t('audit.status.pending') },
                  { value: 'Scheduled', label: t('audit.status.scheduled') },
                  { value: 'Failed', label: t('audit.status.failed') },
                ]}
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                selectSize="sm"
              />
            </div>

            <div className="w-full lg:w-44 flex flex-col">
              <span className="mb-1 text-[10px] text-gray-500 font-semibold uppercase tracking-wider flex items-center gap-1">
                <Calendar className="h-3 w-3 text-gray-400" /> {t('audit.filters.date')}
              </span>
              <input
                type="date"
                className="border border-slate-300 rounded-md px-3 py-1 text-sm text-slate-800 bg-white hover:border-slate-400 focus:ring-1 focus:ring-blue-500 min-h-[32px]"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <div className="flex gap-2 w-full lg:w-auto items-end">
              <SearchButton size='sm' label={t('audit.buttons.applyFilter')} onClick={handleApplyFilter} className="flex-1 lg:flex-none" />
              <RefreshButton size='sm' label={t('audit.buttons.resetFilters', { fallback: 'Refresh' })} onClick={handleResetFilters} className="flex-1 lg:flex-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
        <MasterTable<JobAuditRow>
          columns={getAuditColumns(t)}
          data={filteredJobs as JobAuditRow[]}
          pageNumber={pageNumber}
          pageSize={pageSize}
          totalCount={totalCount}
          totalPages={totalPages}
          onPageChange={setPageNumber}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setPageNumber(1);
          }}
          paginationConfig={{ enabled: true, showPageSizeSelector: true }}
          actionLabel={t('audit.columns.action')}
          renderActions={(row: JobAuditRow) => (
            <ViewButton onClick={() => handleViewJobDetails(row)}>{t('audit.buttons.viewDetails')}</ViewButton>
          )}
          loading={isLoading}
          height="lg"
          emptyText={t('audit.emptyState.noData', { fallback: 'No data available' })}
        />
      </div>

      <JobDetailModal
        selectedJobDetails={selectedJobDetails}
        onClose={() => setSelectedJobId(null)}
        detailProperties={detailProperties}
        isDetailLoading={isDetailLoading}
        totalCount={detailTotalCount}
        detailPage={detailPage}
        detailPageSize={detailPageSize}
        onPageChange={(page) => setDetailPage(page)}
        onPageSizeChange={(size) => {
          setDetailPageSize(size);
          setDetailPage(1);
        }}
      />
    </div>
  );
}

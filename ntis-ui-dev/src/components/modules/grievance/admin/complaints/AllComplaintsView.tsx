'use client';

/**
 * All Complaints Admin Orchestrator View
 * Path: src/components/modules/grievance/admin/complaints/AllComplaintsView.tsx
 *
 * Coordinates header banner, filter toolbar, master table, and modal drawer.
 * Line ceiling: <= 300 lines.
 */

import Link from 'next/link';
import { ArrowLeft, RefreshCw, ClipboardList } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/common';
import { useAdminComplaints } from '@/hooks/grievance/admin/useAdminComplaints';
import { ComplaintsFilterBar } from './ComplaintsFilterBar';
import { ComplaintsTable } from './ComplaintsTable';
import { ComplaintDetailModal } from './ComplaintDetailModal';

interface AllComplaintsViewProps {
  className?: string;
}

export function AllComplaintsView({ className = '' }: AllComplaintsViewProps) {
  const t = useTranslations('grievance');
  const locale = useLocale();

  const {
    complaints,
    departments,
    isLoading,
    searchInput,
    setSearchInput,
    departmentId,
    setDepartmentId,
    statusId,
    setStatusId,
    sortOrder,
    setSortOrder,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    page,
    pageSize,
    totalCount,
    totalPages,
    setPage,
    setPageSize,
    resetFilters,
    selectedComplaint,
    isDetailModalOpen,
    openDetailModal,
    closeDetailModal,
    refresh,
  } = useAdminComplaints();

  return (
    <div className={`flex flex-col space-y-4 pb-12 ${className}`}>
      {/* 1. Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-5 shadow-2xs">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Icon, Title & Count */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-600 shrink-0 shadow-2xs">
              <ClipboardList className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-xl font-black text-slate-900 tracking-tight truncate">
                  {t('allComplaintsTitle')}
                </h1>
                <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
                  {t('complaintsCountBadge', { count: totalCount })}
                </span>
              </div>
              <p className="hidden sm:block text-xs sm:text-sm text-slate-500 font-medium mt-0.5 max-w-2xl leading-relaxed truncate">
                {t('allComplaintsSubtitle')}
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/${locale}/grievance`}
              className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-lg sm:rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              title={t('backToMap')}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('backToMap')}</span>
            </Link>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => refresh()}
              disabled={isLoading}
              className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-lg sm:rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs"
              title={t('refresh')}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
              <span className="hidden sm:inline">{t('refresh')}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Filter Toolbar */}
      <ComplaintsFilterBar
        search={searchInput}
        onSearchChange={setSearchInput}
        departmentId={departmentId}
        onDepartmentChange={setDepartmentId}
        departments={departments}
        statusId={statusId}
        onStatusChange={setStatusId}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        fromDate={fromDate}
        onFromDateChange={setFromDate}
        toDate={toDate}
        onToDateChange={setToDate}
        onReset={resetFilters}
        isLoading={isLoading}
      />

      {/* 3. Main Data Table */}
      <ComplaintsTable
        complaints={complaints}
        isLoading={isLoading}
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onViewClick={openDetailModal}
      />

      {/* 4. Quick Details Modal */}
      <ComplaintDetailModal
        isOpen={isDetailModalOpen}
        complaint={selectedComplaint}
        departments={departments}
        onClose={closeDetailModal}
        onSuccess={() => {
          refresh();
          closeDetailModal();
        }}
      />
    </div>
  );
}

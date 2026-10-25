'use client';

import Link from 'next/link';
import { ArrowLeft, Building2, Plus, RefreshCw } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/common';
import { useGrievanceDepartmentMaster } from '@/hooks/grievance/admin';
import { DepartmentStatsSummary } from './DepartmentStatsSummary';
import { DepartmentMasterTable } from './DepartmentMasterTable';
import { DepartmentFormModal } from './DepartmentFormModal';
import { DepartmentDetailDrawer } from './DepartmentDetailDrawer';
import { DepartmentDeleteDialog } from './DepartmentDeleteDialog';

interface DepartmentMasterViewProps {
  className?: string;
}

export function DepartmentMasterView({ className = '' }: DepartmentMasterViewProps) {
  const t = useTranslations('grievance');
  const locale = useLocale();

  const {
    departments,
    stats,
    isLoading,
    isSaving,
    isDeleting,
    search,
    status,
    page,
    pageSize,
    totalCount,
    totalPages,
    selectedDeptForView,
    isViewDrawerOpen,
    selectedDeptForEdit,
    isFormModalOpen,
    selectedDeptForDelete,
    isDeleteDialogOpen,
    setPage,
    setPageSize,
    handleSearchChange,
    handleStatusChange,
    openCreateModal,
    openEditModal,
    openViewDrawer,
    openDeleteDialog,
    closeViewDrawer,
    closeFormModal,
    closeDeleteDialog,
    handleSaveDepartment,
    handleConfirmDelete,
    handleAddGrievanceType,
    handleRemoveGrievanceType,
    refresh,
  } = useGrievanceDepartmentMaster();

  return (
    <div className={`flex flex-col space-y-4 pb-12 ${className}`}>
      {/* 1. Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-5 shadow-2xs">
        <div className="flex items-center justify-between gap-2.5">
          {/* Left: Icon & Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-600 shrink-0 shadow-2xs">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-black text-slate-900 tracking-tight truncate">
                {t('deptMasterTitle')}
              </h1>
              <p className="hidden sm:block text-xs sm:text-sm text-slate-500 font-medium mt-0.5 max-w-2xl leading-relaxed truncate">
                {t('deptMasterSubtitle')}
              </p>
            </div>
          </div>

          {/* Right: Action CTAs in one line */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Link
              href={`/${locale}/grievance`}
              className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-lg sm:rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              title={t('backToDashboard')}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('backToDashboard')}</span>
            </Link>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => refresh()}
              disabled={isLoading}
              className="h-8 sm:h-9 px-2 sm:px-3 rounded-lg sm:rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs"
              title={t('refresh')}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
              <span className="hidden sm:inline">{t('refresh')}</span>
            </Button>

            <Button
              size="sm"
              onClick={openCreateModal}
              className="h-8 sm:h-9 px-2.5 sm:px-3.5 rounded-lg sm:rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="sm:hidden">{t('addShort')}</span>
              <span className="hidden sm:inline">{t('addDepartment')}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Department Key Stats Summary */}
      <DepartmentStatsSummary stats={stats} />

      {/* 3. Main Data Table with Search, Filter & Pagination */}
      <DepartmentMasterTable
        departments={departments}
        isLoading={isLoading}
        search={search}
        status={status}
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onViewClick={openViewDrawer}
        onEditClick={openEditModal}
        onDeleteClick={openDeleteDialog}
      />

      {/* 4. Add / Edit Department Modal Dialog */}
      <DepartmentFormModal
        isOpen={isFormModalOpen}
        department={selectedDeptForEdit}
        isSaving={isSaving}
        onClose={closeFormModal}
        onSubmit={handleSaveDepartment}
      />

      {/* 5. View Department Details Slide-Over Drawer */}
      <DepartmentDetailDrawer
        isOpen={isViewDrawerOpen}
        department={selectedDeptForView}
        onClose={closeViewDrawer}
        onEditClick={(dept) => {
          closeViewDrawer();
          openEditModal(dept);
        }}
        onAddGrievanceType={handleAddGrievanceType}
        onRemoveGrievanceType={handleRemoveGrievanceType}
      />

      {/* 6. Delete Confirmation Dialog */}
      <DepartmentDeleteDialog
        isOpen={isDeleteDialogOpen}
        department={selectedDeptForDelete}
        isLoading={isDeleting}
        onClose={closeDeleteDialog}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

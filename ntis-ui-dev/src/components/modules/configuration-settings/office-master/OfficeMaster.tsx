'use client';

import React, { useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import {
  MasterTable,
  EditButton,
  DeleteButton,
  AddButton,
  useConfirm,
  PageContainer,
  SearchInput,
  Select,
} from '@/components/common';
import type { Office, OfficeProps } from '@/types/office.types';
import { deleteOfficeAction } from '@/app/[locale]/configuration-settings/office-master/action';
import { getOfficeColumns } from './OfficeColumns';
import { useOfficeSearch } from '@/hooks/useOfficeSearch';
import { useOfficePagination } from '@/hooks/useOfficePagination';
import { getOfficeTypeOptions } from '@/config/office-master.config';
import { OfficeStatsCards } from './OfficeStatsCards';

export function OfficeMaster({
  data,
  pageNumber,
  pageSize,
  totalCount,
  totalPages,
  sortBy,
  sortOrder,
  type,
  status,
  headOfficesCount,
  activeOfficesCount,
  inactiveOfficesCount,
  showStatsError,
  fetchError,
}: OfficeProps): React.ReactElement {
  const router = useRouter();
  const t = useTranslations('office');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const { confirm } = useConfirm();
  const [isPending, startTransition] = useTransition();



  const {
    search,
    currentSearchTerm,
    handleSearchChange,
    selectedType,
    handleTypeChange,
    selectedStatus,
    handleStatusChange,
  } = useOfficeSearch({
    pageSize,
    locale,
    sortBy,
    sortOrder,
    startTransition,
    type,
    status,
  });



  React.useEffect(() => {
    if (showStatsError) {
      toast.error(t('errors.statsLoadFailed') || 'Failed to load office statistics');
    }
  }, [showStatsError, t]);

  const { buildUrl, changePage, handlePageSizeChange, paginationInfo } = useOfficePagination({
    totalCount,
    pageNumber,
    pageSize,
    locale,
    sortBy,
    sortOrder,
    currentSearchTerm,
    startTransition,
    type: selectedType,
    status: selectedStatus,
  });

  const handleEdit = useCallback(
    (row: Office) => {
      router.push(`/${locale}/configuration-settings/office-master/edit/${row.officeId}`);
    },
    [router, locale]
  );

  const handleDelete = useCallback(
    (row: Office) => {
      confirm({
        variant: 'delete',
        title: `${t('list.table.officeCode')}: ${row.officeCode}`,
        description: t('delete.confirmDescription'),
        meta: { name: row.officeName },
        onConfirm: async () => {
          const formData = new FormData();
          formData.append('officeId', String(row.officeId));
          const result = await deleteOfficeAction(formData);
          if (result.success) {
            toast.success(t('success.deleted'));
          } else {
            toast.error(result.message || tCommon('errors.deleteError'));
          }
        },
      });
    },
    [confirm, t, tCommon]
  );

  const onSort = useCallback(
    (key: string) => {
      const newOrder = sortBy === key && sortOrder === 'asc' ? 'desc' : 'asc';
      startTransition(() => {
        router.push(
          buildUrl(1, pageSize, currentSearchTerm, key, newOrder, selectedType, selectedStatus)
        );
      });
    },
    [sortBy, sortOrder, buildUrl, pageSize, currentSearchTerm, selectedType, selectedStatus, router]
  );

  const columns = React.useMemo(
    () => getOfficeColumns(t, tCommon, sortBy, sortOrder, onSort),
    [t, tCommon, sortBy, sortOrder, onSort]
  );



  return (
    <PageContainer
      title={t('list.title')}
      subtitle={t('list.subtitle')}
      actions={
        <AddButton
          label={t('list.buttons.add')}
          onClick={() => router.push(`/${locale}/configuration-settings/office-master/add`)}
        />
      }
    >
      <div className="space-y-6">
        <OfficeStatsCards
          totalCount={totalCount}
          headOfficesCount={headOfficesCount}
          activeOfficesCount={activeOfficesCount}
          inactiveOfficesCount={inactiveOfficesCount}
          t={t}
        />

        {fetchError && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl shadow-sm flex items-start gap-3 animate-in fade-in duration-300">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-red-800">
                {tCommon('errors.fetchFailed')}
              </h3>
              <p className="text-xs text-red-700 mt-1 font-mono">{fetchError}</p>
            </div>
          </div>
        )}

        <MasterTable<Office>
          columns={columns}
          data={data}
          loading={isPending}
          height="lg"
          pageNumber={pageNumber}
          pageSize={pageSize}
          totalCount={totalCount}
          totalPages={totalPages}
          onPageChange={changePage}
          onPageSizeChange={(size) => handlePageSizeChange(String(size))}
          actionLabel={tCommon('table.columns.actions')}
          paginationConfig={{ enabled: true, showPageSizeSelector: false }}
          headerExtra={
            <div className="flex flex-col md:flex-row items-center gap-4 w-full">
              <SearchInput
                onChange={handleSearchChange}
                value={search}
                placeholder={t('list.filters.search')}
                className="md:w-72"
              />
              <div className="flex items-center gap-2 ml-auto">
                <Select
                  value={selectedType}
                  onChange={handleTypeChange}
                  options={[
                    { label: t('list.filters.allTypes'), value: '' },
                    ...getOfficeTypeOptions(t),
                  ]}
                  className="min-w-[180px]"
                  placeholder={t('list.filters.type')}
                />
                <Select
                  value={selectedStatus}
                  onChange={handleStatusChange}
                  options={[
                    { label: t('list.filters.allStatus'), value: '' },
                    { label: tCommon('status.active'), value: 'true' },
                    { label: tCommon('status.inactive'), value: 'false' },
                  ]}
                  className="min-w-[150px]"
                  placeholder={t('list.filters.status')}
                />
              </div>
            </div>
          }
          renderActions={(row) => (
            <>
              <EditButton onClick={() => handleEdit(row)} />
              <DeleteButton onClick={() => handleDelete(row)} />
            </>
          )}
          footerLeftContent={
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">
                {tCommon('table.showing')} {paginationInfo.start} {tCommon('table.to')}{' '}
                {paginationInfo.end} {tCommon('table.of')} {totalCount}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{tCommon('table.rowsPerPage')}:</span>
                <Select
                  value={String(pageSize)}
                  onChange={(e) => handlePageSizeChange(e.target.value)}
                  options={[10, 20, 30, 40, 50].map((s) => ({
                    label: String(s),
                    value: String(s),
                  }))}
                  selectSize="sm"
                  className="w-20"
                />
              </div>
            </div>
          }
          getRowKey={(row) => String(row.officeId)}
        />
      </div>
    </PageContainer>
  );
}

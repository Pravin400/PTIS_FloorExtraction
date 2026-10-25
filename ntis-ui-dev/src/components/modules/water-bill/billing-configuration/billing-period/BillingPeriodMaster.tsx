'use client';

import { PageContainer } from '@/components/common/PageContainer';
import { MasterTable } from '@/components/common/MasterTable';
import { SearchInput } from '@/components/common/SearchInput';
import { AddButton, DeleteButton, EditButton } from '@/components/common/ActionButtons';
import { BillingPeriodForm } from './BillingPeriodForm';
import { useBillingPeriodMaster } from '@/hooks/water-bill/billing-configuration/billing-period-master';
import type {
  BillingPeriodMaster as BillingPeriodMasterType,
  BillingPeriodMasterProps,
} from '@/types/water-bill/billing-configuration/billingPeriodMaster.types';

export type { BillingPeriodMasterProps };

export function BillingPeriodMaster(props: BillingPeriodMasterProps) {
  const {
    drawer = null,
    initialEditingData = null,
    financialYearOptions = [],
    billingFrequencyOptions = [],
  } = props;

  const {
    t,
    tCommon,
    search,
    records,
    columns,
    isPending,
    isSubmitting,
    pageNumber,
    pageSize,
    totalCount,
    totalPages,
    handleSearchChange,
    handleSearchSubmit,
    handlePageChange,
    handlePageSizeChange,
    handleAdd,
    handleEdit,
    handleDelete,
    handleFormClose,
    handleFormSubmit,
  } = useBillingPeriodMaster(props);

  return (
    <PageContainer>
      <div className="space-y-4">
        <MasterTable<BillingPeriodMasterType>
          columns={columns}
          data={records}
          loading={isPending}
          maxBodyHeightClassName="max-h-[600px] overflow-y-auto"
          getRowKey={(row) => String(row.id)}
          pageNumber={pageNumber}
          pageSize={pageSize}
          totalCount={totalCount}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          paginationConfig={{ enabled: true, showPageSizeSelector: true }}
          pageSizeOptions={[10, 20, 30, 50]}
          headerExtra={
            <div className="flex w-full flex-wrap items-center justify-between gap-3">
              <SearchInput
                value={search}
                onChange={handleSearchChange}
                onEnter={handleSearchSubmit}
                placeholder={t('searchPlaceholder')}
                className="mb-0 w-72 text-gray-900"
              />
              <AddButton label={t('addTitle')} onClick={handleAdd} />
            </div>
          }
          renderActions={(row) => (
            <div className="flex items-center gap-1">
              <EditButton
                aria-label={tCommon('table.actions.edit')}
                onClick={() => handleEdit(row)}
              />
              <DeleteButton
                aria-label={tCommon('table.actions.delete')}
                onClick={() => handleDelete(row)}
              />
            </div>
          )}
          actionLabel={tCommon('table.columns.actions')}
        />
      </div>

      <BillingPeriodForm
        open={drawer !== null}
        initialData={initialEditingData}
        financialYearOptions={financialYearOptions}
        billingFrequencyOptions={billingFrequencyOptions}
        existingPeriods={records}
        isSubmitting={isSubmitting}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
      />
    </PageContainer>
  );
}

"use client";

import { PageContainer } from "@/components/common/PageContainer";
import { MasterTable } from "@/components/common/MasterTable";
import { SearchInput } from "@/components/common/SearchInput";
import { AddButton, DeleteButton, EditButton } from "@/components/common/ActionButtons";
import { BillingFrequencyForm } from "./BillingFrequencyForm";
import { useBillingFrequencyMaster } from "@/hooks/water-bill/billing-configuration/billing-frequency-master";
import type {
  BillingFrequencyMaster as BillingFrequencyMasterType,
  BillingFrequencyMasterProps,
} from "@/types/water-bill/billing-configuration/billingFrequencyMaster.types";

export type { BillingFrequencyMasterProps };

export function BillingFrequencyMaster(props: BillingFrequencyMasterProps) {
  const {
    drawer = null,
    initialEditingData = null,
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
  } = useBillingFrequencyMaster(props);

  return (
    <PageContainer>
      <div className="space-y-4">
        <MasterTable<BillingFrequencyMasterType>
          columns={columns}
          data={records}
          loading={isPending}
          maxBodyHeightClassName="h-auto"
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
                placeholder={t("searchPlaceholder")}
                className="mb-0 w-72 text-gray-900"
              />
              <AddButton label={t("addTitle")} onClick={handleAdd} />
            </div>
          }
          renderActions={(row) => (
            <div className="flex items-center gap-1">
              <EditButton
                aria-label={tCommon("table.actions.edit")}
                onClick={() => handleEdit(row)}
              />
              <DeleteButton
                aria-label={tCommon("table.actions.delete")}
                onClick={() => handleDelete(row)}
              />
            </div>
          )}
          actionLabel={tCommon("table.columns.actions")}
        />
      </div>

      <BillingFrequencyForm
        open={drawer !== null}
        initialData={initialEditingData}
        isSubmitting={isSubmitting}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
      />
    </PageContainer>
  );
}

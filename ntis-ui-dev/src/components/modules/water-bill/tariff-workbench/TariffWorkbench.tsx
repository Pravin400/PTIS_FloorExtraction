"use client";

import { PageContainer } from "@/components/common/PageContainer";
import { TariffMasterTable } from "./TariffMasterTable";
import { TariffForm } from "./TariffForm";
import { useTariffWorkbenchMaster } from "@/hooks/water-bill/tariff-workbench";
import type { TariffWorkbenchProps } from "@/types/water-bill/tariff-workbench/tariffWorkbench.types";

export type { TariffWorkbenchProps };

export function TariffWorkbench(props: TariffWorkbenchProps) {
  const {
    drawer = null,
    initialEditingData = null,
    financialYearOptions = [],
    connectionTypeOptions = [],
    connectionCategoryOptions = [],
    tapSizeOptions = [],

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
  } = useTariffWorkbenchMaster(props);

  return (
    <PageContainer>
      <TariffMasterTable
        records={records}
        columns={columns}
            loading={isPending}
            search={search}
            searchPlaceholder={t("searchPlaceholder")}
            addLabel={t("addTitle")}
            actionsLabel={tCommon("table.columns.actions")}
            editAriaLabel={tCommon("table.actions.edit")}
            deleteAriaLabel={tCommon("table.actions.delete")}
            pageNumber={pageNumber}
            pageSize={pageSize}
            totalCount={totalCount}
            totalPages={totalPages}
            onSearchChange={handleSearchChange}
            onSearchSubmit={handleSearchSubmit}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
      <TariffForm
        open={drawer !== null}
        initialData={initialEditingData}
        isSubmitting={isSubmitting}
        financialYearOptions={financialYearOptions}
        connectionTypeOptions={connectionTypeOptions}
        connectionCategoryOptions={connectionCategoryOptions}
        tapSizeOptions={tapSizeOptions}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
      />
    </PageContainer>
  );
}

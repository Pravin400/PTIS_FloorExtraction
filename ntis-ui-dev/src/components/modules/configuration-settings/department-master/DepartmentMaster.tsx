"use client";

import React, { useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { 
  MasterTable, 
  EditButton, 
  DeleteButton, 
  AddButton,
  useConfirm, 
  PageContainer, 
  SearchInput, 
  Select 
} from "@/components/common";
import type { DepartmentMaster as DeptType, DepartmentMasterProps } from "@/types/departmentMaster.types";
import { deleteDepartmentAction } from "@/app/[locale]/configuration-settings/department-master/action";
import { getDepartmentColumns } from "./DepartmentColumns";
import { useDepartmentSearch } from "@/hooks/configuration-settings/department-master/useDepartmentSearch";
import { useDepartmentPagination } from "@/hooks/configuration-settings/department-master/useDepartmentPagination";
import { DepartmentStatsCards } from "./DepartmentStatsCards";


import { AlertCircle } from "lucide-react";


export function DepartmentMaster({
  initialData, 
  initialPageNumber: pageNumber, 
  initialPageSize: pageSize, 
  initialTotalCount: totalCount, 
  initialTotalPages: totalPages, 
  initialSearchTerm,
  allData = [],
  fetchError,
}: DepartmentMasterProps): React.ReactElement {
  const router = useRouter();
  const t = useTranslations("departmentMaster");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { confirm } = useConfirm();
  const [isPending, startTransition] = useTransition();

  const {
    search,
    currentSearchTerm,
    handleSearchChange,
    handleSearchSubmit,
    selectedStatus,
    handleStatusChange,
  } = useDepartmentSearch({
    pageSize,
    startTransition,
    initialSearch: initialSearchTerm,
  });

  const {
    changePage,
    handlePageSizeChange,
  } = useDepartmentPagination({
    totalCount,
    pageNumber,
    pageSize,
    currentSearchTerm,
    startTransition,
    status: selectedStatus
  });

  const handleEdit = useCallback((row: DeptType) => {
    router.push(`/${locale}/configuration-settings/department-master/edit/${row.departmentId}`);
  }, [router, locale]);

  const handleDelete = useCallback((row: DeptType) => {
    confirm({
      variant: "delete",
      title: `${t("list.table.departmentCode")}: ${row.departmentCode}`,
      description: t("delete.confirmDescription"),
      meta: { name: row.departmentName },
      onConfirm: async () => {
        const result = await deleteDepartmentAction(row.departmentId);
        if (result.success) {
          toast.success(t("success.deleted"));
          router.refresh();
        } else {
          toast.error(result.error || tCommon("errors.deleteError"));
        }
      },
    });
  }, [confirm, router, t, tCommon]);

  const columns = getDepartmentColumns(t, tCommon);



  return (
    <PageContainer
      title={t("title")}
      subtitle={t("subtitle")}
      actions={
        <AddButton 
          label={t("form.buttons.add")}
          onClick={() => router.push(`/${locale}/configuration-settings/department-master/add`)} 
        />
      }
    >
      <div className="space-y-6">
        <DepartmentStatsCards allData={allData} totalCount={totalCount} locale={locale} />

        {fetchError && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl shadow-sm flex items-start gap-3 animate-in fade-in duration-300">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-red-800">{tCommon('errors.fetchFailed')}</h3>
              <p className="text-xs text-red-700 mt-1 font-mono">{fetchError}</p>
            </div>
          </div>
        )}

        <MasterTable<DeptType>
          columns={columns}
          data={initialData}
          loading={isPending}
          height="lg"
          pageNumber={pageNumber}
          pageSize={pageSize}
          totalCount={totalCount}
          totalPages={totalPages}
          onPageChange={changePage}
          onPageSizeChange={(size) => handlePageSizeChange(String(size))}
          actionLabel={tCommon("table.columns.actions")}
          paginationConfig={{ enabled: true, showPageSizeSelector: true }}
          headerExtra={
            <div className="flex flex-col md:flex-row items-center gap-4 w-full">
              <SearchInput
                onChange={handleSearchChange}
                onEnter={handleSearchSubmit}
                value={search}
                placeholder={t("list.filters.searchPlaceholder")}
                className="md:w-72"
              />
              <div className="flex items-center gap-2 ml-auto">
                <Select
                  value={selectedStatus}
                  onChange={handleStatusChange}
                  options={[
                    { label: t("list.filters.allStatus"), value: "" },
                    { label: tCommon("status.active"), value: "true" },
                    { label: tCommon("status.inactive"), value: "false" },
                  ]}
                  className="min-w-[150px]"
                  placeholder={t("list.filters.status")}
                />
              </div>
            </div>
          }
          renderActions={(row) => (
            <div className="flex items-center gap-1">
              <EditButton onClick={() => handleEdit(row)} />
              <DeleteButton onClick={() => handleDelete(row)} />
            </div>
          )}
          getRowKey={(row) => String(row.departmentId)}
        />
      </div>
    </PageContainer>
  );
}

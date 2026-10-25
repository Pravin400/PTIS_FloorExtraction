"use client";

import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Activity, Link2 } from "lucide-react";
import { toast } from "sonner";
import { MasterTable } from "@/components/common/MasterTable";
import { Button } from "@/components/common/ActionButton";
import { EditButton, DeleteButton } from "@/components/common/ActionButtons";
import type { GisKpiMaster as GisKpiMasterType, GisKpiMasterProps } from "@/types/gis-master/gis-kpi-master.types";
import { deleteGisKpiAction } from "@/app/[locale]/configuration-settings/gis-master/gis-kpi-master/action";
import TableHeader from "@/components/common/TableHeader";
import { useConfirm } from "@/components/common/ConfirmProvider";
import {
  PageContainer,
  SearchInput,
  Select,
  SearchSelect,
  type SearchSelectOption,
} from "@/components/common";
import { getGisKpiColumns } from "./GisKpiColumns";
import { useGisKpiSearch } from "@/hooks/gis-master/gis-kpi-master/useGisKpiSearch";
import { useGisKpiPagination } from "@/hooks/gis-master/gis-kpi-master/useGisKpiPagination";
import { GisKpiMappingDrawer } from "./GisKpiMappingDrawer";

export function GisKpiMaster({
  data,
  departmentMappings,
  departments,
  selectedDepartmentId,
  pageNumber,
  pageSize,
  totalCount,
  totalPages,
  sortBy,
  sortOrder,
}: GisKpiMasterProps): React.ReactElement {
  const router = useRouter();
  const t = useTranslations("gisKpiMaster");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const { confirm } = useConfirm();
  const [isPending, startTransition] = React.useTransition();

  /* ================= DEPARTMENT FILTER OPTIONS ================= */
  const departmentOptions: SearchSelectOption[] = React.useMemo(() => {
    const options: SearchSelectOption[] = [
      { label: t("list.filters.allDepartments"), value: "all" },
    ];
    const seen = new Set<number>();
    if (departments && departments.length > 0) {
      departments.forEach((d) => {
        if (!seen.has(d.departmentId) && d.isActive !== false) {
          seen.add(d.departmentId);
          options.push({
            label: d.departmentName,
            value: String(d.departmentId),
          });
        }
      });
    }
    if (departmentMappings && departmentMappings.length > 0) {
      departmentMappings.forEach((m) => {
        if (m.isActive === false) return;
        if (!seen.has(m.departmentId) && m.departmentName) {
          const matchingDept = departments?.find((d) => d.departmentId === m.departmentId);
          if (matchingDept && matchingDept.isActive === false) return;
          seen.add(m.departmentId);
          options.push({
            label: m.departmentName,
            value: String(m.departmentId),
          });
        }
      });
    }
    return options;
  }, [departments, departmentMappings, t]);

  /* ================= MAPPING DRAWER ================= */
  const [selectedKpiForMapping, setSelectedKpiForMapping] = React.useState<GisKpiMasterType | null>(null);
  const [isMappingDrawerOpen, setIsMappingDrawerOpen] = React.useState(false);

  const handleOpenManageMapping = useCallback((row: GisKpiMasterType) => {
    setSelectedKpiForMapping(row);
    setIsMappingDrawerOpen(true);
  }, []);

  const handleCloseManageMapping = useCallback(() => {
    setIsMappingDrawerOpen(false);
    setSelectedKpiForMapping(null);
  }, []);

  /* ================= SEARCH ================= */
  const { search, currentSearchTerm, handleSearchChange } = useGisKpiSearch({
    pageSize,
    locale,
    sortBy,
    sortOrder,
    departmentId: selectedDepartmentId,
    startTransition,
  });

  /* ================= PAGINATION ================= */
  const { buildUrl, changePage, handlePageSizeChange, paginationInfo } = useGisKpiPagination({
    pageNumber,
    pageSize,
    totalCount,
    locale,
    currentSearchTerm,
    sortBy,
    sortOrder,
    departmentId: selectedDepartmentId,
    startTransition,
  });

  /* ================= DEPARTMENT FILTER CHANGE ================= */
  const handleDepartmentChange = useCallback(
    (_name: string, value: string) => {
      const deptValue = value === "all" ? "" : value;
      startTransition(() => {
        router.push(buildUrl(1, pageSize, currentSearchTerm, sortBy, sortOrder, deptValue));
      });
    },
    [buildUrl, pageSize, currentSearchTerm, sortBy, sortOrder, router]
  );

  /* ================= SORTING ================= */
  const handleSort = useCallback(
    (columnKey: string) => {
      let newSortOrder = "asc";
      if (sortBy === columnKey) {
        newSortOrder = sortOrder === "asc" ? "desc" : "asc";
      }
      startTransition(() => {
        router.push(buildUrl(1, pageSize, currentSearchTerm, columnKey, newSortOrder, selectedDepartmentId));
      });
    },
    [sortBy, sortOrder, router, buildUrl, pageSize, currentSearchTerm, selectedDepartmentId]
  );

  const columns = getGisKpiColumns(t, tCommon, sortBy, sortOrder, handleSort);

  const handleEdit = useCallback(
    (row: GisKpiMasterType) => {
      startTransition(() => {
        router.push(`/${locale}/configuration-settings/gis-master/gis-kpi-master/edit/${row.id}`);
      });
    },
    [router, locale]
  );

  const handleDelete = useCallback(
    (row: GisKpiMasterType) => {
      confirm({
        variant: "delete",
        title: `${t("list.table.kpiCode")}: ${row.kpiCode}`,
        description: t("delete.confirmDescription"),
        meta: {
          name: row.defaultTitle,
        },
        onConfirm: async () => {
          const fd = new FormData();
          fd.append("id", String(row.id));
          const result = await deleteGisKpiAction(fd);
          if (result.success) {
            toast.success(t("success.deleted", { code: row.kpiCode }));
            startTransition(() => {
              router.refresh();
            });
          } else {
            let errorMessage = tCommon("errors.deleteError");
            if (result.statusCode === 409) {
              errorMessage = t("apiErrors.inUse");
            } else if (result.statusCode === 400) {
              errorMessage = t("apiErrors.validationError");
            } else if (result.statusCode === 404) {
              errorMessage = t("apiErrors.notFound");
            } else if (result.message) {
              errorMessage = result.message;
            }
            toast.error(errorMessage);
          }
        },
      });
    },
    [confirm, router, t, tCommon]
  );

  /* ================= UI ================= */
  const { start, end, total } = paginationInfo;
  return (
    <PageContainer>
      <div className="space-y-4">
        <div className="relative z-30">
          <TableHeader
            className="relative z-30"
            title={t("list.title")}
            subtitle={t("list.subtitle")}
            icon={Activity}
            actionLabel={t("list.buttons.add")}
            onActionClick={() => {
              startTransition(() => {
                router.push(`/${locale}/configuration-settings/gis-master/gis-kpi-master/add`);
              });
            }}
            rightContent={
              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto justify-end">
                <div className="relative z-30 w-full sm:w-56">
                  <SearchSelect
                    id="department-filter"
                    name="departmentFilter"
                    value={selectedDepartmentId || "all"}
                    onChange={handleDepartmentChange}
                    options={departmentOptions}
                    placeholder={t("list.filters.department")}
                    className="w-full text-sm"
                  />
                </div>
                <div className="w-full sm:w-64">
                  <SearchInput
                    value={search}
                    onChange={handleSearchChange}
                    placeholder={t("list.filters.search")}
                    className="mb-0 w-full text-gray-900"
                  />
                </div>
              </div>
            }
          />
        </div>
        <MasterTable<GisKpiMasterType>
          containerClassName="relative z-10"
          columns={columns}
          data={
            selectedDepartmentId && selectedDepartmentId !== "all"
              ? data.filter((row) => row.isActive !== false)
              : data
          }
          loading={isPending}
          height="lg"
          pageNumber={pageNumber}
          pageSize={pageSize}
          totalCount={totalCount}
          totalPages={totalPages}
          onPageChange={changePage}
          renderActions={(row) => (
            <div className="flex items-center gap-1.5 justify-end">
              <Button
                variant="secondary"
                size="xs"
                icon={Link2}
                aria-label={t("list.buttons.manageMapping") || "Manage Mapping"}
                title={t("list.buttons.manageMapping") || "Manage Mapping"}
                className="text-blue-700 bg-blue-50/80 hover:bg-blue-100 border-blue-200 hover:border-blue-300 font-medium whitespace-nowrap shadow-2xs"
                onClick={() => handleOpenManageMapping(row)}
              >
                {t("list.buttons.manageMapping") || "Manage Mapping"}
              </Button>
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
          paginationConfig={{ enabled: true, showPageSizeSelector: false }}
          footerLeftContent={
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">
                {tCommon("table.showing")} {start} {tCommon("table.to")} {end} {tCommon("table.of")} {total} {tCommon("table.entries")}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{tCommon("table.rowsPerPage")}:</span>
                <Select
                  value={String(pageSize)}
                  onChange={(e) => handlePageSizeChange(e.target.value)}
                  options={[10, 20, 30, 40, 50].map((s) => ({
                    label: String(s),
                    value: String(s),
                  }))}
                  selectSize="sm"
                  className="w-20"
                  ariaLabel={tCommon("table.rowsPerPage") || "Rows per page"}
                />
              </div>
            </div>
          }
          getRowKey={(row) => String(row.id)}
        />
      </div>

      <GisKpiMappingDrawer
        open={isMappingDrawerOpen}
        onClose={handleCloseManageMapping}
        kpi={selectedKpiForMapping}
        onMappingChange={() => {
          startTransition(() => {
            router.refresh();
          });
        }}
      />
    </PageContainer>
  );
}
export default GisKpiMaster;

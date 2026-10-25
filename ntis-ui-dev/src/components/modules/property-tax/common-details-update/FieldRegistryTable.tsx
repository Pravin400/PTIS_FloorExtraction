"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
import { useMemo } from "react";
import {
  MasterTable,
  Column,
  Select,
  SearchInput,
  ToggleSwitch,
  Tooltip,
  Badge,
  Label,
  TruncatedText,
  useToast
} from "@/components/common";
import { BulkUpdateMaster } from "@/types/common-details-update/common-details-update.types";

import { useFieldRegistryState } from "@/hooks/commonDetailsUpdate/useFieldRegistryState";

interface FieldRegistryTableProps {
  t: (key: string, values?: any) => string;
  state: ReturnType<typeof useFieldRegistryState>;
}

export const FieldRegistryTable = ({ t, state }: FieldRegistryTableProps) => {
  const toast = useToast();
  const {
    fields, setFields, refreshFieldsList,

    statusFilter, setStatusFilter,
    searchTerm, setSearchTerm,
    pageNumber, setPageNumber,
    pageSize, setPageSize,
  } = state;



  const statusOptions = useMemo(() => [
    { label: t("fieldRegistry.filters.all"), value: "all" },
    { label: t("fieldRegistry.filters.active"), value: "active" },
    { label: t("fieldRegistry.filters.inactive"), value: "inactive" }
  ], [t]);

  const isSameRow = (item: BulkUpdateMaster, target: BulkUpdateMaster) => {
    if (target.updateCode && item.updateCode === target.updateCode) return true;
    if (target.masterId != null && item.masterId != null && item.masterId === target.masterId) return true;
    if (target.id != null && item.id != null && item.id === target.id) return true;
    return false;
  };

  const handleToggleStatus = async (row: BulkUpdateMaster, checked: boolean) => {
    const code = row.updateCode;
    if (!code) return;

    setFields((prev) =>
      prev.map((f: BulkUpdateMaster) =>
        isSameRow(f, row)
          ? { ...f, isActive: checked }
          : f
      )
    );

    const toggleStatusFn = state.toggleFieldStatus;
    if (!toggleStatusFn) {
      toast.error(t("messages.statusUpdateNotAvailable"));
      // Revert state
      setFields((prev) =>
        prev.map((f: BulkUpdateMaster) =>
          isSameRow(f, row)
            ? { ...f, isActive: !checked }
            : f
        )
      );
      return;
    }

    const res = await toggleStatusFn(code, checked);

    if (res.success) {
      toast.success(t(checked ? "messages.statusSetActive" : "messages.statusSetInactive", { name: row.updateName }));
      if (refreshFieldsList) {
        await refreshFieldsList();
      }
    } else {
      setFields((prev) =>
        prev.map((f: BulkUpdateMaster) =>
          isSameRow(f, row)
            ? { ...f, isActive: !checked }
            : f
        )
      );
      toast.error(res.error || t("messages.updateFailed"));
      if (refreshFieldsList) {
        await refreshFieldsList();
      }
    }
  };

  const filteredFields = useMemo(() => {
    return fields
      .filter((f: BulkUpdateMaster) => {
        const fieldNamesStr = f.fieldConfigs
          ? f.fieldConfigs.map((fc) => fc.fieldName).join(" ")
          : (f as unknown as Record<string, unknown>).fieldName as string || "";

        const matchesSearch = !searchTerm.trim() ||
          f.updateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.updateCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          fieldNamesStr.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === "all" ||
          (statusFilter === "active" && f.isActive) ||
          (statusFilter === "inactive" && !f.isActive);

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        // Active groups first
        if (a.isActive !== b.isActive) {
          return a.isActive ? -1 : 1;
        }
        return (a.updateName || "").localeCompare(b.updateName || "");
      });
  }, [fields, searchTerm, statusFilter]);


  const tableColumns = useMemo<Column<any>[]>(() => [
    {
      key: "updateName",
      label: t("fieldRegistry.table.updateName"),
      render: (_, row) => (
        <TruncatedText text={row.updateName} className="text-sm font-semibold text-slate-800 py-1 block truncate" />
      )
    },
    {
      key: "fieldName",
      label: t("fieldRegistry.table.fieldName"),
      render: (_, row) => {
        const configs = row.fieldConfigs;
        const allFieldNames: string[] =
          configs && Array.isArray(configs) && configs.length > 0
            ? configs.map((fc: { displayName: string, fieldName: string }) => fc.displayName || fc.fieldName).filter(Boolean)
            : row.fieldName
              ? String(row.fieldName).split(",").map((s) => s.trim()).filter(Boolean)
              : [];

        if (allFieldNames.length === 0) {
          return <span className="text-sm text-slate-400 py-1 block">-</span>;
        }

        const visibleFields = allFieldNames.slice(0, 2);
        const remainingCount = allFieldNames.length - 2;

        const tooltipContent = (
          <div className="flex flex-wrap gap-1 max-w-xs p-1">
            {allFieldNames.map((name, idx) => (
              <Badge
                key={idx}
                variant="default"
                size="sm"
              >
                {name}
              </Badge>
            ))}
          </div>
        );

        return (
          <div className="flex flex-wrap items-center gap-1.5 py-1">
            {visibleFields.map((name, idx) => (
              <Badge
                key={idx}
                variant="default"
                size="sm"
              >
                {name}
              </Badge>
            ))}
            {remainingCount > 0 && (
              <Tooltip content={tooltipContent} placement="top">
                <Badge
                  variant="outline"
                  size="sm"
                  className="bg-indigo-50 text-indigo-700 border border-indigo-200 cursor-pointer hover:bg-indigo-100 transition-colors"
                >
                  +{remainingCount}
                </Badge>
              </Tooltip>
            )}
          </div>
        );
      }
    },
    {
      key: "actions",
      label: t("fieldRegistry.table.action"),
      align: "center",
      width: "120px",
      render: (_, row) => (
        <div className="flex items-center justify-center">
          <ToggleSwitch
            checked={row.isActive}
            onChange={(checked) => handleToggleStatus(row, checked)}
            showPopup={false}
          />
        </div>
      )
    }
  ], [setFields, t]);

  const displayTotalCount = filteredFields.length;
  const totalPages = Math.max(1, Math.ceil(displayTotalCount / pageSize));

  const pagedData = useMemo(() => {
    const start = (pageNumber - 1) * pageSize;
    return filteredFields.slice(start, start + pageSize).map((f: BulkUpdateMaster) => f as unknown as Record<string, unknown>);
  }, [filteredFields, pageNumber, pageSize]);

  const totalEligible = fields.length;
  const activeFieldsCount = fields.filter((f) => f.isActive).length;

  return (
    <div className="space-y-2">
      {/* MasterTable with pagination */}
      <MasterTable
        headerExtra={
          <div className="w-full">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
              {/* Filters left */}
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <div className="w-full sm:w-36">
                  <Label className="block text-xs font-semibold text-[#1E3A8A] ">{t("fieldRegistry.filters.status")}</Label>
                  <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={statusOptions} className="w-full" />
                </div>
              </div>

              {/* Centered Stats Cards */}
              <div className="flex flex-wrap items-center justify-center gap-2 flex-1 w-full mt-2 lg:mt-5">
                {/* Total Eligible Fields Card */}
                <div className="flex items-center h-9 border border-blue-200 bg-[#F5F8FF] rounded-lg overflow-hidden text-xs shadow-sm hover:shadow transition-shadow">
                  <span className="font-bold text-[#1E3A8A] px-2.5 py-1.5 bg-[#EEF2FF] h-full flex items-center whitespace-nowrap">
                    {t("fieldRegistry.stats.totalEligible")}
                  </span>
                  <div className="w-px h-full bg-blue-200" />
                  <span className="font-bold text-slate-800 px-3 py-1.5 h-full flex items-center min-w-[2.5rem] justify-center">
                    {totalEligible}
                  </span>
                </div>

                {/* Active Fields Card */}
                <div className="flex items-center h-9 border border-green-200 bg-[#F4FBF7] rounded-lg overflow-hidden text-xs shadow-sm hover:shadow transition-shadow">
                  <span className="font-bold text-green-700 px-2.5 py-1.5 bg-[#EAF8F1] h-full flex items-center whitespace-nowrap">
                    {t("fieldRegistry.stats.activeFields")}
                  </span>
                  <div className="w-px h-full bg-green-200" />
                  <span className="font-bold text-slate-800 px-3 py-1.5 h-full flex items-center min-w-[2.5rem] justify-center">
                    {activeFieldsCount}
                  </span>
                </div>
              </div>

              {/* Search right */}
              <div className="w-full lg:w-64 justify-end item-end">
                <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder={t("fieldRegistry.filters.searchPlaceholder")} className="w-full mb-0" />
              </div>
            </div>
          </div>
        }
        columns={tableColumns}
        data={pagedData}
        pageNumber={pageNumber}
        pageSize={pageSize}
        totalCount={displayTotalCount}
        totalPages={totalPages}
        onPageChange={setPageNumber}
        onPageSizeChange={setPageSize}
        paginationConfig={{
          enabled: true,
          showPageSizeSelector: true
        }}
        emptyText={t("fieldRegistry.emptyState.title")}
        loading={state.loading}
        maxBodyHeightClassName="max-h-[330px]"
      />
    </div>
  );
};

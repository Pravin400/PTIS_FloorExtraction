"use client";
import { useMemo } from "react";
import { MasterTable, Select, SearchInput, Badge, TruncatedText } from "@/components/common";
import { Modal } from "@/components/common/Modal";
import { DashboardCard } from "@/components/common/DashboardCard";
import { getJobsAuditColumns, getStatusVariant } from "./JobsAuditConstants";
import { UpdateHistoryItem, CommonDetailsUpdateActions } from "@/types/common-details-update/common-details-update.types";
import { PagedResponse } from "@/types/common.types";
import { useTranslations } from "next-intl";
import { DownloadButton } from "@/components/common/ActionButtons";
import { useJobsAudit } from "@/hooks/commonDetailsUpdate/useJobsAudit";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

interface JobsAuditProps {
  initialData?: PagedResponse<UpdateHistoryItem> | null;
  initialAllData?: PagedResponse<UpdateHistoryItem> | UpdateHistoryItem[] | null;
  initialUpdateHistoryDetail?: PagedResponse<import("@/types/common-details-update/common-details-update.types").UpdateHistoryDetailItem> | null;
  actions?: Partial<CommonDetailsUpdateActions>;
}

export const JobsAudit = ({ initialData, initialAllData, initialUpdateHistoryDetail, actions }: JobsAuditProps) => {
  const t = useTranslations("commonDetailsUpdate");
  const propertyNoLabel = useAliasLabel("Property_No", t("aliasFallback.propertyNo"));

  const auditState = useJobsAudit({
    initialData,
    initialAllData,
    initialUpdateHistoryDetail,
    actions,
    t,
  });

  const {
    auditPage,
    auditPageSize,
    auditUser,
    searchTerm,
    handleSearchChange,
    handleUserChange,
    handlePageChange,
    handlePageSizeChange,
    userOptions,
    totalCount,
    summaryTotalCount,
    completedCount,
    failedCount,
    data,
    selectedRow,
    isModalOpen,
    setIsModalOpen,
    modalPage,
    modalPageSize,
    modalTotalCount,
    modalTotalPages,
    modalSearchTerm,
    setModalSearchTerm,
    isLoadingDetails,
    isLoadingTable,
    isExporting,
    isModalExporting,
    handleExport,
    onModalExportClick,
    modalTableData,
    handleModalPageChange,
    handleModalPageSizeChange,
    updateUrlParams,
    handleViewClick,
  } = auditState;

  const columns = useMemo(() => getJobsAuditColumns(t, handleViewClick), [t, handleViewClick]);

  const modalColumns: import("@/components/common").Column<{ id: string; property: string; field: string; oldValue: string; newValue: string; }>[] = useMemo(() => [
    {
      key: "property",
      label: t("jobsAudit.modal.property") || "Property",
      headerClassName: "whitespace-nowrap",
      render: (_: unknown, row: { property: string }) => <TruncatedText text={row.property} className="text-sm font-medium text-slate-700 block truncate" />
    },
    {
      key: "field",
      label: t("jobsAudit.modal.field"),
      headerClassName: "whitespace-nowrap",
      render: (_: unknown, row: { field: string }) => <TruncatedText text={row.field} className="text-sm font-medium text-slate-700 block truncate" />
    },
    {
      key: "oldValue",
      label: t("jobsAudit.modal.oldValue"),
      headerClassName: "whitespace-nowrap",
      render: (_: unknown, row: { oldValue: string }) => <TruncatedText text={row.oldValue} className="text-sm text-slate-600 block truncate" />
    },
    {
      key: "newValue",
      label: t("jobsAudit.modal.newValue"),
      headerClassName: "whitespace-nowrap",
      render: (_: unknown, row: { newValue: string }) => <TruncatedText text={row.newValue} className="text-sm text-slate-600 block truncate" />
    }
  ], [t]);

  const modalFieldCount = useMemo(() => {
    if (!modalTableData || modalTableData.length === 0) return 0;
    const uniqueFields = new Set(
      modalTableData
        .map((item) => item.field)
        .filter((f) => f && f !== "-" && f !== "Value")
    );
    return uniqueFields.size || (modalTableData.length > 0 ? 1 : 0);
  }, [modalTableData]);

  return (
    <div className="flex flex-col space-y-2 h-full">
      {/* Top Section */}
      <div className="border border-blue-200 rounded-xl bg-white overflow-hidden p-4">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-[#1E3A8A]">{t("jobsAudit.title")}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {t("jobsAudit.description")}
            </p>
          </div>
          <DownloadButton 
            onClick={handleExport}
            isLoading={isExporting}
            label={t("jobsAudit.exportAudit")}
            className="flex items-center gap-2 px-4 py-2 border border-[#0F5FC2] text-[#0F5FC2] font-semibold rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap text-sm disabled:opacity-50"
          />
        </div>
      </div>

      {/* Main Table Section */}
      <div className="rounded-xl overflow-hidden flex flex-col">
        <MasterTable
          columns={columns}
          data={data}
          loading={isLoadingTable || !initialData}
          containerClassName="w-full text-sm"
          tableClassName="min-w-[1200px]"
          maxBodyHeightClassName="h-[360px]"
          pageNumber={auditPage}
          pageSize={auditPageSize}
          totalCount={totalCount}
          totalPages={initialData?.totalPages || 1}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          paginationConfig={{
            enabled: true,
            showPageSizeSelector: true
          }}
          headerExtra={
            <div className="flex flex-col lg:flex-row items-center justify-between gap-3 w-full py-1 min-w-0">
              {/* Filter */}
              <div className="w-full sm:w-40 flex-shrink-0">
                <Select 
                  label={t("jobsAudit.filters.user")}
                  options={userOptions} 
                  value={auditUser} 
                  onChange={(e) => handleUserChange(e.target.value)} 
                  className="w-full"
                />
              </div>

              {/* Status Cards (Center) */}
              <div className="flex flex-wrap items-center justify-center gap-2 flex-1 min-w-0">
                <DashboardCard
                  label={t("jobsAudit.stats.totalActivity")}
                  value={summaryTotalCount}
                  valueColor="text-[#0F5FC2]"
                  className="px-3 py-1 min-w-[120px] flex-1 max-w-[200px]"
                />
                <DashboardCard
                  label={t("jobsAudit.stats.completed")}
                  value={completedCount}
                  valueColor="text-emerald-600"
                  className="px-3 py-1 min-w-[120px] flex-1 max-w-[200px]"
                />
                <DashboardCard
                  label={t("jobsAudit.stats.failed")}
                  value={failedCount}
                  valueColor="text-amber-600"
                  className="px-3 py-1 min-w-[120px] flex-1 max-w-[200px]"
                />
              </div>

              {/* SearchBar */}
              <div className="w-full sm:w-80 lg:w-96 xl:w-[380px] flex-shrink-0 min-w-0">
                <SearchInput
                  placeholder={t("jobsAudit.filters.searchPlaceholder", { propertyNo: propertyNoLabel })}
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full !mb-0"
                />
              </div>
            </div>
          }
        />
      </div>

      <Modal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          updateUrlParams({ activityId: null });
        }}
        title={`${t("jobsAudit.modal.updateDetailsPrefix")}`}
        maxWidth="2xl"
      >
        <div className="flex flex-col gap-2">
          
          {/* Header Details */}
          {selectedRow && (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default" className="bg-[#E5F0FF] text-[#0057FF] border-transparent font-semibold">
                  {t("jobsAudit.modal.updateName")}: {selectedRow.updateName || "-"}
                </Badge>
                <Badge variant="secondary" className="font-semibold">
                  {t("jobsAudit.modal.updatedBy")}: {selectedRow.doneBy || "-"}
                </Badge>
                <Badge variant="secondary" className="font-semibold">
                  {t("jobsAudit.modal.date")}: {selectedRow.createdDate ? (() => {
                    try {
                      const d = new Date(selectedRow.createdDate);
                      if (isNaN(d.getTime())) return selectedRow.createdDate;
                      const dateStr = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
                      const timeStr = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
                      return `${dateStr}, ${timeStr}`;
                    } catch {
                      return selectedRow.createdDate;
                    }
                  })() : "-"}
                </Badge>
                <Badge variant="warning" className="font-semibold">
                  {t("jobsAudit.modal.ipDevice")}: {selectedRow.ipAddress || "-"}
                </Badge>
                {selectedRow.activityType && (
                  <Badge variant="secondary" className="font-semibold bg-slate-100 text-slate-700">
                    {t("jobsAudit.columns.activityType") || "Type"}: {selectedRow.activityType}
                  </Badge>
                )}
                {selectedRow.activityStatus && (
                  <Badge
                    variant={getStatusVariant(selectedRow.activityStatus)}
                    className="font-semibold capitalize"
                  >
                    {selectedRow.activityStatus}
                  </Badge>
                )}
              </div>
              <div className="text-sm bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
                <div className="text-slate-500 font-medium text-xs mb-1">{t("jobsAudit.modal.remarks")}</div>
                <div className="text-slate-800 break-words">{selectedRow.remarks || selectedRow.activityRemark || "-"}</div>
              </div>
            </div>
          )}

          {/* Master Table for Values */}
          <div className="rounded-lg overflow-hidden flex-1">
            <MasterTable
              columns={modalColumns}
              data={modalTableData}
              loading={isLoadingDetails}
              containerClassName="w-full text-sm"
              tableClassName="min-w-full"
              maxBodyHeightClassName="h-[300px]"
              pageNumber={modalPage}
              pageSize={modalPageSize}
              totalCount={modalTotalCount}
              totalPages={modalTotalPages}
              onPageChange={handleModalPageChange}
              onPageSizeChange={handleModalPageSizeChange}
              isPagination={true}
              isPageSize={true}
              pageSizeOptions={[5, 10, 20, 50]}
              paginationConfig={{
                enabled: true,
                showPageSizeSelector: true
              }}
              headerExtra={
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full py-1 min-w-0">
                  {/* Search Bar */}
                  <div className="w-full sm:w-64 flex-shrink-0">
                    <SearchInput
                      placeholder={t("jobsAudit.modal.searchPlaceholder", { propertyNo: propertyNoLabel })}
                      value={modalSearchTerm}
                      onChange={setModalSearchTerm}
                      className="w-full !mb-0"
                    />
                  </div>

                  {/* Status Cards inside Modal Header */}
                  <div className="flex flex-wrap items-center justify-center gap-2 flex-1 min-w-0">
                    <DashboardCard
                      label={t("jobsAudit.modal.totalProperties")}
                      value={modalTotalCount || selectedRow?.records || 0}
                      valueColor="text-[#0F5FC2]"
                      className="px-3 py-1 min-w-[120px] flex-1 max-w-[180px]"
                    />
                    <DashboardCard
                      label={t("jobsAudit.modal.fieldCount")}
                      value={modalFieldCount}
                      valueColor="text-emerald-600"
                      className="px-3 py-1 min-w-[120px] flex-1 max-w-[180px]"
                    />
                  </div>

                  {/* Export Button */}
                  <div className="flex-shrink-0">
                    <DownloadButton
                      onClick={onModalExportClick}
                      isLoading={isModalExporting}
                      label={t("jobsAudit.modal.exportExcel")}
                      className="flex items-center gap-2 px-3 py-1.5 border border-[#0F5FC2] text-[#0F5FC2] font-semibold rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap text-xs disabled:opacity-50"
                    />
                  </div>
                </div>
              }
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

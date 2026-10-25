"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { MasterTable, Column } from "@/components/common/MasterTable";
import { Button } from "@/components/common/ActionButton";
import { logger } from "@/lib/utils/logger";
import type { MasterDataChangeAffectedProperty } from "@/types/addTaxes.types";

type AffectedPropertyRow = MasterDataChangeAffectedProperty & Record<string, unknown>;

export interface MasterDataChangeAffectedPropertiesModalProps {
  open: boolean;
  onClose: () => void;
  financeYearId: string | number;
  pathname: string;
  getMasterDataChangeAffectedPropertiesAction: (
    financeYearId: string | number,
    pageNumber: number,
    pageSize: number
  ) => Promise<{
    items: MasterDataChangeAffectedProperty[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
  } | null>;
  t: (key: string, values?: Record<string, string | number>) => string;
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

export function MasterDataChangeAffectedPropertiesModal({
  open,
  onClose,
  financeYearId,
  pathname,
  getMasterDataChangeAffectedPropertiesAction,
  t,
}: MasterDataChangeAffectedPropertiesModalProps) {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [items, setItems] = useState<MasterDataChangeAffectedProperty[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const fetchPage = useCallback(async (page: number, size: number) => {
    if (!financeYearId) return;
    setIsLoading(true);
    try {
      const result = await getMasterDataChangeAffectedPropertiesAction(financeYearId, page, size);
      if (result) {
        setItems(result.items || []);
        setTotalCount(result.totalCount || 0);
        setTotalPages(result.totalPages || 1);
      } else {
        setItems([]);
        setTotalCount(0);
        setTotalPages(1);
      }
    } catch (err) {
      logger.error("Failed to load master data change affected properties", { error: err as Error });
    } finally {
      setIsLoading(false);
    }
  }, [financeYearId, getMasterDataChangeAffectedPropertiesAction]);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPageNumber(1);
    void fetchPage(1, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, financeYearId]);

  const handlePageChange = (page: number) => {
    setPageNumber(page);
    void fetchPage(page, pageSize);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPageNumber(1);
    void fetchPage(1, size);
  };

  const handleExportCsv = async () => {
    if (isExporting || !financeYearId) return;
    setIsExporting(true);
    const toastId = toast.loading(
      t("masterDataChange.exportingDownloading")
    );
    try {
      const downloadUrl = `${pathname}/master-data-changes-export?financeYearId=${encodeURIComponent(financeYearId)}`;
      const response = await fetch(downloadUrl);

      if (!response.ok) {
        throw new Error(`Export failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("content-disposition");
      let fileName = "master_data_change_affected_properties.csv";
      if (contentDisposition) {
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match && match[1]) {
          fileName = match[1].replace(/['"]/g, "");
        }
      }

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      toast.success(t("masterDataChange.exportCompleted"), { id: toastId });
    } catch (err) {
      logger.error("Failed to export master data change affected properties", { error: err as Error });
      toast.error(t("masterDataChange.exportFailed"), { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const columns: Column<AffectedPropertyRow>[] = [
    { key: "zone", label: t("masterDataChange.columns.zone"), width: "10%" },
    { key: "ward", label: t("masterDataChange.columns.ward"), width: "10%" },
    { key: "propertyNo", label: t("masterDataChange.columns.propertyNo"), width: "10%" },
    { key: "partitionNo", label: t("masterDataChange.columns.partitionNo"), width: "10%" },
    {
      key: "upicId",
      label: t("masterDataChange.columns.upicId"),
      width: "12%",
      render: (val) => (val ? String(val) : "-"),
    },
    { key: "owner", label: t("masterDataChange.columns.owner"), width: "16%" },
    {
      key: "remark",
      label: t("masterDataChange.columns.remark"),
      width: "20%",
      render: (val) => (
        <span className="text-xs text-gray-600 block whitespace-pre-wrap break-words max-w-[220px]">
          {val ? String(val) : "-"}
        </span>
      ),
    },
    {
      key: "flaggedAtUtc",
      label: t("masterDataChange.columns.flaggedAt"),
      width: "12%",
      render: (val) => formatDateTime(val as string | null | undefined),
    },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("masterDataChange.modalTitle")}
      subtitle={t("masterDataChange.modalSubtitle", { count: totalCount })}
      maxWidth="2xl"
    >
      <div className="flex flex-col gap-4">
        <div className="flex justify-end">
          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={handleExportCsv}
            isLoading={isExporting}
          >
            {t("masterDataChange.exportCsv")}
          </Button>
        </div>

        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <MasterTable<AffectedPropertyRow>
            columns={columns}
            data={items as AffectedPropertyRow[]}
            loading={isLoading}
            pageNumber={pageNumber}
            pageSize={pageSize}
            totalCount={totalCount}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            paginationConfig={{
              enabled: true,
              showPageSizeSelector: true,
            }}
            getRowKey={(row) => row.propertyId}
            height="md"
          />
        </div>
      </div>
    </Modal>
  );
}

export default MasterDataChangeAffectedPropertiesModal;

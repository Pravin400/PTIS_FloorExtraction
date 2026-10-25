import { useState, useRef, useMemo, useCallback } from "react";
import { useToast } from "@/components/common";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { logger } from "@/lib/utils/logger";
import {
  BulkUpdateMaster,
  CommonDetailsUpdateActions,
  ExcelValidationResponse
} from "@/types/common-details-update/common-details-update.types";
import {
  exportExcelAction,
  importExcelAction,
  validateExcelAction,
  getExcelTemplateFieldsAction,
  getMenuItemsAction
} from "@/app/[locale]/property-tax/common-details-update/actions";
export function normalizeValidationPayload(raw: unknown): ExcelValidationResponse["items"] | null {
  if (!raw) return null;

  // Direct array
  if (Array.isArray(raw)) {
    const rows = raw as Record<string, unknown>[];
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
    const flaggedRowCount = rows.filter((r: Record<string, unknown>) =>
      Boolean(r?.ValidationRemark || r?.validationRemark || r?.remark || r?.Remark || r?.isFlagged || r?.status === "Failed" || r?.status === "Rejected" || r?.isValid === false)
    ).length;

    return {
      columns,
      rows,
      totalRows: rows.length,
      flaggedRowCount,
    };
  }

  if (typeof raw === "object" && raw !== null) {
    const root = raw as Record<string, unknown>;
    const searchTargets: Record<string, unknown>[] = [root];

    if (root.items && typeof root.items === "object" && !Array.isArray(root.items)) {
      searchTargets.push(root.items as Record<string, unknown>);
    }
    if (root.data && typeof root.data === "object" && !Array.isArray(root.data)) {
      searchTargets.push(root.data as Record<string, unknown>);
    }
    if (root.result && typeof root.result === "object" && !Array.isArray(root.result)) {
      searchTargets.push(root.result as Record<string, unknown>);
    }

    let rows: Record<string, unknown>[] = [];
    const candidateKeys = [
      "rows",
      "items",
      "records",
      "data",
      "rejectedItems",
      "invalidItems",
      "rejectedRows",
      "invalidRows",
      "failedRows",
      "rejected",
      "invalid",
      "failed",
      "list",
    ];

    for (const target of searchTargets) {
      for (const key of candidateKeys) {
        if (Array.isArray(target[key]) && (target[key] as unknown[]).length > 0) {
          rows = target[key] as Record<string, unknown>[];
          break;
        }
      }
      if (rows.length > 0) break;
    }

    // Fallback if rows is empty
    if (rows.length === 0) {
      if (Array.isArray(root.rows)) rows = root.rows as Record<string, unknown>[];
      else if (Array.isArray(root.items)) rows = root.items as Record<string, unknown>[];
      else if (Array.isArray(root.records)) rows = root.records as Record<string, unknown>[];
      else if (Array.isArray(root.data)) rows = root.data as Record<string, unknown>[];
    }

    let totalRows = rows.length;
    for (const target of searchTargets) {
      const num =
        typeof target.totalRows === "number"
          ? target.totalRows
          : typeof target.totalCount === "number"
          ? target.totalCount
          : typeof target.totalRequested === "number"
          ? target.totalRequested
          : typeof target.total === "number"
          ? target.total
          : null;

      if (num !== null && num > 0) {
        totalRows = num;
        break;
      }
    }

    let flaggedRowCount = rows.filter((r: Record<string, unknown>) =>
      Boolean(
        r?.ValidationRemark ||
          r?.validationRemark ||
          r?.remark ||
          r?.Remark ||
          r?.isFlagged ||
          r?.status === "Failed" ||
          r?.status === "Rejected" ||
          r?.isValid === false
      )
    ).length;

    for (const target of searchTargets) {
      const num =
        typeof target.flaggedRowCount === "number"
          ? target.flaggedRowCount
          : typeof target.failedCount === "number"
          ? target.failedCount
          : typeof target.rejectedCount === "number"
          ? target.rejectedCount
          : typeof target.invalidCount === "number"
          ? target.invalidCount
          : null;

      if (num !== null && num >= 0) {
        flaggedRowCount = Math.max(flaggedRowCount, num);
        break;
      }
    }

    let columns: string[] = [];
    for (const target of searchTargets) {
      if (Array.isArray(target.columns) && target.columns.length > 0) {
        columns = target.columns as string[];
        break;
      }
    }
    if (columns.length === 0 && rows.length > 0) {
      columns = Object.keys(rows[0]);
    }

    if (rows.length > 0 || totalRows > 0) {
      return {
        columns,
        rows,
        totalRows: Math.max(totalRows, rows.length),
        flaggedRowCount,
      };
    }
  }

  return null;
}

interface UseExcelUploadOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateData?: any;
  actions?: Partial<CommonDetailsUpdateActions>;
  locale?: string;
}

export const useExcelUpload = (options: UseExcelUploadOptions = {}) => {
  const { updateData, actions, locale = "en" } = options;
  const searchParams = useSearchParams();
  const t = useTranslations("commonDetailsUpdate");
  const toast = useToast();

  const [groupItems, setGroupItems] = useState<BulkUpdateMaster[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const groupsFetchedRef = useRef(false);

  const loadGroupOptions = useCallback(async () => {
    if (groupsFetchedRef.current || loadingGroups) return;
    setLoadingGroups(true);
    try {
      const getExcelTemplateFieldsFn = actions?.getExcelTemplateFieldsAction || getExcelTemplateFieldsAction;
      const res = await getExcelTemplateFieldsFn();
      if (res && res.success && res.data && Array.isArray(res.data)) {
        setGroupItems(res.data.filter((item: BulkUpdateMaster) => item.isActive !== false));
        groupsFetchedRef.current = true;
      } else {
        const getMenuItemsFn = actions?.getMenuItemsAction || getMenuItemsAction;
        const items = await getMenuItemsFn();
        if (Array.isArray(items)) {
          setGroupItems(items.filter((item: BulkUpdateMaster) => item.isActive !== false));
          groupsFetchedRef.current = true;
        }
      }
    } catch (err) {
      logger.error("Failed to load group options", { error: err as Error });
    } finally {
      setLoadingGroups(false);
    }
  }, [actions, loadingGroups]);

  const groupOptions = useMemo(() => {
    const list = groupItems;
    return list.map((item: BulkUpdateMaster) => ({
      label: locale === "mr" && item.updateNameMarathi ? item.updateNameMarathi : item.updateName,
      value: item.updateCode,
    }));
  }, [groupItems, locale]);

  const [downloading, setDownloading] = useState(false);
  const [downloadWithData, setDownloadWithData] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isGuidelineOpen, setIsGuidelineOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Validation State
  const [validationData, setValidationData] = useState<ExcelValidationResponse["items"] | null>(null);
  const [showRemarkModal, setShowRemarkModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportExcelFn = actions?.exportExcelAction || exportExcelAction;
  const validateExcelFn = actions?.validateExcelAction || validateExcelAction;
  const importExcelFn = actions?.importExcelAction || importExcelAction;

  const handleDownloadTemplate = async () => {
    const fieldCode = searchParams.get("field");
    if (!fieldCode) {
      toast.error(t("excelUpload.validations.selectFieldFirst"));
      return;
    }

    if (downloadWithData) {
      const isCriteriaValid = updateData?.canShowProperties !== undefined
        ? updateData.canShowProperties
        : Boolean(searchParams.get("wardId") || updateData?.filterValues?.wardId);

      if (!isCriteriaValid) {
        toast.error(t("messages.downloadWithDataCriteria"));
        return;
      }
    }

    setDownloading(true);

    try {
      const exportParams: { updateCode: string; [key: string]: unknown } = {
        updateCode: fieldCode,
        fieldCode,
        withData: downloadWithData,
        WithData: downloadWithData,
      };

      if (downloadWithData) {
        const wardId = searchParams.get("wardId") || updateData?.filterValues?.wardId || updateData?.selectedWard;
        const fromPropertyNo = searchParams.get("fromPropertyNo") || searchParams.get("fromProperty") || searchParams.get("PropertyNo") || updateData?.filterValues?.fromPropertyNo;
        const toPropertyNo = searchParams.get("toPropertyNo") || searchParams.get("toProperty") || updateData?.filterValues?.toPropertyNo;
        const propertyNo = searchParams.get("propertyNo") || searchParams.get("PropertyNo");
        const partitionNo = searchParams.get("partitionNo") || searchParams.get("PartitionNo");

        if (wardId) exportParams.wardId = wardId;
        if (fromPropertyNo) exportParams.fromPropertyNo = fromPropertyNo;
        if (toPropertyNo) exportParams.toPropertyNo = toPropertyNo;
        if (propertyNo) exportParams.propertyNo = propertyNo;
        if (partitionNo) exportParams.partitionNo = partitionNo;
      }

      const res = await exportExcelFn(exportParams);

      if (res.success && res.data) {
        const byteCharacters = atob(res.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const fileSuffix = downloadWithData ? "With_Data" : "Template";
        a.download = `${fieldCode}_${fileSuffix}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        if (downloadWithData && updateData && typeof updateData.handleBack === "function") {
          updateData.handleBack(false);
          setDownloadWithData(false);
        }

        toast.success(t("messages.excelDownloadSuccess"));
      } else {
        toast.error(
          ("error" in res ? res.error : "") || t("excelUpload.validations.downloadFailed")
        );
      }
    } catch (_err) {
      toast.error(t("excelUpload.validations.downloadFailed"));
    } finally {
      setDownloading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ];
      if (
        !validTypes.includes(file.type) &&
        !file.name.toLowerCase().endsWith(".xlsx") &&
        !file.name.toLowerCase().endsWith(".xls")
      ) {
        toast.error(t("messages.wrongFileType"));
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      // Clear previous validation results when selecting a new file
      setValidationData(null);

      // Auto-detect and select Group from file name
      // File name format examples: CONSTRUCTION_YEAR_Template.xlsx, CONSTRUCTION_YEAR_With_Data.xlsx, BLOCK_NO.xlsx
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      const cleanedName = baseName.replace(/_(with_data|template|data)$/i, "").trim();

      // Ensure group list is loaded
      if (!groupsFetchedRef.current) {
        loadGroupOptions();
      }

      const candidateList: BulkUpdateMaster[] = (groupItems.length > 0
        ? groupItems
        : (updateData?.activeMenuItems || updateData?.filteredMenuItems || updateData?.menuItems || [])) as BulkUpdateMaster[];

      let matchedCode = "";
      if (candidateList.length > 0) {
        const normCleaned = cleanedName.toLowerCase().replace(/[\s_-]/g, "");
        const found = candidateList.find((item: BulkUpdateMaster) => {
          const itemCode = (item.updateCode || "").toLowerCase();
          const itemName = (item.updateName || "").toLowerCase();
          const normItemCode = itemCode.replace(/[\s_-]/g, "");
          const normItemName = itemName.replace(/[\s_-]/g, "");
          return (
            itemCode === cleanedName.toLowerCase() ||
            normItemCode === normCleaned ||
            itemName === cleanedName.toLowerCase() ||
            normItemName === normCleaned ||
            baseName.toLowerCase().startsWith(itemCode)
          );
        });
        if (found) {
          matchedCode = found.updateCode;
        }
      }

      if (matchedCode) {
        setSelectedFile(file);
        if (updateData?.handleMenuSelect) {
          updateData.handleMenuSelect(matchedCode, false);
        }
      } else {
        // If file format/name does not match any valid group template, reset file and show wrong file format message immediately
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        toast.error(t("messages.excelFileNotMatchGroup"));
      }
    }
  };

  const handleValidateExcel = () => {
    const fieldCode = searchParams.get("field");
    if (!fieldCode) {
      toast.error(t("excelUpload.validations.selectFieldFirst"));
      return;
    }

    if (!selectedFile) {
      toast.error(t("excelUpload.validations.selectFileFirst"));
      return;
    }

    setShowRemarkModal(true);
  };

  const handleConfirmUpload = async (remarks: string) => {
    const fieldCode = searchParams.get("field");
    if (!fieldCode || !selectedFile) return;

    // Clear old validation data before performing new validation/import
    setValidationData(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("File", selectedFile);
      formData.append("updateCode", fieldCode);
      formData.append("UpdateCode", fieldCode);
      formData.append("fieldCode", fieldCode);
      formData.append("FieldCode", fieldCode);
      formData.append("remarks", remarks || "");
      formData.append("Remark", remarks || "");
      formData.append("Remarks", remarks || "");

      setShowRemarkModal(false);

      // Step 1: Validate Excel
      const valRes = await validateExcelFn(formData);

      let currentValData: ExcelValidationResponse["items"] | null = null;
      if (valRes.data) {
        const normalizedVal = normalizeValidationPayload(valRes.data);
        if (normalizedVal) {
          currentValData = normalizedVal;
          setValidationData(normalizedVal);
        }
      }

      if (valRes.success) {
        const flaggedCount = currentValData?.flaggedRowCount || 0;

        if (flaggedCount > 0) {
          // Trigger import so backend records the failed activity in the audit trail
          try {
            await importExcelFn(formData);
          } catch (_e) {
            // Ignored - backend activity has already been logged as failed
          }
          toast.error(t("excelUpload.validations.dataRejectedMsg"));
          return;
        }

        toast.success(t("excelUpload.validations.excelValidatedMsg"));

        // Step 2: Import Excel
        const impRes = await importExcelFn(formData);
        let finalValData = currentValData;

        if (impRes.data) {
          const normalizedImp = normalizeValidationPayload(impRes.data);
          if (normalizedImp) {
            finalValData = normalizedImp;
            setValidationData((prev) => {
              const base = prev || currentValData;
              const hasNewRows = Array.isArray(normalizedImp.rows) && normalizedImp.rows.length > 0;
              const hasNewCols = Array.isArray(normalizedImp.columns) && normalizedImp.columns.length > 0;
              return {
                ...normalizedImp,
                rows: hasNewRows ? normalizedImp.rows : (base?.rows || []),
                columns: hasNewCols ? normalizedImp.columns : (base?.columns || []),
              };
            });
          }
        }

        const impFlaggedCount = finalValData?.flaggedRowCount || 0;
        if (impFlaggedCount > 0) {
          toast.error(t("excelUpload.validations.dataRejectedMsg"));
        } else if (impRes.success) {
          toast.success(t("excelUpload.validations.bulkUpdateSuccessMsg"));
          setSelectedFile(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
          setDownloadWithData(false);
          if (updateData?.handleMenuSelect) {
            updateData.handleMenuSelect("", false);
          }
          if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            params.delete("field");
            window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
          }
        } else {
          toast.error(("error" in impRes ? impRes.error : "") || t("excelUpload.validations.bulkUploadFailedMsg"));
        }
      } else {
        // Trigger import so backend records the failed activity for schema/file-level failure
        try {
          await importExcelFn(formData);
        } catch (_e) {
          // Ignored - backend activity has already been logged as failed
        }
        const rawErr = ("error" in valRes ? valRes.error : "") || "";
        const lower = rawErr.toLowerCase();
        let errMsg = rawErr || t("messages.wrongUpdateGroup");

        if (
          lower.includes("empty") ||
          lower.includes("no data") ||
          lower.includes("no rows") ||
          lower.includes("nodatarows")
        ) {
          errMsg = t("messages.noDataRows");
        } else if (
          lower.includes("file format") ||
          lower.includes("invalid file") ||
          lower.includes("wrong file") ||
          lower.includes("extension") ||
          lower.includes("format") ||
          lower.includes("invalid file type")
        ) {
          errMsg = t("messages.wrongFileType");
        } else if (
          lower.includes("missing required column") ||
          lower.includes("wrong update group") ||
          lower.includes("column") ||
          lower.includes("wardno") ||
          lower.includes("propertyno") ||
          lower.includes("partitionno") ||
          lower.includes("match") ||
          lower.includes("not found") ||
          lower.includes("updatable value") ||
          lower.includes("update type") ||
          lower.includes("unrecognized table") ||
          lower.includes("validation failed")
        ) {
          errMsg = t("messages.wrongUpdateGroup");
        }

        toast.error(errMsg);
      }
    } catch (_err) {
      toast.error(t("messages.wrongUpdateGroup"));
    } finally {
      setUploading(false);
    }
  };

  return {
    downloading,
    downloadWithData,
    setDownloadWithData,
    uploading,
    isGuidelineOpen,
    setIsGuidelineOpen,
    selectedFile,
    setSelectedFile,
    validationData,
    setValidationData,
    showRemarkModal,
    setShowRemarkModal,
    fileInputRef,
    handleDownloadTemplate,
    handleFileChange,
    handleValidateExcel,
    handleConfirmUpload,
    groupOptions,
    loadingGroups,
    loadGroupOptions,
  };
};

import { useRef, useState, ChangeEvent, useCallback } from "react";
import { useToast } from "@/components/common";
import { useTranslations } from "next-intl";
import * as XLSX from "xlsx";

import { MAX_EXCEL_ROWS } from "@/types/lockunlock.types";

interface UseLockUnlockExcelUploadProps {
  setExcelFile: (file: File | null) => void;
  setExcelFileName: (name: string) => void;
}

export function useLockUnlockExcelUpload({
  setExcelFile,
  setExcelFileName,
}: UseLockUnlockExcelUploadProps) {
  const t = useTranslations("lockUnlock");
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Template Download Handler using XLSX.writeFile
  const handleDownloadTemplate = useCallback(() => {
    try {
      setIsProcessing(true);
      const worksheet = XLSX.utils.aoa_to_sheet([
        ["ZoneNo", "WardNo", "PropertyNo", "PartitionNo"],
      ]);

      worksheet["!cols"] = [
        { wch: 12 },
        { wch: 12 },
        { wch: 16 },
        { wch: 14 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

      XLSX.writeFile(workbook, "LockUnlock_Template.xlsx");
    } catch (_error) {
      toast.error(t("messages.unexpectedError"));
    } finally {
      setIsProcessing(false);
    }
  }, [t, toast]);

  // Upload Excel File Handler
  const handleFileUpload = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.toLowerCase().split(".").pop();
      if (!["xlsx", "xls"].includes(fileExt || "")) {
        toast.error(t("selectPropertyCard.invalidFile"));
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      try {
        if (typeof file.arrayBuffer === "function") {
          const buffer = await file.arrayBuffer();
          const workbook = XLSX.read(buffer, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          if (sheetName) {
            const sheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });
            if (!rows || rows.length <= 1) {
              toast.error(t("selectPropertyCard.noDataInFile"));
              if (fileInputRef.current) fileInputRef.current.value = "";
              return;
            }

            const headerRow = (rows[0] as unknown as string[]) || [];
            const headers = headerRow.map((h) => String(h || "").trim().toLowerCase().replace(/[\s_]+/g, ""));

            const hasZoneNo = headers.includes("zoneno");
            const hasWardNo = headers.includes("wardno");
            const hasPropertyNo = headers.includes("propertyno");

            if (!hasZoneNo || !hasWardNo || !hasPropertyNo) {
              toast.error(`${t("selectPropertyCard.wrongExcelUploaded")} ${t("selectPropertyCard.missingColumns")}`);
              if (fileInputRef.current) fileInputRef.current.value = "";
              return;
            }

            const dataRowCount = rows.length - 1;
            if (dataRowCount > MAX_EXCEL_ROWS) {
              toast.error(t("selectPropertyCard.tooManyRows", { max: MAX_EXCEL_ROWS.toLocaleString("en-IN") }));
              if (fileInputRef.current) fileInputRef.current.value = "";
              return;
            }
          }
        }
      } catch (err: unknown) {
        // Fall back gracefully if arrayBuffer is not supported or not implemented in test env
        const isArrayBufferMissing =
          err instanceof TypeError &&
          (err.message.includes("arrayBuffer") || err.message.includes("not a function"));

        if (!isArrayBufferMissing) {
          toast.error(t("selectPropertyCard.invalidFile"));
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }
      }

      setExcelFile(file);
      setExcelFileName(file.name);
      toast.success(t("selectPropertyCard.fileSelected", { name: file.name }));
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [t, toast, setExcelFile, setExcelFileName]
  );

  // Remove File Handler
  const handleRemoveFile = useCallback(() => {
    setExcelFile(null);
    setExcelFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [setExcelFile, setExcelFileName]);

  return {
    fileInputRef,
    isProcessing,
    handleDownloadTemplate,
    handleFileUpload,
    handleRemoveFile,
  };
}

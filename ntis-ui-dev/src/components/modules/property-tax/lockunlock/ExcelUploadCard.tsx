"use client";

import { Building, X } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  CardHeader,
  CardTitle,
  CardContent,
  SearchButton,
  ClearButton,
  DownloadButton,
  UploadButton,
  IconOnlyActionButton,
  Input,
} from "@/components/common";
import { useLockUnlockExcelUpload } from "@/hooks/lockunlock/useLockUnlockExcelUpload";

interface ExcelUploadCardProps {
  excelFile: File | null;
  setExcelFile: (file: File | null) => void;
  excelFileName: string;
  setExcelFileName: (name: string) => void;
  handleShow: () => void;
  handleClearAll: () => void;
  isPending: boolean;
}

export function ExcelUploadCard({
  excelFile,
  setExcelFile,
  excelFileName,
  setExcelFileName,
  handleShow,
  handleClearAll,
  isPending,
}: ExcelUploadCardProps) {
  const t = useTranslations("lockUnlock");

  const {
    fileInputRef,
    isProcessing,
    handleDownloadTemplate,
    handleFileUpload,
    handleRemoveFile,
  } = useLockUnlockExcelUpload({
    setExcelFile,
    setExcelFileName,
  });

  return (
    <div className="flex flex-col gap-1">
      <CardHeader className="mb-0 border border-slate-100 rounded-md bg-slate-50/50 py-3.5 px-6 flex flex-row items-center gap-2">
        <Building className="w-4 h-4 text-blue-600" />
        <CardTitle className="text-sm font-bold text-slate-800">
          {t("selectPropertyCard.title")}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Input
          naked
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".xlsx, .xls"
          className="hidden"
          id="excel-file-input"
        />

        <div className="flex flex-row flex-wrap gap-3 items-center">
          <DownloadButton
            size="sm"
            onClick={handleDownloadTemplate}
            disabled={isProcessing || isPending}
            label={t("selectPropertyCard.downloadTemplate")}
          />

          {!excelFile ? (
            <UploadButton
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing || isPending}
              label={t("selectPropertyCard.uploadExcel")}
            />
          ) : (
            <div className="inline-flex items-center justify-between gap-2 px-3 py-1.5 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm font-medium h-9">
              <span className="truncate max-w-[180px] font-medium text-emerald-900" title={excelFileName}>
                {excelFileName}
              </span>
              <IconOnlyActionButton
                icon={X}
                size="sm"
                variant="ghost"
                aria-label={t("selectPropertyCard.removeFile")}
                title={t("selectPropertyCard.removeFile")}
                onClick={handleRemoveFile}
                className="!h-6 !w-6 !p-0 !min-w-0 !min-h-0 rounded-full text-slate-600 hover:text-red-600 hover:bg-red-100 transition-colors shrink-0"
              />
            </div>
          )}

          <SearchButton
            id="showButton"
            label={t("selectPropertyCard.showButton")}
            size="sm"
            onClick={handleShow}
            isLoading={isPending}
            disabled={!excelFile}
          />
          <ClearButton
            size="sm"
            label={t("selectPropertyCard.clearButton")}
            onClick={handleClearAll}
            disabled={isPending}
          />
        </div>
      </CardContent>
    </div>
  );
}

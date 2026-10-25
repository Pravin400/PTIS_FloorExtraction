'use client';

import { Eye, Download, Trash2, Upload, FileText, XCircle, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button, Input, PrevPageButton, NextPageButton } from '@/components/common';
import { useAssetDocumentsPanelState } from "@/hooks/asset/municipal-Asset/new-add-new-asset/ownership";

export function AssetDocumentsPanel() {
  const rawT = useTranslations("newAddNewAsset");
  const t = (key: string, args?: Record<string, unknown>) => rawT(key as never, args as never) || "";
  const {
    setUploadingDefId,
    fileInputRef,
    adHocFileInputRef,
    uploadStates,
    loading,
    error,
    viewingDocId,
    handleView,
    handleDownload,
    handleDelete,
    legalPage,
    setLegalPage,
    totalLegalPages,
    paginatedDefinitions,
    handleFileChange,
    handleAdHocFileChange,
    PAGE_SIZE,
  } = useAssetDocumentsPanelState(t);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-4 p-8 flex items-center justify-center min-h-[200px]">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <span>{t("compliance.loadingRequirements") || "Loading document requirements..."}</span>
        </div>
      </div>
    );
  }

  if (error) {
    const is404 = error.includes('404') || error.toLowerCase().includes('not found');
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-4 p-5">
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-start gap-3">
            <XCircle className="size-5 text-red-500 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">{error}</p>
              {is404 && <p className="text-red-600 text-sm mt-1">{t("compliance.apiError")}</p>}
              <Button variant="ghost" size="sm" onClick={() => window.location.reload()} className="mt-2 text-sm text-red-600 underline hover:no-underline px-0">{t("compliance.retry")}</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-4">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <h2 className="text-[14px] font-black text-[#101b87]">{t("compliance.title") || "Asset Documents"}</h2>
        </div>
        <Input
          type="file"
          ref={adHocFileInputRef}
          onChange={handleAdHocFileChange}
          className="hidden"
        />
        <Input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <div className="flex-1 min-w-0 p-0 flex flex-col h-full justify-between">
        <div>
          {paginatedDefinitions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-slate-50/50 [&>th]:border-r [&>th]:border-slate-200 [&>th:last-child]:border-r-0">
                    <th className="px-4 py-1.5 text-left text-[11px] font-bold text-slate-700 w-12 border-b border-slate-100 whitespace-nowrap">
                      {t("compliance.table.srNo") || "Sr No."}
                    </th>
                    <th className="px-4 py-1.5 text-left text-[11px] font-bold text-slate-700 border-b border-slate-100">
                      {t("compliance.table.docName") || "Document Name"}
                    </th>
                    <th className="px-4 py-1.5 text-left text-[11px] font-bold text-slate-700 border-b border-slate-100">
                      {t("compliance.table.docType") || "Document Type"}
                    </th>
                    <th className="px-4 py-1.5 text-left text-[11px] font-bold text-slate-700 border-b border-slate-100">
                      {t("compliance.table.file") || "File"}
                    </th>
                    <th className="px-4 py-1.5 text-left text-[11px] font-bold text-slate-700 border-b border-slate-100">
                      {t("compliance.table.actions") || "Actions"}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {paginatedDefinitions.map((def, index) => {
                    const state = uploadStates[def.id];
                    const status = state?.status || "pending";
                    const isUploaded = status === "uploaded";
                    const isUploading = status === "uploading";
                    const isViewing = viewingDocId === def.id;

                    return (
                      <tr key={def.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors [&>td]:border-r [&>td]:border-slate-200 [&>td:last-child]:border-r-0">
                        <td className="px-4 py-1.5 font-bold text-slate-700 whitespace-nowrap">
                          {(legalPage - 1) * PAGE_SIZE + index + 1}
                        </td>
                        <td className="px-4 py-1.5 font-bold text-slate-900">
                          {def.documentName}
                          {def.isRequired && <span className="text-red-500 ml-1">*</span>}
                        </td>
                        <td className="px-4 py-1.5 text-slate-500">
                          {def.description || "—"}
                        </td>
                        <td className="px-4 py-1.5 text-slate-500">
                          {isUploaded ? (
                            <span className="text-emerald-600 font-semibold flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5" />
                              {state?.file?.name || ((state?.uploadedDoc as Record<string, unknown> | undefined)?.fileName as string) || t("compliance.uploadedFile") || "Uploaded File"}
                            </span>
                          ) : isUploading ? (
                            <span className="text-blue-600 font-medium flex items-center gap-1.5">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              {t("compliance.uploading") || "Uploading..."}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">
                              {t("compliance.pendingUpload") || "Pending Upload"}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-1.5">
                          {isUploaded ? (
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="primary"
                                size="xs"
                                onClick={() => handleView(def.id, state)}
                                disabled={isViewing}
                                className="w-7 h-7 p-0 justify-center rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-xs"
                                title={t("compliance.view") || "View"}
                              >
                                {isViewing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                              </Button>
                              <Button
                                type="button"
                                variant="primary"
                                size="xs"
                                onClick={() => handleDownload(def.id, state)}
                                className="w-7 h-7 p-0 justify-center rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-xs"
                                title={t("compliance.download") || "Download"}
                              >
                                <Download className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="primary"
                                size="xs"
                                onClick={() => {
                                  setUploadingDefId(def.id);
                                  fileInputRef.current?.click();
                                }}
                                className="w-7 h-7 p-0 justify-center rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-xs"
                                title={t("compliance.replace") || "Replace"}
                              >
                                <Upload className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="danger"
                                size="xs"
                                onClick={() => handleDelete(def.id)}
                                className="w-7 h-7 p-0 justify-center rounded bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer shadow-xs"
                                title={t("compliance.delete") || "Delete"}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              variant="primary"
                              size="xs"
                              onClick={() => {
                                setUploadingDefId(def.id);
                                fileInputRef.current?.click();
                              }}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-bold transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1 h-auto"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              {t("compliance.upload") || "Upload"}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 font-medium text-sm">
              {t("compliance.noRequirements") || "No legal document requirements found."}
            </div>
          )}
        </div>

        {totalLegalPages > 1 && (
          <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              {t("compliance.pageInfo", { page: legalPage, total: totalLegalPages }) || `Page ${legalPage} of ${totalLegalPages}`}
            </span>
            <div className="flex items-center gap-1">
              <PrevPageButton
                onClick={() => setLegalPage((p) => Math.max(1, p - 1))}
                disabled={legalPage === 1}
              />
              <NextPageButton
                onClick={() => setLegalPage((p) => Math.min(totalLegalPages, p + 1))}
                disabled={legalPage === totalLegalPages}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import type { SubUnitDocumentsPanelProps } from "@/types/asset/municipal-Asset/new-add-new-asset";
import { Eye, Download, Trash2, Upload, FileText, XCircle, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LoadingState } from '@/components/common/LoadingState';
import { useSubUnitDocuments, formatBytes } from '@/hooks/asset-hooks/useSubUnitDocuments';



export function SubUnitDocumentsPanel({ formData }: SubUnitDocumentsPanelProps) {
  const t = useTranslations('addAssetForm');
  const {
    uploadStates,
    loading,
    error,
    viewingDocId,
    setUploadingDefId,
    fileInputRef,
    handleFileChange,
    handleView,
    handleDownload,
    handleDelete,
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedDefinitions,
  } = useSubUnitDocuments(formData, t);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-4 flex items-center justify-center min-h-[100px]">
        <LoadingState
          message={t?.has?.('compliance.loadingRequirements') ? t('compliance.loadingRequirements') : 'Loading documents...'}
          minHeight=""
          messageClassName="text-[11px] text-slate-500 font-medium"
        />
      </div>
    );
  }

  if (error) {
    const is404 = error.includes('404') || error.toLowerCase().includes('not found');
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-3">
        <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <XCircle className="size-3.5 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-red-800 text-[11px] font-semibold">{error}</p>
            {is404 && <p className="text-red-600 text-[10px] mt-0.5">{t?.has?.('compliance.apiError') ? t('compliance.apiError') : 'Unable to connect to document server.'}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-blue-50 border border-blue-100 flex items-center justify-center">
            <FileText className="w-3 h-3 text-blue-600" />
          </div>
          <h3 className="text-[11px] font-black text-[#101b87] uppercase tracking-wider">{'Asset Documents'}</h3>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* 2x2 Grid Body */}
      <div className="p-2.5 flex-1 flex flex-col justify-between">
        {paginatedDefinitions.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {paginatedDefinitions.map((def) => {
              const state = uploadStates[def.id];
              const status = state?.status || 'pending';
              const isUploaded = status === 'uploaded';
              const isUploading = status === 'uploading';
              const isError = status === 'error';

              const docFile = state?.file;
              const uploadedDoc = state?.uploadedDoc;

              return (
                <div
                  key={def.id}
                  className="bg-slate-50/70 hover:bg-slate-50 rounded-lg border border-slate-200/90 p-2 flex flex-col justify-between h-[66px] transition-all"
                >
                  {/* Top: Document Name */}
                  <div className="flex items-start justify-between gap-1">
                    <span
                      className="text-[10px] font-bold text-slate-800 leading-tight line-clamp-1"
                      title={def.documentName}
                    >
                      {def.documentName}
                      {def.isRequired && <span className="text-red-500 font-bold ml-0.5">*</span>}
                    </span>
                  </div>

                  {/* Bottom: File status & Action Buttons */}
                  <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-200/60 mt-auto">
                    {isUploaded && (docFile || uploadedDoc) ? (
                      <div className="flex items-center gap-1 min-w-0 flex-1">
                        <svg
                          className="w-3.5 h-3.5 text-red-500 shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                        <span
                          className="text-[9px] text-blue-600 font-semibold truncate"
                          title={docFile ? docFile.name : uploadedDoc?.fileName}
                        >
                          {docFile
                            ? formatBytes(docFile.size)
                            : uploadedDoc?.fileSize
                            ? formatBytes(uploadedDoc.fileSize)
                            : 'Uploaded'}
                        </span>
                      </div>
                    ) : isUploading ? (
                      <div className="flex items-center gap-1 text-blue-600 font-semibold text-[9px]">
                        <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                        <span>{'Uploading...'}</span>
                      </div>
                    ) : isError ? (
                      <span className="text-red-500 font-semibold text-[8.5px]" title={state?.error}>{'Error'}</span>
                    ) : (
                      <span className="text-slate-400 font-medium text-[9px]">{'Pending'}</span>
                    )}

                    {/* Actions */}
                    {isUploaded ? (
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleView(def.id, state)}
                          disabled={viewingDocId === def.id}
                          className="w-5 h-5 flex items-center justify-center rounded text-blue-600 hover:bg-blue-100 transition-colors disabled:opacity-50 cursor-pointer"
                          title="View"
                        >
                          {viewingDocId === def.id ? (
                            <Loader2 className="w-2.5 h-2.5 animate-spin text-blue-600" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownload(def.id, state)}
                          className="w-5 h-5 flex items-center justify-center rounded text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
                          title="Download"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setUploadingDefId(def.id);
                            fileInputRef.current?.click();
                          }}
                          className="w-5 h-5 flex items-center justify-center rounded text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
                          title="Replace"
                        >
                          <Upload className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(def.id)}
                          className="w-5 h-5 flex items-center justify-center rounded text-red-500 hover:bg-red-100 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setUploadingDefId(def.id);
                          fileInputRef.current?.click();
                        }}
                        className="px-2 py-0.5 bg-white border border-blue-200 text-blue-600 rounded text-[9px] font-bold hover:bg-blue-50 transition-colors cursor-pointer shrink-0"
                      >{'Upload'}</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 text-center text-slate-400 font-medium text-[11px]">{'No document requirements found for this unit type.'}</div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[9.5px] text-slate-500 font-medium">
              {'Page '}{currentPage}{' of '}{totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2 py-0.5 text-[9.5px] border border-slate-200 rounded font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >{'Previous'}</button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2 py-0.5 text-[9.5px] border border-slate-200 rounded font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >{'Next'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

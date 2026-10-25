"use client";

import React from "react";
import { Eye, Download, UploadCloud, Loader2, Trash2 } from "lucide-react";
import { Button, Tooltip } from "@/components/common";
import { toast } from "sonner";

export interface DocumentAttachmentButtonsProps {
    isDisabled: boolean;
    isAnyActionRunning: boolean;
    isPending: boolean;
    pendingFile?: File;
    resolvedGuid?: string;
    documentUrl?: string;
    isViewing: boolean;
    isDownloading: boolean;
    isDeleting?: boolean;
    isUploading?: boolean;
    onViewDocument: () => void;
    onDownloadDocument: () => void;
    onFileUpload: (file: File) => void;
    onFileDelete?: () => void;
    canDeleteDocument?: boolean;
    deleteDocumentTooltip?: string;
    allowedFormats?: string;
    t: (key: string) => string;
}

export const DocumentAttachmentButtons: React.FC<DocumentAttachmentButtonsProps> = ({
    isDisabled,
    isAnyActionRunning,
    isPending,
    pendingFile,
    resolvedGuid,
    documentUrl,
    isViewing,
    isDownloading,
    isDeleting,
    isUploading,
    onViewDocument,
    onDownloadDocument,
    onFileUpload,
    onFileDelete,
    canDeleteDocument,
    deleteDocumentTooltip,
    allowedFormats,
    t,
}) => {
    const isViewDisabled = isDisabled || isAnyActionRunning || (isPending && !pendingFile) || (!resolvedGuid && !documentUrl && !pendingFile);
    const isDownloadDisabled = isDisabled || isAnyActionRunning || (isPending && !pendingFile) || (!resolvedGuid && !documentUrl);

    return (
        <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button
                disabled={isViewDisabled}
                isLoading={isViewing}
                variant="primary"
                size="sm"
                icon={Eye}
                className="text-sm font-bold bg-blue-700 hover:bg-blue-800 text-white rounded-lg cursor-pointer disabled:opacity-50"
                onClick={onViewDocument}
            >
                {t("building.viewDocument") || "View Document"}
            </Button>
            <Button
                disabled={isDownloadDisabled}
                isLoading={isDownloading}
                variant="secondary"
                size="sm"
                icon={Download}
                className="text-sm font-bold border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50/40 hover:border-blue-500 cursor-pointer disabled:opacity-50"
                onClick={onDownloadDocument}
            >
                {t("building.downloadDocument") || "Download Document"}
            </Button>
            {Boolean(onFileDelete || canDeleteDocument !== undefined) && (
                canDeleteDocument === false ? (
                    <Tooltip
                        content={
                            deleteDocumentTooltip ||
                            (typeof (t as unknown as { has?: (k: string) => boolean }).has === "function"
                                ? ((t as unknown as { has: (k: string) => boolean }).has("building.cannotDeleteDocument")
                                    ? t("building.cannotDeleteDocument")
                                    : "Cannot delete inherited document")
                                : (() => {
                                    try {
                                        return t("building.cannotDeleteDocument") || "Cannot delete inherited document";
                                    } catch {
                                        return "Cannot delete inherited document";
                                    }
                                })())
                        }
                        placement="top"
                    >
                        <span className="inline-block">
                            <Button
                                disabled={true}
                                variant="delete"
                                size="sm"
                                icon={Trash2}
                                className="text-sm font-bold border border-red-200 text-red-700 rounded-lg opacity-50 cursor-not-allowed"
                                onClick={() => {
                                    if (deleteDocumentTooltip) toast.info(deleteDocumentTooltip);
                                }}
                            >
                                {t("building.deleteDocument") || "Delete Document"}
                            </Button>
                        </span>
                    </Tooltip>
                ) : (
                    <Button
                        disabled={isDisabled || isAnyActionRunning}
                        isLoading={isDeleting}
                        variant="delete"
                        size="sm"
                        icon={Trash2}
                        className="text-sm font-bold border border-red-200 text-red-700 rounded-lg hover:bg-red-50/40 hover:border-red-500 cursor-pointer"
                        onClick={onFileDelete}
                    >
                        {t("building.deleteDocument") || "Delete Document"}
                    </Button>
                )
            )}
            <label
                className={`h-8 px-3 text-sm font-bold flex items-center gap-2 border border-blue-200 text-blue-700 rounded-lg transition-all bg-white shadow-sm whitespace-nowrap ${
                    isDisabled || isAnyActionRunning ? "opacity-50 pointer-events-none cursor-not-allowed" : "cursor-pointer hover:bg-blue-50/40 hover:border-blue-500"
                }`}
            >
                {isUploading ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                <span>{isUploading ? t("building.uploading") || "Uploading..." : t("building.replaceDocument") || "Replace File"}</span>
                <input
                    type="file"
                    className="hidden"
                    disabled={isDisabled || isAnyActionRunning}
                    accept={allowedFormats ? (allowedFormats.includes("PDF") ? ".pdf,.png,.jpg,.jpeg" : ".png,.jpg,.jpeg") : undefined}
                    onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        if (file) {
                            onFileUpload(file);
                            e.target.value = "";
                        }
                    }}
                />
            </label>
        </div>
    );
};

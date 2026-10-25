"use client";

import React from "react";
import { FileText, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/common";
import { downloadDocumentClient, getDocumentBlobUrl } from "@/lib/utils/document-client-utils";
import { DocumentViewerModal } from "@/components/common";
import { toast } from "sonner";
import { useLocale } from "next-intl";
import { UploadDropzone } from "./UploadDropzone";
import { DocumentAttachmentButtons } from "./DocumentAttachmentButtons";

export interface DocumentAttachmentProps {
    documentGuid?: string;
    fileName?: string;
    documentUrl?: string;
    hasDocumentBinding?: boolean;
    isUploading?: boolean;
    isDeleting?: boolean;
    isDisabled: boolean;
    isDocumentInvalid: boolean;
    documentError?: string;
    onFileUpload: (file: File) => void;
    onFileDelete?: () => void;
    canDeleteDocument?: boolean;
    deleteDocumentTooltip?: string;
    t: (key: string) => string;
    label?: string;
    pendingFile?: File;
    allowedFormats?: string;
}

/**
 * Clean storage timestamp and GUID prefix into human-readable original file name.
 */
export function formatDisplayFileName(name?: string | null): string {
    if (!name) return "";
    const trimmed = name.trim();
    const storageMatch = trimmed.match(/^\d{8}_\d{6}_\d+_[a-fA-F0-9]{32}_(.+)$/);
    if (storageMatch && storageMatch[1]) return storageMatch[1];
    const guidMatch = trimmed.match(/^[a-fA-F0-9-]{36}_(.+)$/);
    if (guidMatch && guidMatch[1]) return guidMatch[1];
    return trimmed;
}

export const DocumentAttachment: React.FC<DocumentAttachmentProps> = ({
    documentGuid, fileName, documentUrl, hasDocumentBinding, isUploading, isDeleting, isDisabled,
    isDocumentInvalid, documentError, onFileUpload, onFileDelete, canDeleteDocument, deleteDocumentTooltip,
    t, label, pendingFile, allowedFormats
}) => {
    const locale = useLocale();
    const [isViewing, setIsViewing] = React.useState(false);
    const [isDownloading, setIsDownloading] = React.useState(false);
    const [viewerData, setViewerData] = React.useState<{ isOpen: boolean; url: string; name: string } | null>(null);

    const resolvedGuid = React.useMemo(() => {
        if (documentGuid && documentGuid !== "pending") return documentGuid;
        if (documentUrl) {
            const match = documentUrl.match(/\/documents\/([^/?]+)/);
            if (match && match[1]) return decodeURIComponent(match[1]);
        }
        return documentGuid;
    }, [documentGuid, documentUrl]);

    const isAnyActionRunning = !!isUploading || isViewing || isDownloading || !!isDeleting;
    const displayFileName = formatDisplayFileName(fileName) || (pendingFile?.name ? formatDisplayFileName(pendingFile.name) : (t("building.documentAttached") || "Document Attached"));

    React.useEffect(() => {
        return () => { if (viewerData?.url?.startsWith("blob:")) URL.revokeObjectURL(viewerData.url); };
    }, [viewerData]);

    const handleViewDocument = async () => {
        if (pendingFile) {
            setViewerData({ isOpen: true, url: URL.createObjectURL(pendingFile), name: displayFileName });
            return;
        }
        if (documentUrl) {
            setViewerData({ isOpen: true, url: documentUrl, name: displayFileName });
            return;
        }
        if (!resolvedGuid) {
            toast.info(t("building.noDocumentAttached") || "No document file attached for this record.");
            return;
        }
        setIsViewing(true);
        try {
            const { url } = await getDocumentBlobUrl(resolvedGuid, locale);
            setViewerData({ isOpen: true, url, name: displayFileName });
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Failed to view document");
        } finally {
            setIsViewing(false);
        }
    };

    const closeViewer = () => {
        if (viewerData?.url?.startsWith("blob:")) URL.revokeObjectURL(viewerData.url);
        setViewerData(null);
    };

    const handleDownloadDocument = async () => {
        if (!resolvedGuid && !documentUrl) {
            toast.info(t("building.noDocumentAttached") || "No document file attached for this record.");
            return;
        }
        setIsDownloading(true);
        try {
            if (resolvedGuid) {
                await downloadDocumentClient(resolvedGuid, displayFileName, locale);
            } else if (documentUrl) {
                const a = document.createElement("a");
                a.href = documentUrl;
                a.download = displayFileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Failed to download document");
        } finally {
            setIsDownloading(false);
        }
    };

    const hasAttachment = Boolean(resolvedGuid || hasDocumentBinding || documentUrl || pendingFile);

    if (!hasAttachment) {
        return <UploadDropzone isDisabled={isDisabled} isUploading={isUploading} isDocumentInvalid={isDocumentInvalid} documentError={documentError} onFileUpload={onFileUpload} t={t} allowedFormats={allowedFormats} />;
    }

    const isPending = (resolvedGuid === "pending") || (!resolvedGuid && !hasDocumentBinding && !documentUrl && !!pendingFile);

    return (
        <div className="border border-blue-100 rounded-xl bg-blue-50/10 p-4 space-y-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl flex-shrink-0 shadow-sm border border-blue-100/50">
                    <FileText size={24} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-blue-950 truncate mb-1" title={displayFileName}>{displayFileName}</p>
                    <div className="flex items-center gap-1.5">
                        <Badge
                            variant={isPending ? "warning" : "success"} size="sm" icon={ShieldCheck}
                            className={isPending ? "bg-amber-50 text-amber-700 border-amber-200 font-bold animate-pulse" : "bg-emerald-50 text-emerald-700 border-emerald-100 font-bold"}
                        >
                            {isPending ? (t("building.pendingSave") || "Pending Save") : (t("building.activeAttachment") || "Active Attachment")}
                        </Badge>
                    </div>
                </div>
            </div>

            <DocumentAttachmentButtons
                isDisabled={isDisabled}
                isAnyActionRunning={isAnyActionRunning}
                isPending={isPending}
                pendingFile={pendingFile}
                resolvedGuid={resolvedGuid}
                documentUrl={documentUrl}
                isViewing={isViewing}
                isDownloading={isDownloading}
                isDeleting={isDeleting}
                isUploading={isUploading}
                onViewDocument={handleViewDocument}
                onDownloadDocument={handleDownloadDocument}
                onFileUpload={onFileUpload}
                onFileDelete={onFileDelete}
                canDeleteDocument={canDeleteDocument}
                deleteDocumentTooltip={deleteDocumentTooltip}
                allowedFormats={allowedFormats}
                t={t}
            />

            {viewerData && (
                <DocumentViewerModal
                    isOpen={viewerData.isOpen} onClose={closeViewer} fileUrl={viewerData.url} fileName={viewerData.name} label={label}
                />
            )}
        </div>
    );
};

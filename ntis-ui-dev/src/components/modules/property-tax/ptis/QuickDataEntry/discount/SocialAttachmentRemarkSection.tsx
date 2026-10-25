"use client";

import React from "react";
import { Label, TextArea } from "@/components/common";
import { FlatSocialAttributeState } from "@/lib/utils/social-details";
import { DocumentAttachment } from "../building/DocumentAttachment";

interface SocialAttachmentRemarkSectionProps {
    data: FlatSocialAttributeState;
    displayName: string;
    isDisabled: boolean;
    canDeleteDocument: boolean;
    deleteDocumentTooltip?: string;
    isPhotoRequired: boolean;
    isPhotoInvalid: boolean;
    isRemarkError: boolean;
    errorMsg?: string;
    onPhotoUpload: (file: File) => void;
    onPhotoDelete?: () => void;
    onRemarkChange: (value: string) => void;
    t: {
        (key: string, values?: Record<string, string | number | Date>): string;
        has?: (key: string) => boolean;
    };
}

export const SocialAttachmentRemarkSection: React.FC<SocialAttachmentRemarkSectionProps> = ({
    data,
    displayName,
    isDisabled,
    canDeleteDocument,
    deleteDocumentTooltip,
    isPhotoRequired,
    isPhotoInvalid,
    isRemarkError,
    errorMsg,
    onPhotoUpload,
    onPhotoDelete,
    onRemarkChange,
    t,
}) => {
    return (
        <div className="space-y-2.5 w-full">
            <div className="space-y-1 w-full">
                <Label required={isPhotoRequired} className="text-sm font-bold text-blue-800">
                    {t("discount.uploadDocument")}
                </Label>
                <DocumentAttachment
                    documentGuid={data.documentGuid || data.photoGuid || undefined}
                    fileName={data.fileName || undefined}
                    documentUrl={data.documentUrl || undefined}
                    hasDocumentBinding={Boolean(data.documentBindingId || data.photoBindingId)}
                    isUploading={data.isUploading}
                    isDeleting={data.isDeleting}
                    isDisabled={isDisabled}
                    isDocumentInvalid={isPhotoInvalid}
                    onFileUpload={onPhotoUpload}
                    onFileDelete={onPhotoDelete}
                    canDeleteDocument={Boolean(data.pendingFile) || canDeleteDocument}
                    deleteDocumentTooltip={deleteDocumentTooltip}
                    t={t as (key: string, values?: Record<string, string | number>) => string}
                    label={displayName}
                    pendingFile={data.pendingFile}
                    allowedFormats={t("discount.allowedImageFormats")}
                />
                {isPhotoInvalid && <span className="text-red-500 text-[10px] font-semibold mt-1 block">{errorMsg}</span>}
            </div>

            <div className="space-y-1 w-full">
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-bold text-blue-800">{t("discount.remark")}</Label>
                    {(data.remark || "").trim() !== "" && !isDisabled && (
                        <button
                            type="button"
                            onClick={() => onRemarkChange("")}
                            className="px-2.5 py-0.5 text-[10px] md:text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-all cursor-pointer"
                        >
                            {t("commonbuttonmessages.clear")}
                        </button>
                    )}
                </div>
                <TextArea
                    value={data.remark || ""}
                    disabled={isDisabled}
                    onChange={(e) => onRemarkChange(e.target.value.replace(/[<>]/g, ""))}
                    placeholder={t("discount.remarkPlaceholder")}
                    rows={2}
                    maxLength={500}
                    showCharCount
                    charCountLabel={t("discount.characters")}
                    className={`resize-y font-semibold ${isRemarkError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
                />
                {isRemarkError && <span className="text-red-500 text-[10px] font-semibold mt-1 block">{errorMsg}</span>}
            </div>
        </div>
    );
};

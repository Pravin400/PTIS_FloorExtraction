"use client";

import React from "react";
import { Label, TextArea } from "@/components/common";
import { DiscountAttributeState } from "@/types/discount.types";
import { DocumentAttachment } from "../building/DocumentAttachment";

interface DiscountAttachmentRemarkSectionProps {
    data: DiscountAttributeState;
    displayName: string;
    isDisabled: boolean;
    canDeleteDocument: boolean;
    deleteDocumentTooltip?: string;
    isDocumentInvalid: boolean;
    isRemarkError?: boolean;
    remarkError?: string;
    validationError?: string;
    onFileUpload: (file: File) => void;
    onFileDelete?: () => void;
    onInputChange: (field: "remark", value: string) => void;
    t: {
        (key: string, values?: Record<string, string | number | Date>): string;
        has?: (key: string) => boolean;
    };
}

export const DiscountAttachmentRemarkSection: React.FC<DiscountAttachmentRemarkSectionProps> = ({
    data,
    displayName,
    isDisabled,
    canDeleteDocument,
    deleteDocumentTooltip,
    isDocumentInvalid,
    isRemarkError: propIsRemarkError,
    remarkError,
    validationError,
    onFileUpload,
    onFileDelete,
    onInputChange,
    t,
}) => {
    const isRemarkError = propIsRemarkError !== undefined
        ? propIsRemarkError
        : Boolean(validationError && !isDocumentInvalid && (data.dataType || "").toUpperCase() === "BIT");

    const displayRemarkError = remarkError || (isRemarkError ? validationError : undefined);

    return (
        <div className="space-y-2.5 w-full">
            <div className="space-y-1 w-full">
                <Label required={data.isDocumentRequired === true} className="text-sm font-bold text-blue-800">
                    {t("discount.uploadDocument")}
                </Label>
                <DocumentAttachment
                    documentGuid={data.documentGuid || undefined}
                    fileName={data.fileName || undefined}
                    documentUrl={data.documentUrl || undefined}
                    hasDocumentBinding={!!data.documentBindingId}
                    isUploading={data.isUploading}
                    isDeleting={data.isDeleting}
                    isDisabled={isDisabled}
                    isDocumentInvalid={isDocumentInvalid}
                    onFileUpload={onFileUpload}
                    onFileDelete={onFileDelete}
                    canDeleteDocument={Boolean(data.pendingFile) || canDeleteDocument}
                    deleteDocumentTooltip={deleteDocumentTooltip}
                    t={t}
                    label={displayName}
                    pendingFile={data.pendingFile}
                />
            </div>

            <div className="space-y-1 w-full">
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-bold text-blue-800">{t("discount.remark")}</Label>
                    {(data.remark || "").trim() !== "" && !isDisabled && (
                        <button
                            type="button"
                            onClick={() => onInputChange("remark", "")}
                            className="px-2.5 py-0.5 text-[10px] md:text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-all cursor-pointer"
                        >
                            {t("commonbuttonmessages.clear")}
                        </button>
                    )}
                </div>
                <TextArea
                    value={data.remark || ""}
                    disabled={isDisabled}
                    onChange={(e) => onInputChange("remark", e.target.value.replace(/[<>]/g, ""))}
                    placeholder={t("discount.remarkPlaceholder")}
                    rows={2}
                    maxLength={500}
                    showCharCount
                    charCountLabel={t("discount.characters")}
                    className={`resize-y font-semibold ${isRemarkError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
                />
                {isRemarkError && <span className="text-red-500 text-[10px] font-semibold mt-1 block">{displayRemarkError}</span>}
            </div>
        </div>
    );
};

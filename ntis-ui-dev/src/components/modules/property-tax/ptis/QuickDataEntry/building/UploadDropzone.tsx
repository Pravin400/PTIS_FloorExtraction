"use client";

import React from "react";
import { UploadCloud } from "lucide-react";
import { ValidationMessage } from "@/components/common";

interface UploadDropzoneProps {
    isDisabled: boolean;
    isUploading?: boolean;
    isDocumentInvalid: boolean;
    documentError?: string;
    onFileUpload: (file: File) => void;
    t: (key: string) => string;
    allowedFormats?: string;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
    isDisabled,
    isUploading = false,
    isDocumentInvalid,
    documentError,
    onFileUpload,
    t,
    allowedFormats,
}) => {
    return (
        <div className="space-y-1.5 w-full">
            <label
                className={`w-full flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-xl transition-all p-4 text-center relative group
                    ${isDisabled
                        ? "border-gray-300 bg-gray-100/50 text-gray-500 cursor-not-allowed"
                        : isUploading
                            ? "border-blue-400 bg-blue-50/20 text-blue-800 animate-pulse cursor-not-allowed"
                            : isDocumentInvalid
                                ? "border-red-400 bg-red-50/5 hover:bg-red-50/20 hover:border-red-500 text-red-800 shadow-sm cursor-pointer"
                                : "border-blue-200 bg-blue-50/5 hover:bg-blue-50/20 hover:border-blue-500 text-blue-800 shadow-sm cursor-pointer"
                    }`}
            >
                <UploadCloud
                    size={32}
                    className={`mb-2 transition-transform duration-300 ${
                        isUploading
                            ? "animate-bounce"
                            : isDocumentInvalid
                                ? "text-red-500 group-hover:scale-110"
                                : "text-blue-500 group-hover:scale-110"
                    }`}
                />
                <span className={`text-sm font-bold block mb-1 ${isDocumentInvalid ? "text-red-900" : "text-blue-900"}`}>
                    {isUploading ? t("building.uploading") || "Uploading file..." : t("building.dragAndDrop") || "Click to select or drag & drop"}
                </span>
                <span className="text-xs text-gray-400 font-semibold">{allowedFormats || t("building.allowedFormats") || "PDF, PNG, JPG (Max 5MB)"}</span>
                <input
                    type="file"
                    className="hidden"
                    disabled={isDisabled || isUploading}
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
            {isDocumentInvalid && <ValidationMessage message={documentError || t("common.validation.documentRequired")} />}
        </div>
    );
};

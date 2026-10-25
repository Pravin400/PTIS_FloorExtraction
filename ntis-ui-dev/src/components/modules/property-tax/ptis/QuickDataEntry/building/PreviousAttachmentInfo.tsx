"use client";

import React from "react";
import { RefreshCw, FileCheck, Loader2 } from "lucide-react";
import { Badge } from "@/components/common";

interface PreviousAttachmentInfoProps {
    isDisabled: boolean;
    isUploading?: boolean;
    onFileUpload: (file: File) => void;
    t: (key: string) => string;
}

export const PreviousAttachmentInfo: React.FC<PreviousAttachmentInfoProps> = ({
    isDisabled,
    isUploading = false,
    onFileUpload,
    t,
}) => {
    return (
        <div className="border border-amber-200 rounded-xl bg-amber-50/20 p-4 space-y-3 shadow-sm">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl flex-shrink-0 shadow-sm border border-amber-100/50">
                    <FileCheck size={24} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-amber-950 mb-1">
                        {t("building.documentPreviouslyAttached") || "Document Previously Attached"}
                    </p>
                    <Badge
                        variant="warning"
                        size="sm"
                        className="bg-amber-50 text-amber-700 border-amber-200 font-bold"
                    >
                        {t("building.reUploadRequired") || "Re-upload to view or download"}
                    </Badge>
                </div>
            </div>
            <label
                className={`flex items-center justify-center gap-2 w-full h-10 text-sm font-bold border border-amber-300 text-amber-800 rounded-lg transition-all bg-white shadow-sm ${
                    isDisabled || isUploading ? "opacity-50 pointer-events-none cursor-not-allowed" : "cursor-pointer hover:bg-amber-50/40 hover:border-amber-500"
                }`}
            >
                {isUploading ? (
                    <Loader2 size={14} className="animate-spin" />
                ) : (
                    <RefreshCw size={14} />
                )}
                <span>{isUploading ? t("building.uploading") || "Uploading..." : t("building.reUploadDocument") || "Re-upload Document"}</span>
                <input
                    type="file"
                    className="hidden"
                    disabled={isDisabled || isUploading}
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

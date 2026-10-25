"use client";

import React from "react";
import { Trash2, Loader2 } from "lucide-react";
import { SaveButton } from "@/components/common";
import { Tooltip } from "@/components/common/Tooltip";

interface DiscountDetailFooterProps {
    onDeleteDiscount?: () => void;
    onSave?: () => void;
    isDeleteButtonVisible: boolean;
    canDelete: boolean;
    deleteTooltip?: string;
    isDisabled: boolean;
    isSaving: boolean;
    isDeleting: boolean;
    hasChanges: boolean;
    isFormValid?: boolean;
    t: {
        (key: string, values?: Record<string, string | number | Date>): string;
        has?: (key: string) => boolean;
    };
}

export const DiscountDetailFooter: React.FC<DiscountDetailFooterProps> = ({
    onDeleteDiscount,
    onSave,
    isDeleteButtonVisible,
    canDelete,
    deleteTooltip,
    isDisabled,
    isSaving,
    isDeleting,
    hasChanges,
    isFormValid: _isFormValid,
    t,
}) => {
    const isDeleteActionBlocked = isDisabled || isSaving || isDeleting || !canDelete;

    const renderDeleteButton = () => {
        const buttonElement = (
            <button
                type="button"
                disabled={isDeleteActionBlocked}
                onClick={canDelete ? onDeleteDiscount : undefined}
                className="px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-300 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={deleteTooltip || t("discount.deleteDiscount") || "Delete Discount & Data"}
            >
                {isDeleting ? (
                    <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                        <span>{t("commonbuttonmessages.deleting") || "Deleting..."}</span>
                    </>
                ) : (
                    <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t("discount.deleteDiscount") || "Delete Discount & Data"}</span>
                    </>
                )}
            </button>
        );

        if (!canDelete && deleteTooltip) {
            return (
                <Tooltip content={deleteTooltip} placement="top">
                    <span className="inline-flex cursor-not-allowed" tabIndex={0}>
                        {buttonElement}
                    </span>
                </Tooltip>
            );
        }

        return buttonElement;
    };

    return (
        <div className="pt-2 border-t border-blue-100 mt-1 flex items-center justify-between gap-2 shrink-0 bg-white z-10">
            <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50 flex-shrink-0 animate-pulse" aria-hidden="true" role="presentation" />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    {t("discount.verifyDetailsNote") || "Verify details & file attachment before saving changes."}
                </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
                {onDeleteDiscount && isDeleteButtonVisible && renderDeleteButton()}
                {onSave && (
                    <SaveButton
                        onClick={onSave}
                        disabled={!hasChanges || isSaving || isDeleting || isDisabled}
                        isLoading={isSaving}
                        label={t("common.saveChanges") || "Save Changes"}
                    />
                )}
            </div>
        </div>
    );
};

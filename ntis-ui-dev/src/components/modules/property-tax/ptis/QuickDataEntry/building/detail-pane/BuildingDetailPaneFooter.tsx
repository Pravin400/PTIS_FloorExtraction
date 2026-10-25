import React from "react";
import { AlertCircle } from "lucide-react";
import { Label, DeleteButton, SaveButton } from "@/components/common";

interface BuildingDetailPaneFooterProps {
    actionError?: string | null;
    saveError?: string;
    deleteError?: string;
    hasValidationError?: boolean;
    setActionError: (err: string | null) => void;
    onDeleteCertificate?: () => void | Promise<unknown>;
    isCertificateFilled: boolean;
    isUpdateCase: boolean;
    isDisabled: boolean;
    isSaving: boolean;
    isDeleting: boolean;
    hasChanges: boolean;
    handleDeleteCertificateWithConfirm: () => void;
    onSave?: () => void | Promise<unknown>;
    handleSaveClick: () => void;
    t: (key: string, values?: Record<string, string | number | Date>) => string;
}

export const BuildingDetailPaneFooter: React.FC<BuildingDetailPaneFooterProps> = ({
    actionError,
    saveError,
    deleteError,
    hasValidationError,
    setActionError,
    onDeleteCertificate,
    isCertificateFilled,
    isUpdateCase,
    isDisabled,
    isSaving,
    isDeleting,
    hasChanges,
    handleDeleteCertificateWithConfirm,
    onSave,
    handleSaveClick,
    t,
}) => {
    const errorMsg = hasValidationError ? deleteError : (actionError || saveError || deleteError);

    return (
        <>
            {errorMsg && (
                <div className="mb-2 p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between text-xs text-red-700">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                        <span className="font-semibold">{errorMsg}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setActionError(null)}
                        className="text-red-500 hover:text-red-700 font-bold ml-2 cursor-pointer"
                        aria-label="Dismiss error"
                    >
                        ×
                    </button>
                </div>
            )}

            <div className="pt-2.5 border-t border-blue-50 mt-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50 flex-shrink-0 animate-pulse" />
                    <Label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        {t("building.verifyDetailsNote") || "Verify document details & file attachment before saving changes."}
                    </Label>
                </div>
                <div className="flex items-center gap-2">
                    {onDeleteCertificate && isCertificateFilled && isUpdateCase && !isDisabled && (
                        <DeleteButton
                            size="xs"
                            aria-label={t("building.deleteCertificate") || "Delete Certificate & Data"}
                            disabled={isDisabled || isSaving || isDeleting}
                            isLoading={isDeleting}
                            onClick={handleDeleteCertificateWithConfirm}
                        >
                            {t("building.deleteCertificate") || "Delete Certificate & Data"}
                        </DeleteButton>
                    )}
                    {onSave && (
                        <SaveButton
                            onClick={handleSaveClick}
                            disabled={!hasChanges || isSaving || isDeleting || isDisabled || !isCertificateFilled}
                            isLoading={isSaving}
                            label={t("common.saveChanges") || "Save Changes"}
                        />
                    )}
                </div>
            </div>
        </>
    );
};

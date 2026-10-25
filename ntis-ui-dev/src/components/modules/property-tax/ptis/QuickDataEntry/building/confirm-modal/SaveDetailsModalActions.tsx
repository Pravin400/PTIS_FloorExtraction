import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface SaveDetailsModalActionsProps {
    isUnsavedWarning?: boolean;
    onClose: () => void;
    onConfirm: (selectedFloorIds?: number[]) => void;
    handleConfirmClick: () => void;
    isConfirmDisabled: boolean;
    t: (key: string) => string;
}

export const SaveDetailsModalActions: React.FC<SaveDetailsModalActionsProps> = ({
    isUnsavedWarning = false,
    onClose,
    onConfirm,
    handleConfirmClick,
    isConfirmDisabled,
    t,
}) => {
    return (
        <div className="mt-8 flex items-center justify-center gap-4 w-full">
            {isUnsavedWarning ? (
                <>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold h-12 text-sm transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        <AlertTriangle className="h-4 w-4" />
                        <span>{t("building.continueButton") || "Continue Editing"}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => onConfirm()}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold h-12 text-sm transition-all border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                    >
                        <X className="h-4 w-4" />
                        <span>{t("building.discardConfirmButton") || "Discard Changes"}</span>
                    </button>
                </>
            ) : (
                <>
                    <button
                        type="button"
                        onClick={handleConfirmClick}
                        disabled={isConfirmDisabled}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold h-12 text-sm transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                        <AlertTriangle className="h-4 w-4" />
                        <span>{t("building.confirmReplaceOk")}</span>
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold h-12 text-sm transition-all border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                    >
                        <X className="h-4 w-4" />
                        <span>{t("building.confirmReplaceCancel")}</span>
                    </button>
                </>
            )}
        </div>
    );
};

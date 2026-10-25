"use client";

import React, { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { SaveDetailsConfirmModalProps } from "./confirm-modal/confirm-modal.types";
import { formatDateToDDMMYYYY } from "./confirm-modal/date.utils";
import { SaveDetailsUnsavedWarning } from "./confirm-modal/SaveDetailsUnsavedWarning";
import { SaveDetailsFloorsTable } from "./confirm-modal/SaveDetailsFloorsTable";
import { SaveDetailsModalActions } from "./confirm-modal/SaveDetailsModalActions";

export { formatDateToDDMMYYYY };

export const SaveDetailsConfirmModal: React.FC<SaveDetailsConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    certificateName = "",
    certificateNumber = "",
    certificateDate = "",
    targetFloors = [],
    isPropertyWideGlobal = false,
    t,
    isUnsavedWarning = false,
    incompleteFloors = [],
}) => {
    const [deselectedFloorIds, setDeselectedFloorIds] = useState<Set<number>>(new Set());

    if (!isOpen) return null;

    const isAllSelected = targetFloors.length > 0 && deselectedFloorIds.size === 0;
    const isSomeSelected = deselectedFloorIds.size > 0 && deselectedFloorIds.size < targetFloors.length;
    const selectedCount = targetFloors.length - deselectedFloorIds.size;

    const handleSelectAll = () => {
        if (isAllSelected) {
            setDeselectedFloorIds(new Set(targetFloors.map((f) => f.propertyDetailsId)));
        } else {
            setDeselectedFloorIds(new Set());
        }
    };

    const handleSelectRow = (id: number) => {
        setDeselectedFloorIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleConfirmClick = () => {
        const selectedFloorIds = targetFloors
            .map((f) => f.propertyDetailsId)
            .filter((id) => !deselectedFloorIds.has(id));
        onConfirm(selectedFloorIds);
    };

    const isConfirmDisabled = !isPropertyWideGlobal && targetFloors.length > 0 && selectedCount === 0;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-[2px] transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Modal Box */}
            <div
                className="relative w-[520px] max-w-[95vw] rounded-2xl bg-white shadow-[0_30px_70px_rgba(0,0,0,0.3)] border border-slate-100 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Accent Top Bar */}
                <div
                    className={`h-1.5 w-full bg-gradient-to-r ${
                        isUnsavedWarning
                            ? "from-red-600 via-rose-500 to-amber-500"
                            : "from-amber-500 via-orange-500 to-red-500"
                    }`}
                />

                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all focus:outline-none"
                    aria-label="Close"
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Content Container */}
                <div className="p-8 flex flex-col items-center">
                    {/* Warning Icon wrapper */}
                    <div className="h-16 w-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 animate-bounce duration-1000">
                        <AlertTriangle className="h-8 w-8" />
                    </div>

                    {/* Modal Title */}
                    <h3 className="mt-5 text-2xl font-extrabold text-slate-800 tracking-tight text-center">
                        {isUnsavedWarning
                            ? t("building.unsavedChangesTitle") || "Unsaved Changes"
                            : t("building.confirmSaveDetailsTitle")}
                    </h3>

                    {isUnsavedWarning ? (
                        <SaveDetailsUnsavedWarning incompleteFloors={incompleteFloors} t={t} />
                    ) : (
                        <SaveDetailsFloorsTable
                            certificateName={certificateName}
                            certificateNumber={certificateNumber}
                            certificateDate={certificateDate}
                            targetFloors={targetFloors}
                            isPropertyWideGlobal={isPropertyWideGlobal}
                            deselectedFloorIds={deselectedFloorIds}
                            handleSelectAll={handleSelectAll}
                            handleSelectRow={handleSelectRow}
                            isAllSelected={isAllSelected}
                            isSomeSelected={isSomeSelected}
                            t={t}
                        />
                    )}

                    {/* Action Buttons */}
                    <SaveDetailsModalActions
                        isUnsavedWarning={isUnsavedWarning}
                        onClose={onClose}
                        onConfirm={onConfirm}
                        handleConfirmClick={handleConfirmClick}
                        isConfirmDisabled={isConfirmDisabled}
                        t={t}
                    />
                </div>
            </div>
        </div>
    );
};

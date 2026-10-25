"use client";

import { Dispatch, SetStateAction } from "react";
import { useTranslations } from "next-intl";
import { 
    FloorFactorCVMaster,
    FloorFactorCVMasterCreateAction,
    FloorFactorCVMasterUpdateAction
} from "@/types/floor-cv-weightageMaster.types";
import {
    updateFloorFactorCVMasterAction,
    createFloorFactorCVMasterAction,
} from "@/app/[locale]/property-tax/weightage-master/action";

export interface UseFloorCvRowOpsParams {
    data: FloorFactorCVMaster[];
    editableRows: Record<string, FloorFactorCVMaster>;
    setEditableRows: Dispatch<SetStateAction<Record<string, FloorFactorCVMaster>>>;
    setIsUpdating: Dispatch<SetStateAction<boolean>>;
    setSessionCreatedUids: Dispatch<SetStateAction<Set<string>>>;
    getRowUid: (row: FloorFactorCVMaster) => string;
    findRowByUid: (uid: string) => FloorFactorCVMaster | undefined;
    addToast: (type: "success" | "error" | "info" | "warning", message: string) => void;
    refreshPage: () => void;
    clearFilters: () => void;
    /** Called after a successful create/update so the "pending records" count can
     *  be refreshed to reflect what actually changed. */
    onDataChanged: () => void;
}

export function useFloorCvRowOps({
    editableRows,
    setEditableRows,
    setIsUpdating,
    setSessionCreatedUids,
    getRowUid,
    findRowByUid,
    addToast,
    refreshPage,
    clearFilters,
    onDataChanged,
}: UseFloorCvRowOpsParams) {
    const tW = useTranslations("weightageMaster");

    const handleCellChange = (rowId: string, columnId: string, value: string | number): void => {
        const numValue = typeof value === "string" ? (value === "" ? 0 : parseFloat(value)) : value;

        // Prevent negative values
        if (numValue < 0) {
            addToast("error", tW("common.messages.negativeValuesNotAllowed"));
            return;
        }
        // Prevent values greater than 999999
        if (numValue > 999999) {
            addToast("error", tW("common.messages.valueExceedsMax"));
            return;
        }
        setEditableRows((prev) => {
            const originalRow = findRowByUid(rowId);
            if (!originalRow) {
                return prev;
            }
            const existingEdit = prev[rowId];
            // Only allow positive values for factors
            const updatedRow: FloorFactorCVMaster = {
                ...originalRow,
                ...(existingEdit || {}),
                [columnId]: !isNaN(numValue) && numValue >= 0 ? numValue : (originalRow as unknown as Record<string, unknown>)[columnId],
            } as FloorFactorCVMaster;

            const updated = {
                ...prev,
                [rowId]: updatedRow,
            };

            return updated;
        });
    };

    const handleUpdate = async (row: FloorFactorCVMaster): Promise<void> => {
        const rowUid = getRowUid(row);

        const updatedData = editableRows[rowUid];
        if (!updatedData) {
            addToast("warning", tW("common.messages.noChangesToUpdate"));
            return;
        }

        const hasChanges =
            updatedData.factorWithLift !== row.factorWithLift ||
            updatedData.factorWithoutLift !== row.factorWithoutLift;

        if (!hasChanges) {
            addToast("warning", tW("common.messages.noChangesDetected"));
            return;
        }

        const factorWithLift = updatedData.factorWithLift ?? row.factorWithLift;
        const factorWithoutLift = updatedData.factorWithoutLift ?? row.factorWithoutLift;

        if (factorWithLift < 0.1 || factorWithoutLift < 0.1) {
            addToast("error", tW("common.messages.validFactorRequired") || "Please enter a valid factor value greater than 0");
            return;
        }

        if (factorWithLift > 100 || factorWithoutLift > 100) {
            addToast("error", tW("common.messages.factorPercentageExceedsMax"));
            return;
        }

        setIsUpdating(true);
        try {
            let result;
            if (row.id === 0) {
                // Prepare CREATE payload
                const createPayload: FloorFactorCVMasterCreateAction = {
                    isActive: row.isActive,
                    floorId: row.floorId,
                    factorWithLift: updatedData.factorWithLift ?? row.factorWithLift,
                    factorWithoutLift: updatedData.factorWithoutLift ?? row.factorWithoutLift,
                    yearRangeCVId: row.yearRangeCVID ?? row.yearRangeCVId ?? 0,
                };
                result = await createFloorFactorCVMasterAction(createPayload);
            } else {
                // Prepare UPDATE payload
                const updatePayload: FloorFactorCVMasterUpdateAction = {
                    isActive: row.isActive,
                    floorId: row.floorId,
                    factorWithLift: updatedData.factorWithLift ?? row.factorWithLift,
                    factorWithoutLift: updatedData.factorWithoutLift ?? row.factorWithoutLift,
                    yearRangeCVId: row.yearRangeCVID ?? row.yearRangeCVId ?? 0,
                };
                result = await updateFloorFactorCVMasterAction(row.id, updatePayload);
            }

            if (result.success) {
                if (row.id === 0) {
                    addToast("success", tW("common.messages.recordCreatedSuccess"));
                    setSessionCreatedUids((prev) => new Set([...prev, rowUid]));
                } else {
                    addToast("success", tW("common.messages.recordUpdatedSuccess"));
                }
                // After successful update, remove from editable rows using UID
                setEditableRows((prev) => {
                    const updated = { ...prev };
                    delete updated[rowUid];
                    return updated;
                });
                // Clear filters after successful update
                clearFilters();
                onDataChanged();
                // Refresh route data after a short delay without forcing a full page reload
                setTimeout(() => {
                    refreshPage();
                }, 1000);
            } else {
                addToast("error", result.message || (row.id === 0 ? tW("common.messages.createFailed") : tW("common.messages.updateFailed")));
            }
        } catch (_error) {
            addToast("error", tW("common.messages.failedToSaveRow"));
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCancel = (row: FloorFactorCVMaster): void => {
        const rowUid = getRowUid(row);
        setEditableRows((prev) => {
            const updated = { ...prev };
            delete updated[rowUid];
            return updated;
        });
        addToast("info", tW("common.messages.changesDiscarded"));
    };

    return {
        handleCellChange,
        handleUpdate,
        handleCancel,
    };
}

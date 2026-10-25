"use client";

import type { Dispatch, SetStateAction } from "react";
import { UseFactorCVMaster, UseFactorCVMasterUpdate, UseFactorCVMasterCreate } from "@/types/useCategoryCvFactor.types";
import { updateUseFactorCVMasterAction, createUseFactorCVMasterAction } from "@/app/[locale]/assets/configuration/master-data/weightage-master/sub-type-weightage/action";

interface UseCategoryCvRowOpsProps {
    editableRows: Record<string, UseFactorCVMaster>;
    setEditableRows: Dispatch<SetStateAction<Record<string, UseFactorCVMaster>>>;
    setIsUpdating: (val: boolean) => void;
    getRowUid: (row: UseFactorCVMaster) => string;
    findRowByUid: (uid: string) => UseFactorCVMaster | undefined;
    addToast: (type: "success" | "error" | "info" | "warning", message: string) => void;
    refreshPage: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tW: (key: string, values?: Record<string, any>) => string;
}

export function useCategoryCvRowOps({
    editableRows,
    setEditableRows,
    setIsUpdating,
    getRowUid,
    findRowByUid,
    addToast,
    refreshPage,
    tW,
}: UseCategoryCvRowOpsProps) {
    
    const handleCellChange = (rowId: string, columnId: string, value: number) => {
        if (value < 0) {
            addToast('error', tW('common.messages.negativeValuesNotAllowed'));
            return;
        }
        if (value > 999.99) {
            addToast('error', tW('common.messages.valueExceedsMax'));
            return;
        }

        setEditableRows((prev) => {
            const originalRow = findRowByUid(rowId);
            if (!originalRow) return prev;

            const existingEdit = prev[rowId];
            const updatedRow: UseFactorCVMaster = {
                ...originalRow,
                ...(existingEdit || {}),
                [columnId]: value >= 0 ? value : originalRow[columnId],
            };
            return { ...prev, [rowId]: updatedRow };
        });
    };

    const handleUpdate = async (row: UseFactorCVMaster) => {
        const rowUid = getRowUid(row);
        const updatedData = editableRows[rowUid];

        if (!updatedData) {
            addToast('warning', tW('common.messages.noChangesToUpdate'));
            return;
        }

        const hasChanges = updatedData.factor !== row.factor;

        if (!hasChanges) {
            addToast('warning', tW('common.messages.noChangesDetected'));
            return;
        }

        setIsUpdating(true);
        try {
            let result;
            if (row.id === 0) {
                const createPayload: Omit<UseFactorCVMasterCreate, 'createdBy'> = {
                    isActive: row.isActive,
                    typeOfUseId: row.typeOfUseId,
                    subTypeOfUseId: row.subTypeOfUseId,
                    factor: Number(updatedData.factor ?? row.factor),
                    yearRangeCVId: row.yearRangeCVId,
                };
                result = await createUseFactorCVMasterAction(createPayload);
            } else {
                const updatePayload: Omit<UseFactorCVMasterUpdate, 'updatedBy'> = {
                    isActive: row.isActive,
                    typeOfUseId: row.typeOfUseId,
                    subTypeOfUseId: row.subTypeOfUseId,
                    factor: Number(updatedData.factor ?? row.factor),
                    yearRangeCVId: row.yearRangeCVId,
                };
                result = await updateUseFactorCVMasterAction(row.id, updatePayload);
            }

            if (result.success) {
                if (row.id === 0) {
                    addToast('success', tW('common.messages.recordCreatedSuccess'));
                } else {
                    addToast('success', tW('common.messages.recordUpdatedSuccess'));
                }
                setEditableRows((prev) => {
                    const updated = { ...prev };
                    delete updated[rowUid];
                    return updated;
                });
                setTimeout(() => {
                    refreshPage();
                }, 1000);
            } else {
                addToast('error', result.message || (row.id === 0 ? tW('common.messages.createFailed') : tW('common.messages.updateFailed')));
            }
        } catch (_error) {
            addToast('error', tW('common.messages.failedToSaveRow'));
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCancel = (row: UseFactorCVMaster) => {
        const rowUid = getRowUid(row);
        setEditableRows((prev) => {
            const updated = { ...prev };
            delete updated[rowUid];
            return updated;
        });
        addToast('info', tW('common.messages.changesDiscarded'));
    };

    return {
        handleCellChange,
        handleUpdate,
        handleCancel,
    };
}

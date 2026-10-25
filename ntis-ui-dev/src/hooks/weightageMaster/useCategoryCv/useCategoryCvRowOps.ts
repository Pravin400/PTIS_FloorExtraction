"use client";

import { UseFactorCVMaster, UseFactorCVMasterUpdate, UseFactorCVMasterCreate } from "@/types/useCategoryCvFactor.types";
import { updateUseFactorCVMasterAction, createUseFactorCVMasterAction } from "@/app/[locale]/property-tax/weightage-master/sub-type-weightage/action";

interface UseCategoryCvRowOpsProps {
    editableRows: Record<string, UseFactorCVMaster>;
    setEditableRows: React.Dispatch<React.SetStateAction<Record<string, UseFactorCVMaster>>>;
    setIsUpdating: (val: boolean) => void;
    getRowUid: (row: UseFactorCVMaster) => string;
    findRowByUid: (uid: string) => UseFactorCVMaster | undefined;
    addToast: (type: "success" | "error" | "info" | "warning", message: string) => void;
    refreshPage: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tW: (key: string, values?: Record<string, any>) => string;
    /** Called after a successful create/update so the "pending records" count can
     *  be refreshed to reflect what actually changed. */
    onDataChanged: () => void;
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
    onDataChanged,
}: UseCategoryCvRowOpsProps) {

    const handleCellChange = (rowId: string, columnId: string, value: number) => {
        if (value < 0) {
            addToast('error', tW('common.messages.negativeValuesNotAllowed'));
            return;
        }
        if (value > 999999) {
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
        const factorValue = updatedData.factor ?? row.factor;
        if (factorValue < 0.1) {
            addToast("error", tW('common.messages.validFactorRequired') || "Please enter a valid factor value greater than 0");
            return;
        }
        if (factorValue > 100) {
            addToast("error", tW('common.messages.factorPercentageExceedsMax'));
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
                onDataChanged();
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

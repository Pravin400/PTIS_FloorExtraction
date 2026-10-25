"use client";

import { Dispatch, SetStateAction } from "react";
import { useTranslations } from "next-intl";
import {
    NatureFactorCVMaster,
    NatureFactorCVMasterCreate,
    NatureFactorCVMasterUpdate
} from "@/types/natureofbuilding-cv-weightageMaster.types";
import {
    updateNatureFactorCVMasterAction,
    createNatureFactorCVMasterAction,
} from "@/app/[locale]/property-tax/weightage-master/nature-weightage/actions";
import { getUserIdFromCookie } from "@/lib/utils/cookie";


export interface UseNatureFactorCvRowOpsParams {
    data: NatureFactorCVMaster[];
    editableRows: Record<string, NatureFactorCVMaster>;
    setEditableRows: Dispatch<SetStateAction<Record<string, NatureFactorCVMaster>>>;
    setIsUpdating: Dispatch<SetStateAction<boolean>>;
    getRowUid: (row: NatureFactorCVMaster) => string;
    findRowByUid: (uid: string) => NatureFactorCVMaster | undefined;
    addToast: (type: "success" | "error" | "info" | "warning", message: string) => void;
    refreshPage: () => void;
    clearFilters: () => void;
    /** Called after a successful create/update so the "pending records" count can
     *  be refreshed to reflect what actually changed. */
    onDataChanged: () => void;
}

export function useNatureFactorCvRowOps({
    editableRows,
    setEditableRows,
    setIsUpdating,
    getRowUid,
    findRowByUid,
    addToast,
    refreshPage,
    clearFilters,
    onDataChanged,
}: UseNatureFactorCvRowOpsParams) {
    const tW = useTranslations("weightageMaster");

    const handleCellChange = (rowId: string, columnId: string, value: number): void => {
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
            const updatedRow: NatureFactorCVMaster = {
                ...originalRow,
                ...(existingEdit || {}),
                [columnId]: value >= 0 ? value : (originalRow as unknown as Record<string, string | number | boolean | null | undefined>)[columnId],
            };
            return { ...prev, [rowId]: updatedRow };
        });
    };

    const handleUpdate = async (row: NatureFactorCVMaster): Promise<void> => {
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

        const factor = updatedData.factor ?? row.factor;

        if (factor < 0.1) {
            addToast('error', tW('common.messages.validFactorRequired') || "Please enter a valid factor value greater than 0");
            return;
        }

        if (factor > 100) {
            addToast('error', tW('common.messages.factorPercentageExceedsMax'));
            return;
        }

        const userId = getUserIdFromCookie() || 0;

        setIsUpdating(true);
        try {
            let result;
            if (row.id === 0) {
                const createPayload: NatureFactorCVMasterCreate = {
                    isActive: row.isActive,
                    createdBy: userId,
                    constructionTypeId: row.constructionTypeId,
                    factor: updatedData.factor ?? row.factor,
                    yearRangeCVId: row.yearRangeCVId,
                };
                result = await createNatureFactorCVMasterAction(createPayload);
            } else {
                const updatePayload: NatureFactorCVMasterUpdate = {
                    isActive: row.isActive,
                    updatedBy: userId,
                    constructionTypeId: row.constructionTypeId,
                    factor: updatedData.factor ?? row.factor,
                    yearRangeCVId: row.yearRangeCVId,
                };
                result = await updateNatureFactorCVMasterAction(row.id, updatePayload);
            }

            if (result.success) {
                addToast('success', row.id === 0 ? tW('common.messages.recordCreatedSuccess') : tW('common.messages.recordUpdatedSuccess'));
                setEditableRows((prev) => {
                    const updated = { ...prev };
                    delete updated[rowUid];
                    return updated;
                });
                clearFilters();
                onDataChanged();
                setTimeout(() => refreshPage(), 1000);
            } else {
                addToast('error', result.message || (row.id === 0 ? tW('common.messages.createFailed') : tW('common.messages.updateFailed')));
            }
        } catch (_error) {
            addToast('error', tW('common.messages.failedToSaveRow'));
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCancel = (row: NatureFactorCVMaster): void => {
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

"use client";

import { Dispatch, SetStateAction } from "react";
import { useTranslations } from "next-intl";
import {
    NatureFactorCVMaster,
    NatureFactorCVBulkCreateItem,
    NatureFactorCVBulkUpdateItem
} from "@/types/natureofbuilding-cv-weightageMaster.types";
import {
    bulkCreateNatureFactorCVMasterAction,
    bulkUpdateNatureFactorCVMasterAction
} from "@/app/[locale]/assets/configuration/master-data/weightage-master/nature-weightage/actions";
import { getUserIdFromCookie } from "@/lib/utils/cookie";

export interface UseNatureFactorCvBulkOpsParams {
    data: NatureFactorCVMaster[];
    editableRows: Record<string, NatureFactorCVMaster>;
    setEditableRows: Dispatch<SetStateAction<Record<string, NatureFactorCVMaster>>>;
    setIsBulkUpdating: Dispatch<SetStateAction<boolean>>;
    setIsGeneratingAll: Dispatch<SetStateAction<boolean>>;
    factorValue: string;
    getRowUid: (row: NatureFactorCVMaster) => string;
    findRowByUid: (uid: string) => NatureFactorCVMaster | undefined;
    addToast: (type: "success" | "error" | "info" | "warning", message: string) => void;
    refreshPage: () => void;
    clearFilters: () => void;
}

export function useNatureFactorCvBulkOps({
    data,
    editableRows,
    setEditableRows,
    setIsBulkUpdating,
    setIsGeneratingAll,
    factorValue,
    getRowUid,
    findRowByUid,
    addToast,
    refreshPage,
    clearFilters,
}: UseNatureFactorCvBulkOpsParams) {
    const tW = useTranslations("assetWeightageMaster");

    const handleApplyFilter = (): void => {
        const factor = parseFloat(factorValue);
        if (!factorValue || isNaN(factor) || factor < 0) {
            addToast('warning', tW('common.messages.validFactorRequired'));
            return;
        }

        const updatedRows: Record<string, NatureFactorCVMaster> = {};
        let updatedCount = 0;

        data.forEach((row) => {
            const rowUid = getRowUid(row);
            const existingEdit = editableRows[rowUid];
            const baseRow = { ...row, ...(existingEdit || {}) };
            const newFactor = factor >= 0 ? factor : baseRow.factor;
            if (baseRow.factor !== newFactor) {
                updatedRows[rowUid] = { ...baseRow, factor: newFactor };
                updatedCount++;
            }
        });

        if (updatedCount > 0) {
            setEditableRows(prev => ({ ...prev, ...updatedRows }));
            addToast('success', tW('common.messages.factorApplied', { factor, count: updatedCount }));
        } else {
            addToast('info', tW('common.messages.noChangesDetectedBulk'));
        }
    };

    const handleBulkUpdate = async (): Promise<void> => {
        const updatedRecords = Object.entries(editableRows);

        if (updatedRecords.length === 0) {
            addToast('warning', tW('common.messages.noRecordsToUpdate'));
            return;
        }

        setIsBulkUpdating(true);

        const createPayloadVars: NatureFactorCVBulkCreateItem[] = [];
        const updatePayloadVars: NatureFactorCVBulkUpdateItem[] = [];
        let errorCount = 0;
        const userId = getUserIdFromCookie() || 1;

        for (const [rowUid, updatedData] of updatedRecords) {
            const originalRow = findRowByUid(rowUid);
            if (!originalRow) {
                errorCount++;
                continue;
            }

            const newFactor = updatedData.factor ?? originalRow.factor;
            const hasChanges = originalRow.factor !== newFactor;

            if (hasChanges) {
                if (originalRow.id === 0) {
                    createPayloadVars.push({
                        isActive: originalRow.isActive,
                        createdBy: userId,
                        constructionTypeId: originalRow.constructionTypeId,
                        factor: newFactor,
                        yearRangeCVId: originalRow.yearRangeCVId
                    });
                } else {
                    updatePayloadVars.push({
                        id: originalRow.id,
                        data: {
                            isActive: originalRow.isActive,
                            updatedBy: userId,
                            constructionTypeId: originalRow.constructionTypeId,
                            factor: newFactor,
                            yearRangeCVId: originalRow.yearRangeCVId
                        }
                    });
                }
            }
        }

        try {
            let createdCount = 0;
            let updatedCount = 0;

            if (createPayloadVars.length > 0) {
                const result = await bulkCreateNatureFactorCVMasterAction(createPayloadVars);
                if (result && result.success) createdCount = createPayloadVars.length;
                else errorCount += createPayloadVars.length;
            }

            if (updatePayloadVars.length > 0) {
                const result = await bulkUpdateNatureFactorCVMasterAction(updatePayloadVars);
                if (result && result.success) updatedCount = updatePayloadVars.length;
                else errorCount += updatePayloadVars.length;
            }

            const totalSuccess = createdCount + updatedCount;

            if (totalSuccess > 0 && errorCount === 0) {
                const successMsg = [];
                if (createdCount > 0) successMsg.push(`${createdCount} ${tW("common.messages.created")}`);
                if (updatedCount > 0) successMsg.push(`${updatedCount} ${tW("common.messages.updated")}`);
                addToast('success', tW('common.messages.bulkOperationSuccess', { message: successMsg.join(", ") }));
                setEditableRows({});
                clearFilters();
                setTimeout(() => refreshPage(), 1500);
            } else if (totalSuccess > 0 && errorCount > 0) {
                const successMsg = [];
                if (createdCount > 0) successMsg.push(`${createdCount} ${tW("common.messages.created")}`);
                if (updatedCount > 0) successMsg.push(`${updatedCount} ${tW("common.messages.updated")}`);
                successMsg.push(`${errorCount} ${tW("common.messages.failed")}`);
                addToast('warning', tW('common.messages.bulkOperationPartialSuccess', { message: successMsg.join(", ") }));
                setEditableRows({});
                clearFilters();
                setTimeout(() => refreshPage(), 1500);
            } else if (errorCount > 0) {
                addToast('error', tW('common.messages.bulkOperationFailed'));
            } else {
                addToast('info', tW('common.messages.noChangesDetectedBulk'));
            }
        } catch (_error) {
            addToast('error', tW('common.messages.bulkActionFailed'));
        } finally {
            setIsBulkUpdating(false);
        }
    };

    const handleGenerateAll = async (): Promise<void> => {
        const newRecords = data.filter(row => row.id === 0);
        if (newRecords.length === 0) return;
        setIsGeneratingAll(true);
        const userId = getUserIdFromCookie() || 1;

        try {
            const payload: NatureFactorCVBulkCreateItem[] = newRecords.map(row => {
                const rowUid = getRowUid(row);
                const editedFactor = editableRows[rowUid]?.factor;

                return {
                    isActive: row.isActive,
                    createdBy: userId,
                    constructionTypeId: row.constructionTypeId,
                    factor: editedFactor !== undefined ? editedFactor : row.factor,
                    yearRangeCVId: row.yearRangeCVId
                };
            });

            const result = await bulkCreateNatureFactorCVMasterAction(payload);

            if (result && result.success) {
                addToast('success', tW('common.messages.recordsGeneratedSuccess', { count: newRecords.length }));
                clearFilters();
                setTimeout(() => refreshPage(), 1500);
            } else {
                addToast('error', result?.message || tW('common.messages.generationFailed'));
            }
        } catch (_error) {
            addToast('error', tW('common.messages.generateAllFailed'));
        } finally {
            setIsGeneratingAll(false);
        }
    };

    return {
        handleApplyFilter,
        handleBulkUpdate,
        handleGenerateAll,
    };
}

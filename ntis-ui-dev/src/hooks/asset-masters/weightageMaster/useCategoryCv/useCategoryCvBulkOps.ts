"use client";

import type { Dispatch, SetStateAction } from "react";
import { UseFactorCVMaster, UseFactorCVMasterCreate } from "@/types/useCategoryCvFactor.types";
import { bulkCreateUseFactorCVMasterAction, bulkUpdateUseFactorCVMasterAction } from "@/app/[locale]/assets/configuration/master-data/weightage-master/sub-type-weightage/action";
import { processBulkOperations } from "./useBulkOperationHandler";

interface UseCategoryCvBulkOpsProps {
    data: UseFactorCVMaster[];
    editableRows: Record<string, UseFactorCVMaster>;
    setEditableRows: Dispatch<SetStateAction<Record<string, UseFactorCVMaster>>>;
    setIsBulkUpdating: (val: boolean) => void;
    setIsGeneratingAll: (val: boolean) => void;
    factorValue: string;
    getRowUid: (row: UseFactorCVMaster) => string;
    findRowByUid: (uid: string) => UseFactorCVMaster | undefined;
    addToast: (type: "success" | "error" | "info" | "warning", message: string) => void;
    refreshPage: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tW: (key: string, values?: Record<string, any>) => string;
}

export function useCategoryCvBulkOps({
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
    tW,
}: UseCategoryCvBulkOpsProps) {

    const handleApplyFilter = () => {
        const factor = parseFloat(factorValue);
        if (!factorValue || isNaN(factor) || factor < 0) {
            addToast('warning', tW('common.messages.validFactorRequired'));
            return;
        }

        const updatedRows: Record<string, UseFactorCVMaster> = {};
        let updatedCount = 0;

        data.forEach((row) => {
            const rowUid = getRowUid(row);
            const existingEdit = editableRows[rowUid];
            const baseRow = { ...row, ...(existingEdit || {}) };
            
            // Only update if factor actually changed
            if (baseRow.factor !== factor) {
                updatedRows[rowUid] = {
                    ...baseRow,
                    factor: factor,
                };
                updatedCount++;
            }
        });

        if (updatedCount > 0) {
            setEditableRows(prev => ({ ...prev, ...updatedRows }));
            addToast('success', tW('common.messages.factorApplied', { factor, count: updatedCount }));
        } else {
            addToast('warning', tW('common.messages.noRecordsMatch'));
        }
    };

    const handleBulkUpdate = async () => {
        setIsBulkUpdating(true);

        try {
            const result = await processBulkOperations({
                editableRows,
                findRowByUid,
                bulkCreateAction: bulkCreateUseFactorCVMasterAction,
                bulkUpdateAction: bulkUpdateUseFactorCVMasterAction,
                tW
            });

            // Handle result messaging
            const { success, createdCount, updatedCount, errorCount, message } = result;

            if (!success && errorCount === 0 && createdCount === 0 && updatedCount === 0) {
                // No records to update case
                addToast('warning', message || tW('common.messages.noRecordsToUpdate'));
            } else if (success && errorCount === 0) {
                // Complete success
                addToast('success', message || tW('common.messages.bulkOperationSuccess'));
                setEditableRows({});
                setTimeout(() => refreshPage(), 1500);
            } else if (success && errorCount > 0) {
                // Partial success
                addToast('warning', message || tW('common.messages.bulkOperationPartialSuccess'));
            } else if (errorCount > 0) {
                // Complete failure
                addToast('error', message || tW('common.messages.bulkOperationFailed'));
            } else {
                // No changes detected
                addToast('info', message || tW('common.messages.noChangesDetectedBulk'));
            }
        } catch (_error) {
            addToast('error', tW('common.messages.bulkActionFailed'));
        } finally {
            setIsBulkUpdating(false);
        }
    };

    const handleGenerateAll = async () => {
        const newRecords = data.filter(row => row.id === 0);
        if (newRecords.length === 0) return;

        setIsGeneratingAll(true);
        try {
            const payload: Array<Omit<UseFactorCVMasterCreate, 'createdBy'>> = newRecords.map(row => {
                const rowUid = getRowUid(row);
                const editableRow = editableRows[rowUid];
                // Use user's inline edits if available, otherwise fallback to server values
                const factorToSave = editableRow?.factor ?? row.factor;
                const isActiveToSave = editableRow?.isActive ?? row.isActive;
                
                return {
                    isActive: isActiveToSave,
                    typeOfUseId: row.typeOfUseId,
                    subTypeOfUseId: row.subTypeOfUseId,
                    factor: factorToSave,
                    yearRangeCVId: row.yearRangeCVId
                };
            });

            const result = await bulkCreateUseFactorCVMasterAction(payload);

            if (result && result.success) {
                addToast('success', tW('common.messages.recordsGeneratedSuccess', { count: newRecords.length }));
                setEditableRows({}); // Clear edits after successful generation
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

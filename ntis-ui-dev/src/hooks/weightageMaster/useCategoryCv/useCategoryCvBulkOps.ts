"use client";

import { UseFactorCVMaster, UseFactorCVMasterCreate } from "@/types/useCategoryCvFactor.types";
import {
    bulkCreateUseFactorCVMasterAction,
    bulkUpdateUseFactorCVMasterAction,
    fetchUseFactorCVMasterPagedServerAction,
} from "@/app/[locale]/property-tax/weightage-master/sub-type-weightage/action";
import { processBulkOperations } from "./useBulkOperationHandler";

interface UseCategoryCvBulkOpsProps {
    data: UseFactorCVMaster[];
    editableRows: Record<string, UseFactorCVMaster>;
    setEditableRows: React.Dispatch<React.SetStateAction<Record<string, UseFactorCVMaster>>>;
    setIsBulkUpdating: (val: boolean) => void;
    setIsGeneratingAll: (val: boolean) => void;
    selectedYear: string;
    typeOfUseId: string;
    factorValue: string;
    getRowUid: (row: UseFactorCVMaster) => string;
    findRowByUid: (uid: string) => UseFactorCVMaster | undefined;
    addToast: (type: "success" | "error" | "info" | "warning", message: string) => void;
    refreshPage: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tW: (key: string, values?: Record<string, any>) => string;
    /** Called after a successful bulk update / generate-all so the "pending records"
     *  count can be refreshed to reflect what actually changed. */
    onDataChanged: () => void;
}

export function useCategoryCvBulkOps({
    data,
    editableRows,
    setEditableRows,
    setIsBulkUpdating,
    setIsGeneratingAll,
    selectedYear,
    typeOfUseId,
    factorValue,
    getRowUid,
    findRowByUid,
    addToast,
    refreshPage,
    tW,
    onDataChanged,
}: UseCategoryCvBulkOpsProps) {

    const handleApplyFilter = () => {
        const factor = parseFloat(factorValue);
        if (!factorValue || isNaN(factor) || factor < 0.1) {
            addToast('warning', tW('common.messages.validFactorRequired'));
            return;
        }

        if (factor > 100) {
            addToast('warning', tW('common.messages.factorPercentageExceedsMax'));
            return;
        }

        const updatedRows: Record<string, UseFactorCVMaster> = {};
        let updatedCount = 0;

        data.forEach((row) => {
            // Inactive records are non-editable — leave them untouched by bulk factor apply.
            if (row.isActive === false) return;

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
                onDataChanged();
                setTimeout(() => refreshPage(), 1500);
            } else if (success && errorCount > 0) {
                // Partial success
                addToast('warning', message || tW('common.messages.bulkOperationPartialSuccess'));
                onDataChanged();
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

    // Fetches the full, unpaginated dataset (real + placeholder rows for every missing
    // Type-of-Use/Year combination) on demand at click time, so this covers the whole
    // matrix, not just the currently-rendered page, without eagerly re-fetching it on
    // every page load.
    const handleGenerateAll = async () => {
        setIsGeneratingAll(true);
        try {
            const allUseFactorsResult = await fetchUseFactorCVMasterPagedServerAction(
                1,
                -1,
                undefined,
                selectedYear,
                typeOfUseId ? Number(typeOfUseId) : undefined,
                undefined,
                undefined,
                undefined
            );
            const newRecords = allUseFactorsResult.items.filter(row => row.id === 0);
            if (newRecords.length === 0) {
                addToast('info', tW('common.messages.allRecordsExist'));
                return;
            }

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
                onDataChanged();
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

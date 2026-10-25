"use client";

import { Dispatch, SetStateAction } from "react";
import { useTranslations } from "next-intl";
import { 
    FloorFactorCVMaster, 
    FloorFactorCVMasterCreateAction, 
    FloorFactorCVBulkUpdateActionItem,
    BulkFloorFactorCVMasterCreateAction
} from "@/types/floor-cv-weightageMaster.types";
import {
    bulkCreateFloorFactorCVMasterAction,
    bulkUpdateFloorFactorCVMasterAction,
    fetchAllFloorFactorCVMasterAction,
} from "@/app/[locale]/property-tax/weightage-master/action";
import type { Option } from "@/components/common";


export interface UseFloorCvBulkOpsParams {
    data: FloorFactorCVMaster[];
    editableRows: Record<string, FloorFactorCVMaster>;
    setEditableRows: Dispatch<SetStateAction<Record<string, FloorFactorCVMaster>>>;
    setIsBulkUpdating: Dispatch<SetStateAction<boolean>>;
    setIsGeneratingAll: Dispatch<SetStateAction<boolean>>;
    sessionCreatedUids: Set<string>;
    setSessionCreatedUids: Dispatch<SetStateAction<Set<string>>>;
    selectedYear: string;
    fromFloor: string;
    toFloor: string;
    liftStatus: string;
    factorValue: string;
    getRowUid: (row: FloorFactorCVMaster) => string;
    findRowByUid: (uid: string) => FloorFactorCVMaster | undefined;
    addToast: (type: "success" | "error" | "info" | "warning", message: string) => void;
    refreshPage: () => void;
    clearFilters: () => void;
    floorOptions: Option[];
    /** Called after a successful bulk update / generate-all so the "pending records"
     *  count can be refreshed to reflect what actually changed. */
    onDataChanged: () => void;
}

export function useFloorCvBulkOps({
    data,
    editableRows,
    setEditableRows,
    sessionCreatedUids,
    setSessionCreatedUids,
    setIsBulkUpdating,
    setIsGeneratingAll,
    selectedYear,
    fromFloor,
    toFloor,
    liftStatus,
    factorValue,
    getRowUid,
    findRowByUid,
    addToast,
    refreshPage,
    clearFilters,
    floorOptions,
    onDataChanged,
}: UseFloorCvBulkOpsParams) {
    const t = useTranslations("floorFactorMaster");
    const tW = useTranslations("weightageMaster");

    // Handle filter apply with bulk factor update
    const handleApplyFilter = (): void => {
        // Apply bulk factor changes to filtered records

        // Validate assessment year is selected first
        if (!selectedYear) {
            addToast("error", tW("common.messages.assessmentYearRequired"));
            return;
        }

        const factor = parseFloat(factorValue);

        // Prevent non-positive factors
        if (factor < 0.1) {
            addToast("error", tW("common.messages.validFactorRequired"));
            return;
        }

        if (factor > 100) {
            addToast("error", tW("common.messages.factorPercentageExceedsMax"));
            return;
        }

        if (!factorValue || isNaN(factor)) {
            addToast("warning", tW("common.messages.validFactorRequired"));
            return;
        }

        // Validation for From/To floor selection
        const fromIndex = floorOptions.findIndex(o => o.value === fromFloor);
        const toIndex = floorOptions.findIndex(o => o.value === toFloor);

        if (fromFloor && toFloor && fromIndex > -1 && toIndex > -1 && fromIndex > toIndex) {
            addToast("error", t("messages.fromFloorGreaterError"));
            return;
        }

        const updatedRows: Record<string, FloorFactorCVMaster> = {};
        let updatedCount = 0;
        data.forEach((row) => {
            // Inactive records are non-editable — leave them untouched by bulk factor apply.
            if (row.isActive === false) return;

            const rowUid = getRowUid(row);
            const rowFloorIndex = floorOptions.findIndex(o => o.value === String(row.floorId));

            const isInRange =
                (!fromFloor || rowFloorIndex >= fromIndex) &&
                (!toFloor || rowFloorIndex <= toIndex);
            if (isInRange) {
                const existingEdit = editableRows[rowUid];
                const baseRow = {
                    ...row,
                    ...(existingEdit || {}),
                };
                // Only allow positive values for factors
                if (liftStatus === "both") {
                    updatedRows[rowUid] = {
                        ...baseRow,
                        factorWithLift: factor >= 0 ? factor : baseRow.factorWithLift,
                        factorWithoutLift: factor >= 0 ? factor : baseRow.factorWithoutLift,
                    };
                } else if (liftStatus === "withLift") {
                    updatedRows[rowUid] = {
                        ...baseRow,
                        factorWithLift: factor >= 0 ? factor : baseRow.factorWithLift,
                    };
                } else if (liftStatus === "withoutLift") {
                    updatedRows[rowUid] = {
                        ...baseRow,
                        factorWithoutLift: factor >= 0 ? factor : baseRow.factorWithoutLift,
                    };
                }
                updatedCount++;
            }
        });
        if (updatedCount > 0) {
            setEditableRows((prev) => {
                const merged = { ...prev, ...updatedRows };
                return merged;
            });
            addToast("success", tW("common.messages.factorApplied", { factor, count: updatedCount }));
        } else {
            addToast("warning", tW("common.messages.noRecordsMatch"));
        }
    };

    // Handle bulk update from header
    const handleBulkUpdate = async (): Promise<void> => {
        const updatedRecords = Object.entries(editableRows);

        if (updatedRecords.length === 0) {
            addToast("warning", tW("common.messages.noRecordsToUpdate"));
            return;
        }

        setIsBulkUpdating(true);

        const createPayloadVars: FloorFactorCVMasterCreateAction[] = [];
        const updatePayloadVars: FloorFactorCVBulkUpdateActionItem[] = [];
        const createdUids: string[] = [];
        let errorCount = 0;

        for (const [rowUid, updatedData] of updatedRecords) {
            const originalRow = findRowByUid(rowUid);
            if (!originalRow || sessionCreatedUids.has(rowUid)) {
                errorCount++;
                continue;
            }

            const newFactorWithLift = updatedData.factorWithLift ?? originalRow.factorWithLift;
            const newFactorWithoutLift = updatedData.factorWithoutLift ?? originalRow.factorWithoutLift;

            const hasChanges =
                originalRow.factorWithLift !== newFactorWithLift ||
                originalRow.factorWithoutLift !== newFactorWithoutLift;

            if (hasChanges) {
                if (originalRow.id === 0) {
                    createPayloadVars.push({
                        isActive: originalRow.isActive,
                        floorId: originalRow.floorId,
                        factorWithLift: newFactorWithLift,
                        factorWithoutLift: newFactorWithoutLift,
                        yearRangeCVId: originalRow.yearRangeCVID ?? originalRow.yearRangeCVId ?? 0,
                    });
                    createdUids.push(rowUid);
                } else {
                    updatePayloadVars.push({
                        id: originalRow.id,
                        data: {
                            isActive: originalRow.isActive,
                            floorId: originalRow.floorId,
                            factorWithLift: newFactorWithLift,
                            factorWithoutLift: newFactorWithoutLift,
                            yearRangeCVId: originalRow.yearRangeCVID ?? originalRow.yearRangeCVId ?? 0,
                        }
                    });
                }
            }
        }

        try {
            let createdCount = 0;
            let updatedCount = 0;

            if (createPayloadVars.length > 0) {
                const result = await bulkCreateFloorFactorCVMasterAction(createPayloadVars);
                if (result && result.success) {
                    createdCount = createPayloadVars.length;
                    setSessionCreatedUids((prev) => new Set([...prev, ...createdUids]));
                } else {
                    errorCount += createPayloadVars.length;
                }
            }

            if (updatePayloadVars.length > 0) {
                const result = await bulkUpdateFloorFactorCVMasterAction(updatePayloadVars);
                if (result && result.success) {
                    updatedCount = updatePayloadVars.length;
                } else {
                    errorCount += updatePayloadVars.length;
                }
            }

            const totalSuccess = createdCount + updatedCount;

            if (totalSuccess > 0 && errorCount === 0) {
                const successMsg = [];
                if (createdCount > 0) successMsg.push(`${createdCount} ${tW("common.messages.created")}`);
                if (updatedCount > 0) successMsg.push(`${updatedCount} ${tW("common.messages.updated")}`);
                addToast("success", tW("common.messages.bulkOperationSuccess", { message: successMsg.join(", ") }));
                setEditableRows({});
                // Clear filters after successful bulk update
                clearFilters();
                onDataChanged();
                setTimeout(() => { refreshPage(); }, 1500);
            } else if (totalSuccess > 0 && errorCount > 0) {
                const successMsg = [];
                if (createdCount > 0) successMsg.push(`${createdCount} ${tW("common.messages.created")}`);
                if (updatedCount > 0) successMsg.push(`${updatedCount} ${tW("common.messages.updated")}`);
                successMsg.push(`${errorCount} ${tW("common.messages.failed")}`);
                addToast("warning", tW("common.messages.bulkOperationPartialSuccess", { message: successMsg.join(", ") }));
                setEditableRows({});
                // Clear filters after partial success
                clearFilters();
                onDataChanged();
                setTimeout(() => { refreshPage(); }, 1500);
            } else if (errorCount > 0) {
                addToast("error", tW("common.messages.bulkOperationFailed"));
            } else {
                addToast("info", tW("common.messages.noChangesDetectedBulk"));
            }
        } catch (_error) {
            addToast("error", tW("common.messages.bulkActionFailed"));
        } finally {
            setIsBulkUpdating(false);
        }
    };

    // Handle Generate All uncreated records. Fetches the full, unpaginated dataset
    // (real + placeholder rows for every missing Floor/Year combination) on demand
    // at click time, so this covers the whole matrix, not just the currently-rendered
    // page, without eagerly re-fetching it on every page load.
    const handleGenerateAll = async (): Promise<void> => {
        setIsGeneratingAll(true);
        try {
            const allFloorFactors = await fetchAllFloorFactorCVMasterAction(selectedYear);
            const newRecords = allFloorFactors.filter((row) => row.id === 0 && !sessionCreatedUids.has(getRowUid(row)));
            if (newRecords.length === 0) {
                addToast("info", tW("common.messages.allRecordsExist"));
                return;
            }

            const createdUids: string[] = [];
            const payload: BulkFloorFactorCVMasterCreateAction = newRecords.map((row) => {
                const rowUid = getRowUid(row);
                createdUids.push(rowUid);
                const editedRow = editableRows[rowUid];

                return {
                    isActive: row.isActive,
                    floorId: row.floorId,
                    factorWithLift: editedRow?.factorWithLift ?? row.factorWithLift,
                    factorWithoutLift: editedRow?.factorWithoutLift ?? row.factorWithoutLift,
                    yearRangeCVId: row.yearRangeCVID ?? row.yearRangeCVId ?? 0,
                };
            });

            const result = await bulkCreateFloorFactorCVMasterAction(payload);

            if (result && result.success) {
                addToast("success", tW("common.messages.recordsGeneratedSuccess", { count: newRecords.length }));
                setSessionCreatedUids((prev) => new Set([...prev, ...createdUids]));
                onDataChanged();
                setTimeout(() => { refreshPage(); }, 1500);
            } else {
                addToast("error", result?.message || tW("common.messages.generationFailed"));
            }
        } catch (_error) {
            addToast("error", tW("common.messages.generateAllFailed"));
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

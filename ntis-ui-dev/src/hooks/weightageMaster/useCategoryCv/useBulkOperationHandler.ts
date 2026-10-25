import { UseFactorCVMaster, UseFactorCVMasterCreate, UseFactorCVMasterUpdate } from "@/types/useCategoryCvFactor.types";

/**
 * Configuration for bulk operation handler
 */
interface BulkOperationConfig<TRow> {
    editableRows: Record<string, TRow>;
    findRowByUid: (uid: string) => TRow | undefined;
    bulkCreateAction: (payload: Array<Omit<UseFactorCVMasterCreate, 'createdBy'>>) => Promise<{ success: boolean; message?: string }>;
    bulkUpdateAction: (payload: Array<{ id: number; data: Omit<UseFactorCVMasterUpdate, 'updatedBy'> }>) => Promise<{ success: boolean; message?: string }>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tW: (key: string, values?: Record<string, any>) => string;
}

/**
 * Result of bulk operation
 */
interface BulkOperationResult {
    success: boolean;
    createdCount: number;
    updatedCount: number;
    errorCount: number;
    message?: string;
}

/**
 * Processes bulk create and update operations for UseFactorCVMaster records
 * This utility can be reused across similar bulk operation features
 * 
 * @param config Configuration object containing actions, data, and utilities
 * @returns Result object with operation statistics and success status
 */
export async function processBulkOperations(
    config: BulkOperationConfig<UseFactorCVMaster>
): Promise<BulkOperationResult> {
    const { editableRows, findRowByUid, bulkCreateAction, bulkUpdateAction, tW } = config;
    
    const updatedRecords = Object.entries(editableRows);

    if (updatedRecords.length === 0) {
        return {
            success: false,
            createdCount: 0,
            updatedCount: 0,
            errorCount: 0,
            message: tW('common.messages.noRecordsToUpdate')
        };
    }

    const createPayloadVars: Array<Omit<UseFactorCVMasterCreate, 'createdBy'>> = [];
    const updatePayloadVars: Array<{ id: number; data: Omit<UseFactorCVMasterUpdate, 'updatedBy'> }> = [];
    let errorCount = 0;

    // Separate records into create and update payloads
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
                    typeOfUseId: originalRow.typeOfUseId,
                    subTypeOfUseId: originalRow.subTypeOfUseId,
                    factor: newFactor,
                    yearRangeCVId: originalRow.yearRangeCVId
                });
            } else {
                updatePayloadVars.push({
                    id: originalRow.id,
                    data: {
                        isActive: originalRow.isActive,
                        typeOfUseId: originalRow.typeOfUseId,
                        subTypeOfUseId: originalRow.subTypeOfUseId,
                        factor: newFactor,
                        yearRangeCVId: originalRow.yearRangeCVId
                    }
                });
            }
        }
    }

    let createdCount = 0;
    let updatedCount = 0;

    // Execute bulk create
    if (createPayloadVars.length > 0) {
        const result = await bulkCreateAction(createPayloadVars);
        if (result && result.success) {
            createdCount = createPayloadVars.length;
        } else {
            errorCount += createPayloadVars.length;
        }
    }

    // Execute bulk update
    if (updatePayloadVars.length > 0) {
        const result = await bulkUpdateAction(updatePayloadVars);
        if (result && result.success) {
            updatedCount = updatePayloadVars.length;
        } else {
            errorCount += updatePayloadVars.length;
        }
    }

    const totalSuccess = createdCount + updatedCount;

    // Determine message based on results
    let message = '';
    if (totalSuccess > 0 && errorCount === 0) {
        const parts: string[] = [];
        if (createdCount > 0) parts.push(`${createdCount} ${tW('common.messages.created')}`);
        if (updatedCount > 0) parts.push(`${updatedCount} ${tW('common.messages.updated')}`);
        message = tW('common.messages.bulkOperationSuccess', { message: parts.join(', ') });
    } else if (totalSuccess > 0 && errorCount > 0) {
        const parts: string[] = [];
        if (createdCount > 0) parts.push(`${createdCount} ${tW('common.messages.created')}`);
        if (updatedCount > 0) parts.push(`${updatedCount} ${tW('common.messages.updated')}`);
        parts.push(`${errorCount} ${tW('common.messages.failed')}`);
        message = tW('common.messages.bulkOperationPartialSuccess', { message: parts.join(', ') });
    } else if (errorCount > 0) {
        message = tW('common.messages.bulkOperationFailed');
    } else {
        message = tW('common.messages.noChangesDetectedBulk');
    }

    return {
        success: totalSuccess > 0,
        createdCount,
        updatedCount,
        errorCount,
        message
    };
}

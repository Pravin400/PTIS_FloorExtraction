import { 
    AgeFactorCVMaster, 
    BulkAgeFactorCVMasterCreate, 
    BulkAgeFactorCVMasterUpdate 
} from "@/types/ageFactorCv.types";
import type { Option } from "@/components/common/select";
import { buildGenerationPayloadForYear } from "./ageFactorCvPayloadBuilders";

/**
 * Prepares the create and update payloads for bulk operations from editable state.
 */
export const prepareBulkUpdatePayloads = (
    editableEntries: [string, AgeFactorCVMaster][],
    findRowByUid: (uid: string) => AgeFactorCVMaster | undefined,
    selectedYear: string,
    userId: number
): { creates: BulkAgeFactorCVMasterCreate; updates: BulkAgeFactorCVMasterUpdate } => {
    const creates: BulkAgeFactorCVMasterCreate = [];
    const updates: BulkAgeFactorCVMasterUpdate = [];

    for (const [uid, updatedData] of editableEntries) {
        const originalRow = findRowByUid(uid);
        if (!originalRow) continue;

        const originalYearId = Number(originalRow.yearRangeCVId || originalRow.yearRangeCVID || 0);
        const yearId = parseInt(selectedYear) || originalYearId;

        if (originalRow.id === 0) {
            creates.push({
                isActive: true,
                createdBy: userId,
                constructionTypeId: originalRow.constructionTypeId,
                ageFrom: originalRow.ageFrom,
                ageTo: originalRow.ageTo,
                factor: updatedData.factor,
                yearRangeCVId: yearId
            });
        } else if (originalRow.factor !== updatedData.factor) {
            updates.push({
                id: originalRow.id,
                data: {
                    ageFactorId: originalRow.id,
                    constructionTypeId: originalRow.constructionTypeId,
                    ageFrom: originalRow.ageFrom,
                    ageTo: originalRow.ageTo,
                    factor: updatedData.factor,
                    yearRangeCVId: yearId,
                    isActive: originalRow.isActive,
                    updatedBy: userId
                }
            });
        }
    }

    return { creates, updates };
};

interface BuildGenerateAllParams {
    selectedYear: string;
    selectedAgeRange: string | string[];
    ageRangeOptions: Option[];
    data: AgeFactorCVMaster[];
    constructionType: string | string[];
    constructionTypeOptions: Option[];
    allAgeFactors: AgeFactorCVMaster[];
    editableRows: Record<string, AgeFactorCVMaster>;
    defaultFactor: number;
    userId: number;
    sessionCreatedUids: Set<string>;
    getRowUid: (row: AgeFactorCVMaster) => string;
}

/**
 * Orchestrates the payload building for all missing age factor records.
 */
export const buildGenerateAllPayload = (params: BuildGenerateAllParams): BulkAgeFactorCVMasterCreate => {
    const ageFactors: BulkAgeFactorCVMasterCreate = [];
    const { selectedYear } = params;

    const yearsToProcess = selectedYear ? [selectedYear] : [];
    
    yearsToProcess.forEach(yearIdStr => {
        const yearId = parseInt(yearIdStr);
        if (isNaN(yearId)) return;
        
        ageFactors.push(...buildGenerationPayloadForYear(yearId, params));
    });

    return ageFactors;
};

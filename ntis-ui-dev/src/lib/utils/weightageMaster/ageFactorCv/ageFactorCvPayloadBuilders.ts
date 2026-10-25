import { 
    AgeFactorCVMaster, 
    BulkAgeFactorCVMasterCreate
} from "@/types/ageFactorCv.types";
import type { Option } from "@/components/common/select";
import { 
    parseRangeValue, 
    hasExistingAgeFactor 
} from "./ageFactorCvValidation";

interface BuildGenerationParams {
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
 * Determines the factor value for a row being generated, 
 * checking editable state and current data first.
 */
export const resolveFactorForGeneratedRow = ({
    constructionTypeId,
    targetYearId,
    ageFrom,
    ageTo,
    editableRows,
    data,
    sessionCreatedUids,
    getRowUid,
    defaultFactor
}: {
    constructionTypeId: number,
    targetYearId: number,
    ageFrom: number,
    ageTo: number,
    editableRows: Record<string, AgeFactorCVMaster>,
    data: AgeFactorCVMaster[],
    sessionCreatedUids: Set<string>,
    getRowUid: (row: AgeFactorCVMaster) => string,
    defaultFactor: number
}) => {
    const reconstructedUid = `0-${constructionTypeId}-${targetYearId}-${ageFrom}-${ageTo}`;
    const edit = editableRows[reconstructedUid];

    if (edit?.factor !== undefined) {
        return edit.factor;
    }

    const pendingRow = data.find(r =>
        r.id === 0 &&
        r.constructionTypeId === constructionTypeId &&
        (r.yearRangeCVId === targetYearId || r.yearRangeCVID === targetYearId) &&
        r.ageFrom === ageFrom &&
        r.ageTo === ageTo &&
        !sessionCreatedUids.has(getRowUid(r))
    );

    return pendingRow?.factor ?? defaultFactor;
};

/**
 * Builds the payload of new records for a specific year.
 */
export const buildGenerationPayloadForYear = (
    targetYearId: number,
    params: BuildGenerationParams
): BulkAgeFactorCVMasterCreate => {
    const {
        constructionType,
        constructionTypeOptions,
        selectedAgeRange,
        ageRangeOptions,
        data,
        allAgeFactors,
        userId
    } = params;
    
    const generatedRows: BulkAgeFactorCVMasterCreate = [];

    const selectedConstructionTypes = Array.isArray(constructionType)
        ? constructionType
        : (constructionType ? [constructionType] : []);
    const typesToProcess = selectedConstructionTypes.length > 0
        ? constructionTypeOptions.filter(ct => selectedConstructionTypes.includes(ct.value))
        : constructionTypeOptions;

    typesToProcess.forEach(constTypeOpt => {
        const constructionTypeId = parseInt(constTypeOpt.value);
        if (isNaN(constructionTypeId)) return;

        const selectedAgeRanges = Array.isArray(selectedAgeRange)
            ? selectedAgeRange
            : (selectedAgeRange ? [selectedAgeRange] : []);

        let rangesToProcess: string[] = [];
        if (selectedAgeRanges.length > 0) {
            rangesToProcess = selectedAgeRanges;
        } else if (ageRangeOptions.length > 0) {
            rangesToProcess = ageRangeOptions.map(o => o.value);
        } else {
            const pendingRanges = new Set<string>();
            data.forEach(row => {
                if (row.ageFrom !== undefined && row.ageTo !== undefined) {
                    pendingRanges.add(`${row.ageFrom}-${row.ageTo}`);
                }
            });
            rangesToProcess = Array.from(pendingRanges);
        }

        rangesToProcess.forEach(rangeVal => {
            const parsedRange = parseRangeValue(rangeVal);
            if (!parsedRange) return;
            const { ageFrom, ageTo } = parsedRange;

            if (hasExistingAgeFactor(constructionTypeId, targetYearId, ageFrom, ageTo, allAgeFactors)) {
                return;
            }

            generatedRows.push({
                isActive: true,
                createdBy: userId,
                constructionTypeId,
                ageFrom,
                ageTo,
                factor: resolveFactorForGeneratedRow({
                    constructionTypeId,
                    targetYearId,
                    ageFrom,
                    ageTo,
                    ...params
                }),
                yearRangeCVId: targetYearId
            });
        });
    });

    return generatedRows;
};

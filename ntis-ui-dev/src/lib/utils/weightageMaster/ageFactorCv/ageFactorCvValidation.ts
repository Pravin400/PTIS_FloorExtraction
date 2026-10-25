import { AgeFactorCVMaster } from "@/types/ageFactorCv.types";

/**
 * Parses a range string like "0-10" into { ageFrom: number, ageTo: number }.
 */
export const parseRangeValue = (rangeVal: string) => {
    const [ageFrom, ageTo] = rangeVal.split("-").map(Number);
    if (isNaN(ageFrom) || isNaN(ageTo)) {
        return null;
    }
    return { ageFrom, ageTo };
};

/**
 * Generates a unique identifier for an AgeFactorCVMaster record.
 * Uses ID for existing records and a composite key for unsaved records.
 */
export const getAgeFactorRowUid = (row: AgeFactorCVMaster): string => {
    const yearId = row.yearRangeCVId || row.yearRangeCVID || 'noYear';
    return row.id !== 0
        ? row.id.toString()
        : `${row.id}-${row.constructionTypeId}-${yearId}-${row.ageFrom}-${row.ageTo}`;
};

/**
 * Checks if an age factor record already exists in the database.
 * This serves as duplicate checking against persistent storage.
 */
export const hasExistingAgeFactor = (
    constructionTypeId: number,
    targetYearId: number,
    ageFrom: number,
    ageTo: number,
    allAgeFactors: AgeFactorCVMaster[]
) =>
    allAgeFactors.some(r =>
        r.id > 0 &&
        r.constructionTypeId === constructionTypeId &&
        (r.yearRangeCVId === targetYearId || r.yearRangeCVID === targetYearId) &&
        r.ageFrom === ageFrom &&
        r.ageTo === ageTo
    );

/**
 * Validates the factor input value.
 */
export const validateFactorValue = (factorValue: string): { isValid: boolean; factor: number } => {
    const factor = parseFloat(factorValue);
    if (isNaN(factor) || factor < 0.1 || factor > 100) {
        return { isValid: false, factor: 0 };
    }
    return { isValid: true, factor };
};

/**
 * Checks if a row matches the given filter criteria.
 */
export const matchesFilterCriteria = (
    row: AgeFactorCVMaster,
    criteria: {
        constructionType: string | string[];
        selectedAgeRange: string | string[];
        ageFrom: string;
        ageTo: string;
        selectedYear: string;
    }
): boolean => {
    const { constructionType, selectedAgeRange, ageFrom, ageTo, selectedYear } = criteria;

    const selectedConstructionTypes = Array.isArray(constructionType)
        ? constructionType
        : (constructionType ? [constructionType] : []);
    const matchesConstruction = selectedConstructionTypes.length === 0 ||
        selectedConstructionTypes.map(Number).includes(row.constructionTypeId);

    const selectedAgeRanges = Array.isArray(selectedAgeRange)
        ? selectedAgeRange
        : (selectedAgeRange ? [selectedAgeRange] : []);

    let matchesAge = true;
    if (selectedAgeRanges.length > 0) {
        matchesAge = selectedAgeRanges.some((range) => {
            const [minAge, maxAge] = range.split("-").map(Number);
            return row.ageFrom === minAge && row.ageTo === maxAge;
        });
    } else if (ageFrom || ageTo) {
        matchesAge = (!ageFrom || row.ageFrom >= parseInt(ageFrom)) &&
            (!ageTo || row.ageTo <= parseInt(ageTo));
    }

    const rowYearId = row.yearRangeCVId || row.yearRangeCVID || 0;
    const matchesYear = !selectedYear || Number(rowYearId) === parseInt(selectedYear);

    return matchesConstruction && matchesAge && matchesYear;
};

/**
 * Checks if a new age range overlaps with any existing age ranges.
 * Returns { hasOverlap: boolean, overlappingRange?: string }
 * 
 * Two ranges overlap if: (newFrom <= existingTo) AND (newTo >= existingFrom)
 * Examples:
 * - Existing: 0-5, New: 2-4 => Overlap (completely within)
 * - Existing: 0-5, New: 3-10 => Overlap (partial)
 * - Existing: 0-5, 11-15, New: 6-10 => No overlap (fits between)
 */
export const checkAgeRangeOverlap = (
    newFrom: number,
    newTo: number,
    existingRanges: string[]
): { hasOverlap: boolean; overlappingRange?: string } => {
    for (const rangeStr of existingRanges) {
        const parsed = parseRangeValue(rangeStr);
        if (!parsed) continue;
        
        const { ageFrom: existingFrom, ageTo: existingTo } = parsed;
        
        // Check if ranges overlap
        // Overlap occurs when: (newFrom <= existingTo) AND (newTo >= existingFrom)
        if (newFrom <= existingTo && newTo >= existingFrom) {
            return {
                hasOverlap: true,
                overlappingRange: rangeStr
            };
        }
    }
    
    return { hasOverlap: false };
};

import React from "react";
import { 
    fetchAgeFactorCVMasterPagedServerAction, 
    fetchConstructionTypePagedAction, 
    fetchAllAgeFactorsAction 
} from "./action";

import { getAssessmentYearsPagedServerCV } from "@/lib/api/floor-cv-weightageMaster.service";
import AgeFactorCvWeightageMaster from "@/components/modules/property-tax/weightage-mastercv/ageFactorCv/AgeFactorCvWeightageMaster";
import { PagePropsAgeFactor, AgeFactorCVMasterSearchParams } from "@/types/ageFactorCv.types";


// Pagination constraints
const MIN_PAGE = 1;
const MAX_PAGE = 10_000;
const MIN_PAGE_SIZE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

/**
 * Sanitizes and clamps query-string parameters before they reach the server action.
 * Malformed values (e.g. ?page=-1) are normalized to safe defaults.
 */
function sanitizeParams(raw: AgeFactorCVMasterSearchParams) {
    const rawPage = parseInt(raw.page ?? "", 10);
    const pageNumber = Number.isFinite(rawPage)
        ? Math.min(Math.max(rawPage, MIN_PAGE), MAX_PAGE)
        : MIN_PAGE;

    const rawPageSize = parseInt(raw.pageSize ?? "", 10);
    const pageSize = Number.isFinite(rawPageSize)
        ? Math.min(Math.max(rawPageSize, MIN_PAGE_SIZE), MAX_PAGE_SIZE)
        : DEFAULT_PAGE_SIZE;

    const searchTerm = raw.q?.trim() || undefined;
    
    // Validate that IDs are actually numeric to prevent NaN propagation
    const rawYear = raw.selectedYearRange?.trim();
    const selectedYearRange = (rawYear && Number.isFinite(Number(rawYear))) ? rawYear : undefined;

    const rawConst = raw.constructionType?.trim();
    const constructionTypeIds = rawConst
        ? rawConst.split(",").map((v) => Number(v.trim())).filter((n) => Number.isFinite(n) && n > 0)
        : [];
    const constructionType = constructionTypeIds.length > 0 ? constructionTypeIds.join(",") : undefined;
    
    const allowedSortFields = ["ConstructionCode", "ConstructionDescription", "AgeFrom", "AgeTo", "FromYear"];
    const sortByRaw = raw.sortBy?.trim();
    const sortBy = allowedSortFields.includes(sortByRaw ?? "") ? sortByRaw : undefined;

    const sortOrderRaw = raw.sortOrder?.trim().toLowerCase();
    const sortOrder = ["asc", "desc"].includes(sortOrderRaw ?? "") ? (sortOrderRaw as "asc" | "desc") : undefined;

    return { pageNumber, pageSize, searchTerm, selectedYearRange, constructionType, sortBy, sortOrder };
}

export default async function Page({ searchParams }: PagePropsAgeFactor): Promise<React.ReactElement> {
    const params = await searchParams;
    const { 
        pageNumber, 
        pageSize, 
        searchTerm, 
        selectedYearRange, 
        constructionType, 
        sortBy, 
        sortOrder 
    } = sanitizeParams(params);

    // Fetch assessment years for dropdown - use -1 to fetch all records
    const assessmentYearData = await getAssessmentYearsPagedServerCV(1, -1);
    const assessmentYearOptions = assessmentYearData.items
        .filter((year) => year.isActive)
        .map((year) => ({
            label: `${year.fromYear}-${year.toYear}`,
            value: year.id.toString(),
        }));

    // Age factor data with filters and sorting
    const ageResult = await fetchAgeFactorCVMasterPagedServerAction(
        pageNumber,
        pageSize,
        searchTerm,
        selectedYearRange,
        constructionType
            ? constructionType.split(",").map(Number)
            : undefined,
        sortBy,
        sortOrder
    );

    // Fetch construction types for dropdown - use -1 to fetch all records
    const constructionTypeData = await fetchConstructionTypePagedAction(1, -1);
    const constructionTypeOptions = constructionTypeData.items
        .filter((type) => type.isActive)
        .map((type) => ({
            label: `${type.constructionCode} - ${type.description}`,
            value: type.id.toString(),
        }));

    // Fetch all age factors to get unique age ranges for the filter dropdown
    const allAgeFactors = await fetchAllAgeFactorsAction();
    const uniqueAgeRanges = Array.from(new Set(allAgeFactors.map(af => `${af.ageFrom}-${af.ageTo}`)))
        .sort((a, b) => {
            const [aFrom] = a.split('-').map(Number);
            const [bFrom] = b.split('-').map(Number);
            return aFrom - bFrom;
        })
        .map(range => ({ label: range, value: range }));

    return (
        <div className="pt-6">
            <AgeFactorCvWeightageMaster
                data={ageResult.items}
                pageNumber={ageResult.pageNumber}
                pageSize={ageResult.pageSize}
                totalCount={ageResult.totalCount}
                totalPages={ageResult.totalPages}
                assessmentYearOptions={assessmentYearOptions}
                constructionTypeOptions={constructionTypeOptions}
                ageRangeOptions={uniqueAgeRanges}
                allAgeFactors={allAgeFactors}
                sortBy={sortBy}
                sortOrder={sortOrder}
            />
        </div>
    );
}

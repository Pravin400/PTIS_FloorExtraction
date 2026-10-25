import React from "react";
import {
    fetchAgeFactorCVMasterPagedServerAction,
    fetchConstructionTypePagedAction,
    fetchAllAgeFactorsAction,
} from "./action";
import { fetchAssessmentYearsPagedAction } from "../action";
import AgeFactorCvWeightageMaster from "@/components/modules/assets/configuration/master-data/weightage-mastercv/ageFactorCv/AgeFactorCvWeightageMaster";
import { PagePropsAgeFactor, AgeFactorCVMasterSearchParams, AgeFactorCVMaster } from "@/types/asset-masters/ageFactorCv.types";
import { PagedResponse } from "@/types/common.types";
import { createLogger } from "@/lib/utils/server-logger";


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
    const constructionType = (rawConst && Number.isFinite(Number(rawConst))) ? rawConst : undefined;

    const allowedSortFields = ["ConstructionTypeId", "YearRangeCVId", "IsActive", "ConstructionCode", "ConstructionDescription", "AgeFrom", "AgeTo", "FromYear"];
    const sortByRaw = raw.sortBy?.trim();
    const sortBy = allowedSortFields.includes(sortByRaw ?? "") ? sortByRaw : undefined;

    const sortOrderRaw = raw.sortOrder?.trim().toLowerCase();
    const sortOrder = ["asc", "desc"].includes(sortOrderRaw ?? "") ? (sortOrderRaw as "asc" | "desc") : undefined;

    return { pageNumber, pageSize, searchTerm, selectedYearRange, constructionType, sortBy, sortOrder };
}

export default async function Page({ searchParams }: PagePropsAgeFactor): Promise<React.ReactElement> {
    const logger = createLogger('page/age-weightage');
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

    // Parallel fetch — all four data sources are independent
    const [assessmentYearResult, ageResult, constructionTypeResult, allAgeFactorsResult] = await Promise.allSettled([
        fetchAssessmentYearsPagedAction(1, -1),
        fetchAgeFactorCVMasterPagedServerAction(
            pageNumber, pageSize, searchTerm, selectedYearRange,
            constructionType ? Number(constructionType) : undefined,
            sortBy, sortOrder
        ),
        fetchConstructionTypePagedAction(1, -1),
        fetchAllAgeFactorsAction(),
    ]);

    // Assessment year options
    let assessmentYearOptions: { label: string; value: string }[] = [];
    if (assessmentYearResult.status === 'fulfilled') {
        assessmentYearOptions = (assessmentYearResult.value?.items || [])
            .map((year) => ({
                label: `${year.fromYear}-${year.toYear}`,
                value: (year.id || year.yearId || '').toString(),
            }));
    } else {
        logger.error("Failed to load assessment year options", {}, assessmentYearResult.reason);
    }

    // Age factor CV data
    const emptyAgeResult: PagedResponse<AgeFactorCVMaster> = {
        items: [], pageNumber, pageSize, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false,
    };
    const ageData = ageResult.status === 'fulfilled' ? ageResult.value : emptyAgeResult;
    if (ageResult.status === 'rejected') {
        logger.error("Failed to load age factor CV master records", {}, ageResult.reason);
    }

    // Construction type options
    let constructionTypeOptions: { label: string; value: string }[] = [];
    if (constructionTypeResult.status === 'fulfilled') {
        constructionTypeOptions = (constructionTypeResult.value?.items || []).map(
            (type: { id: number; constructionCode: string; description: string }) => ({
                label: `${type.constructionCode} - ${type.description}`,
                value: type.id.toString(),
            })
        );
    } else {
        logger.error("Failed to load construction type options", {}, constructionTypeResult.reason);
    }

    // Unique age ranges for filter dropdown
    let allAgeFactors: AgeFactorCVMaster[] = [];
    let uniqueAgeRanges: { label: string; value: string }[] = [];
    if (allAgeFactorsResult.status === 'fulfilled') {
        allAgeFactors = allAgeFactorsResult.value;
        uniqueAgeRanges = Array.from(new Set(allAgeFactors.map(af => `${af.ageFrom}-${af.ageTo}`)))
            .sort((a, b) => {
                const [aFrom] = a.split('-').map(Number);
                const [bFrom] = b.split('-').map(Number);
                return aFrom - bFrom;
            })
            .map(range => ({ label: range, value: range }));
    } else {
        logger.error("Failed to load all age factors", {}, allAgeFactorsResult.reason);
    }

    return (
        <div className="pt-6">
            <AgeFactorCvWeightageMaster
                data={ageData.items || []}
                pageNumber={ageData.pageNumber || pageNumber}
                pageSize={ageData.pageSize || pageSize}
                totalCount={ageData.totalCount || 0}
                totalPages={ageData.totalPages || 0}
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

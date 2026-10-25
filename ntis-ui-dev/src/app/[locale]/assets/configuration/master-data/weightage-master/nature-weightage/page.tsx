import React from "react";

import {
    fetchNatureFactorCVMasterPagedServerAction,
    fetchAssetConstructionPagedAction,
} from "./actions";
import { fetchAssessmentYearsPagedAction } from "../action";
import { NatureFactorCvPageProps, NatureFactorCVMasterSearchParams, NatureFactorCVMaster } from "@/types/asset-masters/natureofbuilding-cv-weightageMaster.types";
import { PagedResponse } from "@/types/common.types";
import NatureFactorCVMasterComp from "@/components/modules/assets/configuration/master-data/weightage-mastercv/natureFactorCv/NatureFactorCVMaster";
import { createLogger } from "@/lib/utils/server-logger";

// Pagination constraints
const MIN_PAGE = 1;
const MAX_PAGE = 10_000;
const MIN_PAGE_SIZE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

/** Allowed column names accepted by the API */
const ALLOWED_SORT_COLUMNS = ["ConstructionTypeId", "YearRangeCVId", "IsActive", "ConstructionCode", "ConstructionDescription", "FromYear"] as const;
const ALLOWED_SORT_ORDERS = ["asc", "desc"] as const;

/**
 * Sanitizes and clamps query-string parameters before they reach the server action.
 * Malformed values (e.g. ?page=-1) are normalized to safe defaults.
 */
function sanitizeParams(raw: NatureFactorCVMasterSearchParams) {
    const rawPage = parseInt(raw.page ?? "", 10);
    const pageNumber = Number.isFinite(rawPage)
        ? Math.min(Math.max(rawPage, MIN_PAGE), MAX_PAGE)
        : MIN_PAGE;

    const rawPageSize = parseInt(raw.pageSize ?? "", 10);
    const pageSize = Number.isFinite(rawPageSize)
        ? Math.min(Math.max(rawPageSize, MIN_PAGE_SIZE), MAX_PAGE_SIZE)
        : DEFAULT_PAGE_SIZE;

    const searchTerm = raw.q?.trim() || undefined;
    const selectedYearRange = raw.selectedYearRange?.trim() || undefined;
    const constructionType = raw.constructionType?.trim() || undefined;

    const sortByRaw = raw.sortBy?.trim() ?? "";
    const sortBy = (ALLOWED_SORT_COLUMNS as readonly string[]).includes(sortByRaw)
        ? (sortByRaw as (typeof ALLOWED_SORT_COLUMNS)[number])
        : undefined;

    const sortOrderRaw = raw.sortOrder?.trim().toLowerCase() ?? "";
    const sortOrder = (ALLOWED_SORT_ORDERS as readonly string[]).includes(sortOrderRaw)
        ? (sortOrderRaw as (typeof ALLOWED_SORT_ORDERS)[number])
        : undefined;

    return { pageNumber, pageSize, searchTerm, selectedYearRange, constructionType, sortBy, sortOrder };
}

export default async function Page({ searchParams }: NatureFactorCvPageProps): Promise<React.ReactElement> {
    const logger = createLogger('page/nature-weightage');
    const params = await searchParams;
    const { pageNumber, pageSize, searchTerm, selectedYearRange, constructionType, sortBy, sortOrder } = sanitizeParams(params);

    // Parallel fetch — all three data sources are independent
    const [assessmentYearResult, natureResult, constructionTypeResult] = await Promise.allSettled([
        fetchAssessmentYearsPagedAction(1, -1),
        fetchNatureFactorCVMasterPagedServerAction(
            pageNumber, pageSize, searchTerm, selectedYearRange, constructionType, sortBy, sortOrder
        ),
        fetchAssetConstructionPagedAction(1, -1),
    ]);

    // Assessment year options
    let assessmentYearOptions: { label: string; value: string }[] = [];
    if (assessmentYearResult.status === 'fulfilled') {
        assessmentYearOptions = (assessmentYearResult.value?.items || [])
            .map((year: { fromYear?: number; toYear?: number; id?: number; yearId?: number }) => ({
                label: `${year.fromYear}-${year.toYear}`,
                value: (year.id || year.yearId || '').toString(),
            }));
    } else {
        logger.error("Failed to load assessment year options", {}, assessmentYearResult.reason);
    }

    // Nature factor CV data
    const emptyNatureResult: PagedResponse<NatureFactorCVMaster> = {
        items: [], pageNumber, pageSize, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false,
    };
    const natureData = natureResult.status === 'fulfilled' ? natureResult.value : emptyNatureResult;
    if (natureResult.status === 'rejected') {
        logger.error("Failed to load nature factor CV master records", {}, natureResult.reason);
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

    return (
        <div className="pt-6">
            <NatureFactorCVMasterComp
                data={natureData.items || []}
                pageNumber={natureData.pageNumber || pageNumber}
                pageSize={natureData.pageSize || pageSize}
                totalCount={natureData.totalCount || 0}
                totalPages={natureData.totalPages || 0}
                assessmentYearOptions={assessmentYearOptions}
                constructionTypeOptions={constructionTypeOptions}
                sortBy={sortBy}
                sortOrder={sortOrder}
            />
        </div>
    );
}
import React from "react";

import { fetchUseFactorCVMasterPagedServerAction, fetchTypeOfUsePaged } from "./action";
import { fetchAssessmentYearsPagedAction } from "../action";
import UseCategoryCvFactorMaster from "@/components/modules/assets/configuration/master-data/weightage-mastercv/useCategoryCv/UseCategoryCvFactorMaster";
import { UseCategoryCvPageProps, UseFactorCVMaster, UseType } from "@/types/asset-masters/useCategoryCvFactor.types";
import { PagedResponse } from "@/types/common.types";
import { parsePaginationParams } from "@/lib/utils/pagination";
import { sanitizeNumericParam } from "@/lib/utils/params";
import { createLogger } from "@/lib/utils/server-logger";


export default async function Page({ searchParams }: UseCategoryCvPageProps): Promise<React.ReactElement> {
    const logger = createLogger('page/sub-type-weightage');
    const params = await searchParams;

    // Parse pagination for both main and left tables
    const { pageNumber, pageSize } = parsePaginationParams(params.page, params.pageSize);
    const { pageNumber: leftPageNumber, pageSize: leftPageSize } = parsePaginationParams(params.leftPage, params.leftPageSize);

    const searchTerm = params.q?.trim() || undefined;
    const selectedYearRange = sanitizeNumericParam(params.selectedYearRange)?.toString();
    const typeOfUseId = sanitizeNumericParam(params.typeOfUseId);

    // Sanitization for sorting
    const sortByRaw = params.sortBy?.trim() ?? "";
    const allowedSortColumns = ["TypeOfUseId", "SubTypeOfUseId", "YearRangeCVId", "IsActive", "TypeOfUseCode", "TypeOfUseDescription", "SubTypeOfUseDescription", "FromYear"];
    const sortBy = allowedSortColumns.includes(sortByRaw) ? sortByRaw : undefined;

    const sortOrderRaw = params.sortOrder?.trim().toLowerCase() ?? "";
    const sortOrder = ["asc", "desc"].includes(sortOrderRaw) ? (sortOrderRaw as "asc" | "desc") : undefined;

    const leftSortByRaw = params.leftSortBy?.trim() ?? "";
    const leftAllowedSortColumns = [
        "AssetCategoryId",
        "AssetTypeId",
        "TypeOfUseGroupId",
        "TypeOfUseGroupCVId",
        "TypeOfUseCode",
        "Description",
        "Type",
        "SearchSequence",
        "IsActive",
        "MarkedForDeletion",
    ];
    const leftSortBy = leftAllowedSortColumns.includes(leftSortByRaw) ? leftSortByRaw : undefined;

    const leftSortOrderRaw = params.leftSortOrder?.trim().toLowerCase() ?? "";
    const leftSortOrder = ["asc", "desc"].includes(leftSortOrderRaw) ? (leftSortOrderRaw as "asc" | "desc") : undefined;

    // Parallel fetch — all four data sources are independent
    const [assessmentYearResult, tableResult, typeOfUseTableResult, typeOfUseDropdownResult] = await Promise.allSettled([
        fetchAssessmentYearsPagedAction(1, -1),
        fetchUseFactorCVMasterPagedServerAction(
            pageNumber, pageSize, searchTerm, selectedYearRange,
            typeOfUseId, undefined, sortBy, sortOrder
        ),
        fetchTypeOfUsePaged({
            pageNumber: leftPageNumber,
            pageSize: leftPageSize,
            searchTerm,
            filterLogic: 1,
            id: undefined,
            typeOfUseCode: undefined,
            typeOfUseGroupId: undefined,
            sortBy: leftSortBy,
            sortOrder: leftSortOrder,
        }),
        fetchTypeOfUsePaged({ pageNumber: 1, pageSize: -1 }),
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

    // Use factor CV data
    let tableData: PagedResponse<UseFactorCVMaster> | null = null;
    if (tableResult.status === 'fulfilled') {
        tableData = tableResult.value;
    } else {
        logger.error("Failed to load use factor CV master records", {}, tableResult.reason);
    }

    // Type of use table data (left panel)
    let typeOfUseTableData: PagedResponse<UseType> | null = null;
    if (typeOfUseTableResult.status === 'fulfilled') {
        typeOfUseTableData = typeOfUseTableResult.value;
    } else {
        logger.error("Failed to load type of use table data", {}, typeOfUseTableResult.reason);
    }

    // Type of use options (dropdown)
    let typeOfUseOptions: { label: string; value: string }[] = [];
    if (typeOfUseDropdownResult.status === 'fulfilled') {
        typeOfUseOptions = (typeOfUseDropdownResult.value?.items || []).map(
            (type: { id: number; typeOfUseCode: string; description: string }) => ({
                label: `${type.typeOfUseCode} - ${type.description}`,
                value: String(type.id),
            })
        );
    } else {
        logger.error("Failed to load type of use options", {}, typeOfUseDropdownResult.reason);
    }

    return (
        <div className="pt-6">
            <UseCategoryCvFactorMaster
                data={tableData?.items || []}
                pageNumber={tableData?.pageNumber || pageNumber || 1}
                pageSize={pageSize || tableData?.pageSize || 10}
                totalCount={tableData?.totalCount || 0}
                totalPages={tableData?.totalPages || 1}

                typeOfUseTableData={typeOfUseTableData?.items || []}
                typeOfUsePageNumber={typeOfUseTableData?.pageNumber || leftPageNumber || 1}
                typeOfUsePageSize={leftPageSize || typeOfUseTableData?.pageSize || 10}
                typeOfUseTotalCount={typeOfUseTableData?.totalCount || 0}
                typeOfUseTotalPages={typeOfUseTableData?.totalPages || 1}

                assessmentYearOptions={assessmentYearOptions}
                typeOfUseOptions={typeOfUseOptions}

                sortBy={sortBy}
                sortOrder={sortOrder}
                leftSortBy={leftSortBy}
                leftSortOrder={leftSortOrder}
            />
        </div>
    );
}
import React from "react";

import { fetchUseFactorCVMasterPagedServerAction, fetchTypeOfUsePaged } from "./action";
import UseCategoryCvFactorMaster from "@/components/modules/property-tax/weightage-mastercv/useCategoryCv/UseCategoryCvFactorMaster";
import { getAssessmentYearsPagedServerCV } from "@/lib/api/floor-cv-weightageMaster.service";
import { UseCategoryCvPageProps } from "@/types/useCategoryCvFactor.types";
import { parsePaginationParams } from "@/lib/utils/pagination";
import { sanitizeNumericParam } from "@/lib/utils/params";


export default async function Page({ searchParams }: UseCategoryCvPageProps): Promise<React.ReactElement> {
    const params = await searchParams;
    
    // Parse pagination for both main and left tables
    const { pageNumber, pageSize } = parsePaginationParams(params.page, params.pageSize);
    const { pageNumber: leftPageNumber, pageSize: leftPageSize } = parsePaginationParams(params.leftPage, params.leftPageSize);

    const searchTerm = params.q?.trim() || undefined;
    const selectedYearRange = sanitizeNumericParam(params.selectedYearRange)?.toString();
    const typeOfUseId = sanitizeNumericParam(params.typeOfUseId);

    // Sanitization for sorting
    const sortByRaw = params.sortBy?.trim() ?? "";
    const allowedSortColumns = ["TypeOfUseCode", "TypeOfUseDescription", "SubTypeOfUseDescription", "FromYear"];
    const sortBy = allowedSortColumns.includes(sortByRaw) ? sortByRaw : undefined;

    const sortOrderRaw = params.sortOrder?.trim().toLowerCase() ?? "";
    const sortOrder = ["asc", "desc"].includes(sortOrderRaw) ? (sortOrderRaw as "asc" | "desc") : undefined;

    const leftSortByRaw = params.leftSortBy?.trim() ?? "";
    const leftAllowedSortColumns = ["TypeOfUseCode", "Description"];
    const leftSortBy = leftAllowedSortColumns.includes(leftSortByRaw) ? leftSortByRaw : undefined;

    const leftSortOrderRaw = params.leftSortOrder?.trim().toLowerCase() ?? "";
    const leftSortOrder = ["asc", "desc"].includes(leftSortOrderRaw) ? (leftSortOrderRaw as "asc" | "desc") : undefined;

    // Assessment years for dropdown
    const assessmentYearData = await getAssessmentYearsPagedServerCV(1, -1);
    const assessmentYearOptions = assessmentYearData.items
        .filter((year) => year.isActive)
        .map((year) => ({
            label: `${year.fromYear}-${year.toYear}`,
            value: year.id.toString(),
        }));

    // Use factor data with filters and sorting
    const tableResult = await fetchUseFactorCVMasterPagedServerAction(
        pageNumber,
        pageSize,
        searchTerm,
        selectedYearRange,
        typeOfUseId,
        undefined, // subTypeOfUseId
        sortBy,
        sortOrder
    );

    // Fetch Type of Use master data with pagination, filters, and sorting
    const typeOfUseTableData = await fetchTypeOfUsePaged({
        pageNumber: leftPageNumber,
        pageSize: leftPageSize,
        searchTerm: searchTerm,
        filterLogic: 1, // Filter for active records only
        id: undefined, // Optional filter
        typeOfUseCode: undefined, // Optional filter
        typeOfUseGroupId: undefined, // Optional filter
        sortBy: leftSortBy,
        sortOrder: leftSortOrder,
    });
   
    const typeOfUseDropdown = await fetchTypeOfUsePaged({ pageNumber: 1, pageSize: -1, filterLogic: 1 });
    const allActiveTypes = (typeOfUseDropdown.items || []).filter((type) => type.isActive);
    const typeOfUseOptions = allActiveTypes.map((type) => ({
        label: `${type.typeOfUseCode} - ${type.description}`,
        value: String(type.id),
    }));

    let finalLeftItems = (typeOfUseTableData?.items || []).filter((item) => item.isActive);
    let finalLeftPageNumber = typeOfUseTableData?.pageNumber || leftPageNumber || 1;
    let finalLeftPageSize = typeOfUseTableData?.pageSize || leftPageSize || 10;
    let finalLeftTotalCount = typeOfUseTableData?.totalCount || 0;
    let finalLeftTotalPages = typeOfUseTableData?.totalPages || 1;

    if (typeOfUseId) {
        const selectedItem = allActiveTypes.find((item) => item.id === typeOfUseId);
        if (selectedItem) {
            const remainingItems = allActiveTypes.filter((item) => item.id !== typeOfUseId);
            
            if (leftSortBy) {
                remainingItems.sort((a, b) => {
                    const key = leftSortBy === "TypeOfUseCode" ? "typeOfUseCode" : "description";
                    const valA = String(a[key as keyof typeof a] ?? "");
                    const valB = String(b[key as keyof typeof b] ?? "");
                    const comp = valA.localeCompare(valB);
                    return leftSortOrder === "desc" ? -comp : comp;
                });
            }

            const reordered = [selectedItem, ...remainingItems];
            finalLeftTotalCount = reordered.length;
            finalLeftTotalPages = Math.ceil(finalLeftTotalCount / leftPageSize) || 1;
            const startIndex = (leftPageNumber - 1) * leftPageSize;
            finalLeftItems = reordered.slice(startIndex, startIndex + leftPageSize);
            finalLeftPageNumber = leftPageNumber;
            finalLeftPageSize = leftPageSize;
        }
    }

    return (
        <div className="pt-6">
            <UseCategoryCvFactorMaster
                data={tableResult?.items || []}
                pageNumber={tableResult?.pageNumber || 1}
                pageSize={tableResult?.pageSize || 10}
                totalCount={tableResult?.totalCount || 0}
                totalPages={tableResult?.totalPages || 1}
                
                typeOfUseTableData={finalLeftItems}
                typeOfUsePageNumber={finalLeftPageNumber}
                typeOfUsePageSize={finalLeftPageSize}
                typeOfUseTotalCount={finalLeftTotalCount}
                typeOfUseTotalPages={finalLeftTotalPages}
                
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
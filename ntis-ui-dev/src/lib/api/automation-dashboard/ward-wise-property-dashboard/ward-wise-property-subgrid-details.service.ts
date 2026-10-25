import { apiClient } from "@/services/api.service";
import { handleApiResponse } from "@/lib/utils/api";
import { getTranslations } from "next-intl/server";

import {
    WardWisePropertySubGridDetailsResponse,
    WardWisePropertySubGridDetailsItems
} from "@/types/automation-dashboard/ward-wise-property-dashboard/ward-wise-property-subgrid-details.type";

export async function automationGetWardWisePropertySubGridDetails(
    zoneId: string | number,
    workflowStageId: string | number,
    pageNumber: number = 1,
    pageSize: number = 10,
    wardId?: string | number,
    propertyTypeCategoryId?: string | number,
    propertyTypeId?: string | number,
    assessmentTypeId?: string | number,
    Search?: string,
    PropertyNo?: string,
    sortBy?: string,
    sortOrder?: string,
    structure?: boolean,
    unit?: boolean,
    pendingStructure?: boolean,
    pendingUnit?: boolean,
    completedStructure?: boolean,
    completedUnit?: boolean
): Promise<WardWisePropertySubGridDetailsItems | null> {
    const params = new URLSearchParams();
    if (!PropertyNo) {
        if (zoneId !== undefined && zoneId !== null && zoneId !== 'All') {
            params.append("zoneId", zoneId.toString());
        }
        if (workflowStageId !== undefined && workflowStageId !== null) {
            params.append("workflowStageId", workflowStageId.toString());
        }
    }
    params.append("PageNumber", pageNumber.toString());
    params.append("PageSize", pageSize.toString());

    if (wardId !== undefined && wardId !== null && wardId !== 'All') {
        params.append("WardId", wardId.toString());
    }
    if (propertyTypeCategoryId !== undefined && propertyTypeCategoryId !== null && propertyTypeCategoryId !== 'All') {
        params.append("PropertyTypeCategoryId", propertyTypeCategoryId.toString());
    }
    if (propertyTypeId !== undefined && propertyTypeId !== null && propertyTypeId !== 'All') {
        params.append("PropertyTypeId", propertyTypeId.toString());
    }
    if (assessmentTypeId !== undefined && assessmentTypeId !== null && assessmentTypeId !== 'All') {
        params.append("AssessmentTypeId", assessmentTypeId.toString());
    }
    if (Search) {
        params.append("Search", Search);
    }
    if (PropertyNo) {
        params.append("PropertyNo", PropertyNo);
    }
    if (sortBy) {
        params.append("SortBy", sortBy);
    }
    if (sortOrder) {
        params.append("SortOrder", sortOrder);
    }
    if (structure !== undefined) {
        params.append("Structure", structure.toString());
    }
    if (unit !== undefined) {
        params.append("Unit", unit.toString());
    }
    if (pendingStructure !== undefined) {
        params.append("PendingStructure", pendingStructure.toString());
    }
    if (pendingUnit !== undefined) {
        params.append("PendingUnit", pendingUnit.toString());
    }
    if (completedStructure !== undefined) {
        params.append("CompletedStructure", completedStructure.toString());
    }
    if (completedUnit !== undefined) {
        params.append("CompletedUnit", completedUnit.toString());
    }

    const response = await apiClient.get<WardWisePropertySubGridDetailsResponse>(`/AutomationDashboard/GetWardSubGridPDData?${params.toString()}`, { cache: "force-cache" });
    const t = await getTranslations("automationDashboard");

    const responseData = handleApiResponse(response, t("errors.fetchGeoSequencingPropertyDetails") || "Failed to fetch property details");
    return responseData.items?.[0] ?? null;
}

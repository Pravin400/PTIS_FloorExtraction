import { apiClient } from "@/services/api.service";
import { handleApiResponse } from "@/lib/utils/api";
import { getTranslations } from "next-intl/server";

import {
    PropertySubGridDetailsResponse,
    PropertySubGridDetailsItems,
    WardResponseItems,
    WardItem,
    PropertyTypeMasterResponseItems,
    PropertyTypeMasterItem,
    PropertyAssessmentStatusResponseItems,
    PropertyAssessmentStatusItem,
    ZoneItem,
    ZoneResponseItems,
    PropertyTrackingStageStatusResponse,
    PropertyTrackingStageStatusItem
} from "@/types/automation-dashboard/property-dashboard/property-subgrid-details.type";

export async function automationGetPropertySubGridDetails(
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
): Promise<PropertySubGridDetailsItems | null> {
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

    const response = await apiClient.get<PropertySubGridDetailsResponse>(`/AutomationDashboard/GetSubGridPDData?${params.toString()}`, { cache: "force-cache" });
    const t = await getTranslations("automationDashboard");

    const responseData = handleApiResponse(response, t("errors.fetchGeoSequencingPropertyDetails") || "Failed to fetch geo sequencing property details");

    return responseData.items?.[0] ?? null;
}

export async function getWards(
    pageNumber: number = -1,
    pageSize: number = 10,
    zoneId?: string | number
): Promise<WardItem[] | null> {
    const params = new URLSearchParams();
    params.append("pageNumber", pageNumber.toString());
    params.append("pageSize", pageSize.toString());
    if (zoneId !== undefined) {
        params.append("zoneId", zoneId.toString());
    }

    const response = await apiClient.get<WardResponseItems>(`/Ward?${params.toString()}`, { cache: "force-cache" });
    const t = await getTranslations("automationDashboard");

    return handleApiResponse(response, t("errors.fetchGeoSequencingWardWiseSummary") || "Failed to fetch ward details").items ?? null;
}

export async function getPropertyTypeMaster(
    pageNumber: number = -1,
    pageSize: number = 10
): Promise<PropertyTypeMasterItem[] | null> {
    const params = new URLSearchParams();
    params.append("pageNumber", pageNumber.toString());
    params.append("pageSize", pageSize.toString());

    const response = await apiClient.get<PropertyTypeMasterResponseItems>(`/PropertyTypeMaster?${params.toString()}`, { cache: "force-cache" });
    const t = await getTranslations("automationDashboard");

    return handleApiResponse(response, t("errors.fetchPropertyTypeMaster") || "Failed to fetch property type master details").items ?? null;
}

export async function getPropertyAssessmentStatus(
    pageNumber: number = 1,
    pageSize: number = -1
): Promise<PropertyAssessmentStatusItem[] | null> {
    const params = new URLSearchParams();
    params.append("pageNumber", pageNumber.toString());
    params.append("pageSize", pageSize.toString());

    const response = await apiClient.get<PropertyAssessmentStatusResponseItems>(`/PropertyAssessmentStatus?${params.toString()}`, { cache: "force-cache" });
    const t = await getTranslations("automationDashboard");

    return handleApiResponse(response, t("errors.fetchPropertyAssessmentStatus") || "Failed to fetch property assessment status details").items ?? null;
}

export async function getZones(
    pageNumber: number = 1,
    pageSize: number = 10
): Promise<ZoneItem[] | null> {
    const params = new URLSearchParams();
    params.append("pageNumber", pageNumber.toString());
    params.append("pageSize", pageSize.toString());

    const response = await apiClient.get<ZoneResponseItems>(`/Zone?${params.toString()}`, { cache: "force-cache" });
    const t = await getTranslations("automationDashboard");

    return handleApiResponse(response, t("errors.fetchZones") || "Failed to fetch zones").items ?? null;
}

export async function getPropertyTrackingStageStatus(
    propertyId: string | number
): Promise<PropertyTrackingStageStatusItem[] | null> {
    const params = new URLSearchParams();
    params.append("propertyId", propertyId.toString());

    const response = await apiClient.get<PropertyTrackingStageStatusResponse>(
        `/AutomationDashboard/TrackStageStatus?${params.toString()}`,
        { cache: "no-store" }
    );
    const t = await getTranslations("automationDashboard");

    return handleApiResponse(response, t("errors.fetchPropertyTrackingStatus") || "Failed to fetch property tracking stage status").items ?? null;
}

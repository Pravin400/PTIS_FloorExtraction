import { apiClient } from "@/services/api.service";
import { handleApiResponse } from "@/lib/utils/api";
import { getTranslations } from "next-intl/server";
import {
    DataEntryGridItems,
    DataEntryGridResponse,
    DataEntryWardWiseSummaryItems,
    DataEntryWardWiseSummaryResponse
} from "@/types/automation-dashboard/data-entry-quality-check/data-entry-quality-check.type";

export async function automationGetDataEntryGrid(
    workflowStageId?: string | number,
    propertyTypeId?: string | null,
    propertyTypeCategoryId?: string | null
): Promise<DataEntryGridItems | null> {
    const params = new URLSearchParams();
    if (workflowStageId !== undefined && workflowStageId !== null) {
        params.append("workflowStageId", workflowStageId.toString());
    }
    if (propertyTypeId) {
        params.append("PropertyTypeId", propertyTypeId);
    }
    if (propertyTypeCategoryId) {
        params.append("PropertyTypeCategoryId", propertyTypeCategoryId);
    }

    const url = `/AutomationDashboard/DataEntryGrid?${params.toString()}`;

    const response = await apiClient.get<DataEntryGridResponse>(url, { cache: "force-cache" });
    const t = await getTranslations("automationDashboard");

    const responseData = handleApiResponse(response, t("errors.fetchDataEntryGrid") || "Failed to fetch data entry grid data");
    return responseData.items?.[0] ?? null;
}

export async function automationGetDataEntryWardWiseSummary(
    zoneId: string | number,
    workflowStageId?: string | number,
    pageNumber: number = 1,
    pageSize: number = 10,
    propertyTypeId?: string | null,
    propertyTypeCategoryId?: string | null
): Promise<DataEntryWardWiseSummaryItems | null> {
    const params = new URLSearchParams({
        zoneId: zoneId.toString(),
        pageNumber: pageNumber.toString(),
        pageSize: pageSize.toString(),
    });

    if (workflowStageId !== undefined && workflowStageId !== null) {
        params.append("workflowStageId", workflowStageId.toString());
    }
    if (propertyTypeId) {
        params.append("PropertyTypeId", propertyTypeId);
    }
    if (propertyTypeCategoryId) {
        params.append("PropertyTypeCategoryId", propertyTypeCategoryId);
    }

    const response = await apiClient.get<DataEntryWardWiseSummaryResponse>(
        `/AutomationDashboard/DataEntryWardWiseSummary?${params.toString()}`,
        { cache: "force-cache" }
    );
    const t = await getTranslations("automationDashboard");

    const responseData = handleApiResponse(response, t("errors.fetchDataEntryWardWiseSummary") || "Failed to fetch data entry ward-wise summary data");
    return responseData.items?.[0] ?? null;
}

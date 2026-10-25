import { apiClient } from "@/services/api.service";
import { handleApiResponse } from "@/lib/utils/api";
import { getTranslations } from "next-intl/server";
import {
    InternalSurveyGridItems,
    InternalSurveyGridResponse,
    InternalSurveyWardWiseItems,
    InternalSurveyWardWiseResponse
} from "@/types/automation-dashboard/internal-surveygrid/internal-surveygrid.type";

export async function automationGetInternalSurveyGrid(
    workflowStageId?: string | number,
    propertyTypeId?: string | null,
    propertyTypeCategoryId?: string | null
): Promise<InternalSurveyGridItems | null> {
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

    const url = `/AutomationDashboard/InternalSurveyGrid?${params.toString()}`;

    const response = await apiClient.get<InternalSurveyGridResponse>(url, { cache: "force-cache" });
    const t = await getTranslations("automationDashboard");

    const responseData = handleApiResponse(response, t("errors.fetchInternalSurveyGrid") || "Failed to fetch internal survey grid data");
    return responseData.items?.[0] ?? null;
}

export async function automationGetInternalSurveyWardWiseSummary(
    zoneId: string | number,
    workflowStageId?: string | number,
    pageNumber: number = 1,
    pageSize: number = 10,
    propertyTypeId?: string | null,
    propertyTypeCategoryId?: string | null
): Promise<InternalSurveyWardWiseItems | null> {
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

    const response = await apiClient.get<InternalSurveyWardWiseResponse>(
        `/AutomationDashboard/InternalSurveyWardWiseSummary?${params.toString()}`,
        { cache: "force-cache" }
    );
    const t = await getTranslations("automationDashboard");

    const responseData = handleApiResponse(response, t("errors.fetchInternalSurveyWardWiseSummary") || "Failed to fetch internal survey ward-wise summary data");
    return responseData.items?.[0] ?? null;
}

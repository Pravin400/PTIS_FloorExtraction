import { getTranslations } from "next-intl/server";
import {
    ApprovalByUlbItems,
    ApprovalByUlbResponse,
    BuildingWisePagination,
    BuildingWiseResponse,
    PropertyWisePagination,
    PropertyWiseResponse,
    PendingExportItem,
    PendingExportResponse
} from "@/types/automation-dashboard/approval-by-ulb/approval-by-ulb.type";
import { apiClient } from "@/services/api.service";
import { handleApiResponse } from "@/lib/utils/api";

export async function getApprovalByUlbGridDetails(): Promise<ApprovalByUlbItems | null> {
    const response = await apiClient.get<ApprovalByUlbResponse>("/AutomationDashboard/PropertySignature/dashboard-sign-grid", { cache: "force-cache" });
    const t = await getTranslations("automationDashboard");

    const responseData = handleApiResponse(response, t("errors.fetchApprovalByUlbDetails") || "Failed to fetch approval by ULB details");
    return responseData.items?.[0] ?? null;
}

export async function getWardWiseApprovalByUlbGridDetails(
    zoneId: string | number,
    pageNumber: number = 1,
    pageSize: number = 10
): Promise<ApprovalByUlbItems | null> {
    const params = new URLSearchParams();
    params.append("ZoneId", zoneId.toString());
    params.append("pageNumber", pageNumber.toString());
    params.append("pageSize", pageSize.toString());

    const response = await apiClient.get<ApprovalByUlbResponse>(
        `/AutomationDashboard/PropertySignature/ward-wise-summary/zone?${params.toString()}`,
        { cache: "force-cache" }
    );

    const t = await getTranslations("automationDashboard");

    const responseData = handleApiResponse(response, t("errors.fetchApprovalByUlbDetails") || "Failed to fetch ward-wise approval by ULB details");
    return responseData.items?.[0] ?? null;
}

export async function getBuildingWiseData(
    wardId: string | number,
    workflowStageId: string | number,
    pageNumber: number = 1,
    pageSize: number = 10
): Promise<BuildingWisePagination | null> {
    const params = new URLSearchParams();
    params.append("wardId", wardId.toString());
    params.append("workflowStageId", workflowStageId.toString());
    params.append("pageNumber", pageNumber.toString());
    params.append("pageSize", pageSize.toString());

    const response = await apiClient.get<BuildingWiseResponse>(
        `/AutomationDashboard/PropertySignature/get-building-wise-details?${params.toString()}`,
        { cache: "force-cache" }
    );

    const t = await getTranslations("automationDashboard");

    const responseData = handleApiResponse(response, t("errors.fetchBuildingWiseData") || "Failed to fetch building-wise data");
    return responseData.items?.[0] ?? null;
}

export async function exportPendingData(
    signAuthorityId: string | number
): Promise<PendingExportItem[] | null> {
    const params = new URLSearchParams();
    params.append("signAuthorityId", signAuthorityId.toString());

    const response = await apiClient.get<PendingExportResponse>(
        `/AutomationDashboard/PropertySignature/pending-export?${params.toString()}`,
        { cache: "no-store" }
    );
    const t = await getTranslations("automationDashboard");

    return handleApiResponse(response, t("errors.exportPendingData") || "Failed to export pending data").items ?? null;
}

export async function getPropertyWiseData(
    propertyNo: string,
    pageNumber: number = 1,
    pageSize: number = 10,
    searchType?: string
): Promise<PropertyWisePagination | null> {
    const params = new URLSearchParams();
    params.append("PropertyNo", propertyNo);
    if (searchType) {
        params.append("SearchType", searchType);
    }
    params.append("pageNumber", pageNumber.toString());
    params.append("pageSize", pageSize.toString());

    const response = await apiClient.get<PropertyWiseResponse>(
        `/AutomationDashboard/PropertySignature/get-property-wise-details?${params.toString()}`,
        { cache: "force-cache" }
    );
    const t = await getTranslations("automationDashboard");

    const responseData = handleApiResponse(response, t("errors.fetchPropertyWiseData") || "Failed to fetch property-wise data");
    return responseData.items?.[0] ?? null;
}

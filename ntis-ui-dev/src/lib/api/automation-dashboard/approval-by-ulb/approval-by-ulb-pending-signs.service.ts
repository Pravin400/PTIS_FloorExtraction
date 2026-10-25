import { handleApiResponse } from "@/lib/utils/api";
import { apiClient } from "@/services/api.service";
import { PendingSignPagination, PendingSignResponse, UpdatePropertySignPayload } from "@/types/automation-dashboard/approval-by-ulb/approval-by-ulb.type";
import { getTranslations } from "next-intl/server";

export async function getPendingSigns(
    pageNumber: number = 1,
    pageSize: number = 10,
    userId?: number,
    searchTerm?: string,
    sortBy?: string,
    sortOrder?: string,
    filterLogic?: number
): Promise<PendingSignPagination | null> {
    const params = new URLSearchParams();
    if (userId !== undefined) params.append("UserId", userId.toString());
    params.append("PageNumber", pageNumber.toString());
    params.append("PageSize", pageSize.toString());
    if (searchTerm) params.append("SearchTerm", searchTerm);
    if (sortBy) params.append("SortBy", sortBy);
    if (sortOrder) params.append("SortOrder", sortOrder);
    if (filterLogic !== undefined) params.append("FilterLogic", filterLogic.toString());

    const response = await apiClient.get<PendingSignResponse>(
        `/AutomationDashboard/PropertySignature/get-pending-signs?${params.toString()}`,
        { cache: "no-store" }
    );
    const t = await getTranslations("automationDashboard");

    const responseData = handleApiResponse(response, t("errors.fetchPendingSigns") || "Failed to fetch pending signs");
    return responseData.items?.[0] ?? null;
}

export async function updatePropertySign(payload: UpdatePropertySignPayload): Promise<boolean> {
    const response = await apiClient.put<PendingSignResponse>(
        `/AutomationDashboard/PropertySignature/update-property-sign`,
        payload
    );
    const t = await getTranslations("automationDashboard");
    const responseData = handleApiResponse(response, t("errors.updatePropertySign") || "Failed to update property sign");
    return responseData.success;
}
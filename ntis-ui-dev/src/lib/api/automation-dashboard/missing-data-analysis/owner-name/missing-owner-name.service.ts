import { apiClient } from "@/services/api.service";
import { handleApiResponse } from "@/lib/utils/api";
import { getTranslations } from "next-intl/server";
import {
    MissingOwnerNameItem,
    MissingOwnerNameResponse
} from "@/types/automation-dashboard/missing-data-analysis/owner-name/missing-owner-name.type";

export async function automationGetMissingOwnerName(
    zoneNo?: string | null
): Promise<MissingOwnerNameItem | null> {
    const params = new URLSearchParams();
    if (zoneNo) {
        params.append("zoneNo", zoneNo);
    }

    const query = params.toString() ? `?${params.toString()}` : "";
    const url = `/AutomationDashboard/MissingDetails/owner-name${query}`;

    const response = await apiClient.get<MissingOwnerNameResponse>(url, { cache: "no-store" });
    const t = await getTranslations("automationDashboard");

    const responseData = handleApiResponse(response, t("errors.fetchMissingOwnerName") || "Failed to fetch missing owner name data");
    return responseData.items?.[0] ?? null;
}

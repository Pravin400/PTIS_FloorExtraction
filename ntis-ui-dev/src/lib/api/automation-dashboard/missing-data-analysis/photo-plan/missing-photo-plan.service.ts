import { apiClient } from "@/services/api.service";
import { handleApiResponse } from "@/lib/utils/api";
import { getTranslations } from "next-intl/server";
import {
    MissingPhotoPlanItem,
    MissingPhotoPlanResponse
} from "@/types/automation-dashboard/missing-data-analysis/photo-plan/missing-photo-plan.type";

export async function automationGetMissingPhotoPlan(
    zoneNo?: string | null
): Promise<MissingPhotoPlanItem | null> {
    const params = new URLSearchParams();
    if (zoneNo) {
        params.append("zoneNo", zoneNo);
    }

    const query = params.toString() ? `?${params.toString()}` : "";
    const url = `/AutomationDashboard/MissingDetails/photo-plan${query}`;

    const response = await apiClient.get<MissingPhotoPlanResponse>(url, { cache: "no-store" });
    const t = await getTranslations("automationDashboard");

    const responseData = handleApiResponse(response, t("errors.fetchMissingPhotoPlan") || "Failed to fetch missing photo plan data");
    return responseData.items?.[0] ?? null;
}

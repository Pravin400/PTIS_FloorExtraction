import { apiClient } from "@/services/api.service";
import { handleApiResponse } from "@/lib/utils/api";
import { getTranslations } from "next-intl/server";
import {
    MissingOccupierNameItem,
    MissingOccupierNameResponse
} from "@/types/automation-dashboard/missing-data-analysis/occupier-name/missing-occupier-name.type";

export async function automationGetMissingOccupierName(
    zoneNo?: string | null
): Promise<MissingOccupierNameItem | null> {
    const params = new URLSearchParams();
    if (zoneNo) {
        params.append("zoneNo", zoneNo);
    }

    const query = params.toString() ? `?${params.toString()}` : "";
    const url = `/AutomationDashboard/MissingDetails/occupier-name${query}`;

    const response = await apiClient.get<MissingOccupierNameResponse>(url, { cache: "no-store" });
    const t = await getTranslations("automationDashboard");

    const responseData = handleApiResponse(response, t("errors.fetchMissingOccupierName"));
    return responseData.items?.[0] ?? null;
}

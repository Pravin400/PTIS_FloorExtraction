import { apiClient } from "@/services/api.service";
import { handleApiResponse } from "@/lib/utils/api";
import { getTranslations } from "next-intl/server";
import {
    MissingRegisteredPropertyItem,
    MissingRegisteredPropertyResponse
} from "@/types/automation-dashboard/missing-data-analysis/registered-property/missing-registered-property.type";

export async function automationGetMissingRegisteredProperty(
    zoneNo?: string | null
): Promise<MissingRegisteredPropertyItem | null> {
    const params = new URLSearchParams();
    if (zoneNo) {
        params.append("zoneNo", zoneNo);
    }

    const query = params.toString() ? `?${params.toString()}` : "";
    const url = `/AutomationDashboard/MissingDetails/registered-property-data${query}`;

    const response = await apiClient.get<MissingRegisteredPropertyResponse>(url, { cache: "no-store" });
    const t = await getTranslations("automationDashboard");

    const responseData = handleApiResponse(response, t("errors.fetchMissingRegisteredProperty"));
    return responseData.items?.[0] ?? null;
}

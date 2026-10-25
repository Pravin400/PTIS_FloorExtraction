import { apiClient } from "@/services/api.service";
import { handleApiResponse } from "@/lib/utils/api";
import { getTranslations } from "next-intl/server";
import {
    MissingMobileNoItem,
    MissingMobileNoResponse
} from "@/types/automation-dashboard/missing-data-analysis/mobile-no/missing-mobile-no.type";

export async function automationGetMissingMobileNo(
    zoneNo?: string | null
): Promise<MissingMobileNoItem | null> {
    const params = new URLSearchParams();
    if (zoneNo) {
        params.append("zoneNo", zoneNo);
    }

    const query = params.toString() ? `?${params.toString()}` : "";
    const url = `/AutomationDashboard/MissingDetails/mobile-no${query}`;

    const response = await apiClient.get<MissingMobileNoResponse>(url, { cache: "no-store" });
    const t = await getTranslations("automationDashboard");

    const responseData = handleApiResponse(response, t("errors.fetchMissingMobileNo") || "Failed to fetch missing mobile number data");
    return responseData.items?.[0] ?? null;
}

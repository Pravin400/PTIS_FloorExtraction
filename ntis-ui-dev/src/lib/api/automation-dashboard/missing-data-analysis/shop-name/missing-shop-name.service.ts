import { apiClient } from "@/services/api.service";
import { handleApiResponse } from "@/lib/utils/api";
import { getTranslations } from "next-intl/server";
import {
    MissingShopNameItem,
    MissingShopNameResponse
} from "@/types/automation-dashboard/missing-data-analysis/shop-name/missing-shop-name";

export async function automationGetMissingShopName(
    zoneNo?: string | null
): Promise<MissingShopNameItem | null> {
    const params = new URLSearchParams();
    if (zoneNo) {
        params.append("zoneNo", zoneNo);
    }

    const query = params.toString() ? `?${params.toString()}` : "";
    const url = `/AutomationDashboard/MissingDetails/shopname${query}`;

    const response = await apiClient.get<MissingShopNameResponse>(url, { cache: "no-store" });
    const t = await getTranslations("automationDashboard");

    const responseData = handleApiResponse(response, t("errors.fetchMissingShopName"));
    return responseData.items?.[0] ?? null;
}

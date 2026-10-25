import { apiClient } from "@/services/api.service";
import { handleApiResponse } from "@/lib/utils/api";
import { getTranslations } from "next-intl/server";
import {
    MissingAddressItem,
    MissingAddressResponse
} from "@/types/automation-dashboard/missing-data-analysis/address/missing-address.type";

export async function automationGetMissingAddress(
    zoneNo?: string | null
): Promise<MissingAddressItem | null> {
    const params = new URLSearchParams();
    if (zoneNo) {
        params.append("zoneNo", zoneNo);
    }

    const query = params.toString() ? `?${params.toString()}` : "";
    const url = `/AutomationDashboard/MissingDetails/address${query}`;

    const response = await apiClient.get<MissingAddressResponse>(url, { cache: "no-store" });
    const t = await getTranslations("automationDashboard");

    const responseData = handleApiResponse(response, t("errors.fetchMissingAddress") || "Failed to fetch missing address data");
    return responseData.items?.[0] ?? null;
}

'use server';

import { automationGetMissingShopName } from "@/lib/api/automation-dashboard/missing-data-analysis/shop-name/missing-shop-name.service";
import { MissingShopNameItem } from "@/types/automation-dashboard/missing-data-analysis/shop-name/missing-shop-name";
import { createLogger } from "@/lib/utils/server-logger";
import { ApiError } from "@/lib/utils/api";
import { getTranslations } from "next-intl/server";

const logger = createLogger("MissingShopNameActions");

type ActionResult<T> = {
    success: boolean;
    data?: T | null;
    error?: string;
    statusCode?: number;
};

/**
 * Server action to fetch the missing shop name analysis data.
 * 
 * @param zoneNo Optional zone number to filter by.
 * @returns An object containing success status, data, and optional error message.
 */
export async function getMissingShopNameAction(
    zoneNo?: string | null
): Promise<ActionResult<MissingShopNameItem>> {
    try {
        logger.info("getMissingShopNameAction: Fetching missing shop name data", { zoneNo });
        const data = await automationGetMissingShopName(zoneNo);
        return { success: true, data };
    } catch (error) {
        logger.error("Failed to fetch missing shop name data", { zoneNo }, error);
        if (error instanceof ApiError) {
            return { success: false, error: error.message, statusCode: error.statusCode };
        }
        const t = await getTranslations("automationDashboard");
        return { success: false, error: t("errors.fetchMissingShopName"), statusCode: 500 };
    }
}

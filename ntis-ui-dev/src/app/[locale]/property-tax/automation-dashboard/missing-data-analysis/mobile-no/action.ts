'use server';

import { automationGetMissingMobileNo } from "@/lib/api/automation-dashboard/missing-data-analysis/mobile-no/missing-mobile-no.service";
import { MissingMobileNoItem } from "@/types/automation-dashboard/missing-data-analysis/mobile-no/missing-mobile-no.type";
import { createLogger } from "@/lib/utils/server-logger";
import { ApiError } from "@/lib/utils/api";
import { getTranslations } from "next-intl/server";

const logger = createLogger("MissingMobileNoActions");

type ActionResult<T> = {
    success: boolean;
    data?: T | null;
    error?: string;
    statusCode?: number;
};

/**
 * Server action to fetch the missing mobile number analysis data.
 * 
 * @param zoneNo Optional zone number to filter by.
 * @returns An object containing success status, data, and optional error message.
 */
export async function getMissingMobileNoAction(
    zoneNo?: string | null
): Promise<ActionResult<MissingMobileNoItem>> {
    try {
        logger.info("getMissingMobileNoAction: Fetching missing mobile number data", { zoneNo });
        const data = await automationGetMissingMobileNo(zoneNo);
        return { success: true, data };
    } catch (error) {
        logger.error("Failed to fetch missing mobile number data", { zoneNo }, error);
        if (error instanceof ApiError) {
            return { success: false, error: error.message, statusCode: error.statusCode };
        }
        const t = await getTranslations("automationDashboard");
        return { success: false, error: t("errors.fetchMissingMobileNo"), statusCode: 500 };
    }
}

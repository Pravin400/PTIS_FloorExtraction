'use server';

import { automationGetMissingOwnerName } from "@/lib/api/automation-dashboard/missing-data-analysis/owner-name/missing-owner-name.service";
import { MissingOwnerNameItem } from "@/types/automation-dashboard/missing-data-analysis/owner-name/missing-owner-name.type";
import { createLogger } from "@/lib/utils/server-logger";
import { ApiError } from "@/lib/utils/api";
import { getTranslations } from "next-intl/server";

const logger = createLogger("MissingOwnerNameActions");

type ActionResult<T> = {
    success: boolean;
    data?: T | null;
    error?: string;
    statusCode?: number;
};

/**
 * Server action to fetch the missing owner name analysis data.
 * 
 * @param zoneNo Optional zone number to filter by.
 * @returns An object containing success status, data, and optional error message.
 */
export async function getMissingOwnerNameAction(
    zoneNo?: string | null
): Promise<ActionResult<MissingOwnerNameItem>> {
    try {
        logger.info("getMissingOwnerNameAction: Fetching missing owner name data", { zoneNo });
        const data = await automationGetMissingOwnerName(zoneNo);
        return { success: true, data };
    } catch (error) {
        logger.error("Failed to fetch missing owner name data", { zoneNo }, error);
        if (error instanceof ApiError) {
            return { success: false, error: error.message, statusCode: error.statusCode };
        }
        const t = await getTranslations("automationDashboard");
        return { success: false, error: t("errors.fetchMissingOwnerName"), statusCode: 500 };
    }
}

'use server';

import { automationGetMissingRegisteredProperty } from "@/lib/api/automation-dashboard/missing-data-analysis/registered-property/missing-registered-property.service";
import { MissingRegisteredPropertyItem } from "@/types/automation-dashboard/missing-data-analysis/registered-property/missing-registered-property.type";
import { createLogger } from "@/lib/utils/server-logger";
import { ApiError } from "@/lib/utils/api";
import { getTranslations } from "next-intl/server";

const logger = createLogger("MissingRegisteredPropertyActions");

type ActionResult<T> = {
    success: boolean;
    data?: T | null;
    error?: string;
    statusCode?: number;
};

/**
 * Server action to fetch the missing registered property analysis data.
 * 
 * @param zoneNo Optional zone number to filter by.
 * @returns An object containing success status, data, and optional error message.
 */
export async function getMissingRegisteredPropertyAction(
    zoneNo?: string | null
): Promise<ActionResult<MissingRegisteredPropertyItem>> {
    try {
        logger.info("getMissingRegisteredPropertyAction: Fetching missing registered property data", { zoneNo });
        const data = await automationGetMissingRegisteredProperty(zoneNo);
        return { success: true, data };
    } catch (error) {
        logger.error("Failed to fetch missing registered property data", { zoneNo }, error);
        if (error instanceof ApiError) {
            return { success: false, error: error.message, statusCode: error.statusCode };
        }
        const t = await getTranslations("automationDashboard");
        return { success: false, error: t("errors.fetchMissingRegisteredProperty"), statusCode: 500 };
    }
}

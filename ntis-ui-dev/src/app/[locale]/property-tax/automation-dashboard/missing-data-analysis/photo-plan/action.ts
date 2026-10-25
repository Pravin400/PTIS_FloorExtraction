'use server';

import { automationGetMissingPhotoPlan } from "@/lib/api/automation-dashboard/missing-data-analysis/photo-plan/missing-photo-plan.service";
import { MissingPhotoPlanItem } from "@/types/automation-dashboard/missing-data-analysis/photo-plan/missing-photo-plan.type";
import { createLogger } from "@/lib/utils/server-logger";
import { ApiError } from "@/lib/utils/api";
import { getTranslations } from "next-intl/server";

const logger = createLogger("MissingPhotoPlanActions");

type ActionResult<T> = {
    success: boolean;
    data?: T | null;
    error?: string;
    statusCode?: number;
};

/**
 * Server action to fetch the missing photo plan analysis data.
 * 
 * @param zoneNo Optional zone number to filter by.
 * @returns An object containing success status, data, and optional error message.
 */
export async function getMissingPhotoPlanAction(
    zoneNo?: string | null
): Promise<ActionResult<MissingPhotoPlanItem>> {
    try {
        logger.info("getMissingPhotoPlanAction: Fetching missing photo plan data", { zoneNo });
        const data = await automationGetMissingPhotoPlan(zoneNo);
        return { success: true, data };
    } catch (error) {
        logger.error("Failed to fetch missing photo plan data", { zoneNo }, error);
        if (error instanceof ApiError) {
            return { success: false, error: error.message, statusCode: error.statusCode };
        }
        const t = await getTranslations("automationDashboard");
        return { success: false, error: t("errors.fetchMissingPhotoPlan") || "Failed to fetch missing photo plan data", statusCode: 500 };
    }
}
